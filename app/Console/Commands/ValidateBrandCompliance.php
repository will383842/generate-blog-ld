<?php
/**
 * =============================================================================
 * FICHIER 9/10 : Command ValidateBrandCompliance
 * =============================================================================
 * 
 * EMPLACEMENT : app/Console/Commands/ValidateBrandCompliance.php
 * 
 * EXÉCUTION : php artisan brand:validate [options]
 * 
 * EXEMPLES :
 * - php artisan brand:validate --platform=sos-expat --limit=10
 * - php artisan brand:validate --platform=ulixai --fix
 * - php artisan brand:validate --limit=50
 * 
 * =============================================================================
 */

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;
use App\Models\Platform;
use App\Services\Content\BrandValidationService;
use App\Services\Content\PlatformKnowledgeService;

class ValidateBrandCompliance extends Command
{
    /**
     * Signature de la command
     */
    protected $signature = 'brand:validate 
                            {--platform= : Code plateforme (sos-expat, ulixai, ulysse)}
                            {--limit=100 : Nombre articles à analyser}
                            {--fix : Update quality_score et status}
                            {--show-errors : Afficher détails erreurs}';
    
    /**
     * Description de la command
     */
    protected $description = 'Valide conformité brand des articles publiés (Phase 12)';
    
    /**
     * Execute la command
     */
    public function handle(
        BrandValidationService $brandValidator,
        PlatformKnowledgeService $knowledgeService
    ): int {
        $this->info("╔══════════════════════════════════════════╗");
        $this->info("║   VALIDATION BRAND COMPLIANCE (Phase 12) ║");
        $this->info("╚══════════════════════════════════════════╝\n");
        
        $platformCode = $this->option('platform');
        $limit = (int) $this->option('limit');
        $fix = $this->option('fix');
        $showErrors = $this->option('show-errors');
        
        // Construire query
        $query = Article::where('status', 'published');
        
        if ($platformCode) {
            $platform = Platform::where('code', $platformCode)->first();
            if (!$platform) {
                $this->error("❌ Plateforme '{$platformCode}' introuvable");
                return 1;
            }
            $query->where('platform_id', $platform->id);
            $this->info("🎯 Plateforme : {$platform->name}");
        } else {
            $this->info("🎯 Toutes plateformes");
        }
        
        $articles = $query->limit($limit)->get();
        $total = $articles->count();
        
        if ($total === 0) {
            $this->warn("⚠️  Aucun article trouvé");
            return 0;
        }
        
        $this->info("📊 Validation de {$total} articles...\n");
        
        // Statistiques
        $stats = [
            'total' => 0,
            'compliant' => 0,
            'review_needed' => 0,
            'avg_score' => 0,
            'avg_knowledge_score' => 0,
            'avg_brand_score' => 0,
        ];
        
        $problemArticles = [];
        
        // Progress bar
        $bar = $this->output->createProgressBar($total);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% - %message%');
        $bar->setMessage('Démarrage...');
        
        foreach ($articles as $article) {
            $bar->setMessage("Article #{$article->id}");
            
            // Validation knowledge
            $knowledgeValidation = $knowledgeService->validateContent(
                $article->content,
                $article->platform,
                $article->language->code
            );
            
            // Validation brand
            $brandValidation = $brandValidator->validateCompliance(
                $article->content,
                $article->platform,
                $article->language->code
            );
            
            // Score global
            $globalScore = ($knowledgeValidation['score'] + $brandValidation['score']) / 2;
            
            // Stats
            $stats['total']++;
            $stats['avg_score'] += $globalScore;
            $stats['avg_knowledge_score'] += $knowledgeValidation['score'];
            $stats['avg_brand_score'] += $brandValidation['score'];
            
            if ($globalScore >= 70 && $brandValidation['compliant'] && $knowledgeValidation['valid']) {
                $stats['compliant']++;
            } else {
                $stats['review_needed']++;
                
                // Stocker articles problématiques
                if ($showErrors) {
                    $problemArticles[] = [
                        'id' => $article->id,
                        'title' => $article->title,
                        'global_score' => round($globalScore, 1),
                        'knowledge_errors' => count($knowledgeValidation['errors']),
                        'brand_errors' => count($brandValidation['errors']),
                        'all_errors' => array_merge(
                            $knowledgeValidation['errors'],
                            $brandValidation['errors']
                        ),
                    ];
                }
                
                // Mise à jour si --fix
                if ($fix) {
                    $article->quality_score = round($globalScore);
                    $article->status = 'review_needed';
                    $article->validation_notes = json_encode([
                        'knowledge' => $knowledgeValidation,
                        'brand' => $brandValidation,
                        'global_score' => $globalScore,
                        'validated_at' => now()->toISOString(),
                    ]);
                    $article->save();
                }
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        
        // Calcul moyennes
        if ($stats['total'] > 0) {
            $stats['avg_score'] /= $stats['total'];
            $stats['avg_knowledge_score'] /= $stats['total'];
            $stats['avg_brand_score'] /= $stats['total'];
        }
        
        // Affichage résultats
        $this->newLine(2);
        $this->info("╔══════════════════════════════════════════╗");
        $this->info("║            RÉSULTATS VALIDATION          ║");
        $this->info("╚══════════════════════════════════════════╝\n");
        
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Total articles', $stats['total']],
                ['✅ Conformes', $stats['compliant'] . ' (' . round($stats['compliant'] / $stats['total'] * 100, 1) . '%)'],
                ['⚠️  Review needed', $stats['review_needed'] . ' (' . round($stats['review_needed'] / $stats['total'] * 100, 1) . '%)'],
                ['Score moyen global', number_format($stats['avg_score'], 1) . '%'],
                ['Score moyen knowledge', number_format($stats['avg_knowledge_score'], 1) . '%'],
                ['Score moyen brand', number_format($stats['avg_brand_score'], 1) . '%'],
            ]
        );
        
        // Afficher articles problématiques
        if ($showErrors && !empty($problemArticles)) {
            $this->newLine();
            $this->warn("📋 ARTICLES NÉCESSITANT RÉVISION :\n");
            
            foreach (array_slice($problemArticles, 0, 10) as $problem) {
                $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                $this->info("Article #{$problem['id']} : {$problem['title']}");
                $this->line("Score : {$problem['global_score']}% | Erreurs : {$problem['knowledge_errors']} knowledge + {$problem['brand_errors']} brand");
                
                if (!empty($problem['all_errors'])) {
                    foreach (array_slice($problem['all_errors'], 0, 3) as $error) {
                        $this->line("  ❌ $error");
                    }
                    if (count($problem['all_errors']) > 3) {
                        $remaining = count($problem['all_errors']) - 3;
                        $this->line("  ... (+{$remaining} autres erreurs)");
                    }
                }
            }
            
            if (count($problemArticles) > 10) {
                $remaining = count($problemArticles) - 10;
                $this->line("\n... (+{$remaining} autres articles)");
            }
        }
        
        // Recommandations
        $this->newLine();
        if (!$fix) {
            $this->info("💡 Utiliser --fix pour mettre à jour automatiquement les articles");
        } else {
            $this->info("✅ {$stats['review_needed']} articles mis à jour avec status 'review_needed'");
        }
        
        if (!$showErrors && $stats['review_needed'] > 0) {
            $this->info("💡 Utiliser --show-errors pour voir détails des erreurs");
        }
        
        return 0;
    }
}