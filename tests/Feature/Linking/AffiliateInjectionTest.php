<?php

namespace Tests\Feature\Linking;

use App\Models\Article;
use App\Models\AffiliateLink;
use App\Models\Platform;
use App\Services\Linking\AffiliateLinkService;
use App\Services\Linking\LinkPositionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AffiliateInjectionTest extends TestCase
{
    use RefreshDatabase;

    protected AffiliateLinkService $service;
    protected Platform $platform;
    protected Article $article;

    protected function setUp(): void
    {
        parent::setUp();

        $this->platform = Platform::factory()->create();
        $this->article = Article::factory()->create([
            'platform_id' => $this->platform->id,
            'country_code' => 'FR',
            'language_code' => 'fr',
            'theme' => 'visa',
            'title' => 'Guide visa France',
            'content' => '<p>Introduction.</p><p>Les démarches administratives sont importantes pour votre expatriation.</p><p>Conclusion.</p>',
            'status' => 'published',
        ]);

        // Créer des liens affiliés
        AffiliateLink::create([
            'platform_id' => $this->platform->id,
            'service_name' => 'VisaService Pro',
            'service_slug' => 'visaservice-pro',
            'tracking_url' => 'https://affiliate.example.com/track/visa',
            'commission_rate' => 15.0,
            'commission_type' => 'percentage',
            'country_codes' => ['FR', 'DE', 'ES'],
            'language_codes' => ['fr', 'en'],
            'themes' => ['visa', 'immigration'],
            'custom_anchors' => [
                'fr' => ['VisaService Pro', 'Obtenez votre visa facilement'],
                'en' => ['VisaService Pro', 'Get your visa easily'],
            ],
            'priority' => 10,
            'is_active' => true,
        ]);

        AffiliateLink::create([
            'platform_id' => $this->platform->id,
            'service_name' => 'Expat Insurance',
            'service_slug' => 'expat-insurance',
            'tracking_url' => 'https://affiliate.example.com/track/insurance',
            'commission_rate' => 12.0,
            'commission_type' => 'percentage',
            'country_codes' => null, // Tous pays
            'language_codes' => ['fr', 'en', 'es'],
            'themes' => ['insurance', 'health'],
            'priority' => 5,
            'is_active' => true,
        ]);

        AffiliateLink::create([
            'platform_id' => $this->platform->id,
            'service_name' => 'Inactive Service',
            'service_slug' => 'inactive',
            'tracking_url' => 'https://affiliate.example.com/track/inactive',
            'commission_rate' => 20.0,
            'is_active' => false,
        ]);

        $this->service = new AffiliateLinkService(
            app(LinkPositionService::class)
        );
    }

    public function test_injects_affiliate_links_for_article()
    {
        $result = $this->service->injectAffiliateLinks($this->article);

        $this->assertArrayHasKey('injected', $result);
        $this->assertGreaterThanOrEqual(1, $result['injected']);
    }

    public function test_respects_max_per_article_limit()
    {
        config(['linking.affiliate.max_per_article' => 1]);

        $result = $this->service->injectAffiliateLinks($this->article);

        $count = DB::table('article_affiliate_links')
            ->where('article_id', $this->article->id)
            ->count();

        $this->assertLessThanOrEqual(1, $count);
    }

    public function test_filters_by_country()
    {
        $result = $this->service->injectAffiliateLinks($this->article);

        // L'article est FR, donc seuls les liens compatibles FR sont injectés
        $injectedIds = DB::table('article_affiliate_links')
            ->where('article_id', $this->article->id)
            ->pluck('affiliate_link_id');

        foreach ($injectedIds as $id) {
            $link = AffiliateLink::find($id);
            if ($link->country_codes) {
                $this->assertContains('FR', $link->country_codes);
            }
        }
    }

    public function test_filters_by_language()
    {
        $result = $this->service->injectAffiliateLinks($this->article);

        $injectedIds = DB::table('article_affiliate_links')
            ->where('article_id', $this->article->id)
            ->pluck('affiliate_link_id');

        foreach ($injectedIds as $id) {
            $link = AffiliateLink::find($id);
            if ($link->language_codes) {
                $this->assertContains('fr', $link->language_codes);
            }
        }
    }

    public function test_filters_by_theme()
    {
        $relevantLinks = $this->service->findRelevantAffiliateLinks($this->article);

        // Le premier lien (visa theme) devrait être prioritaire
        $hasVisaThemeLink = $relevantLinks->contains(function ($link) {
            return $link->themes && in_array('visa', $link->themes);
        });

        $this->assertTrue($hasVisaThemeLink);
    }

    public function test_excludes_inactive_links()
    {
        $relevantLinks = $this->service->findRelevantAffiliateLinks($this->article);

        $hasInactive = $relevantLinks->contains(function ($link) {
            return $link->service_slug === 'inactive';
        });

        $this->assertFalse($hasInactive);
    }

    public function test_uses_correct_anchor_for_language()
    {
        $this->service->injectAffiliateLinks($this->article);

        $association = DB::table('article_affiliate_links')
            ->where('article_id', $this->article->id)
            ->first();

        if ($association) {
            $link = AffiliateLink::find($association->affiliate_link_id);
            
            // L'anchor devrait être en français
            $frAnchors = $link->custom_anchors['fr'] ?? [];
            
            if (!empty($frAnchors)) {
                $this->assertContains($association->anchor_text, $frAnchors);
            }
        }
    }

    public function test_does_not_duplicate_injections()
    {
        // Première injection
        $this->service->injectAffiliateLinks($this->article);
        $countFirst = DB::table('article_affiliate_links')
            ->where('article_id', $this->article->id)
            ->count();

        // Deuxième injection
        $this->service->injectAffiliateLinks($this->article);
        $countSecond = DB::table('article_affiliate_links')
            ->where('article_id', $this->article->id)
            ->count();

        $this->assertEquals($countFirst, $countSecond);
    }

    public function test_inserts_links_in_content()
    {
        $this->service->injectAffiliateLinks($this->article);

        $updatedContent = $this->service->insertLinksInContent(
            $this->article->content,
            $this->article
        );

        // Vérifier que du contenu affilié a été ajouté
        $hasAffiliateClass = strpos($updatedContent, 'affiliate-link') !== false ||
                            strpos($updatedContent, 'sponsored') !== false;

        $this->assertTrue($hasAffiliateClass);
    }

    public function test_affiliate_links_have_sponsored_attribute()
    {
        config(['linking.affiliate.sponsored_attribute' => true]);

        $this->service->injectAffiliateLinks($this->article);

        $content = $this->service->insertLinksInContent(
            $this->article->content,
            $this->article
        );

        // Les liens affiliés doivent avoir rel="sponsored"
        if (strpos($content, 'affiliate-link') !== false) {
            $this->assertStringContainsString('sponsored', $content);
        }
    }

    public function test_prioritizes_higher_commission_links()
    {
        $selected = $this->service->selectBestLinks(
            $this->service->findRelevantAffiliateLinks($this->article),
            $this->article,
            2
        );

        if ($selected->count() >= 2) {
            // Le lien avec la commission la plus élevée devrait être en premier ou avoir un score élevé
            $first = $selected->first();
            $this->assertGreaterThanOrEqual(10, $first['calculated_score'] ?? $first->commission_rate);
        }
    }

    public function test_gets_affiliate_stats()
    {
        $this->service->injectAffiliateLinks($this->article);

        $stats = $this->service->getAffiliateStats($this->platform->id);

        $this->assertArrayHasKey('total_links', $stats);
        $this->assertArrayHasKey('active_links', $stats);
        $this->assertArrayHasKey('total_insertions', $stats);
        $this->assertArrayHasKey('average_commission', $stats);
    }

    public function test_handles_expired_affiliate_links()
    {
        // Créer un lien expiré
        AffiliateLink::create([
            'platform_id' => $this->platform->id,
            'service_name' => 'Expired Service',
            'service_slug' => 'expired',
            'tracking_url' => 'https://affiliate.example.com/track/expired',
            'commission_rate' => 25.0,
            'themes' => ['visa'],
            'is_active' => true,
            'expires_at' => now()->subDay(),
        ]);

        $relevantLinks = $this->service->findRelevantAffiliateLinks($this->article);

        $hasExpired = $relevantLinks->contains(function ($link) {
            return $link->service_slug === 'expired';
        });

        $this->assertFalse($hasExpired);
    }

    public function test_handles_future_start_affiliate_links()
    {
        AffiliateLink::create([
            'platform_id' => $this->platform->id,
            'service_name' => 'Future Service',
            'service_slug' => 'future',
            'tracking_url' => 'https://affiliate.example.com/track/future',
            'commission_rate' => 30.0,
            'themes' => ['visa'],
            'is_active' => true,
            'starts_at' => now()->addDay(),
        ]);

        $relevantLinks = $this->service->findRelevantAffiliateLinks($this->article);

        $hasFuture = $relevantLinks->contains(function ($link) {
            return $link->service_slug === 'future';
        });

        $this->assertFalse($hasFuture);
    }
}
