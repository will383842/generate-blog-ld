<?php

namespace App\Services\Seo;

use Illuminate\Support\Str;

/**
 * Service de génération de slugs multilingues optimisés SEO
 */
class LocaleSlugService
{
    /**
     * Génère un slug optimisé selon la langue
     */
    public function generate(string $title, string $language, ?string $keyword = null): string
    {
        // Nettoyage basique
        $slug = $this->cleanTitle($title, $language);
        
        // Translittération selon langue
        $slug = $this->transliterate($slug, $language);
        
        // Optimisation SEO: keyword en début si fourni
        if ($keyword && !str_contains(strtolower($slug), strtolower($keyword))) {
            $keywordSlug = $this->cleanTitle($keyword, $language);
            $slug = $keywordSlug . '-' . $slug;
        }
        
        // Normalisation finale
        $slug = $this->normalize($slug);
        
        // Limite longueur (60 chars pour SEO)
        return substr($slug, 0, 60);
    }

    /**
     * Nettoyage selon langue
     */
    protected function cleanTitle(string $title, string $language): string
    {
        $title = strip_tags($title);
        $title = html_entity_decode($title, ENT_QUOTES, 'UTF-8');
        
        return match($language) {
            'fr' => $this->cleanFrench($title),
            'es' => $this->cleanSpanish($title),
            'de' => $this->cleanGerman($title),
            'ar' => $this->cleanArabic($title),
            'zh' => $this->cleanChinese($title),
            'ja' => $this->cleanJapanese($title),
            default => $this->cleanDefault($title)
        };
    }

    protected function cleanFrench(string $title): string
    {
        $replacements = [
            'à' => 'a', 'â' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'œ' => 'oe', 'æ' => 'ae'
        ];
        return strtr($title, $replacements);
    }

    protected function cleanSpanish(string $title): string
    {
        $replacements = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'ñ' => 'n', 'ü' => 'u'
        ];
        return strtr($title, $replacements);
    }

    protected function cleanGerman(string $title): string
    {
        $replacements = [
            'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss'
        ];
        return strtr($title, $replacements);
    }

    protected function cleanArabic(string $title): string
    {
        // Translittération arabe → latin
        return $this->arabicToLatin($title);
    }

    protected function cleanChinese(string $title): string
    {
        // Pinyin romanization
        return $this->chineseToPinyin($title);
    }

    protected function cleanJapanese(string $title): string
    {
        // Romaji romanization
        return $this->japaneseToRomaji($title);
    }

    protected function cleanDefault(string $title): string
    {
        return Str::ascii($title);
    }

    /**
     * Translittération avancée
     */
    protected function transliterate(string $slug, string $language): string
    {
        return match($language) {
            'ar' => $this->arabicToLatin($slug),
            'zh' => $this->chineseToPinyin($slug),
            'ja' => $this->japaneseToRomaji($slug),
            default => $slug
        };
    }

    /**
     * Arabe → Latin (translittération basique)
     */
    protected function arabicToLatin(string $text): string
    {
        $map = [
            'ا' => 'a', 'ب' => 'b', 'ت' => 't', 'ث' => 'th', 'ج' => 'j', 'ح' => 'h',
            'خ' => 'kh', 'د' => 'd', 'ذ' => 'dh', 'ر' => 'r', 'ز' => 'z', 'س' => 's',
            'ش' => 'sh', 'ص' => 's', 'ض' => 'd', 'ط' => 't', 'ظ' => 'z', 'ع' => 'a',
            'غ' => 'gh', 'ف' => 'f', 'ق' => 'q', 'ك' => 'k', 'ل' => 'l', 'م' => 'm',
            'ن' => 'n', 'ه' => 'h', 'و' => 'w', 'ي' => 'y'
        ];
        return strtr($text, $map);
    }

    /**
     * Chinois → Pinyin (simplifié)
     */
    protected function chineseToPinyin(string $text): string
    {
        // TODO: Implémentation complète avec library Pinyin
        // Pour l'instant: romanization basique
        return Str::slug($text);
    }

    /**
     * Japonais → Romaji (simplifié)
     */
    protected function japaneseToRomaji(string $text): string
    {
        // TODO: Implémentation complète avec library Romaji
        return Str::slug($text);
    }

    /**
     * Normalisation finale
     */
    protected function normalize(string $slug): string
    {
        // Minuscules
        $slug = strtolower($slug);
        
        // Suppression caractères spéciaux
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        
        // Espaces → tirets
        $slug = preg_replace('/[\s]+/', '-', $slug);
        
        // Tirets multiples → simple
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Suppression tirets début/fin
        return trim($slug, '-');
    }

    /**
     * Génère slug avec numérotation si doublon
     */
    public function makeUnique(string $slug, string $model, ?int $excludeId = null): string
    {
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug, $model, $excludeId)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Vérifie existence slug
     */
    protected function slugExists(string $slug, string $model, ?int $excludeId): bool
    {
        $query = $model::where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}
