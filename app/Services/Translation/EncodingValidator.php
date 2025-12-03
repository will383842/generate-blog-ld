<?php

namespace App\Services\Translation;

use Illuminate\Support\Facades\Log;

/**
 * Service de validation et nettoyage d'encodage UTF-8
 * Essentiel pour gérer correctement arabe, chinois, russe, hindi
 */
class EncodingValidator
{
    // =========================================================================
    // VALIDATION UTF-8
    // =========================================================================

    /**
     * Valide qu'un texte est en UTF-8 valide
     * 
     * @param string $text Texte à valider
     * @return bool True si UTF-8 valide
     * @throws \RuntimeException Si encodage invalide
     */
    public function validateUtf8(string $text): bool
    {
        // Vérification mb_check_encoding
        if (!mb_check_encoding($text, 'UTF-8')) {
            Log::error("❌ Encodage UTF-8 invalide détecté");
            throw new \RuntimeException('Invalid UTF-8 encoding detected');
        }

        // Vérification regex UTF-8
        if (!$this->isValidUtf8Regex($text)) {
            Log::error("❌ Validation regex UTF-8 échouée");
            throw new \RuntimeException('UTF-8 validation failed (regex)');
        }

        return true;
    }

    /**
     * Vérifie si un texte est UTF-8 valide via regex
     * 
     * @param string $text Texte à vérifier
     * @return bool True si valide
     */
    protected function isValidUtf8Regex(string $text): bool
    {
        // Pattern UTF-8 valide
        return preg_match('//u', $text) === 1;
    }

    /**
     * Vérifie si un texte contient des caractères non-ASCII
     * 
     * @param string $text Texte à vérifier
     * @return bool True si contient du non-ASCII
     */
    public function hasNonAscii(string $text): bool
    {
        return preg_match('/[^\x00-\x7F]/', $text) === 1;
    }

    // =========================================================================
    // NETTOYAGE ET SANITIZATION
    // =========================================================================

    /**
     * Nettoie et sanitize un contenu
     * Supprime les caractères invalides, normalise les espaces
     * 
     * @param string $text Texte à nettoyer
     * @return string Texte nettoyé
     */
    public function sanitizeContent(string $text): string
    {
        // Conversion en UTF-8 si nécessaire
        $text = $this->ensureUtf8($text);

        // Normalisation Unicode (NFC)
        if (class_exists('\Normalizer')) {
            $text = \Normalizer::normalize($text, \Normalizer::FORM_C);
        }

        // Suppression des caractères de contrôle (sauf \n \r \t)
        $text = $this->removeControlCharacters($text);

        // Normalisation des espaces
        $text = $this->normalizeWhitespace($text);

        // Suppression BOM UTF-8 si présent
        $text = $this->removeBom($text);

        return $text;
    }

    /**
     * Assure qu'un texte est en UTF-8
     * Tente une conversion si nécessaire
     * 
     * @param string $text Texte à convertir
     * @return string Texte en UTF-8
     */
    public function ensureUtf8(string $text): string
    {
        // Si déjà UTF-8 valide, retourner tel quel
        if (mb_check_encoding($text, 'UTF-8')) {
            return $text;
        }

        Log::warning("⚠️ Tentative de conversion en UTF-8");

        // Détection automatique de l'encodage
        $encoding = $this->detectEncoding($text);

        if ($encoding && $encoding !== 'UTF-8') {
            Log::info("Conversion depuis {$encoding} vers UTF-8");
            $converted = mb_convert_encoding($text, 'UTF-8', $encoding);
            
            if (mb_check_encoding($converted, 'UTF-8')) {
                return $converted;
            }
        }

        // Fallback: iconv avec //IGNORE pour supprimer caractères invalides
        $converted = @iconv($encoding ?: 'UTF-8', 'UTF-8//IGNORE', $text);
        
        if ($converted !== false) {
            return $converted;
        }

        // Dernier recours: utf8_encode (pour ISO-8859-1)
        return utf8_encode($text);
    }

