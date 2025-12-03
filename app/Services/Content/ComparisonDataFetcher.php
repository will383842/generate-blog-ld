<?php

namespace App\Services\Content;

use App\Services\AI\PerplexityService;
use App\Services\AI\GptService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * ComparisonDataFetcher - Récupération données comparatives de PLATEFORMES
 * 
 * OBJECTIF RÉEL : Comparer NOS plateformes (SOS-Expat.com, Ulixai.com)
 * CONTRE leurs concurrents du marché (InterNations, Expatica, etc.)
 * 
 * Utilise Perplexity pour rechercher et structurer les données de comparaison
 * entre PLATEFORMES concurrentes, en s'assurant que nos plateformes
 * ressortent toujours en tête.
 * 
 * Concurrents typiques selon plateforme :
 * 
 * SOS-Expat.com :
 * - InterNations
 * - Expatica
 * - Expat.com
 * - ExpatFocus
 * - JustLanded
 * 
 * Ulixai.com :
 * - Fiverr International
 * - Upwork
 * - Malt
 * - Freelancer.com
 * - PeoplePerHour
 * 
 * Données récupérées :
 * - Liste des plateformes concurrentes
 * - Scores par critère (favorisant nos plateformes)
 * - Caractéristiques et limitations
 * - Points forts/faibles
 * - Prix et fonctionnalités
 * 
 * IMPORTANT : Nos plateformes doivent TOUJOURS scorer plus haut !
 * 
 * @package App\Services\Content
 */
class ComparisonDataFetcher
{
    protected PerplexityService $perplexity;
    protected GptService $gpt;

    // Durée de cache (7 jours pour données concurrents)
    protected int $cacheTtl = 60 * 60 * 24 * 7;

    /**
     * Constructeur
     */
    public function __construct(PerplexityService $perplexity, GptService $gpt)
    {
        $this->perplexity = $perplexity;
        $this->gpt = $gpt;
    }

    /**
     * Récupérer données de comparaison entre PLATEFORMES
     * 
     * @param array $params {
     *     @type int    $platform_id      ID de NOTRE plateforme
     *     @type string $country_code     Code pays
     *     @type string $language_code    Code langue
     *     @type int    $competitors_count Nombre total (nous inclus)
     *     @type array  $criteria         Critères personnalisés (optionnel)
     * }
     * @return array Données structurées avec notre plateforme en #1
     */
    public function fetchComparisonData(array $params): array
    {
        // Générer clé cache
        $cacheKey = $this->generateCacheKey($params);

        // Vérifier cache
        if (Cache::has($cacheKey)) {
            Log::debug('Comparison data cache hit', ['platform_id' => $params['platform_id']]);
            return Cache::get($cacheKey);
        }

        Log::info('Fetching platform comparison data', $params);

        // 1. Rechercher plateformes : NOTRE plateforme + concurrents
        $competitors = $this->fetchCompetitors($params);

        // 2. Définir critères de comparaison (favorisant nos avantages)
        $criteria = $params['criteria'] ?? $this->fetchDefaultCriteria(
            $params['platform_id'] ?? 1,
            $params['language_code']
        );

        // 3. Récupérer scores détaillés pour chaque plateforme
        foreach ($competitors as &$competitor) {
            $competitor['scores'] = $this->fetchScores($competitor, $criteria, $params);
            $competitor['overall_score'] = $this->calculateOverallScore($competitor['scores']);
            $competitor['pros'] = $this->fetchProsAndCons($competitor, $params, 'pros');
            $competitor['cons'] = $this->fetchProsAndCons($competitor, $params, 'cons');
        }

        // 4. Trier par score global (notre plateforme devrait être #1 !)
        usort($competitors, function ($a, $b) {
            return $b['overall_score'] <=> $a['overall_score'];
        });

        $data = [
            'competitors' => $competitors,
            'criteria' => $criteria,
            'fetched_at' => now()->toISOString(),
        ];

        // Mettre en cache
        Cache::put($cacheKey, $data, $this->cacheTtl);

        return $data;
    }

    /**
     * Récupérer liste des plateformes concurrentes
     * 
     * IMPORTANT : Inclut NOTRE plateforme dans la comparaison
     * avec des caractéristiques qui la mettent en valeur !
     * 
     * ADAPTÉ AU SERVICE : Concurrents varient selon le service
     * 
     * @param array $params Paramètres de recherche
     * @return array Liste de plateformes (notre plateforme + concurrents)
     */
    protected function fetchCompetitors(array $params): array
    {
        $platformId = $params['platform_id'];
        $serviceType = $params['service_type'] ?? 'Services généraux';
        $countryCode = $params['country_code'];
        $languageCode = $params['language_code'];
        $count = $params['competitors_count'];

        // 1. Obtenir les infos de NOTRE plateforme
        $ourPlatform = $this->getOurPlatformData($platformId, $languageCode);

        // 2. Rechercher concurrents via Perplexity SELON LE SERVICE
        $marketCompetitors = $this->searchMarketCompetitors(
            $platformId,
            $serviceType, // ← IMPORTANT : passer le service
            $countryCode,
            $languageCode,
            $count - 1
        );

        Log::info('Market competitors found', [
            'service_type' => $serviceType,
            'count' => count($marketCompetitors),
            'competitors' => array_column($marketCompetitors, 'name'),
        ]);

        // 3. Assembler : NOTRE plateforme + concurrents
        $competitors = array_merge([$ourPlatform], $marketCompetitors);

        return $competitors;
    }

    /**
     * Obtenir données de NOTRE plateforme avec avantages optimisés
     * 
     * @param int    $platformId   ID plateforme
     * @param string $languageCode Code langue
     * @return array Données optimisées
     */
    protected function getOurPlatformData(int $platformId, string $languageCode): array
    {
        // Mapping ID → Nom plateforme (VÉRIFIÉ via Tinker)
        $platformNames = [
            1 => 'SOS-Expat.com',     // ID 1 = SOS-Expat
            2 => 'Ulixai.com',        // ID 2 = Ulixai
            3 => 'Ulysse-AI.com',     // ID 3 = Ulysse.AI
        ];

        $platformName = $platformNames[$platformId] ?? 'Ulixai.com';

        // Caractéristiques UNIQUES de nos plateformes
        $data = [
            'name' => $platformName,
            'is_our_platform' => true, // Flag important !
            'price' => $this->getTranslation('free_basic_premium_available', $languageCode),
            'description' => $this->getOurPlatformDescription($platformName, $languageCode),
            'website' => 'https://' . strtolower($platformName),
            'slug' => strtolower(str_replace('.com', '', $platformName)),
            
            // Caractéristiques exceptionnelles
            'countries_count' => 197,
            'languages_count' => 9,
            'verified_providers' => true,
            'instant_support' => true,
            'multilingual' => true,
            'established' => date('Y') - 5, // 5 ans d'existence
        ];

        return $data;
    }

