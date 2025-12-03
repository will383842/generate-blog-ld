<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Platform;
use App\Services\Content\PlatformKnowledgeService;
use Illuminate\Console\Command;

class ValidateExistingContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knowledge:validate-all 
                            {--platform= : ID de la plateforme à valider}
                            {--language= : Code langue à valider}
                            {--fix : Marquer articles invalides pour review}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Valide tous les articles existants contre les règles Platform Knowledge';

    /**
     * Execute the console command.
     */
    public function handle(PlatformKnowledgeService $knowledgeService): int
    {
        $this->info('🔍 Validation des articles existants...');
        $this->newLine();
        
        // Construire la requête
        $query = Article::query()->where('status', 'published');
        
        if ($this->option('platform')) {
            $query->where('platform_id', $this->option('platform'));
        }
        
        if ($this->option('language')) {
            $query->where('language_code', $this->option('language'));
        }
        
        $articles = $query->get();
        
        if ($articles->isEmpty()) {
            $this->warn('Aucun article trouvé avec ces critères.');
            return self::FAILURE;
        }
        
        $this->info("Validation de {$articles->count()} articles...");
        $this->newLine();
        
        $stats = [
            'valid' => 0,
            'invalid' => 0,
            'warnings' => 0,
        ];
        
        $progressBar = $this->output->createProgressBar($articles->count());
        $progressBar->start();
        
        foreach ($articles as $article) {
            $platform = $article->platform;
            
            if (!$platform) {
                $progressBar->advance();
                continue;
            }
            
            $validation = $knowledgeService->validateContent(
                $article->content ?? '',
                $platform,
                $article->language_code
            );
            
            if ($validation['valid']) {
                $stats['valid']++;
            } else {
                $stats['invalid']++;
                
                if ($this->option('fix')) {
                    $article->update([
                        'status' => 'review_needed',
                        'validation_notes' => json_encode($validation),
                    ]);
                }
            }
            
            if (count($validation['warnings']) > 0) {
                $stats['warnings']++;
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine(2);
        
        // Afficher les résultats
        $this->info('📊 Résultats de la validation:');
        $this->newLine();
        
        $this->table(
            ['Statut', 'Nombre'],
            [
                ['✅ Valides', $stats['valid']],
                ['❌ Invalides', $stats['invalid']],
                ['⚠️  Avec warnings', $stats['warnings']],
            ]
        );
        
        $this->newLine();
        
        if ($stats['invalid'] > 0) {
            $this->warn("⚠️  {$stats['invalid']} articles invalides détectés!");
            
            if ($this->option('fix')) {
                $this->info("✓ Articles marqués 'review_needed'");
            } else {
                $this->info("💡 Utilisez --fix pour marquer les articles invalides");
            }
        } else {
            $this->info('✅ Tous les articles sont valides!');
        }
        
        return self::SUCCESS;
    }
}