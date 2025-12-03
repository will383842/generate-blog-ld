<?php

namespace App\Services\Translation;

use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Models\Language;
use App\Services\AI\GptService;
use App\Services\AI\CostTracker;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Service de traduction automatique multi-langues
 * Utilise GPT-4o-mini pour des traductions de haute qualité à faible coût
 */
class TranslationService
{
    protected GptService $gptService;
    protected CostTracker $costTracker;
    protected SlugService $slugService;
    protected EncodingValidator $encodingValidator;

    // Configuration
    protected int $chunkSize = 3000; // Tokens par chunk
    protected array $supportedLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    public function __construct(
        GptService $gptService,
        CostTracker $costTracker,
        SlugService $slugService,
        EncodingValidator $encodingValidator
    ) {
        $this->gptService = $gptService;
        $this->costTracker = $costTracker;
        $this->slugService = $slugService;
        $this->encodingValidator = $encodingValidator;
    }

    // =========================================================================
    // TRADUCTION D'ARTICLE COMPLET
    // =========================================================================

    /**
     * Traduit un article dans une langue cible
     * 
     * @param Article $article Article source
     * @param string $targetLang Code langue cible (en, de, es, etc.)
     * @return ArticleTranslation Traduction créée
     * @throws \Exception Si erreur de traduction
     */
    public function translateArticle(Article $article, string $targetLang): ArticleTranslation
    {
        $startTime = microtime(true);
        $totalCost = 0;

        try {
            // Validation
            $this->validateTranslationRequest($article, $targetLang);

            // Récupération langue cible
            $targetLanguage = Language::where('code', $targetLang)->firstOrFail();

            Log::info("🌍 Traduction article #{$article->id} vers {$targetLang}", [
                'article_id' => $article->id,
                'source_lang' => $article->language->code,
                'target_lang' => $targetLang,
                'word_count' => $article->word_count,
            ]);

            // Traduction des composants principaux
            $translatedTitle = $this->translateText(
                $article->title,
                $article->language->code,
                $targetLang,
                'title'
            );
            $totalCost += $this->getLastTranslationCost();

            $translatedExcerpt = $this->translateText(
                $article->excerpt,
                $article->language->code,
                $targetLang,
                'excerpt'
            );
            $totalCost += $this->getLastTranslationCost();

            // Traduction du contenu (peut nécessiter chunking)
            $translatedContent = $this->translateLongText(
                $article->content,
                $article->language->code,
                $targetLang
            );
            $totalCost += $this->getLastTranslationCost();

            // Génération du slug translittéré
            $slug = $this->slugService->generateSlug($translatedTitle, $targetLang);

            // Traduction image alt si présent
            $translatedImageAlt = null;
            if ($article->image_alt) {
                $translatedImageAlt = $this->translateText(
                    $article->image_alt,
                    $article->language->code,
                    $targetLang,
                    'alt_text'
                );
                $totalCost += $this->getLastTranslationCost();
            }

            // Validation UTF-8
            $this->encodingValidator->validateUtf8($translatedContent);

            // Création de la traduction
            $translation = ArticleTranslation::create([
                'article_id' => $article->id,
                'language_id' => $targetLanguage->id,
                'title' => $translatedTitle,
                'slug' => $slug,
                'excerpt' => $translatedExcerpt,
                'content' => $translatedContent,
                'image_alt' => $translatedImageAlt,
                'status' => 'active',
                'translation_cost' => $totalCost,
            ]);

            // Traduction des FAQs si présentes
            if ($article->faqs()->exists()) {
                $this->translateFaqs($article, $targetLanguage->id, $targetLang);
            }

            $duration = round(microtime(true) - $startTime, 2);

            Log::info("✅ Traduction terminée", [
                'article_id' => $article->id,
                'translation_id' => $translation->id,
                'target_lang' => $targetLang,
                'cost' => $totalCost,
                'duration' => $duration . 's',
            ]);

            return $translation;

        } catch (\Exception $e) {
            Log::error("❌ Erreur traduction article #{$article->id} vers {$targetLang}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    // =========================================================================
    // TRADUCTION TEXTE
    // =========================================================================

    /**
     * Traduit un texte court/moyen
     * 
     * @param string $text Texte source
     * @param string $from Code langue source
     * @param string $to Code langue cible
     * @param string $context Contexte (title, excerpt, content, etc.)
     * @return string Texte traduit
     */
    public function translateText(string $text, string $from, string $to, string $context = 'content'): string
    {
        // Cache key
        $cacheKey = "translation:{$from}:{$to}:" . md5($text . $context);
        
        // Vérifier cache
        if ($cached = Cache::get($cacheKey)) {
            Log::debug("📦 Traduction depuis cache", ['from' => $from, 'to' => $to]);
            return $cached;
        }

        // Préparation du prompt selon contexte
        $systemPrompt = $this->getSystemPrompt($from, $to, $context);
        $userPrompt = $this->getUserPrompt($text, $context);

        try {
            // Appel GPT-4o-mini (très économique pour traduction)
            $response = $this->gptService->chat(
                messages: [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                model: GptService::MODEL_GPT4O_MINI,
                temperature: 0.3, // Plus déterministe pour traduction
                maxTokens: $this->estimateOutputTokens($text)
            );

            $translatedText = trim($response['content']);

            // Validation et nettoyage
            $translatedText = $this->encodingValidator->sanitizeContent($translatedText);

            // Cache 30 jours
            Cache::put($cacheKey, $translatedText, 60 * 60 * 24 * 30);

            // Tracking coût
            if (isset($response['usage'])) {
                $cost = $this->calculateCost($response['usage']);
                $this->costTracker->trackCost('translation', $cost, [
                    'from' => $from,
                    'to' => $to,
                    'context' => $context,
                    'input_tokens' => $response['usage']['prompt_tokens'],
                    'output_tokens' => $response['usage']['completion_tokens'],
                ]);
            }

            return $translatedText;

        } catch (\Exception $e) {
            Log::error("❌ Erreur traduction texte", [
                'from' => $from,
                'to' => $to,
                'context' => $context,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Traduit un texte long avec chunking automatique
     * 
     * @param string $text Texte long
     * @param string $from Code langue source
     * @param string $to Code langue cible
     * @return string Texte traduit complet
     */
    public function translateLongText(string $text, string $from, string $to): string
    {
        $wordCount = str_word_count($text);

        // Si < 2000 mots, traduction directe
        if ($wordCount < 2000) {
            return $this->translateText($text, $from, $to, 'content');
        }

        Log::info("📚 Traduction longue ({$wordCount} mots) avec chunking");

        // Découpage intelligent par paragraphes HTML
        $chunks = $this->splitContentIntoChunks($text);
        $translatedChunks = [];

        foreach ($chunks as $index => $chunk) {
            Log::debug("Traduction chunk " . ($index + 1) . "/" . count($chunks));
            
            $translatedChunks[] = $this->translateText($chunk, $from, $to, 'content');
            
            // Petit délai entre chunks pour éviter rate limiting
            if ($index < count($chunks) - 1) {
                usleep(100000); // 0.1s
            }
        }

        return implode("\n\n", $translatedChunks);
    }

    // =========================================================================
    // TRADUCTION FAQS
    // =========================================================================

    /**
     * Traduit les FAQs d'un article
     * 
     * @param Article $article Article source
     * @param int $targetLanguageId ID langue cible
     * @param string $targetLangCode Code langue cible
     * @return void
     */
    protected function translateFaqs(Article $article, int $targetLanguageId, string $targetLangCode): void
    {
        $sourceFaqs = $article->faqs;

        foreach ($sourceFaqs as $faq) {
            $translatedQuestion = $this->translateText(
                $faq->question,
                $article->language->code,
                $targetLangCode,
                'faq_question'
            );

            $translatedAnswer = $this->translateText(
                $faq->answer,
                $article->language->code,
                $targetLangCode,
                'faq_answer'
            );

            // Création FAQ traduite
            \App\Models\ArticleFaq::create([
                'article_id' => $article->id,
                'language_id' => $targetLanguageId,
                'question' => $translatedQuestion,
                'answer' => $translatedAnswer,
                'order' => $faq->order,
            ]);
        }

        Log::info("✅ {$sourceFaqs->count()} FAQs traduites vers {$targetLangCode}");
    }

    /**
     * Traduit un tableau de FAQs
     * 
     * @param array $faqs Tableau de FAQs ['question' => '', 'answer' => '']
     * @param string $targetLang Code langue cible
     * @return array FAQs traduites
     */
    public function translateFaqsArray(array $faqs, string $targetLang): array
    {
        $translatedFaqs = [];

        foreach ($faqs as $faq) {
            $translatedFaqs[] = [
                'question' => $this->translateText($faq['question'], 'fr', $targetLang, 'faq_question'),
                'answer' => $this->translateText($faq['answer'], 'fr', $targetLang, 'faq_answer'),
            ];
        }

        return $translatedFaqs;
    }

    // =========================================================================
    // TRADUCTION MÉTADONNÉES
    // =========================================================================

    /**
     * Traduit les métadonnées SEO
     * 
     * @param array $meta Meta données ['title' => '', 'description' => '']
     * @param string $targetLang Code langue cible
     * @return array Meta traduites
     */
    public function translateMeta(array $meta, string $targetLang): array
    {
        return [
            'title' => $this->translateText($meta['title'], 'fr', $targetLang, 'meta_title'),
            'description' => $this->translateText($meta['description'], 'fr', $targetLang, 'meta_description'),
        ];
    }

    /**
     * Traduit un texte alt d'image
     * 
     * @param string $altText Texte alt
     * @param string $targetLang Code langue cible
     * @return string Alt traduit
     */
    public function translateAltText(string $altText, string $targetLang): string
    {
        return $this->translateText($altText, 'fr', $targetLang, 'alt_text');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Valide une requête de traduction
     */
    protected function validateTranslationRequest(Article $article, string $targetLang): void
    {
        if (!in_array($targetLang, $this->supportedLanguages)) {
            throw new \InvalidArgumentException("Langue non supportée: {$targetLang}");
        }

        if ($article->language->code === $targetLang) {
            throw new \InvalidArgumentException("La langue cible doit être différente de la source");
        }

        // Vérifier si traduction existe déjà
        $targetLanguage = Language::where('code', $targetLang)->first();
        if ($targetLanguage) {
            $exists = ArticleTranslation::where('article_id', $article->id)
                ->where('language_id', $targetLanguage->id)
                ->exists();

            if ($exists) {
                throw new \RuntimeException("Traduction déjà existante pour {$targetLang}");
            }
        }
    }

    /**
     * Génère le prompt système selon contexte
     */
    protected function getSystemPrompt(string $from, string $to, string $context): string
    {
        $langNames = [
            'fr' => 'français',
            'en' => 'anglais',
            'de' => 'allemand',
            'es' => 'espagnol',
            'pt' => 'portugais',
            'ru' => 'russe',
            'zh' => 'chinois simplifié',
            'ar' => 'arabe',
            'hi' => 'hindi',
        ];

        $fromName = $langNames[$from] ?? $from;
        $toName = $langNames[$to] ?? $to;

        $basePrompt = "Tu es un traducteur professionnel expert spécialisé dans les contenus web pour expatriés. ";
        $basePrompt .= "Traduis du {$fromName} vers le {$toName} en préservant le ton, le style et la structure HTML si présente. ";

        switch ($context) {
            case 'title':
                return $basePrompt . "Pour les titres, sois concis et impactant. Adapte les expressions idiomatiques.";
            
            case 'excerpt':
                return $basePrompt . "Pour les extraits, reste informatif et engageant. Maximum 160 caractères si possible.";
            
            case 'meta_title':
                return $basePrompt . "Pour les meta titres SEO, optimise pour les moteurs de recherche. Maximum 60 caractères.";
            
            case 'meta_description':
                return $basePrompt . "Pour les meta descriptions, sois persuasif et inclus un appel à l'action. Maximum 160 caractères.";
            
            case 'faq_question':
                return $basePrompt . "Traduis cette question de FAQ de manière naturelle et courante dans la langue cible.";
            
            case 'faq_answer':
                return $basePrompt . "Traduis cette réponse de FAQ en gardant le ton informatif et rassurant.";
            
            case 'alt_text':
                return $basePrompt . "Traduis ce texte alt d'image de manière descriptive et accessible.";
            
            case 'content':
            default:
                return $basePrompt . "Traduis ce contenu en préservant parfaitement les balises HTML, la structure, les liens et la mise en forme. Adapte culturellement si nécessaire.";
        }
    }

    /**
     * Génère le prompt utilisateur selon contexte
     */
    protected function getUserPrompt(string $text, string $context): string
    {
        if ($context === 'content') {
            return "Traduis le contenu HTML suivant en préservant EXACTEMENT toutes les balises et la structure:\n\n{$text}";
        }

        return $text;
    }

    /**
     * Découpe le contenu en chunks intelligents
     */
    protected function splitContentIntoChunks(string $content): array
    {
        // Découpage par sections H2/H3
        $chunks = [];
        $currentChunk = '';
        $currentSize = 0;
        $maxSize = 1500; // mots par chunk

        // Split par paragraphes HTML
        $paragraphs = preg_split('/(<\/h[23]>|<\/p>|<\/div>|<\/li>)/i', $content, -1, PREG_SPLIT_DELIM_CAPTURE);

        for ($i = 0; $i < count($paragraphs); $i += 2) {
            $para = ($paragraphs[$i] ?? '') . ($paragraphs[$i + 1] ?? '');
            $paraSize = str_word_count(strip_tags($para));

            if ($currentSize + $paraSize > $maxSize && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);
                $currentChunk = $para;
                $currentSize = $paraSize;
            } else {
                $currentChunk .= $para;
                $currentSize += $paraSize;
            }
        }

        if (!empty($currentChunk)) {
            $chunks[] = trim($currentChunk);
        }

        return array_filter($chunks);
    }

    /**
     * Estime les tokens de sortie nécessaires
     */
    protected function estimateOutputTokens(string $text): int
    {
        $wordCount = str_word_count($text);
        // Ratio moyen: 1 mot = 1.3 tokens, +20% marge
        return (int) ceil($wordCount * 1.3 * 1.2);
    }

    /**
     * Calcule le coût d'une traduction
     */
    protected function calculateCost(array $usage): float
    {
        $pricing = config('ai.openai.pricing.gpt-4o-mini');
        
        $inputCost = ($usage['prompt_tokens'] / 1000) * $pricing['input'];
        $outputCost = ($usage['completion_tokens'] / 1000) * $pricing['output'];
        
        return round($inputCost + $outputCost, 6);
    }

    /**
     * Récupère le coût de la dernière traduction
     */
    protected function getLastTranslationCost(): float
    {
        // Récupéré depuis le tracker
        return $this->costTracker->getLastOperationCost() ?? 0;
    }

    /**
     * Obtient les langues supportées
     */
    public function getSupportedLanguages(): array
    {
        return $this->supportedLanguages;
    }
}