<?php

namespace App\Services\Quality;

use App\Models\Article;
use App\Models\Platform;
use App\Models\QualityCheck;
use App\Models\GoldenExample;
use App\Services\Content\PlatformKnowledgeService;
use App\Services\Content\BrandValidationService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * =============================================================================
 * PHASE 13 - FICHIER 5/14 : ContentQualityEnforcer
 * =============================================================================
 * 
 * EMPLACEMENT : app/Services/Quality/ContentQualityEnforcer.php
 * 
 * DESCRIPTION : Service de validation qualité avancée avec 6 critères
 * Complète et enrichit PlatformKnowledgeService + BrandValidationService
 * 
 * 6 CRITÈRES VALIDATION :
 * 1. Knowledge Compliance (30%) - PlatformKnowledgeService
 * 2. Brand Compliance (25%) - BrandValidationService  
 * 3. SEO Quality (15%) - NOUVEAU
 * 4. Readability (15%) - NOUVEAU
 * 5. Structure Quality (10%) - NOUVEAU
 * 6. Originality (5%) - NOUVEAU
 * 
 * =============================================================================
 */

class ContentQualityEnforcer
{
    protected PlatformKnowledgeService $knowledgeService;
    protected BrandValidationService $brandValidator;
    
    // Pondération des critères (total = 100%)
    protected array $weights = [
        'knowledge' => 0.30,    // 30%
        'brand' => 0.25,        // 25%
        'seo' => 0.15,          // 15%
        'readability' => 0.15,  // 15%
        'structure' => 0.10,    // 10%
        'originality' => 0.05,  // 5%
    ];
    
    // Phrases génériques à pénaliser (par langue)
    protected array $genericPhrases = [
        'fr' => [
            'dans cet article',
            'nous allons voir',
            'il est important de',
            'il faut savoir que',
            'cet article va vous',
            'vous allez découvrir',
            'commençons par',
            'pour conclure',
            'en conclusion',
            'pour résumer',
        ],
        'en' => [
            'in this article',
            'we will see',
            'it is important',
            'you need to know',
            'this article will',
            'you will discover',
            'let\'s start',
            'to conclude',
            'in conclusion',
            'to summarize',
        ],
        'es' => [
            'en este artículo',
            'vamos a ver',
            'es importante',
            'hay que saber',
            'este artículo va',
            'vas a descubrir',
            'empecemos por',
            'para concluir',
            'en conclusión',
            'para resumir',
        ],
    ];

    public function __construct(
        PlatformKnowledgeService $knowledgeService,
        BrandValidationService $brandValidator
    ) {
        $this->knowledgeService = $knowledgeService;
        $this->brandValidator = $brandValidator;
    }

    // =========================================================================
    // MÉTHODE PRINCIPALE : VALIDATION COMPLÈTE
    // =========================================================================

