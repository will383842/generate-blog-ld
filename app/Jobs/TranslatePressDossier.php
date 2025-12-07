<?php

namespace App\Jobs;

use App\Models\PressDossier;
use App\Models\PressDossierTranslation;
use App\Models\DossierSectionTranslation;
use App\Models\Language;
use App\Services\AI\GptService;
use App\Services\AI\CostTracker;
use App\Services\Seo\SeoOptimizationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Job de traduction d'un dossier de presse
 *
 * Traduit tous les champs du dossier :
 * - title
 * - subtitle
 * - executive_summary
 * - Toutes les sections (title + content)
 * - meta_title (< 60 chars)
 * - meta_description (< 160 chars)
 * - slug (translittéré)
 */
class TranslatePressDossier implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $dossierId;
    protected string $targetLanguage;

    public int $tries = 3;
    public int $timeout = 600; // 10 minutes (dossiers plus longs)

    public function backoff(): array
    {
        return [60, 180, 300];
    }

    public function __construct(int $dossierId, string $targetLanguage)
    {
        $this->dossierId = $dossierId;
        $this->targetLanguage = $targetLanguage;
        $this->onQueue('translation');
    }

    public function handle(GptService $gptService, CostTracker $costTracker): void
    {
        $dossier = PressDossier::with('sections')->find($this->dossierId);

        if (!$dossier) {
            Log::warning('TranslatePressDossier: Dossier non trouvé', [
                'dossier_id' => $this->dossierId,
            ]);
            return;
        }

        $targetLanguage = Language::where('code', $this->targetLanguage)
            ->where('is_active', true)
            ->first();

        if (!$targetLanguage) {
            Log::warning('TranslatePressDossier: Langue cible invalide', [
                'target_language' => $this->targetLanguage,
            ]);
            return;
        }

        // Vérifier si traduction existe déjà
        $existingTranslation = PressDossierTranslation::where('dossier_id', $this->dossierId)
            ->where('language_id', $targetLanguage->id)
            ->first();

        if ($existingTranslation) {
            Log::info('TranslatePressDossier: Traduction existante', [
                'dossier_id' => $this->dossierId,
                'language' => $this->targetLanguage,
            ]);
            return;
        }

        Log::info('TranslatePressDossier: Début traduction', [
            'dossier_id' => $this->dossierId,
            'target_language' => $this->targetLanguage,
            'sections_count' => $dossier->sections->count(),
        ]);

        $costTracker->startSession();

        try {
            // Traduire les champs principaux
            $translatedTitle = $this->translateText($gptService, $dossier->title, 'title');
            $translatedSubtitle = $this->translateText($gptService, $dossier->subtitle ?? '', 'subtitle');
            $translatedSummary = $this->translateText($gptService, $dossier->executive_summary ?? '', 'executive_summary');

            // Générer meta SEO optimisés
            $seoService = app(SeoOptimizationService::class);

            $metaTitle = $seoService->generateMetaTitle(
                $translatedTitle,
                'press_dossier',
                $this->targetLanguage,
                ['platform' => $dossier->platform?->name ?? 'SOS-Expat', 'year' => date('Y')]
            );

            $metaDescription = $seoService->generateMetaDescription(
                $translatedTitle,
                'press_dossier',
                $this->targetLanguage,
                ['platform' => $dossier->platform?->name ?? 'SOS-Expat', 'year' => date('Y')]
            );

            // Générer slug
            $slug = Str::slug($translatedTitle);

            // Créer la traduction principale
            $translation = PressDossierTranslation::create([
                'dossier_id' => $this->dossierId,
                'language_id' => $targetLanguage->id,
                'title' => $translatedTitle,
                'subtitle' => $translatedSubtitle,
                'executive_summary' => $translatedSummary,
                'meta_title' => $metaTitle,
                'meta_description' => $metaDescription,
                'slug' => $slug,
                'status' => 'active',
                'translation_cost' => 0, // Sera mis à jour à la fin
            ]);

            // Traduire chaque section
            foreach ($dossier->sections as $section) {
                $translatedSectionTitle = $this->translateText($gptService, $section->title, 'section_title');
                $translatedSectionContent = $this->translateText($gptService, $section->content ?? '', 'section_content');

                DossierSectionTranslation::create([
                    'section_id' => $section->id,
                    'dossier_translation_id' => $translation->id,
                    'language_id' => $targetLanguage->id,
                    'title' => $translatedSectionTitle,
                    'content' => $translatedSectionContent,
                ]);

                // Rate limiting entre sections
                usleep(500000); // 0.5 seconde
            }

            // Mettre à jour le coût total
            $translation->update([
                'translation_cost' => $costTracker->getSessionCost(),
            ]);

            Log::info('TranslatePressDossier: Traduction terminée', [
                'dossier_id' => $this->dossierId,
                'target_language' => $this->targetLanguage,
                'sections_translated' => $dossier->sections->count(),
                'cost' => $costTracker->getSessionCost(),
            ]);

        } catch (\Exception $e) {
            Log::error('TranslatePressDossier: Erreur traduction', [
                'dossier_id' => $this->dossierId,
                'target_language' => $this->targetLanguage,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    protected function translateText(GptService $gptService, string $text, string $context): string
    {
        if (empty(trim($text))) {
            return '';
        }

        $langNames = [
            'fr' => 'français', 'en' => 'anglais', 'de' => 'allemand',
            'es' => 'espagnol', 'pt' => 'portugais', 'ru' => 'russe',
            'zh' => 'chinois', 'ar' => 'arabe', 'hi' => 'hindi',
        ];

        $targetLangName = $langNames[$this->targetLanguage] ?? $this->targetLanguage;

        $prompt = "Traduis ce texte de dossier de presse ({$context}) en {$targetLangName}.
Garde le ton professionnel et institutionnel.
Réponds UNIQUEMENT avec la traduction, sans guillemets ni commentaire.

Texte à traduire:
{$text}";

        $response = $gptService->chat([
            'model' => GptService::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un traducteur professionnel spécialisé en communication institutionnelle.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
            'max_tokens' => 3000,
        ]);

        return trim($response['content']);
    }

    public function tags(): array
    {
        return [
            'translation',
            'press-dossier',
            'dossier:' . $this->dossierId,
            'lang:' . $this->targetLanguage,
        ];
    }
}
