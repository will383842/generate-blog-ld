<?php

namespace Database\Seeders;

use App\Models\AuthorityDomain;
use Illuminate\Database\Seeder;

class ReferenceDomainsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding reference domains (encyclopedias, educational sites)...');

        $domains = $this->getReferenceDomains();
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

        $this->command->info("Reference domains: {$created} created, {$updated} updated. Total: " . count($domains));
    }

    protected function getReferenceDomains(): array
    {
        return array_merge(
            $this->getEncyclopedias(),
            $this->getEducationalSites(),
            $this->getResearchDatabases(),
            $this->getLegalReferences(),
            $this->getFinancialReferences(),
            $this->getHealthReferences(),
            $this->getTravelReferences(),
            $this->getNewsSources()
        );
    }

    protected function getEncyclopedias(): array
    {
        return [
            // Wikipedia in multiple languages
            ['domain' => 'en.wikipedia.org', 'name' => 'Wikipedia English', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'fr.wikipedia.org', 'name' => 'Wikipedia Français', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['fr'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'de.wikipedia.org', 'name' => 'Wikipedia Deutsch', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['de'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'es.wikipedia.org', 'name' => 'Wikipedia Español', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['es'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'pt.wikipedia.org', 'name' => 'Wikipedia Português', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['pt'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'ru.wikipedia.org', 'name' => 'Wikipedia Русский', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['ru'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'zh.wikipedia.org', 'name' => 'Wikipedia 中文', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['zh'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'ar.wikipedia.org', 'name' => 'Wikipedia العربية', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['ar'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'hi.wikipedia.org', 'name' => 'Wikipedia हिन्दी', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['hi'], 'topics' => ['general'], 'authority_score' => 85],
            ['domain' => 'ja.wikipedia.org', 'name' => 'Wikipedia 日本語', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['ja'], 'topics' => ['general'], 'authority_score' => 85],
            // Other encyclopedias
            ['domain' => 'britannica.com', 'name' => 'Encyclopedia Britannica', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['general'], 'authority_score' => 90],
            ['domain' => 'larousse.fr', 'name' => 'Encyclopédie Larousse', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['fr'], 'topics' => ['general'], 'authority_score' => 88],
            ['domain' => 'universalis.fr', 'name' => 'Encyclopædia Universalis', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['fr'], 'topics' => ['general'], 'authority_score' => 88],
            ['domain' => 'brockhaus.de', 'name' => 'Brockhaus Enzyklopädie', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['de'], 'topics' => ['general'], 'authority_score' => 88],
            ['domain' => 'treccani.it', 'name' => 'Enciclopedia Treccani', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['it'], 'topics' => ['general'], 'authority_score' => 88],
        ];
    }

    protected function getEducationalSites(): array
    {
        return [
            // Universities and educational institutions
            ['domain' => 'harvard.edu', 'name' => 'Harvard University', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['education', 'research'], 'authority_score' => 95],
            ['domain' => 'mit.edu', 'name' => 'MIT', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['education', 'research', 'technology'], 'authority_score' => 95],
            ['domain' => 'stanford.edu', 'name' => 'Stanford University', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['education', 'research'], 'authority_score' => 95],
            ['domain' => 'ox.ac.uk', 'name' => 'Oxford University', 'source_type' => 'reference', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['education', 'research'], 'authority_score' => 95],
            ['domain' => 'cam.ac.uk', 'name' => 'Cambridge University', 'source_type' => 'reference', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['education', 'research'], 'authority_score' => 95],
            ['domain' => 'sorbonne-universite.fr', 'name' => 'Sorbonne Université', 'source_type' => 'reference', 'country_code' => 'FR', 'languages' => ['fr', 'en'], 'topics' => ['education', 'research'], 'authority_score' => 92],
            ['domain' => 'sciencespo.fr', 'name' => 'Sciences Po', 'source_type' => 'reference', 'country_code' => 'FR', 'languages' => ['fr', 'en'], 'topics' => ['education', 'politics'], 'authority_score' => 90],
            ['domain' => 'ethz.ch', 'name' => 'ETH Zürich', 'source_type' => 'reference', 'country_code' => 'CH', 'languages' => ['de', 'en'], 'topics' => ['education', 'technology'], 'authority_score' => 93],
            ['domain' => 'tum.de', 'name' => 'TU München', 'source_type' => 'reference', 'country_code' => 'DE', 'languages' => ['de', 'en'], 'topics' => ['education', 'technology'], 'authority_score' => 92],
            ['domain' => 'usp.br', 'name' => 'Universidade de São Paulo', 'source_type' => 'reference', 'country_code' => 'BR', 'languages' => ['pt'], 'topics' => ['education', 'research'], 'authority_score' => 90],
            // Educational platforms
            ['domain' => 'coursera.org', 'name' => 'Coursera', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'zh'], 'topics' => ['education'], 'authority_score' => 85],
            ['domain' => 'edx.org', 'name' => 'edX', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['education'], 'authority_score' => 85],
            ['domain' => 'khanacademy.org', 'name' => 'Khan Academy', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'es', 'fr', 'pt', 'hi'], 'topics' => ['education'], 'authority_score' => 85],
        ];
    }

    protected function getResearchDatabases(): array
    {
        return [
            ['domain' => 'scholar.google.com', 'name' => 'Google Scholar', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research'], 'authority_score' => 90],
            ['domain' => 'ncbi.nlm.nih.gov', 'name' => 'PubMed/NCBI', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['health', 'research'], 'authority_score' => 95],
            ['domain' => 'researchgate.net', 'name' => 'ResearchGate', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research'], 'authority_score' => 85],
            ['domain' => 'academia.edu', 'name' => 'Academia.edu', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research'], 'authority_score' => 80],
            ['domain' => 'jstor.org', 'name' => 'JSTOR', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research', 'history'], 'authority_score' => 90],
            ['domain' => 'sciencedirect.com', 'name' => 'ScienceDirect', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research', 'science'], 'authority_score' => 90],
            ['domain' => 'nature.com', 'name' => 'Nature', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research', 'science'], 'authority_score' => 95],
            ['domain' => 'science.org', 'name' => 'Science Magazine', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['research', 'science'], 'authority_score' => 95],
            ['domain' => 'ieee.org', 'name' => 'IEEE', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['technology', 'research'], 'authority_score' => 92],
            ['domain' => 'acm.org', 'name' => 'ACM Digital Library', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['technology', 'research'], 'authority_score' => 90],
        ];
    }

    protected function getLegalReferences(): array
    {
        return [
            ['domain' => 'legifrance.gouv.fr', 'name' => 'Légifrance', 'source_type' => 'reference', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'gesetze-im-internet.de', 'name' => 'Gesetze im Internet', 'source_type' => 'reference', 'country_code' => 'DE', 'languages' => ['de'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'legislation.gov.uk', 'name' => 'UK Legislation', 'source_type' => 'reference', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'law.cornell.edu', 'name' => 'Cornell Law School', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['legal'], 'authority_score' => 92],
            ['domain' => 'europa.eu', 'name' => 'Europa EU', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'de', 'es', 'it', 'pt'], 'topics' => ['legal', 'immigration'], 'authority_score' => 95],
            ['domain' => 'eur-lex.europa.eu', 'name' => 'EUR-Lex', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'de', 'es'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'curia.europa.eu', 'name' => 'Court of Justice EU', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'de'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'boe.es', 'name' => 'Boletín Oficial del Estado', 'source_type' => 'reference', 'country_code' => 'ES', 'languages' => ['es'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'gazzettaufficiale.it', 'name' => 'Gazzetta Ufficiale', 'source_type' => 'reference', 'country_code' => 'IT', 'languages' => ['it'], 'topics' => ['legal'], 'authority_score' => 95],
            ['domain' => 'planalto.gov.br', 'name' => 'Planalto Brazil', 'source_type' => 'reference', 'country_code' => 'BR', 'languages' => ['pt'], 'topics' => ['legal'], 'authority_score' => 95],
        ];
    }

    protected function getFinancialReferences(): array
    {
        return [
            ['domain' => 'imf.org', 'name' => 'IMF', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['finance', 'economy'], 'authority_score' => 95],
            ['domain' => 'worldbank.org', 'name' => 'World Bank', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh'], 'topics' => ['finance', 'economy', 'development'], 'authority_score' => 95],
            ['domain' => 'ecb.europa.eu', 'name' => 'European Central Bank', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'de', 'fr'], 'topics' => ['finance', 'economy'], 'authority_score' => 95],
            ['domain' => 'federalreserve.gov', 'name' => 'Federal Reserve', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['finance', 'economy'], 'authority_score' => 95],
            ['domain' => 'bis.org', 'name' => 'Bank for International Settlements', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['finance'], 'authority_score' => 95],
            ['domain' => 'oecd.org', 'name' => 'OECD', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr'], 'topics' => ['economy', 'policy', 'tax'], 'authority_score' => 95],
            ['domain' => 'investopedia.com', 'name' => 'Investopedia', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['finance'], 'authority_score' => 80],
            ['domain' => 'xe.com', 'name' => 'XE Currency', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['finance', 'currency'], 'authority_score' => 85],
            ['domain' => 'oanda.com', 'name' => 'OANDA', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['finance', 'currency'], 'authority_score' => 85],
            ['domain' => 'tradingeconomics.com', 'name' => 'Trading Economics', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['economy', 'statistics'], 'authority_score' => 85],
        ];
    }

    protected function getHealthReferences(): array
    {
        return [
            ['domain' => 'who.int', 'name' => 'World Health Organization', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar', 'zh', 'ru'], 'topics' => ['health'], 'authority_score' => 95],
            ['domain' => 'cdc.gov', 'name' => 'CDC', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['health'], 'authority_score' => 95],
            ['domain' => 'nih.gov', 'name' => 'NIH', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['health', 'research'], 'authority_score' => 95],
            ['domain' => 'mayoclinic.org', 'name' => 'Mayo Clinic', 'source_type' => 'reference', 'country_code' => 'US', 'languages' => ['en', 'es'], 'topics' => ['health'], 'authority_score' => 92],
            ['domain' => 'webmd.com', 'name' => 'WebMD', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health'], 'authority_score' => 82],
            ['domain' => 'healthline.com', 'name' => 'Healthline', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health'], 'authority_score' => 80],
            ['domain' => 'medscape.com', 'name' => 'Medscape', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health'], 'authority_score' => 88],
            ['domain' => 'ecdc.europa.eu', 'name' => 'European CDC', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['health'], 'authority_score' => 95],
            ['domain' => 'sante.gouv.fr', 'name' => 'Santé France', 'source_type' => 'reference', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['health'], 'authority_score' => 95],
            ['domain' => 'has-sante.fr', 'name' => 'HAS France', 'source_type' => 'reference', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['health'], 'authority_score' => 95],
        ];
    }

    protected function getTravelReferences(): array
    {
        return [
            // Travel advisories
            ['domain' => 'smartraveller.gov.au', 'name' => 'Smartraveller Australia', 'source_type' => 'reference', 'country_code' => 'AU', 'languages' => ['en'], 'topics' => ['travel', 'safety'], 'authority_score' => 95],
            ['domain' => 'travel.gc.ca', 'name' => 'Travel Canada', 'source_type' => 'reference', 'country_code' => 'CA', 'languages' => ['en', 'fr'], 'topics' => ['travel', 'safety'], 'authority_score' => 95],
            ['domain' => 'safetravel.govt.nz', 'name' => 'SafeTravel NZ', 'source_type' => 'reference', 'country_code' => 'NZ', 'languages' => ['en'], 'topics' => ['travel', 'safety'], 'authority_score' => 95],
            ['domain' => 'conseils-aux-voyageurs.diplomatie.gouv.fr', 'name' => 'Conseils aux Voyageurs France', 'source_type' => 'reference', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['travel', 'safety'], 'authority_score' => 95],
            // Expat resources
            ['domain' => 'expatica.com', 'name' => 'Expatica', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['expat', 'immigration'], 'authority_score' => 80],
            ['domain' => 'internations.org', 'name' => 'InterNations', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['expat'], 'authority_score' => 78],
            ['domain' => 'expatfocus.com', 'name' => 'Expat Focus', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['expat'], 'authority_score' => 75],
            ['domain' => 'numbeo.com', 'name' => 'Numbeo', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['cost_of_living', 'expat'], 'authority_score' => 82],
            // Visa information
            ['domain' => 'schengenvisainfo.com', 'name' => 'Schengen Visa Info', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['visa', 'immigration'], 'authority_score' => 78],
            ['domain' => 'visaguide.world', 'name' => 'Visa Guide World', 'source_type' => 'reference', 'country_code' => null, 'languages' => ['en'], 'topics' => ['visa'], 'authority_score' => 75],
        ];
    }

    protected function getNewsSources(): array
    {
        return [
            // International news
            ['domain' => 'bbc.com', 'name' => 'BBC', 'source_type' => 'news', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['news'], 'authority_score' => 92],
            ['domain' => 'reuters.com', 'name' => 'Reuters', 'source_type' => 'news', 'country_code' => null, 'languages' => ['en'], 'topics' => ['news', 'finance'], 'authority_score' => 95],
            ['domain' => 'apnews.com', 'name' => 'Associated Press', 'source_type' => 'news', 'country_code' => null, 'languages' => ['en'], 'topics' => ['news'], 'authority_score' => 95],
            ['domain' => 'afp.com', 'name' => 'AFP', 'source_type' => 'news', 'country_code' => null, 'languages' => ['en', 'fr', 'es', 'ar'], 'topics' => ['news'], 'authority_score' => 95],
            // Regional news
            ['domain' => 'lemonde.fr', 'name' => 'Le Monde', 'source_type' => 'news', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['news'], 'authority_score' => 90],
            ['domain' => 'lefigaro.fr', 'name' => 'Le Figaro', 'source_type' => 'news', 'country_code' => 'FR', 'languages' => ['fr'], 'topics' => ['news'], 'authority_score' => 88],
            ['domain' => 'spiegel.de', 'name' => 'Der Spiegel', 'source_type' => 'news', 'country_code' => 'DE', 'languages' => ['de'], 'topics' => ['news'], 'authority_score' => 90],
            ['domain' => 'zeit.de', 'name' => 'Die Zeit', 'source_type' => 'news', 'country_code' => 'DE', 'languages' => ['de'], 'topics' => ['news'], 'authority_score' => 88],
            ['domain' => 'elpais.com', 'name' => 'El País', 'source_type' => 'news', 'country_code' => 'ES', 'languages' => ['es'], 'topics' => ['news'], 'authority_score' => 88],
            ['domain' => 'corriere.it', 'name' => 'Corriere della Sera', 'source_type' => 'news', 'country_code' => 'IT', 'languages' => ['it'], 'topics' => ['news'], 'authority_score' => 88],
            ['domain' => 'nytimes.com', 'name' => 'New York Times', 'source_type' => 'news', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['news'], 'authority_score' => 92],
            ['domain' => 'washingtonpost.com', 'name' => 'Washington Post', 'source_type' => 'news', 'country_code' => 'US', 'languages' => ['en'], 'topics' => ['news'], 'authority_score' => 90],
            ['domain' => 'theguardian.com', 'name' => 'The Guardian', 'source_type' => 'news', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['news'], 'authority_score' => 90],
            ['domain' => 'ft.com', 'name' => 'Financial Times', 'source_type' => 'news', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['news', 'finance'], 'authority_score' => 92],
            ['domain' => 'economist.com', 'name' => 'The Economist', 'source_type' => 'news', 'country_code' => 'GB', 'languages' => ['en'], 'topics' => ['news', 'economy'], 'authority_score' => 92],
            ['domain' => 'scmp.com', 'name' => 'South China Morning Post', 'source_type' => 'news', 'country_code' => 'HK', 'languages' => ['en', 'zh'], 'topics' => ['news'], 'authority_score' => 85],
            ['domain' => 'japantimes.co.jp', 'name' => 'Japan Times', 'source_type' => 'news', 'country_code' => 'JP', 'languages' => ['en'], 'topics' => ['news'], 'authority_score' => 85],
            ['domain' => 'aljazeera.com', 'name' => 'Al Jazeera', 'source_type' => 'news', 'country_code' => null, 'languages' => ['en', 'ar'], 'topics' => ['news'], 'authority_score' => 85],
            ['domain' => 'dw.com', 'name' => 'Deutsche Welle', 'source_type' => 'news', 'country_code' => 'DE', 'languages' => ['en', 'de', 'es', 'ar'], 'topics' => ['news'], 'authority_score' => 88],
            ['domain' => 'france24.com', 'name' => 'France 24', 'source_type' => 'news', 'country_code' => 'FR', 'languages' => ['en', 'fr', 'ar', 'es'], 'topics' => ['news'], 'authority_score' => 88],
        ];
    }
}