    /**
     * Valider un article avec les 6 critères
     * 
     * @param Article $article Article à valider
     * @return QualityCheck Objet QualityCheck créé et sauvegardé
     */
    public function validateArticle(Article $article): QualityCheck
    {
        $platform = $article->platform;
        $languageCode = $article->language_code;
        $content = $article->content;
        
        Log::info('ContentQualityEnforcer: Démarrage validation', [
            'article_id' => $article->id,
            'platform' => $platform->slug,
            'language' => $languageCode,
        ]);
        
        // =====================================================================
        // CRITÈRE 1 : KNOWLEDGE COMPLIANCE (30%)
        // =====================================================================
        $knowledgeValidation = $this->validateKnowledge($content, $platform, $languageCode);
        
        // =====================================================================
        // CRITÈRE 2 : BRAND COMPLIANCE (25%)
        // =====================================================================
        $brandValidation = $this->validateBrand($content, $platform, $languageCode);
        
        // =====================================================================
        // CRITÈRE 3 : SEO QUALITY (15%)
        // =====================================================================
        $seoValidation = $this->validateSEO($article);
        
        // =====================================================================
        // CRITÈRE 4 : READABILITY (15%)
        // =====================================================================
        $readabilityValidation = $this->validateReadability($content, $languageCode);
        
        // =====================================================================
        // CRITÈRE 5 : STRUCTURE QUALITY (10%)
        // =====================================================================
        $structureValidation = $this->validateStructure($content);
        
        // =====================================================================
        // CRITÈRE 6 : ORIGINALITY (5%)
        // =====================================================================
        $originalityValidation = $this->validateOriginality($article);
        
        // =====================================================================
        // CALCUL SCORE GLOBAL PONDÉRÉ
        // =====================================================================
        $overallScore = 
            $knowledgeValidation['score'] * $this->weights['knowledge'] +
            $brandValidation['score'] * $this->weights['brand'] +
            $seoValidation['score'] * $this->weights['seo'] +
            $readabilityValidation['score'] * $this->weights['readability'] +
            $structureValidation['score'] * $this->weights['structure'] +
            $originalityValidation['score'] * $this->weights['originality'];
        
        $overallScore = round($overallScore, 2);
        
        // =====================================================================
        // DÉTERMINATION STATUT
        // =====================================================================
        $status = $this->determineStatus(
            $overallScore,
            [
                $knowledgeValidation,
                $brandValidation,
                $seoValidation,
                $readabilityValidation,
                $structureValidation,
                $originalityValidation,
            ]
        );
        
        // =====================================================================
        // COLLECTE ERREURS/WARNINGS/SUGGESTIONS
        // =====================================================================
        $errors = array_merge(
            $knowledgeValidation['errors'] ?? [],
            $brandValidation['errors'] ?? [],
            $seoValidation['errors'] ?? [],
            $readabilityValidation['errors'] ?? [],
            $structureValidation['errors'] ?? [],
            $originalityValidation['errors'] ?? []
        );
        
        $warnings = array_merge(
            $knowledgeValidation['warnings'] ?? [],
            $brandValidation['warnings'] ?? [],
            $seoValidation['warnings'] ?? [],
            $readabilityValidation['warnings'] ?? [],
            $structureValidation['warnings'] ?? [],
            $originalityValidation['warnings'] ?? []
        );
        
        $suggestions = $this->generateSuggestions([
            'knowledge' => $knowledgeValidation,
            'brand' => $brandValidation,
            'seo' => $seoValidation,
            'readability' => $readabilityValidation,
            'structure' => $structureValidation,
            'originality' => $originalityValidation,
        ]);
        
        // =====================================================================
        // CRÉATION QUALITY CHECK
        // =====================================================================
        $qualityCheck = QualityCheck::create([
            'checkable_type' => Article::class,
            'checkable_id' => $article->id,
            'content_type' => 'article',
            'platform_id' => $platform->id,
            'language_code' => $languageCode,
            'knowledge_score' => $knowledgeValidation['score'],
            'brand_score' => $brandValidation['score'],
            'seo_score' => $seoValidation['score'],
            'readability_score' => $readabilityValidation['score'],
            'structure_score' => $structureValidation['score'],
            'originality_score' => $originalityValidation['score'],
            'overall_score' => $overallScore,
            'status' => $status,
            'validation_details' => [
                'knowledge' => $knowledgeValidation,
                'brand' => $brandValidation,
                'seo' => $seoValidation,
                'readability' => $readabilityValidation,
                'structure' => $structureValidation,
                'originality' => $originalityValidation,
            ],
            'errors' => $errors,
            'warnings' => $warnings,
            'suggestions' => $suggestions,
            'checked_at' => now(),
        ]);
        
        Log::info('ContentQualityEnforcer: Validation terminée', [
            'article_id' => $article->id,
            'overall_score' => $overallScore,
            'status' => $status,
            'errors_count' => count($errors),
            'warnings_count' => count($warnings),
        ]);
        
        return $qualityCheck;
    }

    // =========================================================================
    // CRITÈRE 1 : KNOWLEDGE COMPLIANCE (30%)
    // =========================================================================

