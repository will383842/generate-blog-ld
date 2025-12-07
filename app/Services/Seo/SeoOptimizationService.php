<?php

namespace App\Services\Seo;

use App\Models\Article;
use App\Models\Country;
use App\Models\Language;
use App\Services\AI\GptService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * SeoOptimizationService - Service centralisé d'optimisation SEO
 *
 * Fonctionnalités:
 * - Meta title/description optimisés et traduits (9 langues)
 * - Validation des limites SEO (60 chars title, 160 chars description)
 * - Génération attributs images (alt, aria-label, loading, srcset)
 * - Head tags (viewport, charset, robots directives)
 * - Performance hints (preconnect, dns-prefetch, preload)
 * - Robots meta (max-snippet, max-image-preview, max-video-preview)
 *
 * @package App\Services\Seo
 */
class SeoOptimizationService
{
    protected GptService $gptService;

    // Limites SEO strictes
    const META_TITLE_MAX = 60;
    const META_TITLE_MIN = 30;
    const META_DESCRIPTION_MAX = 160;
    const META_DESCRIPTION_MIN = 120;
    const ALT_TEXT_MAX = 125;
    const ALT_TEXT_MIN = 20;

    // Langues supportées
    const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    // Templates meta par langue
    protected array $metaTitleTemplates = [
        'fr' => [
            'article' => '{title} | Guide {year}',
            'pillar' => '{title} : Guide Complet {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => 'Comparatif {service} {country} {year}',
            'press_release' => '{title} | Communiqué',
            'press_dossier' => '{title} | Dossier de Presse',
        ],
        'en' => [
            'article' => '{title} | {year} Guide',
            'pillar' => '{title}: Complete Guide {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => '{service} {country} Comparison {year}',
            'press_release' => '{title} | Press Release',
            'press_dossier' => '{title} | Press Kit',
        ],
        'de' => [
            'article' => '{title} | Ratgeber {year}',
            'pillar' => '{title}: Kompletter Leitfaden {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => '{service} {country} Vergleich {year}',
            'press_release' => '{title} | Pressemitteilung',
            'press_dossier' => '{title} | Pressemappe',
        ],
        'es' => [
            'article' => '{title} | Guía {year}',
            'pillar' => '{title}: Guía Completa {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => 'Comparativa {service} {country} {year}',
            'press_release' => '{title} | Comunicado',
            'press_dossier' => '{title} | Dossier de Prensa',
        ],
        'pt' => [
            'article' => '{title} | Guia {year}',
            'pillar' => '{title}: Guia Completo {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => 'Comparativo {service} {country} {year}',
            'press_release' => '{title} | Comunicado',
            'press_dossier' => '{title} | Kit de Imprensa',
        ],
        'ru' => [
            'article' => '{title} | Руководство {year}',
            'pillar' => '{title}: Полное руководство {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => 'Сравнение {service} {country} {year}',
            'press_release' => '{title} | Пресс-релиз',
            'press_dossier' => '{title} | Пресс-кит',
        ],
        'zh' => [
            'article' => '{title} | {year}指南',
            'pillar' => '{title}：完整指南 {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => '{service} {country} 对比 {year}',
            'press_release' => '{title} | 新闻稿',
            'press_dossier' => '{title} | 新闻资料',
        ],
        'ar' => [
            'article' => '{title} | دليل {year}',
            'pillar' => '{title}: الدليل الشامل {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => 'مقارنة {service} {country} {year}',
            'press_release' => '{title} | بيان صحفي',
            'press_dossier' => '{title} | ملف صحفي',
        ],
        'hi' => [
            'article' => '{title} | गाइड {year}',
            'pillar' => '{title}: संपूर्ण गाइड {year}',
            'landing' => '{service} {country} | {platform}',
            'comparative' => '{service} {country} तुलना {year}',
            'press_release' => '{title} | प्रेस विज्ञप्ति',
            'press_dossier' => '{title} | प्रेस किट',
        ],
    ];

