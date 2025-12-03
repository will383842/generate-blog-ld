<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Vérifier si la contrainte unique existe déjà
            if (!$this->indexExists('articles', 'articles_unique_slug')) {
                // Ajouter contrainte unique sur (platform_id, language_id, slug)
                $table->unique(['platform_id', 'language_id', 'slug'], 'articles_unique_slug');
            }
            
            // Vérifier si l'index simple existe déjà
            if (!$this->indexExists('articles', 'articles_slug_index')) {
                // Ajouter un index sur slug seul pour les recherches rapides
                $table->index('slug', 'articles_slug_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Supprimer les index s'ils existent
            if ($this->indexExists('articles', 'articles_unique_slug')) {
                $table->dropUnique('articles_unique_slug');
            }
            
            if ($this->indexExists('articles', 'articles_slug_index')) {
                $table->dropIndex('articles_slug_index');
            }
        });
    }

    /**
     * Vérifier si un index existe
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        
        $result = DB::select(
            "SELECT COUNT(*) as count 
             FROM information_schema.statistics 
             WHERE table_schema = ? 
             AND table_name = ? 
             AND index_name = ?",
            [$databaseName, $table, $indexName]
        );
        
        return $result[0]->count > 0;
    }
};