    /**
     * Valider conformité knowledge (utilise PlatformKnowledgeService existant)
     */
    protected function validateKnowledge(string $content, Platform $platform, string $languageCode): array
    {
        $validation = $this->knowledgeService->validateContent(
            $content,
            $platform,
            $languageCode
        );
        
        return [
            'score' => $validation['score'],
            'valid' => $validation['valid'],
            'errors' => $validation['errors'] ?? [],
            'warnings' => $validation['warnings'] ?? [],
            'details' => $validation,
        ];
    }

    // =========================================================================
    // CRITÈRE 2 : BRAND COMPLIANCE (25%)
    // =========================================================================

    /**
     * Valider conformité brand (utilise BrandValidationService existant)
     */
    protected function validateBrand(string $content, Platform $platform, string $languageCode): array
    {
        $validation = $this->brandValidator->validateCompliance(
            $content,
            $platform,
            $languageCode
        );
        
        return [
            'score' => $validation['score'],
            'compliant' => $validation['compliant'],
            'errors' => $validation['errors'] ?? [],
            'warnings' => $validation['warnings'] ?? [],
            'details' => $validation,
        ];
    }

    // =========================================================================
    // CRITÈRE 3 : SEO QUALITY (15%) - NOUVEAU
    // =========================================================================

    /**
     * Valider qualité SEO
     */
    protected function validateSEO(Article $article): array
    {
        $score = 100;
        $errors = [];
        $warnings = [];
        $details = [];
        
        // --- Meta Title ---
        $metaTitleLength = mb_strlen($article->meta_title ?? '');
        $details['meta_title_length'] = $metaTitleLength;
        
        if ($metaTitleLength < 50 || $metaTitleLength > 60) {
            $errors[] = "Meta title longueur non optimale : {$metaTitleLength} chars (cible 50-60)";
            $score -= 15;
        }
        
        // --- Meta Description ---
        $metaDescLength = mb_strlen($article->meta_description ?? '');
        $details['meta_desc_length'] = $metaDescLength;
        
        if ($metaDescLength < 120 || $metaDescLength > 160) {
            $errors[] = "Meta description longueur non optimale : {$metaDescLength} chars (cible 120-160)";
            $score -= 15;
        }
        
        // --- H1 unique ---
        $h1Count = substr_count($article->content, '<h1');
        $details['h1_count'] = $h1Count;
        
        if ($h1Count !== 1) {
            $errors[] = "H1 invalide : {$h1Count} trouvés (doit être exactement 1)";
            $score -= 10;
        }
        
        // --- H2 count (6-8 optimum) ---
        $h2Count = substr_count($article->content, '<h2');
        $details['h2_count'] = $h2Count;
        
        if ($h2Count < 6 || $h2Count > 8) {
            $warnings[] = "Nombre H2 non optimal : {$h2Count} (cible 6-8)";
            $score -= 5;
        }
        
        // --- Images avec alt text ---
        preg_match_all('/<img[^>]+>/i', $article->content, $images);
        $totalImages = count($images[0]);
        $imagesWithAlt = 0;
        
        foreach ($images[0] as $img) {
            if (preg_match('/alt=["\'][^"\']*["\']/', $img)) {
                $imagesWithAlt++;
            }
        }
        
        $details['total_images'] = $totalImages;
        $details['images_with_alt'] = $imagesWithAlt;
        
        if ($totalImages > 0 && $imagesWithAlt < $totalImages) {
            $missing = $totalImages - $imagesWithAlt;
            $warnings[] = "{$missing} images sans alt text (important pour SEO)";
            $score -= ($missing * 3); // -3 points par image sans alt
        }
        
        // --- Keyword density (approximative) ---
        $title = strtolower($article->title);
        $content = strtolower(strip_tags($article->content));
        $words = str_word_count($content, 1);
        $wordCount = count($words);
        
        // Extraire keyword principal du titre (premier mot significatif)
        $titleWords = explode(' ', $title);
        $keyword = '';
        foreach ($titleWords as $word) {
            if (strlen($word) > 4) { // Ignorer mots courts (le, de, etc.)
                $keyword = $word;
                break;
            }
        }
        
        if ($keyword) {
            $keywordCount = substr_count($content, $keyword);
            $density = ($keywordCount / $wordCount) * 100;
            $details['keyword_density'] = round($density, 2);
            
            if ($density < 1 || $density > 2.5) {
                $warnings[] = "Densité keyword '{$keyword}' non optimale : {$density}% (cible 1-2%)";
                $score -= 5;
            }
        }
        
        $score = max(0, min(100, $score));
        
        return [
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
            'details' => $details,
        ];
    }

