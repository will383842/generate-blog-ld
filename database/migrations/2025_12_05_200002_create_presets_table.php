<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('platform_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->nullOnDelete();
            
            $table->enum('type', [
                'content_type',
                'geographic',
                'generation',
                'publication',
                'full_program'
            ])->default('generation');
            
            $table->json('config');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('usage_count')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['platform_id', 'type', 'is_active']);
            $table->index(['type', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presets');
    }
};