    // Templates meta description par langue
    protected array $metaDescriptionTemplates = [
        'fr' => [
            'article' => 'Découvrez {title}. Guide complet pour expatriés en {country} : conseils, démarches et solutions pratiques. Mis à jour {year}.',
            'pillar' => '{title} : tout ce que vous devez savoir pour réussir votre expatriation en {country}. Guide expert avec conseils pratiques.',
            'landing' => '{service} pour expatriés en {country}. Trouvez les meilleurs prestataires vérifiés sur {platform}. Réponse en moins de 5 minutes.',
            'comparative' => 'Comparatif complet {service} en {country}. Tableaux, scores, avantages et inconvénients pour faire le meilleur choix en {year}.',
            'press_release' => '{title}. Communiqué de presse officiel de {platform}. Découvrez nos dernières actualités et annonces.',
            'press_dossier' => '{title}. Dossier de presse complet de {platform} : chiffres clés, équipe dirigeante et vision stratégique.',
        ],
        'en' => [
            'article' => 'Discover {title}. Complete guide for expats in {country}: tips, procedures and practical solutions. Updated {year}.',
            'pillar' => '{title}: everything you need to know for successful expatriation in {country}. Expert guide with practical advice.',
            'landing' => '{service} for expats in {country}. Find the best verified providers on {platform}. Response in under 5 minutes.',
            'comparative' => 'Complete {service} comparison in {country}. Tables, scores, pros and cons to make the best choice in {year}.',
            'press_release' => '{title}. Official press release from {platform}. Discover our latest news and announcements.',
            'press_dossier' => '{title}. Complete press kit from {platform}: key figures, leadership team and strategic vision.',
        ],
        'de' => [
            'article' => 'Entdecken Sie {title}. Vollständiger Leitfaden für Expats in {country}: Tipps, Verfahren und praktische Lösungen. Aktualisiert {year}.',
            'pillar' => '{title}: Alles, was Sie für eine erfolgreiche Auswanderung nach {country} wissen müssen. Expertenratgeber mit praktischen Tipps.',
            'landing' => '{service} für Expats in {country}. Finden Sie die besten verifizierten Anbieter auf {platform}. Antwort in unter 5 Minuten.',
            'comparative' => 'Vollständiger {service}-Vergleich in {country}. Tabellen, Bewertungen, Vor- und Nachteile für die beste Wahl {year}.',
            'press_release' => '{title}. Offizielle Pressemitteilung von {platform}. Entdecken Sie unsere neuesten Nachrichten.',
            'press_dossier' => '{title}. Vollständige Pressemappe von {platform}: Kennzahlen, Führungsteam und strategische Vision.',
        ],
        'es' => [
            'article' => 'Descubre {title}. Guía completa para expatriados en {country}: consejos, trámites y soluciones prácticas. Actualizado {year}.',
            'pillar' => '{title}: todo lo que necesitas saber para una expatriación exitosa en {country}. Guía experta con consejos prácticos.',
            'landing' => '{service} para expatriados en {country}. Encuentra los mejores proveedores verificados en {platform}. Respuesta en menos de 5 minutos.',
            'comparative' => 'Comparativa completa de {service} en {country}. Tablas, puntuaciones, ventajas y desventajas para elegir mejor en {year}.',
            'press_release' => '{title}. Comunicado de prensa oficial de {platform}. Descubre nuestras últimas noticias.',
            'press_dossier' => '{title}. Dossier de prensa completo de {platform}: cifras clave, equipo directivo y visión estratégica.',
        ],
        'pt' => [
            'article' => 'Descubra {title}. Guia completo para expatriados em {country}: dicas, procedimentos e soluções práticas. Atualizado {year}.',
            'pillar' => '{title}: tudo o que você precisa saber para uma expatriação bem-sucedida em {country}. Guia especializado com dicas práticas.',
            'landing' => '{service} para expatriados em {country}. Encontre os melhores prestadores verificados em {platform}. Resposta em menos de 5 minutos.',
            'comparative' => 'Comparativo completo de {service} em {country}. Tabelas, pontuações, vantagens e desvantagens para a melhor escolha em {year}.',
            'press_release' => '{title}. Comunicado oficial de imprensa de {platform}. Descubra as nossas últimas notícias.',
            'press_dossier' => '{title}. Kit de imprensa completo de {platform}: números-chave, equipa de liderança e visão estratégica.',
        ],
        'ru' => [
            'article' => 'Узнайте {title}. Полное руководство для экспатов в {country}: советы, процедуры и практические решения. Обновлено {year}.',
            'pillar' => '{title}: всё, что нужно знать для успешной эмиграции в {country}. Экспертное руководство с практическими советами.',
            'landing' => '{service} для экспатов в {country}. Найдите лучших проверенных специалистов на {platform}. Ответ менее чем за 5 минут.',
            'comparative' => 'Полное сравнение {service} в {country}. Таблицы, оценки, плюсы и минусы для лучшего выбора в {year}.',
            'press_release' => '{title}. Официальный пресс-релиз {platform}. Узнайте о наших последних новостях.',
            'press_dossier' => '{title}. Полный пресс-кит {platform}: ключевые цифры, команда руководства и стратегическое видение.',
        ],
        'zh' => [
            'article' => '了解{title}。{country}外籍人士完整指南：建议、程序和实用解决方案。{year}更新。',
            'pillar' => '{title}：在{country}成功移居所需了解的一切。专家指南与实用建议。',
            'landing' => '{country}外籍人士{service}。在{platform}上找到最佳认证服务商。5分钟内回复。',
            'comparative' => '{country}{service}完整对比。表格、评分、优缺点，助您在{year}做出最佳选择。',
            'press_release' => '{title}。{platform}官方新闻稿。了解我们的最新动态。',
            'press_dossier' => '{title}。{platform}完整新闻资料：关键数据、领导团队和战略愿景。',
        ],
        'ar' => [
            'article' => 'اكتشف {title}. دليل شامل للمغتربين في {country}: نصائح وإجراءات وحلول عملية. محدث {year}.',
            'pillar' => '{title}: كل ما تحتاج معرفته للاغتراب الناجح في {country}. دليل خبير مع نصائح عملية.',
            'landing' => '{service} للمغتربين في {country}. اعثر على أفضل مقدمي الخدمات المعتمدين على {platform}. رد في أقل من 5 دقائق.',
            'comparative' => 'مقارنة شاملة لـ {service} في {country}. جداول ونتائج ومزايا وعيوب لاتخاذ أفضل قرار في {year}.',
            'press_release' => '{title}. بيان صحفي رسمي من {platform}. اكتشف آخر أخبارنا.',
            'press_dossier' => '{title}. ملف صحفي كامل من {platform}: أرقام رئيسية وفريق القيادة والرؤية الاستراتيجية.',
        ],
        'hi' => [
            'article' => '{title} जानें। {country} में प्रवासियों के लिए पूर्ण गाइड: सुझाव, प्रक्रियाएं और व्यावहारिक समाधान। {year} अपडेटेड।',
            'pillar' => '{title}: {country} में सफल प्रवास के लिए सब कुछ जानें। व्यावहारिक सलाह के साथ विशेषज्ञ गाइड।',
            'landing' => '{country} में प्रवासियों के लिए {service}। {platform} पर सर्वश्रेष्ठ सत्यापित प्रदाता खोजें। 5 मिनट में उत्तर।',
            'comparative' => '{country} में {service} की पूर्ण तुलना। {year} में सर्वोत्तम चुनाव के लिए तालिकाएं, स्कोर, फायदे और नुकसान।',
            'press_release' => '{title}। {platform} की आधिकारिक प्रेस विज्ञप्ति। हमारी नवीनतम समाचार जानें।',
            'press_dossier' => '{title}। {platform} का पूर्ण प्रेस किट: प्रमुख आंकड़े, नेतृत्व टीम और रणनीतिक दृष्टि।',
        ],
    ];