    // =========================================================================
    // CRITÈRE 4 : READABILITY (15%) - NOUVEAU
    // =========================================================================

    /**
     * Valider lisibilité (Flesch-Kincaid, paragraphes, transitions)
     */
    protected function validateReadability(string $content, string $languageCode): array
    {
        $score = 100;
        $errors = [];
        $warnings = [];
        $details = [];
        
        $plainText = strip_tags($content);
        
        // --- Flesch-Kincaid (simplifié) ---
        $fleschScore = $this->calculateFleschKincaid($plainText);
        $details['flesch_kincaid'] = $fleschScore;
        
        if ($fleschScore < 60) {
            $warnings[] = "Score lisibilité Flesch-Kincaid : {$fleschScore} (cible ≥60 pour facile)";
            $score -= 10;
        } elseif ($fleschScore >= 80) {
            $details['readability_level'] = 'Très facile';
        } elseif ($fleschScore >= 60) {
            $details['readability_level'] = 'Facile';
        }
        
        // --- Longueur paragraphes ---
        $paragraphs = explode("\n\n", $plainText);
        $avgParagraphLength = 0;
        $longParagraphs = 0;
        
        foreach ($paragraphs as $para) {
            $paraWords = str_word_count($para);
            $avgParagraphLength += $paraWords;
            
            if ($paraWords > 150) {
                $longParagraphs++;
            }
        }
        
        $avgParagraphLength = count($paragraphs) > 0 ? $avgParagraphLength / count($paragraphs) : 0;
        $details['avg_paragraph_length'] = round($avgParagraphLength, 1);
        
        if ($longParagraphs > 0) {
            $warnings[] = "{$longParagraphs} paragraphes >150 mots (réduire pour mobile)";
            $score -= ($longParagraphs * 5);
        }
        
        // --- Transitions entre sections ---
        $transitionWords = [
            'fr' => ['ensuite', 'puis', 'par ailleurs', 'de plus', 'en outre', 'cependant', 'toutefois', 'néanmoins'],
            'en' => ['then', 'next', 'moreover', 'furthermore', 'however', 'nevertheless', 'therefore'],
            'es' => ['luego', 'después', 'además', 'sin embargo', 'por lo tanto'],
        ];
        
        $transitions = $transitionWords[$languageCode] ?? $transitionWords['en'];
        $transitionCount = 0;
        
        foreach ($transitions as $word) {
            $transitionCount += substr_count(strtolower($plainText), $word);
        }
        
        $details['transition_count'] = $transitionCount;
        
        if ($transitionCount < 3) {
            $warnings[] = "Peu de mots de transition ({$transitionCount}) - ajouter pour fluidité";
            $score -= 5;
        }
        
        $score = max(0, min(100, $score));
        
        return [
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
            'details' => $details,
        ];
    }

    // =========================================================================
    // CRITÈRE 5 : STRUCTURE QUALITY (10%) - NOUVEAU
    // =========================================================================

