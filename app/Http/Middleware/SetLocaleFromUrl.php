<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleFromUrl
{
    /**
     * Langues supportées par l'application
     */
    protected array $supportedLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale');

        if ($locale && preg_match('/^([a-z]{2})-([a-z]{2})$/i', $locale, $matches)) {
            $langCode = strtolower($matches[1]);
            $countryCode = strtoupper($matches[2]);

            // Définir la langue de l'app si supportée
            if (in_array($langCode, $this->supportedLanguages)) {
                app()->setLocale($langCode);
            }

            // Stocker le code pays dans la requête pour usage ultérieur
            $request->attributes->set('country_code', $countryCode);
            $request->attributes->set('language_code', $langCode);
            $request->attributes->set('locale', $locale);
        }

        return $next($request);
    }
}
