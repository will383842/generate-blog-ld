<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table pour stocker les slugs locale-pays de chaque article
 *
 * Permet de retrouver rapidement un article par son URL locale
 * Exemple: fr-DE → /allemagne/mon-article
 *          en-DE → /en/germany/my-article
 */
return new class extends Migration
{
    public function up(): void
    {
        // Table dédiée aux slugs locale
        Schema::create('article_locale_slugs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');

            // Locale (ex: fr-DE, en-US, ar-SA)
            $table->string('locale', 10)->index();
            $table->string('language_code', 5)->index();
            $table->string('country_code', 5)->index();

            // Slug de l'article dans cette locale
            $table->string('slug', 255);

            // Chemin complet (ex: /allemagne/mon-article ou /en/germany/my-article)
            $table->string('full_path', 500)->index();

            $table->timestamps();

            // Index unique : un article ne peut avoir qu'un slug par locale
            $table->unique(['article_id', 'locale']);

            // Index composé pour recherche rapide
            $table->index(['locale', 'slug']);
            $table->index(['language_code', 'country_code']);
        });

        // Ajouter colonne locale_slugs JSON à articles si elle n'existe pas
        if (!Schema::hasColumn('articles', 'locale_slugs')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->json('locale_slugs')->nullable()->after('slug')
                    ->comment('JSON des slugs par locale {fr-DE: "/allemagne/slug", ...}');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('article_locale_slugs');

        if (Schema::hasColumn('articles', 'locale_slugs')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropColumn('locale_slugs');
            });
        }
    }
};
