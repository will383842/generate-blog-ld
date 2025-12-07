<?php

namespace App\Services\Linking;

use App\Models\LinkingRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class UniformDistributionService
{
    protected LinkPositionService $positionService;

    public function __construct(LinkPositionService $positionService)
    {
        $this->positionService = $positionService;
    }

    /**
     * Distribue les liens uniformément dans le contenu
     */
    public function distributeLinks(
        string $content,
        Collection $internalLinks,
        Collection $externalLinks,
        ?LinkingRule $rules = null
    ): string {
        $maxPerParagraph = $rules?->max_links_per_paragraph ?? config('linking.internal.max_per_paragraph', 1);
        $excludeIntro = $rules?->exclude_intro ?? config('linking.internal.exclude_zones.intro', true);
        $excludeConclusion = $rules?->exclude_conclusion ?? config('linking.internal.exclude_zones.conclusion', true);

        // Analyser la structure du contenu
        $structure = $this->analyzeContentStructure($content);
        
        if (empty($structure['paragraphs'])) {
            Log::warning("UniformDistributionService: No paragraphs found in content");
            return $content;
        }

        // Combiner tous les liens
        $allLinks = $this->mergeAndPrioritizeLinks($internalLinks, $externalLinks);
        
        if ($allLinks->isEmpty()) {
            return $content;
        }

        // Calculer les zones disponibles
        $availableZones = $this->calculateAvailableZones(
            $structure,
            $excludeIntro,
            $excludeConclusion
        );

        // Distribuer uniformément
        $distribution = $this->calculateUniformDistribution(
            $allLinks->count(),
            $availableZones,
            $maxPerParagraph
        );

        // Injecter les liens
        $content = $this->injectLinksAtPositions($content, $allLinks, $distribution, $structure);

        return $content;
    }

    /**
     * Analyse la structure du contenu HTML
     */
    public function analyzeContentStructure(string $content): array
    {
        $structure = [
            'paragraphs' => [],
            'headings' => [],
            'lists' => [],
            'total_length' => strlen($content),
            'word_count' => str_word_count(strip_tags($content))
        ];

        // Trouver les paragraphes
        preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $content, $matches, PREG_OFFSET_CAPTURE);
        
        foreach ($matches[0] as $index => $match) {
            $paragraphContent = $matches[1][$index][0];
            $wordCount = str_word_count(strip_tags($paragraphContent));
            
            $structure['paragraphs'][] = [
                'index' => $index,
                'start' => $match[1],
                'end' => $match[1] + strlen($match[0]),
                'length' => strlen($match[0]),
                'word_count' => $wordCount,
                'has_links' => preg_match('/<a\s/i', $paragraphContent) === 1,
                'content' => $paragraphContent
            ];
        }

        // Trouver les titres
        preg_match_all('/<h([1-6])[^>]*>(.*?)<\/h\1>/is', $content, $headingMatches, PREG_OFFSET_CAPTURE);
        
        foreach ($headingMatches[0] as $index => $match) {
            $structure['headings'][] = [
                'level' => $headingMatches[1][$index][0],
                'position' => $match[1],
                'text' => strip_tags($headingMatches[2][$index][0])
            ];
        }

        return $structure;
    }

    /**
     * Calcule les zones disponibles pour l'injection
     */
    protected function calculateAvailableZones(
        array $structure,
        bool $excludeIntro,
        bool $excludeConclusion
    ): array {
        $paragraphs = $structure['paragraphs'];
        $available = [];

        $totalParagraphs = count($paragraphs);
        
        foreach ($paragraphs as $index => $paragraph) {
            // Exclure l'introduction (premier paragraphe)
            if ($excludeIntro && $index === 0) {
                continue;
            }

            // Exclure la conclusion (dernier paragraphe)
            if ($excludeConclusion && $index === $totalParagraphs - 1) {
                continue;
            }

            // Exclure les paragraphes trop courts (moins de 20 mots)
            if ($paragraph['word_count'] < 20) {
                continue;
            }

            // Exclure les paragraphes avec déjà trop de liens
            if ($paragraph['has_links']) {
                // Compter les liens existants
                $existingLinks = preg_match_all('/<a\s/i', $paragraph['content']);
                if ($existingLinks >= 2) {
                    continue;
                }
            }

            $available[] = $paragraph;
        }

        return $available;
    }

    /**
     * Calcule la distribution uniforme des liens
     */
    public function calculateUniformDistribution(
        int $linkCount,
        array $availableZones,
        int $maxPerParagraph
    ): array {
        $distribution = [];
        $zoneCount = count($availableZones);

        if ($zoneCount === 0 || $linkCount === 0) {
            return [];
        }

        // Si moins de zones que de liens, on met max_per_paragraph dans chaque zone
        if ($zoneCount <= $linkCount) {
            $linksPerZone = min($maxPerParagraph, ceil($linkCount / $zoneCount));
            $remaining = $linkCount;

            foreach ($availableZones as $zone) {
                $linksForThisZone = min($linksPerZone, $remaining);
                
                for ($i = 0; $i < $linksForThisZone; $i++) {
                    $distribution[] = [
                        'paragraph_index' => $zone['index'],
                        'paragraph_start' => $zone['start'],
                        'paragraph_end' => $zone['end'],
                        'position_in_paragraph' => $this->calculatePositionInParagraph($zone, $i, $linksForThisZone)
                    ];
                    $remaining--;
                }

                if ($remaining <= 0) break;
            }
        } else {
            // Plus de zones que de liens: distribuer uniformément
            $step = $zoneCount / $linkCount;
            
            for ($i = 0; $i < $linkCount; $i++) {
                $zoneIndex = (int) floor($i * $step);
                $zone = $availableZones[$zoneIndex];
                
                $distribution[] = [
                    'paragraph_index' => $zone['index'],
                    'paragraph_start' => $zone['start'],
                    'paragraph_end' => $zone['end'],
                    'position_in_paragraph' => $this->calculatePositionInParagraph($zone, 0, 1)
                ];
            }
        }

        return $distribution;
    }

    /**
     * Calcule la position d'insertion dans un paragraphe
     */
    protected function calculatePositionInParagraph(array $zone, int $linkIndex, int $totalLinksInZone): float
    {
        // Diviser le paragraphe en sections égales
        $sectionSize = 1 / ($totalLinksInZone + 1);
        return $sectionSize * ($linkIndex + 1);
    }

    /**
     * Fusionne et priorise les liens internes et externes
     */
    protected function mergeAndPrioritizeLinks(Collection $internal, Collection $external): Collection
    {
        $merged = collect();

        // Ajouter les liens internes avec leurs métadonnées
        foreach ($internal as $link) {
            $merged->push([
                'type' => 'internal',
                'link' => $link,
                'priority' => $this->calculateLinkPriority($link, 'internal'),
                'html' => $this->generateInternalLinkHtml($link)
            ]);
        }

        // Ajouter les liens externes
        foreach ($external as $link) {
            $merged->push([
                'type' => 'external',
                'link' => $link,
                'priority' => $this->calculateLinkPriority($link, 'external'),
                'html' => $this->generateExternalLinkHtml($link)
            ]);
        }

        // Trier par priorité et mélanger pour variété
        return $merged->sortByDesc('priority')->values();
    }

    /**
     * Calcule la priorité d'un lien
     */
    protected function calculateLinkPriority($link, string $type): int
    {
        $priority = 50;

        if ($type === 'internal') {
            // Priorité basée sur le contexte
            if ($link->link_context === 'article_to_pillar') {
                $priority += 20;
            } elseif ($link->link_context === 'pillar_to_article') {
                $priority += 15;
            }
            
            // Bonus pour relevance score élevé
            $priority += ($link->relevance_score ?? 50) / 5;
        } else {
            // Liens externes: priorité par type de source
            $typePriority = [
                'government' => 30,
                'organization' => 25,
                'reference' => 20,
                'news' => 15,
                'authority' => 10
            ];
            $priority += $typePriority[$link->source_type] ?? 10;
            
            // Bonus pour authority score
            $priority += ($link->authority_score ?? 50) / 5;
        }

        return $priority;
    }

    /**
     * Injecte les liens aux positions calculées
     */
    protected function injectLinksAtPositions(
        string $content,
        Collection $links,
        array $distribution,
        array $structure
    ): string {
        if (empty($distribution)) {
            return $content;
        }

        // Trier par position décroissante pour ne pas décaler les indices
        $distribution = collect($distribution)->sortByDesc('paragraph_start')->values()->toArray();
        $links = $links->values();

        foreach ($distribution as $index => $position) {
            if (!isset($links[$index])) {
                break;
            }

            $linkData = $links[$index];
            $paragraph = $structure['paragraphs'][$position['paragraph_index']] ?? null;

            if (!$paragraph) {
                continue;
            }

            // Trouver le point d'insertion dans le paragraphe
            $insertPosition = $this->findBestInsertPosition(
                $content,
                $paragraph,
                $position['position_in_paragraph']
            );

            if ($insertPosition === null) {
                continue;
            }

            // Insérer le lien
            $linkHtml = ' ' . $linkData['html'] . ' ';
            $content = substr($content, 0, $insertPosition) . $linkHtml . substr($content, $insertPosition);
        }

        return $content;
    }

    /**
     * Trouve le meilleur point d'insertion
     */
    protected function findBestInsertPosition(string $content, array $paragraph, float $relativePosition): ?int
    {
        $paragraphContent = substr($content, $paragraph['start'], $paragraph['length']);
        $targetPosition = (int) ($paragraph['length'] * $relativePosition);

        // Chercher la fin de phrase la plus proche
        $sentenceEnds = [];
        preg_match_all('/[.!?]\s+(?=[A-ZÀ-Ý])|[.!?](?=<\/p>)/u', $paragraphContent, $matches, PREG_OFFSET_CAPTURE);

        foreach ($matches[0] as $match) {
            $sentenceEnds[] = $match[1] + strlen($match[0]);
        }

        if (empty($sentenceEnds)) {
            // Pas de fin de phrase trouvée, utiliser le milieu
            return $paragraph['start'] + $targetPosition;
        }

        // Trouver la fin de phrase la plus proche de la position cible
        $bestPosition = $sentenceEnds[0];
        $minDistance = abs($targetPosition - $bestPosition);

        foreach ($sentenceEnds as $pos) {
            $distance = abs($targetPosition - $pos);
            if ($distance < $minDistance) {
                $minDistance = $distance;
                $bestPosition = $pos;
            }
        }

        return $paragraph['start'] + $bestPosition;
    }

    /**
     * Génère le HTML d'un lien interne
     */
    protected function generateInternalLinkHtml($link): string
    {
        $url = $link->targetArticle?->url ?? route('articles.show', $link->targetArticle?->slug ?? '');
        $anchor = htmlspecialchars($link->anchor_text);
        $title = htmlspecialchars($link->targetArticle?->title ?? '');

        return "<a href=\"{$url}\" class=\"internal-link\" title=\"{$title}\">{$anchor}</a>";
    }

    /**
     * Génère le HTML d'un lien externe
     */
    protected function generateExternalLinkHtml($link): string
    {
        $url = htmlspecialchars($link->url);
        $anchor = htmlspecialchars($link->anchor_text);
        
        $rel = 'noopener';
        if ($link->is_nofollow) $rel .= ' nofollow';
        if ($link->is_sponsored) $rel .= ' sponsored';

        return "<a href=\"{$url}\" target=\"_blank\" rel=\"{$rel}\" class=\"external-link\">{$anchor}</a>";
    }

    /**
     * Vérifie si la distribution est uniforme
     */
    public function validateDistribution(string $content): array
    {
        $structure = $this->analyzeContentStructure($content);
        $linksPerParagraph = [];

        foreach ($structure['paragraphs'] as $para) {
            $linkCount = preg_match_all('/<a\s/i', $para['content']);
            $linksPerParagraph[$para['index']] = $linkCount;
        }

        $values = array_values($linksPerParagraph);
        $max = max($values) ?: 0;
        $min = min($values) ?: 0;
        $variance = $this->calculateVariance($values);

        return [
            'is_uniform' => $variance < 0.5,
            'min_per_paragraph' => $min,
            'max_per_paragraph' => $max,
            'variance' => round($variance, 3),
            'distribution' => $linksPerParagraph
        ];
    }

    /**
     * Calcule la variance
     */
    protected function calculateVariance(array $values): float
    {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $squaredDiffs = array_map(fn($v) => pow($v - $mean, 2), $values);
        
        return array_sum($squaredDiffs) / count($values);
    }
}
