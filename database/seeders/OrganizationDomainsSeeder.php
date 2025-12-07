<?php

namespace Database\Seeders;

use App\Models\AuthorityDomain;
use Illuminate\Database\Seeder;

class OrganizationDomainsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding organization domains...');

        $domains = $this->getOrganizationDomains();
        $created = 0;
        $updated = 0;

        foreach ($domains as $domain) {
            $domain['is_active'] = true;
            $domain['auto_discovered'] = false;
            $domain['source_type'] = 'organization';
            
            $existing = AuthorityDomain::where('domain', $domain['domain'])->first();

            if ($existing) {
                $existing->update($domain);
                $updated++;
            } else {
                AuthorityDomain::create($domain);
                $created++;
            }
        }

        $this->command->info("Organization domains: {$created} created, {$updated} updated");
        $this->command->info("Total: " . count($domains) . " organization domains");
    }

    /**
     * Liste complète des domaines d'organisations internationales
     */
    protected function getOrganizationDomains(): array
    {
        return array_merge(
            $this->getUnitedNationsOrganizations(),
            $this->getFinancialOrganizations(),
            $this->getRegionalOrganizations(),
            $this->getHumanitarianOrganizations(),
            $this->getHealthOrganizations(),
            $this->getLaborOrganizations(),
            $this->getEducationOrganizations(),
            $this->getEnvironmentOrganizations(),
            $this->getTradeOrganizations(),
            $this->getLegalOrganizations()
        );
    }

    /**
     * United Nations System
     */
    protected function getUnitedNationsOrganizations(): array
    {
        return [
            ['domain' => 'un.org', 'name' => 'United Nations', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ru', 'zh', 'ar'], 'topics' => ['general', 'peace', 'development'], 'authority_score' => 95],
            ['domain' => 'undp.org', 'name' => 'UN Development Programme', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['development', 'poverty'], 'authority_score' => 90],
            ['domain' => 'unicef.org', 'name' => 'UNICEF', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['children', 'health', 'education'], 'authority_score' => 95],
            ['domain' => 'unhcr.org', 'name' => 'UN Refugee Agency (UNHCR)', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['refugees', 'asylum', 'migration'], 'authority_score' => 95],
            ['domain' => 'unep.org', 'name' => 'UN Environment Programme', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['environment', 'climate'], 'authority_score' => 90],
            ['domain' => 'unwto.org', 'name' => 'UN World Tourism Organization', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'ru'], 'topics' => ['tourism', 'travel'], 'authority_score' => 85],
            ['domain' => 'unfpa.org', 'name' => 'UN Population Fund', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['health', 'population'], 'authority_score' => 85],
            ['domain' => 'wfp.org', 'name' => 'World Food Programme', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['food', 'humanitarian'], 'authority_score' => 90],
            ['domain' => 'iom.int', 'name' => 'International Organization for Migration', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['migration', 'refugees'], 'authority_score' => 95],
            ['domain' => 'unesco.org', 'name' => 'UNESCO', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ru', 'ar', 'zh'], 'topics' => ['education', 'culture', 'science'], 'authority_score' => 95],
            ['domain' => 'unhabitat.org', 'name' => 'UN-Habitat', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['housing', 'urban'], 'authority_score' => 85],
            ['domain' => 'unido.org', 'name' => 'UN Industrial Development', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['industry', 'development'], 'authority_score' => 85],
            ['domain' => 'unodc.org', 'name' => 'UN Office on Drugs and Crime', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'ru'], 'topics' => ['crime', 'drugs', 'legal'], 'authority_score' => 90],
            ['domain' => 'ohchr.org', 'name' => 'UN Human Rights', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'ru', 'zh'], 'topics' => ['human_rights', 'legal'], 'authority_score' => 95],
            ['domain' => 'unctad.org', 'name' => 'UN Trade and Development', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['trade', 'development'], 'authority_score' => 85],
        ];
    }

    /**
     * Financial Organizations
     */
    protected function getFinancialOrganizations(): array
    {
        return [
            ['domain' => 'worldbank.org', 'name' => 'World Bank', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['finance', 'development', 'economy'], 'authority_score' => 95],
            ['domain' => 'imf.org', 'name' => 'International Monetary Fund', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['finance', 'economy', 'tax'], 'authority_score' => 95],
            ['domain' => 'bis.org', 'name' => 'Bank for International Settlements', 'country_code' => null, 'languages' => ['en', 'fr', 'de', 'it', 'es'], 'topics' => ['banking', 'finance'], 'authority_score' => 90],
            ['domain' => 'adb.org', 'name' => 'Asian Development Bank', 'country_code' => null, 'languages' => ['en'], 'topics' => ['finance', 'development', 'asia'], 'authority_score' => 90],
            ['domain' => 'afdb.org', 'name' => 'African Development Bank', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['finance', 'development', 'africa'], 'authority_score' => 90],
            ['domain' => 'iadb.org', 'name' => 'Inter-American Development Bank', 'country_code' => null, 'languages' => ['en', 'es', 'pt', 'fr'], 'topics' => ['finance', 'development', 'americas'], 'authority_score' => 90],
            ['domain' => 'ebrd.com', 'name' => 'European Bank for Reconstruction', 'country_code' => null, 'languages' => ['en', 'fr', 'de', 'ru'], 'topics' => ['finance', 'development', 'europe'], 'authority_score' => 85],
            ['domain' => 'eib.org', 'name' => 'European Investment Bank', 'country_code' => null, 'languages' => ['en', 'fr', 'de'], 'topics' => ['finance', 'investment', 'europe'], 'authority_score' => 90],
            ['domain' => 'oecd.org', 'name' => 'OECD', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['economy', 'tax', 'development', 'education'], 'authority_score' => 95],
            ['domain' => 'fatf-gafi.org', 'name' => 'Financial Action Task Force', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['finance', 'crime', 'legal'], 'authority_score' => 90],
            ['domain' => 'ifc.org', 'name' => 'International Finance Corporation', 'country_code' => null, 'languages' => ['en'], 'topics' => ['finance', 'investment', 'development'], 'authority_score' => 85],
            ['domain' => 'isdb.org', 'name' => 'Islamic Development Bank', 'country_code' => null, 'languages' => ['en', 'ar', 'fr'], 'topics' => ['finance', 'development', 'islamic'], 'authority_score' => 85],
        ];
    }

    /**
     * Regional Organizations
     */
    protected function getRegionalOrganizations(): array
    {
        return [
            // Europe
            ['domain' => 'europa.eu', 'name' => 'European Union', 'country_code' => null, 'languages' => ['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'pl'], 'topics' => ['general', 'visa', 'immigration', 'economy', 'legal'], 'authority_score' => 95],
            ['domain' => 'ec.europa.eu', 'name' => 'European Commission', 'country_code' => null, 'languages' => ['en', 'fr', 'de'], 'topics' => ['general', 'visa', 'immigration', 'economy'], 'authority_score' => 95],
            ['domain' => 'europarl.europa.eu', 'name' => 'European Parliament', 'country_code' => null, 'languages' => ['en', 'fr', 'de'], 'topics' => ['politics', 'legal'], 'authority_score' => 90],
            ['domain' => 'coe.int', 'name' => 'Council of Europe', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['human_rights', 'legal', 'democracy'], 'authority_score' => 95],
            ['domain' => 'echr.coe.int', 'name' => 'European Court of Human Rights', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['human_rights', 'legal'], 'authority_score' => 95],
            ['domain' => 'osce.org', 'name' => 'OSCE', 'country_code' => null, 'languages' => ['en', 'fr', 'de', 'ru'], 'topics' => ['security', 'democracy'], 'authority_score' => 90],
            ['domain' => 'efta.int', 'name' => 'EFTA', 'country_code' => null, 'languages' => ['en'], 'topics' => ['trade', 'economy'], 'authority_score' => 85],
            ['domain' => 'schengenvisainfo.com', 'name' => 'Schengen Visa Info', 'country_code' => null, 'languages' => ['en'], 'topics' => ['visa', 'travel'], 'authority_score' => 80],
            
            // Americas
            ['domain' => 'oas.org', 'name' => 'Organization of American States', 'country_code' => null, 'languages' => ['en', 'es', 'pt', 'fr'], 'topics' => ['general', 'democracy', 'legal'], 'authority_score' => 90],
            ['domain' => 'mercosur.int', 'name' => 'Mercosur', 'country_code' => null, 'languages' => ['es', 'pt'], 'topics' => ['trade', 'economy'], 'authority_score' => 85],
            ['domain' => 'comunidadandina.org', 'name' => 'Andean Community', 'country_code' => null, 'languages' => ['es'], 'topics' => ['trade', 'economy'], 'authority_score' => 80],
            ['domain' => 'caricom.org', 'name' => 'CARICOM', 'country_code' => null, 'languages' => ['en'], 'topics' => ['trade', 'economy', 'caribbean'], 'authority_score' => 80],
            
            // Asia-Pacific
            ['domain' => 'asean.org', 'name' => 'ASEAN', 'country_code' => null, 'languages' => ['en'], 'topics' => ['trade', 'economy', 'asia'], 'authority_score' => 90],
            ['domain' => 'apec.org', 'name' => 'APEC', 'country_code' => null, 'languages' => ['en'], 'topics' => ['trade', 'economy', 'asia'], 'authority_score' => 85],
            ['domain' => 'saarc-sec.org', 'name' => 'SAARC', 'country_code' => null, 'languages' => ['en'], 'topics' => ['cooperation', 'asia'], 'authority_score' => 80],
            ['domain' => 'pif.org.nz', 'name' => 'Pacific Islands Forum', 'country_code' => null, 'languages' => ['en'], 'topics' => ['cooperation', 'pacific'], 'authority_score' => 80],
            
            // Africa
            ['domain' => 'au.int', 'name' => 'African Union', 'country_code' => null, 'languages' => ['en', 'fr', 'ar', 'pt'], 'topics' => ['general', 'development', 'africa'], 'authority_score' => 90],
            ['domain' => 'ecowas.int', 'name' => 'ECOWAS', 'country_code' => null, 'languages' => ['en', 'fr', 'pt'], 'topics' => ['trade', 'economy', 'west_africa'], 'authority_score' => 85],
            ['domain' => 'sadc.int', 'name' => 'SADC', 'country_code' => null, 'languages' => ['en', 'fr', 'pt'], 'topics' => ['trade', 'economy', 'southern_africa'], 'authority_score' => 85],
            ['domain' => 'eac.int', 'name' => 'East African Community', 'country_code' => null, 'languages' => ['en', 'sw', 'fr'], 'topics' => ['trade', 'economy', 'east_africa'], 'authority_score' => 85],
            ['domain' => 'comesa.int', 'name' => 'COMESA', 'country_code' => null, 'languages' => ['en', 'fr', 'ar'], 'topics' => ['trade', 'economy', 'africa'], 'authority_score' => 80],
            
            // Middle East
            ['domain' => 'gcc-sg.org', 'name' => 'Gulf Cooperation Council', 'country_code' => null, 'languages' => ['ar', 'en'], 'topics' => ['cooperation', 'economy', 'gulf'], 'authority_score' => 85],
            ['domain' => 'arableague.org', 'name' => 'Arab League', 'country_code' => null, 'languages' => ['ar', 'en'], 'topics' => ['cooperation', 'arab'], 'authority_score' => 85],
        ];
    }

    /**
     * Humanitarian Organizations
     */
    protected function getHumanitarianOrganizations(): array
    {
        return [
            ['domain' => 'icrc.org', 'name' => 'International Committee of the Red Cross', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['humanitarian', 'conflict', 'health'], 'authority_score' => 95],
            ['domain' => 'ifrc.org', 'name' => 'International Federation Red Cross', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['humanitarian', 'disaster', 'health'], 'authority_score' => 90],
            ['domain' => 'msf.org', 'name' => 'Médecins Sans Frontières', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['health', 'humanitarian'], 'authority_score' => 95],
            ['domain' => 'doctorswithoutborders.org', 'name' => 'Doctors Without Borders (US)', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health', 'humanitarian'], 'authority_score' => 90],
            ['domain' => 'amnesty.org', 'name' => 'Amnesty International', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['human_rights', 'legal'], 'authority_score' => 95],
            ['domain' => 'hrw.org', 'name' => 'Human Rights Watch', 'country_code' => null, 'languages' => ['en', 'fr', 'ar', 'zh', 'ru'], 'topics' => ['human_rights', 'legal'], 'authority_score' => 95],
            ['domain' => 'oxfam.org', 'name' => 'Oxfam International', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['poverty', 'humanitarian', 'development'], 'authority_score' => 90],
            ['domain' => 'savethechildren.org', 'name' => 'Save the Children', 'country_code' => null, 'languages' => ['en'], 'topics' => ['children', 'humanitarian', 'education'], 'authority_score' => 90],
            ['domain' => 'care.org', 'name' => 'CARE International', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['humanitarian', 'poverty', 'women'], 'authority_score' => 85],
            ['domain' => 'rescue.org', 'name' => 'International Rescue Committee', 'country_code' => null, 'languages' => ['en'], 'topics' => ['refugees', 'humanitarian'], 'authority_score' => 90],
            ['domain' => 'mercycorps.org', 'name' => 'Mercy Corps', 'country_code' => null, 'languages' => ['en'], 'topics' => ['humanitarian', 'development'], 'authority_score' => 85],
            ['domain' => 'actionagainsthunger.org', 'name' => 'Action Against Hunger', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['hunger', 'humanitarian'], 'authority_score' => 85],
            ['domain' => 'plan-international.org', 'name' => 'Plan International', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'de'], 'topics' => ['children', 'education', 'development'], 'authority_score' => 85],
            ['domain' => 'worldvision.org', 'name' => 'World Vision', 'country_code' => null, 'languages' => ['en'], 'topics' => ['children', 'humanitarian', 'development'], 'authority_score' => 85],
            ['domain' => 'refugeesinternational.org', 'name' => 'Refugees International', 'country_code' => null, 'languages' => ['en'], 'topics' => ['refugees', 'advocacy'], 'authority_score' => 80],
        ];
    }

    /**
     * Health Organizations
     */
    protected function getHealthOrganizations(): array
    {
        return [
            ['domain' => 'who.int', 'name' => 'World Health Organization', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['health', 'medical'], 'authority_score' => 95],
            ['domain' => 'cdc.gov', 'name' => 'US CDC', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['health', 'medical', 'travel'], 'authority_score' => 95],
            ['domain' => 'ecdc.europa.eu', 'name' => 'European CDC', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health', 'medical', 'europe'], 'authority_score' => 90],
            ['domain' => 'gavi.org', 'name' => 'Gavi Vaccine Alliance', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['health', 'vaccines'], 'authority_score' => 90],
            ['domain' => 'theglobalfund.org', 'name' => 'The Global Fund', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['health', 'aids', 'malaria'], 'authority_score' => 90],
            ['domain' => 'unaids.org', 'name' => 'UNAIDS', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'ru'], 'topics' => ['health', 'aids'], 'authority_score' => 90],
            ['domain' => 'ema.europa.eu', 'name' => 'European Medicines Agency', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health', 'medical', 'drugs'], 'authority_score' => 95],
            ['domain' => 'fda.gov', 'name' => 'US FDA', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['health', 'medical', 'drugs', 'food'], 'authority_score' => 95],
            ['domain' => 'nih.gov', 'name' => 'US National Institutes of Health', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['health', 'medical', 'research'], 'authority_score' => 95],
            ['domain' => 'mayoclinic.org', 'name' => 'Mayo Clinic', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['health', 'medical'], 'authority_score' => 90],
            ['domain' => 'webmd.com', 'name' => 'WebMD', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['health', 'medical'], 'authority_score' => 80],
        ];
    }

    /**
     * Labor Organizations
     */
    protected function getLaborOrganizations(): array
    {
        return [
            ['domain' => 'ilo.org', 'name' => 'International Labour Organization', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['work', 'labor', 'employment'], 'authority_score' => 95],
            ['domain' => 'ituc-csi.org', 'name' => 'International Trade Union Confederation', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'de'], 'topics' => ['work', 'labor', 'unions'], 'authority_score' => 85],
            ['domain' => 'dol.gov', 'name' => 'US Department of Labor', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['work', 'labor', 'employment'], 'authority_score' => 95],
            ['domain' => 'etuc.org', 'name' => 'European Trade Union Confederation', 'country_code' => null, 'languages' => ['en', 'fr', 'de'], 'topics' => ['work', 'labor', 'europe'], 'authority_score' => 85],
            ['domain' => 'oecd.org', 'name' => 'OECD Employment', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['work', 'employment', 'statistics'], 'authority_score' => 90],
        ];
    }

    /**
     * Education Organizations
     */
    protected function getEducationOrganizations(): array
    {
        return [
            ['domain' => 'unesco.org', 'name' => 'UNESCO Education', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['education', 'culture'], 'authority_score' => 95],
            ['domain' => 'wes.org', 'name' => 'World Education Services', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'zh', 'ar'], 'topics' => ['education', 'credentials', 'immigration'], 'authority_score' => 90],
            ['domain' => 'enic-naric.net', 'name' => 'ENIC-NARIC', 'country_code' => null, 'languages' => ['en'], 'topics' => ['education', 'credentials', 'europe'], 'authority_score' => 90],
            ['domain' => 'fulbright.org', 'name' => 'Fulbright Program', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['education', 'scholarships'], 'authority_score' => 90],
            ['domain' => 'britishcouncil.org', 'name' => 'British Council', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['education', 'language', 'culture'], 'authority_score' => 90],
            ['domain' => 'goethe.de', 'name' => 'Goethe-Institut', 'country_code' => 'DE', 'languages' => ['de', 'en'], 'topics' => ['education', 'language', 'culture'], 'authority_score' => 90],
            ['domain' => 'institutfrancais.com', 'name' => 'Institut Français', 'country_code' => 'FR', 'languages' => ['fr', 'en'], 'topics' => ['education', 'language', 'culture'], 'authority_score' => 85],
            ['domain' => 'cervantes.es', 'name' => 'Instituto Cervantes', 'country_code' => 'ES', 'languages' => ['es', 'en'], 'topics' => ['education', 'language', 'culture'], 'authority_score' => 85],
            ['domain' => 'daad.de', 'name' => 'DAAD', 'country_code' => 'DE', 'languages' => ['de', 'en'], 'topics' => ['education', 'scholarships', 'study_abroad'], 'authority_score' => 90],
            ['domain' => 'campusfrance.org', 'name' => 'Campus France', 'country_code' => 'FR', 'languages' => ['fr', 'en'], 'topics' => ['education', 'study_abroad'], 'authority_score' => 90],
            ['domain' => 'studyinaustralia.gov.au', 'name' => 'Study in Australia', 'country_code' => 'AU', 'languages' => ['en'], 'topics' => ['education', 'study_abroad'], 'authority_score' => 90],
            ['domain' => 'studyincanada.ca', 'name' => 'Study in Canada', 'country_code' => 'CA', 'languages' => ['en', 'fr'], 'topics' => ['education', 'study_abroad'], 'authority_score' => 85],
            ['domain' => 'educationusa.state.gov', 'name' => 'EducationUSA', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['education', 'study_abroad'], 'authority_score' => 90],
        ];
    }

    /**
     * Environment Organizations
     */
    protected function getEnvironmentOrganizations(): array
    {
        return [
            ['domain' => 'unep.org', 'name' => 'UN Environment', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['environment', 'climate'], 'authority_score' => 95],
            ['domain' => 'ipcc.ch', 'name' => 'IPCC', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['climate', 'environment'], 'authority_score' => 95],
            ['domain' => 'unfccc.int', 'name' => 'UN Climate Change', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['climate', 'environment'], 'authority_score' => 90],
            ['domain' => 'iucn.org', 'name' => 'IUCN', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['conservation', 'environment'], 'authority_score' => 90],
            ['domain' => 'wwf.org', 'name' => 'WWF', 'country_code' => null, 'languages' => ['en'], 'topics' => ['conservation', 'environment'], 'authority_score' => 90],
            ['domain' => 'greenpeace.org', 'name' => 'Greenpeace', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'de'], 'topics' => ['environment', 'climate'], 'authority_score' => 85],
            ['domain' => 'worldwildlife.org', 'name' => 'WWF (US)', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['conservation', 'environment'], 'authority_score' => 85],
            ['domain' => 'epa.gov', 'name' => 'US EPA', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['environment', 'regulation'], 'authority_score' => 95],
            ['domain' => 'eea.europa.eu', 'name' => 'European Environment Agency', 'country_code' => null, 'languages' => ['en'], 'topics' => ['environment', 'europe'], 'authority_score' => 90],
        ];
    }

    /**
     * Trade Organizations
     */
    protected function getTradeOrganizations(): array
    {
        return [
            ['domain' => 'wto.org', 'name' => 'World Trade Organization', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['trade', 'economy'], 'authority_score' => 95],
            ['domain' => 'intracen.org', 'name' => 'International Trade Centre', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['trade', 'export'], 'authority_score' => 85],
            ['domain' => 'iccwbo.org', 'name' => 'International Chamber of Commerce', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['trade', 'business'], 'authority_score' => 90],
            ['domain' => 'wipo.int', 'name' => 'World Intellectual Property Organization', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['intellectual_property', 'legal'], 'authority_score' => 95],
            ['domain' => 'trade.gov', 'name' => 'US International Trade Administration', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['trade', 'export'], 'authority_score' => 90],
        ];
    }

    /**
     * Legal Organizations
     */
    protected function getLegalOrganizations(): array
    {
        return [
            ['domain' => 'icj-cij.org', 'name' => 'International Court of Justice', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['legal', 'international_law'], 'authority_score' => 95],
            ['domain' => 'icc-cpi.int', 'name' => 'International Criminal Court', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['legal', 'criminal_law'], 'authority_score' => 95],
            ['domain' => 'hcch.net', 'name' => 'Hague Conference', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['legal', 'international_law', 'family'], 'authority_score' => 90],
            ['domain' => 'uncitral.org', 'name' => 'UNCITRAL', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['legal', 'trade_law'], 'authority_score' => 90],
            ['domain' => 'unidroit.org', 'name' => 'UNIDROIT', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['legal', 'commercial_law'], 'authority_score' => 85],
            ['domain' => 'curia.europa.eu', 'name' => 'European Court of Justice', 'country_code' => null, 'languages' => ['en', 'fr', 'de'], 'topics' => ['legal', 'eu_law'], 'authority_score' => 95],
            ['domain' => 'icsid.worldbank.org', 'name' => 'ICSID', 'country_code' => null, 'languages' => ['en', 'fr', 'es'], 'topics' => ['legal', 'investment', 'arbitration'], 'authority_score' => 90],
            ['domain' => 'pca-cpa.org', 'name' => 'Permanent Court of Arbitration', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['legal', 'arbitration'], 'authority_score' => 90],
        ];
    }
}
