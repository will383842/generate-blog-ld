<?php

namespace Database\Seeders;

use App\Models\AuthorityDomain;
use Illuminate\Database\Seeder;

class GovernmentDomainsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding government domains for 197 countries...');

        $domains = $this->getGovernmentDomains();
        $created = 0;
        $updated = 0;

        foreach ($domains as $domain) {
            $domain['is_active'] = true;
            $domain['auto_discovered'] = false;
            
            $existing = AuthorityDomain::where('domain', $domain['domain'])->first();

            if ($existing) {
                $existing->update($domain);
                $updated++;
            } else {
                AuthorityDomain::create($domain);
                $created++;
            }
        }

        $this->command->info("Government domains: {$created} created, {$updated} updated. Total: " . count($domains));
    }

    protected function getGovernmentDomains(): array
    {
        return array_merge(
            $this->getEuropeGovernments(),
            $this->getNorthAmericaGovernments(),
            $this->getSouthAmericaGovernments(),
            $this->getAsiaGovernments(),
            $this->getMiddleEastGovernments(),
            $this->getAfricaGovernments(),
            $this->getOceaniaGovernments(),
            $this->getCaribbeanGovernments(),
            $this->getCentralAmericaGovernments()
        );
    }

    protected function getEuropeGovernments(): array
    {
        return [
            // France
            ['domain' => 'service-public.fr', 'name' => 'Service Public France', 'source_type' => 'government', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['general', 'visa', 'immigration'], 'authority_score' => 95],
            ['domain' => 'diplomatie.gouv.fr', 'name' => 'Ministère Affaires Étrangères France', 'source_type' => 'government', 'country_code' => 'FR', 'languages' => ['fr', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'france-visas.gouv.fr', 'name' => 'France Visas', 'source_type' => 'government', 'country_code' => 'FR', 'languages' => ['fr', 'en'], 'topics' => ['visa'], 'authority_score' => 95],
            ['domain' => 'interieur.gouv.fr', 'name' => 'Ministère Intérieur France', 'source_type' => 'government', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['immigration', 'residence'], 'authority_score' => 95],
            ['domain' => 'impots.gouv.fr', 'name' => 'Impôts France', 'source_type' => 'government', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['tax'], 'authority_score' => 95],
            // Germany
            ['domain' => 'bundesregierung.de', 'name' => 'German Federal Government', 'source_type' => 'government', 'country_code' => 'DE', 'languages' => ['de', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'auswaertiges-amt.de', 'name' => 'German Foreign Ministry', 'source_type' => 'government', 'country_code' => 'DE', 'languages' => ['de', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'bamf.de', 'name' => 'German Immigration Office', 'source_type' => 'government', 'country_code' => 'DE', 'languages' => ['de', 'en'], 'topics' => ['immigration', 'asylum'], 'authority_score' => 95],
            ['domain' => 'make-it-in-germany.com', 'name' => 'Make it in Germany', 'source_type' => 'government', 'country_code' => 'DE', 'languages' => ['de', 'en', 'es', 'fr'], 'topics' => ['work', 'immigration'], 'authority_score' => 90],
            // UK
            ['domain' => 'gov.uk', 'name' => 'UK Government', 'source_type' => 'government', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['general', 'visa', 'immigration', 'tax'], 'authority_score' => 95],
            ['domain' => 'nhs.uk', 'name' => 'NHS UK', 'source_type' => 'government', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['health'], 'authority_score' => 95],
            // Spain
            ['domain' => 'exteriores.gob.es', 'name' => 'Spanish Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ES', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'inclusion.gob.es', 'name' => 'Spanish Immigration', 'source_type' => 'government', 'country_code' => 'ES', 'languages' => ['es'], 'topics' => ['immigration', 'residence'], 'authority_score' => 95],
            ['domain' => 'agenciatributaria.es', 'name' => 'Spanish Tax Agency', 'source_type' => 'government', 'country_code' => 'ES', 'languages' => ['es'], 'topics' => ['tax'], 'authority_score' => 95],
            // Italy
            ['domain' => 'esteri.it', 'name' => 'Italian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'IT', 'languages' => ['it', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'poliziadistato.it', 'name' => 'Italian Police', 'source_type' => 'government', 'country_code' => 'IT', 'languages' => ['it'], 'topics' => ['immigration'], 'authority_score' => 90],
            // Netherlands
            ['domain' => 'government.nl', 'name' => 'Dutch Government', 'source_type' => 'government', 'country_code' => 'NL', 'languages' => ['en', 'nl'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'ind.nl', 'name' => 'Dutch Immigration (IND)', 'source_type' => 'government', 'country_code' => 'NL', 'languages' => ['nl', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            // Belgium
            ['domain' => 'diplomatie.belgium.be', 'name' => 'Belgian Foreign Affairs', 'source_type' => 'government', 'country_code' => 'BE', 'languages' => ['fr', 'nl', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'ibz.be', 'name' => 'Belgian Immigration', 'source_type' => 'government', 'country_code' => 'BE', 'languages' => ['fr', 'nl'], 'topics' => ['immigration'], 'authority_score' => 95],
            // Switzerland
            ['domain' => 'admin.ch', 'name' => 'Swiss Government', 'source_type' => 'government', 'country_code' => 'CH', 'languages' => ['de', 'fr', 'it', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'sem.admin.ch', 'name' => 'Swiss Migration Office', 'source_type' => 'government', 'country_code' => 'CH', 'languages' => ['de', 'fr', 'it', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            // Portugal
            ['domain' => 'portaldiplomatico.mne.gov.pt', 'name' => 'Portuguese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'PT', 'languages' => ['pt', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'sef.pt', 'name' => 'Portuguese Immigration', 'source_type' => 'government', 'country_code' => 'PT', 'languages' => ['pt', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            // Austria
            ['domain' => 'bmeia.gv.at', 'name' => 'Austrian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'AT', 'languages' => ['de', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'migration.gv.at', 'name' => 'Austrian Migration', 'source_type' => 'government', 'country_code' => 'AT', 'languages' => ['de', 'en'], 'topics' => ['immigration'], 'authority_score' => 95],
            // Luxembourg, Monaco, Liechtenstein, Andorra, San Marino, Vatican
            ['domain' => 'gouvernement.lu', 'name' => 'Luxembourg Government', 'source_type' => 'government', 'country_code' => 'LU', 'languages' => ['fr', 'de', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'gouvernement.mc', 'name' => 'Monaco Government', 'source_type' => 'government', 'country_code' => 'MC', 'languages' => ['fr'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'regierung.li', 'name' => 'Liechtenstein Government', 'source_type' => 'government', 'country_code' => 'LI', 'languages' => ['de'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'gov.ad', 'name' => 'Andorra Government', 'source_type' => 'government', 'country_code' => 'AD', 'languages' => ['ca', 'es', 'fr'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'gov.sm', 'name' => 'San Marino Government', 'source_type' => 'government', 'country_code' => 'SM', 'languages' => ['it'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'vaticanstate.va', 'name' => 'Vatican State', 'source_type' => 'government', 'country_code' => 'VA', 'languages' => ['it', 'en'], 'topics' => ['general'], 'authority_score' => 90],
            // Scandinavia
            ['domain' => 'government.se', 'name' => 'Swedish Government', 'source_type' => 'government', 'country_code' => 'SE', 'languages' => ['sv', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'migrationsverket.se', 'name' => 'Swedish Migration Agency', 'source_type' => 'government', 'country_code' => 'SE', 'languages' => ['sv', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'um.dk', 'name' => 'Danish Foreign Ministry', 'source_type' => 'government', 'country_code' => 'DK', 'languages' => ['da', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'nyidanmark.dk', 'name' => 'Danish Immigration', 'source_type' => 'government', 'country_code' => 'DK', 'languages' => ['da', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'regjeringen.no', 'name' => 'Norwegian Government', 'source_type' => 'government', 'country_code' => 'NO', 'languages' => ['no', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'udi.no', 'name' => 'Norwegian Immigration', 'source_type' => 'government', 'country_code' => 'NO', 'languages' => ['no', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.fi', 'name' => 'Finnish Government', 'source_type' => 'government', 'country_code' => 'FI', 'languages' => ['fi', 'sv', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'migri.fi', 'name' => 'Finnish Immigration', 'source_type' => 'government', 'country_code' => 'FI', 'languages' => ['fi', 'sv', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'government.is', 'name' => 'Icelandic Government', 'source_type' => 'government', 'country_code' => 'IS', 'languages' => ['is', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            // Ireland
            ['domain' => 'gov.ie', 'name' => 'Irish Government', 'source_type' => 'government', 'country_code' => 'IE', 'languages' => ['en', 'ga'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'irishimmigration.ie', 'name' => 'Irish Immigration', 'source_type' => 'government', 'country_code' => 'IE', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            // Eastern Europe
            ['domain' => 'gov.pl', 'name' => 'Polish Government', 'source_type' => 'government', 'country_code' => 'PL', 'languages' => ['pl', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'udsc.gov.pl', 'name' => 'Polish Immigration', 'source_type' => 'government', 'country_code' => 'PL', 'languages' => ['pl', 'en'], 'topics' => ['immigration'], 'authority_score' => 95],
            ['domain' => 'mzv.cz', 'name' => 'Czech Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CZ', 'languages' => ['cs', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mzv.sk', 'name' => 'Slovak Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SK', 'languages' => ['sk', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'kormany.hu', 'name' => 'Hungarian Government', 'source_type' => 'government', 'country_code' => 'HU', 'languages' => ['hu', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.ro', 'name' => 'Romanian Government', 'source_type' => 'government', 'country_code' => 'RO', 'languages' => ['ro', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'mae.ro', 'name' => 'Romanian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'RO', 'languages' => ['ro', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'government.bg', 'name' => 'Bulgarian Government', 'source_type' => 'government', 'country_code' => 'BG', 'languages' => ['bg', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.si', 'name' => 'Slovenian Government', 'source_type' => 'government', 'country_code' => 'SI', 'languages' => ['sl', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.hr', 'name' => 'Croatian Government', 'source_type' => 'government', 'country_code' => 'HR', 'languages' => ['hr', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.rs', 'name' => 'Serbian Government', 'source_type' => 'government', 'country_code' => 'RS', 'languages' => ['sr', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.me', 'name' => 'Montenegrin Government', 'source_type' => 'government', 'country_code' => 'ME', 'languages' => ['sr', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.mk', 'name' => 'North Macedonia Government', 'source_type' => 'government', 'country_code' => 'MK', 'languages' => ['mk', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.al', 'name' => 'Albanian Government', 'source_type' => 'government', 'country_code' => 'AL', 'languages' => ['sq', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'rks-gov.net', 'name' => 'Kosovo Government', 'source_type' => 'government', 'country_code' => 'XK', 'languages' => ['sq', 'sr', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'vijeceministara.gov.ba', 'name' => 'Bosnia Herzegovina Government', 'source_type' => 'government', 'country_code' => 'BA', 'languages' => ['bs', 'hr', 'sr', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            // Baltic
            ['domain' => 'vm.ee', 'name' => 'Estonian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'EE', 'languages' => ['et', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.lv', 'name' => 'Latvian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LV', 'languages' => ['lv', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'urm.lt', 'name' => 'Lithuanian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LT', 'languages' => ['lt', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            // Greece, Cyprus, Malta
            ['domain' => 'mfa.gr', 'name' => 'Greek Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GR', 'languages' => ['el', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.cy', 'name' => 'Cyprus Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CY', 'languages' => ['el', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'gov.mt', 'name' => 'Maltese Government', 'source_type' => 'government', 'country_code' => 'MT', 'languages' => ['mt', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            // Russia, Ukraine, Belarus, Moldova
            ['domain' => 'government.ru', 'name' => 'Russian Government', 'source_type' => 'government', 'country_code' => 'RU', 'languages' => ['ru', 'en'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'mid.ru', 'name' => 'Russian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'RU', 'languages' => ['ru', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'kmu.gov.ua', 'name' => 'Ukrainian Government', 'source_type' => 'government', 'country_code' => 'UA', 'languages' => ['uk', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.ua', 'name' => 'Ukrainian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'UA', 'languages' => ['uk', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'government.by', 'name' => 'Belarusian Government', 'source_type' => 'government', 'country_code' => 'BY', 'languages' => ['be', 'ru', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.md', 'name' => 'Moldovan Government', 'source_type' => 'government', 'country_code' => 'MD', 'languages' => ['ro', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            // Caucasus
            ['domain' => 'gov.ge', 'name' => 'Georgian Government', 'source_type' => 'government', 'country_code' => 'GE', 'languages' => ['ka', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.am', 'name' => 'Armenian Government', 'source_type' => 'government', 'country_code' => 'AM', 'languages' => ['hy', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'president.az', 'name' => 'Azerbaijani Government', 'source_type' => 'government', 'country_code' => 'AZ', 'languages' => ['az', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
        ];
    }

    protected function getNorthAmericaGovernments(): array
    {
        return [
            ['domain' => 'usa.gov', 'name' => 'US Government', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'state.gov', 'name' => 'US State Department', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['visa', 'embassy', 'passport'], 'authority_score' => 95],
            ['domain' => 'uscis.gov', 'name' => 'US Immigration (USCIS)', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['immigration', 'visa', 'citizenship'], 'authority_score' => 95],
            ['domain' => 'travel.state.gov', 'name' => 'US Travel', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['visa', 'passport'], 'authority_score' => 95],
            ['domain' => 'irs.gov', 'name' => 'US IRS', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['tax'], 'authority_score' => 95],
            ['domain' => 'ssa.gov', 'name' => 'US Social Security', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['social', 'pension'], 'authority_score' => 95],
            ['domain' => 'dhs.gov', 'name' => 'US Homeland Security', 'source_type' => 'government', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['immigration', 'security'], 'authority_score' => 95],
            ['domain' => 'canada.ca', 'name' => 'Government of Canada', 'source_type' => 'government', 'country_code' => 'CA', 'languages' => ['en', 'fr'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'ircc.canada.ca', 'name' => 'Canadian Immigration', 'source_type' => 'government', 'country_code' => 'CA', 'languages' => ['en', 'fr'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'cra-arc.gc.ca', 'name' => 'Canada Revenue Agency', 'source_type' => 'government', 'country_code' => 'CA', 'languages' => ['en', 'fr'], 'topics' => ['tax'], 'authority_score' => 95],
            ['domain' => 'gob.mx', 'name' => 'Mexican Government', 'source_type' => 'government', 'country_code' => 'MX', 'languages' => ['es'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'sre.gob.mx', 'name' => 'Mexican Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MX', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'inm.gob.mx', 'name' => 'Mexican Immigration', 'source_type' => 'government', 'country_code' => 'MX', 'languages' => ['es'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
        ];
    }

    protected function getSouthAmericaGovernments(): array
    {
        return [
            ['domain' => 'gov.br', 'name' => 'Brazilian Government', 'source_type' => 'government', 'country_code' => 'BR', 'languages' => ['pt'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'itamaraty.gov.br', 'name' => 'Brazilian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BR', 'languages' => ['pt', 'en', 'es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'pf.gov.br', 'name' => 'Brazilian Federal Police', 'source_type' => 'government', 'country_code' => 'BR', 'languages' => ['pt'], 'topics' => ['immigration'], 'authority_score' => 95],
            ['domain' => 'argentina.gob.ar', 'name' => 'Argentine Government', 'source_type' => 'government', 'country_code' => 'AR', 'languages' => ['es'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'cancilleria.gob.ar', 'name' => 'Argentine Foreign Ministry', 'source_type' => 'government', 'country_code' => 'AR', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'migraciones.gov.ar', 'name' => 'Argentine Immigration', 'source_type' => 'government', 'country_code' => 'AR', 'languages' => ['es', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'gob.cl', 'name' => 'Chilean Government', 'source_type' => 'government', 'country_code' => 'CL', 'languages' => ['es'], 'topics' => ['general'], 'authority_score' => 95],
            ['domain' => 'extranjeria.gob.cl', 'name' => 'Chilean Immigration', 'source_type' => 'government', 'country_code' => 'CL', 'languages' => ['es', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'cancilleria.gov.co', 'name' => 'Colombian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CO', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'migracioncolombia.gov.co', 'name' => 'Colombian Immigration', 'source_type' => 'government', 'country_code' => 'CO', 'languages' => ['es', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'gob.pe', 'name' => 'Peruvian Government', 'source_type' => 'government', 'country_code' => 'PE', 'languages' => ['es'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'rree.gob.pe', 'name' => 'Peruvian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'PE', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mppre.gob.ve', 'name' => 'Venezuelan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'VE', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'cancilleria.gob.ec', 'name' => 'Ecuadorian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'EC', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'cancilleria.gob.bo', 'name' => 'Bolivian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BO', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mre.gov.py', 'name' => 'Paraguayan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'PY', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'gub.uy', 'name' => 'Uruguayan Government', 'source_type' => 'government', 'country_code' => 'UY', 'languages' => ['es'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'mrree.gub.uy', 'name' => 'Uruguayan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'UY', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.gy', 'name' => 'Guyana Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GY', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'gov.sr', 'name' => 'Suriname Government', 'source_type' => 'government', 'country_code' => 'SR', 'languages' => ['nl'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
        ];
    }

    protected function getAsiaGovernments(): array
    {
        return [
            // East Asia
            ['domain' => 'mofa.go.jp', 'name' => 'Japanese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'JP', 'languages' => ['ja', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'moj.go.jp', 'name' => 'Japanese Ministry of Justice', 'source_type' => 'government', 'country_code' => 'JP', 'languages' => ['ja', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mofa.go.kr', 'name' => 'Korean Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KR', 'languages' => ['ko', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'immigration.go.kr', 'name' => 'Korean Immigration', 'source_type' => 'government', 'country_code' => 'KR', 'languages' => ['ko', 'en', 'zh'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'fmprc.gov.cn', 'name' => 'Chinese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CN', 'languages' => ['zh', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'nia.gov.cn', 'name' => 'Chinese Immigration', 'source_type' => 'government', 'country_code' => 'CN', 'languages' => ['zh', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.hk', 'name' => 'Hong Kong Government', 'source_type' => 'government', 'country_code' => 'HK', 'languages' => ['zh', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'immd.gov.hk', 'name' => 'Hong Kong Immigration', 'source_type' => 'government', 'country_code' => 'HK', 'languages' => ['zh', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.mo', 'name' => 'Macau Government', 'source_type' => 'government', 'country_code' => 'MO', 'languages' => ['zh', 'pt', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.tw', 'name' => 'Taiwan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TW', 'languages' => ['zh', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'government.mn', 'name' => 'Mongolian Government', 'source_type' => 'government', 'country_code' => 'MN', 'languages' => ['mn', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            // Southeast Asia
            ['domain' => 'mfa.go.th', 'name' => 'Thai Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TH', 'languages' => ['th', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'immigration.go.th', 'name' => 'Thai Immigration', 'source_type' => 'government', 'country_code' => 'TH', 'languages' => ['th', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.sg', 'name' => 'Singapore Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SG', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'ica.gov.sg', 'name' => 'Singapore Immigration', 'source_type' => 'government', 'country_code' => 'SG', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'kln.gov.my', 'name' => 'Malaysian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MY', 'languages' => ['ms', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'imi.gov.my', 'name' => 'Malaysian Immigration', 'source_type' => 'government', 'country_code' => 'MY', 'languages' => ['ms', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'kemlu.go.id', 'name' => 'Indonesian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ID', 'languages' => ['id', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'imigrasi.go.id', 'name' => 'Indonesian Immigration', 'source_type' => 'government', 'country_code' => 'ID', 'languages' => ['id', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.vn', 'name' => 'Vietnamese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'VN', 'languages' => ['vi', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'dfa.gov.ph', 'name' => 'Philippine Foreign Affairs', 'source_type' => 'government', 'country_code' => 'PH', 'languages' => ['en', 'tl'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'immigration.gov.ph', 'name' => 'Philippine Immigration', 'source_type' => 'government', 'country_code' => 'PH', 'languages' => ['en', 'tl'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfaic.gov.kh', 'name' => 'Cambodian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KH', 'languages' => ['km', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.la', 'name' => 'Lao Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LA', 'languages' => ['lo', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.mm', 'name' => 'Myanmar Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MM', 'languages' => ['my', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'gov.bn', 'name' => 'Brunei Government', 'source_type' => 'government', 'country_code' => 'BN', 'languages' => ['ms', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'gov.tl', 'name' => 'Timor-Leste Government', 'source_type' => 'government', 'country_code' => 'TL', 'languages' => ['pt', 'en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            // South Asia
            ['domain' => 'mea.gov.in', 'name' => 'Indian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'IN', 'languages' => ['en', 'hi'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'indianvisaonline.gov.in', 'name' => 'Indian Visa Online', 'source_type' => 'government', 'country_code' => 'IN', 'languages' => ['en'], 'topics' => ['visa'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.pk', 'name' => 'Pakistani Foreign Ministry', 'source_type' => 'government', 'country_code' => 'PK', 'languages' => ['en', 'ur'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.bd', 'name' => 'Bangladeshi Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BD', 'languages' => ['bn', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.lk', 'name' => 'Sri Lankan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LK', 'languages' => ['si', 'ta', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.np', 'name' => 'Nepalese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'NP', 'languages' => ['ne', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.bt', 'name' => 'Bhutanese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BT', 'languages' => ['dz', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'foreign.gov.mv', 'name' => 'Maldivian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MV', 'languages' => ['dv', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            // Central Asia
            ['domain' => 'mfa.kz', 'name' => 'Kazakh Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KZ', 'languages' => ['kk', 'ru', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.uz', 'name' => 'Uzbek Foreign Ministry', 'source_type' => 'government', 'country_code' => 'UZ', 'languages' => ['uz', 'ru', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.tm', 'name' => 'Turkmen Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TM', 'languages' => ['tk', 'ru', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.kg', 'name' => 'Kyrgyz Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KG', 'languages' => ['ky', 'ru', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.tj', 'name' => 'Tajik Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TJ', 'languages' => ['tg', 'ru', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.af', 'name' => 'Afghan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'AF', 'languages' => ['ps', 'fa', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
        ];
    }

    protected function getMiddleEastGovernments(): array
    {
        return [
            ['domain' => 'mofa.gov.ae', 'name' => 'UAE Foreign Ministry', 'source_type' => 'government', 'country_code' => 'AE', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'ica.gov.ae', 'name' => 'UAE Immigration', 'source_type' => 'government', 'country_code' => 'AE', 'languages' => ['ar', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.sa', 'name' => 'Saudi Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SA', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'visa.mofa.gov.sa', 'name' => 'Saudi Visa Portal', 'source_type' => 'government', 'country_code' => 'SA', 'languages' => ['ar', 'en'], 'topics' => ['visa'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.qa', 'name' => 'Qatari Foreign Ministry', 'source_type' => 'government', 'country_code' => 'QA', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'portal.moi.gov.qa', 'name' => 'Qatar Interior Ministry', 'source_type' => 'government', 'country_code' => 'QA', 'languages' => ['ar', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.kw', 'name' => 'Kuwaiti Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KW', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.bh', 'name' => 'Bahraini Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BH', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.om', 'name' => 'Omani Foreign Ministry', 'source_type' => 'government', 'country_code' => 'OM', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.il', 'name' => 'Israeli Foreign Ministry', 'source_type' => 'government', 'country_code' => 'IL', 'languages' => ['he', 'en', 'ar'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'piba.gov.il', 'name' => 'Israeli Immigration', 'source_type' => 'government', 'country_code' => 'IL', 'languages' => ['he', 'en', 'ar', 'ru'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.jo', 'name' => 'Jordanian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'JO', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.lb', 'name' => 'Lebanese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LB', 'languages' => ['ar', 'en', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.sy', 'name' => 'Syrian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SY', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'mofa.gov.iq', 'name' => 'Iraqi Foreign Ministry', 'source_type' => 'government', 'country_code' => 'IQ', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.tr', 'name' => 'Turkish Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TR', 'languages' => ['tr', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'goc.gov.tr', 'name' => 'Turkish Immigration', 'source_type' => 'government', 'country_code' => 'TR', 'languages' => ['tr', 'en', 'ar'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.ir', 'name' => 'Iranian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'IR', 'languages' => ['fa', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mofa.gov.ye', 'name' => 'Yemeni Foreign Ministry', 'source_type' => 'government', 'country_code' => 'YE', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'mofa.pna.ps', 'name' => 'Palestinian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'PS', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
        ];
    }

    protected function getAfricaGovernments(): array
    {
        return [
            // North Africa
            ['domain' => 'diplomatie.ma', 'name' => 'Moroccan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MA', 'languages' => ['ar', 'fr', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.eg', 'name' => 'Egyptian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'EG', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mae.gov.dz', 'name' => 'Algerian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'DZ', 'languages' => ['ar', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'diplomatie.gov.tn', 'name' => 'Tunisian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TN', 'languages' => ['ar', 'fr', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mofa.gov.ly', 'name' => 'Libyan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LY', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'mfa.gov.sd', 'name' => 'Sudanese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SD', 'languages' => ['ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            // West Africa
            ['domain' => 'immigration.gov.ng', 'name' => 'Nigerian Immigration', 'source_type' => 'government', 'country_code' => 'NG', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'foreignaffairs.gov.ng', 'name' => 'Nigerian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'NG', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.gh', 'name' => 'Ghanaian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GH', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'diplomatie.gouv.ci', 'name' => 'Ivorian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CI', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'diplomatie.gouv.sn', 'name' => 'Senegalese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SN', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'diplomatie.gouv.ml', 'name' => 'Malian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ML', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gov.bf', 'name' => 'Burkinabé Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BF', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mae.gov.ne', 'name' => 'Niger Foreign Ministry', 'source_type' => 'government', 'country_code' => 'NE', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.gn', 'name' => 'Guinean Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GN', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.bj', 'name' => 'Beninese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BJ', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.tg', 'name' => 'Togolese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TG', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.lr', 'name' => 'Liberian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LR', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.sl', 'name' => 'Sierra Leone Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SL', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gm', 'name' => 'Gambian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GM', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mne.gov.cv', 'name' => 'Cape Verde Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CV', 'languages' => ['pt'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gov.gw', 'name' => 'Guinea-Bissau Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GW', 'languages' => ['pt'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'diplomatie.gov.mr', 'name' => 'Mauritanian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MR', 'languages' => ['ar', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            // East Africa
            ['domain' => 'immigration.go.ke', 'name' => 'Kenyan Immigration', 'source_type' => 'government', 'country_code' => 'KE', 'languages' => ['en', 'sw'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.go.ke', 'name' => 'Kenyan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KE', 'languages' => ['en', 'sw'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'immigration.go.tz', 'name' => 'Tanzanian Immigration', 'source_type' => 'government', 'country_code' => 'TZ', 'languages' => ['sw', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'immigration.go.ug', 'name' => 'Ugandan Immigration', 'source_type' => 'government', 'country_code' => 'UG', 'languages' => ['en', 'sw'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'migration.gov.rw', 'name' => 'Rwandan Immigration', 'source_type' => 'government', 'country_code' => 'RW', 'languages' => ['rw', 'en', 'fr'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'migration.gov.bi', 'name' => 'Burundian Immigration', 'source_type' => 'government', 'country_code' => 'BI', 'languages' => ['rn', 'fr'], 'topics' => ['immigration', 'visa'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.et', 'name' => 'Ethiopian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ET', 'languages' => ['am', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.er', 'name' => 'Eritrean Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ER', 'languages' => ['ti', 'ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'mfa.gov.so', 'name' => 'Somali Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SO', 'languages' => ['so', 'ar', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'mfa.gov.dj', 'name' => 'Djiboutian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'DJ', 'languages' => ['fr', 'ar'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'immigration.gov.ss', 'name' => 'South Sudan Immigration', 'source_type' => 'government', 'country_code' => 'SS', 'languages' => ['en', 'ar'], 'topics' => ['immigration', 'visa'], 'authority_score' => 85],
            // Central Africa
            ['domain' => 'minrex.gov.cd', 'name' => 'DRC Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CD', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.cg', 'name' => 'Congo Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CG', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.cm', 'name' => 'Cameroonian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CM', 'languages' => ['fr', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.ga', 'name' => 'Gabonese Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GA', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.gq', 'name' => 'Equatorial Guinea Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GQ', 'languages' => ['es', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.cf', 'name' => 'CAR Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CF', 'languages' => ['fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'diplomatie.gouv.td', 'name' => 'Chadian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'TD', 'languages' => ['fr', 'ar'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mirex.gov.ao', 'name' => 'Angolan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'AO', 'languages' => ['pt'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            // Southern Africa
            ['domain' => 'dha.gov.za', 'name' => 'South African Home Affairs', 'source_type' => 'government', 'country_code' => 'ZA', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'dirco.gov.za', 'name' => 'South African Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ZA', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'evisa.gov.bw', 'name' => 'Botswana eVisa', 'source_type' => 'government', 'country_code' => 'BW', 'languages' => ['en'], 'topics' => ['visa'], 'authority_score' => 90],
            ['domain' => 'mha.gov.na', 'name' => 'Namibian Home Affairs', 'source_type' => 'government', 'country_code' => 'NA', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.sz', 'name' => 'Eswatini Government', 'source_type' => 'government', 'country_code' => 'SZ', 'languages' => ['en', 'ss'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.ls', 'name' => 'Lesotho Government', 'source_type' => 'government', 'country_code' => 'LS', 'languages' => ['en', 'st'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'evisa.gov.zw', 'name' => 'Zimbabwe eVisa', 'source_type' => 'government', 'country_code' => 'ZW', 'languages' => ['en'], 'topics' => ['visa'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.zm', 'name' => 'Zambian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ZM', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'evisa.gov.mw', 'name' => 'Malawi eVisa', 'source_type' => 'government', 'country_code' => 'MW', 'languages' => ['en'], 'topics' => ['visa'], 'authority_score' => 90],
            ['domain' => 'immigration.gov.mz', 'name' => 'Mozambican Immigration', 'source_type' => 'government', 'country_code' => 'MZ', 'languages' => ['pt'], 'topics' => ['immigration', 'visa'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.mg', 'name' => 'Malagasy Foreign Ministry', 'source_type' => 'government', 'country_code' => 'MG', 'languages' => ['mg', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            // Island Nations
            ['domain' => 'govmu.org', 'name' => 'Mauritius Government', 'source_type' => 'government', 'country_code' => 'MU', 'languages' => ['en', 'fr'], 'topics' => ['general', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.sc', 'name' => 'Seychelles Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SC', 'languages' => ['en', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'diplomatie.gouv.km', 'name' => 'Comoros Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KM', 'languages' => ['ar', 'fr'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'diplomatie.gouv.st', 'name' => 'São Tomé Foreign Ministry', 'source_type' => 'government', 'country_code' => 'ST', 'languages' => ['pt'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
        ];
    }

    protected function getOceaniaGovernments(): array
    {
        return [
            ['domain' => 'homeaffairs.gov.au', 'name' => 'Australian Home Affairs', 'source_type' => 'government', 'country_code' => 'AU', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'dfat.gov.au', 'name' => 'Australian Foreign Affairs', 'source_type' => 'government', 'country_code' => 'AU', 'languages' => ['en'], 'topics' => ['embassy', 'travel'], 'authority_score' => 95],
            ['domain' => 'immi.homeaffairs.gov.au', 'name' => 'Australian Immigration', 'source_type' => 'government', 'country_code' => 'AU', 'languages' => ['en'], 'topics' => ['visa', 'immigration'], 'authority_score' => 95],
            ['domain' => 'immigration.govt.nz', 'name' => 'New Zealand Immigration', 'source_type' => 'government', 'country_code' => 'NZ', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfat.govt.nz', 'name' => 'NZ Foreign Affairs', 'source_type' => 'government', 'country_code' => 'NZ', 'languages' => ['en'], 'topics' => ['embassy', 'travel'], 'authority_score' => 95],
            ['domain' => 'immigration.gov.fj', 'name' => 'Fiji Immigration', 'source_type' => 'government', 'country_code' => 'FJ', 'languages' => ['en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 90],
            ['domain' => 'govt.pn', 'name' => 'Papua New Guinea Government', 'source_type' => 'government', 'country_code' => 'PG', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.sb', 'name' => 'Solomon Islands Government', 'source_type' => 'government', 'country_code' => 'SB', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.vu', 'name' => 'Vanuatu Government', 'source_type' => 'government', 'country_code' => 'VU', 'languages' => ['en', 'fr'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.ws', 'name' => 'Samoa Government', 'source_type' => 'government', 'country_code' => 'WS', 'languages' => ['en', 'sm'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.to', 'name' => 'Tonga Government', 'source_type' => 'government', 'country_code' => 'TO', 'languages' => ['en', 'to'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.ki', 'name' => 'Kiribati Government', 'source_type' => 'government', 'country_code' => 'KI', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 85],
            ['domain' => 'gov.tv', 'name' => 'Tuvalu Government', 'source_type' => 'government', 'country_code' => 'TV', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 85],
            ['domain' => 'gov.nr', 'name' => 'Nauru Government', 'source_type' => 'government', 'country_code' => 'NR', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 85],
            ['domain' => 'gov.pw', 'name' => 'Palau Government', 'source_type' => 'government', 'country_code' => 'PW', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.fm', 'name' => 'Micronesia Government', 'source_type' => 'government', 'country_code' => 'FM', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 85],
            ['domain' => 'rmigovernment.org', 'name' => 'Marshall Islands Government', 'source_type' => 'government', 'country_code' => 'MH', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 85],
        ];
    }

    protected function getCaribbeanGovernments(): array
    {
        return [
            ['domain' => 'gov.jm', 'name' => 'Jamaica Government', 'source_type' => 'government', 'country_code' => 'JM', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.tt', 'name' => 'Trinidad & Tobago Government', 'source_type' => 'government', 'country_code' => 'TT', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.bb', 'name' => 'Barbados Government', 'source_type' => 'government', 'country_code' => 'BB', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.bs', 'name' => 'Bahamas Government', 'source_type' => 'government', 'country_code' => 'BS', 'languages' => ['en'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'gov.cu', 'name' => 'Cuban Government', 'source_type' => 'government', 'country_code' => 'CU', 'languages' => ['es'], 'topics' => ['general', 'visa'], 'authority_score' => 90],
            ['domain' => 'mirex.gob.do', 'name' => 'Dominican Republic Foreign Ministry', 'source_type' => 'government', 'country_code' => 'DO', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'mfa.gov.ht', 'name' => 'Haitian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'HT', 'languages' => ['fr', 'ht'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'estado.gobierno.pr', 'name' => 'Puerto Rico Government', 'source_type' => 'government', 'country_code' => 'PR', 'languages' => ['es', 'en'], 'topics' => ['general'], 'authority_score' => 90],
            ['domain' => 'foreign.gov.lc', 'name' => 'Saint Lucia Foreign Ministry', 'source_type' => 'government', 'country_code' => 'LC', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'foreignaffairs.gov.vc', 'name' => 'St Vincent Foreign Ministry', 'source_type' => 'government', 'country_code' => 'VC', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'foreign.gov.gd', 'name' => 'Grenada Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GD', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'foreign.gov.ag', 'name' => 'Antigua Foreign Ministry', 'source_type' => 'government', 'country_code' => 'AG', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'foreign.gov.dm', 'name' => 'Dominica Foreign Ministry', 'source_type' => 'government', 'country_code' => 'DM', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'foreign.gov.kn', 'name' => 'St Kitts Foreign Ministry', 'source_type' => 'government', 'country_code' => 'KN', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
        ];
    }

    protected function getCentralAmericaGovernments(): array
    {
        return [
            ['domain' => 'minex.gob.gt', 'name' => 'Guatemalan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'GT', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'rree.gob.hn', 'name' => 'Honduran Foreign Ministry', 'source_type' => 'government', 'country_code' => 'HN', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'rree.gob.sv', 'name' => 'Salvadoran Foreign Ministry', 'source_type' => 'government', 'country_code' => 'SV', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
            ['domain' => 'minex.gob.ni', 'name' => 'Nicaraguan Foreign Ministry', 'source_type' => 'government', 'country_code' => 'NI', 'languages' => ['es'], 'topics' => ['visa', 'embassy'], 'authority_score' => 85],
            ['domain' => 'rree.go.cr', 'name' => 'Costa Rican Foreign Ministry', 'source_type' => 'government', 'country_code' => 'CR', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'migracion.go.cr', 'name' => 'Costa Rican Immigration', 'source_type' => 'government', 'country_code' => 'CR', 'languages' => ['es', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mire.gob.pa', 'name' => 'Panamanian Foreign Ministry', 'source_type' => 'government', 'country_code' => 'PA', 'languages' => ['es', 'en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 95],
            ['domain' => 'migracion.gob.pa', 'name' => 'Panamanian Immigration', 'source_type' => 'government', 'country_code' => 'PA', 'languages' => ['es', 'en'], 'topics' => ['immigration', 'visa'], 'authority_score' => 95],
            ['domain' => 'mfa.gov.bz', 'name' => 'Belize Foreign Ministry', 'source_type' => 'government', 'country_code' => 'BZ', 'languages' => ['en'], 'topics' => ['visa', 'embassy'], 'authority_score' => 90],
        ];
    }
}
