<?php

if (!function_exists('route')) {
    // Helper route() déjà défini par Laravel
}

// Helper pour générer un article rapidement
if (!function_exists('generate_article')) {
    function generate_article(int $platformId, int $countryId, string $langCode, int $themeId): \App\Models\Article
    {
        $generator = app(\App\Services\Content\ArticleGenerator::class);
        
        return $generator->generate([
            'platform_id' => $platformId,
            'country_id' => $countryId,
            'language_code' => $langCode,
            'theme_id' => $themeId,
            'word_count' => 1500,
            'generate_image' => false,
            'use_perplexity' => true,
        ]);
    }
}