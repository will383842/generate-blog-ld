<?php

namespace App\Services\Linking;

use App\Models\AuthorityDomain;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class GovernmentSiteResolver
{
    /**
     * Cache TTL en secondes (24 heures)
     */
    protected int $cacheTtl = 86400;

    /**
     * Mapping des patterns de domaines gouvernementaux par pays
     */
    protected array $governmentPatterns = [
        // Europe
        'FR' => ['gouv.fr', 'service-public.fr', 'diplomatie.gouv.fr'],
        'DE' => ['bund.de', 'bundesregierung.de', 'auswaertiges-amt.de'],
        'GB' => ['gov.uk', 'nhs.uk'],
        'ES' => ['gob.es', 'exteriores.gob.es'],
        'IT' => ['gov.it', 'esteri.it'],
        'NL' => ['rijksoverheid.nl', 'government.nl'],
        'BE' => ['belgium.be', 'diplomatie.belgium.be'],
        'CH' => ['admin.ch', 'eda.admin.ch'],
        'AT' => ['gv.at', 'bmeia.gv.at'],
        'PT' => ['gov.pt', 'portaldiplomatico.mne.gov.pt'],
        'PL' => ['gov.pl', 'msz.gov.pl'],
        'SE' => ['government.se', 'sweden.se'],
        'NO' => ['regjeringen.no', 'norway.no'],
        'DK' => ['denmark.dk', 'um.dk'],
        'FI' => ['gov.fi', 'finland.fi'],
        'IE' => ['gov.ie', 'dfa.ie'],
        'GR' => ['gov.gr', 'mfa.gr'],
        'CZ' => ['gov.cz', 'mzv.cz'],
        'RO' => ['gov.ro', 'mae.ro'],
        'HU' => ['gov.hu', 'kormany.hu'],
        
        // Amérique du Nord
        'US' => ['usa.gov', 'state.gov', 'uscis.gov', 'travel.state.gov'],
        'CA' => ['canada.ca', 'gc.ca', 'cic.gc.ca'],
        'MX' => ['gob.mx', 'sre.gob.mx'],
        
        // Amérique du Sud
        'BR' => ['gov.br', 'itamaraty.gov.br'],
        'AR' => ['argentina.gob.ar', 'cancilleria.gob.ar'],
        'CL' => ['gob.cl', 'minrel.gob.cl'],
        'CO' => ['gov.co', 'cancilleria.gov.co'],
        'PE' => ['gob.pe', 'rree.gob.pe'],
        
        // Asie
        'CN' => ['gov.cn', 'fmprc.gov.cn'],
        'JP' => ['go.jp', 'mofa.go.jp'],
        'KR' => ['go.kr', 'mofa.go.kr'],
        'IN' => ['india.gov.in', 'mea.gov.in'],
        'TH' => ['go.th', 'mfa.go.th'],
        'SG' => ['gov.sg', 'mfa.gov.sg'],
        'MY' => ['gov.my', 'kln.gov.my'],
        'ID' => ['go.id', 'kemlu.go.id'],
        'PH' => ['gov.ph', 'dfa.gov.ph'],
        'VN' => ['gov.vn', 'mofa.gov.vn'],
        'AE' => ['government.ae', 'mofa.gov.ae'],
        'SA' => ['gov.sa', 'mofa.gov.sa'],
        'IL' => ['gov.il', 'mfa.gov.il'],
        'TR' => ['gov.tr', 'mfa.gov.tr'],
        
        // Océanie
        'AU' => ['gov.au', 'dfat.gov.au', 'homeaffairs.gov.au'],
        'NZ' => ['govt.nz', 'mfat.govt.nz', 'immigration.govt.nz'],
        
        // Afrique
        'ZA' => ['gov.za', 'dirco.gov.za'],
        'EG' => ['gov.eg', 'mfa.gov.eg'],
        'MA' => ['gov.ma', 'diplomatie.ma'],
        'NG' => ['gov.ng', 'foreignaffairs.gov.ng'],
        'KE' => ['go.ke', 'mfa.go.ke'],
    ];

    /**
     * Topics par type de site gouvernemental
     */
    protected array $departmentTopics = [
        'immigration' => ['visa', 'immigration', 'residence', 'citizenship'],
        'foreign_affairs' => ['embassy', 'consulate', 'diplomatic', 'travel'],
        'tax' => ['tax', 'fiscal', 'revenue'],
        'health' => ['health', 'medical', 'healthcare'],
        'labor' => ['work', 'employment', 'labor'],
        'social' => ['social', 'benefits', 'pension'],
    ];

    /**
     * Résout le site gouvernemental principal pour un pays
     */
    public function resolveMainGovernmentSite(string $countryCode): ?string
    {
        $patterns = $this->governmentPatterns[strtoupper($countryCode)] ?? null;
        
        if (!$patterns) {
            return null;
        }

        // Retourner le premier pattern (site principal)
        return 'https://' . $patterns[0];
    }

    /**
     * Résout le site des affaires étrangères
     */
    public function resolveForeignAffairsSite(string $countryCode): ?string
    {
        $patterns = $this->governmentPatterns[strtoupper($countryCode)] ?? null;
        
        if (!$patterns || count($patterns) < 2) {
            return null;
        }

        // Le deuxième pattern est généralement le ministère des affaires étrangères
        return 'https://' . $patterns[1];
    }

    /**
     * Résout tous les sites gouvernementaux connus pour un pays
     */
    public function resolveAllGovernmentSites(string $countryCode): array
    {
        $patterns = $this->governmentPatterns[strtoupper($countryCode)] ?? [];
        
        return array_map(fn($p) => 'https://' . $p, $patterns);
    }

    /**
     * Trouve le site gouvernemental approprié pour un topic
     */
    public function resolveForTopic(string $countryCode, string $topic): ?array
    {
        $cacheKey = "gov_site_{$countryCode}_{$topic}";
        
        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($countryCode, $topic) {
            // Chercher dans la base de données
            $domain = AuthorityDomain::active()
                ->forCountry($countryCode)
                ->byType('government')
                ->byTopics([$topic])
                ->orderByAuthority()
                ->first();

            if ($domain) {
                return [
                    'url' => $domain->getFullUrl(),
                    'domain' => $domain->domain,
                    'name' => $domain->name,
                    'authority_score' => $domain->authority_score
                ];
            }

            // Fallback sur le site principal
            $mainSite = $this->resolveMainGovernmentSite($countryCode);
            if ($mainSite) {
                return [
                    'url' => $mainSite,
                    'domain' => parse_url($mainSite, PHP_URL_HOST),
                    'name' => $this->getCountryName($countryCode) . ' Government',
                    'authority_score' => 90
                ];
            }

            return null;
        });
    }

    /**
     * Résout le site d'ambassade d'un pays dans un autre
     */
    public function resolveEmbassySite(string $originCountry, string $destinationCountry): ?array
    {
        $cacheKey = "embassy_{$originCountry}_in_{$destinationCountry}";
        
        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($originCountry, $destinationCountry) {
            // Patterns d'URL d'ambassade courants
            $patterns = $this->getEmbassyUrlPatterns($originCountry, $destinationCountry);
            
            foreach ($patterns as $pattern) {
                $domain = AuthorityDomain::where('domain', 'LIKE', "%{$pattern}%")->first();
                if ($domain) {
                    return [
                        'url' => $domain->getFullUrl(),
                        'domain' => $domain->domain,
                        'name' => $domain->name,
                        'authority_score' => $domain->authority_score
                    ];
                }
            }

            return null;
        });
    }

    /**
     * Génère les patterns d'URL d'ambassade
     */
    protected function getEmbassyUrlPatterns(string $originCountry, string $destCountry): array
    {
        $originName = strtolower($this->getCountryName($originCountry));
        $destName = strtolower($this->getCountryName($destCountry));
        $destCode = strtolower($destCountry);
        
        return [
            "{$destCode}.embassy.{$originName}",
            "embassy-{$originName}.{$destName}",
            "{$originName}embassy.{$destName}",
            "ambafrance-{$destCode}",
            "{$destCode}.diplo.de",
        ];
    }

    /**
     * Vérifie si un domaine est gouvernemental
     */
    public function isGovernmentDomain(string $domain): bool
    {
        // Patterns génériques
        $govPatterns = [
            '/\.gov(\.[a-z]{2})?$/',
            '/\.gouv\.[a-z]{2}$/',
            '/\.gob(\.[a-z]{2})?$/',
            '/\.go\.[a-z]{2}$/',
            '/\.gc\.ca$/',
            '/\.govt\.nz$/',
            '/\.gv\.at$/',
        ];

        foreach ($govPatterns as $pattern) {
            if (preg_match($pattern, $domain)) {
                return true;
            }
        }

        // Vérifier les patterns spécifiques
        foreach ($this->governmentPatterns as $patterns) {
            foreach ($patterns as $govDomain) {
                if (str_ends_with($domain, $govDomain)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Identifie le pays d'un site gouvernemental
     */
    public function identifyCountryFromGovSite(string $domain): ?string
    {
        foreach ($this->governmentPatterns as $country => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains($domain, $pattern)) {
                    return $country;
                }
            }
        }

        // Essayer d'extraire depuis le TLD
        if (preg_match('/\.gov\.([a-z]{2})$/', $domain, $matches)) {
            return strtoupper($matches[1]);
        }

        return null;
    }

    /**
     * Récupère tous les pays avec sites gouvernementaux connus
     */
    public function getCountriesWithKnownSites(): array
    {
        return array_keys($this->governmentPatterns);
    }

    /**
     * Synchronise les sites gouvernementaux vers la base de données
     */
    public function syncToDatabase(): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($this->governmentPatterns as $countryCode => $patterns) {
            foreach ($patterns as $index => $pattern) {
                try {
                    $existing = AuthorityDomain::where('domain', $pattern)->first();
                    
                    $data = [
                        'name' => $this->generateSiteName($pattern, $countryCode),
                        'source_type' => 'government',
                        'country_code' => $countryCode,
                        'languages' => $this->getCountryLanguages($countryCode),
                        'topics' => $this->detectTopicsFromDomain($pattern),
                        'authority_score' => $index === 0 ? 95 : 90,
                        'is_active' => true,
                    ];

                    if ($existing) {
                        $existing->update($data);
                        $stats['updated']++;
                    } else {
                        AuthorityDomain::create(array_merge(['domain' => $pattern], $data));
                        $stats['created']++;
                    }
                } catch (\Exception $e) {
                    $stats['errors'][] = "{$pattern}: {$e->getMessage()}";
                }
            }
        }

        return $stats;
    }

    /**
     * Génère un nom lisible pour un site gouvernemental
     */
    protected function generateSiteName(string $domain, string $countryCode): string
    {
        $countryName = $this->getCountryName($countryCode);
        
        // Détecter le type de ministère
        if (str_contains($domain, 'foreign') || str_contains($domain, 'diplo') || 
            str_contains($domain, 'mfa') || str_contains($domain, 'mae') ||
            str_contains($domain, 'exteriores') || str_contains($domain, 'mofa')) {
            return "{$countryName} Ministry of Foreign Affairs";
        }
        
        if (str_contains($domain, 'immigration') || str_contains($domain, 'cic') ||
            str_contains($domain, 'uscis') || str_contains($domain, 'homeaffairs')) {
            return "{$countryName} Immigration";
        }

        if (str_contains($domain, 'travel')) {
            return "{$countryName} Travel Advisory";
        }

        return "{$countryName} Government";
    }

    /**
     * Détecte les topics depuis le domaine
     */
    protected function detectTopicsFromDomain(string $domain): array
    {
        $topics = [];
        
        $keywords = [
            'immigration' => ['immigration', 'visa', 'cic', 'uscis', 'homeaffairs'],
            'foreign_affairs' => ['foreign', 'diplo', 'mfa', 'mae', 'mofa', 'exteriores', 'travel'],
            'tax' => ['tax', 'revenue', 'fiscal', 'irs', 'impots'],
            'health' => ['health', 'nhs', 'sante'],
        ];

        foreach ($keywords as $topic => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains(strtolower($domain), $pattern)) {
                    $topics[] = $topic;
                    break;
                }
            }
        }

        // Si pas de topic spécifique, c'est un site général
        if (empty($topics)) {
            $topics = ['general', 'visa', 'immigration'];
        }

        return array_unique($topics);
    }

    /**
     * Récupère le nom du pays
     */
    protected function getCountryName(string $code): string
    {
        $countries = [
            'FR' => 'France', 'DE' => 'Germany', 'GB' => 'United Kingdom', 
            'ES' => 'Spain', 'IT' => 'Italy', 'NL' => 'Netherlands',
            'BE' => 'Belgium', 'CH' => 'Switzerland', 'AT' => 'Austria',
            'PT' => 'Portugal', 'PL' => 'Poland', 'SE' => 'Sweden',
            'NO' => 'Norway', 'DK' => 'Denmark', 'FI' => 'Finland',
            'IE' => 'Ireland', 'GR' => 'Greece', 'CZ' => 'Czech Republic',
            'RO' => 'Romania', 'HU' => 'Hungary',
            'US' => 'United States', 'CA' => 'Canada', 'MX' => 'Mexico',
            'BR' => 'Brazil', 'AR' => 'Argentina', 'CL' => 'Chile',
            'CO' => 'Colombia', 'PE' => 'Peru',
            'CN' => 'China', 'JP' => 'Japan', 'KR' => 'South Korea',
            'IN' => 'India', 'TH' => 'Thailand', 'SG' => 'Singapore',
            'MY' => 'Malaysia', 'ID' => 'Indonesia', 'PH' => 'Philippines',
            'VN' => 'Vietnam', 'AE' => 'UAE', 'SA' => 'Saudi Arabia',
            'IL' => 'Israel', 'TR' => 'Turkey',
            'AU' => 'Australia', 'NZ' => 'New Zealand',
            'ZA' => 'South Africa', 'EG' => 'Egypt', 'MA' => 'Morocco',
            'NG' => 'Nigeria', 'KE' => 'Kenya',
        ];

        return $countries[$code] ?? $code;
    }

    /**
     * Récupère les langues du pays
     */
    protected function getCountryLanguages(string $code): array
    {
        $languages = [
            'FR' => ['fr'], 'DE' => ['de'], 'GB' => ['en'], 'ES' => ['es'],
            'IT' => ['it'], 'NL' => ['nl'], 'BE' => ['fr', 'nl', 'de'],
            'CH' => ['de', 'fr', 'it'], 'AT' => ['de'], 'PT' => ['pt'],
            'US' => ['en'], 'CA' => ['en', 'fr'], 'MX' => ['es'],
            'BR' => ['pt'], 'AR' => ['es'],
            'CN' => ['zh'], 'JP' => ['ja'], 'KR' => ['ko'], 'IN' => ['en', 'hi'],
            'TH' => ['th', 'en'], 'SG' => ['en', 'zh'], 'AE' => ['ar', 'en'],
            'SA' => ['ar'], 'AU' => ['en'], 'NZ' => ['en'],
        ];

        return $languages[$code] ?? ['en'];
    }

    /**
     * Alias pour getCountriesWithKnownSites (compatibilité)
     */
    public function getConfiguredCountries(): array
    {
        return $this->getCountriesWithKnownSites();
    }

    /**
     * Résout tous les sites gouvernementaux avec métadonnées complètes
     * Format attendu par DiscoverAuthorityDomains
     */
    public function resolveAll(string $countryCode): array
    {
        $patterns = $this->governmentPatterns[strtoupper($countryCode)] ?? [];
        $countryName = $this->getCountryName($countryCode);
        $result = [];

        foreach ($patterns as $index => $pattern) {
            $theme = $this->detectThemeFromDomain($pattern);
            $name = $this->generateSiteName($pattern, $countryCode);
            
            $result[$theme . '_' . $index] = [
                'url' => 'https://' . $pattern,
                'name' => $name,
                'domain' => $pattern,
                'authority_score' => $index === 0 ? 95 : 90,
            ];
        }

        return $result;
    }

    /**
     * Détecte le thème depuis un domaine
     */
    protected function detectThemeFromDomain(string $domain): string
    {
        $themes = [
            'immigration' => ['immigration', 'visa', 'cic', 'uscis', 'homeaffairs'],
            'foreign_affairs' => ['foreign', 'diplo', 'mfa', 'mae', 'mofa', 'exteriores', 'travel', 'state'],
            'tax' => ['tax', 'revenue', 'fiscal', 'irs', 'impots'],
            'health' => ['health', 'nhs', 'sante'],
        ];

        $domainLower = strtolower($domain);
        foreach ($themes as $theme => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($domainLower, $keyword)) {
                    return $theme;
                }
            }
        }

        return 'general';
    }
}
