<?php

namespace App\Services\Linking;

use App\Models\Article;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class TfIdfService
{
    protected int $maxKeywords;
    protected float $titleWeight;
    protected float $headingWeight;

    public function __construct()
    {
        $this->maxKeywords = config('linking.tfidf.max_keywords', 50);
        $this->titleWeight = config('linking.tfidf.title_weight', 3.0);
        $this->headingWeight = config('linking.tfidf.heading_weight', 2.0);
    }

    /**
     * Calcule le score de pertinence entre un article source et des candidats
     */
    public function scoreArticleRelevance(Article $source, Collection $candidates): Collection
    {
        // Extraire les mots-clés de l'article source
        $sourceKeywords = $this->extractKeywords($source);

        if (empty($sourceKeywords)) {
            return $candidates->map(fn($c) => ['article' => $c, 'score' => 0]);
        }

        // Calculer l'IDF pour chaque mot-clé
        $idfScores = $this->calculateIdf($sourceKeywords, $candidates);

        // Scorer chaque candidat
        return $candidates->map(function ($candidate) use ($sourceKeywords, $idfScores) {
            $candidateKeywords = $this->extractKeywords($candidate);
            $score = $this->calculateTfIdfSimilarity($sourceKeywords, $candidateKeywords, $idfScores);

            return [
                'article' => $candidate,
                'score' => round($score * 100, 1),
                'common_keywords' => array_intersect(array_keys($sourceKeywords), array_keys($candidateKeywords))
            ];
        });
    }

    /**
     * Extrait les mots-clés d'un article avec leurs fréquences
     */
    public function extractKeywords(Article $article): array
    {
        $cacheKey = "article_keywords:{$article->id}:" . md5($article->updated_at);

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($article) {
            $keywords = [];

            // Extraire du titre (poids élevé)
            $titleWords = $this->tokenize($article->title);
            foreach ($titleWords as $word) {
                $keywords[$word] = ($keywords[$word] ?? 0) + $this->titleWeight;
            }

            // Extraire des headings
            $headings = $this->extractHeadings($article->content);
            foreach ($headings as $heading) {
                $headingWords = $this->tokenize($heading);
                foreach ($headingWords as $word) {
                    $keywords[$word] = ($keywords[$word] ?? 0) + $this->headingWeight;
                }
            }

            // Extraire du contenu
            $content = strip_tags($article->content);
            $contentWords = $this->tokenize($content);
            foreach ($contentWords as $word) {
                $keywords[$word] = ($keywords[$word] ?? 0) + 1;
            }

            // Filtrer les stopwords
            $keywords = $this->removeStopwords($keywords, $article->language_code);

            // Garder les N meilleurs
            arsort($keywords);
            return array_slice($keywords, 0, $this->maxKeywords, true);
        });
    }

    /**
     * Tokenize un texte en mots
     */
    protected function tokenize(string $text): array
    {
        // Nettoyer le texte
        $text = mb_strtolower($text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);

        // Diviser en mots
        $words = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);

        // Filtrer les mots trop courts
        return array_filter($words, fn($w) => mb_strlen($w) >= 3);
    }

    /**
     * Extrait les titres (headings) du contenu HTML
     */
    protected function extractHeadings(string $content): array
    {
        preg_match_all('/<h[1-6][^>]*>(.*?)<\/h[1-6]>/is', $content, $matches);
        return array_map('strip_tags', $matches[1] ?? []);
    }

    /**
     * Retire les stopwords selon la langue
     */
    protected function removeStopwords(array $keywords, string $lang): array
    {
        $stopwords = $this->getStopwords($lang);
        
        return array_filter($keywords, function ($freq, $word) use ($stopwords) {
            return !in_array($word, $stopwords);
        }, ARRAY_FILTER_USE_BOTH);
    }

    /**
     * Récupère les stopwords pour une langue
     */
    protected function getStopwords(string $lang): array
    {
        $stopwords = [
            'fr' => ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'est', 'en', 'au', 'aux', 
                     'pour', 'par', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces', 'qui', 'que', 'quoi',
                     'son', 'sa', 'ses', 'leur', 'leurs', 'nous', 'vous', 'ils', 'elles', 'être', 'avoir',
                     'fait', 'faire', 'comme', 'plus', 'tout', 'tous', 'toute', 'toutes', 'pas', 'mais',
                     'donc', 'car', 'ainsi', 'aussi', 'bien', 'très', 'peut', 'peuvent', 'doit', 'doivent'],
            'en' => ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
                     'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
                     'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
                     'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'you', 'your'],
            'es' => ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o',
                     'en', 'con', 'por', 'para', 'que', 'como', 'más', 'pero', 'su', 'sus', 'es', 'son',
                     'ser', 'estar', 'hay', 'tiene', 'tienen', 'fue', 'era', 'sido', 'siendo', 'hacer'],
            'de' => ['der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'in', 'auf', 'an', 'für',
                     'mit', 'von', 'zu', 'bei', 'ist', 'sind', 'war', 'werden', 'wird', 'haben', 'hat',
                     'sein', 'kann', 'können', 'muss', 'müssen', 'diese', 'dieser', 'dieses', 'wenn', 'auch'],
            'pt' => ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'e', 'ou', 'em',
                     'no', 'na', 'por', 'para', 'com', 'que', 'como', 'mais', 'mas', 'seu', 'sua',
                     'ser', 'estar', 'ter', 'foi', 'era', 'são', 'está', 'pode', 'podem', 'deve'],
            // Russe (cyrillique)
            'ru' => ['и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все',
                     'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по',
                     'только', 'её', 'мне', 'было', 'вот', 'от', 'меня', 'ещё', 'нет', 'о', 'из', 'ему',
                     'теперь', 'когда', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь',
                     'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может',
                     'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем',
                     'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под'],
            // Chinois (caractères les plus fréquents / mots grammaticaux)
            'zh' => ['的', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个',
                     '国', '我', '以', '要', '他', '时', '来', '用', '们', '生', '到', '作', '地', '于',
                     '出', '就', '分', '对', '成', '会', '可', '主', '发', '年', '动', '同', '工', '也',
                     '能', '下', '过', '子', '说', '产', '种', '面', '而', '方', '后', '多', '定', '行',
                     '学', '法', '所', '民', '得', '经', '十', '三', '之', '进', '着', '等', '部', '度',
                     '家', '电', '力', '里', '如', '水', '化', '高', '自', '二', '理', '起', '小', '物',
                     '现', '实', '加', '量', '都', '两', '体', '制', '机', '当', '使', '点', '从', '业'],
            // Arabe
            'ar' => ['في', 'من', 'على', 'إلى', 'عن', 'أن', 'هذا', 'هذه', 'التي', 'الذي', 'ما', 'مع',
                     'كان', 'قد', 'و', 'أو', 'ثم', 'بعد', 'قبل', 'حتى', 'لكن', 'إذا', 'كل', 'بين',
                     'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'ذلك', 'تلك', 'هنا', 'هناك', 'كيف', 'لماذا',
                     'متى', 'أين', 'كم', 'أي', 'لا', 'نعم', 'غير', 'بل', 'لم', 'لن', 'سوف', 'قال',
                     'عند', 'منذ', 'خلال', 'حول', 'ضد', 'نحو', 'بسبب', 'رغم', 'مثل', 'فقط', 'أيضا',
                     'جدا', 'كثير', 'قليل', 'بعض', 'كلا', 'أحد', 'آخر', 'أول', 'ثاني', 'نفس', 'ذات'],
            // Hindi (Devanagari)
            'hi' => ['का', 'के', 'की', 'है', 'हैं', 'में', 'को', 'से', 'पर', 'और', 'एक', 'यह', 'था',
                     'थी', 'थे', 'होता', 'होती', 'होते', 'हो', 'गया', 'गयी', 'गये', 'किया', 'कर',
                     'करते', 'करता', 'करती', 'जो', 'तो', 'ने', 'भी', 'इस', 'उस', 'वह', 'यहाँ', 'वहाँ',
                     'कि', 'जब', 'तब', 'अब', 'कब', 'कहाँ', 'क्या', 'कैसे', 'क्यों', 'कितना', 'कौन',
                     'इसके', 'उसके', 'अपने', 'अपना', 'अपनी', 'मैं', 'हम', 'तुम', 'आप', 'वे', 'उन',
                     'इन', 'जिस', 'जिसे', 'जिसने', 'सब', 'कुछ', 'बहुत', 'अधिक', 'कम', 'साथ', 'बाद',
                     'पहले', 'अगर', 'मगर', 'लेकिन', 'परंतु', 'या', 'अथवा', 'तथा', 'एवं', 'न', 'नहीं'],
        ];

        return $stopwords[$lang] ?? $stopwords['en'];
    }

    /**
     * Calcule l'IDF (Inverse Document Frequency) pour les mots-clés
     */
    protected function calculateIdf(array $sourceKeywords, Collection $candidates): array
    {
        $totalDocs = $candidates->count() + 1;
        $idf = [];

        foreach (array_keys($sourceKeywords) as $keyword) {
            $docCount = 1; // L'article source contient le mot

            foreach ($candidates as $candidate) {
                $candidateKeywords = $this->extractKeywords($candidate);
                if (isset($candidateKeywords[$keyword])) {
                    $docCount++;
                }
            }

            $idf[$keyword] = log($totalDocs / $docCount) + 1;
        }

        return $idf;
    }

    /**
     * Calcule la similarité TF-IDF entre deux ensembles de mots-clés
     */
    protected function calculateTfIdfSimilarity(array $source, array $candidate, array $idf): float
    {
        if (empty($source) || empty($candidate)) {
            return 0;
        }

        $sourceVector = [];
        $candidateVector = [];

        // Construire les vecteurs TF-IDF
        $allKeywords = array_unique(array_merge(array_keys($source), array_keys($candidate)));

        foreach ($allKeywords as $keyword) {
            $sourceTf = $source[$keyword] ?? 0;
            $candidateTf = $candidate[$keyword] ?? 0;
            $keywordIdf = $idf[$keyword] ?? 1;

            $sourceVector[] = $sourceTf * $keywordIdf;
            $candidateVector[] = $candidateTf * $keywordIdf;
        }

        // Similarité cosinus
        return $this->cosineSimilarity($sourceVector, $candidateVector);
    }

    /**
     * Calcule la similarité cosinus entre deux vecteurs
     */
    protected function cosineSimilarity(array $vec1, array $vec2): float
    {
        $dotProduct = 0;
        $norm1 = 0;
        $norm2 = 0;

        for ($i = 0; $i < count($vec1); $i++) {
            $dotProduct += $vec1[$i] * $vec2[$i];
            $norm1 += $vec1[$i] * $vec1[$i];
            $norm2 += $vec2[$i] * $vec2[$i];
        }

        $norm1 = sqrt($norm1);
        $norm2 = sqrt($norm2);

        if ($norm1 == 0 || $norm2 == 0) {
            return 0;
        }

        return $dotProduct / ($norm1 * $norm2);
    }

    /**
     * Récupère les mots-clés communs entre deux articles
     */
    public function getCommonKeywords(Article $article1, Article $article2): array
    {
        $keywords1 = $this->extractKeywords($article1);
        $keywords2 = $this->extractKeywords($article2);

        $common = array_intersect_key($keywords1, $keywords2);

        // Trier par fréquence combinée
        arsort($common);

        return array_slice(array_keys($common), 0, 10);
    }
}
