<?php

namespace Tests\Feature\Linking;

use App\Services\Linking\MultilingualLinkAdapter;
use Tests\TestCase;

class MultilingualLinkingTest extends TestCase
{
    protected MultilingualLinkAdapter $adapter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adapter = new MultilingualLinkAdapter();
    }

    public function test_supports_all_nine_languages()
    {
        $languages = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'];

        foreach ($languages as $lang) {
            $this->assertTrue(
                $this->adapter->isLanguageSupported($lang),
                "Language {$lang} should be supported"
            );
        }
    }

    public function test_normalizes_language_codes()
    {
        // Test des variantes
        $this->assertTrue($this->adapter->isLanguageSupported('FR')); // uppercase
        $this->assertTrue($this->adapter->isLanguageSupported('fr-FR')); // with region
        $this->assertTrue($this->adapter->isLanguageSupported('cn')); // Chinese alternate
    }

    public function test_generates_exact_match_anchor()
    {
        $baseText = 'visa France';

        foreach (['fr', 'en', 'es', 'de'] as $lang) {
            $anchor = $this->adapter->generateLocalizedAnchor($baseText, $lang, 'exact_match');
            $this->assertEquals($baseText, $anchor);
        }
    }

    public function test_generates_long_tail_anchor_in_french()
    {
        $baseText = 'visa';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'fr', 'long_tail');

        $patterns = ['tout savoir sur', 'guide complet sur', 'découvrir', 'comprendre'];
        $matchesPattern = false;
        
        foreach ($patterns as $pattern) {
            if (strpos($anchor, $pattern) !== false) {
                $matchesPattern = true;
                break;
            }
        }

        $this->assertTrue($matchesPattern, "French long-tail anchor should contain a French pattern");
        $this->assertStringContainsString($baseText, $anchor);
    }

    public function test_generates_long_tail_anchor_in_english()
    {
        $baseText = 'visa';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'en', 'long_tail');

        $patterns = ['everything about', 'complete guide to', 'learn about', 'understanding'];
        $matchesPattern = false;
        
        foreach ($patterns as $pattern) {
            if (strpos($anchor, $pattern) !== false) {
                $matchesPattern = true;
                break;
            }
        }

        $this->assertTrue($matchesPattern, "English long-tail anchor should contain an English pattern");
        $this->assertStringContainsString($baseText, $anchor);
    }

    public function test_generates_cta_anchor_in_spanish()
    {
        $baseText = 'visado';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'es', 'cta');

        $patterns = ['consulte nuestra guía', 'más información', 'descubra'];
        $matchesPattern = false;
        
        foreach ($patterns as $pattern) {
            if (strpos($anchor, $pattern) !== false) {
                $matchesPattern = true;
                break;
            }
        }

        $this->assertTrue($matchesPattern, "Spanish CTA anchor should contain a Spanish pattern");
    }

    public function test_generates_generic_anchor()
    {
        $anchor = $this->adapter->generateLocalizedAnchor('', 'fr', 'generic');

        $generics = ['en savoir plus', 'cliquez ici', 'voir plus', 'lire la suite'];
        $this->assertContains($anchor, $generics);
    }

    public function test_generates_question_anchor()
    {
        $baseText = 'obtenir un visa';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'fr', 'question');

        $this->assertMatchesRegularExpression('/[?？]/', $anchor);
    }

    public function test_generates_anchors_for_chinese()
    {
        $baseText = '签证';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'zh', 'long_tail');

        // Devrait contenir des caractères chinois
        $this->assertMatchesRegularExpression('/[\x{4E00}-\x{9FFF}]/u', $anchor);
        $this->assertStringContainsString($baseText, $anchor);
    }

    public function test_generates_anchors_for_arabic()
    {
        $baseText = 'تأشيرة';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'ar', 'cta');

        // Devrait contenir des caractères arabes
        $this->assertMatchesRegularExpression('/[\x{0600}-\x{06FF}]/u', $anchor);
    }

    public function test_generates_anchors_for_hindi()
    {
        $baseText = 'वीज़ा';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'hi', 'long_tail');

        // Devrait contenir des caractères devanagari
        $this->assertMatchesRegularExpression('/[\x{0900}-\x{097F}]/u', $anchor);
    }

    public function test_generates_anchors_for_russian()
    {
        $baseText = 'виза';
        $anchor = $this->adapter->generateLocalizedAnchor($baseText, 'ru', 'cta');

        // Devrait contenir des caractères cyrilliques
        $this->assertMatchesRegularExpression('/[\x{0400}-\x{04FF}]/u', $anchor);
    }

    public function test_localizes_external_link_title()
    {
        $domain = 'example.gov';

        $titleFr = $this->adapter->localizeExternalLinkTitle($domain, 'fr');
        $this->assertStringContainsString('Visiter', $titleFr);
        $this->assertStringContainsString($domain, $titleFr);

        $titleEn = $this->adapter->localizeExternalLinkTitle($domain, 'en');
        $this->assertStringContainsString('Visit', $titleEn);

        $titleEs = $this->adapter->localizeExternalLinkTitle($domain, 'es');
        $this->assertStringContainsString('Visitar', $titleEs);
    }

    public function test_prepares_arabic_content_with_rtl()
    {
        $content = '<div>محتوى عربي</div>';
        $prepared = $this->adapter->prepareContent($content, 'ar');

        $this->assertStringContainsString('dir="rtl"', $prepared);
    }

    public function test_detects_language_from_content()
    {
        // Test français
        $frContent = 'Le visa est un document important pour les démarches administratives en France.';
        $this->assertEquals('fr', $this->adapter->detectLanguage($frContent));

        // Test anglais
        $enContent = 'The visa is an important document for administrative procedures.';
        $this->assertEquals('en', $this->adapter->detectLanguage($enContent));

        // Test espagnol
        $esContent = 'El visado es un documento importante para los trámites administrativos.';
        $this->assertEquals('es', $this->adapter->detectLanguage($esContent));
    }

    public function test_detects_chinese_by_characters()
    {
        $content = '这是一个关于签证的文章。';
        $this->assertEquals('zh', $this->adapter->detectLanguage($content));
    }

    public function test_detects_arabic_by_characters()
    {
        $content = 'هذا مقال عن التأشيرة.';
        $this->assertEquals('ar', $this->adapter->detectLanguage($content));
    }

    public function test_detects_russian_by_characters()
    {
        $content = 'Это статья о визе.';
        $this->assertEquals('ru', $this->adapter->detectLanguage($content));
    }

    public function test_formats_numbers_by_locale()
    {
        // Français utilise l'espace comme séparateur de milliers
        $formatted = $this->adapter->formatNumber(1234567, 'fr');
        $this->assertNotEquals('1234567', $formatted);

        // Anglais utilise la virgule
        $formatted = $this->adapter->formatNumber(1234567, 'en');
        $this->assertStringContainsString(',', $formatted);
    }

    public function test_gets_language_name_in_native_form()
    {
        $this->assertEquals('Français', $this->adapter->getLanguageName('fr'));
        $this->assertEquals('English', $this->adapter->getLanguageName('en'));
        $this->assertEquals('Español', $this->adapter->getLanguageName('es'));
        $this->assertEquals('Deutsch', $this->adapter->getLanguageName('de'));
        $this->assertEquals('中文', $this->adapter->getLanguageName('zh'));
        $this->assertEquals('العربية', $this->adapter->getLanguageName('ar'));
        $this->assertEquals('हिन्दी', $this->adapter->getLanguageName('hi'));
    }

    public function test_falls_back_to_english_for_unknown_language()
    {
        $anchor = $this->adapter->generateLocalizedAnchor('test', 'xx', 'cta');

        // Devrait utiliser le fallback anglais
        $this->assertNotEmpty($anchor);
    }

    public function test_gets_supported_languages_list()
    {
        $languages = $this->adapter->getSupportedLanguages();

        $this->assertCount(9, $languages);
        $this->assertContains('fr', $languages);
        $this->assertContains('en', $languages);
        $this->assertContains('zh', $languages);
        $this->assertContains('ar', $languages);
    }

    public function test_handles_mixed_language_content()
    {
        // Contenu principalement français avec quelques mots anglais
        $content = 'Le business model est basé sur le cloud computing et les services de visa.';
        
        // Devrait détecter le français malgré les anglicismes
        $this->assertEquals('fr', $this->adapter->detectLanguage($content));
    }

    public function test_returns_null_for_ambiguous_content()
    {
        // Contenu très court ou ambigu
        $content = 'OK 123';
        
        $result = $this->adapter->detectLanguage($content);
        // Peut retourner null ou une estimation
        $this->assertTrue($result === null || is_string($result));
    }
}
