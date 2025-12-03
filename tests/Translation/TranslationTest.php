<?php

namespace Tests\Unit\Services\Translation;

use Tests\TestCase;
use App\Services\Translation\TranslationService;
use App\Services\Translation\SlugService;
use App\Services\Translation\EncodingValidator;
use App\Services\Translation\TranslationManager;
use App\Services\AI\GptService;
use App\Services\AI\CostTracker;
use App\Models\Article;
use App\Models\Language;
use App\Models\Platform;
use App\Models\Country;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Tests de traduction multi-langues
 * Phase 7 : Jour 7-3
 */
class TranslationTest extends TestCase
{
    use RefreshDatabase;

    protected TranslationService $translationService;
    protected SlugService $slugService;
    protected EncodingValidator $encodingValidator;
    protected TranslationManager $translationManager;

    protected function setUp(): void
    {
        parent::setUp();

        // Initialisation des services
        $this->slugService = new SlugService();
        $this->encodingValidator = new EncodingValidator();
        
        // Note: En production, ces services utilisent vraiment l'API
        // Pour les tests, on pourrait mocker les appels API
        $this->translationService = app(TranslationService::class);
        $this->translationManager = app(TranslationManager::class);

        // Seed des langues
        $this->seedLanguages();
    }

    // =========================================================================
    // TESTS SLUGSERVICE
    // =========================================================================

    /** @test */
    public function it_generates_latin_slugs_for_standard_text()
    {
        $title = "Guide complet pour expatriés en France";
        $slug = $this->slugService->generateSlug($title, 'fr');

        $this->assertEquals('guide-complet-pour-expatries-en-france', $slug);
    }

    /** @test */
    public function it_transliterates_cyrillic_to_latin()
    {
        $russianText = "Привет мир";
        $result = $this->slugService->cyrillicToLatin($russianText);

        $this->assertStringContainsString('Privet', $result);
        $this->assertStringContainsString('mir', $result);
        $this->assertDoesNotMatchRegularExpression('/[А-Яа-я]/u', $result);
    }

    /** @test */
    public function it_generates_slugs_for_russian_titles()
    {
        $title = "Работа для иностранцев";
        $slug = $this->slugService->generateSlug($title, 'ru');

        // Doit être en latin après translittération
        $this->assertMatchesRegularExpression('/^[a-z0-9\-]+$/', $slug);
        $this->assertDoesNotMatchRegularExpression('/[А-Яа-я]/u', $slug);
    }

    /** @test */
    public function it_transliterates_chinese_to_pinyin()
    {
        $chineseText = "中国";
        $result = $this->slugService->chineseToPinyin($chineseText);

        // Doit contenir "zhongguo" ou une représentation alternative
        $this->assertIsString($result);
        $this->assertNotEmpty($result);
        // Le texte ne doit plus contenir de caractères chinois
        $this->assertDoesNotMatchRegularExpression('/[\x{4e00}-\x{9fa5}]/u', $result);
    }

    /** @test */
    public function it_generates_slugs_for_chinese_titles()
    {
        $title = "移民指南";
        $slug = $this->slugService->generateSlug($title, 'zh');

        // Doit être en latin ou pinyin
        $this->assertIsString($slug);
        $this->assertNotEmpty($slug);
    }

    /** @test */
    public function it_transliterates_arabic_to_latin()
    {
        $arabicText = "السلام عليكم";
        $result = $this->slugService->arabicToLatin($arabicText);

        // Doit être en latin après translittération
        $this->assertDoesNotMatchRegularExpression('/[\x{0600}-\x{06FF}]/u', $result);
        $this->assertIsString($result);
    }

    /** @test */
    public function it_generates_slugs_for_arabic_titles()
    {
        $title = "دليل المغتربين";
        $slug = $this->slugService->generateSlug($title, 'ar');

        // Doit être en latin
        $this->assertMatchesRegularExpression('/^[a-z0-9\-]+$/', $slug);
    }

    /** @test */
    public function it_detects_script_types()
    {
        $this->assertEquals('cyrillic', $this->slugService->detectScript('Привет'));
        $this->assertEquals('chinese', $this->slugService->detectScript('你好'));
        $this->assertEquals('arabic', $this->slugService->detectScript('مرحبا'));
        $this->assertEquals('devanagari', $this->slugService->detectScript('नमस्ते'));
        $this->assertEquals('latin', $this->slugService->detectScript('Hello'));
    }

    // =========================================================================
    // TESTS ENCODINGVALIDATOR
    // =========================================================================