    public function __construct(GptService $gptService)
    {
        $this->gptService = $gptService;
    }

    // =========================================================================
    // META TITLE OPTIMISÉ
    // =========================================================================

    /**
     * Génère un meta title optimisé SEO
     *
     * @param string $title Titre de base
     * @param string $type Type de contenu (article, pillar, landing, comparative)
     * @param string $lang Code langue
     * @param array $context Contexte (country, platform, service, year)
     * @return string Meta title optimisé (max 60 chars)
     */
    public function generateMetaTitle(
        string $title,
        string $type,
        string $lang,
        array $context = []
    ): string {
        // Récupérer le template
        $template = $this->metaTitleTemplates[$lang][$type]
            ?? $this->metaTitleTemplates['en'][$type]
            ?? '{title}';

        // Variables de remplacement
        $variables = [
            '{title}' => $this->truncateForMeta($title, 40),
            '{country}' => $context['country'] ?? '',
            '{platform}' => $context['platform'] ?? 'SOS-Expat',
            '{service}' => $context['service'] ?? '',
            '{year}' => $context['year'] ?? date('Y'),
        ];

        $metaTitle = str_replace(array_keys($variables), array_values($variables), $template);

        // Validation et ajustement
        $metaTitle = $this->enforceMetaTitleLimits($metaTitle, $title);

        Log::debug('SeoOptimizationService: Meta title généré', [
            'original' => $title,
            'meta_title' => $metaTitle,
            'length' => mb_strlen($metaTitle),
            'lang' => $lang,
        ]);

        return $metaTitle;
    }