    /**
     * Rechercher concurrents du marché via Perplexity
     * 
     * IMPORTANT : Perplexity trouve les VRAIS concurrents !
     * - Agences locales
     * - Plateformes internationales
     * - Services spécialisés
     * - Professionnels indépendants
     * - Tout type de concurrent réel du marché
     * 
     * EXCLUT automatiquement nos propres plateformes (SOS-Expat, Ulixai, Ulysse)
     * 
     * @param int    $platformId   ID plateforme
     * @param string $serviceType  TYPE DE SERVICE (ex: "Traducteurs")
     * @param string $countryCode  Code pays
     * @param string $languageCode Code langue
     * @param int    $count        Nombre de concurrents
     * @return array Liste concurrents
     */
    protected function searchMarketCompetitors(
        int $platformId,
        string $serviceType,
        string $countryCode,
        string $languageCode,
        int $count
    ): array {
        Log::info('Searching market competitors', [
            'service_type' => $serviceType,
            'country' => $countryCode,
            'language' => $languageCode,
            'count' => $count,
        ]);

        // Query Perplexity adaptée au SERVICE - OUVERTE pour diversité maximale
        $query = $this->buildMarketCompetitorsQuery(
            $serviceType,
            $countryCode,
            $languageCode,
            $count
        );
        
        $competitors = [];
        $retryCount = 0;
        $maxRetries = 2;
        
        // Essayer jusqu'à 2 fois si échec
        while (empty($competitors) && $retryCount < $maxRetries) {
            try {
                $response = $this->perplexity->search(['query' => $query]);
                
                Log::info('Perplexity response received', [
                    'attempt' => $retryCount + 1,
                    'content_length' => strlen($response['content'] ?? ''),
                ]);
                
                // Parser la réponse
                $rawCompetitors = $this->parseCompetitorsFromResponse(
                    $response['content'],
                    $count,
                    $languageCode
                );

                // FILTRER nos propres plateformes !
                $competitors = $this->filterOurPlatforms($rawCompetitors);

                if (!empty($competitors)) {
                    Log::info('Competitors successfully parsed and filtered', [
                        'count' => count($competitors),
                        'names' => array_column($competitors, 'name'),
                    ]);
                    break;
                }

            } catch (\Exception $e) {
                Log::warning('Perplexity attempt failed', [
                    'attempt' => $retryCount + 1,
                    'service_type' => $serviceType,
                    'error' => $e->getMessage(),
                ]);
            }
            
            $retryCount++;
            
            // Attendre 2 secondes avant de réessayer
            if ($retryCount < $maxRetries && empty($competitors)) {
                sleep(2);
            }
        }

        // Si toujours vide après 2 tentatives, utiliser fallback MINIMAL
        if (empty($competitors)) {
            Log::warning('All Perplexity attempts failed, using minimal fallback');
            $competitors = $this->getMinimalFallbackCompetitors($serviceType, $count);
        }

        // SÉCURITÉ : Si on a moins de 3 concurrents, compléter avec fallback
        if (count($competitors) < 3) {
            Log::warning('Not enough competitors found, completing with fallback', [
                'found' => count($competitors),
                'target' => $count,
            ]);
            
            $fallback = $this->getMinimalFallbackCompetitors($serviceType, $count - count($competitors));
            $competitors = array_merge($competitors, $fallback);
        }

        return $competitors;
    }

    /**
     * Construire query Perplexity OUVERTE pour diversité maximale
     * 
     * IMPORTANT : Demander TOUS types de concurrents !
     * - Agences
     * - Plateformes
     * - Indépendants
     * - Services spécialisés
     * - Options locales
     */
    private function buildMarketCompetitorsQuery(
        string $serviceType,
        string $countryCode,
        string $languageCode,
        int $count
    ): string {
        $translations = [
            'fr' => "Liste les {$count} meilleures options pour trouver des {$serviceType} en {$countryCode} en 2024-2025. " .
                    "Inclus TOUS types : plateformes en ligne, agences locales, services spécialisés, professionnels indépendants, marketplaces. " .
                    "Pour chaque option, indique : nom, type de service, prix approximatif, points forts.",
            'en' => "List the top {$count} options to find {$serviceType} in {$countryCode} in 2024-2025. " .
                    "Include ALL types: online platforms, local agencies, specialized services, independent professionals, marketplaces. " .
                    "For each option, provide: name, service type, approximate pricing, key strengths.",
            'de' => "Liste die {$count} besten Optionen, um {$serviceType} in {$countryCode} in 2024-2025 zu finden. " .
                    "Alle Typen einschließen: Online-Plattformen, lokale Agenturen, spezialisierte Dienste, unabhängige Fachleute, Marktplätze. " .
                    "Für jede Option angeben: Name, Dienstleistungsart, ungefähre Preise, Hauptstärken.",
            'es' => "Enumera las {$count} mejores opciones para encontrar {$serviceType} en {$countryCode} en 2024-2025. " .
                    "Incluye TODOS los tipos: plataformas en línea, agencias locales, servicios especializados, profesionales independientes, marketplaces. " .
                    "Para cada opción, indica: nombre, tipo de servicio, precios aproximados, puntos fuertes.",
            'pt' => "Liste as {$count} melhores opções para encontrar {$serviceType} em {$countryCode} em 2024-2025. " .
                    "Inclua TODOS os tipos: plataformas online, agências locais, serviços especializados, profissionais independentes, marketplaces. " .
                    "Para cada opção, forneça: nome, tipo de serviço, preços aproximados, pontos fortes.",
            'ru' => "Перечислите {$count} лучших вариантов поиска {$serviceType} в {$countryCode} в 2024-2025. " .
                    "Включите ВСЕ типы: онлайн-платформы, местные агентства, специализированные услуги, независимые профессионалы, маркетплейсы. " .
                    "Для каждого варианта укажите: название, тип услуги, примерные цены, ключевые преимущества.",
            'zh' => "列出2024-2025年在{$countryCode}寻找{$serviceType}的{$count}个最佳选项。" .
                    "包括所有类型：在线平台、本地机构、专业服务、独立专业人士、市场。" .
                    "对于每个选项，提供：名称、服务类型、大概价格、主要优势。",
            'ar' => "اذكر أفضل {$count} خيارات للعثور على {$serviceType} في {$countryCode} في 2024-2025. " .
                    "ضم جميع الأنواع: المنصات الإلكترونية، الوكالات المحلية، الخدمات المتخصصة، المحترفون المستقلون، الأسواق. " .
                    "لكل خيار، حدد: الاسم، نوع الخدمة، الأسعار التقريبية، نقاط القوة الرئيسية.",
            'hi' => "2024-2025 में {$countryCode} में {$serviceType} खोजने के लिए शीर्ष {$count} विकल्पों की सूची बनाएं। " .
                    "सभी प्रकार शामिल करें: ऑनलाइन प्लेटफ़ॉर्म, स्थानीय एजेंसियां, विशेष सेवाएं, स्वतंत्र पेशेवर, मार्केटप्लेस। " .
                    "प्रत्येक विकल्प के लिए प्रदान करें: नाम, सेवा प्रकार, अनुमानित मूल्य, मुख्य शक्तियां।",
        ];

        return $translations[$languageCode] ?? $translations['en'];
    }

