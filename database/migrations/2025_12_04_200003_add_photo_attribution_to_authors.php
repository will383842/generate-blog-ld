<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            // Source de la photo
            $table->enum('photo_source', ['upload', 'unsplash', 'gravatar', 'manual'])
                  ->default('upload')
                  ->after('photo_url');
            
            // Attribution si Unsplash
            $table->string('photo_photographer', 100)->nullable()->after('photo_source');
            $table->string('photo_photographer_url', 500)->nullable()->after('photo_photographer');
            $table->text('photo_attribution')->nullable()->after('photo_photographer_url');
            
            // Index
            $table->index('photo_source');
        });
    }

    public function down(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->dropIndex(['photo_source']);
            $table->dropColumn([
                'photo_source',
                'photo_photographer',
                'photo_photographer_url',
                'photo_attribution',
            ]);
        });
    }
};