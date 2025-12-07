<?php

namespace App\Services\Linking;

use Illuminate\Support\Facades\Log;

class MultilingualLinkAdapter
{
    /**
     * Langues supportées
     */
    protected array $supportedLanguages = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'];

    /**
     * Prépare le contenu pour l'injection de liens selon la langue
     */
    public function prepareContent(string $content, string $languageCode): string
    {
        // Normaliser le code langue
        $languageCode = $this->normalizeLanguageCode($languageCode);

        // Appliquer les adaptations spécifiques à la langue
        switch ($languageCode) {
            case 'ar':
                $content = $this->prepareArabicContent($content);
                break;
            case 'zh':
                $content = $this->prepareChineseContent($content);
                break;
            case 'hi':
                $content = $this->prepareHindiContent($content);
                break;
            case 'ru':
                $content = $this->prepareRussianContent($content);
                break;
        }

        return $content;
    }

    /**
     * Génère un anchor text adapté à la langue
     */
    public function generateLocalizedAnchor(string $baseText, string $languageCode, string $type = 'generic'): string
    {
        $languageCode = $this->normalizeLanguageCode($languageCode);

        // Templates par type et langue
        $templates = $this->getAnchorTemplates();

        if (isset($templates[$type][$languageCode])) {
            $template = $templates[$type][$languageCode][array_rand($templates[$type][$languageCode])];
            return str_replace('{text}', $baseText, $template);
        }

        // Fallback sur l'anglais
        if (isset($templates[$type]['en'])) {
            $template = $templates[$type]['en'][array_rand($templates[$type]['en'])];
            return str_replace('{text}', $baseText, $template);
        }

        return $baseText;
    }