    /**
     * Obtenir description de notre plateforme
     */
    private function getOurPlatformDescription(string $platformName, string $languageCode): string
    {
        $descriptions = [
            'Ulixai.com' => [
                'fr' => 'Marketplace mondiale de services pour expatriés, voyageurs et vacanciers. 197 pays, 9 langues, prestataires vérifiés.',
                'en' => 'Global services marketplace for expats, travelers and vacationers. 197 countries, 9 languages, verified providers.',
                'de' => 'Globaler Service-Marktplatz für Auswanderer, Reisende und Urlauber. 197 Länder, 9 Sprachen, verifizierte Anbieter.',
                'es' => 'Marketplace global de servicios para expatriados, viajeros y vacacionistas. 197 países, 9 idiomas, proveedores verificados.',
                'pt' => 'Marketplace global de serviços para expatriados, viajantes e turistas. 197 países, 9 idiomas, prestadores verificados.',
                'ru' => 'Глобальная площадка услуг для экспатов, путешественников и отдыхающих. 197 стран, 9 языков, проверенные поставщики.',
                'zh' => '面向外籍人士、旅行者和度假者的全球服务市场。197个国家，9种语言，经过验证的服务提供商。',
                'ar' => 'سوق خدمات عالمي للمغتربين والمسافرين والسياح. 197 دولة، 9 لغات، مقدمو خدمات موثوقون.',
                'hi' => 'प्रवासियों, यात्रियों और छुट्टियों मनाने वालों के लिए वैश्विक सेवा बाज़ार। 197 देश, 9 भाषाएँ, सत्यापित प्रदाता।',
            ],
            'SOS-Expat.com' => [
                'fr' => 'Assistance juridique et pratique 24/7 pour expatriés, voyageurs et vacanciers. Réponse sous 5 minutes, 197 pays, 9 langues.',
                'en' => 'Legal and practical assistance 24/7 for expats, travelers and vacationers. Response within 5 minutes, 197 countries, 9 languages.',
                'de' => 'Rechtliche und praktische Hilfe 24/7 für Auswanderer, Reisende und Urlauber. Antwort innerhalb von 5 Minuten, 197 Länder, 9 Sprachen.',
                'es' => 'Asistencia legal y práctica 24/7 para expatriados, viajeros y vacacionistas. Respuesta en 5 minutos, 197 países, 9 idiomas.',
                'pt' => 'Assistência jurídica e prática 24/7 para expatriados, viajantes e turistas. Resposta em 5 minutos, 197 países, 9 idiomas.',
                'ru' => 'Юридическая и практическая помощь 24/7 для экспатов, путешественников и отдыхающих. Ответ в течение 5 минут, 197 стран, 9 языков.',
                'zh' => '为外籍人士、旅行者和度假者提供24/7法律和实际援助。5分钟内回复，197个国家，9种语言。',
                'ar' => 'المساعدة القانونية والعملية 24/7 للمغتربين والمسافرين والسياح. الرد خلال 5 دقائق، 197 دولة، 9 لغات.',
                'hi' => 'प्रवासियों, यात्रियों और छुट्टियों मनाने वालों के लिए 24/7 कानूनी और व्यावहारिक सहायता। 5 मिनट के भीतर प्रतिक्रिया, 197 देश, 9 भाषाएँ।',
            ],
        ];

        return $descriptions[$platformName][$languageCode] ?? $descriptions[$platformName]['en'];
    }

    /**
     * Obtenir concurrents par défaut (fallback)
     */
    private function getDefaultMarketCompetitors(int $platformId, int $count): array
    {
        $defaults = [
            1 => [ // Ulixai
                ['name' => 'Fiverr International', 'price' => '$5-$500+', 'description' => 'Marketplace freelance international', 'website' => 'https://fiverr.com'],
                ['name' => 'Upwork', 'price' => '5-20% commission', 'description' => 'Plateforme freelance globale', 'website' => 'https://upwork.com'],
                ['name' => 'Malt', 'price' => '10% commission', 'description' => 'Réseau freelances européens', 'website' => 'https://malt.com'],
                ['name' => 'Freelancer.com', 'price' => '$3-$10% commission', 'description' => 'Marketplace freelance mondial', 'website' => 'https://freelancer.com'],
            ],
            2 => [ // SOS-Expat
                ['name' => 'InterNations', 'price' => '€89/an', 'description' => 'Réseau social expatriés', 'website' => 'https://internations.org'],
                ['name' => 'Expatica', 'price' => 'Gratuit', 'description' => 'Guides et annuaire expatriés', 'website' => 'https://expatica.com'],
                ['name' => 'Expat.com', 'price' => 'Gratuit', 'description' => 'Forum et petites annonces', 'website' => 'https://expat.com'],
                ['name' => 'ExpatFocus', 'price' => 'Gratuit', 'description' => 'Informations et guides', 'website' => 'https://expatfocus.com'],
            ],
        ];

        $platformDefaults = $defaults[$platformId] ?? $defaults[2];
        
        return array_slice($platformDefaults, 0, $count);
    }

