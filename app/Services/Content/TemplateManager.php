<?php

namespace App\Services\Content;

use App\Models\ContentTemplate;
use App\Models\ContentTemplateVersion;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * TemplateManager - Service centralisé pour la gestion des templates
 * 
 * Responsabilités :
 * - Récupération des templates avec cache
 * - Construction des prompts avec variables
 * - Gestion des versions
 * - Import/Export de templates
 */
class TemplateManager
{
    // Durée du cache en secondes (1 heure)
    const CACHE_TTL = 3600;

    // ═══════════════════════════════════════════════════════════════════════════
    // RÉCUPÉRATION DES TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Récupérer le template approprié pour une génération
     */
    public function getTemplate(string $type, string $languageCode, ?string $templateSlug = null): ?ContentTemplate
    {
        // Si un slug spécifique est demandé
        if ($templateSlug) {
            return $this->getBySlug($templateSlug);
        }

        // Sinon, récupérer le template par défaut
        return $this->getDefaultTemplate($type, $languageCode);
    }

    /**
     * Récupérer le template par défaut pour un type et une langue
     */
    public function getDefaultTemplate(string $type, string $languageCode): ?ContentTemplate
    {
        $cacheKey = "template.default.{$type}.{$languageCode}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($type, $languageCode) {
            $template = ContentTemplate::getDefault($type, $languageCode);
            
            // Fallback sur le français si pas de template pour cette langue
            if (!$template && $languageCode !== 'fr') {
                $template = ContentTemplate::getDefault($type, 'fr');
                
                if ($template) {
                    Log::info("TemplateManager: Fallback vers FR pour {$type}/{$languageCode}");
                }
            }
            
            return $template;
        });
    }

    /**
     * Récupérer un template par son slug
     */
    public function getBySlug(string $slug): ?ContentTemplate
    {
        $cacheKey = "template.slug.{$slug}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($slug) {
            return ContentTemplate::where('slug', $slug)->active()->first();
        });
    }

    /**
     * Récupérer tous les templates pour un type
     */
    public function getTemplatesForType(string $type): Collection
    {
        return ContentTemplate::active()
            ->ofType($type)
            ->orderBy('language_code')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();
    }

    /**
     * Récupérer tous les templates groupés par type et langue
     */
    public function getAllGrouped(): array
    {
        $templates = ContentTemplate::active()
            ->orderBy('category')
            ->orderBy('type')
            ->orderBy('language_code')
            ->get();

        return $templates->groupBy(['category', 'type', 'language_code'])->toArray();
    }

    /**
     * Récupérer les templates disponibles pour une langue
     */
    public function getAvailableForLanguage(string $languageCode): Collection
    {
        return ContentTemplate::active()
            ->forLanguage($languageCode)
            ->orderBy('category')
            ->orderBy('type')
            ->get();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTION DES PROMPTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Construire le prompt complet pour une génération
     */
    public function buildPrompt(ContentTemplate $template, array $variables): array
    {
        // Valider les variables
        $missing = $template->validateVariables($variables);
        if (!empty($missing)) {
            throw new \InvalidArgumentException(
                "Variables manquantes pour le template: " . implode(', ', $missing)
            );
        }

        // Construire le prompt utilisateur avec les variables
        $userPrompt = $template->buildUserPrompt($variables);

        // Incrémenter le compteur d'utilisation
        $template->incrementUsage();

        return [
            'system_prompt' => $template->system_prompt,
            'user_prompt' => $userPrompt,
            'config' => $template->getGenerationConfig(),
        ];
    }

    /**
     * Prévisualiser un prompt avec des données de test
     */
    public function previewPrompt(ContentTemplate $template, array $testData = []): array
    {
        // Données de test par défaut
        $defaultTestData = [
            'title' => 'Exemple de titre pour prévisualisation',
            'country' => 'Thaïlande',
            'country_name' => 'Thaïlande',
            'country_in' => 'en Thaïlande',
            'theme' => 'Fiscalité',
            'theme_name' => 'Fiscalité',
            'theme_lower' => 'fiscalité',
            'service' => 'Comptabilité',
            'service_name' => 'Comptabilité',
            'provider_type' => 'Avocat',
            'specialty' => 'Droit fiscal',
            'word_count' => '1500',
            'min_words' => '1200',
            'max_words' => '1800',
            'platform_name' => 'SOS-Expat',
            'year' => date('Y'),
        ];

        $variables = array_merge($defaultTestData, $testData);

        return [
            'system_prompt' => $template->system_prompt,
            'user_prompt' => $template->buildUserPrompt($variables),
            'variables_used' => $variables,
            'variables_required' => $template->getRequiredVariables(),
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GESTION DES TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Créer un nouveau template
     */
    public function create(array $data, ?int $userId = null): ContentTemplate
    {
        $data['uuid'] = Str::uuid();
        $data['created_by'] = $userId;
        $data['updated_by'] = $userId;

        // Générer le slug si non fourni
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['type'] . '-' . $data['name'] . '-' . $data['language_code']);
        }

        // Déterminer la catégorie si non fournie
        if (empty($data['category'])) {
            $data['category'] = in_array($data['type'], [ContentTemplate::TYPE_PRESS_RELEASE, ContentTemplate::TYPE_DOSSIER])
                ? ContentTemplate::CATEGORY_PRESS
                : ContentTemplate::CATEGORY_CONTENT;
        }

        // Déterminer le format de sortie si non fourni
        if (empty($data['output_format'])) {
            $data['output_format'] = $data['category'] === ContentTemplate::CATEGORY_PRESS
                ? ContentTemplate::OUTPUT_PDF
                : ContentTemplate::OUTPUT_HTML;
        }

        $template = ContentTemplate::create($data);

        // Vider le cache
        $this->clearCache($template->type, $template->language_code);

        Log::info("TemplateManager: Template créé", [
            'id' => $template->id,
            'slug' => $template->slug,
        ]);

        return $template;
    }

    /**
     * Mettre à jour un template avec versioning
     */
    public function update(ContentTemplate $template, array $data, ?int $userId = null, ?string $changeNote = null): ContentTemplate
    {
        // Créer une version avant modification
        $template->createVersion($changeNote ?? 'Modification', $userId);

        // Mettre à jour
        $data['updated_by'] = $userId;
        $data['version'] = $template->version + 1;

        $template->update($data);

        // Vider le cache
        $this->clearCache($template->type, $template->language_code);

        Log::info("TemplateManager: Template mis à jour", [
            'id' => $template->id,
            'version' => $template->version,
        ]);

        return $template->fresh();
    }

    /**
     * Dupliquer un template
     */
    public function duplicate(ContentTemplate $template, ?string $newName = null, ?string $targetLanguage = null): ContentTemplate
    {
        $newTemplate = $template->replicate();
        $newTemplate->uuid = Str::uuid();
        $newTemplate->name = $newName ?? $template->name . ' (copie)';
        $newTemplate->language_code = $targetLanguage ?? $template->language_code;
        $newTemplate->slug = Str::slug($newTemplate->type . '-' . $newTemplate->name . '-' . $newTemplate->language_code);
        $newTemplate->is_default = false;
        $newTemplate->usage_count = 0;
        $newTemplate->version = 1;
        $newTemplate->save();

        Log::info("TemplateManager: Template dupliqué", [
            'source_id' => $template->id,
            'new_id' => $newTemplate->id,
        ]);

        return $newTemplate;
    }

    /**
     * Définir un template comme défaut
     */
    public function setAsDefault(ContentTemplate $template): ContentTemplate
    {
        $template->update(['is_default' => true]);
        
        // Vider le cache
        $this->clearCache($template->type, $template->language_code);

        return $template;
    }

    /**
     * Restaurer une version précédente
     */
    public function restoreVersion(ContentTemplate $template, int $versionNumber, ?int $userId = null): ContentTemplate
    {
        $version = $template->versions()->where('version', $versionNumber)->firstOrFail();

        // Créer une version de l'état actuel
        $template->createVersion("Avant restauration vers v{$versionNumber}", $userId);

        // Restaurer
        $template->update([
            'system_prompt' => $version->system_prompt,
            'user_prompt' => $version->user_prompt,
            'structure' => $version->structure,
            'variables' => $version->variables,
            'version' => $template->version + 1,
            'updated_by' => $userId,
        ]);

        // Vider le cache
        $this->clearCache($template->type, $template->language_code);

        Log::info("TemplateManager: Version restaurée", [
            'template_id' => $template->id,
            'restored_version' => $versionNumber,
        ]);

        return $template->fresh();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPORT / EXPORT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Exporter un template en JSON
     */
    public function export(ContentTemplate $template): array
    {
        return [
            'type' => $template->type,
            'category' => $template->category,
            'name' => $template->name,
            'description' => $template->description,
            'language_code' => $template->language_code,
            'output_format' => $template->output_format,
            'system_prompt' => $template->system_prompt,
            'user_prompt' => $template->user_prompt,
            'structure' => $template->structure,
            'variables' => $template->variables,
            'model' => $template->model,
            'max_tokens' => $template->max_tokens,
            'temperature' => $template->temperature,
            'word_count_min' => $template->word_count_min,
            'word_count_target' => $template->word_count_target,
            'word_count_max' => $template->word_count_max,
            'faq_count' => $template->faq_count,
            'exported_at' => now()->toIso8601String(),
            'version' => $template->version,
        ];
    }

    /**
     * Importer un template depuis JSON
     */
    public function import(array $data, ?int $userId = null): ContentTemplate
    {
        unset($data['exported_at'], $data['version']);
        
        $data['uuid'] = Str::uuid();
        $data['slug'] = Str::slug($data['type'] . '-' . $data['name'] . '-' . $data['language_code'] . '-' . time());
        $data['is_default'] = false;
        $data['is_active'] = true;
        $data['created_by'] = $userId;
        $data['updated_by'] = $userId;

        return ContentTemplate::create($data);
    }

    /**
     * Exporter tous les templates pour un type
     */
    public function exportAll(string $type): array
    {
        $templates = ContentTemplate::ofType($type)->get();
        
        return $templates->map(fn($t) => $this->export($t))->toArray();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CACHE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Vider le cache pour un template
     */
    public function clearCache(string $type, string $languageCode): void
    {
        Cache::forget("template.default.{$type}.{$languageCode}");
        Cache::forget("template.default.{$type}.fr"); // Fallback
    }

    /**
     * Vider tout le cache des templates
     */
    public function clearAllCache(): void
    {
        $types = [
            ContentTemplate::TYPE_ARTICLE,
            ContentTemplate::TYPE_PILLAR,
            ContentTemplate::TYPE_LANDING,
            ContentTemplate::TYPE_COMPARATIVE,
            ContentTemplate::TYPE_PRESS_RELEASE,
            ContentTemplate::TYPE_DOSSIER,
        ];

        $languages = array_keys(ContentTemplate::LANGUAGES);

        foreach ($types as $type) {
            foreach ($languages as $lang) {
                Cache::forget("template.default.{$type}.{$lang}");
            }
        }

        Log::info("TemplateManager: Cache vidé");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STATISTIQUES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Obtenir les statistiques des templates
     */
    public function getStats(): array
    {
        return [
            'total' => ContentTemplate::count(),
            'active' => ContentTemplate::active()->count(),
            'by_category' => ContentTemplate::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray(),
            'by_type' => ContentTemplate::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
            'by_language' => ContentTemplate::selectRaw('language_code, COUNT(*) as count')
                ->groupBy('language_code')
                ->pluck('count', 'language_code')
                ->toArray(),
            'most_used' => ContentTemplate::orderBy('usage_count', 'desc')
                ->take(10)
                ->get(['id', 'name', 'type', 'language_code', 'usage_count'])
                ->toArray(),
        ];
    }

    /**
     * Vérifier la couverture des langues pour un type
     */
    public function checkLanguageCoverage(string $type): array
    {
        $allLanguages = array_keys(ContentTemplate::LANGUAGES);
        $coveredLanguages = ContentTemplate::ofType($type)
            ->active()
            ->default()
            ->pluck('language_code')
            ->toArray();

        $missing = array_diff($allLanguages, $coveredLanguages);

        return [
            'type' => $type,
            'total_languages' => count($allLanguages),
            'covered' => count($coveredLanguages),
            'missing' => $missing,
            'coverage_percent' => round((count($coveredLanguages) / count($allLanguages)) * 100, 1),
        ];
    }
}