    /**
     * Force les limites du meta title (30-60 caractères)
     */
    protected function enforceMetaTitleLimits(string $metaTitle, string $fallbackTitle): string
    {
        $length = mb_strlen($metaTitle);

        // Trop long : tronquer intelligemment
        if ($length > self::META_TITLE_MAX) {
            $metaTitle = mb_substr($metaTitle, 0, self::META_TITLE_MAX - 3);
            // Couper au dernier mot complet
            $lastSpace = mb_strrpos($metaTitle, ' ');
            if ($lastSpace !== false && $lastSpace > 30) {
                $metaTitle = mb_substr($metaTitle, 0, $lastSpace);
            }
            $metaTitle .= '...';
        }

        // Trop court : utiliser le titre original
        if (mb_strlen($metaTitle) < self::META_TITLE_MIN) {
            $metaTitle = $this->truncateForMeta($fallbackTitle, self::META_TITLE_MAX);
        }

        return trim($metaTitle);
    }

    // =========================================================================
    // META DESCRIPTION OPTIMISÉE
    // =========================================================================

    /**
     * Génère une meta description optimisée SEO
     *
     * @param string $title Titre/sujet
     * @param string $type Type de contenu
     * @param string $lang Code langue
     * @param array $context Contexte
     * @return string Meta description optimisée (max 160 chars)
     */
    public function generateMetaDescription(
        string $title,
        string $type,
        string $lang,
        array $context = []
    ): string {
        // Récupérer le template
        $template = $this->metaDescriptionTemplates[$lang][$type]
            ?? $this->metaDescriptionTemplates['en'][$type]
            ?? 'Découvrez {title}.';

        // Variables de remplacement
        $variables = [
            '{title}' => $this->truncateForMeta($title, 50),
            '{country}' => $context['country'] ?? '',
            '{platform}' => $context['platform'] ?? 'SOS-Expat',
            '{service}' => $context['service'] ?? '',
            '{year}' => $context['year'] ?? date('Y'),
        ];

        $metaDescription = str_replace(array_keys($variables), array_values($variables), $template);

        // Validation et ajustement
        $metaDescription = $this->enforceMetaDescriptionLimits($metaDescription);

        Log::debug('SeoOptimizationService: Meta description générée', [
            'meta_description' => $metaDescription,
            'length' => mb_strlen($metaDescription),
            'lang' => $lang,
        ]);

        return $metaDescription;
    }

    /**
     * Force les limites de la meta description (120-160 caractères)
     */
    protected function enforceMetaDescriptionLimits(string $description): string
    {
        $length = mb_strlen($description);

        // Trop long : tronquer intelligemment
        if ($length > self::META_DESCRIPTION_MAX) {
            $description = mb_substr($description, 0, self::META_DESCRIPTION_MAX - 3);
            // Couper à la dernière phrase ou au dernier mot
            $lastPeriod = mb_strrpos($description, '.');
            $lastSpace = mb_strrpos($description, ' ');

            if ($lastPeriod !== false && $lastPeriod > 100) {
                $description = mb_substr($description, 0, $lastPeriod + 1);
            } elseif ($lastSpace !== false && $lastSpace > 100) {
                $description = mb_substr($description, 0, $lastSpace) . '...';
            } else {
                $description .= '...';
            }
        }

        return trim($description);
    }