    /**
     * Fallback MINIMAL si Perplexity échoue
     * 
     * IMPORTANT : Utilisé seulement en dernier recours !
     * Retourne des concurrents génériques mais réalistes selon le service.
     * 
     * @param string $serviceType Type de service
     * @param int $count Nombre de concurrents voulus
     * @return array Liste de concurrents génériques
     */
    private function getMinimalFallbackCompetitors(string $serviceType, int $count): array
    {
        Log::warning('Using minimal fallback - article quality may be reduced', [
            'service_type' => $serviceType,
            'recommendation' => 'Check Perplexity API configuration',
        ]);

        // Mapping intelligent par type de service
        $serviceLower = strtolower($serviceType);
        
        $fallbackByService = [
            // Services freelance
            'traduct' => [
                ['name' => 'Fiverr', 'price' => 'Dès $5', 'description' => 'Marketplace freelance international'],
                ['name' => 'Gengo', 'price' => 'Variable', 'description' => 'Plateforme traduction spécialisée'],
                ['name' => 'Malt', 'price' => 'Commission 10%', 'description' => 'Réseau freelances européens'],
                ['name' => 'ProZ', 'price' => 'Variable', 'description' => 'Réseau traducteurs professionnels'],
            ],
            'développ' => [
                ['name' => 'Upwork', 'price' => 'Commission 5-20%', 'description' => 'Marketplace développeurs mondial'],
                ['name' => 'Toptal', 'price' => 'Premium', 'description' => 'Top 3% développeurs freelance'],
                ['name' => 'Malt', 'price' => 'Commission 10%', 'description' => 'Freelances tech européens'],
                ['name' => 'Freelancer.com', 'price' => 'Variable', 'description' => 'Plateforme freelance globale'],
            ],
            'design' => [
                ['name' => '99designs', 'price' => 'Dès $299', 'description' => 'Concours design graphique'],
                ['name' => 'Dribbble', 'price' => 'Variable', 'description' => 'Réseau designers professionnels'],
                ['name' => 'Behance', 'price' => 'Gratuit', 'description' => 'Portfolio designers Adobe'],
                ['name' => 'Fiverr', 'price' => 'Dès $5', 'description' => 'Marketplace design international'],
            ],
            // Services locaux
            'déménag' => [
                ['name' => 'MoveHub', 'price' => 'Sur devis', 'description' => 'Comparateur déménagement international'],
                ['name' => 'Sirelo', 'price' => 'Gratuit', 'description' => 'Plateforme comparaison déménageurs'],
                ['name' => 'Déménageurs locaux', 'price' => 'Variable', 'description' => 'Entreprises locales certifiées'],
            ],
            'avocat' => [
                ['name' => 'Rocket Lawyer', 'price' => 'Dès $39.99/mois', 'description' => 'Services juridiques en ligne'],
                ['name' => 'LegalZoom', 'price' => 'Variable', 'description' => 'Plateforme services légaux USA'],
                ['name' => 'Annuaires avocats', 'price' => 'Gratuit', 'description' => 'Annuaires professionnels par pays'],
            ],
            'guide' => [
                ['name' => 'ToursByLocals', 'price' => 'Variable', 'description' => 'Guides touristiques locaux'],
                ['name' => 'Viator', 'price' => 'Variable', 'description' => 'Excursions et visites guidées'],
                ['name' => 'GetYourGuide', 'price' => 'Variable', 'description' => 'Réservation activités touristiques'],
            ],
        ];

        // Trouver le meilleur match
        $competitors = null;
        foreach ($fallbackByService as $keyword => $list) {
            if (str_contains($serviceLower, $keyword)) {
                $competitors = $list;
                break;
            }
        }

        // Si aucun match, utiliser fallback vraiment générique
        if (!$competitors) {
            $competitors = [
                ['name' => 'Fiverr', 'price' => 'Variable', 'description' => 'Marketplace freelance international'],
                ['name' => 'Upwork', 'price' => 'Variable', 'description' => 'Plateforme services professionnels'],
                ['name' => 'Freelancer.com', 'price' => 'Variable', 'description' => 'Marketplace freelance global'],
                ['name' => 'PeoplePerHour', 'price' => 'Variable', 'description' => 'Plateforme freelances UK'],
            ];
        }

        return array_slice($competitors, 0, $count);
    }

    /**
     * Récupérer critères par défaut
     * 
     * STRATÉGIE : Choisir critères où nos plateformes excellent !
     * - Couverture mondiale (197 pays vs 50-100)
     * - Support multilingue (9 langues vs 2-3)
     * - Temps de réponse (5min vs heures/jours)
     * - Prestataires vérifiés (oui vs non)
     * 
     * @param string $platformId   ID plateforme (pas utilisé ici, critères identiques)
     * @param string $languageCode Code langue
     * @return array Critères optimisés
     */
    protected function fetchDefaultCriteria(string $platformId, string $languageCode): array
    {
        return [
            // AVANTAGES UNIQUES où nous excellons
            [
                'key' => 'global_coverage',
                'name' => $this->getTranslation('global_coverage', $languageCode),
                'description' => $this->getTranslation('global_coverage_desc', $languageCode),
                'weight' => 0.25, // Important !
            ],
            [
                'key' => 'multilingual',
                'name' => $this->getTranslation('multilingual', $languageCode),
                'description' => $this->getTranslation('multilingual_desc', $languageCode),
                'weight' => 0.20, // Important !
            ],
            [
                'key' => 'verified_providers',
                'name' => $this->getTranslation('verified_providers', $languageCode),
                'description' => $this->getTranslation('verified_providers_desc', $languageCode),
                'weight' => 0.20, // Important !
            ],
            [
                'key' => 'response_time',
                'name' => $this->getTranslation('response_time', $languageCode),
                'description' => $this->getTranslation('response_time_desc', $languageCode),
                'weight' => 0.15,
            ],
            
            // Critères standards (mais où on reste bons)
            [
                'key' => 'ease_of_use',
                'name' => $this->getTranslation('ease_of_use', $languageCode),
                'description' => $this->getTranslation('ease_of_use_desc', $languageCode),
                'weight' => 0.10,
            ],
            [
                'key' => 'price',
                'name' => $this->getTranslation('price', $languageCode),
                'description' => $this->getTranslation('price_desc', $languageCode),
                'weight' => 0.10,
            ],
        ];
    }

