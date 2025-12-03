<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Language;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountryLanguageSeeder extends Seeder
{
    /**
     * Seeder pour les associations pays-langues - DÉJÀ CORRECT
     * 
     * Ce seeder NE crée PAS de traductions de noms de pays.
     * Il crée uniquement les relations dans la table pivot country_language.
     * 
     * Pour chaque pays : définit les langues parlées/supportées
     * La première langue de la liste est marquée comme primaire (is_primary = true)
     */
    public function run(): void
    {
        echo "🌱 Création des associations pays-langues...\n";
        
        // Récupérer les IDs des langues
        $languages = Language::pluck('id', 'code')->toArray();
        
        // Définir les langues par pays (code ISO2 => [langues, première = primaire])
        $countryLanguages = [
            // ═══════════════════════════════════════════════════════════════
            // EUROPE (44 pays)
            // ═══════════════════════════════════════════════════════════════
            'FR' => ['fr', 'en'],
            'DE' => ['de', 'en'],
            'GB' => ['en'],
            'IT' => ['en', 'fr', 'de'],
            'ES' => ['es', 'en'],
            'PT' => ['pt', 'en', 'es'],
            'NL' => ['en', 'de', 'fr'],
            'BE' => ['fr', 'en', 'de'],
            'CH' => ['fr', 'de', 'en'],
            'AT' => ['de', 'en'],
            'LU' => ['fr', 'de', 'en'],
            'IE' => ['en'],
            'SE' => ['en'],
            'NO' => ['en'],
            'DK' => ['en', 'de'],
            'FI' => ['en'],
            'PL' => ['en', 'de'],
            'CZ' => ['en', 'de'],
            'SK' => ['en', 'de'],
            'HU' => ['en', 'de'],
            'RO' => ['en', 'fr'],
            'BG' => ['en', 'ru'],
            'GR' => ['en'],
            'HR' => ['en', 'de'],
            'SI' => ['en', 'de'],
            'RS' => ['en', 'ru'],
            'BA' => ['en'],
            'ME' => ['en'],
            'MK' => ['en'],
            'AL' => ['en'],
            'XK' => ['en'],
            'EE' => ['en', 'ru'],
            'LV' => ['en', 'ru'],
            'LT' => ['en', 'ru'],
            'BY' => ['ru', 'en'],
            'UA' => ['ru', 'en'],
            'MD' => ['ru', 'en', 'fr'],
            'MT' => ['en'],
            'CY' => ['en'],
            'IS' => ['en'],
            'LI' => ['de', 'en'],
            'MC' => ['fr', 'en'],
            'SM' => ['en'],
            'VA' => ['en', 'fr'],
            'AD' => ['es', 'fr', 'en'],
            
            // ═══════════════════════════════════════════════════════════════
            // AMÉRIQUE DU NORD (3 pays)
            // ═══════════════════════════════════════════════════════════════
            'US' => ['en', 'es'],
            'CA' => ['en', 'fr'],
            'MX' => ['es', 'en'],
            
            // ═══════════════════════════════════════════════════════════════
            // AMÉRIQUE DU SUD (12 pays)
            // ═══════════════════════════════════════════════════════════════
            'BR' => ['pt', 'en', 'es'],
            'AR' => ['es', 'en'],
            'CL' => ['es', 'en'],
            'CO' => ['es', 'en'],
            'PE' => ['es', 'en'],
            'VE' => ['es', 'en'],
            'EC' => ['es', 'en'],
            'BO' => ['es', 'en'],
            'PY' => ['es', 'en'],
            'UY' => ['es', 'en', 'pt'],
            'GY' => ['en'],
            'SR' => ['en'],
            
            // ═══════════════════════════════════════════════════════════════
            // AMÉRIQUE CENTRALE & CARAÏBES (20 pays)
            // ═══════════════════════════════════════════════════════════════
            'GT' => ['es', 'en'],
            'BZ' => ['en', 'es'],
            'SV' => ['es', 'en'],
            'HN' => ['es', 'en'],
            'NI' => ['es', 'en'],
            'CR' => ['es', 'en'],
            'PA' => ['es', 'en'],
            'CU' => ['es', 'en'],
            'JM' => ['en'],
            'HT' => ['fr', 'en'],
            'DO' => ['es', 'en'],
            'PR' => ['es', 'en'],
            'TT' => ['en'],
            'BB' => ['en'],
            'BS' => ['en'],
            'LC' => ['en', 'fr'],
            'GD' => ['en'],
            'VC' => ['en'],
            'AG' => ['en'],
            'DM' => ['en', 'fr'],
            
            // ═══════════════════════════════════════════════════════════════
            // ASIE (48 pays)
            // ═══════════════════════════════════════════════════════════════
            'CN' => ['zh', 'en'],
            'JP' => ['en'],
            'KR' => ['en'],
            'KP' => ['en'],
            'TW' => ['zh', 'en'],
            'HK' => ['zh', 'en'],
            'MO' => ['zh', 'pt', 'en'],
            'MN' => ['en', 'ru'],
            'IN' => ['en', 'hi'],
            'PK' => ['en'],
            'BD' => ['en'],
            'LK' => ['en'],
            'NP' => ['en', 'hi'],
            'BT' => ['en'],
            'MV' => ['en'],
            'TH' => ['en'],
            'VN' => ['en', 'fr'],
            'LA' => ['en', 'fr'],
            'KH' => ['en', 'fr'],
            'MM' => ['en'],
            'MY' => ['en', 'zh'],
            'SG' => ['en', 'zh'],
            'ID' => ['en'],
            'PH' => ['en'],
            'BN' => ['en'],
            'TL' => ['pt', 'en'],
            'KZ' => ['ru', 'en'],
            'UZ' => ['ru', 'en'],
            'TM' => ['ru', 'en'],
            'KG' => ['ru', 'en'],
            'TJ' => ['ru', 'en'],
            'AF' => ['en'],
            'GE' => ['en', 'ru'],
            'AM' => ['en', 'ru'],
            'AZ' => ['en', 'ru'],
            
            // ═══════════════════════════════════════════════════════════════
            // MOYEN-ORIENT (16 pays)
            // ═══════════════════════════════════════════════════════════════
            'AE' => ['ar', 'en'],
            'SA' => ['ar', 'en'],
            'QA' => ['ar', 'en'],
            'KW' => ['ar', 'en'],
            'BH' => ['ar', 'en'],
            'OM' => ['ar', 'en'],
            'YE' => ['ar', 'en'],
            'IL' => ['en', 'ar', 'ru'],
            'PS' => ['ar', 'en'],
            'JO' => ['ar', 'en'],
            'LB' => ['ar', 'fr', 'en'],
            'SY' => ['ar', 'en'],
            'IQ' => ['ar', 'en'],
            'IR' => ['en'],
            'TR' => ['en', 'de', 'ar'],
            'CY' => ['en'],
            
            // ═══════════════════════════════════════════════════════════════
            // AFRIQUE (54 pays)
            // ═══════════════════════════════════════════════════════════════
            // Afrique du Nord
            'MA' => ['fr', 'ar', 'en'],
            'DZ' => ['fr', 'ar', 'en'],
            'TN' => ['fr', 'ar', 'en'],
            'LY' => ['ar', 'en'],
            'EG' => ['ar', 'en'],
            'SD' => ['ar', 'en'],
            'SS' => ['en', 'ar'],
            
            // Afrique de l'Ouest
            'SN' => ['fr', 'en'],
            'ML' => ['fr', 'en'],
            'MR' => ['fr', 'ar', 'en'],
            'GM' => ['en'],
            'GW' => ['pt', 'en'],
            'GN' => ['fr', 'en'],
            'SL' => ['en'],
            'LR' => ['en'],
            'CI' => ['fr', 'en'],
            'BF' => ['fr', 'en'],
            'GH' => ['en'],
            'TG' => ['fr', 'en'],
            'BJ' => ['fr', 'en'],
            'NE' => ['fr', 'en'],
            'NG' => ['en'],
            'CV' => ['pt', 'en'],
            
            // Afrique Centrale
            'CM' => ['fr', 'en'],
            'CF' => ['fr', 'en'],
            'TD' => ['fr', 'ar', 'en'],
            'CG' => ['fr', 'en'],
            'CD' => ['fr', 'en'],
            'GA' => ['fr', 'en'],
            'GQ' => ['es', 'fr', 'pt', 'en'],
            'ST' => ['pt', 'en'],
            
            // Afrique de l'Est
            'ET' => ['en'],
            'ER' => ['en', 'ar'],
            'DJ' => ['fr', 'ar', 'en'],
            'SO' => ['en', 'ar'],
            'KE' => ['en'],
            'UG' => ['en'],
            'TZ' => ['en'],
            'RW' => ['fr', 'en'],
            'BI' => ['fr', 'en'],
            'MG' => ['fr', 'en'],
            'MU' => ['en', 'fr'],
            'SC' => ['en', 'fr'],
            'KM' => ['fr', 'ar', 'en'],
            
            // Afrique Australe
            'ZA' => ['en'],
            'NA' => ['en', 'de'],
            'BW' => ['en'],
            'ZW' => ['en'],
            'ZM' => ['en'],
            'MW' => ['en'],
            'MZ' => ['pt', 'en'],
            'AO' => ['pt', 'en'],
            'SZ' => ['en'],
            'LS' => ['en'],
            
            // ═══════════════════════════════════════════════════════════════
            // OCÉANIE (14 pays)
            // ═══════════════════════════════════════════════════════════════
            'AU' => ['en'],
            'NZ' => ['en'],
            'PG' => ['en'],
            'FJ' => ['en', 'hi'],
            'SB' => ['en'],
            'VU' => ['en', 'fr'],
            'NC' => ['fr', 'en'],
            'PF' => ['fr', 'en'],
            'WS' => ['en'],
            'TO' => ['en'],
            'KI' => ['en'],
            'FM' => ['en'],
            'PW' => ['en'],
            'MH' => ['en'],
        ];
        
        $data = [];
        $now = now();
        $totalAssociations = 0;
        
        foreach ($countryLanguages as $countryCode => $langs) {
            $country = Country::where('code', $countryCode)->first();
            
            if (!$country) {
                continue;
            }
            
            foreach ($langs as $index => $langCode) {
                if (!isset($languages[$langCode])) {
                    continue;
                }
                
                $data[] = [
                    'country_id' => $country->id,
                    'language_id' => $languages[$langCode],
                    'is_primary' => $index === 0,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $totalAssociations++;
            }
        }
        
        // Insérer par lots de 100
        $chunksInserted = 0;
        foreach (array_chunk($data, 100) as $chunk) {
            DB::table('country_language')->insert($chunk);
            $chunksInserted++;
        }
        
        echo "✅ $totalAssociations associations pays-langues créées\n";
        echo "✅ " . count($countryLanguages) . " pays traités\n";
    }
}