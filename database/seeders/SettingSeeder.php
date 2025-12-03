<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Génération
            ['key' => 'generation_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'generation', 'description' => 'Activer la génération automatique'],
            ['key' => 'daily_articles_limit', 'value' => '100', 'type' => 'integer', 'group' => 'generation', 'description' => 'Nombre d\'articles par jour'],
            ['key' => 'daily_landings_limit', 'value' => '100', 'type' => 'integer', 'group' => 'generation', 'description' => 'Nombre de landings par jour'],
            ['key' => 'default_languages', 'value' => '["fr","en"]', 'type' => 'array', 'group' => 'generation', 'description' => 'Langues par défaut pour la traduction'],
            ['key' => 'auto_translate', 'value' => 'true', 'type' => 'boolean', 'group' => 'generation', 'description' => 'Traduction automatique activée'],
            ['key' => 'auto_publish', 'value' => 'false', 'type' => 'boolean', 'group' => 'generation', 'description' => 'Publication automatique activée'],
            ['key' => 'generate_images', 'value' => 'true', 'type' => 'boolean', 'group' => 'generation', 'description' => 'Générer les images DALL-E'],

            // Coûts
            ['key' => 'daily_cost_limit', 'value' => '100', 'type' => 'float', 'group' => 'costs', 'description' => 'Limite de coût journalier ($)'],
            ['key' => 'monthly_cost_limit', 'value' => '2500', 'type' => 'float', 'group' => 'costs', 'description' => 'Limite de coût mensuel ($)'],
            ['key' => 'cost_alert_threshold', 'value' => '80', 'type' => 'integer', 'group' => 'costs', 'description' => 'Seuil d\'alerte coût (%)'],

            // Qualité
            ['key' => 'min_quality_score', 'value' => '70', 'type' => 'integer', 'group' => 'quality', 'description' => 'Score de qualité minimum'],
            ['key' => 'min_word_count', 'value' => '1500', 'type' => 'integer', 'group' => 'quality', 'description' => 'Nombre de mots minimum'],
            ['key' => 'max_word_count', 'value' => '2500', 'type' => 'integer', 'group' => 'quality', 'description' => 'Nombre de mots maximum'],
            ['key' => 'faq_count', 'value' => '5', 'type' => 'integer', 'group' => 'quality', 'description' => 'Nombre de FAQs par article'],

            // Indexation
            ['key' => 'google_indexing_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'indexing', 'description' => 'Indexation Google activée'],
            ['key' => 'indexnow_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'indexing', 'description' => 'IndexNow (Bing/Yandex) activé'],

            // Notifications
            ['key' => 'notification_email', 'value' => '', 'type' => 'string', 'group' => 'notifications', 'description' => 'Email pour les notifications'],
            ['key' => 'notify_on_error', 'value' => 'true', 'type' => 'boolean', 'group' => 'notifications', 'description' => 'Notifier en cas d\'erreur'],
            ['key' => 'notify_daily_report', 'value' => 'true', 'type' => 'boolean', 'group' => 'notifications', 'description' => 'Envoyer le rapport journalier'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}