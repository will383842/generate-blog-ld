<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\InternalLink;
use App\Models\ExternalLink;
use App\Models\LinkingRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ContextualLinkInjector
{
    protected LinkPositionService $positionService;
    protected AnchorTextGenerator $anchorGenerator;

    public function __construct(
        LinkPositionService $positionService,
        AnchorTextGenerator $anchorGenerator
    ) {
        $this->positionService = $positionService;
        $this->anchorGenerator = $anchorGenerator;
    }

    /**
     * Injecte tous les liens (internes, externes, affiliés) dans le contenu
     */
    public function injectAllLinks(Article $article): array
    {
        $rules = LinkingRule::forPlatform($article->platform_id);

        $result = [
            'internal' => 0,
            'external' => 0,
            'affiliate' => 0,
            'total' => 0
        ];

        $content = $article->content;

        // 1. Injecter liens internes
        $internalLinks = InternalLink::where('source_article_id', $article->id)
            ->with('targetArticle')
            ->get();

        if ($internalLinks->isNotEmpty()) {
            $content = $this->injectInternalLinks($content, $internalLinks, $article, $rules);
            $result['internal'] = $internalLinks->count();
        }

        // 2. Injecter liens externes
        $externalLinks = ExternalLink::where('article_id', $article->id)->get();
        
        if ($externalLinks->isNotEmpty()) {
            $content = $this->injectExternalLinks($content, $externalLinks, $rules);
            $result['external'] = $externalLinks->count();
        }

        // Mettre à jour l'article
        $article->update(['content' => $content]);

        $result['total'] = $result['internal'] + $result['external'] + $result['affiliate'];

        Log::info("ContextualLinkInjector: Injected links in article {$article->id}", $result);

        return $result;
    }

    /**
     * Injecte les liens internes dans le contenu
     */
    public function injectInternalLinks(
        string $content,
        Collection $links,
        Article $article,
        ?LinkingRule $rules
    ): string {
        $maxPerParagraph = $rules?->max_links_per_paragraph ?? config('linking.internal.max_per_paragraph', 1);

        // Analyser la structure du contenu
        $paragraphs = $this->analyzeParagraphs($content);
        $linksPerParagraph = [];

        // Calculer les positions optimales
        $positions = $this->positionService->calculateUniformDistribution(
            $content,
            $links->count()
        );

        // Associer chaque lien à une position
        $linkPositions = [];
        foreach ($links as $index => $link) {
            if (!isset($positions[$index])) {
                continue;
            }

            $position = $positions[$index];
            $paragraphIndex = $position['paragraph_index'];

            // Vérifier limite par paragraphe
            $currentCount = $linksPerParagraph[$paragraphIndex] ?? 0;
            if ($currentCount >= $maxPerParagraph) {
                continue;
            }

            $linkPositions[] = [
                'link' => $link,
                'position' => $position['position'],
                'paragraph_index' => $paragraphIndex
            ];

            $linksPerParagraph[$paragraphIndex] = $currentCount + 1;
        }

        // Trier par position décroissante (pour ne pas décaler les indices)
        usort($linkPositions, fn($a, $b) => $b['position'] <=> $a['position']);

        // Injecter les liens
        foreach ($linkPositions as $lp) {
            $link = $lp['link'];
            $position = $lp['position'];

            // Générer le HTML du lien
            $html = $this->generateInternalLinkHtml($link, $article->language_code);

            // Trouver le meilleur point d'insertion
            $insertPoint = $this->findBestInsertionPoint($content, $position);
            
            // Insérer le lien
            $content = $this->insertAtPosition($content, $html, $insertPoint);

            // Mettre à jour la position dans la base
            $link->update(['position_in_content' => $insertPoint]);
        }

        return $content;
    }

    /**
     * Injecte les liens externes dans le contenu
     */
    public function injectExternalLinks(
        string $content,
        Collection $links,
        ?LinkingRule $rules
    ): string {
        $positions = $this->positionService->findInsertionPoints($content, $links->count());

        // Trier par position décroissante
        $insertions = [];
        foreach ($links as $index => $link) {
            if (!isset($positions[$index])) {
                break;
            }
            $insertions[] = [
                'link' => $link,
                'position' => $positions[$index]['position']
            ];
        }

        usort($insertions, fn($a, $b) => $b['position'] <=> $a['position']);

        foreach ($insertions as $insertion) {
            $link = $insertion['link'];
            $html = $this->generateExternalLinkHtml($link);
            $insertPoint = $this->findBestInsertionPoint($content, $insertion['position']);
            $content = $this->insertAtPosition($content, $html, $insertPoint);
        }

        return $content;
    }

    /**
     * Génère le HTML d'un lien interne
     */
    protected function generateInternalLinkHtml(InternalLink $link, string $lang): string
    {
        $targetArticle = $link->targetArticle;
        
        if (!$targetArticle) {
            return '';
        }

        $url = $targetArticle->url ?? route('articles.show', $targetArticle->slug);
        $anchorText = $link->anchor_text;

        $attributes = [
            'href' => $url,
            'class' => 'internal-link',
            'title' => $targetArticle->title
        ];

        $attrString = collect($attributes)
            ->map(fn($value, $key) => "{$key}=\"" . htmlspecialchars($value) . "\"")
            ->implode(' ');

        return "<a {$attrString}>" . htmlspecialchars($anchorText) . "</a>";
    }

    /**
     * Génère le HTML d'un lien externe
     */
    protected function generateExternalLinkHtml(ExternalLink $link): string
    {
        $attributes = [
            'href' => $link->url,
            'class' => 'external-link',
            'target' => '_blank',
        ];

        // Construire rel
        $rel = ['noopener'];
        if ($link->is_nofollow) {
            $rel[] = 'nofollow';
        }
        if ($link->is_sponsored) {
            $rel[] = 'sponsored';
        }
        $attributes['rel'] = implode(' ', $rel);

        // Title
        if ($link->domain) {
            $attributes['title'] = "Visit {$link->domain}";
        }

        $attrString = collect($attributes)
            ->map(fn($value, $key) => "{$key}=\"" . htmlspecialchars($value) . "\"")
            ->implode(' ');

        return "<a {$attrString}>" . htmlspecialchars($link->anchor_text) . "</a>";
    }

    /**
     * Trouve le meilleur point d'insertion
     */
    protected function findBestInsertionPoint(string $content, int $approximatePosition): int
    {
        // Chercher la fin de phrase la plus proche
        $searchStart = max(0, $approximatePosition - 100);
        $searchEnd = min(strlen($content), $approximatePosition + 100);
        $searchArea = substr($content, $searchStart, $searchEnd - $searchStart);

        // Patterns de fin de phrase
        $patterns = ['. ', '.</p>', '.</span>', '!</p>', '?</p>'];
        
        $bestPosition = $approximatePosition;
        $minDistance = PHP_INT_MAX;

        foreach ($patterns as $pattern) {
            $pos = strpos($searchArea, $pattern);
            if ($pos !== false) {
                $absolutePos = $searchStart + $pos + strlen($pattern);
                $distance = abs($absolutePos - $approximatePosition);
                if ($distance < $minDistance) {
                    $minDistance = $distance;
                    $bestPosition = $absolutePos;
                }
            }
        }

        // S'assurer qu'on n'insère pas au milieu d'un tag HTML
        $bestPosition = $this->adjustForHtmlTags($content, $bestPosition);

        return $bestPosition;
    }

    /**
     * Ajuste la position pour éviter les tags HTML
     */
    protected function adjustForHtmlTags(string $content, int $position): int
    {
        // Vérifier si on est dans un tag
        $before = substr($content, max(0, $position - 50), 50);
        $after = substr($content, $position, 50);

        // Si on a un < sans > avant, on est dans un tag
        $lastOpen = strrpos($before, '<');
        $lastClose = strrpos($before, '>');

        if ($lastOpen !== false && ($lastClose === false || $lastOpen > $lastClose)) {
            // On est dans un tag, chercher la fermeture
            $closePos = strpos($after, '>');
            if ($closePos !== false) {
                $position += $closePos + 1;
            }
        }

        return $position;
    }

    /**
     * Insère du texte à une position donnée
     */
    protected function insertAtPosition(string $content, string $insertion, int $position): string
    {
        return substr($content, 0, $position) . ' ' . $insertion . substr($content, $position);
    }

    /**
     * Analyse les paragraphes du contenu
     */
    protected function analyzeParagraphs(string $content): array
    {
        $paragraphs = [];
        
        preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $content, $matches, PREG_OFFSET_CAPTURE);

        foreach ($matches[0] as $index => $match) {
            $paragraphs[] = [
                'index' => $index,
                'start' => $match[1],
                'end' => $match[1] + strlen($match[0]),
                'content' => $match[0],
                'text_length' => strlen(strip_tags($match[0]))
            ];
        }

        return $paragraphs;
    }

    /**
     * Remplace un texte par un lien (linking par correspondance)
     */
    public function linkByKeyword(
        string $content,
        string $keyword,
        string $url,
        string $lang,
        int $maxReplacements = 1
    ): string {
        $pattern = '/\b(' . preg_quote($keyword, '/') . ')\b/ui';
        $replacement = '<a href="' . htmlspecialchars($url) . '" class="auto-link">$1</a>';

        $count = 0;
        $content = preg_replace_callback($pattern, function ($matches) use ($replacement, &$count, $maxReplacements) {
            if ($count >= $maxReplacements) {
                return $matches[0];
            }
            $count++;
            return str_replace('$1', $matches[1], $replacement);
        }, $content);

        return $content;
    }

    /**
     * Supprime tous les liens automatiques d'un contenu
     */
    public function removeAutoLinks(string $content): string
    {
        // Supprimer les liens internes automatiques
        $content = preg_replace(
            '/<a[^>]*class="[^"]*internal-link[^"]*"[^>]*>(.*?)<\/a>/is',
            '$1',
            $content
        );

        // Supprimer les liens externes automatiques
        $content = preg_replace(
            '/<a[^>]*class="[^"]*external-link[^"]*"[^>]*>(.*?)<\/a>/is',
            '$1',
            $content
        );

        // Supprimer les auto-links
        $content = preg_replace(
            '/<a[^>]*class="[^"]*auto-link[^"]*"[^>]*>(.*?)<\/a>/is',
            '$1',
            $content
        );

        return $content;
    }

    /**
     * Analyse les liens présents dans un contenu
     */
    public function analyzeExistingLinks(string $content): array
    {
        $analysis = [
            'total' => 0,
            'internal' => 0,
            'external' => 0,
            'affiliate' => 0,
            'broken_html' => 0,
            'links' => []
        ];

        preg_match_all('/<a([^>]*)>(.*?)<\/a>/is', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $attributes = $match[1];
            $text = strip_tags($match[2]);

            // Extraire href
            preg_match('/href=["\']([^"\']+)["\']/', $attributes, $hrefMatch);
            $href = $hrefMatch[1] ?? '';

            // Détecter le type
            $type = 'unknown';
            if (str_contains($attributes, 'internal-link')) {
                $type = 'internal';
                $analysis['internal']++;
            } elseif (str_contains($attributes, 'external-link')) {
                $type = 'external';
                $analysis['external']++;
            } elseif (str_contains($attributes, 'affiliate-link')) {
                $type = 'affiliate';
                $analysis['affiliate']++;
            } elseif (str_starts_with($href, 'http')) {
                $type = 'external';
                $analysis['external']++;
            } else {
                $type = 'internal';
                $analysis['internal']++;
            }

            $analysis['links'][] = [
                'href' => $href,
                'text' => $text,
                'type' => $type
            ];

            $analysis['total']++;
        }

        return $analysis;
    }
}