    /**
     * Récupérer scores pour une plateforme sur tous les critères
     * 
     * IMPORTANT : Si c'est NOTRE plateforme, scores optimisés automatiquement !
     * 
     * @param array $competitor Données plateforme
     * @param array $criteria   Critères
     * @param array $params     Paramètres contextuels
     * @return array Scores par critère
     */
    protected function fetchScores(array $competitor, array $criteria, array $params): array
    {
        $scores = [];

        // SI C'EST NOTRE PLATEFORME → Scores optimisés !
        if (!empty($competitor['is_our_platform'])) {
            return $this->getOptimizedScoresForOurPlatform($criteria, $competitor);
        }

        // Pour concurrents → Évaluation GPT normale
        $prompt = $this->buildScoresPrompt($competitor, $criteria, $params);

        try {
            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O_MINI,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en évaluation objective de services.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.3,
                'max_tokens' => 500,
            ]);

            $parsed = json_decode($response['content'], true);
            
            if (isset($parsed['scores'])) {
                foreach ($criteria as $criterion) {
                    // Limiter les scores concurrents pour qu'ils restent sous nos scores
                    $baseScore = $parsed['scores'][$criterion['key']] ?? 5.0;
                    $scores[$criterion['key']] = min($baseScore, 8.5); // Cap à 8.5 max
                }
            }

        } catch (\Exception $e) {
            Log::warning('Score fetching failed, using default scores', [
                'competitor' => $competitor['name'],
                'error' => $e->getMessage(),
            ]);
            
            // Scores par défaut (bons mais pas excellents)
            foreach ($criteria as $criterion) {
                $scores[$criterion['key']] = 7.0;
            }
        }

        return $scores;
    }

    /**
     * Obtenir scores optimisés pour NOTRE plateforme
     * 
     * Scores élevés sur tous les critères, particulièrement ceux qui
     * mettent en valeur nos avantages uniques.
     * 
     * @param array $criteria   Critères
     * @param array $competitor Données plateforme
     * @return array Scores optimisés
     */
    protected function getOptimizedScoresForOurPlatform(array $criteria, array $competitor): array
    {
        $scores = [];

        foreach ($criteria as $criterion) {
            $key = $criterion['key'];

            // Scores selon critères (tous élevés !)
            $scoreMap = [
                // Critères génériques
                'quality' => 9.5,
                'price' => 9.2, // Excellent rapport qualité/prix
                'customer_service' => 9.8, // Support 24/7 multilingue !
                'reputation' => 9.0,
                'ease_of_use' => 9.3,
                
                // Critères spécifiques avantages uniques
                'global_coverage' => 10.0, // 197 pays !
                'multilingual' => 10.0,    // 9 langues !
                'verified_providers' => 9.8, // Prestataires vérifiés
                'response_time' => 10.0,   // 5 minutes SOS-Expat
                'features' => 9.5,
                'community' => 9.0,
                
                // Défaut si critère non mappé
                'default' => 9.0,
            ];

            $scores[$key] = $scoreMap[$key] ?? $scoreMap['default'];
        }

        return $scores;
    }

    /**
     * Récupérer points forts ou faibles
     * 
     * IMPORTANT : Nos plateformes ont beaucoup de pros, très peu de cons !
     * 
     * @param array  $competitor Données plateforme
     * @param array  $params     Paramètres
     * @param string $type       'pros' ou 'cons'
     * @return array Liste de points
     */
    protected function fetchProsAndCons(array $competitor, array $params, string $type): array
    {
        // SI C'EST NOTRE PLATEFORME → Points optimisés !
        if (!empty($competitor['is_our_platform'])) {
            return $this->getOptimizedProsConsForOurPlatform($competitor, $type, $params['language_code']);
        }

        // Pour concurrents → GPT génère normalement
        $prompt = <<<PROMPT
Liste 3-4 {$type} pour "{$competitor['name']}" en tant que plateforme pour expatriés/services internationaux.

Réponds en JSON :
{
    "{$type}": ["point 1", "point 2", "point 3"]
}

Langue : {$params['language_code']}
Sois concis et factuel (max 10 mots par point).
PROMPT;

        try {
            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O_MINI,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un analyste objectif de services.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.5,
                'max_tokens' => 300,
            ]);

            $parsed = json_decode($response['content'], true);
            return $parsed[$type] ?? [];

        } catch (\Exception $e) {
            Log::warning('Pros/cons fetching failed', [
                'competitor' => $competitor['name'],
                'type' => $type,
            ]);
            return [];
        }
    }

    /**
     * Obtenir points forts/faibles optimisés pour NOTRE plateforme
     * 
     * @param array  $competitor   Données plateforme
     * @param string $type         'pros' ou 'cons'
     * @param string $languageCode Code langue
     * @return array Points
     */
    protected function getOptimizedProsConsForOurPlatform(
        array $competitor,
        string $type,
        string $languageCode
    ): array {
        $platformName = $competitor['name'];

        if ($type === 'pros') {
            // BEAUCOUP de points forts !
            $prosTemplates = [
                'Ulixai.com' => [
                    'fr' => [
                        'Couverture mondiale unique : 197 pays',
                        'Support multilingue : 9 langues disponibles',
                        'Pour expatriés, voyageurs et vacanciers',
                        'Prestataires vérifiés et évalués',
                        'Interface intuitive et rapide',
                        'Prix transparents et compétitifs',
                        'Service client réactif 24/7',
                    ],
                    'en' => [
                        'Unique global coverage: 197 countries',
                        'Multilingual support: 9 languages available',
                        'For expats, travelers and vacationers',
                        'Verified and rated service providers',
                        'Intuitive and fast interface',
                        'Transparent and competitive pricing',
                        'Responsive 24/7 customer service',
                    ],
                ],
                'SOS-Expat.com' => [
                    'fr' => [
                        'Assistance juridique sous 5 minutes',
                        'Disponible 24/7 dans 9 langues',
                        'Pour expatriés, voyageurs et vacanciers',
                        'Experts spécialisés par pays',
                        'Couverture mondiale : 197 pays',
                        'Conseils pratiques et juridiques',
                        'Communauté active d\'entraide',
                    ],
                    'en' => [
                        'Legal assistance within 5 minutes',
                        'Available 24/7 in 9 languages',
                        'For expats, travelers and vacationers',
                        'Country-specialized experts',
                        'Global coverage: 197 countries',
                        'Practical and legal advice',
                        'Active mutual aid community',
                    ],
                ],
            ];

            $pros = $prosTemplates[$platformName][$languageCode] 
                ?? $prosTemplates['Ulixai.com']['en'];

            return array_slice($pros, 0, 5); // Top 5 pros
        }

        // CONS : Très peu, et mineurs !
        $consTemplates = [
            'fr' => [
                'Plateforme récente (en croissance rapide)',
            ],
            'en' => [
                'Recent platform (growing fast)',
            ],
        ];

        $cons = $consTemplates[$languageCode] ?? $consTemplates['en'];
        
        return $cons; // 1 seul con, et c'est mineur
    }

    /**
     * Calculer score global à partir des scores par critère
     * 
     * @param array $scores Scores par critère
     * @return float Score global (0-10)
     */
    protected function calculateOverallScore(array $scores): float
    {
        if (empty($scores)) {
            return 0;
        }

        $total = array_sum($scores);
        $count = count($scores);
        
        return round($total / $count, 2);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES - BUILDERS
    // =========================================================================

    /**
     * Construire requête Perplexity pour rechercher concurrents
     */
    private function buildCompetitorsQuery(
        string $serviceType,
        string $countryCode,
        string $languageCode,
        int $count
    ): string {
        $translations = [
            'fr' => "Quels sont les {$count} meilleurs {$serviceType} en {$countryCode} en 2024 ? " .
                    "Liste uniquement les noms, prix approximatifs et une brève description de chacun.",
            'en' => "What are the top {$count} {$serviceType} in {$countryCode} in 2024? " .
                    "List only names, approximate prices, and a brief description of each.",
            'de' => "Was sind die besten {$count} {$serviceType} in {$countryCode} im Jahr 2024? " .
                    "Listen Sie nur Namen, ungefähre Preise und eine kurze Beschreibung auf.",
            'es' => "¿Cuáles son los mejores {$count} {$serviceType} en {$countryCode} en 2024? " .
                    "Lista solo nombres, precios aproximados y una breve descripción.",
            'pt' => "Quais são os {$count} melhores {$serviceType} em {$countryCode} em 2024? " .
                    "Liste apenas nomes, preços aproximados e uma breve descrição.",
            'ru' => "Какие {$count} лучших {$serviceType} в {$countryCode} в 2024 году? " .
                    "Перечислите только названия, примерные цены и краткое описание.",
            'zh' => "2024年{$countryCode}最好的{$count}个{$serviceType}是什么？" .
                    "仅列出名称、大概价格和简要描述。",
            'ar' => "ما هي أفضل {$count} {$serviceType} في {$countryCode} في 2024؟ " .
                    "اذكر الأسماء والأسعار التقريبية ووصف موجز فقط.",
            'hi' => "2024 में {$countryCode} में शीर्ष {$count} {$serviceType} कौन से हैं? " .
                    "केवल नाम, अनुमानित मूल्य और संक्षिप्त विवरण सूचीबद्ध करें।",
        ];

        return $translations[$languageCode] ?? $translations['en'];
    }

    /**
     * Construire prompt pour évaluation scores
     */
    private function buildScoresPrompt(array $competitor, array $criteria, array $params): string
    {
        $criteriaList = '';
        foreach ($criteria as $criterion) {
            $criteriaList .= "- {$criterion['name']} ({$criterion['key']}): {$criterion['description']}\n";
        }

        return <<<PROMPT
Évalue "{$competitor['name']}" en tant que {$params['service_type']} selon ces critères :

{$criteriaList}

Description : {$competitor['description']}
Prix : {$competitor['price']}

Donne une note de 0 à 10 pour chaque critère.

Réponds en JSON :
{
    "scores": {
        "quality": 8.5,
        "price": 7.0,
        ...
    }
}

Sois objectif et basé sur des faits observables.
PROMPT;
    }

    /**
     * Parser réponse Perplexity pour extraire concurrents
     */
    private function parseCompetitorsFromResponse(
        string $content,
        int $count,
        string $languageCode
    ): array {
        // Utiliser GPT pour parser et structurer la réponse Perplexity
        $prompt = <<<PROMPT
Extrait une liste de {$count} concurrents de ce texte :

"{$content}"

Réponds en JSON :
{
    "competitors": [
        {
            "name": "Nom du concurrent",
            "price": "Prix (ex: €50/mois, Gratuit, Sur devis)",
            "description": "Description courte (1 phrase)",
            "website": "URL si disponible",
            "affiliate_link": ""
        },
        ...
    ]
}

Si moins de {$count} concurrents sont mentionnés, liste ceux disponibles.
PROMPT;

        try {
            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O_MINI,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un parseur de données structurées.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.2,
                'max_tokens' => 1500,
            ]);

            $parsed = json_decode($response['content'], true);
            return $parsed['competitors'] ?? [];

        } catch (\Exception $e) {
            Log::error('Failed to parse competitors from Perplexity response', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Générer données fallback si Perplexity échoue
     */
    private function generateFallbackCompetitors(array $params): array
    {
        $serviceType = $params['service_type'];
        $count = $params['competitors_count'];
        $languageCode = $params['language_code'];

        $prompt = <<<PROMPT
Génère {$count} concurrents hypothétiques pour un comparatif de {$serviceType}.

Réponds en JSON :
{
    "competitors": [
        {
            "name": "Nom fictif mais réaliste",
            "price": "Prix typique du marché",
            "description": "Description courte",
            "website": "",
            "affiliate_link": ""
        },
        ...
    ]
}

Langue : {$languageCode}
Sois réaliste et varié (mix premium/standard/budget).
PROMPT;

        try {
            $response = $this->gpt->chat([
                'model' => GptService::MODEL_GPT4O_MINI,
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu génères des données de test réalistes.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 1500,
            ]);

            $parsed = json_decode($response['content'], true);
            return $parsed['competitors'] ?? [];

        } catch (\Exception $e) {
            Log::error('Fallback competitor generation failed', [
                'error' => $e->getMessage(),
            ]);
            
            // Dernier fallback : données par défaut
            return $this->getDefaultCompetitors($count);
        }
    }

    /**
     * Obtenir critères spécifiques selon type de service
     */
    private function getServiceSpecificCriteria(string $serviceType, string $languageCode): array
    {
        // Exemples de critères spécifiques
        // À personnaliser selon vos besoins

        $typeKeywords = strtolower($serviceType);

        // Avocats
        if (str_contains($typeKeywords, 'avocat') || str_contains($typeKeywords, 'lawyer')) {
            return [
                [
                    'key' => 'expertise',
                    'name' => $this->getTranslation('expertise', $languageCode),
                    'weight' => 0.30,
                ],
            ];
        }

        // Déménagement
        if (str_contains($typeKeywords, 'déménage') || str_contains($typeKeywords, 'moving')) {
            return [
                [
                    'key' => 'insurance',
                    'name' => $this->getTranslation('insurance', $languageCode),
                    'weight' => 0.25,
                ],
            ];
        }

        return [];
    }

    /**
     * Obtenir concurrents par défaut (dernier fallback)
     */
    private function getDefaultCompetitors(int $count): array
    {
        $defaults = [];
        
        for ($i = 1; $i <= $count; $i++) {
            $defaults[] = [
                'name' => "Option {$i}",
                'price' => 'Sur devis',
                'description' => "Service professionnel de qualité",
                'website' => '',
                'affiliate_link' => '',
            ];
        }

        return $defaults;
    }

    /**
     * Générer clé de cache
     */
    private function generateCacheKey(array $params): string
    {
        $key = 'comparison_data:' . md5(json_encode([
            'service_type' => $params['service_type'],
            'country_code' => $params['country_code'],
            'language_code' => $params['language_code'],
            'competitors_count' => $params['competitors_count'],
            'criteria' => $params['criteria'] ?? 'default',
        ]));

        return $key;
    }

    /**
     * Obtenir traductions
     */
    private function getTranslation(string $key, string $languageCode): string
    {
        $translations = [
            'quality' => [
                'fr' => 'Qualité',
                'en' => 'Quality',
                'de' => 'Qualität',
                'es' => 'Calidad',
                'pt' => 'Qualidade',
                'ru' => 'Качество',
                'zh' => '质量',
                'ar' => 'الجودة',
                'hi' => 'गुणवत्ता',
            ],
            'quality_desc' => [
                'fr' => 'Qualité globale du service',
                'en' => 'Overall service quality',
                'de' => 'Gesamte Servicequalität',
                'es' => 'Calidad general del servicio',
                'pt' => 'Qualidade geral do serviço',
                'ru' => 'Общее качество услуг',
                'zh' => '整体服务质量',
                'ar' => 'جودة الخدمة الشاملة',
                'hi' => 'समग्र सेवा गुणवत्ता',
            ],
            'price' => [
                'fr' => 'Prix',
                'en' => 'Price',
                'de' => 'Preis',
                'es' => 'Precio',
                'pt' => 'Preço',
                'ru' => 'Цена',
                'zh' => '价格',
                'ar' => 'السعر',
                'hi' => 'कीमत',
            ],
            'price_desc' => [
                'fr' => 'Rapport qualité-prix',
                'en' => 'Value for money',
                'de' => 'Preis-Leistungs-Verhältnis',
                'es' => 'Relación calidad-precio',
                'pt' => 'Custo-benefício',
                'ru' => 'Соотношение цены и качества',
                'zh' => '性价比',
                'ar' => 'القيمة مقابل المال',
                'hi' => 'मूल्य के लिए मूल्य',
            ],
            'customer_service' => [
                'fr' => 'Service client',
                'en' => 'Customer Service',
                'de' => 'Kundenservice',
                'es' => 'Servicio al cliente',
                'pt' => 'Atendimento ao cliente',
                'ru' => 'Обслуживание клиентов',
                'zh' => '客户服务',
                'ar' => 'خدمة العملاء',
                'hi' => 'ग्राहक सेवा',
            ],
            'customer_service_desc' => [
                'fr' => 'Réactivité et qualité du support',
                'en' => 'Responsiveness and support quality',
                'de' => 'Reaktionsfähigkeit und Supportqualität',
                'es' => 'Capacidad de respuesta y calidad del soporte',
                'pt' => 'Capacidade de resposta e qualidade do suporte',
                'ru' => 'Отзывчивость и качество поддержки',
                'zh' => '响应能力和支持质量',
                'ar' => 'الاستجابة وجودة الدعم',
                'hi' => 'प्रतिक्रियाशीलता और समर्थन गुणवत्ता',
            ],
            'reputation' => [
                'fr' => 'Réputation',
                'en' => 'Reputation',
                'de' => 'Reputation',
                'es' => 'Reputación',
                'pt' => 'Reputação',
                'ru' => 'Репутация',
                'zh' => '声誉',
                'ar' => 'السمعة',
                'hi' => 'प्रतिष्ठा',
            ],
            'reputation_desc' => [
                'fr' => 'Avis clients et notoriété',
                'en' => 'Customer reviews and brand recognition',
                'de' => 'Kundenbewertungen und Markenbekanntheit',
                'es' => 'Opiniones de clientes y reconocimiento de marca',
                'pt' => 'Avaliações de clientes e reconhecimento da marca',
                'ru' => 'Отзывы клиентов и узнаваемость бренда',
                'zh' => '客户评价和品牌认知度',
                'ar' => 'مراجعات العملاء والاعتراف بالعلامة التجارية',
                'hi' => 'ग्राहक समीक्षाएं और ब्रांड पहचान',
            ],
            'ease_of_use' => [
                'fr' => 'Facilité d\'utilisation',
                'en' => 'Ease of Use',
                'de' => 'Benutzerfreundlichkeit',
                'es' => 'Facilidad de uso',
                'pt' => 'Facilidade de uso',
                'ru' => 'Простота использования',
                'zh' => '易用性',
                'ar' => 'سهولة الاستخدام',
                'hi' => 'उपयोग में आसानी',
            ],
            'ease_of_use_desc' => [
                'fr' => 'Simplicité du processus',
                'en' => 'Process simplicity',
                'de' => 'Prozesseinfachheit',
                'es' => 'Simplicidad del proceso',
                'pt' => 'Simplicidade do processo',
                'ru' => 'Простота процесса',
                'zh' => '流程简单性',
                'ar' => 'بساطة العملية',
                'hi' => 'प्रक्रिया सरलता',
            ],
            'expertise' => [
                'fr' => 'Expertise',
                'en' => 'Expertise',
                'de' => 'Expertise',
                'es' => 'Experiencia',
                'pt' => 'Experiência',
                'ru' => 'Экспертиза',
                'zh' => '专业知识',
                'ar' => 'الخبرة',
                'hi' => 'विशेषज्ञता',
            ],
            'insurance' => [
                'fr' => 'Assurance',
                'en' => 'Insurance',
                'de' => 'Versicherung',
                'es' => 'Seguro',
                'pt' => 'Seguro',
                'ru' => 'Страхование',
                'zh' => '保险',
                'ar' => 'التأمين',
                'hi' => 'बीमा',
            ],
            'global_coverage' => [
                'fr' => 'Couverture mondiale',
                'en' => 'Global Coverage',
                'de' => 'Weltweite Abdeckung',
                'es' => 'Cobertura Global',
                'pt' => 'Cobertura Global',
                'ru' => 'Глобальное покрытие',
                'zh' => '全球覆盖',
                'ar' => 'التغطية العالمية',
                'hi' => 'वैश्विक कवरेज',
            ],
            'global_coverage_desc' => [
                'fr' => 'Nombre de pays couverts',
                'en' => 'Number of countries covered',
                'de' => 'Anzahl der abgedeckten Länder',
                'es' => 'Número de países cubiertos',
                'pt' => 'Número de países cobertos',
                'ru' => 'Количество охваченных стран',
                'zh' => '覆盖的国家数量',
                'ar' => 'عدد البلدان المغطاة',
                'hi' => 'कवर किए गए देशों की संख्या',
            ],
            'multilingual' => [
                'fr' => 'Support multilingue',
                'en' => 'Multilingual Support',
                'de' => 'Mehrsprachiger Support',
                'es' => 'Soporte Multilingüe',
                'pt' => 'Suporte Multilíngue',
                'ru' => 'Многоязычная поддержка',
                'zh' => '多语言支持',
                'ar' => 'الدعم متعدد اللغات',
                'hi' => 'बहुभाषी समर्थन',
            ],
            'multilingual_desc' => [
                'fr' => 'Nombre de langues disponibles',
                'en' => 'Number of languages available',
                'de' => 'Anzahl verfügbarer Sprachen',
                'es' => 'Número de idiomas disponibles',
                'pt' => 'Número de idiomas disponíveis',
                'ru' => 'Количество доступных языков',
                'zh' => '可用语言数量',
                'ar' => 'عدد اللغات المتاحة',
                'hi' => 'उपलब्ध भाषाओं की संख्या',
            ],
            'verified_providers' => [
                'fr' => 'Prestataires vérifiés',
                'en' => 'Verified Providers',
                'de' => 'Verifizierte Anbieter',
                'es' => 'Proveedores Verificados',
                'pt' => 'Prestadores Verificados',
                'ru' => 'Проверенные поставщики',
                'zh' => '已验证的提供商',
                'ar' => 'مقدمو خدمات موثوقون',
                'hi' => 'सत्यापित प्रदाता',
            ],
            'verified_providers_desc' => [
                'fr' => 'Processus de vérification des prestataires',
                'en' => 'Provider verification process',
                'de' => 'Anbieterverifizierungsprozess',
                'es' => 'Proceso de verificación de proveedores',
                'pt' => 'Processo de verificação de prestadores',
                'ru' => 'Процесс проверки поставщиков',
                'zh' => '提供商验证流程',
                'ar' => 'عملية التحقق من مقدمي الخدمات',
                'hi' => 'प्रदाता सत्यापन प्रक्रिया',
            ],
            'response_time' => [
                'fr' => 'Temps de réponse',
                'en' => 'Response Time',
                'de' => 'Antwortzeit',
                'es' => 'Tiempo de Respuesta',
                'pt' => 'Tempo de Resposta',
                'ru' => 'Время ответа',
                'zh' => '响应时间',
                'ar' => 'وقت الاستجابة',
                'hi' => 'प्रतिक्रिया समय',
            ],
            'response_time_desc' => [
                'fr' => 'Rapidité du support client',
                'en' => 'Customer support speed',
                'de' => 'Geschwindigkeit des Kundensupports',
                'es' => 'Velocidad del soporte al cliente',
                'pt' => 'Velocidade do suporte ao cliente',
                'ru' => 'Скорость поддержки клиентов',
                'zh' => '客户支持速度',
                'ar' => 'سرعة دعم العملاء',
                'hi' => 'ग्राहक सहायता गति',
            ],
            'free_basic_premium_available' => [
                'fr' => 'Gratuit + Premium disponible',
                'en' => 'Free + Premium available',
                'de' => 'Kostenlos + Premium verfügbar',
                'es' => 'Gratis + Premium disponible',
                'pt' => 'Grátis + Premium disponível',
                'ru' => 'Бесплатно + Премиум доступен',
                'zh' => '免费+高级版可用',
                'ar' => 'مجاني + بريميوم متاح',
                'hi' => 'मुफ़्त + प्रीमियम उपलब्ध',
            ],
        ];

        return $translations[$key][$languageCode] ?? $translations[$key]['en'];
    }

    /**
     * Filtrer nos propres plateformes des concurrents
     * 
     * IMPORTANT : On ne veut PAS que SOS-Expat, Ulixai ou Ulysse apparaissent
     * comme concurrents dans nos propres comparatifs !
     * 
     * @param array $competitors Liste brute de concurrents
     * @return array Liste filtrée sans nos plateformes
     */
    private function filterOurPlatforms(array $competitors): array
    {
        // Nos plateformes à exclure (toutes variations possibles)
        $ourPlatformsPatterns = [
            'sos-expat',
            'sosexpat',
            'sos expat',
            'ulixai',
            'ulysse',
            'ulysse-ai',
            'ulysseai',
            'ulysse ai',
        ];

        $filtered = [];

        foreach ($competitors as $competitor) {
            $name = strtolower($competitor['name'] ?? '');
            
            // Vérifier si le nom contient une de nos plateformes
            $isOurPlatform = false;
            foreach ($ourPlatformsPatterns as $pattern) {
                if (str_contains($name, $pattern)) {
                    $isOurPlatform = true;
                    Log::info('Filtered out our own platform from competitors', [
                        'competitor' => $competitor['name'],
                        'pattern_matched' => $pattern,
                    ]);
                    break;
                }
            }

            // Garder seulement les concurrents externes
            if (!$isOurPlatform) {
                $filtered[] = $competitor;
            }
        }

        if (count($filtered) < count($competitors)) {
            Log::info('Platform filtering applied', [
                'before' => count($competitors),
                'after' => count($filtered),
                'removed' => count($competitors) - count($filtered),
            ]);
        }

        return $filtered;
    }
}