<?php
/**
 * =============================================================================
 * FICHIER 4/10 : StyleSettingsSeeder - 90 settings style (30 par plateforme)
 * =============================================================================
 * 
 * EMPLACEMENT : database/seeders/StyleSettingsSeeder.php
 * 
 * EXÉCUTION : php artisan db:seed --class=StyleSettingsSeeder
 * 
 * =============================================================================
 */

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Platform;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class StyleSettingsSeeder extends Seeder
{
    public function run(): void
    {
        echo "\n🎨 SEEDING STYLE SETTINGS...\n";
        
        $sosExpat = Platform::where('code', 'sos-expat')->first();
        $ulixai = Platform::where('code', 'ulixai')->first();
        $ulysse = Platform::where('code', 'ulysse')->first();
        
        if (!$sosExpat || !$ulixai || !$ulysse) {
            die("❌ Plateformes non trouvées\n");
        }
        
        // SOS-EXPAT : Style professionnel, formel, rassurant
        echo "  → SOS-Expat (style formel, rassurant)...\n";
        $this->seedPlatformSettings($sosExpat, [
            // ========== CATÉGORIE: STYLE_TONE ==========
            ['key' => 'style_tone_formality', 'value' => '8', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau formalité (0-10, vouvoiement obligatoire si ≥6)'],
            ['key' => 'style_tone_enthusiasm', 'value' => '5', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau enthousiasme (0-10, neutre=5)'],
            ['key' => 'style_tone_empathy', 'value' => '8', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau empathie (0-10, important pour urgences)'],
            ['key' => 'style_tone_professionalism', 'value' => '9', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau professionnalisme (0-10)'],
            
            // ========== CATÉGORIE: STYLE_VOICE ==========
            ['key' => 'style_voice_person', 'value' => 'second', 'type' => 'string', 'category' => 'style_voice', 'description' => 'Personne grammaticale (first/second/third)'],
            ['key' => 'style_voice_pronoun_nous', 'value' => '30', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "nous" (%)'],
            ['key' => 'style_voice_pronoun_vous', 'value' => '60', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "vous" (%)'],
            ['key' => 'style_voice_pronoun_on', 'value' => '10', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "on" (%)'],
            ['key' => 'style_voice_avoid_je', 'value' => 'true', 'type' => 'boolean', 'category' => 'style_voice', 'description' => 'Éviter "je" (pas personnel singulier)'],
            
            // ========== CATÉGORIE: STYLE_FORMATTING ==========
            ['key' => 'style_sentence_length_avg', 'value' => '18', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur moyenne phrase cible (mots)'],
            ['key' => 'style_sentence_length_max', 'value' => '25', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur max phrase absolue (mots)'],
            ['key' => 'style_sentence_length_tolerance', 'value' => '5', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Tolérance longueur moyenne (±mots)'],
            ['key' => 'style_paragraph_length_avg', 'value' => '4', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur moyenne paragraphe (lignes)'],
            ['key' => 'style_paragraph_length_max', 'value' => '6', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur max paragraphe (lignes)'],
            ['key' => 'style_list_frequency', 'value' => 'high', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Fréquence listes (low/medium/high)'],
            ['key' => 'style_list_items_min', 'value' => '3', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre min items liste'],
            ['key' => 'style_list_items_max', 'value' => '6', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre max items liste'],
            ['key' => 'style_bold_frequency', 'value' => 'moderate', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Fréquence gras (low/moderate/high)'],
            ['key' => 'style_bold_items_per_article', 'value' => '5', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre mots gras par article'],
            ['key' => 'style_italic_usage', 'value' => 'technical_terms', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Usage italique (none/technical_terms/emphasis)'],
            
            // ========== CATÉGORIE: STYLE_TECHNICAL ==========
            ['key' => 'style_emoji_usage', 'value' => 'rare', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Usage émojis (none/rare/moderate/frequent)'],
            ['key' => 'style_allowed_emojis', 'value' => '["✅","⚠️","💡","📱","🌍"]', 'type' => 'json', 'category' => 'style_technical', 'description' => 'Émojis autorisés (whitelist)'],
            ['key' => 'style_forbidden_emojis', 'value' => '["😀","😂","🤣","😍","🎉","👍","❤️"]', 'type' => 'json', 'category' => 'style_technical', 'description' => 'Émojis interdits (blacklist)'],
            ['key' => 'style_numbers_format', 'value' => 'precise', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Format nombres (precise/rounded/approximate)'],
            ['key' => 'style_active_voice_ratio', 'value' => '80', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Ratio voix active min (%)'],
            ['key' => 'style_question_headlines_ratio', 'value' => '50', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Ratio titres questions (%)'],
            ['key' => 'style_cta_type', 'value' => 'action_oriented', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Type CTA (soft/action_oriented/urgent)'],
            ['key' => 'style_storytelling_frequency', 'value' => 'occasional', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Fréquence storytelling (rare/occasional/frequent)'],
            ['key' => 'style_exclamation_multiple', 'value' => 'false', 'type' => 'boolean', 'category' => 'style_technical', 'description' => 'Autoriser !! ou !!! (true/false)'],
            ['key' => 'style_caps_abuse_tolerance', 'value' => '2', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Tolérance mots MAJUSCULES (nombre max)'],
        ]);
        
        // ULIXAI : Style dynamique, moderne, émojis fréquents
        echo "  → Ulixai (style dynamique, émojis fréquents)...\n";
        $this->seedPlatformSettings($ulixai, [
            // Ton plus casual
            ['key' => 'style_tone_formality', 'value' => '5', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau formalité (plus casual)'],
            ['key' => 'style_tone_enthusiasm', 'value' => '7', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau enthousiasme (plus élevé)'],
            ['key' => 'style_tone_empathy', 'value' => '7', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau empathie'],
            ['key' => 'style_tone_professionalism', 'value' => '7', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau professionnalisme'],
            
            ['key' => 'style_voice_person', 'value' => 'second', 'type' => 'string', 'category' => 'style_voice', 'description' => 'Personne grammaticale'],
            ['key' => 'style_voice_pronoun_nous', 'value' => '25', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "nous"'],
            ['key' => 'style_voice_pronoun_vous', 'value' => '65', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "vous"'],
            ['key' => 'style_voice_pronoun_on', 'value' => '10', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "on"'],
            ['key' => 'style_voice_avoid_je', 'value' => 'true', 'type' => 'boolean', 'category' => 'style_voice', 'description' => 'Éviter "je"'],
            
            // Phrases légèrement plus courtes, plus dynamiques
            ['key' => 'style_sentence_length_avg', 'value' => '16', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur moyenne phrase'],
            ['key' => 'style_sentence_length_max', 'value' => '22', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur max phrase'],
            ['key' => 'style_sentence_length_tolerance', 'value' => '5', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Tolérance longueur'],
            ['key' => 'style_paragraph_length_avg', 'value' => '3', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur moyenne paragraphe'],
            ['key' => 'style_paragraph_length_max', 'value' => '5', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur max paragraphe'],
            ['key' => 'style_list_frequency', 'value' => 'high', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Fréquence listes'],
            ['key' => 'style_list_items_min', 'value' => '3', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre min items'],
            ['key' => 'style_list_items_max', 'value' => '7', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre max items'],
            ['key' => 'style_bold_frequency', 'value' => 'high', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Fréquence gras'],
            ['key' => 'style_bold_items_per_article', 'value' => '7', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre mots gras'],
            ['key' => 'style_italic_usage', 'value' => 'emphasis', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Usage italique'],
            
            // Émojis fréquents
            ['key' => 'style_emoji_usage', 'value' => 'frequent', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Usage émojis'],
            ['key' => 'style_allowed_emojis', 'value' => '["🌍","✨","🎯","💼","🏠","📦","🚚","✅","⚡","🔥","💪","🎉"]', 'type' => 'json', 'category' => 'style_technical', 'description' => 'Émojis autorisés'],
            ['key' => 'style_forbidden_emojis', 'value' => '["😀","😂","🤣","😍"]', 'type' => 'json', 'category' => 'style_technical', 'description' => 'Émojis interdits'],
            ['key' => 'style_numbers_format', 'value' => 'rounded', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Format nombres'],
            ['key' => 'style_active_voice_ratio', 'value' => '75', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Ratio voix active'],
            ['key' => 'style_question_headlines_ratio', 'value' => '40', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Ratio titres questions'],
            ['key' => 'style_cta_type', 'value' => 'action_oriented', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Type CTA'],
            ['key' => 'style_storytelling_frequency', 'value' => 'frequent', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Fréquence storytelling'],
            ['key' => 'style_exclamation_multiple', 'value' => 'true', 'type' => 'boolean', 'category' => 'style_technical', 'description' => 'Autoriser !!'],
            ['key' => 'style_caps_abuse_tolerance', 'value' => '3', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Tolérance MAJUSCULES'],
        ]);
        
        // ULYSSE : Style tech, innovant
        echo "  → Ulysse.AI (style tech, innovant)...\n";
        $this->seedPlatformSettings($ulysse, [
            ['key' => 'style_tone_formality', 'value' => '6', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau formalité (modéré)'],
            ['key' => 'style_tone_enthusiasm', 'value' => '6', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau enthousiasme'],
            ['key' => 'style_tone_empathy', 'value' => '6', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau empathie'],
            ['key' => 'style_tone_professionalism', 'value' => '8', 'type' => 'integer', 'category' => 'style_tone', 'description' => 'Niveau professionnalisme'],
            
            ['key' => 'style_voice_person', 'value' => 'second', 'type' => 'string', 'category' => 'style_voice', 'description' => 'Personne grammaticale'],
            ['key' => 'style_voice_pronoun_nous', 'value' => '35', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "nous"'],
            ['key' => 'style_voice_pronoun_vous', 'value' => '55', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "vous"'],
            ['key' => 'style_voice_pronoun_on', 'value' => '10', 'type' => 'integer', 'category' => 'style_voice', 'description' => 'Ratio pronoms "on"'],
            ['key' => 'style_voice_avoid_je', 'value' => 'true', 'type' => 'boolean', 'category' => 'style_voice', 'description' => 'Éviter "je"'],
            
            ['key' => 'style_sentence_length_avg', 'value' => '17', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur moyenne phrase'],
            ['key' => 'style_sentence_length_max', 'value' => '24', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur max phrase'],
            ['key' => 'style_sentence_length_tolerance', 'value' => '5', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Tolérance longueur'],
            ['key' => 'style_paragraph_length_avg', 'value' => '4', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur moyenne paragraphe'],
            ['key' => 'style_paragraph_length_max', 'value' => '6', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Longueur max paragraphe'],
            ['key' => 'style_list_frequency', 'value' => 'medium', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Fréquence listes'],
            ['key' => 'style_list_items_min', 'value' => '3', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre min items'],
            ['key' => 'style_list_items_max', 'value' => '6', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre max items'],
            ['key' => 'style_bold_frequency', 'value' => 'moderate', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Fréquence gras'],
            ['key' => 'style_bold_items_per_article', 'value' => '6', 'type' => 'integer', 'category' => 'style_formatting', 'description' => 'Nombre mots gras'],
            ['key' => 'style_italic_usage', 'value' => 'technical_terms', 'type' => 'string', 'category' => 'style_formatting', 'description' => 'Usage italique'],
            
            ['key' => 'style_emoji_usage', 'value' => 'moderate', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Usage émojis'],
            ['key' => 'style_allowed_emojis', 'value' => '["🤖","🚀","💡","🌐","📊","🔍","✅","⚡","🎯"]', 'type' => 'json', 'category' => 'style_technical', 'description' => 'Émojis autorisés'],
            ['key' => 'style_forbidden_emojis', 'value' => '["😀","😂","🤣","😍","🎉"]', 'type' => 'json', 'category' => 'style_technical', 'description' => 'Émojis interdits'],
            ['key' => 'style_numbers_format', 'value' => 'precise', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Format nombres'],
            ['key' => 'style_active_voice_ratio', 'value' => '75', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Ratio voix active'],
            ['key' => 'style_question_headlines_ratio', 'value' => '45', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Ratio titres questions'],
            ['key' => 'style_cta_type', 'value' => 'action_oriented', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Type CTA'],
            ['key' => 'style_storytelling_frequency', 'value' => 'occasional', 'type' => 'string', 'category' => 'style_technical', 'description' => 'Fréquence storytelling'],
            ['key' => 'style_exclamation_multiple', 'value' => 'false', 'type' => 'boolean', 'category' => 'style_technical', 'description' => 'Autoriser !!'],
            ['key' => 'style_caps_abuse_tolerance', 'value' => '2', 'type' => 'integer', 'category' => 'style_technical', 'description' => 'Tolérance MAJUSCULES'],
        ]);
        
        echo "✅ ~90 style settings créés (30 par plateforme)\n\n";
    }
    
    private function seedPlatformSettings(Platform $platform, array $settings): void
    {
        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => "{$platform->code}.{$setting['key']}"],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'group' => 'platform_style',
                    'category' => $setting['category'] ?? null,
                    'description' => $setting['description'] ?? null,
                ]
            );
        }
    }
}