    /**
     * Récupère les templates d'anchor par type et langue
     */
    protected function getAnchorTemplates(): array
    {
        return [
            'exact_match' => [
                'fr' => ['{text}'],
                'en' => ['{text}'],
                'es' => ['{text}'],
                'de' => ['{text}'],
                'pt' => ['{text}'],
                'ru' => ['{text}'],
                'zh' => ['{text}'],
                'ar' => ['{text}'],
                'hi' => ['{text}'],
            ],
            'long_tail' => [
                'fr' => [
                    'tout savoir sur {text}',
                    'guide complet sur {text}',
                    'découvrir {text}',
                    'comprendre {text}',
                ],
                'en' => [
                    'everything about {text}',
                    'complete guide to {text}',
                    'learn about {text}',
                    'understanding {text}',
                ],
                'es' => [
                    'todo sobre {text}',
                    'guía completa de {text}',
                    'descubrir {text}',
                ],
                'de' => [
                    'alles über {text}',
                    'vollständiger Leitfaden zu {text}',
                    '{text} verstehen',
                ],
                'pt' => [
                    'tudo sobre {text}',
                    'guia completo de {text}',
                    'descobrir {text}',
                ],
                'ru' => [
                    'всё о {text}',
                    'полное руководство по {text}',
                    'узнать о {text}',
                ],
                'zh' => [
                    '关于{text}的一切',
                    '{text}完整指南',
                    '了解{text}',
                ],
                'ar' => [
                    'كل شيء عن {text}',
                    'دليل شامل عن {text}',
                    'اكتشف {text}',
                ],
                'hi' => [
                    '{text} के बारे में सब कुछ',
                    '{text} की पूरी गाइड',
                    '{text} जानें',
                ],
            ],
            'cta' => [
                'fr' => [
                    'consultez notre guide sur {text}',
                    'en savoir plus sur {text}',
                    'découvrez {text}',
                ],
                'en' => [
                    'check our guide on {text}',
                    'learn more about {text}',
                    'discover {text}',
                ],
                'es' => [
                    'consulte nuestra guía sobre {text}',
                    'más información sobre {text}',
                    'descubra {text}',
                ],
                'de' => [
                    'lesen Sie unseren Leitfaden zu {text}',
                    'mehr erfahren über {text}',
                    'entdecken Sie {text}',
                ],
                'pt' => [
                    'consulte nosso guia sobre {text}',
                    'saiba mais sobre {text}',
                    'descubra {text}',
                ],
                'ru' => [
                    'ознакомьтесь с нашим руководством по {text}',
                    'узнать больше о {text}',
                    'откройте для себя {text}',
                ],
                'zh' => [
                    '查看我们的{text}指南',
                    '了解更多关于{text}',
                    '探索{text}',
                ],
                'ar' => [
                    'راجع دليلنا حول {text}',
                    'اعرف المزيد عن {text}',
                    'اكتشف {text}',
                ],
                'hi' => [
                    '{text} पर हमारी गाइड देखें',
                    '{text} के बारे में और जानें',
                    '{text} खोजें',
                ],
            ],
            'generic' => [
                'fr' => [
                    'en savoir plus',
                    'cliquez ici',
                    'voir plus',
                    'lire la suite',
                ],
                'en' => [
                    'learn more',
                    'click here',
                    'read more',
                    'find out more',
                ],
                'es' => [
                    'más información',
                    'haga clic aquí',
                    'leer más',
                ],
                'de' => [
                    'mehr erfahren',
                    'hier klicken',
                    'weiterlesen',
                ],
                'pt' => [
                    'saiba mais',
                    'clique aqui',
                    'leia mais',
                ],
                'ru' => [
                    'узнать больше',
                    'нажмите здесь',
                    'читать далее',
                ],
                'zh' => [
                    '了解更多',
                    '点击这里',
                    '阅读更多',
                ],
                'ar' => [
                    'اعرف المزيد',
                    'انقر هنا',
                    'اقرأ المزيد',
                ],
                'hi' => [
                    'और जानें',
                    'यहां क्लिक करें',
                    'और पढ़ें',
                ],
            ],
            'question' => [
                'fr' => [
                    'comment {text} ?',
                    'qu\'est-ce que {text} ?',
                    'pourquoi {text} ?',
                ],
                'en' => [
                    'how to {text}?',
                    'what is {text}?',
                    'why {text}?',
                ],
                'es' => [
                    '¿cómo {text}?',
                    '¿qué es {text}?',
                    '¿por qué {text}?',
                ],
                'de' => [
                    'wie {text}?',
                    'was ist {text}?',
                    'warum {text}?',
                ],
                'pt' => [
                    'como {text}?',
                    'o que é {text}?',
                    'por que {text}?',
                ],
                'ru' => [
                    'как {text}?',
                    'что такое {text}?',
                    'почему {text}?',
                ],
                'zh' => [
                    '如何{text}？',
                    '什么是{text}？',
                    '为什么{text}？',
                ],
                'ar' => [
                    'كيف {text}؟',
                    'ما هو {text}؟',
                    'لماذا {text}؟',
                ],
                'hi' => [
                    '{text} कैसे करें?',
                    '{text} क्या है?',
                    '{text} क्यों?',
                ],
            ],
        ];
    }

    /**
     * Adapte le texte de titre d'un lien externe
     */
    public function localizeExternalLinkTitle(string $domain, string $languageCode): string
    {
        $languageCode = $this->normalizeLanguageCode($languageCode);

        $templates = [
            'fr' => 'Visiter {domain}',
            'en' => 'Visit {domain}',
            'es' => 'Visitar {domain}',
            'de' => 'Besuchen Sie {domain}',
            'pt' => 'Visitar {domain}',
            'ru' => 'Посетить {domain}',
            'zh' => '访问 {domain}',
            'ar' => 'زيارة {domain}',
            'hi' => '{domain} पर जाएं',
        ];

        $template = $templates[$languageCode] ?? $templates['en'];
        return str_replace('{domain}', $domain, $template);
    }

    /**
     * Préparation spécifique pour l'arabe (RTL)
     */
    protected function prepareArabicContent(string $content): string
    {
        // S'assurer que le conteneur principal a la direction RTL
        if (strpos($content, 'dir="rtl"') === false) {
            // Wrapper le contenu si nécessaire
            if (strpos($content, '<div') === 0) {
                $content = preg_replace('/<div([^>]*)>/', '<div$1 dir="rtl">', $content, 1);
            }
        }

        return $content;
    }

    /**
     * Préparation spécifique pour le chinois
     */
    protected function prepareChineseContent(string $content): string
    {
        // Le chinois n'utilise pas d'espaces entre les mots
        // Ajuster la logique de segmentation si nécessaire
        return $content;
    }

