<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\InternalLink;
use App\Models\LinkingRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PillarLinkingService
{
    protected AnchorTextGenerator $anchorGenerator;
    protected LinkPositionService $positionService;

    public function __construct(
        AnchorTextGenerator $anchorGenerator,
        LinkPositionService $positionService
    ) {
        $this->anchorGenerator = $anchorGenerator;
        $this->positionService = $positionService;
    }

    /**
     * Crée les liens du pilier vers tous ses articles enfants (hub → spoke)
     */
    public function linkPillarToArticles(Article $pillar): array
    {
        if ($pillar->type !== 'pillar') {
            Log::warning("PillarLinkingService: Article {$pillar->id} n'est pas un pilier");
            return ['created' => 0, 'errors' => ['Article is not a pillar']];
        }

        $childArticles = $this->findChildArticles($pillar);
        
        if ($childArticles->isEmpty()) {
            return ['created' => 0, 'errors' => ['No child articles found']];
        }

        $created = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            // Supprimer anciens liens automatiques pillar_to_article
            InternalLink::where('source_article_id', $pillar->id)
                ->where('link_context', 'pillar_to_article')
                ->where('is_automatic', true)
                ->delete();

            foreach ($childArticles as $child) {
                try {
                    $this->createPillarToArticleLink($pillar, $child);
                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Failed to link to article {$child->id}: {$e->getMessage()}";
                }
            }

            // Mettre à jour la table des matières du pilier
            $this->updatePillarTableOfContents($pillar, $childArticles);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        Log::info("PillarLinkingService: Pillar {$pillar->id} linked to {$created} articles");

        return [
            'created' => $created,
            'total_children' => $childArticles->count(),
            'errors' => $errors
        ];
    }

    /**
     * Crée un lien d'un article vers son pilier parent (spoke → hub)
     */
    public function linkArticleToPillar(Article $article): ?InternalLink
    {
        if ($article->type === 'pillar') {
            return null;
        }

        $pillar = $this->findParentPillar($article);
        
        if (!$pillar) {
            Log::info("PillarLinkingService: No parent pillar found for article {$article->id}");
            return null;
        }

        // Vérifier si lien existe déjà
        $existingLink = InternalLink::where('source_article_id', $article->id)
            ->where('target_article_id', $pillar->id)
            ->first();

        if ($existingLink) {
            return $existingLink;
        }

        // Créer le lien article → pilier
        $anchorType = 'long_tail';
        $anchorText = $this->anchorGenerator->generate($pillar, $anchorType, $article->language_code);

        $link = InternalLink::create([
            'source_article_id' => $article->id,
            'target_article_id' => $pillar->id,
            'anchor_text' => $anchorText,
            'anchor_type' => $anchorType,
            'position_in_content' => 0, // Sera mis à jour lors de l'injection
            'link_context' => 'article_to_pillar',
            'relevance_score' => $this->calculatePillarRelevance($article, $pillar),
            'is_automatic' => true
        ]);

        Log::info("PillarLinkingService: Created link from article {$article->id} to pillar {$pillar->id}");

        return $link;
    }

    /**
     * Trouve tous les articles enfants d'un pilier
     */
    public function findChildArticles(Article $pillar): Collection
    {
        return Article::where('platform_id', $pillar->platform_id)
            ->where('language_code', $pillar->language_code)
            ->where('type', '!=', 'pillar')
            ->where('status', 'published')
            ->where('id', '!=', $pillar->id)
            ->where(function ($query) use ($pillar) {
                // Même thème/catégorie
                if ($pillar->theme) {
                    $query->where('theme', $pillar->theme);
                }
                // Ou même pays
                if ($pillar->country_code) {
                    $query->orWhere('country_code', $pillar->country_code);
                }
            })
            ->orderBy('quality_score', 'desc')
            ->limit(20) // Max 20 liens dans un pilier
            ->get();
    }

    /**
     * Trouve le pilier parent d'un article
     */
    public function findParentPillar(Article $article): ?Article
    {
        // Priorité 1: Même thème ET même pays
        $pillar = Article::where('platform_id', $article->platform_id)
            ->where('language_code', $article->language_code)
            ->where('type', 'pillar')
            ->where('status', 'published')
            ->where('theme', $article->theme)
            ->where('country_code', $article->country_code)
            ->first();

        if ($pillar) {
            return $pillar;
        }

        // Priorité 2: Même thème uniquement
        $pillar = Article::where('platform_id', $article->platform_id)
            ->where('language_code', $article->language_code)
            ->where('type', 'pillar')
            ->where('status', 'published')
            ->where('theme', $article->theme)
            ->first();

        if ($pillar) {
            return $pillar;
        }

        // Priorité 3: Même pays uniquement
        return Article::where('platform_id', $article->platform_id)
            ->where('language_code', $article->language_code)
            ->where('type', 'pillar')
            ->where('status', 'published')
            ->where('country_code', $article->country_code)
            ->first();
    }

    /**
     * Crée le maillage hub & spoke complet
     */
    public function createPillarHubLinks(Article $pillar): array
    {
        $results = [
            'pillar_to_articles' => 0,
            'articles_to_pillar' => 0,
            'errors' => []
        ];

        // 1. Liens pilier → articles
        $pillarResult = $this->linkPillarToArticles($pillar);
        $results['pillar_to_articles'] = $pillarResult['created'];
        $results['errors'] = array_merge($results['errors'], $pillarResult['errors']);

        // 2. Liens articles → pilier
        $childArticles = $this->findChildArticles($pillar);
        foreach ($childArticles as $child) {
            $link = $this->linkArticleToPillar($child);
            if ($link) {
                $results['articles_to_pillar']++;
            }
        }

        return $results;
    }

    /**
     * Met à jour la table des matières du pilier avec liens vers enfants
     */
    public function updatePillarTableOfContents(Article $pillar, Collection $childArticles): void
    {
        $content = $pillar->content;
        
        // Chercher la section Table des Matières existante
        $tocPattern = '/<div[^>]*class="[^"]*table-of-contents[^"]*"[^>]*>.*?<\/div>/is';
        
        // Générer nouvelle TOC
        $toc = $this->generateTableOfContents($pillar, $childArticles);
        
        if (preg_match($tocPattern, $content)) {
            // Remplacer TOC existante
            $content = preg_replace($tocPattern, $toc, $content);
        } else {
            // Insérer après le premier paragraphe
            $firstParagraphEnd = strpos($content, '</p>');
            if ($firstParagraphEnd !== false) {
                $content = substr($content, 0, $firstParagraphEnd + 4) . "\n\n" . $toc . "\n\n" . substr($content, $firstParagraphEnd + 4);
            }
        }

        $pillar->update(['content' => $content]);
    }

    /**
     * Génère la table des matières HTML avec liens
     */
    protected function generateTableOfContents(Article $pillar, Collection $childArticles): string
    {
        $lang = $pillar->language_code;
        
        $titles = [
            'fr' => 'Table des matières',
            'en' => 'Table of Contents',
            'es' => 'Índice',
            'de' => 'Inhaltsverzeichnis',
            'pt' => 'Índice',
            'ru' => 'Содержание',
            'zh' => '目录',
            'ar' => 'فهرس المحتويات',
            'hi' => 'विषय सूची'
        ];

        $title = $titles[$lang] ?? $titles['en'];
        
        $html = '<nav class="table-of-contents" aria-label="' . $title . '">';
        $html .= '<h2>' . $title . '</h2>';
        $html .= '<ol>';

        // Grouper par thème/section si possible
        $grouped = $childArticles->groupBy('theme');
        
        foreach ($grouped as $theme => $articles) {
            if ($grouped->count() > 1 && $theme) {
                $html .= '<li><strong>' . ucfirst($theme) . '</strong><ul>';
            }
            
            foreach ($articles as $article) {
                $url = $article->url ?? route('articles.show', $article->slug);
                $html .= '<li><a href="' . $url . '">' . htmlspecialchars($article->title) . '</a></li>';
            }
            
            if ($grouped->count() > 1 && $theme) {
                $html .= '</ul></li>';
            }
        }

        $html .= '</ol>';
        $html .= '</nav>';

        return $html;
    }

    /**
     * Crée un lien pilier → article enfant
     */
    protected function createPillarToArticleLink(Article $pillar, Article $child): InternalLink
    {
        // Varier les types d'ancres pour naturaliser
        $anchorTypes = ['exact_match', 'long_tail', 'cta'];
        $anchorType = $anchorTypes[array_rand($anchorTypes)];
        
        $anchorText = $this->anchorGenerator->generate($child, $anchorType, $pillar->language_code);

        return InternalLink::create([
            'source_article_id' => $pillar->id,
            'target_article_id' => $child->id,
            'anchor_text' => $anchorText,
            'anchor_type' => $anchorType,
            'position_in_content' => 0,
            'link_context' => 'pillar_to_article',
            'relevance_score' => $this->calculatePillarRelevance($pillar, $child),
            'is_automatic' => true
        ]);
    }

    /**
     * Calcule le score de pertinence pilier ↔ article
     */
    protected function calculatePillarRelevance(Article $article1, Article $article2): int
    {
        $score = 70; // Base score pour relation pilier

        // Même pays: +15
        if ($article1->country_code && $article1->country_code === $article2->country_code) {
            $score += 15;
        }

        // Même thème: +15
        if ($article1->theme && $article1->theme === $article2->theme) {
            $score += 15;
        }

        return min(100, $score);
    }

    /**
     * Récupère tous les piliers d'une plateforme
     */
    public function getPlatformPillars(int $platformId): Collection
    {
        return Article::where('platform_id', $platformId)
            ->where('type', 'pillar')
            ->where('status', 'published')
            ->get();
    }

    /**
     * Régénère le maillage pour tous les piliers d'une plateforme
     */
    public function regenerateAllPillarLinks(int $platformId): array
    {
        $pillars = $this->getPlatformPillars($platformId);
        $totalResults = [
            'pillars_processed' => 0,
            'pillar_to_articles' => 0,
            'articles_to_pillar' => 0,
            'errors' => []
        ];

        foreach ($pillars as $pillar) {
            $result = $this->createPillarHubLinks($pillar);
            $totalResults['pillars_processed']++;
            $totalResults['pillar_to_articles'] += $result['pillar_to_articles'];
            $totalResults['articles_to_pillar'] += $result['articles_to_pillar'];
            $totalResults['errors'] = array_merge($totalResults['errors'], $result['errors']);
        }

        return $totalResults;
    }

    /**
     * Vérifie l'intégrité du maillage pilier
     */
    public function verifyPillarIntegrity(Article $pillar): array
    {
        $issues = [];

        // Vérifier que le pilier a des liens sortants
        $outboundLinks = InternalLink::where('source_article_id', $pillar->id)
            ->where('link_context', 'pillar_to_article')
            ->count();

        if ($outboundLinks === 0) {
            $issues[] = 'Pillar has no outbound links to child articles';
        }

        // Vérifier que les articles enfants pointent vers le pilier
        $childArticles = $this->findChildArticles($pillar);
        $inboundLinks = InternalLink::whereIn('source_article_id', $childArticles->pluck('id'))
            ->where('target_article_id', $pillar->id)
            ->where('link_context', 'article_to_pillar')
            ->count();

        $missingInbound = $childArticles->count() - $inboundLinks;
        if ($missingInbound > 0) {
            $issues[] = "{$missingInbound} child articles don't link back to pillar";
        }

        // Vérifier la TOC
        if (strpos($pillar->content, 'table-of-contents') === false) {
            $issues[] = 'Pillar is missing table of contents';
        }

        return [
            'is_valid' => empty($issues),
            'outbound_links' => $outboundLinks,
            'expected_inbound' => $childArticles->count(),
            'actual_inbound' => $inboundLinks,
            'issues' => $issues
        ];
    }
}
