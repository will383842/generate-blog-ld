<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\ExternalLink;
use App\Models\LinkingRule;
use App\Models\AuthorityDomain;
use App\Models\LinkDiscoveryCache;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExternalLinkingService
{
    protected ExternalLinkDiscoveryService $discoveryService;
    protected AuthorityDomainService $authorityService;
    protected LinkPositionService $positionService;

    public function __construct(
        ExternalLinkDiscoveryService $discoveryService,
        AuthorityDomainService $authorityService,
        LinkPositionService $positionService
    ) {
        $this->discoveryService = $discoveryService;
        $this->authorityService = $authorityService;
        $this->positionService = $positionService;
    }

    /**
     * Génère les liens externes pour un article
     */
    public function generateExternalLinks(Article $article): array
    {
        $rules = LinkingRule::forPlatform($article->platform_id);
        $minLinks = $rules?->min_external_links ?? config('linking.external.min_links', 2);
        $maxLinks = $rules?->max_external_links ?? config('linking.external.max_links', 5);

        Log::info("ExternalLinkingService: Generating for article {$article->id}", [
            'min' => $minLinks,
            'max' => $maxLinks
        ]);

        $result = [
            'created' => 0,
            'deleted' => 0,
            'cached' => false,
            'sources' => []
        ];

        DB::beginTransaction();
        try {
            // Supprimer anciens liens automatiques
            $deleted = ExternalLink::where('article_id', $article->id)
                ->where('is_automatic', true)
                ->delete();
            $result['deleted'] = $deleted;

            // Récupérer liens depuis cache ou découverte
            $discoveredLinks = $this->getCachedLinks($article);
            $result['cached'] = !empty($discoveredLinks);

            // Si pas en cache, découvrir
            if (empty($discoveredLinks)) {
                $topic = $article->theme ?? $this->extractTopicFromTitle($article->title);
                $discoveredLinks = $this->discoveryService->discoverLinks(
                    $topic,
                    $article->country_code,
                    $article->language_code
                );
            }

            // Ajouter liens depuis domaines autorité pré-configurés
            $authorityLinks = $this->getAuthorityLinks($article);
            $allLinks = array_merge($discoveredLinks, $authorityLinks);

            // Sélectionner les meilleurs liens
            $selectedLinks = $this->selectBestLinks(
                $allLinks,
                $rules,
                $article->country_code,
                $article->language_code,
                $maxLinks
            );

            // Créer les liens en base
            foreach ($selectedLinks as $linkData) {
                $link = $this->createExternalLink($article, $linkData);
                if ($link) {
                    $result['created']++;
                    $result['sources'][] = $linkData['source_type'] ?? 'unknown';
                }
            }

            DB::commit();

            Log::info("ExternalLinkingService: Completed for article {$article->id}", [
                'created' => $result['created']
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("ExternalLinkingService: Failed for article {$article->id}", [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }

        return $result;
    }

    /**
     * Récupère les liens depuis le cache
     */
    public function getCachedLinks(Article $article): array
    {
        $topic = $article->theme ?? $this->extractTopicFromTitle($article->title);
        
        // findValid retourne directement l'array des liens ou null
        $cachedLinks = LinkDiscoveryCache::findValid(
            $topic,
            $article->country_code,
            $article->language_code
        );

        return $cachedLinks ?? [];
    }

    /**
     * Récupère les liens depuis les domaines autorité
     */
    protected function getAuthorityLinks(Article $article): array
    {
        $links = [];
        
        // Domaines par pays
        if ($article->country_code) {
            $countryDomains = $this->authorityService->findDomainsForCountry(
                $article->country_code,
                [$article->theme]
            );

            foreach ($countryDomains as $domain) {
                $links[] = [
                    'url' => $domain->getFullUrl(),
                    'domain' => $domain->domain,
                    'name' => $domain->name,
                    'source_type' => $domain->source_type,
                    'authority_score' => $domain->authority_score,
                    'country_code' => $domain->country_code,
                    'from_authority_db' => true
                ];
            }
        }

        // Domaines internationaux
        $internationalDomains = $this->authorityService->findInternationalDomains(
            [$article->theme]
        );

        foreach ($internationalDomains as $domain) {
            $links[] = [
                'url' => $domain->getFullUrl(),
                'domain' => $domain->domain,
                'name' => $domain->name,
                'source_type' => $domain->source_type,
                'authority_score' => $domain->authority_score,
                'country_code' => null,
                'from_authority_db' => true
            ];
        }

        return $links;
    }

    /**
     * Sélectionne les meilleurs liens
     */
    public function selectBestLinks(
        array $links,
        ?LinkingRule $rules,
        ?string $countryCode,
        string $languageCode,
        int $maxLinks
    ): array {
        if (empty($links)) {
            return [];
        }

        // Obtenir les priorités
        $priorities = $rules?->getExternalSourcePriority() 
            ?? config('linking.external.source_priority', []);

        // Scorer et trier les liens
        $scoredLinks = collect($links)->map(function ($link) use ($priorities, $countryCode, $languageCode) {
            $score = $link['authority_score'] ?? 50;

            // Bonus pour type de source prioritaire
            $sourceType = $link['source_type'] ?? 'authority';
            $priority = $priorities[$sourceType] ?? 5;
            $score += (6 - $priority) * 10; // government=50, organization=40, etc.

            // Bonus pour même pays
            if ($countryCode && ($link['country_code'] ?? null) === $countryCode) {
                $score += 20;
            }

            // Malus pour lien déjà utilisé fréquemment (éviter duplication)
            $usageCount = ExternalLink::where('url', $link['url'])->count();
            $score -= min(20, $usageCount * 2);

            $link['calculated_score'] = $score;
            return $link;
        })
        ->sortByDesc('calculated_score')
        ->values();

        // Assurer la diversité des sources
        $selected = [];
        $usedDomains = [];
        $usedTypes = [];

        foreach ($scoredLinks as $link) {
            if (count($selected) >= $maxLinks) {
                break;
            }

            $domain = $link['domain'] ?? parse_url($link['url'], PHP_URL_HOST);
            $type = $link['source_type'] ?? 'authority';

            // Éviter les doublons de domaine
            if (in_array($domain, $usedDomains)) {
                continue;
            }

            // Limiter à 2 liens du même type
            $typeCount = array_count_values($usedTypes)[$type] ?? 0;
            if ($typeCount >= 2) {
                continue;
            }

            $selected[] = $link;
            $usedDomains[] = $domain;
            $usedTypes[] = $type;
        }

        // Assurer au moins 1 lien gouvernemental si disponible
        $hasGovernment = collect($selected)->contains('source_type', 'government');
        if (!$hasGovernment && count($selected) < $maxLinks) {
            $govLink = $scoredLinks->firstWhere('source_type', 'government');
            if ($govLink && !in_array($govLink['domain'], $usedDomains)) {
                $selected[] = $govLink;
            }
        }

        return $selected;
    }

    /**
     * Crée un lien externe en base
     */
    protected function createExternalLink(Article $article, array $linkData): ?ExternalLink
    {
        $url = $linkData['url'];
        $domain = $linkData['domain'] ?? parse_url($url, PHP_URL_HOST);

        // Vérifier si le lien existe déjà pour cet article
        $existing = ExternalLink::where('article_id', $article->id)
            ->where('url', $url)
            ->first();

        if ($existing) {
            return null;
        }

        // Générer l'anchor text
        $anchorText = $this->generateAnchorText($linkData, $article->language_code);

        return ExternalLink::create([
            'article_id' => $article->id,
            'url' => $url,
            'domain' => $domain,
            'anchor_text' => $anchorText,
            'source_type' => $linkData['source_type'] ?? 'authority',
            'country_code' => $linkData['country_code'] ?? null,
            'language_code' => $article->language_code,
            'authority_score' => $linkData['authority_score'] ?? 50,
            'is_nofollow' => config('linking.external.default_nofollow', false),
            'is_sponsored' => false,
            'is_automatic' => true,
            'last_verified_at' => null,
            'is_broken' => false
        ]);
    }

    /**
     * Génère l'anchor text pour un lien externe
     */
    protected function generateAnchorText(array $linkData, string $lang): string
    {
        // Si nom fourni, l'utiliser
        if (!empty($linkData['name'])) {
            return $linkData['name'];
        }

        // Templates par langue
        $templates = [
            'fr' => ['site officiel', 'source officielle', 'consulter le site'],
            'en' => ['official website', 'official source', 'visit site'],
            'es' => ['sitio oficial', 'fuente oficial', 'visitar sitio'],
            'de' => ['offizielle Website', 'offizielle Quelle', 'Website besuchen'],
            'pt' => ['site oficial', 'fonte oficial', 'visitar site'],
            'ru' => ['официальный сайт', 'официальный источник', 'посетить сайт'],
            'zh' => ['官方网站', '官方来源', '访问网站'],
            'ar' => ['الموقع الرسمي', 'المصدر الرسمي', 'زيارة الموقع'],
            'hi' => ['आधिकारिक वेबसाइट', 'आधिकारिक स्रोत', 'साइट देखें'],
        ];

        $langTemplates = $templates[$lang] ?? $templates['en'];
        
        // Choisir selon le type de source
        $sourceType = $linkData['source_type'] ?? 'authority';
        
        if ($sourceType === 'government') {
            return $langTemplates[0]; // site officiel
        }

        return $langTemplates[array_rand($langTemplates)];
    }

    /**
     * Injecte les liens externes dans le contenu
     */
    public function insertLinksInContent(string $content, Collection $links, ?LinkingRule $rules): string
    {
        if ($links->isEmpty()) {
            return $content;
        }

        $maxPerParagraph = $rules?->max_links_per_paragraph ?? 1;

        // Trouver les points d'insertion
        $linkCount = $links->count();
        $insertionPoints = $this->positionService->findInsertionPoints($content, $linkCount);

        if (empty($insertionPoints)) {
            Log::warning("ExternalLinkingService: No insertion points found");
            return $content;
        }

        // Associer liens aux positions
        $linksArray = $links->values()->toArray();
        $insertions = [];

        foreach ($insertionPoints as $index => $point) {
            if (!isset($linksArray[$index])) {
                break;
            }

            $insertions[] = [
                'position' => $point['position'],
                'paragraph_index' => $point['paragraph_index'],
                'link' => $linksArray[$index]
            ];
        }

        // Trier par position décroissante (pour ne pas décaler les index)
        usort($insertions, fn($a, $b) => $b['position'] <=> $a['position']);

        // Injecter les liens
        foreach ($insertions as $insertion) {
            $link = $insertion['link'];
            $html = $this->generateLinkHtml($link);
            
            // Trouver la fin de phrase pour insertion naturelle
            $pos = $insertion['position'];
            $sentenceEnd = $this->positionService->findSentenceEnd($content, $pos);
            
            // Insérer après le point
            $content = substr($content, 0, $sentenceEnd) . ' ' . $html . substr($content, $sentenceEnd);
        }

        return $content;
    }

    /**
     * Génère le HTML d'un lien externe
     */
    protected function generateLinkHtml(ExternalLink $link): string
    {
        $attributes = [
            'href' => $link->url,
            'class' => 'external-link'
        ];

        // target="_blank" toujours
        if (config('linking.external.target_blank', true)) {
            $attributes['target'] = '_blank';
        }

        // rel attributes
        $rel = [];
        if (config('linking.external.noopener', true)) {
            $rel[] = 'noopener';
        }
        if ($link->is_nofollow) {
            $rel[] = 'nofollow';
        }
        if ($link->is_sponsored) {
            $rel[] = 'sponsored';
        }
        if (!empty($rel)) {
            $attributes['rel'] = implode(' ', $rel);
        }

        // title attribute
        if (config('linking.external.add_title_attribute', true) && $link->domain) {
            $attributes['title'] = "Visit {$link->domain}";
        }

        // Construire le HTML
        $attrString = collect($attributes)
            ->map(fn($value, $key) => "{$key}=\"" . htmlspecialchars($value) . "\"")
            ->implode(' ');

        return "<a {$attrString}>" . htmlspecialchars($link->anchor_text) . "</a>";
    }

    /**
     * Vérifie tous les liens externes d'un article
     */
    public function verifyArticleLinks(Article $article): array
    {
        $links = ExternalLink::where('article_id', $article->id)->get();
        $results = [
            'total' => $links->count(),
            'valid' => 0,
            'broken' => 0,
            'errors' => []
        ];

        foreach ($links as $link) {
            try {
                $isValid = $link->verify();
                if ($isValid) {
                    $results['valid']++;
                } else {
                    $results['broken']++;
                    $results['errors'][] = [
                        'url' => $link->url,
                        'status' => 'broken'
                    ];
                }
            } catch (\Exception $e) {
                $results['broken']++;
                $results['errors'][] = [
                    'url' => $link->url,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Récupère les statistiques de liens externes par plateforme
     */
    public function getStats(int $platformId): array
    {
        $links = ExternalLink::whereHas('article', function ($q) use ($platformId) {
            $q->where('platform_id', $platformId);
        });

        return [
            'total' => $links->count(),
            'by_type' => $links->get()->groupBy('source_type')->map->count(),
            'by_country' => $links->get()->groupBy('country_code')->map->count(),
            'broken' => $links->where('is_broken', true)->count(),
            'not_verified' => $links->whereNull('last_verified_at')->count(),
            'average_authority' => round($links->avg('authority_score') ?? 0, 1)
        ];
    }

    /**
     * Extrait le topic principal depuis le titre de l'article
     */
    protected function extractTopicFromTitle(string $title): string
    {
        // Retirer les préfixes communs
        $prefixes = [
            'Guide complet', 'Comment', 'How to', 'Qu\'est-ce que',
            'What is', 'Todo sobre', 'Guía de', 'Le guide de',
        ];
        
        $topic = $title;
        foreach ($prefixes as $prefix) {
            if (stripos($topic, $prefix) === 0) {
                $topic = trim(substr($topic, strlen($prefix)));
                break;
            }
        }
        
        // Retirer les suffixes (années, etc.)
        $topic = preg_replace('/\s*[-–]\s*\d{4}.*$/', '', $topic);
        $topic = preg_replace('/\s*\(\d{4}\).*$/', '', $topic);
        
        // Garder les premiers mots significatifs (max 5)
        $words = preg_split('/\s+/', $topic);
        $topic = implode(' ', array_slice($words, 0, 5));
        
        return trim($topic) ?: 'general';
    }
}
