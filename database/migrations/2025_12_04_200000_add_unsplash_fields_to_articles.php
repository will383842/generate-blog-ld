<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Attribution Unsplash
            $table->text('image_attribution')->nullable()->after('image_alt');
            $table->string('image_photographer', 100)->nullable()->after('image_attribution');
            $table->string('image_photographer_url', 500)->nullable()->after('image_photographer');
            
            // Dimensions
            $table->unsignedInteger('image_width')->nullable()->after('image_photographer_url');
            $table->unsignedInteger('image_height')->nullable()->after('image_width');
            
            // Metadata
            $table->string('image_color', 7)->nullable()->after('image_height');
            $table->enum('image_source', ['dalle', 'unsplash', 'stock', 'manual'])
                  ->default('dalle')
                  ->after('image_color');
            
            // Index pour recherches
            $table->index('image_source');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['image_source']);
            $table->dropColumn([
                'image_attribution',
                'image_photographer',
                'image_photographer_url',
                'image_width',
                'image_height',
                'image_color',
                'image_source',
            ]);
        });
    }
};