    /**
     * Valider structure (intro, sections, conclusion, FAQs, listes)
     */
    protected function validateStructure(string $content): array
    {
        $score = 100;
        $errors = [];
        $warnings = [];
        $details = [];
        
        $plainText = strip_tags($content);
        $wordCount = str_word_count($plainText);
        
        // --- Introduction (100-150 mots au début) ---
        $intro = mb_substr($plainText, 0, 800); // ~150 mots
        $introWords = str_word_count($intro);
        $details['intro_word_count'] = $introWords;
        
        if ($introWords < 100) {
            $errors[] = "Introduction trop courte : {$introWords} mots (min 100)";
            $score -= 15;
        } elseif ($introWords > 150) {
            $warnings[] = "Introduction longue : {$introWords} mots (cible 100-150)";
            $score -= 5;
        }
        
        // --- Sections H2 équilibrées ---
        $h2Count = substr_count($content, '<h2');
        $details['section_count'] = $h2Count;
        
        if ($h2Count < 6) {
            $errors[] = "Pas assez de sections : {$h2Count} (min 6)";
            $score -= 10;
        } elseif ($h2Count > 8) {
            $warnings[] = "Beaucoup de sections : {$h2Count} (cible 6-8)";
            $score -= 5;
        }
        
        // --- Conclusion présente (chercher dernier paragraphe) ---
        $lastParagraph = mb_substr($plainText, -500);
        $conclusionWords = ['conclusion', 'résumé', 'synthèse', 'bref', 'finalement'];
        $hasConclusion = false;
        
        foreach ($conclusionWords as $word) {
            if (stripos($lastParagraph, $word) !== false) {
                $hasConclusion = true;
                break;
            }
        }
        
        $details['has_conclusion'] = $hasConclusion;
        
        if (!$hasConclusion) {
            $warnings[] = "Conclusion non détectée (chercher 'En conclusion', 'Pour résumer', etc.)";
            $score -= 10;
        }
        
        // --- FAQs count ---
        $faqCount = substr_count($content, '<h3');
        $details['faq_count'] = $faqCount;
        
        if ($faqCount < 5) {
            $warnings[] = "Peu de FAQs : {$faqCount} (cible ≥8 pour rich snippets)";
            $score -= 5;
        }
        
        // --- Listes bien formatées ---
        $ulCount = substr_count($content, '<ul');
        $olCount = substr_count($content, '<ol');
        $listCount = $ulCount + $olCount;
        $details['list_count'] = $listCount;
        
        if ($listCount < 2) {
            $warnings[] = "Peu de listes : {$listCount} (recommandé ≥2)";
            $score -= 5;
        }
        
        $score = max(0, min(100, $score));
        
        return [
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
            'details' => $details,
        ];
    }

    // =========================================================================
    // CRITÈRE 6 : ORIGINALITY (5%) - NOUVEAU
    // =========================================================================