    /** @test */
    public function it_validates_utf8_encoding()
    {
        $validUtf8 = "Hello World! Привет 你好 مرحبا";
        $this->assertTrue($this->encodingValidator->validateUtf8($validUtf8));
    }

    /** @test */
    public function it_detects_non_ascii_characters()
    {
        $ascii = "Hello World";
        $nonAscii = "Hello мир";

        $this->assertFalse($this->encodingValidator->hasNonAscii($ascii));
        $this->assertTrue($this->encodingValidator->hasNonAscii($nonAscii));
    }

    /** @test */
    public function it_validates_cyrillic_characters()
    {
        $cyrillic = "Привет мир";
        $latin = "Hello world";

        $this->assertTrue($this->encodingValidator->validateCyrillic($cyrillic));
        $this->assertFalse($this->encodingValidator->validateCyrillic($latin));
    }

    /** @test */
    public function it_validates_chinese_characters()
    {
        $chinese = "你好世界";
        $latin = "Hello world";

        $this->assertTrue($this->encodingValidator->validateChinese($chinese));
        $this->assertFalse($this->encodingValidator->validateChinese($latin));
    }

    /** @test */
    public function it_validates_arabic_characters()
    {
        $arabic = "السلام عليكم";
        $latin = "Hello world";

        $this->assertTrue($this->encodingValidator->validateArabic($arabic));
        $this->assertFalse($this->encodingValidator->validateArabic($latin));
    }

    /** @test */
    public function it_sanitizes_content_properly()
    {
        $dirtyContent = "Hello\x00World\x01Test";
        $clean = $this->encodingValidator->sanitizeContent($dirtyContent);

        $this->assertEquals('HelloWorldTest', str_replace([' ', "\n"], '', $clean));
        $this->assertDoesNotMatchRegularExpression('/[\x00-\x08]/', $clean);
    }

    /** @test */
    public function it_removes_bom_from_text()
    {
        $textWithBom = "\xEF\xBB\xBFHello World";
        $clean = $this->encodingValidator->sanitizeContent($textWithBom);

        $this->assertStringStartsWith('Hello', $clean);
        $this->assertStringNotContainsString("\xEF\xBB\xBF", $clean);
    }

    /** @test */
    public function it_analyzes_encoding_correctly()
    {
        $text = "Hello Привет 你好";
        $analysis = $this->encodingValidator->analyzeEncoding($text);

        $this->assertTrue($analysis['is_utf8']);
        $this->assertTrue($analysis['has_non_ascii']);
        $this->assertTrue($analysis['has_cyrillic']);
        $this->assertTrue($analysis['has_chinese']);
    }

    // =========================================================================
    // TESTS TRANSLATIONSERVICE (Nécessite API - À adapter selon environnement)
    // =========================================================================

    /** @test */
    public function it_can_create_article_for_translation()
    {
        $article = $this->createTestArticle('fr');

        $this->assertNotNull($article);
        $this->assertEquals('fr', $article->language->code);
        $this->assertNotEmpty($article->title);
        $this->assertNotEmpty($article->content);
    }

    /**
     * Test de traduction FR → EN
     * Note: Ce test appelle réellement l'API si OPENAI_API_KEY est configurée
     * 
     * @test
     * @group api
     * @group slow
     */
    public function it_translates_article_from_french_to_english()
    {
        // Skip si pas de clé API
        if (empty(env('OPENAI_API_KEY'))) {
            $this->markTestSkipped('OPENAI_API_KEY non configurée');
        }

        $article = $this->createTestArticle('fr');
        
        $translation = $this->translationService->translateArticle($article, 'en');

        $this->assertNotNull($translation);
        $this->assertEquals('en', $translation->language->code);
        $this->assertNotEmpty($translation->title);
        $this->assertNotEmpty($translation->content);
        $this->assertNotEquals($article->title, $translation->title);
        $this->assertGreaterThan(0, $translation->translation_cost);
    }

    /**
     * Test de traduction FR → ZH (Chinois)
     * 
     * @test
     * @group api
     * @group slow
     */
    public function it_translates_article_from_french_to_chinese()
    {
        if (empty(env('OPENAI_API_KEY'))) {
            $this->markTestSkipped('OPENAI_API_KEY non configurée');
        }

        $article = $this->createTestArticle('fr');
        
        $translation = $this->translationService->translateArticle($article, 'zh');

        $this->assertNotNull($translation);
        $this->assertEquals('zh', $translation->language->code);
        $this->assertNotEmpty($translation->title);
        
        // Vérifier présence de caractères chinois
        $this->assertTrue(
            $this->encodingValidator->validateChinese($translation->title),
            "Le titre traduit devrait contenir des caractères chinois"
        );
        
        // Vérifier slug translittéré
        $this->assertDoesNotMatchRegularExpression('/[\x{4e00}-\x{9fa5}]/u', $translation->slug);
    }

