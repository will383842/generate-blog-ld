<?php

namespace App\Services\Linking;

use App\Models\AuthorityDomain;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AuthorityDomainService
{
    /**
     * Trouve les domaines autorité pour un pays et des topics
     */
    public function findDomainsForCountry(string $countryCode, array $topics = []): Collection
    {
        $query = AuthorityDomain::active()
            ->forCountry($countryCode)
            ->orderByAuthority();

        if (!empty($topics)) {
            $query->byTopics($topics);
        }

        return $query->limit(10)->get();
    }

    /**
     * Trouve les domaines internationaux (sans pays spécifique)
     */
    public function findInternationalDomains(array $topics = []): Collection
    {
        $query = AuthorityDomain::active()
            ->whereNull('country_code')
            ->orderByAuthority();

        if (!empty($topics)) {
            $query->byTopics($topics);
        }

        return $query->limit(10)->get();
    }

    /**
     * Calcule/met à jour le score d'autorité d'un domaine
     */
    public function scoreAuthorityDomain(AuthorityDomain $domain): int
    {
        $baseScore = AuthorityDomain::DEFAULT_SCORES[$domain->source_type] ?? 50;
        
        // Ajustements
        $score = $baseScore;

        // Bonus pour domaines .gov
        if (preg_match('/\.(gov|gouv|gob)/', $domain->domain)) {
            $score = min(100, $score + 10);
        }

        // Bonus pour organisations internationales
        if (str_ends_with($domain->domain, '.int')) {
            $score = min(100, $score + 5);
        }

        // Mettre à jour si différent
        if ($domain->authority_score !== $score) {
            $domain->update(['authority_score' => $score]);
        }

        return $score;
    }

    /**
     * Ajoute un domaine découvert automatiquement
     */
    public function addDiscoveredDomain(string $url, array $metadata = []): ?AuthorityDomain
    {
        $domain = parse_url($url, PHP_URL_HOST);
        if (!$domain) {
            return null;
        }

        // Nettoyer le domaine
        $domain = preg_replace('/^www\./', '', $domain);

        // Vérifier si existe déjà
        $existing = AuthorityDomain::where('domain', $domain)->first();
        if ($existing) {
            return $existing;
        }

        // Déterminer le type de source
        $sourceType = $this->detectSourceType($domain);

        // Créer le domaine
        $authorityDomain = AuthorityDomain::create([
            'domain' => $domain,
            'name' => $metadata['name'] ?? $this->generateName($domain),
            'source_type' => $sourceType,
            'country_code' => $metadata['country_code'] ?? $this->detectCountry($domain),
            'languages' => $metadata['languages'] ?? $this->detectLanguages($domain),
            'topics' => $metadata['topics'] ?? [],
            'authority_score' => $metadata['authority_score'] ?? AuthorityDomain::DEFAULT_SCORES[$sourceType] ?? 50,
            'is_active' => true,
            'auto_discovered' => true,
            'notes' => $metadata['notes'] ?? 'Auto-discovered'
        ]);

        Log::info("AuthorityDomainService: Added discovered domain", [
            'domain' => $domain,
            'source_type' => $sourceType
        ]);

        return $authorityDomain;
    }

    /**
     * Vérifie qu'un domaine est accessible
     */
    public function verifyDomainActive(AuthorityDomain $domain): bool
    {
        try {
            $response = Http::timeout(10)
                ->withOptions(['verify' => false])
                ->head('https://' . $domain->domain);

            $isActive = $response->successful() || $response->status() === 403;

            if (!$isActive) {
                Log::warning("AuthorityDomainService: Domain not accessible", [
                    'domain' => $domain->domain,
                    'status' => $response->status()
                ]);
            }

            return $isActive;

        } catch (\Exception $e) {
            Log::warning("AuthorityDomainService: Domain verification failed", [
                'domain' => $domain->domain,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Met à jour les scores de tous les domaines
     */
    public function recalculateAllScores(): int
    {
        $updated = 0;
        
        AuthorityDomain::chunk(100, function ($domains) use (&$updated) {
            foreach ($domains as $domain) {
                $this->scoreAuthorityDomain($domain);
                $updated++;
            }
        });

        return $updated;
    }

    /**
     * Recherche de domaines par mot-clé
     */
    public function search(string $query): Collection
    {
        return AuthorityDomain::search($query);
    }

    /**
     * Importe des domaines depuis un fichier CSV
     */
    public function importFromCsv(string $path): array
    {
        $results = ['created' => 0, 'updated' => 0, 'errors' => []];

        if (!file_exists($path)) {
            $results['errors'][] = "File not found: {$path}";
            return $results;
        }

        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);

        while (($row = fgetcsv($handle)) !== false) {
            try {
                $data = array_combine($headers, $row);
                
                $existing = AuthorityDomain::where('domain', $data['domain'])->first();
                
                if ($existing) {
                    $existing->update([
                        'name' => $data['name'] ?? $existing->name,
                        'source_type' => $data['source_type'] ?? $existing->source_type,
                        'authority_score' => $data['authority_score'] ?? $existing->authority_score,
                    ]);
                    $results['updated']++;
                } else {
                    AuthorityDomain::create([
                        'domain' => $data['domain'],
                        'name' => $data['name'] ?? $this->generateName($data['domain']),
                        'source_type' => $data['source_type'] ?? 'authority',
                        'country_code' => $data['country_code'] ?? null,
                        'languages' => json_decode($data['languages'] ?? '[]', true),
                        'topics' => json_decode($data['topics'] ?? '[]', true),
                        'authority_score' => $data['authority_score'] ?? 50,
                        'is_active' => true,
                        'auto_discovered' => false
                    ]);
                    $results['created']++;
                }
            } catch (\Exception $e) {
                $results['errors'][] = "Error on row: {$e->getMessage()}";
            }
        }

        fclose($handle);
        return $results;
    }

    /**
     * Exporte les domaines vers CSV
     */
    public function exportToCsv(string $path): int
    {
        $handle = fopen($path, 'w');
        
        fputcsv($handle, [
            'domain', 'name', 'source_type', 'country_code', 
            'languages', 'topics', 'authority_score', 'is_active'
        ]);

        $count = 0;
        AuthorityDomain::chunk(100, function ($domains) use ($handle, &$count) {
            foreach ($domains as $domain) {
                fputcsv($handle, [
                    $domain->domain,
                    $domain->name,
                    $domain->source_type,
                    $domain->country_code,
                    json_encode($domain->languages),
                    json_encode($domain->topics),
                    $domain->authority_score,
                    $domain->is_active ? 1 : 0
                ]);
                $count++;
            }
        });

        fclose($handle);
        return $count;
    }

    /**
     * Détecte le type de source
     */
    protected function detectSourceType(string $domain): string
    {
        if (preg_match('/\.(gov|gouv|gob|gc\.ca|go\.[a-z]{2})(\.[a-z]{2})?$/', $domain)) {
            return 'government';
        }

        if (str_ends_with($domain, '.int')) {
            return 'organization';
        }

        $organizations = ['un.org', 'who.int', 'unesco.org', 'ilo.org', 'worldbank.org', 'imf.org'];
        foreach ($organizations as $org) {
            if (str_ends_with($domain, $org)) {
                return 'organization';
            }
        }

        $references = ['wikipedia.org', 'britannica.com', 'investopedia.com'];
        foreach ($references as $ref) {
            if (str_ends_with($domain, $ref)) {
                return 'reference';
            }
        }

        if (preg_match('/(news|times|post|guardian|bbc|reuters|cnn)/', $domain)) {
            return 'news';
        }

        return 'authority';
    }

    /**
     * Détecte le pays depuis le domaine
     */
    protected function detectCountry(string $domain): ?string
    {
        $ccTlds = [
            '.fr' => 'FR', '.de' => 'DE', '.es' => 'ES', '.it' => 'IT',
            '.uk' => 'GB', '.co.uk' => 'GB', '.ca' => 'CA', '.au' => 'AU',
            '.jp' => 'JP', '.cn' => 'CN', '.br' => 'BR', '.mx' => 'MX',
            '.ch' => 'CH', '.nl' => 'NL', '.be' => 'BE', '.at' => 'AT',
            '.pt' => 'PT', '.ru' => 'RU', '.in' => 'IN', '.sg' => 'SG',
            '.th' => 'TH', '.ae' => 'AE', '.sa' => 'SA',
        ];

        foreach ($ccTlds as $tld => $country) {
            if (str_ends_with($domain, $tld)) {
                return $country;
            }
        }

        // Patterns spéciaux
        if (preg_match('/\.gouv\.fr$/', $domain)) return 'FR';
        if (preg_match('/\.gov\.uk$/', $domain)) return 'GB';
        if (preg_match('/\.gc\.ca$/', $domain)) return 'CA';
        if (preg_match('/\.gov\.au$/', $domain)) return 'AU';

        return null;
    }

    /**
     * Détecte les langues supportées
     */
    protected function detectLanguages(string $domain): array
    {
        $country = $this->detectCountry($domain);
        
        $countryLanguages = [
            'FR' => ['fr'], 'DE' => ['de'], 'ES' => ['es'], 'IT' => ['it'],
            'GB' => ['en'], 'US' => ['en'], 'CA' => ['en', 'fr'], 'AU' => ['en'],
            'JP' => ['ja'], 'CN' => ['zh'], 'BR' => ['pt'], 'MX' => ['es'],
            'CH' => ['de', 'fr', 'it'], 'BE' => ['fr', 'nl', 'de'],
            'RU' => ['ru'], 'IN' => ['en', 'hi'], 'SA' => ['ar'], 'AE' => ['ar', 'en'],
        ];

        return $countryLanguages[$country] ?? ['en'];
    }

    /**
     * Génère un nom lisible depuis le domaine
     */
    protected function generateName(string $domain): string
    {
        $name = preg_replace('/^www\./', '', $domain);
        $name = preg_replace('/\.[a-z]{2,}(\.[a-z]{2})?$/', '', $name);
        $name = str_replace(['-', '_', '.'], ' ', $name);
        
        return ucwords($name);
    }

    /**
     * Statistiques des domaines
     */
    public function getStatistics(): array
    {
        return [
            'total' => AuthorityDomain::count(),
            'active' => AuthorityDomain::active()->count(),
            'by_type' => AuthorityDomain::selectRaw('source_type, COUNT(*) as count')
                ->groupBy('source_type')
                ->pluck('count', 'source_type')
                ->toArray(),
            'by_country' => AuthorityDomain::selectRaw('country_code, COUNT(*) as count')
                ->whereNotNull('country_code')
                ->groupBy('country_code')
                ->orderByDesc('count')
                ->limit(20)
                ->pluck('count', 'country_code')
                ->toArray(),
            'auto_discovered' => AuthorityDomain::where('auto_discovered', true)->count(),
            'average_authority' => round(AuthorityDomain::avg('authority_score') ?? 0, 1)
        ];
    }
}