    // =========================================================================
    // TRADUCTION META (POUR ARTICLES TRADUITS)
    // =========================================================================

    /**
     * Traduit et optimise les meta pour une langue cible
     *
     * @param string $originalTitle Titre original
     * @param string $originalDescription Description originale
     * @param string $sourceLang Langue source
     * @param string $targetLang Langue cible
     * @param string $type Type de contenu
     * @param array $context Contexte
     * @return array ['meta_title' => '', 'meta_description' => '']
     */
    public function translateMeta(
        string $originalTitle,
        string $originalDescription,
        string $sourceLang,
        string $targetLang,
        string $type,
        array $context = []
    ): array {
        // Si même langue, juste optimiser
        if ($sourceLang === $targetLang) {
            return [
                'meta_title' => $this->generateMetaTitle($originalTitle, $type, $targetLang, $context),
                'meta_description' => $this->generateMetaDescription($originalTitle, $type, $targetLang, $context),
            ];
        }

        // Clé de cache
        $cacheKey = "seo_meta:{$sourceLang}:{$targetLang}:" . md5($originalTitle . $type);

        if ($cached = Cache::get($cacheKey)) {
            return $cached;
        }

        // Traduire le titre via GPT
        $translatedTitle = $this->translateText($originalTitle, $sourceLang, $targetLang, 'title');

        // Générer les meta optimisés dans la langue cible
        $result = [
            'meta_title' => $this->generateMetaTitle($translatedTitle, $type, $targetLang, $context),
            'meta_description' => $this->generateMetaDescription($translatedTitle, $type, $targetLang, $context),
        ];

        // Cache 30 jours
        Cache::put($cacheKey, $result, 60 * 60 * 24 * 30);

        return $result;
    }

    /**
     * Traduit un texte court via GPT
     */
    protected function translateText(string $text, string $from, string $to, string $context = 'title'): string
    {
        $langNames = [
            'fr' => 'français', 'en' => 'anglais', 'de' => 'allemand',
            'es' => 'espagnol', 'pt' => 'portugais', 'ru' => 'russe',
            'zh' => 'chinois', 'ar' => 'arabe', 'hi' => 'hindi',
        ];

        $prompt = "Traduis ce {$context} du {$langNames[$from]} vers le {$langNames[$to]}. "
            . "Garde le même ton et la même intention. "
            . "Réponds UNIQUEMENT avec la traduction, sans guillemets ni commentaire.\n\n"
            . "Texte: {$text}";

        try {
            $response = $this->gptService->chat(
                messages: [['role' => 'user', 'content' => $prompt]],
                model: GptService::MODEL_GPT4O_MINI,
                temperature: 0.3,
                maxTokens: 150
            );

            return trim($response['content']);
        } catch (\Exception $e) {
            Log::warning('SeoOptimizationService: Traduction échouée', ['error' => $e->getMessage()]);
            return $text; // Fallback: texte original
        }
    }

    // =========================================================================
    // ATTRIBUTS IMAGES SEO
    // =========================================================================

    /**
     * Génère tous les attributs SEO pour une image
     *
     * @param string $imageUrl URL de l'image
     * @param string $title Titre/contexte
     * @param string $lang Code langue
     * @param array $dimensions [width, height] optionnel
     * @return array Attributs HTML
     */
    public function generateImageAttributes(
        string $imageUrl,
        string $title,
        string $lang,
        array $dimensions = []
    ): array {
        $altText = $this->generateAltText($title, $lang);

        $attributes = [
            'src' => $imageUrl,
            'alt' => $altText,
            'loading' => 'lazy',
            'decoding' => 'async',
            'aria-label' => $altText,
        ];

        // Dimensions si disponibles
        if (!empty($dimensions['width'])) {
            $attributes['width'] = $dimensions['width'];
        }
        if (!empty($dimensions['height'])) {
            $attributes['height'] = $dimensions['height'];
        }

        // Srcset pour responsive
        if ($this->isResizableImage($imageUrl)) {
            $attributes['srcset'] = $this->generateSrcset($imageUrl, $dimensions);
            $attributes['sizes'] = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
        }

        return $attributes;
    }

