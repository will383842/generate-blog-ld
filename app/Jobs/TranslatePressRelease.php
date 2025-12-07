<?php

namespace App\Jobs;

use App\Models\PressRelease;
use App\Models\PressReleaseTranslation;
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
 * Job de traduction d'un communiqué de presse
 *
 * Traduit tous les champs du communiqué :
 * - title (headline)
 * - lead
 * - body
 * - quote
 * - boilerplate
 * - meta_title (< 60 chars)
 * - meta_description (< 160 chars)
 * - slug (translittéré)
 */
class TranslatePressRelease implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $pressReleaseId;
    protected string $targetLanguage;

    public int $tries = 3;
    public int $timeout = 180; // 3 minutes

    public function backoff(): array
    {
        return [30, 60, 120];
    }

    public function __construct(int $pressReleaseId, string $targetLanguage)
    {
        $this->pressReleaseId = $pressReleaseId;
        $this->targetLanguage = $targetLanguage;
        $this->onQueue('translation');
    }

    public function handle(GptService $gptService, CostTracker $costTracker): void
    {
        $pressRelease = PressRelease::find($this->pressReleaseId);

        if (!$pressRelease) {
            Log::warning('TranslatePressRelease: Communiqué non trouvé', [
                'press_release_id' => $this->pressReleaseId,
            ]);
            return;
        }

        $targetLanguage = Language::where('code', $this->targetLanguage)
            ->where('is_active', true)
            ->first();

        if (!$targetLanguage) {
            Log::warning('TranslatePressRelease: Langue cible invalide', [
                'target_language' => $this->targetLanguage,
            ]);
            return;
        }

        // Vérifier si traduction existe déjà
        $existingTranslation = PressReleaseTranslation::where('press_release_id', $this->pressReleaseId)
            ->where('language_id', $targetLanguage->id)
            ->first();

        if ($existingTranslation) {
            Log::info('TranslatePressRelease: Traduction existante', [
                'press_release_id' => $this->pressReleaseId,
                'language' => $this->targetLanguage,
            ]);
            return;
        }

        Log::info('TranslatePressRelease: Début traduction', [
            'press_release_id' => $this->pressReleaseId,
            'target_language' => $this->targetLanguage,
        ]);

        $costTracker->startSession();

        try {
            // Traduire les champs
            $translatedTitle = $this->translateText($gptService, $pressRelease->title, 'headline');
            $translatedLead = $this->translateText($gptService, $pressRelease->lead ?? '', 'lead');
            $translatedBody = $this->translateText($gptService, $pressRelease->body ?? '', 'body');
            $translatedQuote = $this->translateText($gptService, $pressRelease->quote ?? '', 'quote');
            $translatedBoilerplate = $this->translateText($gptService, $pressRelease->boilerplate ?? '', 'boilerplate');

            // Générer meta SEO optimisés
            $seoService = app(SeoOptimizationService::class);

            $metaTitle = $seoService->generateMetaTitle(
                $translatedTitle,
                'press_release',
                $this->targetLanguage,
                ['platform' => $pressRelease->platform?->name ?? 'SOS-Expat', 'year' => date('Y')]
            );

            $metaDescription = $seoService->generateMetaDescription(
                $translatedTitle,
                'press_release',
                $this->targetLanguage,
                ['platform' => $pressRelease->platform?->name ?? 'SOS-Expat', 'year' => date('Y')]
            );

            // Générer slug
            $slug = Str::slug($translatedTitle);

            // Créer la traduction
            PressReleaseTranslation::create([
                'press_release_id' => $this->pressReleaseId,
                'language_id' => $targetLanguage->id,
                'title' => $translatedTitle,
                'lead' => $translatedLead,
                'body' => $translatedBody,
                'quote' => $translatedQuote,
                'boilerplate' => $translatedBoilerplate,
                'meta_title' => $metaTitle,
                'meta_description' => $metaDescription,
                'slug' => $slug,
                'status' => 'active',
                'translation_cost' => $costTracker->getSessionCost(),
            ]);

            Log::info('TranslatePressRelease: Traduction terminée', [
                'press_release_id' => $this->pressReleaseId,
                'target_language' => $this->targetLanguage,
                'cost' => $costTracker->getSessionCost(),
            ]);

        } catch (\Exception $e) {
            Log::error('TranslatePressRelease: Erreur traduction', [
                'press_release_id' => $this->pressReleaseId,
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

        $prompt = "Traduis ce texte de communiqué de presse ({$context}) en {$targetLangName}.
Garde le ton professionnel et journalistique.
Réponds UNIQUEMENT avec la traduction, sans guillemets ni commentaire.

Texte à traduire:
{$text}";

        $response = $gptService->chat([
            'model' => GptService::MODEL_GPT4O_MINI,
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un traducteur professionnel spécialisé en relations presse.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
            'max_tokens' => 2000,
        ]);

        return trim($response['content']);
    }

    public function tags(): array
    {
        return [
            'translation',
            'press-release',
            'press_release:' . $this->pressReleaseId,
            'lang:' . $this->targetLanguage,
        ];
    }
}