    /**
     * Préparation spécifique pour l'hindi
     */
    protected function prepareHindiContent(string $content): string
    {
        // Aucune préparation spécifique nécessaire pour l'instant
        return $content;
    }

    /**
     * Préparation spécifique pour le russe
     */
    protected function prepareRussianContent(string $content): string
    {
        // Le cyrillique est bien supporté nativement
        return $content;
    }

    /**
     * Normalise le code langue
     */
    protected function normalizeLanguageCode(string $code): string
    {
        $code = strtolower(substr($code, 0, 2));
        
        // Mappings alternatifs
        $mappings = [
            'cn' => 'zh',
            'jp' => 'ja',
            'br' => 'pt',
        ];

        return $mappings[$code] ?? $code;
    }

    /**
     * Vérifie si une langue est supportée
     */
    public function isLanguageSupported(string $languageCode): bool
    {
        return in_array($this->normalizeLanguageCode($languageCode), $this->supportedLanguages);
    }

    /**
     * Récupère toutes les langues supportées
     */
    public function getSupportedLanguages(): array
    {
        return $this->supportedLanguages;
    }

    /**
     * Détecte la langue du contenu (simplifié)
     */
    public function detectLanguage(string $content): ?string
    {
        $content = strip_tags($content);
        $content = mb_substr($content, 0, 1000); // Analyser les 1000 premiers caractères

        // Détection basique par caractères spécifiques
        if (preg_match('/[\x{4E00}-\x{9FFF}]/u', $content)) {
            return 'zh';
        }
        if (preg_match('/[\x{0600}-\x{06FF}]/u', $content)) {
            return 'ar';
        }
        if (preg_match('/[\x{0900}-\x{097F}]/u', $content)) {
            return 'hi';
        }
        if (preg_match('/[\x{0400}-\x{04FF}]/u', $content)) {
            return 'ru';
        }

        // Détection par mots-clés courants
        $keywords = [
            'fr' => ['le', 'la', 'les', 'de', 'du', 'des', 'est', 'sont', 'pour', 'dans', 'avec'],
            'en' => ['the', 'is', 'are', 'for', 'and', 'with', 'this', 'that', 'from', 'have'],
            'es' => ['el', 'la', 'los', 'las', 'de', 'del', 'es', 'son', 'para', 'con'],
            'de' => ['der', 'die', 'das', 'und', 'ist', 'sind', 'für', 'mit', 'von', 'auf'],
            'pt' => ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'é', 'são', 'para', 'com'],
        ];

        $words = preg_split('/\s+/', strtolower($content));
        $scores = [];

        foreach ($keywords as $lang => $langKeywords) {
            $scores[$lang] = count(array_intersect($words, $langKeywords));
        }

        arsort($scores);
        $topLang = key($scores);

        return $scores[$topLang] > 3 ? $topLang : null;
    }

    /**
     * Formate un nombre selon la locale
     */
    public function formatNumber(int $number, string $languageCode): string
    {
        $locales = [
            'fr' => 'fr_FR',
            'en' => 'en_US',
            'es' => 'es_ES',
            'de' => 'de_DE',
            'pt' => 'pt_BR',
            'ru' => 'ru_RU',
            'zh' => 'zh_CN',
            'ar' => 'ar_SA',
            'hi' => 'hi_IN',
        ];

        $locale = $locales[$this->normalizeLanguageCode($languageCode)] ?? 'en_US';

        $formatter = new \NumberFormatter($locale, \NumberFormatter::DECIMAL);
        return $formatter->format($number);
    }

    /**
     * Récupère le nom de la langue dans sa propre langue
     */
    public function getLanguageName(string $languageCode): string
    {
        $names = [
            'fr' => 'Français',
            'en' => 'English',
            'es' => 'Español',
            'de' => 'Deutsch',
            'pt' => 'Português',
            'ru' => 'Русский',
            'zh' => '中文',
            'ar' => 'العربية',
            'hi' => 'हिन्दी',
        ];

        return $names[$this->normalizeLanguageCode($languageCode)] ?? $languageCode;
    }
}
