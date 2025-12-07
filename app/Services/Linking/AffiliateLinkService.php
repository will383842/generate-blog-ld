<?php

namespace App\Services\Linking;

use App\Models\Article;
use App\Models\AffiliateLink;
use App\Models\LinkingRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AffiliateLinkService
{
    protected LinkPositionService $positionService;

    public function __construct(LinkPositionService $positionService)
    {
        $this->positionService = $positionService;
    }

    /**
     * Injecte les liens affiliés pertinents dans un article
     */
    public function injectAffiliateLinks(Article $article): array
    {
        if (!config('linking.affiliate.auto_injection', true)) {
            return ['injected' => 0, 'skipped' => 'Auto-injection disabled'];
        }

        $rules = LinkingRule::forPlatform($article->platform_id);
        $maxLinks = $rules?->max_affiliate_links ?? config('linking.affiliate.max_per_article', 3);

        Log::info("AffiliateLinkService: Injecting for article {$article->id}", [
            'max_links' => $maxLinks
        ]);

        // Trouver les liens affiliés pertinents
        $affiliateLinks = $this->findRelevantAffiliateLinks($article, $maxLinks);

        if ($affiliateLinks->isEmpty()) {
            return ['injected' => 0, 'reason' => 'No relevant affiliate links found'];
        }

        $result = [
            'injected' => 0,
            'links' => []
        ];

        DB::beginTransaction();
        try {
            // Trouver les positions d'injection
            $positions = $this->positionService->findInsertionPoints(
                $article->content,
                $affiliateLinks->count()
            );

            // Injecter dans le contenu
            $content = $article->content;
            $injected = [];

            foreach ($affiliateLinks as $index => $affiliate) {
                if (!isset($positions[$index])) {
                    break;
                }

                $linkHtml = $this->generateAffiliateLinkHtml($affiliate, $article->language_code);
                $position = $positions[$index]['position'];

                // Trouver la fin de phrase pour insertion naturelle
                $sentenceEnd = $this->positionService->findSentenceEnd($content, $position);
                
                // Wrapper avec texte contextuel
                $wrapper = $this->generateContextWrapper($affiliate, $article->language_code);
                $fullInsertion = ' ' . $wrapper['before'] . $linkHtml . $wrapper['after'];

                $content = substr($content, 0, $sentenceEnd) . $fullInsertion . substr($content, $sentenceEnd);

                $injected[] = [
                    'affiliate_id' => $affiliate->id,
                    'service' => $affiliate->service_name,
                    'position' => $sentenceEnd
                ];

                $result['injected']++;
            }

            // Mettre à jour le contenu
            $article->update(['content' => $content]);

            // Logger les injections
            foreach ($injected as $injection) {
                $this->logInjection($article, $injection['affiliate_id']);
            }

            $result['links'] = $injected;

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("AffiliateLinkService: Injection failed", [
                'article_id' => $article->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }

        return $result;
    }

    /**
     * Trouve les liens affiliés pertinents pour un article
     */
    public function findRelevantAffiliateLinks(Article $article, int $limit = 3): Collection
    {
        // Récupérer les liens affiliés actifs pour la plateforme
        $query = AffiliateLink::where('platform_id', $article->platform_id)
            ->where('is_active', true);

        // Filtrer par pays si applicable
        if ($article->country_code) {
            $query->where(function ($q) use ($article) {
                $q->whereNull('countries')
                    ->orWhereJsonContains('countries', $article->country_code);
            });
        }

        // Filtrer par thème/catégorie si applicable
        if ($article->theme) {
            $query->where(function ($q) use ($article) {
                $q->whereNull('themes')
                    ->orWhereJsonContains('themes', $article->theme);
            });
        }

        // Filtrer par langue
        $query->where(function ($q) use ($article) {
            $q->whereNull('languages')
                ->orWhereJsonContains('languages', $article->language_code);
        });

        // Exclure les liens déjà injectés récemment dans cet article
        $recentlyInjected = DB::table('affiliate_link_injections')
            ->where('article_id', $article->id)
            ->where('created_at', '>', now()->subDays(30))
            ->pluck('affiliate_link_id');

        if ($recentlyInjected->isNotEmpty()) {
            $query->whereNotIn('id', $recentlyInjected);
        }

        // Trier par priorité et performance
        $query->orderBy('priority', 'desc')
            ->orderBy('conversion_rate', 'desc');

        return $query->limit($limit)->get();
    }

    /**
     * Génère le HTML d'un lien affilié
     */
    protected function generateAffiliateLinkHtml(AffiliateLink $affiliate, string $lang): string
    {
        $anchorText = $this->getAnchorText($affiliate, $lang);
        
        $attributes = [
            'href' => $affiliate->getTrackedUrl(),
            'class' => 'affiliate-link',
            'target' => '_blank',
            'rel' => 'sponsored noopener'
        ];

        // Ajouter data attributes pour tracking
        $attributes['data-affiliate'] = $affiliate->service_name;
        $attributes['data-campaign'] = $affiliate->campaign_id ?? 'default';

        $attrString = collect($attributes)
            ->map(fn($value, $key) => "{$key}=\"" . htmlspecialchars($value) . "\"")
            ->implode(' ');

        return "<a {$attrString}>{$anchorText}</a>";
    }

    /**
     * Récupère l'anchor text approprié
     */
    protected function getAnchorText(AffiliateLink $affiliate, string $lang): string
    {
        // Anchor personnalisé par langue
        $customAnchors = $affiliate->anchor_texts ?? [];
        if (isset($customAnchors[$lang])) {
            $anchors = $customAnchors[$lang];
            return $anchors[array_rand($anchors)];
        }

        // Templates par défaut
        $templates = config('linking.affiliate.default_anchors', []);
        $langTemplates = $templates[$lang] ?? $templates['en'] ?? ['{service}'];

        $template = $langTemplates[array_rand($langTemplates)];
        return str_replace('{service}', $affiliate->service_name, $template);
    }

    /**
     * Génère le wrapper contextuel
     */
    protected function generateContextWrapper(AffiliateLink $affiliate, string $lang): array
    {
        $wrappers = [
            'fr' => [
                ['before' => 'Nous recommandons ', 'after' => ' pour une expérience optimale.'],
                ['before' => 'Découvrez ', 'after' => ', une solution éprouvée.'],
                ['before' => 'Pour cela, ', 'after' => ' peut vous aider.'],
            ],
            'en' => [
                ['before' => 'We recommend ', 'after' => ' for the best experience.'],
                ['before' => 'Check out ', 'after' => ', a proven solution.'],
                ['before' => 'For this, ', 'after' => ' can help you.'],
            ],
            'es' => [
                ['before' => 'Recomendamos ', 'after' => ' para una experiencia óptima.'],
                ['before' => 'Descubre ', 'after' => ', una solución probada.'],
            ],
            'de' => [
                ['before' => 'Wir empfehlen ', 'after' => ' für das beste Erlebnis.'],
                ['before' => 'Entdecken Sie ', 'after' => ', eine bewährte Lösung.'],
            ],
        ];

        $langWrappers = $wrappers[$lang] ?? $wrappers['en'];
        return $langWrappers[array_rand($langWrappers)];
    }

    /**
     * Log l'injection pour tracking
     */
    protected function logInjection(Article $article, int $affiliateLinkId): void
    {
        DB::table('affiliate_link_injections')->insert([
            'article_id' => $article->id,
            'affiliate_link_id' => $affiliateLinkId,
            'created_at' => now()
        ]);
    }

    /**
     * Récupère les statistiques d'affiliation
     */
    public function getStats(int $platformId): array
    {
        $affiliateLinks = AffiliateLink::where('platform_id', $platformId)->get();

        $totalInjections = DB::table('affiliate_link_injections')
            ->whereIn('affiliate_link_id', $affiliateLinks->pluck('id'))
            ->count();

        return [
            'total_affiliate_links' => $affiliateLinks->count(),
            'active_links' => $affiliateLinks->where('is_active', true)->count(),
            'total_injections' => $totalInjections,
            'by_service' => $affiliateLinks->groupBy('service_name')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'active' => $group->where('is_active', true)->count()
                ];
            })->toArray(),
            'top_performers' => $affiliateLinks
                ->sortByDesc('conversion_rate')
                ->take(5)
                ->map(fn($a) => [
                    'service' => $a->service_name,
                    'conversion_rate' => $a->conversion_rate
                ])
                ->values()
                ->toArray()
        ];
    }

    /**
     * Crée un nouveau lien affilié
     */
    public function createAffiliateLink(array $data): AffiliateLink
    {
        return AffiliateLink::create([
            'platform_id' => $data['platform_id'],
            'service_name' => $data['service_name'],
            'base_url' => $data['base_url'],
            'affiliate_code' => $data['affiliate_code'],
            'tracking_params' => $data['tracking_params'] ?? [],
            'countries' => $data['countries'] ?? null,
            'themes' => $data['themes'] ?? null,
            'languages' => $data['languages'] ?? null,
            'anchor_texts' => $data['anchor_texts'] ?? null,
            'priority' => $data['priority'] ?? 50,
            'commission_rate' => $data['commission_rate'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * Supprime les liens affiliés d'un article
     */
    public function removeAffiliateLinks(Article $article): int
    {
        $content = $article->content;
        
        // Pattern pour trouver les liens affiliés
        $pattern = '/<a[^>]*class="[^"]*affiliate-link[^"]*"[^>]*>.*?<\/a>/is';
        
        $count = preg_match_all($pattern, $content);
        $content = preg_replace($pattern, '', $content);
        
        // Nettoyer les wrappers vides
        $content = preg_replace('/\s*Nous recommandons\s*pour une expérience optimale\.\s*/u', ' ', $content);
        $content = preg_replace('/\s*We recommend\s*for the best experience\.\s*/u', ' ', $content);
        
        $article->update(['content' => $content]);

        // Supprimer les logs d'injection
        DB::table('affiliate_link_injections')
            ->where('article_id', $article->id)
            ->delete();

        return $count;
    }

    /**
     * Vérifie si un article a des liens affiliés
     */
    public function hasAffiliateLinks(Article $article): bool
    {
        return str_contains($article->content, 'affiliate-link');
    }

    /**
     * Compte les liens affiliés dans un article
     */
    public function countAffiliateLinks(Article $article): int
    {
        return preg_match_all('/class="[^"]*affiliate-link[^"]*"/', $article->content);
    }
}
