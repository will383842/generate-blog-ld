<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * ExportController - Export des contenus
 */
class ExportController extends Controller
{
    /**
     * Exporter des articles
     * 
     * POST /api/export/articles
     */
    public function articles(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:articles,id',
            'format' => 'required|in:json,csv,markdown,html,wordpress',
        ]);

        try {
            $articles = Article::with([
                'platform', 'country', 'language', 'author', 'theme', 'faqs'
            ])->whereIn('id', $request->ids)->get();

            $format = $request->format;
            $filename = 'articles-export-' . now()->format('Y-m-d-His') . '.' . $format;

            switch ($format) {
                case 'json':
                    $content = json_encode($articles->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    break;

                case 'csv':
                    $content = $this->exportToCsv($articles);
                    break;

                case 'markdown':
                    $content = $this->exportToMarkdown($articles);
                    break;

                case 'html':
                    $content = $this->exportToHtml($articles);
                    break;

                case 'wordpress':
                    $content = $this->exportToWordPress($articles);
                    break;

                default:
                    $content = json_encode($articles->toArray());
            }

            // Sauvegarder le fichier temporairement
            $path = 'exports/' . $filename;
            Storage::disk('local')->put($path, $content);

            return response()->json([
                'success' => true,
                'message' => 'Export créé avec succès',
                'data' => [
                    'filename' => $filename,
                    'format' => $format,
                    'articles_count' => $articles->count(),
                    'download_url' => url('/api/export/download/' . $filename),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Télécharger un export
     * 
     * GET /api/export/download/{filename}
     */
    public function download(string $filename)
    {
        $path = 'exports/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Fichier non trouvé',
            ], 404);
        }

        return Storage::disk('local')->download($path);
    }

    /**
     * Export vers CSV
     */
    private function exportToCsv($articles): string
    {
        $csv = "ID,Title,Type,Platform,Country,Language,Status,Word Count,Quality Score,Created At\n";

        foreach ($articles as $article) {
            $csv .= implode(',', [
                $article->id,
                '"' . str_replace('"', '""', $article->title) . '"',
                $article->type,
                $article->platform->name ?? '',
                $article->country->name ?? '',
                $article->language->code ?? '',
                $article->status,
                $article->word_count,
                $article->quality_score,
                $article->created_at->toDateString(),
            ]) . "\n";
        }

        return $csv;
    }

    /**
     * Export vers Markdown
     */
    private function exportToMarkdown($articles): string
    {
        $markdown = "# Articles Export\n\n";
        $markdown .= "Generated: " . now()->toDateTimeString() . "\n\n";
        $markdown .= "Total articles: " . $articles->count() . "\n\n";
        $markdown .= "---\n\n";

        foreach ($articles as $article) {
            $markdown .= "## {$article->title}\n\n";
            $markdown .= "**Platform:** {$article->platform->name}\n";
            $markdown .= "**Country:** {$article->country->name}\n";
            $markdown .= "**Language:** {$article->language->code}\n";
            $markdown .= "**Status:** {$article->status}\n";
            $markdown .= "**Word Count:** {$article->word_count}\n\n";
            
            if ($article->excerpt) {
                $markdown .= "### Excerpt\n\n";
                $markdown .= $article->excerpt . "\n\n";
            }
            
            $markdown .= "### Content\n\n";
            $markdown .= $article->content . "\n\n";
            
            if ($article->faqs->count() > 0) {
                $markdown .= "### FAQs\n\n";
                foreach ($article->faqs as $faq) {
                    $markdown .= "**Q:** {$faq->question}\n\n";
                    $markdown .= "**A:** {$faq->answer}\n\n";
                }
            }
            
            $markdown .= "---\n\n";
        }

        return $markdown;
    }

    /**
     * Export vers HTML
     */
    private function exportToHtml($articles): string
    {
        $html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">';
        $html .= '<title>Articles Export</title>';
        $html .= '<style>body{font-family:Arial,sans-serif;max-width:1200px;margin:0 auto;padding:20px;}';
        $html .= 'article{margin-bottom:40px;border-bottom:1px solid #ccc;padding-bottom:20px;}';
        $html .= 'h1{color:#333;}h2{color:#0066cc;}.meta{color:#666;font-size:14px;}</style>';
        $html .= '</head><body>';
        $html .= '<h1>Articles Export</h1>';
        $html .= '<p class="meta">Generated: ' . now()->toDateTimeString() . '</p>';
        $html .= '<p class="meta">Total: ' . $articles->count() . ' articles</p><hr>';

        foreach ($articles as $article) {
            $html .= '<article>';
            $html .= '<h2>' . htmlspecialchars($article->title) . '</h2>';
            $html .= '<div class="meta">';
            $html .= 'Platform: ' . htmlspecialchars($article->platform->name ?? '') . ' | ';
            $html .= 'Country: ' . htmlspecialchars($article->country->name ?? '') . ' | ';
            $html .= 'Language: ' . htmlspecialchars($article->language->code ?? '') . ' | ';
            $html .= 'Status: ' . $article->status;
            $html .= '</div>';
            
            if ($article->excerpt) {
                $html .= '<p><strong>Excerpt:</strong> ' . htmlspecialchars($article->excerpt) . '</p>';
            }
            
            $html .= '<div class="content">' . $article->content . '</div>';
            $html .= '</article>';
        }

        $html .= '</body></html>';
        return $html;
    }

    /**
     * Export vers WordPress XML
     */
    private function exportToWordPress($articles): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/">';
        $xml .= '<channel>';
        $xml .= '<title>Content Engine Export</title>';
        $xml .= '<pubDate>' . now()->toRssString() . '</pubDate>';

        foreach ($articles as $article) {
            $xml .= '<item>';
            $xml .= '<title><![CDATA[' . $article->title . ']]></title>';
            $xml .= '<pubDate>' . $article->created_at->toRssString() . '</pubDate>';
            $xml .= '<description><![CDATA[' . $article->excerpt . ']]></description>';
            $xml .= '<content:encoded><![CDATA[' . $article->content . ']]></content:encoded>';
            $xml .= '<wp:post_type>post</wp:post_type>';
            $xml .= '<wp:status>' . $article->status . '</wp:status>';
            $xml .= '</item>';
        }

        $xml .= '</channel></rss>';
        return $xml;
    }
}
