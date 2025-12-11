<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\ArticlePublication;
use App\Models\TemplateVariable;
use App\Models\BulkUpdateLog;
use App\Models\BulkUpdateDetail;
use App\Services\Template\VariableReplacementService;
use App\Jobs\UpdatePublishedArticle;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class BulkUpdateService
{
    protected VariableReplacementService $variableReplacer;

    public function __construct(VariableReplacementService $variableReplacer)
    {
        $this->variableReplacer = $variableReplacer;
    }

    /**
     * Lance une mise à jour en masse après changement de variable
     * 
     * @param string $variableKey Clé de la variable modifiée
     * @param string $oldValue Ancienne valeur
     * @param string $newValue Nouvelle valeur
     * @return BulkUpdateLog
     */
    public function initiateBulkUpdate(
        string $variableKey,
        string $oldValue,
        string $newValue
    ): BulkUpdateLog {
        
        // Créer le log principal
        $bulkUpdate = BulkUpdateLog::create([
            'variable_key' => $variableKey,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'status' => 'pending',
            'started_at' => now()
        ]);

        // Trouver toutes les publications affectées
        $affectedPublications = $this->findAffectedPublications($variableKey, $oldValue);
        
        $bulkUpdate->update([
            'articles_affected' => $affectedPublications->count()
        ]);

        Log::info('Bulk update initié', [
            'bulk_update_id' => $bulkUpdate->id,
            'variable' => $variableKey,
            'affected' => $affectedPublications->count()
        ]);

        // Dispatch jobs pour chaque publication
        foreach ($affectedPublications as $publication) {
            BulkUpdateDetail::create([
                'bulk_update_id' => $bulkUpdate->id,
                'article_id' => $publication->article_id,
                'platform_id' => $publication->platform_id,
                'status' => 'pending'
            ]);

            UpdatePublishedArticle::dispatch($publication, $bulkUpdate->id)
                ->onQueue('bulk-updates');
        }

        $bulkUpdate->update(['status' => 'processing']);

        return $bulkUpdate;
    }

    /**
     * Trouve toutes les publications affectées par le changement de variable
     */
    protected function findAffectedPublications(string $variableKey, string $oldValue)
    {
        return ArticlePublication::where('status', 'published')
            ->whereNotNull('template_variables_snapshot')
            ->whereRaw("JSON_EXTRACT(template_variables_snapshot, '$.{$variableKey}') = ?", [$oldValue])
            ->with(['article', 'platform'])
            ->get();
    }

    /**
     * Met à jour un article publié
     * Appelé par le Job UpdatePublishedArticle
     */
    public function updateSingleArticle(
        ArticlePublication $publication,
        int $bulkUpdateId
    ): bool {
        $detail = BulkUpdateDetail::where('bulk_update_id', $bulkUpdateId)
            ->where('article_id', $publication->article_id)
            ->where('platform_id', $publication->platform_id)
            ->first();

        if (!$detail) {
            Log::error('Detail non trouvé pour update', [
                'bulk_update_id' => $bulkUpdateId,
                'publication_id' => $publication->id
            ]);
            return false;
        }

        try {
            DB::beginTransaction();

            $article = $publication->article;

            // Refresh variables
            $this->variableReplacer->refresh();

            // Régénérer contenu avec nouvelles variables
            $newContent = $this->variableReplacer->replace($article->content);
            $newTitle = $this->variableReplacer->replace($article->title);
            $newMetaTitle = $this->variableReplacer->replace($article->meta_title ?? '');
            $newMetaDescription = $this->variableReplacer->replace($article->meta_description ?? '');

            // Update article
            $article->update([
                'content' => $newContent,
                'title' => $newTitle,
                'meta_title' => $newMetaTitle,
                'meta_description' => $newMetaDescription
            ]);

            // Update publication
            $publication->update([
                'template_variables_snapshot' => $this->variableReplacer->getSnapshot(),
                'last_updated_at' => now()
            ]);

            // Update detail status
            $detail->update(['status' => 'success']);

            // Increment counter sur BulkUpdateLog
            $bulkUpdate = BulkUpdateLog::find($bulkUpdateId);
            $bulkUpdate->increment('articles_updated');

            DB::commit();

            Log::info('Article mis à jour avec succès', [
                'article_id' => $article->id,
                'bulk_update_id' => $bulkUpdateId
            ]);

            // Vérifier si tous les articles sont traités
            $this->checkCompletion($bulkUpdate);

            return true;

        } catch (\Exception $e) {
            DB::rollBack();

            $detail->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            $bulkUpdate = BulkUpdateLog::find($bulkUpdateId);
            $bulkUpdate->increment('articles_failed');

            Log::error('Erreur mise à jour article', [
                'article_id' => $publication->article_id,
                'bulk_update_id' => $bulkUpdateId,
                'error' => $e->getMessage()
            ]);

            $this->checkCompletion($bulkUpdate);

            return false;
        }
    }

    /**
     * Vérifie si le bulk update est terminé
     */
    protected function checkCompletion(BulkUpdateLog $bulkUpdate): void
    {
        $total = $bulkUpdate->articles_updated + $bulkUpdate->articles_failed;
        
        if ($total >= $bulkUpdate->articles_affected) {
            $bulkUpdate->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);

            Log::info('Bulk update terminé', [
                'bulk_update_id' => $bulkUpdate->id,
                'success' => $bulkUpdate->articles_updated,
                'failed' => $bulkUpdate->articles_failed
            ]);
        }
    }

    /**
     * Obtient les statistiques d'un bulk update
     */
    public function getUpdateStats(BulkUpdateLog $bulkUpdate): array
    {
        $details = BulkUpdateDetail::where('bulk_update_id', $bulkUpdate->id)
            ->get()
            ->groupBy('status');

        return [
            'bulk_update_id' => $bulkUpdate->id,
            'variable' => $bulkUpdate->variable_key,
            'old_value' => $bulkUpdate->old_value,
            'new_value' => $bulkUpdate->new_value,
            'status' => $bulkUpdate->status,
            'progress_percent' => $bulkUpdate->progress_percent,
            'articles_affected' => $bulkUpdate->articles_affected,
            'articles_updated' => $bulkUpdate->articles_updated,
            'articles_failed' => $bulkUpdate->articles_failed,
            'articles_pending' => $details->get('pending', collect())->count(),
            'started_at' => $bulkUpdate->started_at,
            'completed_at' => $bulkUpdate->completed_at,
            'duration_seconds' => $bulkUpdate->completed_at 
                ? $bulkUpdate->started_at->diffInSeconds($bulkUpdate->completed_at)
                : null,
            'failed_details' => $details->get('failed', collect())->map(function($detail) {
                return [
                    'article_id' => $detail->article_id,
                    'platform_id' => $detail->platform_id,
                    'error' => $detail->error_message
                ];
            })
        ];
    }

    /**
     * Retry les échecs d'un bulk update
     */
    public function retryFailed(BulkUpdateLog $bulkUpdate): int
    {
        $failedDetails = BulkUpdateDetail::where('bulk_update_id', $bulkUpdate->id)
            ->where('status', 'failed')
            ->get();

        foreach ($failedDetails as $detail) {
            $publication = ArticlePublication::where('article_id', $detail->article_id)
                ->where('platform_id', $detail->platform_id)
                ->first();

            if ($publication) {
                $detail->update(['status' => 'pending']);
                UpdatePublishedArticle::dispatch($publication, $bulkUpdate->id)
                    ->onQueue('bulk-updates');
            }
        }

        Log::info('Retry échecs bulk update', [
            'bulk_update_id' => $bulkUpdate->id,
            'count' => $failedDetails->count()
        ]);

        return $failedDetails->count();
    }

    /**
     * Annule un bulk update en cours
     */
    public function cancel(BulkUpdateLog $bulkUpdate): bool
    {
        if ($bulkUpdate->status === 'completed') {
            return false;
        }

        $bulkUpdate->update([
            'status' => 'cancelled',
            'completed_at' => now()
        ]);

        // TODO: Annuler les jobs en queue si possible

        return true;
    }

    /**
     * Preview des articles qui seraient affectés
     */
    public function previewAffectedArticles(string $variableKey): array
    {
        $currentValue = TemplateVariable::getValue($variableKey);
        
        $affected = ArticlePublication::where('status', 'published')
            ->whereNotNull('template_variables_snapshot')
            ->get()
            ->filter(function($pub) use ($variableKey, $currentValue) {
                $snapshotValue = $pub->template_variables_snapshot[$variableKey] ?? null;
                return $snapshotValue !== null && $snapshotValue !== $currentValue;
            });

        return [
            'variable_key' => $variableKey,
            'current_value' => $currentValue,
            'total_affected' => $affected->count(),
            'by_platform' => $affected->groupBy('platform_id')->map->count(),
            'sample_articles' => $affected->take(10)->map(function($pub) use ($variableKey) {
                return [
                    'article_id' => $pub->article_id,
                    'title' => $pub->article->title ?? 'N/A',
                    'platform' => $pub->platform->name ?? 'N/A',
                    'old_value' => $pub->template_variables_snapshot[$variableKey] ?? 'N/A'
                ];
            })
        ];
    }
}
