<?php

namespace App\Services\Content;

use App\Models\Program;
use App\Models\ProgramRun;
use App\Models\ProgramItem;
use App\Models\Country;
use App\Models\Language;
use App\Models\Theme;
use App\Models\ManualTitle;
use App\Jobs\ProcessProgram;
use App\Jobs\ProcessProgramBatch;
use App\Services\Press\PressReleaseGenerator;
use App\Services\Press\PressDossierGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * ProgramService - Orchestration de la génération automatisée
 * 
 * Gère TOUS les types de contenus:
 * - article: Articles SEO standards (ArticleGenerator - language_code)
 * - pillar: Articles piliers (PillarArticleGenerator - language_id)
 * - comparative: Articles comparatifs (ComparativeGenerator - language_code)
 * - landing: Landing pages (LandingGenerator - language_id + service)
 * - manual: Articles depuis titres manuels (ManualGenerationService)
 * - press_release: Communiqués de presse (PressReleaseGenerator - language_code)
 * - dossier: Dossiers de presse (PressDossierGenerator - language_code + title)
 * - knowledge: Articles knowledge base (ArticleGenerator - language_code)
 */
class ProgramService
{
    public function __construct(
        protected ArticleGenerator $articleGenerator,
        protected PillarArticleGenerator $pillarGenerator,
        protected ComparativeGenerator $comparativeGenerator,
        protected LandingGenerator $landingGenerator,
        protected ManualGenerationService $manualGenerator,
        protected PressReleaseGenerator $pressReleaseGenerator,
        protected PressDossierGenerator $pressDossierGenerator
    ) {}

    /**
     * Dispatcher l'exécution d'un programme
     */
    public function dispatch(Program $program): ProgramRun
    {
        $run = ProgramRun::create([
            'program_id' => $program->id,
            'started_at' => now(),
            'status' => 'running',
        ]);

        $itemsCount = $this->createProgramItems($program, $run);
        $run->update(['items_planned' => $itemsCount]);

        Log::info("ProgramService: Program dispatched", [
            'program_id' => $program->id,
            'run_id' => $run->id,
            'items_planned' => $itemsCount,
        ]);

        ProcessProgram::dispatch($program, $run);

        return $run;
    }

    /**
     * Créer les items à générer selon la configuration du programme
     */
    protected function createProgramItems(Program $program, ProgramRun $run): int
    {
        $items = [];
        $contentTypes = $program->content_types;
        $countries = $program->getCountriesModels();
        $languages = $program->getLanguagesModels();
        $options = $program->merged_options;

        foreach ($contentTypes as $contentType) {
            $items = array_merge(
                $items,
                $this->createItemsForContentType($program, $run, $contentType, $countries, $languages, $options)
            );
        }

        if (!empty($items)) {
            DB::table('program_items')->insert($items);
        }

        return count($items);
    }

    /**
     * Créer les items pour un type de contenu spécifique
     */
    protected function createItemsForContentType(
        Program $program,
        ProgramRun $run,
        string $contentType,
        Collection $countries,
        Collection $languages,
        array $options
    ): array {
        $items = [];
        $themes = $this->getThematicsForContentType($program, $contentType);
        
        switch ($program->quantity_mode) {
            case 'total':
                for ($i = 0; $i < $program->quantity_value; $i++) {
                    $country = $countries->random();
                    $language = $languages->random();
                    $theme = $themes->isNotEmpty() ? $themes->random() : null;
                    $items[] = $this->buildItemData($program, $run, $contentType, $country, $language, $theme, $options);
                }
                break;
                
            case 'per_country':
                foreach ($countries as $country) {
                    for ($i = 0; $i < $program->quantity_value; $i++) {
                        $language = $languages->random();
                        $theme = $themes->isNotEmpty() ? $themes->random() : null;
                        $items[] = $this->buildItemData($program, $run, $contentType, $country, $language, $theme, $options);
                    }
                }
                break;
                
            case 'per_language':
                foreach ($languages as $language) {
                    for ($i = 0; $i < $program->quantity_value; $i++) {
                        $country = $countries->random();
                        $theme = $themes->isNotEmpty() ? $themes->random() : null;
                        $items[] = $this->buildItemData($program, $run, $contentType, $country, $language, $theme, $options);
                    }
                }
                break;
                
            case 'per_country_language':
                foreach ($countries as $country) {
                    foreach ($languages as $language) {
                        for ($i = 0; $i < $program->quantity_value; $i++) {
                            $theme = $themes->isNotEmpty() ? $themes->random() : null;
                            $items[] = $this->buildItemData($program, $run, $contentType, $country, $language, $theme, $options);
                        }
                    }
                }
                break;
        }

        return $items;
    }

