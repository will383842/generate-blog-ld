<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Language;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * CountryLanguageSeeder CORRIGÉ
 * 
 * OBJECTIF : Chaque pays doit avoir du contenu disponible dans les 9 langues
 * pour le SEO international.
 * 
 * Ce seeder crée 197 pays × 9 langues = 1773 associations
 * 
 * La colonne is_primary indique la langue principale du pays
 * (celle utilisée pour la version par défaut de l'URL)
 * 
 * Placement: database/seeders/CountryLanguageSeeder.php
 */
class CountryLanguageSeeder extends Seeder
{
    /**
     * Les 9 langues supportées par la plateforme
     */
    private const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

    /**
     * Langues principales par pays (ISO2 => langue primaire)
     * Ces langues sont marquées is_primary = true
     * 
     * Pour les pays non listés, 'en' est utilisé par défaut
     */
    private const PRIMARY_LANGUAGES = [
        // ═══════════════════════════════════════════════════════════════
        // EUROPE FRANCOPHONE
        // ═══════════════════════════════════════════════════════════════
        'FR' => 'fr', // France
        'BE' => 'fr', // Belgique
        'CH' => 'fr', // Suisse
        'LU' => 'fr', // Luxembourg
        'MC' => 'fr', // Monaco
        
        // ═══════════════════════════════════════════════════════════════
        // EUROPE GERMANOPHONE
        // ═══════════════════════════════════════════════════════════════
        'DE' => 'de', // Allemagne
        'AT' => 'de', // Autriche
        'LI' => 'de', // Liechtenstein
        
        // ═══════════════════════════════════════════════════════════════
        // EUROPE ANGLOPHONE
        // ═══════════════════════════════════════════════════════════════
        'GB' => 'en', // Royaume-Uni
        'IE' => 'en', // Irlande
        'MT' => 'en', // Malte
        
        // ═══════════════════════════════════════════════════════════════
        // EUROPE HISPANOPHONE
        // ═══════════════════════════════════════════════════════════════
        'ES' => 'es', // Espagne
        'AD' => 'es', // Andorre
        
        // ═══════════════════════════════════════════════════════════════
        // EUROPE LUSOPHONE
        // ═══════════════════════════════════════════════════════════════
        'PT' => 'pt', // Portugal
        
        // ═══════════════════════════════════════════════════════════════
        // EUROPE RUSSOPHONE
        // ═══════════════════════════════════════════════════════════════
        'RU' => 'ru', // Russie
        'BY' => 'ru', // Biélorussie
        
        // ═══════════════════════════════════════════════════════════════
        // AMÉRIQUE DU NORD
        // ═══════════════════════════════════════════════════════════════
        'US' => 'en', // États-Unis
        'CA' => 'en', // Canada
        'MX' => 'es', // Mexique
        
        // ═══════════════════════════════════════════════════════════════
        // AMÉRIQUE DU SUD
        // ═══════════════════════════════════════════════════════════════
        'BR' => 'pt', // Brésil
        'AR' => 'es', // Argentine
        'CL' => 'es', // Chili
        'CO' => 'es', // Colombie
        'PE' => 'es', // Pérou
        'VE' => 'es', // Venezuela
        'EC' => 'es', // Équateur
        'BO' => 'es', // Bolivie
        'PY' => 'es', // Paraguay
        'UY' => 'es', // Uruguay
        'GY' => 'en', // Guyana
        'SR' => 'en', // Suriname
        
        // ═══════════════════════════════════════════════════════════════
        // AMÉRIQUE CENTRALE
        // ═══════════════════════════════════════════════════════════════
        'GT' => 'es', // Guatemala
        'BZ' => 'en', // Belize
        'SV' => 'es', // Salvador
        'HN' => 'es', // Honduras
        'NI' => 'es', // Nicaragua
        'CR' => 'es', // Costa Rica
        'PA' => 'es', // Panama
        
        // ═══════════════════════════════════════════════════════════════
        // CARAÏBES
        // ═══════════════════════════════════════════════════════════════
        'CU' => 'es', // Cuba
        'JM' => 'en', // Jamaïque
        'HT' => 'fr', // Haïti
        'DO' => 'es', // République Dominicaine
        'PR' => 'es', // Porto Rico
        'TT' => 'en', // Trinité-et-Tobago
        'BB' => 'en', // Barbade
        'BS' => 'en', // Bahamas
        'LC' => 'en', // Sainte-Lucie
        'GD' => 'en', // Grenade
        'VC' => 'en', // Saint-Vincent
        'AG' => 'en', // Antigua-et-Barbuda
        'DM' => 'en', // Dominique
        
        // ═══════════════════════════════════════════════════════════════
        // ASIE - SINOPHONE
        // ═══════════════════════════════════════════════════════════════
        'CN' => 'zh', // Chine
        'TW' => 'zh', // Taïwan
        'HK' => 'zh', // Hong Kong
        'MO' => 'zh', // Macao
        'SG' => 'zh', // Singapour
        
        // ═══════════════════════════════════════════════════════════════
        // ASIE - HINDOPHONE
        // ═══════════════════════════════════════════════════════════════
        'IN' => 'hi', // Inde
        'NP' => 'hi', // Népal
        'FJ' => 'hi', // Fidji
        
        // ═══════════════════════════════════════════════════════════════
        // ASIE CENTRALE (RUSSOPHONE)
        // ═══════════════════════════════════════════════════════════════
        'KZ' => 'ru', // Kazakhstan
        'UZ' => 'ru', // Ouzbékistan
        'TM' => 'ru', // Turkménistan
        'KG' => 'ru', // Kirghizistan
        'TJ' => 'ru', // Tadjikistan
        
        // ═══════════════════════════════════════════════════════════════
        // ASIE - ANGLOPHONE PAR DÉFAUT
        // ═══════════════════════════════════════════════════════════════
        'JP' => 'en', // Japon
        'KR' => 'en', // Corée du Sud
        'KP' => 'en', // Corée du Nord
        'TH' => 'en', // Thaïlande
        'VN' => 'en', // Vietnam
        'LA' => 'en', // Laos
        'KH' => 'en', // Cambodge
        'MM' => 'en', // Myanmar
        'MY' => 'en', // Malaisie
        'ID' => 'en', // Indonésie
        'PH' => 'en', // Philippines
        'BN' => 'en', // Brunei
        'TL' => 'pt', // Timor oriental
        'MN' => 'en', // Mongolie
        'BD' => 'en', // Bangladesh
        'LK' => 'en', // Sri Lanka
        'BT' => 'en', // Bhoutan
        'MV' => 'en', // Maldives
        'PK' => 'en', // Pakistan
        'AF' => 'en', // Afghanistan
        
        // ═══════════════════════════════════════════════════════════════
        // CAUCASE
        // ═══════════════════════════════════════════════════════════════
        'GE' => 'en', // Géorgie
        'AM' => 'en', // Arménie
        'AZ' => 'en', // Azerbaïdjan
        
        // ═══════════════════════════════════════════════════════════════
        // MOYEN-ORIENT ARABOPHONE
        // ═══════════════════════════════════════════════════════════════
        'AE' => 'ar', // Émirats arabes unis
        'SA' => 'ar', // Arabie saoudite
        'QA' => 'ar', // Qatar
        'KW' => 'ar', // Koweït
        'BH' => 'ar', // Bahreïn
        'OM' => 'ar', // Oman
        'YE' => 'ar', // Yémen
        'JO' => 'ar', // Jordanie
        'LB' => 'ar', // Liban
        'SY' => 'ar', // Syrie
        'IQ' => 'ar', // Irak
        'PS' => 'ar', // Palestine
        
        // ═══════════════════════════════════════════════════════════════
        // MOYEN-ORIENT NON-ARABOPHONE
        // ═══════════════════════════════════════════════════════════════
        'IL' => 'en', // Israël
        'TR' => 'en', // Turquie
        'IR' => 'en', // Iran
        'CY' => 'en', // Chypre
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DU NORD FRANCOPHONE
        // ═══════════════════════════════════════════════════════════════
        'MA' => 'fr', // Maroc
        'DZ' => 'fr', // Algérie
        'TN' => 'fr', // Tunisie
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DU NORD ARABOPHONE
        // ═══════════════════════════════════════════════════════════════
        'LY' => 'ar', // Libye
        'EG' => 'ar', // Égypte
        'SD' => 'ar', // Soudan
        'SS' => 'en', // Soudan du Sud
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DE L'OUEST FRANCOPHONE
        // ═══════════════════════════════════════════════════════════════
        'SN' => 'fr', // Sénégal
        'ML' => 'fr', // Mali
        'MR' => 'fr', // Mauritanie
        'GN' => 'fr', // Guinée
        'CI' => 'fr', // Côte d'Ivoire
        'BF' => 'fr', // Burkina Faso
        'TG' => 'fr', // Togo
        'BJ' => 'fr', // Bénin
        'NE' => 'fr', // Niger
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DE L'OUEST ANGLOPHONE
        // ═══════════════════════════════════════════════════════════════
        'GM' => 'en', // Gambie
        'SL' => 'en', // Sierra Leone
        'LR' => 'en', // Libéria
        'GH' => 'en', // Ghana
        'NG' => 'en', // Nigéria
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DE L'OUEST LUSOPHONE
        // ═══════════════════════════════════════════════════════════════
        'GW' => 'pt', // Guinée-Bissau
        'CV' => 'pt', // Cap-Vert
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE CENTRALE FRANCOPHONE
        // ═══════════════════════════════════════════════════════════════
        'CM' => 'fr', // Cameroun
        'CF' => 'fr', // République centrafricaine
        'TD' => 'fr', // Tchad
        'CG' => 'fr', // Congo
        'CD' => 'fr', // RD Congo
        'GA' => 'fr', // Gabon
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE CENTRALE HISPANOPHONE/LUSOPHONE
        // ═══════════════════════════════════════════════════════════════
        'GQ' => 'es', // Guinée équatoriale
        'ST' => 'pt', // São Tomé-et-Príncipe
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DE L'EST FRANCOPHONE
        // ═══════════════════════════════════════════════════════════════
        'DJ' => 'fr', // Djibouti
        'RW' => 'fr', // Rwanda
        'BI' => 'fr', // Burundi
        'MG' => 'fr', // Madagascar
        'KM' => 'fr', // Comores
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE DE L'EST ANGLOPHONE
        // ═══════════════════════════════════════════════════════════════
        'ET' => 'en', // Éthiopie
        'ER' => 'en', // Érythrée
        'SO' => 'en', // Somalie
        'KE' => 'en', // Kenya
        'UG' => 'en', // Ouganda
        'TZ' => 'en', // Tanzanie
        'MU' => 'en', // Maurice
        'SC' => 'en', // Seychelles
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE AUSTRALE ANGLOPHONE
        // ═══════════════════════════════════════════════════════════════
        'ZA' => 'en', // Afrique du Sud
        'NA' => 'en', // Namibie
        'BW' => 'en', // Botswana
        'ZW' => 'en', // Zimbabwe
        'ZM' => 'en', // Zambie
        'MW' => 'en', // Malawi
        'SZ' => 'en', // Eswatini
        'LS' => 'en', // Lesotho
        
        // ═══════════════════════════════════════════════════════════════
        // AFRIQUE AUSTRALE LUSOPHONE
        // ═══════════════════════════════════════════════════════════════
        'MZ' => 'pt', // Mozambique
        'AO' => 'pt', // Angola
        
        // ═══════════════════════════════════════════════════════════════
        // OCÉANIE
        // ═══════════════════════════════════════════════════════════════
        'AU' => 'en', // Australie
        'NZ' => 'en', // Nouvelle-Zélande
        'PG' => 'en', // Papouasie-Nouvelle-Guinée
        'SB' => 'en', // Îles Salomon
        'VU' => 'en', // Vanuatu
        'NC' => 'fr', // Nouvelle-Calédonie
        'PF' => 'fr', // Polynésie française
        'WS' => 'en', // Samoa
        'TO' => 'en', // Tonga
        'KI' => 'en', // Kiribati
        'FM' => 'en', // Micronésie
        'PW' => 'en', // Palaos
        'MH' => 'en', // Îles Marshall
        
        // ═══════════════════════════════════════════════════════════════
        // RESTE DE L'EUROPE (ANGLOPHONE PAR DÉFAUT)
        // ═══════════════════════════════════════════════════════════════
        'IT' => 'en', // Italie
        'NL' => 'en', // Pays-Bas
        'SE' => 'en', // Suède
        'NO' => 'en', // Norvège
        'DK' => 'en', // Danemark
        'FI' => 'en', // Finlande
        'PL' => 'en', // Pologne
        'CZ' => 'en', // République tchèque
        'SK' => 'en', // Slovaquie
        'HU' => 'en', // Hongrie
        'RO' => 'en', // Roumanie
        'BG' => 'en', // Bulgarie
        'GR' => 'en', // Grèce
        'HR' => 'en', // Croatie
        'SI' => 'en', // Slovénie
        'RS' => 'en', // Serbie
        'BA' => 'en', // Bosnie-Herzégovine
        'ME' => 'en', // Monténégro
        'MK' => 'en', // Macédoine du Nord
        'AL' => 'en', // Albanie
        'XK' => 'en', // Kosovo
        'EE' => 'en', // Estonie
        'LV' => 'en', // Lettonie
        'LT' => 'en', // Lituanie
        'UA' => 'en', // Ukraine
        'MD' => 'en', // Moldavie
        'IS' => 'en', // Islande
        'SM' => 'en', // Saint-Marin
        'VA' => 'en', // Vatican
    ];

    public function run(): void
    {
        echo "🌱 Création des associations pays-langues (9 langues × 197 pays)...\n";
        
        // Vider la table existante
        DB::table('country_language')->truncate();
        
        // Récupérer les IDs des langues
        $languages = Language::pluck('id', 'code')->toArray();
        
        // Vérifier que les 9 langues existent
        $missingLanguages = array_diff(self::SUPPORTED_LANGUAGES, array_keys($languages));
        if (!empty($missingLanguages)) {
            throw new \RuntimeException(
                "Langues manquantes dans la table 'languages': " . implode(', ', $missingLanguages) .
                "\nExécutez d'abord: php artisan db:seed --class=LanguageSeeder"
            );
        }
        
        // Récupérer tous les pays
        $countries = Country::all();
        
        if ($countries->isEmpty()) {
            throw new \RuntimeException(
                "Aucun pays dans la table 'countries'.\nExécutez d'abord: php artisan db:seed --class=CountrySeeder"
            );
        }
        
        $data = [];
        $now = now();
        
        foreach ($countries as $country) {
            // Déterminer la langue primaire du pays (défaut: anglais)
            $primaryLang = self::PRIMARY_LANGUAGES[$country->code] ?? 'en';
            
            // Créer une association pour CHAQUE langue supportée
            foreach (self::SUPPORTED_LANGUAGES as $langCode) {
                $data[] = [
                    'country_id' => $country->id,
                    'language_id' => $languages[$langCode],
                    'is_primary' => ($langCode === $primaryLang),
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Insérer par lots de 500 pour performance
        $totalInserted = 0;
        foreach (array_chunk($data, 500) as $chunk) {
            DB::table('country_language')->insert($chunk);
            $totalInserted += count($chunk);
        }
        
        $countryCount = $countries->count();
        $langCount = count(self::SUPPORTED_LANGUAGES);
        $expectedTotal = $countryCount * $langCount;
        
        echo "✅ {$totalInserted} associations créées\n";
        echo "   → {$countryCount} pays × {$langCount} langues = {$expectedTotal} attendu\n";
        
        if ($totalInserted !== $expectedTotal) {
            echo "⚠️ ATTENTION: Différence détectée! ({$totalInserted} vs {$expectedTotal})\n";
        } else {
            echo "✅ Cohérence vérifiée!\n";
        }
        
        // Statistiques par langue primaire
        echo "\n📊 Répartition des langues primaires:\n";
        $primaryStats = collect(self::PRIMARY_LANGUAGES)->countBy();
        foreach ($primaryStats->sortDesc() as $lang => $count) {
            echo "   - {$lang}: {$count} pays\n";
        }
    }
}