<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dossier_media', function (Blueprint $table) {
            // Remplacer source string par enum + attribution
            $table->dropColumn('source');
            $table->enum('source_type', ['upload', 'unsplash', 'dalle', 'stock', 'chart'])
                  ->default('upload')
                  ->after('media_type');
            
            // Attribution photographe
            $table->string('photographer', 100)->nullable()->after('alt_text');
            $table->string('photographer_url', 500)->nullable()->after('photographer');
            $table->text('attribution_html')->nullable()->after('photographer_url');
            
            // Source ID externe
            $table->string('source_id', 100)->nullable()->after('attribution_html');
            
            // Index
            $table->index('source_type');
        });
    }

    public function down(): void
    {
        Schema::table('dossier_media', function (Blueprint $table) {
            $table->dropIndex(['source_type']);
            $table->dropColumn([
                'source_type',
                'photographer',
                'photographer_url',
                'attribution_html',
                'source_id',
            ]);
            $table->string('source', 255)->nullable()->after('alt_text');
        });
    }
};