    protected function getThematicsForContentType(Program $program, string $contentType): Collection
    {
        if ($contentType === 'landing') {
            $providerTypes = $program->getProviderTypesModels();
            if ($providerTypes->isNotEmpty()) {
                return $providerTypes;
            }
            $lawyerSpecialties = $program->getLawyerSpecialtiesModels();
            if ($lawyerSpecialties->isNotEmpty()) {
                return $lawyerSpecialties;
            }
        }
        return $program->getThemesModels();
    }

    protected function buildItemData(
        Program $program,
        ProgramRun $run,
        string $contentType,
        $country,
        $language,
        $thematic,
        array $options
    ): array {
        $thematicType = null;
        $thematicId = null;
        $themeId = null;

        if ($thematic) {
            $thematicType = $this->getThematicType($thematic);
            $thematicId = $thematic->id;
            if ($thematic instanceof \App\Models\Theme) {
                $themeId = $thematic->id;
            }
        }

        return [
            'program_id' => $program->id,
            'program_run_id' => $run->id,
            'country_id' => $country->id,
            'language_id' => $language->id,
            'theme_id' => $themeId,
            'thematic_id' => $thematicId,
            'thematic_type' => $thematicType,
            'generation_type' => $contentType,
            'status' => 'pending',
            'generation_params' => json_encode($options),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    protected function getThematicType($thematic): string
    {
        return match (get_class($thematic)) {
            \App\Models\Theme::class => 'theme',
            \App\Models\ProviderType::class => 'provider_type',
            \App\Models\LawyerSpecialty::class => 'lawyer_specialty',
            \App\Models\ExpatDomain::class => 'expat_domain',
            \App\Models\UlixaiService::class => 'ulixai_service',
            default => 'theme',
        };
    }

    /**
     * Exécuter un programme (appelé par le Job)
     */
    public function execute(Program $program, ProgramRun $run): void
    {
        try {
            Log::info("ProgramService: Starting execution", [
                'program_id' => $program->id,
                'run_id' => $run->id,
            ]);

            $batchSize = 50;
            $pendingItems = $run->items()->pending()->pluck('id');
            $batches = $pendingItems->chunk($batchSize);
            $batchNumber = 0;
            
            foreach ($batches as $batch) {
                $batchNumber++;
                $delay = ($batchNumber - 1) * 30;
                
                ProcessProgramBatch::dispatch($program, $run, $batch->toArray())
                    ->delay(now()->addSeconds($delay))
                    ->onQueue('program-batches');
            }

            $this->waitForCompletion($run);

        } catch (\Exception $e) {
            Log::error("ProgramService: Execution failed", [
                'program_id' => $program->id,
                'run_id' => $run->id,
                'error' => $e->getMessage(),
            ]);

            $run->markFailed($e->getMessage());
            $program->markError($e->getMessage());
            throw $e;
        }
    }

    /**
     * Traiter un batch d'items
     */
    public function processBatch(Program $program, ProgramRun $run, array $itemIds): void
    {
        $options = $program->merged_options;

        foreach ($itemIds as $itemId) {
            $run->refresh();
            if ($run->status !== 'running') {
                Log::warning("ProgramService: Run cancelled, stopping batch", ['run_id' => $run->id]);
                break;
            }

            $item = ProgramItem::find($itemId);
            if (!$item || $item->status !== 'pending') {
                continue;
            }

            try {
                $item->markGenerating();
                $result = $this->generateContent($item, $program, $options);

                if ($result['success']) {
                    $item->markCompleted($result['content'], $result['cost'] ?? 0, $result['data'] ?? []);
                    $run->incrementGenerated($result['cost'] ?? 0);
                } else {
                    $item->markFailed($result['error'] ?? 'Erreur inconnue');
                    $run->incrementFailed();
                }

            } catch (\Exception $e) {
                Log::error("ProgramService: Item generation failed", [
                    'item_id' => $itemId,
                    'error' => $e->getMessage(),
                ]);
                $item->markFailed($e->getMessage());
                $run->incrementFailed();
            }
        }
    }

    /**
     * Générer le contenu selon le type - AVEC LES BONS PARAMÈTRES
     */
    protected function generateContent(ProgramItem $item, Program $program, array $options): array
    {
        // Récupérer le code de langue (nécessaire pour certains générateurs)
        $language = Language::find($item->language_id);
        $languageCode = $language?->code ?? 'fr';

        $baseParams = [
            'platform_id' => $program->platform_id,
            'country_id' => $item->country_id,
            'language_id' => $item->language_id,
            'language_code' => $languageCode,
            'theme_id' => $item->theme_id,
            'thematic_id' => $item->thematic_id,
            'thematic_type' => $item->thematic_type,
            'options' => $options,
        ];

        return match ($item->generation_type) {
            ProgramItem::TYPE_ARTICLE => $this->generateArticle($baseParams),
            ProgramItem::TYPE_PILLAR => $this->generatePillar($baseParams),
            ProgramItem::TYPE_COMPARATIVE => $this->generateComparative($baseParams),
            ProgramItem::TYPE_LANDING => $this->generateLanding($baseParams),
            ProgramItem::TYPE_MANUAL => $this->generateManual($baseParams),
            ProgramItem::TYPE_PRESS_RELEASE => $this->generatePressRelease($baseParams),
            ProgramItem::TYPE_DOSSIER => $this->generateDossier($baseParams),
            default => ['success' => false, 'error' => "Type inconnu: {$item->generation_type}"],
        };
    }

    // =========================================================================
    // GÉNÉRATEURS PAR TYPE - AVEC LES BONS PARAMÈTRES
    // =========================================================================

    /**
     * Article SEO standard
     * ArticleGenerator requiert: platform_id, country_id, language_code, theme_id
     */
    protected function generateArticle(array $params): array
    {
        try {
            $result = $this->articleGenerator->generate([
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_code' => $params['language_code'], // ✅ language_code, pas language_id
                'theme_id' => $params['theme_id'],
                'type' => 'article',
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Article pilier
     * PillarArticleGenerator requiert: platform_id, country_id, theme_id, language_id
     */
    protected function generatePillar(array $params): array
    {
        try {
            $result = $this->pillarGenerator->generate([
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_id' => $params['language_id'], // ✅ language_id
                'theme_id' => $params['theme_id'],
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Article comparatif
     * ComparativeGenerator requiert: platform_id, country_id, language_code, service_type
     */
    protected function generateComparative(array $params): array
    {
        try {
            $result = $this->comparativeGenerator->generate([
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_code' => $params['language_code'], // ✅ language_code
                'service_type' => $params['options']['service_type'] ?? 'general',
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Landing page
     * LandingGenerator requiert: platform_id, country_id, language_id, service
     */
    protected function generateLanding(array $params): array
    {
        try {
            // Déterminer le service à partir de la thématique
            $service = $this->resolveServiceFromThematic($params['thematic_type'], $params['thematic_id']);

            $result = $this->landingGenerator->generate([
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_id' => $params['language_id'], // ✅ language_id
                'service' => $service, // ✅ service requis
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Résoudre le service à partir de la thématique
     */
    protected function resolveServiceFromThematic(?string $type, ?int $id): string
    {
        if (!$type || !$id) {
            return 'general';
        }

        return match ($type) {
            'provider_type' => \App\Models\ProviderType::find($id)?->slug ?? 'general',
            'lawyer_specialty' => \App\Models\LawyerSpecialty::find($id)?->slug ?? 'lawyer',
            'expat_domain' => \App\Models\ExpatDomain::find($id)?->slug ?? 'expat',
            'ulixai_service' => \App\Models\UlixaiService::find($id)?->slug ?? 'service',
            default => 'general',
        };
    }

    /**
     * Article depuis titre manuel
     */
    protected function generateManual(array $params): array
    {
        try {
            $manualTitle = ManualTitle::where('platform_id', $params['platform_id'])
                ->where('country_id', $params['country_id'])
                ->where('status', 'pending')
                ->first();

            if (!$manualTitle) {
                return ['success' => false, 'error' => 'Aucun titre manuel pending trouvé'];
            }

            $result = $this->manualGenerator->processManualTitle($manualTitle);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
                'data' => ['manual_title_id' => $manualTitle->id],
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Communiqué de presse
     * PressReleaseGenerator requiert: platform_id, template_type, language_code
     */
    protected function generatePressRelease(array $params): array
    {
        try {
            $result = $this->pressReleaseGenerator->generate([
                'platform_id' => $params['platform_id'],
                'template_type' => $params['options']['template_type'] ?? 'standard', // ✅ template_type
                'language_code' => $params['language_code'], // ✅ language_code
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Dossier de presse
     * PressDossierGenerator requiert: platform_id, template_type, title, language_code
     */
    protected function generateDossier(array $params): array
    {
        try {
            // Générer un titre pour le dossier
            $country = \App\Models\Country::find($params['country_id']);
            $title = $params['options']['title'] 
                ?? "Dossier de presse - Expatriation {$country?->name_fr}";

            $result = $this->pressDossierGenerator->generate([
                'platform_id' => $params['platform_id'],
                'template_type' => $params['options']['template_type'] ?? 'press_kit_entreprise', // ✅ template_type
                'title' => $title, // ✅ title requis
                'language_code' => $params['language_code'], // ✅ language_code
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Article knowledge base
     * Utilise ArticleGenerator avec type='knowledge'
     */
    protected function generateKnowledge(array $params): array
    {
        try {
            $result = $this->articleGenerator->generate([
                'platform_id' => $params['platform_id'],
                'country_id' => $params['country_id'],
                'language_code' => $params['language_code'], // ✅ language_code
                'theme_id' => $params['theme_id'],
                'type' => 'knowledge',
                'word_count' => ['min' => 800, 'max' => 1200],
                ...$params['options'],
            ]);

            return [
                'success' => true,
                'content' => $result,
                'cost' => $result->generation_cost ?? 0,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    protected function waitForCompletion(ProgramRun $run, int $maxWaitSeconds = 3600): void
    {
        $startTime = time();

        while (time() - $startTime < $maxWaitSeconds) {
            $run->refresh();
            $pending = $run->items()->whereIn('status', ['pending', 'generating'])->count();
            
            if ($pending === 0) {
                $run->markCompleted();
                return;
            }

            sleep(10);
        }

        $run->markFailed('Timeout: execution exceeded ' . $maxWaitSeconds . ' seconds');
    }

    public function getReadyToRun(): Collection
    {
        return Program::readyToRun()
            ->whereDoesntHave('runs', function ($q) {
                $q->where('status', 'running');
            })
            ->orderBy('priority', 'desc')
            ->orderBy('next_run_at')
            ->get();
    }

    public function runScheduled(): array
    {
        $programs = $this->getReadyToRun();
        $results = [];

        foreach ($programs as $program) {
            if (!$program->canRunToday()) {
                $results[] = [
                    'program_id' => $program->id,
                    'status' => 'skipped',
                    'reason' => 'Daily limit reached',
                ];
                continue;
            }

            try {
                $run = $this->dispatch($program);
                $results[] = [
                    'program_id' => $program->id,
                    'status' => 'dispatched',
                    'run_id' => $run->id,
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'program_id' => $program->id,
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    public function estimate(array $config): array
    {
        $contentTypes = $config['content_types'] ?? ['article'];
        $quantityMode = $config['quantity_mode'] ?? 'total';
        $quantityValue = $config['quantity_value'] ?? 1;
        $countriesCount = !empty($config['countries']) ? count($config['countries']) : 197;
        $languagesCount = !empty($config['languages']) ? count($config['languages']) : 9;

        $costs = [
            'article' => 0.08,
            'pillar' => 0.25,
            'comparative' => 0.15,
            'landing' => 0.12,
            'manual' => 0.08,
            'press_release' => 0.10,
            'dossier' => 0.30,
        ];

        $times = [
            'article' => 45,
            'pillar' => 90,
            'comparative' => 60,
            'landing' => 50,
            'manual' => 40,
            'press_release' => 35,
            'dossier' => 120,
        ];

        $totalItems = 0;
        $totalCost = 0;
        $totalTime = 0;

        foreach ($contentTypes as $type) {
            $itemsForType = match ($quantityMode) {
                'total' => $quantityValue,
                'per_country' => $quantityValue * $countriesCount,
                'per_language' => $quantityValue * $languagesCount,
                'per_country_language' => $quantityValue * $countriesCount * $languagesCount,
                default => $quantityValue,
            };

            $totalItems += $itemsForType;
            $totalCost += $itemsForType * ($costs[$type] ?? 0.08);
            $totalTime += $itemsForType * ($times[$type] ?? 45);
        }

        if ($config['options']['auto_translate'] ?? true) {
            $translationCost = $totalItems * ($languagesCount - 1) * 0.02;
            $totalCost += $translationCost;
        }

        if (($config['options']['image_mode'] ?? 'unsplash_first') === 'dalle_only') {
            $imageCost = $totalItems * ($config['options']['max_images'] ?? 2) * 0.04;
            $totalCost += $imageCost;
        }

        return [
            'items_count' => $totalItems,
            'estimated_cost' => round($totalCost, 2),
            'estimated_time_seconds' => $totalTime,
            'estimated_time_human' => $this->formatDuration($totalTime),
            'by_content_type' => array_combine($contentTypes, array_map(fn($t) => [
                'cost' => $costs[$t] ?? 0.08,
                'time_seconds' => $times[$t] ?? 45,
            ], $contentTypes)),
        ];
    }

    protected function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds} secondes";
        }
        if ($seconds < 3600) {
            return round($seconds / 60) . " minutes";
        }
        $hours = floor($seconds / 3600);
        $minutes = round(($seconds % 3600) / 60);
        return "{$hours}h {$minutes}min";
    }
}