    /**
     * Valider originalité (similarité Levenshtein + phrases génériques)
     */
    protected function validateOriginality(Article $article): array
    {
        $score = 100;
        $errors = [];
        $warnings = [];
        $details = [];
        
        // --- SIMILARITÉ vs ARTICLES EXISTANTS (Levenshtein) ---
        $similarity = $this->calculateSimilarity($article);
        $details['max_similarity'] = $similarity['max_similarity'];
        $details['similar_articles'] = $similarity['similar_articles'];
        
        if ($similarity['max_similarity'] > 70) {
            $errors[] = "Similarité élevée : {$similarity['max_similarity']}% vs article existant (max 70%)";
            $score -= 30;
        } elseif ($similarity['max_similarity'] > 50) {
            $warnings[] = "Similarité modérée : {$similarity['max_similarity']}% vs article existant";
            $score -= 10;
        }
        
        // --- PHRASES GÉNÉRIQUES ---
        $genericCount = $this->detectGenericPhrases($article->content, $article->language_code);
        $details['generic_phrases_count'] = $genericCount['count'];
        $details['generic_phrases_found'] = $genericCount['found'];
        
        if ($genericCount['count'] > 5) {
            $errors[] = "{$genericCount['count']} phrases génériques détectées (max 5)";
            $score -= 15;
        } elseif ($genericCount['count'] > 3) {
            $warnings[] = "{$genericCount['count']} phrases génériques (réduire à ≤3)";
            $score -= 5;
        }
        
        $score = max(0, min(100, $score));
        
        return [
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
            'details' => $details,
        ];
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Calculer similarité Levenshtein vs articles existants
     */
    protected function calculateSimilarity(Article $article): array
    {
        // Récupérer 10 derniers articles même plateforme/langue/thème
        $recentArticles = Article::where('platform_id', $article->platform_id)
            ->where('language_code', $article->language_code)
            ->where('id', '!=', $article->id)
            ->where('theme_type', $article->theme_type)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        $maxSimilarity = 0;
        $similarArticles = [];
        
        $currentContent = mb_strtolower(strip_tags($article->content));
        $currentLength = mb_strlen($currentContent);
        
        foreach ($recentArticles as $existing) {
            $existingContent = mb_strtolower(strip_tags($existing->content));
            $existingLength = mb_strlen($existingContent);
            
            // Utiliser similar_text pour performance (plus rapide que levenshtein)
            similar_text($currentContent, $existingContent, $percent);
            
            if ($percent > $maxSimilarity) {
                $maxSimilarity = $percent;
            }
            
            if ($percent > 50) {
                $similarArticles[] = [
                    'id' => $existing->id,
                    'title' => $existing->title,
                    'similarity' => round($percent, 2),
                ];
            }
        }
        
        return [
            'max_similarity' => round($maxSimilarity, 2),
            'similar_articles' => $similarArticles,
        ];
    }

    /**
     * Détecter phrases génériques
     */
    protected function detectGenericPhrases(string $content, string $languageCode): array
    {
        $phrases = $this->genericPhrases[$languageCode] ?? $this->genericPhrases['en'];
        
        $content = mb_strtolower($content);
        $found = [];
        $count = 0;
        
        foreach ($phrases as $phrase) {
            $occurrences = substr_count($content, $phrase);
            if ($occurrences > 0) {
                $found[] = $phrase;
                $count += $occurrences;
            }
        }
        
        return [
            'count' => $count,
            'found' => $found,
        ];
    }

    /**
     * Calculer Flesch-Kincaid score (simplifié)
     */
    protected function calculateFleschKincaid(string $text): float
    {
        $sentences = preg_split('/[.!?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = count($sentences);
        
        $words = str_word_count($text, 1);
        $wordCount = count($words);
        
        if ($sentenceCount === 0 || $wordCount === 0) {
            return 0;
        }
        
        // Syllables estimation (approximation : 1.5 syllabe/mot en moyenne)
        $syllableCount = $wordCount * 1.5;
        
        // Formule Flesch Reading Ease
        $score = 206.835 - 1.015 * ($wordCount / $sentenceCount) - 84.6 * ($syllableCount / $wordCount);
        
        return max(0, min(100, round($score, 1)));
    }

    /**
     * Déterminer statut validation
     */
    protected function determineStatus(float $overallScore, array $validations): string
    {
        // FAILED : score < 60
        if ($overallScore < 60) {
            return 'failed';
        }
        
        // FAILED : au moins un critère < 50
        foreach ($validations as $validation) {
            if ($validation['score'] < 50) {
                return 'failed';
            }
        }
        
        // WARNING : score 60-70 OU un critère < 60
        if ($overallScore < 70) {
            return 'warning';
        }
        
        foreach ($validations as $validation) {
            if ($validation['score'] < 60) {
                return 'warning';
            }
        }
        
        // PASSED : score ≥ 70 ET tous critères ≥ 60
        return 'passed';
    }

    /**
     * Générer suggestions amélioration
     */
    protected function generateSuggestions(array $validations): array
    {
        $suggestions = [];
        
        // Knowledge
        if ($validations['knowledge']['score'] < 70) {
            $suggestions[] = "Ajouter les chiffres clés manquants (304M, 197 pays, <5min)";
            $suggestions[] = "Mentionner explicitement le nom de la plateforme";
        }
        
        // Brand
        if ($validations['brand']['score'] < 70) {
            $suggestions[] = "Vérifier l'absence de tutoiement (utiliser vouvoiement strict)";
            $suggestions[] = "Raccourcir les phrases longues (cible ≤25 mots)";
        }
        
        // SEO
        if ($validations['seo']['score'] < 70) {
            if (isset($validations['seo']['details']['meta_title_length'])) {
                $len = $validations['seo']['details']['meta_title_length'];
                if ($len < 50 || $len > 60) {
                    $suggestions[] = "Optimiser meta title à 50-60 caractères";
                }
            }
            if (isset($validations['seo']['details']['meta_desc_length'])) {
                $len = $validations['seo']['details']['meta_desc_length'];
                if ($len < 120 || $len > 160) {
                    $suggestions[] = "Optimiser meta description à 120-160 caractères";
                }
            }
        }
        
        // Readability
        if ($validations['readability']['score'] < 70) {
            $suggestions[] = "Simplifier phrases pour améliorer lisibilité (score Flesch ≥60)";
            $suggestions[] = "Découper paragraphes longs (max 150 mots)";
        }
        
        // Structure
        if ($validations['structure']['score'] < 70) {
            if (isset($validations['structure']['details']['faq_count'])) {
                $count = $validations['structure']['details']['faq_count'];
                if ($count < 8) {
                    $suggestions[] = "Ajouter " . (8 - $count) . " FAQs supplémentaires pour rich snippets";
                }
            }
        }
        
        // Originality
        if ($validations['originality']['score'] < 70) {
            $suggestions[] = "Réduire phrases génériques et enrichir contenu original";
            if (isset($validations['originality']['details']['max_similarity'])) {
                $sim = $validations['originality']['details']['max_similarity'];
                if ($sim > 50) {
                    $suggestions[] = "Différencier davantage contenu (similarité {$sim}%)";
                }
            }
        }
        
        return $suggestions;
    }

    // =========================================================================
    // AUTO-MARKING GOLDEN EXAMPLES
    // =========================================================================

    /**
     * Marquer automatiquement comme golden si score ≥ 90
     */
    public function autoMarkAsGolden(Article $article): void
    {
        if ($article->quality_score < 90) {
            return;
        }
        
        Log::info('ContentQualityEnforcer: Auto-marking golden', [
            'article_id' => $article->id,
            'quality_score' => $article->quality_score,
        ]);
        
        $content = $article->content;
        $plainText = strip_tags($content);
        
        // --- INTRO (300 premiers caractères) ---
        $intro = mb_substr($plainText, 0, 300);
        if (mb_strlen($intro) >= 200) {
            GoldenExample::createFromArticle(
                $article,
                'intro',
                $intro,
                str_word_count($intro)
            );
        }
        
        // --- CONCLUSION (300 derniers caractères) ---
        $conclusion = mb_substr($plainText, -300);
        if (mb_strlen($conclusion) >= 200) {
            GoldenExample::createFromArticle(
                $article,
                'conclusion',
                $conclusion,
                str_word_count($conclusion)
            );
        }
        
        // --- MEILLEURE SECTION H2 (plus longue) ---
        preg_match_all('/<h2[^>]*>(.*?)<\/h2>(.*?)(?=<h2|$)/s', $content, $sections, PREG_SET_ORDER);
        
        $longestSection = null;
        $maxLength = 0;
        
        foreach ($sections as $section) {
            $sectionText = strip_tags($section[2]);
            $length = mb_strlen($sectionText);
            if ($length > $maxLength) {
                $maxLength = $length;
                $longestSection = $sectionText;
            }
        }
        
        if ($longestSection && mb_strlen($longestSection) >= 200) {
            GoldenExample::createFromArticle(
                $article,
                'section',
                mb_substr($longestSection, 0, 500),
                str_word_count($longestSection)
            );
        }
        
        Log::info('ContentQualityEnforcer: Golden examples créés', [
            'article_id' => $article->id,
        ]);
    }
}