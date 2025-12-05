<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->nullOnDelete();
            
            // Types: article, pillar, comparative, landing, manual, press_release, dossier, knowledge
            $table->json('content_types');
            
            // Sélection géographique
            $table->json('countries')->nullable();
            $table->json('regions')->nullable();
            $table->json('languages')->nullable();
            
            // Thématiques
            $table->json('themes')->nullable();
            $table->json('provider_types')->nullable();
            $table->json('lawyer_specialties')->nullable();
            $table->json('expat_domains')->nullable();
            $table->json('ulixai_services')->nullable();
            
            // Quantité
            $table->enum('quantity_mode', ['total', 'per_country', 'per_language', 'per_country_language'])->default('total');
            $table->unsignedInteger('quantity_value')->default(1);
            
            // Récurrence
            $table->enum('recurrence_type', ['once', 'daily', 'weekly', 'monthly', 'cron'])->default('once');
            $table->json('recurrence_config')->nullable();
            $table->string('cron_expression')->nullable();
            
            // Planification
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            
            // Status
            $table->enum('status', ['draft', 'scheduled', 'active', 'paused', 'completed', 'error'])->default('draft');
            $table->text('error_message')->nullable();
            
            // Options JSON
            $table->json('options')->nullable();
            
            // Stats
            $table->unsignedInteger('total_generated')->default(0);
            $table->unsignedInteger('total_published')->default(0);
            $table->unsignedInteger('total_errors')->default(0);
            $table->decimal('total_cost', 10, 4)->default(0);
            $table->unsignedInteger('run_count')->default(0);
            
            // Priorité et limites
            $table->unsignedTinyInteger('priority')->default(5);
            $table->decimal('daily_budget_limit', 10, 2)->nullable();
            $table->unsignedInteger('daily_generation_limit')->nullable();
            $table->unsignedInteger('concurrent_jobs_limit')->default(5);
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['platform_id', 'status']);
            $table->index(['status', 'next_run_at']);
        });
        
        Schema::create('program_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['running', 'completed', 'failed', 'cancelled'])->default('running');
            $table->unsignedInteger('items_planned')->default(0);
            $table->unsignedInteger('items_generated')->default(0);
            $table->unsignedInteger('items_failed')->default(0);
            $table->decimal('cost', 10, 4)->default(0);
            $table->json('summary')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index(['program_id', 'status']);
        });
        
        Schema::create('program_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->onDelete('cascade');
            $table->foreignId('program_run_id')->constrained()->onDelete('cascade');
            
            // Relation polymorphique (Article, PressRelease, PressDossier)
            $table->nullableMorphs('content');
            
            // Contexte
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('language_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('theme_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('thematic_id')->nullable();
            $table->string('thematic_type')->nullable();
            
            // Type de génération
            $table->string('generation_type');
            
            // Status
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->decimal('cost', 10, 4)->default(0);
            
            // Métadonnées
            $table->json('generation_params')->nullable();
            $table->json('result_data')->nullable();
            
            $table->timestamps();
            
            $table->index(['program_id', 'status']);
            $table->index(['program_run_id', 'status']);
            // nullableMorphs crée déjà un index sur content_type + content_id
            $table->index('generation_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_items');
        Schema::dropIfExists('program_runs');
        Schema::dropIfExists('programs');
    }
};