    /**
     * Détecte l'encodage d'un texte
     * 
     * @param string $text Texte à analyser
     * @return string|false Encodage détecté ou false
     */
    public function detectEncoding(string $text): string|false
    {
        // Liste des encodages à tester par priorité
        $encodings = [
            'UTF-8',
            'ISO-8859-1',
            'ISO-8859-15',
            'Windows-1252',
            'Windows-1251', // Cyrillique
            'GB2312',       // Chinois simplifié
            'Big5',         // Chinois traditionnel
            'ISO-8859-6',   // Arabe
            // Windows-1256 retiré (non supporté sur certains systèmes Windows)
        ];

        $detected = mb_detect_encoding($text, $encodings, true);

        if ($detected) {
            Log::debug("Encodage détecté: {$detected}");
        }

        return $detected;
    }

    /**
     * Supprime les caractères de contrôle
     * Préserve les sauts de ligne et tabulations
     * 
     * @param string $text Texte à nettoyer
     * @return string Texte sans caractères de contrôle
     */
    protected function removeControlCharacters(string $text): string
    {
        // Supprime tous les caractères de contrôle sauf \n \r \t
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
    }

    /**
     * Normalise les espaces blancs
     * 
     * @param string $text Texte à normaliser
     * @return string Texte normalisé
     */
    protected function normalizeWhitespace(string $text): string
    {
        // Conversion des espaces insécables en espaces normaux
        $text = str_replace(["\xC2\xA0", "\xE2\x80\xAF"], ' ', $text);

        // Normalisation des sauts de ligne
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // Suppression des espaces multiples (mais préserve les sauts de ligne)
        $text = preg_replace('/[^\S\n]+/', ' ', $text);

        // Suppression des sauts de ligne multiples (max 2)
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        return trim($text);
    }

    /**
     * Supprime le BOM UTF-8 si présent
     * 
     * @param string $text Texte à nettoyer
     * @return string Texte sans BOM
     */
    protected function removeBom(string $text): string
    {
        // BOM UTF-8: EF BB BF
        if (substr($text, 0, 3) === "\xEF\xBB\xBF") {
            return substr($text, 3);
        }

        return $text;
    }

    // =========================================================================
    // VALIDATION SPÉCIFIQUE PAR SCRIPT
    // =========================================================================

    /**
     * Valide que le texte contient des caractères cyrilliques valides
     * 
     * @param string $text Texte à valider
     * @return bool True si valide
     */
    public function validateCyrillic(string $text): bool
    {
        // Plage Unicode cyrillique: U+0400 à U+04FF
        return preg_match('/[\x{0400}-\x{04FF}]/u', $text) === 1;
    }

    /**
     * Valide que le texte contient des caractères chinois valides
     * 
     * @param string $text Texte à valider
     * @return bool True si valide
     */
    public function validateChinese(string $text): bool
    {
        // Plage Unicode CJK: U+4E00 à U+9FFF
        return preg_match('/[\x{4E00}-\x{9FFF}]/u', $text) === 1;
    }

    /**
     * Valide que le texte contient des caractères arabes valides
     * 
     * @param string $text Texte à valider
     * @return bool True si valide
     */
    public function validateArabic(string $text): bool
    {
        // Plage Unicode arabe: U+0600 à U+06FF
        return preg_match('/[\x{0600}-\x{06FF}]/u', $text) === 1;
    }

    /**
     * Valide que le texte contient des caractères devanagari valides
     * 
     * @param string $text Texte à valider
     * @return bool True si valide
     */
    public function validateDevanagari(string $text): bool
    {
        // Plage Unicode devanagari: U+0900 à U+097F
        return preg_match('/[\x{0900}-\x{097F}]/u', $text) === 1;
    }

    // =========================================================================
    // VALIDATION HTML
    // =========================================================================

    /**
     * Valide que le HTML contient un encodage UTF-8 correct
     * 
     * @param string $html HTML à valider
     * @return bool True si valide
     */
    public function validateHtmlEncoding(string $html): bool
    {
        // Vérifier présence meta charset UTF-8
        $hasUtf8Meta = preg_match('/<meta[^>]+charset=["\']?utf-8["\']?/i', $html) === 1;

        // Vérifier validation UTF-8 générale
        $isValidUtf8 = $this->validateUtf8($html);

        return $hasUtf8Meta && $isValidUtf8;
    }