    /**
     * Génère un alt text optimisé et traduit
     */
    public function generateAltText(string $title, string $lang): string
    {
        // Préfixes descriptifs par langue
        $prefixes = [
            'fr' => 'Illustration :',
            'en' => 'Illustration:',
            'de' => 'Abbildung:',
            'es' => 'Ilustración:',
            'pt' => 'Ilustração:',
            'ru' => 'Иллюстрация:',
            'zh' => '插图：',
            'ar' => 'توضيح:',
            'hi' => 'चित्रण:',
        ];

        $prefix = $prefixes[$lang] ?? $prefixes['en'];
        $cleanTitle = strip_tags($title);
        $cleanTitle = preg_replace('/[^\p{L}\p{N}\s\-]/u', '', $cleanTitle);

        $altText = "{$prefix} {$cleanTitle}";

        // Limiter à 125 caractères
        if (mb_strlen($altText) > self::ALT_TEXT_MAX) {
            $altText = mb_substr($altText, 0, self::ALT_TEXT_MAX - 3) . '...';
        }

        return trim($altText);
    }

    /**
     * Génère un srcset pour images responsives
     */
    protected function generateSrcset(string $imageUrl, array $dimensions): string
    {
        $widths = [320, 640, 768, 1024, 1200, 1920];
        $srcset = [];

        foreach ($widths as $width) {
            // Si l'image est sur un CDN compatible (Unsplash, Cloudinary, etc.)
            if (str_contains($imageUrl, 'unsplash.com')) {
                $resizedUrl = preg_replace('/w=\d+/', "w={$width}", $imageUrl);
                if ($resizedUrl === $imageUrl) {
                    $resizedUrl = $imageUrl . (str_contains($imageUrl, '?') ? '&' : '?') . "w={$width}";
                }
                $srcset[] = "{$resizedUrl} {$width}w";
            } elseif (str_contains($imageUrl, 'cloudinary.com')) {
                $resizedUrl = preg_replace('/upload\//', "upload/w_{$width}/", $imageUrl);
                $srcset[] = "{$resizedUrl} {$width}w";
            }
        }

        return implode(', ', $srcset);
    }

    /**
     * Vérifie si l'image peut être redimensionnée
     */
    protected function isResizableImage(string $imageUrl): bool
    {
        return str_contains($imageUrl, 'unsplash.com')
            || str_contains($imageUrl, 'cloudinary.com')
            || str_contains($imageUrl, 'imgix.net');
    }

    /**
     * Génère le HTML d'une image avec tous les attributs SEO
     */
    public function generateImageHtml(
        string $imageUrl,
        string $title,
        string $lang,
        array $dimensions = [],
        string $cssClass = ''
    ): string {
        $attributes = $this->generateImageAttributes($imageUrl, $title, $lang, $dimensions);

        if ($cssClass) {
            $attributes['class'] = $cssClass;
        }

        $attrString = collect($attributes)
            ->map(fn($value, $key) => $key . '="' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '"')
            ->implode(' ');

        return "<img {$attrString}>";
    }

    // =========================================================================
    // HEAD TAGS
    // =========================================================================

    /**
     * Génère tous les meta tags du head
     */
    public function generateHeadTags(Article $article, string $lang): array
    {
        return [
            'charset' => '<meta charset="UTF-8">',
            'viewport' => '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">',
            'robots' => $this->generateRobotsMeta($article),
            'title' => "<title>{$article->meta_title}</title>",
            'description' => "<meta name=\"description\" content=\"{$article->meta_description}\">",
            'author' => '<meta name="author" content="' . ($article->author->name ?? 'SOS-Expat') . '">',
            'language' => "<meta name=\"language\" content=\"{$lang}\">",
            'content_language' => "<meta http-equiv=\"content-language\" content=\"{$lang}\">",
        ];
    }

    /**
     * Génère les robots meta directives
     */
    public function generateRobotsMeta(Article $article): string
    {
        $directives = ['index', 'follow'];

        // Ajouter les directives de snippet
        $directives[] = 'max-snippet:-1'; // Pas de limite de snippet
        $directives[] = 'max-image-preview:large'; // Grandes images dans les résultats
        $directives[] = 'max-video-preview:-1'; // Pas de limite vidéo

        return '<meta name="robots" content="' . implode(', ', $directives) . '">';
    }

