<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Front\ArticleController;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return view('welcome');
});

// Login manuel - utilise le guard 'admin' pour AdminUser
Route::get('/login', function () {
    return view('login');
})->name('login');

Route::post('/login', function (Illuminate\Http\Request $request) {
    $credentials = $request->only('email', 'password');

    // Utilise le guard 'admin' qui pointe vers AdminUser
    if (Auth::guard('admin')->attempt($credentials)) {
        $request->session()->regenerate();
        return redirect()->intended('/admin');
    }

    return back()->withErrors([
        'email' => 'Identifiants incorrects.',
    ]);
});

Route::post('/logout', function (Illuminate\Http\Request $request) {
    Auth::guard('admin')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/login');
})->name('logout');

// Routes Admin avec AUTH - utilise le guard 'admin'
Route::middleware(['auth:admin'])->prefix('admin')->group(function () {
    Route::get('/{any?}', [AdminController::class, 'index'])
        ->where('any', '.*')
        ->name('admin.index');
});

// =========================================================================
// ROUTES PUBLIQUES AVEC LOCALE
// Format: /{locale}/{slug} où locale = fr-de, en-us, etc.
// =========================================================================

Route::middleware(['locale'])->group(function () {
    // Route avec locale pour article
    // Ex: /fr-de/vivre-en-allemagne, /en-us/living-in-germany
    Route::get('/{locale}/{slug}', [ArticleController::class, 'showByLocale'])
        ->where('locale', '[a-z]{2}-[a-z]{2}')
        ->where('slug', '[a-z0-9\-]+')
        ->name('article.show.locale');

    // Route avec locale pour liste pays
    // Ex: /fr-de, /en-us (liste des articles pour ce pays dans cette langue)
    Route::get('/{locale}', [ArticleController::class, 'indexByLocale'])
        ->where('locale', '[a-z]{2}-[a-z]{2}')
        ->name('country.index.locale');
});

// =========================================================================
// ROUTES PUBLIQUES CLASSIQUES (ancien format compatible)
// =========================================================================

// Article avec langue explicite: /en/germany/article-slug
Route::get('/{lang}/{countrySlug}/{articleSlug}', [ArticleController::class, 'show'])
    ->where('lang', 'en|de|es|pt|ru|zh|ar|hi')
    ->where('countrySlug', '[a-z0-9\-]+')
    ->where('articleSlug', '[a-z0-9\-]+')
    ->name('article.show.lang');

// Article FR par défaut: /allemagne/article-slug
Route::get('/{countrySlug}/{articleSlug}', [ArticleController::class, 'show'])
    ->where('countrySlug', '[a-z0-9\-]+')
    ->where('articleSlug', '[a-z0-9\-]+')
    ->name('article.show');

// Liste pays avec langue: /en/germany
Route::get('/{lang}/{countrySlug}', [ArticleController::class, 'byCountry'])
    ->where('lang', 'en|de|es|pt|ru|zh|ar|hi')
    ->where('countrySlug', '[a-z0-9\-]+')
    ->name('country.show.lang');

// Liste pays FR par défaut: /allemagne
Route::get('/{countrySlug}', [ArticleController::class, 'byCountry'])
    ->where('countrySlug', '[a-z0-9\-]+')
    ->name('country.show');