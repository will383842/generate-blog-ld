<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pillar_statistics', function (Blueprint $table) {
            $table->id();
            
            // Relation article
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            
            // Statistique
            $table->string('stat_key'); // ex: "immigration_growth", "expat_population"
            $table->string('stat_value'); // ex: "125000", "15.2%"
            $table->string('stat_unit', 50)->nullable(); // ex: "people", "percent", "USD"
            
            // Source
            $table->text('source_url')->nullable();
            $table->boolean('verified')->default(false);
            
            $table->timestamp('created_at')->useCurrent();
            
            // Index pour performance
            $table->index(['article_id', 'stat_key']);
            $table->index('verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pillar_statistics');
    }
};
