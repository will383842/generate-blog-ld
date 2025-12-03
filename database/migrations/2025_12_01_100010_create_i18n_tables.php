<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table des clés de traduction
        Schema::create('i18n_keys', function (Blueprint $table) {
            $table->id();
            $table->string('key_name', 200)->unique(); // cta.find_expert, ui.button.submit
            $table->string('category', 50); // ui, cta, specialty, domain, meta
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('category');
            $table->index('is_active');
        });

        // Table des traductions
        Schema::create('i18n_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('i18n_key_id')->constrained('i18n_keys')->onDelete('cascade');
            $table->char('language_code', 2);
            $table->text('value');
            $table->boolean('is_auto_translated')->default(false);
            $table->boolean('is_reviewed')->default(false);
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('admin_users')->onDelete('set null');
            $table->timestamps();
            
            $table->unique(['i18n_key_id', 'language_code']);
            $table->index('language_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('i18n_translations');
        Schema::dropIfExists('i18n_keys');
    }
};
