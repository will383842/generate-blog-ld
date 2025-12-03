<?php
/**
 * =============================================================================
 * FICHIER 5/10 : BrandValidationService - Service de validation brand
 * =============================================================================
 * 
 * EMPLACEMENT : app/Services/Content/BrandValidationService.php
 * 
 * DESCRIPTION : Service dédié aux validations linguistiques avancées
 * Complète PlatformKnowledgeService avec 6 validations robustes
 * 
 * =============================================================================
 */

namespace App\Services\Content;

use App\Models\Platform;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class BrandValidationService
{
    /**
     * Valide la conformité d'un contenu aux règles brand de la plateforme
     *
     * @param string $content Contenu à valider
     * @param Platform $platform Plateforme cible
     * @param string $languageCode Code langue (fr, en, de, ru, zh, es, pt, ar, hi)
     * @return array ['compliant' => bool, 'score' => int, 'errors' => array, 'warnings' => array]
     */
    public function validateCompliance(
        string $content,
        Platform $platform,
        string $languageCode
    ): array {
        $errors = [];
        $warnings = [];
        $score = 100;
        
        // 1. Validation longueur phrases
        $sentenceValidation = $this->validateSentenceLength($content, $platform);
        $errors = array_merge($errors, $sentenceValidation['errors']);
        $warnings = array_merge($warnings, $sentenceValidation['warnings']);
        $score -= $sentenceValidation['penalty'];
        
        // 2. Validation tutoiement (français uniquement)
        if ($languageCode === 'fr') {
            $tutoiementValidation = $this->validateTutoiement($content, $platform);
            $errors = array_merge($errors, $tutoiementValidation['errors']);
            $score -= $tutoiementValidation['penalty'];
        }
        
        // 3. Validation émojis
        $emojiValidation = $this->validateEmojis($content, $platform);
        $errors = array_merge($errors, $emojiValidation['errors']);
        $score -= $emojiValidation['penalty'];
        
        // 4. Validation superlatifs
        $superlativeValidation = $this->validateSuperlatifs($content, $languageCode);
        $warnings = array_merge($warnings, $superlativeValidation['warnings']);
        $score -= $superlativeValidation['penalty'];
        
        // 5. Validation points exclamation multiples
        $exclamationValidation = $this->validateExclamations($content);
        $warnings = array_merge($warnings, $exclamationValidation['warnings']);
        $score -= $exclamationValidation['penalty'];
        
        // 6. Validation MAJUSCULES abusives
        $capsValidation = $this->validateCapsAbuse($content);
        $warnings = array_merge($warnings, $capsValidation['warnings']);
        $score -= $capsValidation['penalty'];
        
        $score = max(0, min(100, $score));
        
        return [
            'compliant' => $score >= 70 && count($errors) === 0,
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }
    
    /**
     * VALIDATION 1 : Longueur des phrases
     * Vérifie conformité longueur moyenne et max
     */
    private function validateSentenceLength(string $content, Platform $platform): array
    {
        $errors = [];
        $warnings = [];
        $penalty = 0;
        
        // Récupérer settings cible (ou défauts)
        $targetAvg = Setting::get("{$platform->code}.style_sentence_length_avg", 18);
        $maxLength = Setting::get("{$platform->code}.style_sentence_length_max", 25);
        $tolerance = Setting::get("{$platform->code}.style_sentence_length_tolerance", 5);
        
        $sentences = $this->extractSentences($content);
        
        if (count($sentences) === 0) {
            return ['errors' => [], 'warnings' => [], 'penalty' => 0];
        }
        
        $lengths = array_map(fn($s) => str_word_count($s), $sentences);
        $avgLength = array_sum($lengths) / count($lengths);
        
        // Vérifier phrases individuelles >max (ERROR)
        foreach ($sentences as $index => $sentence) {
            $length = str_word_count($sentence);
            if ($length > $maxLength) {
                $preview = mb_substr($sentence, 0, 50);
                $errors[] = "Phrase #{$index} trop longue : {$length} mots (max {$maxLength}). \"$preview...\"";
                $penalty += 10;
            }
        }
        
        // Vérifier moyenne hors tolérance (WARNING)
        if ($avgLength > $targetAvg + $tolerance) {
            $warnings[] = sprintf(
                "Longueur moyenne phrases : %.1f mots (cible %d, max %d)",
                $avgLength, $targetAvg, $targetAvg + $tolerance
            );
            $penalty += 5;
        }
        
        return ['errors' => $errors, 'warnings' => $warnings, 'penalty' => min($penalty, 30)];
    }
    
    /**
     * VALIDATION 2 : Détection tutoiement (français)
     * Détecte "tu", "ton", "ta", "tes", "toi" avec word boundaries
     * Évite faux positifs ("attitude", "constituer", etc.)
     */
    private function validateTutoiement(string $content, Platform $platform): array
    {
        $errors = [];
        $penalty = 0;
        
        // Vérifier si plateforme exige vouvoiement strict
        $formality = Setting::get("{$platform->code}.style_tone_formality", 5);
        
        if ($formality < 6) {
            // Formalité basse = tutoiement autorisé
            return ['errors' => [], 'penalty' => 0];
        }
        
        // Patterns tutoiement avec word boundaries
        $patterns = [
            '/\btu\b/iu',    // "tu es"
            '/\bton\b/iu',   // "ton problème"
            '/\bta\b/iu',    // "ta question"
            '/\btes\b/iu',   // "tes documents"
            '/\btoi\b/iu',   // "pour toi"
        ];
        
        // Exclusions (faux positifs fréquents)
        $exclusions = [
            'attitude', 'constituer', 'instituer', 'restituer', 'statue', 'statuer',
            'situation', 'tonic', 'atout', 'tatouage', 'toile', 'substituer',
            'prostituer', 'destitu', 'reconstituer', 'bâton', 'têtu', 'plateau'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[0] as $match) {
                    $word = $match[0];
                    $position = $match[1];
                    
                    // Vérifier contexte pour exclure faux positifs
                    $context = mb_substr($content, max(0, $position - 10), 30);
                    $isFalsePositive = false;
                    
                    foreach ($exclusions as $exclusion) {
                        if (stripos($context, $exclusion) !== false) {
                            $isFalsePositive = true;
                            break;
                        }
                    }
                    
                    if (!$isFalsePositive) {
                        $contextPreview = mb_substr($content, max(0, $position - 20), 60);
                        $errors[] = "Tutoiement détecté : '$word' dans \"...$contextPreview...\" (vouvoiement obligatoire)";
                        $penalty += 20; // Pénalité forte
                    }
                }
            }
        }
        
        return ['errors' => $errors, 'penalty' => min($penalty, 60)]; // Max 60 points
    }
    
    /**
     * VALIDATION 3 : Émojis interdits
     * Vérifie que seuls les émojis autorisés sont utilisés (whitelist)
     */
    private function validateEmojis(string $content, Platform $platform): array
    {
        $errors = [];
        $penalty = 0;
        
        // Récupérer émojis autorisés pour plateforme
        $allowedEmojis = Setting::get("{$platform->code}.style_allowed_emojis", []);
        
        // Extraire tous émojis du contenu
        $foundEmojis = $this->extractEmojis($content);
        
        if (empty($foundEmojis)) {
            return ['errors' => [], 'penalty' => 0];
        }
        
        foreach ($foundEmojis as $emoji) {
            if (!in_array($emoji, $allowedEmojis)) {
                $allowedStr = implode(' ', $allowedEmojis);
                $errors[] = "Émoji interdit détecté : '$emoji' (autorisés : $allowedStr)";
                $penalty += 15;
            }
        }
        
        return ['errors' => $errors, 'penalty' => min($penalty, 45)]; // Max 45 points
    }
    
    /**
     * VALIDATION 4 : Superlatifs exagérés
     * Détecte mots comme "hyper", "ultra", "méga", "super"
     */
    private function validateSuperlatifs(string $content, string $languageCode): array
    {
        $warnings = [];
        $penalty = 0;
        
        // Superlatifs à éviter par langue
        $superlatifs = [
            'fr' => ['hyper', 'ultra', 'méga', 'super', 'génial', 'extraordinaire', 'incroyable', 'fantastique', 'formidable'],
            'en' => ['super', 'mega', 'ultra', 'hyper', 'amazing', 'fantastic', 'incredible', 'awesome', 'fabulous'],
            'es' => ['súper', 'mega', 'ultra', 'increíble', 'fantástico', 'genial', 'maravilloso'],
            'de' => ['super', 'mega', 'ultra', 'fantastisch', 'unglaublich', 'wunderbar'],
            'ru' => ['супер', 'мега', 'ультра', 'невероятный', 'фантастический'],
            'pt' => ['super', 'mega', 'ultra', 'incrível', 'fantástico', 'maravilhoso'],
            'zh' => ['超级', '非常', '极其'],
            'ar' => ['خارق', 'رائع', 'مذهل'],
            'hi' => ['अद्भुत', 'शानदार', 'अविश्वसनीय']
        ];
        
        $wordsToCheck = $superlatifs[$languageCode] ?? [];
        
        foreach ($wordsToCheck as $word) {
            $count = substr_count(strtolower($content), strtolower($word));
            if ($count > 0) {
                $warnings[] = "Superlatif détecté : '$word' ($count fois) - préférer ton neutre";
                $penalty += 2 * $count;
            }
        }
        
        return ['warnings' => $warnings, 'penalty' => min($penalty, 10)]; // Max 10 points
    }
    
    /**
     * VALIDATION 5 : Points exclamation multiples
     * Détecte !!, !!!, etc.
     */
    private function validateExclamations(string $content): array
    {
        $warnings = [];
        $penalty = 0;
        
        // Détecter !!, !!!, etc.
        if (preg_match_all('/!{2,}/', $content, $matches)) {
            $count = count($matches[0]);
            $warnings[] = "Points exclamation multiples détectés : {$count} occurrences. Utiliser '!' simple.";
            $penalty = min($count * 3, 10); // Max 10 points
        }
        
        return ['warnings' => $warnings, 'penalty' => $penalty];
    }
    
    /**
     * VALIDATION 6 : MAJUSCULES abusives
     * Détecte mots entiers en MAJUSCULES (>3 lettres, hors acronymes connus)
     */
    private function validateCapsAbuse(string $content): array
    {
        $warnings = [];
        $penalty = 0;
        
        // Exclure acronymes connus
        $knownAcronyms = [
            'SOS', 'USA', 'EU', 'UK', 'API', 'PDF', 'HTML', 'CSS', 'SQL', 'FAQ', 
            'CTA', 'SEO', 'SMS', 'GPS', 'RGPD', 'GDPR', 'JSON', 'XML', 'HTTP',
            'HTTPS', 'FTP', 'DNS', 'URL', 'URI', 'IP', 'TCP', 'UDP', 'ISO',
            'ONU', 'UE', 'OTAN', 'UNESCO', 'UNICEF', 'OMS', 'WHO', 'FBI', 'CIA'
        ];
        
        // Trouver mots MAJUSCULES >3 lettres
        if (preg_match_all('/\b[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]{4,}\b/u', $content, $matches)) {
            $capsWords = array_unique($matches[0]);
            
            foreach ($capsWords as $word) {
                if (!in_array($word, $knownAcronyms)) {
                    $warnings[] = "Mot en MAJUSCULES détecté : '$word'. Éviter pour confort lecture.";
                    $penalty += 3;
                }
            }
        }
        
        return ['warnings' => $warnings, 'penalty' => min($penalty, 10)]; // Max 10 points
    }
    
    // ========== MÉTHODES UTILITAIRES ==========
    
    /**
     * Extrait les phrases d'un texte
     * @return array
     */
    private function extractSentences(string $text): array
    {
        // Split sur . ! ? suivi d'espace ou fin
        $sentences = preg_split('/[.!?]+(?=\s|$)/u', $text);
        
        // Nettoyer et filtrer
        $sentences = array_map('trim', $sentences);
        $sentences = array_filter($sentences, fn($s) => strlen($s) > 0);
        
        return array_values($sentences);
    }
    
    /**
     * Extrait les émojis d'un texte
     * @return array
     */
    private function extractEmojis(string $text): array
    {
        // Regex Unicode pour émojis (ranges principaux)
        $pattern = '/[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]/u';
        
        preg_match_all($pattern, $text, $matches);
        
        return array_unique($matches[0]);
    }
    
    /**
     * Compte le nombre de mots dans un texte
     * @param string $text
     * @return int
     */
    private function countWords(string $text): int
    {
        return str_word_count($text);
    }
    
    /**
     * Calcule le ratio de voix passive dans un texte (français)
     * @param string $content
     * @return float Ratio entre 0 et 1
     */
    private function calculatePassiveVoiceRatio(string $content): float
    {
        // Pattern basique : "être" + participe passé
        // Note : Détection imparfaite en français, nombreux cas particuliers
        
        $sentences = $this->extractSentences($content);
        $passiveCount = 0;
        
        foreach ($sentences as $sentence) {
            // Détection simplifiée : présence de "être" (est, sont, était, etc.) 
            // suivi d'un participe passé (-é, -i, -u)
            if (preg_match('/\b(est|sont|était|étaient|sera|seront|été)\s+\w+(é|i|u|s)\b/iu', $sentence)) {
                $passiveCount++;
            }
        }
        
        return count($sentences) > 0 ? $passiveCount / count($sentences) : 0;
    }
    
    /**
     * Génère un rapport détaillé de validation
     * @param array $validationResult
     * @return string
     */
    public function generateReport(array $validationResult): string
    {
        $report = "=== RAPPORT VALIDATION BRAND ===\n\n";
        
        $report .= "Score global : {$validationResult['score']}/100\n";
        $report .= "Conformité : " . ($validationResult['compliant'] ? '✅ OUI' : '❌ NON') . "\n\n";
        
        if (!empty($validationResult['errors'])) {
            $report .= "ERREURS (" . count($validationResult['errors']) . ") :\n";
            foreach ($validationResult['errors'] as $error) {
                $report .= "  ❌ $error\n";
            }
            $report .= "\n";
        }
        
        if (!empty($validationResult['warnings'])) {
            $report .= "AVERTISSEMENTS (" . count($validationResult['warnings']) . ") :\n";
            foreach ($validationResult['warnings'] as $warning) {
                $report .= "  ⚠️  $warning\n";
            }
            $report .= "\n";
        }
        
        if ($validationResult['compliant']) {
            $report .= "✅ Contenu conforme aux règles brand.\n";
        } else {
            $report .= "❌ Contenu nécessite révision.\n";
        }
        
        return $report;
    }
}