    /**
     * Ajoute ou corrige la déclaration charset UTF-8 dans du HTML
     * 
     * @param string $html HTML à corriger
     * @return string HTML avec charset UTF-8
     */
    public function ensureHtmlUtf8Charset(string $html): string
    {
        // Si déjà présent, ne rien faire
        if (preg_match('/<meta[^>]+charset=["\']?utf-8["\']?/i', $html)) {
            return $html;
        }

        // Ajouter après <head> si présent
        if (preg_match('/<head[^>]*>/i', $html)) {
            return preg_replace(
                '/(<head[^>]*>)/i',
                '$1' . "\n" . '<meta charset="UTF-8">',
                $html,
                1
            );
        }

        // Sinon, ajouter au début
        return '<meta charset="UTF-8">' . "\n" . $html;
    }

    // =========================================================================
    // HELPERS ET DIAGNOSTICS
    // =========================================================================

    /**
     * Analyse un texte et retourne des informations d'encodage
     * 
     * @param string $text Texte à analyser
     * @return array Informations d'encodage
     */
    public function analyzeEncoding(string $text): array
    {
        return [
            'is_utf8' => mb_check_encoding($text, 'UTF-8'),
            'detected_encoding' => $this->detectEncoding($text),
            'has_non_ascii' => $this->hasNonAscii($text),
            'has_cyrillic' => $this->validateCyrillic($text),
            'has_chinese' => $this->validateChinese($text),
            'has_arabic' => $this->validateArabic($text),
            'has_devanagari' => $this->validateDevanagari($text),
            'byte_length' => strlen($text),
            'char_length' => mb_strlen($text, 'UTF-8'),
            'has_bom' => substr($text, 0, 3) === "\xEF\xBB\xBF",
        ];
    }

    /**
     * Compte les octets par type de script
     * 
     * @param string $text Texte à analyser
     * @return array Statistiques par script
     */
    public function getScriptStatistics(string $text): array
    {
        $stats = [
            'total_chars' => mb_strlen($text, 'UTF-8'),
            'ascii' => 0,
            'cyrillic' => 0,
            'chinese' => 0,
            'arabic' => 0,
            'devanagari' => 0,
            'other' => 0,
        ];

        // Comptage par caractère
        $length = mb_strlen($text, 'UTF-8');
        for ($i = 0; $i < $length; $i++) {
            $char = mb_substr($text, $i, 1, 'UTF-8');
            
            if (preg_match('/[\x00-\x7F]/', $char)) {
                $stats['ascii']++;
            } elseif (preg_match('/[\x{0400}-\x{04FF}]/u', $char)) {
                $stats['cyrillic']++;
            } elseif (preg_match('/[\x{4E00}-\x{9FFF}]/u', $char)) {
                $stats['chinese']++;
            } elseif (preg_match('/[\x{0600}-\x{06FF}]/u', $char)) {
                $stats['arabic']++;
            } elseif (preg_match('/[\x{0900}-\x{097F}]/u', $char)) {
                $stats['devanagari']++;
            } else {
                $stats['other']++;
            }
        }

        return $stats;
    }

    /**
     * Teste si PHP est correctement configuré pour UTF-8
     * 
     * @return array Résultats des tests
     */
    public function testPhpUtf8Support(): array
    {
        return [
            'mbstring_enabled' => extension_loaded('mbstring'),
            'iconv_enabled' => extension_loaded('iconv'),
            'intl_enabled' => extension_loaded('intl'),
            'internal_encoding' => mb_internal_encoding(),
            'regex_encoding' => mb_regex_encoding(),
            'default_charset' => ini_get('default_charset'),
        ];
    }

    /**
     * Log les informations d'encodage pour debug
     * 
     * @param string $text Texte à analyser
     * @param string $context Contexte (pour le log)
     * @return void
     */
    public function logEncodingInfo(string $text, string $context = 'unknown'): void
    {
        $info = $this->analyzeEncoding($text);
        
        Log::debug("📊 Analyse encodage [{$context}]", $info);

        if (!$info['is_utf8']) {
            Log::warning("⚠️ Encodage non-UTF-8 détecté dans {$context}", [
                'detected' => $info['detected_encoding'],
            ]);
        }
    }
}