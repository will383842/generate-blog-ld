<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('press_release_media', function (Blueprint $table) {
            // Remplacer source string par enum
            $table->dropColumn('source');
            $table->enum('source_type', ['upload', 'unsplash', 'dalle', 'stock'])
                  ->default('upload')
                  ->after('media_type');
            
            // Attribution photographe
            $table->string('photographer', 100)->nullable()->after('caption');
            $table->string('photographer_url', 500)->nullable()->after('photographer');
            $table->text('attribution_html')->nullable()->after('photographer_url');
            
            // Dimensions si image
            $table->unsignedInteger('width')->nullable()->after('attribution_html');
            $table->unsignedInteger('height')->nullable()->after('width');
            
            // Source ID externe (Unsplash ID)
            $table->string('source_id', 100)->nullable()->after('height');
            
            // Index
            $table->index('source_type');
        });
    }

    public function down(): void
    {
        Schema::table('press_release_media', function (Blueprint $table) {
            $table->dropIndex(['source_type']);
            $table->dropColumn([
                'source_type',
                'photographer',
                'photographer_url',
                'attribution_html',
                'width',
                'height',
                'source_id',
            ]);
            $table->string('source')->nullable()->after('caption');
        });
    }
};