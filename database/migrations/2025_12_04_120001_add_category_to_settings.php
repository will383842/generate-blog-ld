<?php
/**
 * =============================================================================
 * FICHIER 3/10 : Migration - Ajouter colonne 'category' à table settings
 * =============================================================================
 * 
 * EMPLACEMENT : database/migrations/2025_12_04_120001_add_category_to_settings.php
 * 
 * EXÉCUTION : php artisan migrate
 * 
 * =============================================================================
 */

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
        Schema::table('settings', function (Blueprint $table) {
            // Ajouter colonne category après 'group'
            $table->string('category', 50)->nullable()->after('group')->index();
        });
        
        // Ajouter commentaire pour documentation
        DB::statement("ALTER TABLE settings COMMENT = 'Settings généraux + paramètres style par plateforme (Phase 12)'");
        
        echo "✅ Colonne 'category' ajoutée à table settings\n";
        echo "   Catégories possibles :\n";
        echo "   - style_tone (formalité, empathie, enthousiasme)\n";
        echo "   - style_voice (personne, pronoms)\n";
        echo "   - style_formatting (longueur phrases, paragraphes, listes)\n";
        echo "   - style_technical (émojis, ponctuation, voix active)\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn('category');
        });
        
        echo "❌ Colonne 'category' supprimée de table settings\n";
    }
};