    /**
     * Test de traduction FR → AR (Arabe)
     * 
     * @test
     * @group api
     * @group slow
     */
    public function it_translates_article_from_french_to_arabic()
    {
        if (empty(env('OPENAI_API_KEY'))) {
            $this->markTestSkipped('OPENAI_API_KEY non configurée');
        }

        $article = $this->createTestArticle('fr');
        
        $translation = $this->translationService->translateArticle($article, 'ar');

        $this->assertNotNull($translation);
        $this->assertEquals('ar', $translation->language->code);
        $this->assertNotEmpty($translation->title);
        
        // Vérifier présence de caractères arabes
        $this->assertTrue(
            $this->encodingValidator->validateArabic($translation->title),
            "Le titre traduit devrait contenir des caractères arabes"
        );
        
        // Vérifier slug translittéré
        $this->assertDoesNotMatchRegularExpression('/[\x{0600}-\x{06FF}]/u', $translation->slug);
    }

    // =========================================================================
    // TESTS TRANSLATIONMANAGER
    // =========================================================================

    /** @test */
    public function it_gets_languages_to_translate()
    {
        $article = $this->createTestArticle('fr');
        
        $languages = $this->translationManager->getLanguagesToTranslate($article);

        $this->assertIsArray($languages);
        $this->assertCount(8, $languages); // 9 langues - 1 source
        $this->assertNotContains('fr', $languages);
        $this->assertContains('en', $languages);
        $this->assertContains('zh', $languages);
        $this->assertContains('ar', $languages);
    }

    /** @test */
    public function it_detects_missing_languages()
    {
        $article = $this->createTestArticle('fr');
        
        $missing = $this->translationManager->getMissingLanguages($article);

        $this->assertCount(8, $missing); // Toutes manquantes initialement
    }

    /** @test */
    public function it_checks_if_translation_exists()
    {
        $article = $this->createTestArticle('fr');
        
        $exists = $this->translationManager->translationExists($article, 'en');
        
        $this->assertFalse($exists);
    }

    /** @test */
    public function it_gets_translation_stats()
    {
        $article = $this->createTestArticle('fr');
        
        $stats = $this->translationManager->getTranslationStats($article);

        $this->assertIsArray($stats);
        $this->assertEquals('fr', $stats['source_language']);
        $this->assertEquals(0, $stats['total_translations']);
        $this->assertEquals(8, $stats['expected_translations']);
        $this->assertFalse($stats['is_fully_translated']);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Crée un article de test
     */
    protected function createTestArticle(string $lang = 'fr'): Article
    {
        $language = Language::where('code', $lang)->first();
        $platform = Platform::first() ?? Platform::factory()->create();
        $country = Country::first() ?? Country::factory()->create();

        return Article::create([
            'platform_id' => $platform->id,
            'country_id' => $country->id,
            'language_id' => $language->id,
            'type' => 'article',
            'title' => 'Guide complet pour expatriés en France',
            'slug' => 'guide-complet-pour-expatries-en-france',
            'excerpt' => 'Découvrez tout ce qu\'il faut savoir pour réussir votre expatriation en France.',
            'content' => '<h2>Introduction</h2><p>S\'expatrier en France nécessite une bonne préparation. Ce guide vous accompagne dans toutes les démarches.</p><h2>Visa et permis</h2><p>Selon votre nationalité, vous aurez besoin de différents documents.</p>',
            'word_count' => 250,
            'reading_time' => 2,
            'status' => 'published',
        ]);
    }

    /**
     * Seed les langues
     */
    protected function seedLanguages(): void
    {
        $languages = [
            ['code' => 'fr', 'name' => 'Français', 'native_name' => 'Français'],
            ['code' => 'en', 'name' => 'English', 'native_name' => 'English'],
            ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch'],
            ['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español'],
            ['code' => 'pt', 'name' => 'Portuguese', 'native_name' => 'Português'],
            ['code' => 'ru', 'name' => 'Russian', 'native_name' => 'Русский'],
            ['code' => 'zh', 'name' => 'Chinese', 'native_name' => '中文'],
            ['code' => 'ar', 'name' => 'Arabic', 'native_name' => 'العربية'],
            ['code' => 'hi', 'name' => 'Hindi', 'native_name' => 'हिन्दी'],
        ];

        foreach ($languages as $lang) {
            Language::firstOrCreate(['code' => $lang['code']], $lang);
        }
    }
}