    /**
     * Génère les hints de performance (preconnect, dns-prefetch)
     */
    public function generatePerformanceHints(): array
    {
        return [
            // Preconnect aux CDN/APIs fréquents
            '<link rel="preconnect" href="https://fonts.googleapis.com">',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
            '<link rel="preconnect" href="https://images.unsplash.com">',

            // DNS Prefetch
            '<link rel="dns-prefetch" href="//www.google-analytics.com">',
            '<link rel="dns-prefetch" href="//www.googletagmanager.com">',
        ];
    }

    /**
     * Génère les headers HTTP recommandés pour le cache
     */
    public function getCacheHeaders(string $type = 'article'): array
    {
        $durations = [
            'article' => 3600 * 24, // 24h
            'pillar' => 3600 * 24 * 7, // 7 jours
            'landing' => 3600 * 24 * 30, // 30 jours
            'static' => 3600 * 24 * 365, // 1 an
        ];

        $maxAge = $durations[$type] ?? $durations['article'];

        return [
            'Cache-Control' => "public, max-age={$maxAge}, stale-while-revalidate=86400",
            'Vary' => 'Accept-Encoding, Accept-Language',
        ];
    }

    // =========================================================================
    // VALIDATION SEO
    // =========================================================================

    /**
     * Valide les meta d'un article et retourne les problèmes
     */
    public function validateArticleSeo(Article $article): array
    {
        $issues = [];
        $warnings = [];
        $score = 100;

        // Meta title
        $titleLength = mb_strlen($article->meta_title ?? '');
        if ($titleLength === 0) {
            $issues[] = 'Meta title manquant';
            $score -= 25;
        } elseif ($titleLength > self::META_TITLE_MAX) {
            $issues[] = "Meta title trop long ({$titleLength} > 60 caractères)";
            $score -= 15;
        } elseif ($titleLength < self::META_TITLE_MIN) {
            $warnings[] = "Meta title court ({$titleLength} caractères). Recommandé: 30-60.";
            $score -= 5;
        }

        // Meta description
        $descLength = mb_strlen($article->meta_description ?? '');
        if ($descLength === 0) {
            $issues[] = 'Meta description manquante';
            $score -= 20;
        } elseif ($descLength > self::META_DESCRIPTION_MAX) {
            $issues[] = "Meta description trop longue ({$descLength} > 160 caractères)";
            $score -= 10;
        } elseif ($descLength < self::META_DESCRIPTION_MIN) {
            $warnings[] = "Meta description courte ({$descLength} caractères). Recommandé: 120-160.";
            $score -= 5;
        }

        // Image alt
        if ($article->image_url && empty($article->image_alt)) {
            $issues[] = 'Image principale sans alt text';
            $score -= 15;
        }

        // Slug
        if (empty($article->slug)) {
            $issues[] = 'Slug manquant';
            $score -= 10;
        }

        return [
            'score' => max(0, $score),
            'grade' => $this->scoreToGrade($score),
            'issues' => $issues,
            'warnings' => $warnings,
            'meta_title_length' => $titleLength,
            'meta_description_length' => $descLength,
        ];
    }

    /**
     * Score to grade
     */
    protected function scoreToGrade(int $score): string
    {
        if ($score >= 90) return 'A';
        if ($score >= 80) return 'B';
        if ($score >= 70) return 'C';
        if ($score >= 60) return 'D';
        return 'F';
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Tronque un texte pour les meta tags
     */
    protected function truncateForMeta(string $text, int $maxLength): string
    {
        $text = strip_tags($text);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        $text = mb_substr($text, 0, $maxLength);
        $lastSpace = mb_strrpos($text, ' ');

        if ($lastSpace !== false && $lastSpace > $maxLength * 0.7) {
            $text = mb_substr($text, 0, $lastSpace);
        }

        return $text;
    }

    /**
     * Nettoie un texte pour utilisation dans les attributs HTML
     */
    public function sanitizeForAttribute(string $text): string
    {
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }
}
