<?php

namespace App\Services\Research;

use Illuminate\Support\Facades\Log;

class FactCheckingService
{
    protected ResearchAggregatorService $researchService;

    public function __construct(ResearchAggregatorService $researchService)
    {
        $this->researchService = $researchService;
    }

    // =========================================================================
    // MÉTHODES PRINCIPALES
    // =========================================================================

    /**
     * Vérifier un fait / affirmation
     * 
     * @param string $claim Affirmation à vérifier
     * @param string $languageCode Code langue
     * @return array Résultat de la vérification
     */
    public function checkFact(string $claim, string $languageCode = 'fr'): array
    {
        Log::info('Fact-checking claim', ['claim' => $claim, 'lang' => $languageCode]);

        // 1. Rechercher l'affirmation
        $searchResults = $this->researchService->search($claim, $languageCode);

        if (empty($searchResults)) {
            return [
                'claim' => $claim,
                'confidence' => 'low',
                'verification_status' => 'unknown',
                'supporting_sources' => [],
                'contradicting_sources' => [],
                'recommendation' => 'Needs review',
                'explanation' => 'Aucune source trouvée pour vérifier cette affirmation.',
                'suggested_correction' => null,
            ];
        }

        // 2. Analyser les sources
        $analysis = $this->analyzeSources($searchResults, $claim);

        // 3. Déterminer le niveau de confiance
        $confidence = $this->calculateConfidence($analysis);

        // 4. Déterminer le statut de vérification
        $verificationStatus = $this->determineVerificationStatus($analysis, $confidence);

        // 5. Générer une recommandation
        $recommendation = $this->generateRecommendation($verificationStatus, $confidence);

        // 6. Suggérer une correction si nécessaire
        $suggestedCorrection = null;
        if ($verificationStatus === 'disputed' && !empty($analysis['contradicting_sources'])) {
            $suggestedCorrection = $this->suggestCorrections($claim, $analysis['contradicting_sources']);
        }

        return [
            'claim' => $claim,
            'confidence' => $confidence,
            'verification_status' => $verificationStatus,
            'supporting_sources' => $analysis['supporting_sources'],
            'contradicting_sources' => $analysis['contradicting_sources'],
            'recommendation' => $recommendation,
            'explanation' => $analysis['explanation'],
            'suggested_correction' => $suggestedCorrection,
        ];
    }

    /**
     * Extraire les affirmations factuelles d'un contenu
     * 
     * @param string $content Contenu à analyser
     * @return array Liste des affirmations détectées
     */
    public function extractClaimsFromContent(string $content): array
    {
        $claims = [];

        // Pattern 1 : Chiffres avec contexte (ex: "304 millions d'expatriés")
        preg_match_all('/(\d+(?:[,\.\s]\d+)*)\s*(?:millions?|milliards?|%|pour\s*cent)?\s+([^\.\n]{10,100})/iu', $content, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $claims[] = [
                'type' => 'statistic',
                'text' => trim($match[0]),
                'value' => $match[1],
                'context' => $match[2],
            ];
        }

        // Pattern 2 : Dates avec événements
        preg_match_all('/(?:en|depuis|à partir de|jusqu\'à)?\s*(\d{4}(?:\s*-\s*\d{4})?)[,\s]+([^\.\n]{15,100})/iu', $content, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $claims[] = [
                'type' => 'historical',
                'text' => trim($match[0]),
                'date' => $match[1],
                'event' => $match[2],
            ];
        }

        // Pattern 3 : Noms propres avec rôles/positions
        preg_match_all('/([A-Z][a-zàâäéèêëïîôöùûüÿç]+(?:\s+[A-Z][a-zàâäéèêëïîôöùûüÿç]+)+)\s+(?:est|était|devient|sera)\s+([^\.\n]{10,80})/u', $content, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $claims[] = [
                'type' => 'biographical',
                'text' => trim($match[0]),
                'person' => $match[1],
                'role' => $match[2],
            ];
        }

        // Limiter à 10 claims max
        return array_slice($claims, 0, 10);
    }

    /**
     * Vérifier plusieurs affirmations
     * 
     * @param array $claims Liste d'affirmations
     * @param string $languageCode Code langue
     * @return array Résultats de vérification
     */
    public function verifyClaims(array $claims, string $languageCode = 'fr'): array
    {
        $results = [];

        foreach ($claims as $claim) {
            $claimText = is_array($claim) ? $claim['text'] : $claim;
            $results[] = $this->checkFact($claimText, $languageCode);
        }

        return $results;
    }

    /**
     * Suggérer des corrections basées sur les sources contradictoires
     */
    public function suggestCorrections(string $claim, array $contradictingSources): ?string
    {
        if (empty($contradictingSources)) {
            return null;
        }

        // Extraire les informations des sources contradictoires
        $excerpts = [];
        foreach ($contradictingSources as $source) {
            if (!empty($source['excerpt'])) {
                $excerpts[] = $source['excerpt'];
            }
        }

        if (empty($excerpts)) {
            return 'Consultez les sources contradictoires pour plus de détails.';
        }

        // Analyser les extraits pour trouver des patterns communs
        // (implémentation simplifiée - pourrait être améliorée avec NLP)
        
        // Chercher des chiffres différents
        preg_match_all('/\d+(?:[,\.]\d+)*/', $claim, $claimNumbers);
        preg_match_all('/\d+(?:[,\.]\d+)*/', implode(' ', $excerpts), $sourceNumbers);
        
        if (!empty($claimNumbers[0]) && !empty($sourceNumbers[0])) {
            $mostCommonNumber = $this->findMostCommon($sourceNumbers[0]);
            if ($mostCommonNumber !== $claimNumbers[0][0]) {
                $corrected = str_replace($claimNumbers[0][0], $mostCommonNumber, $claim);
                return "Suggestion : \"$corrected\" (basé sur les sources consultées)";
            }
        }

        return 'Vérifiez manuellement les sources pour identifier les divergences.';
    }

    // =========================================================================
    // ANALYSE ET SCORING
    // =========================================================================

    /**
     * Analyser les sources trouvées
     */
    protected function analyzeSources(array $sources, string $claim): array
    {
        $supportingSources = [];
        $contradictingSources = [];
        $neutralSources = [];

        foreach ($sources as $source) {
            $sentiment = $this->analyzeSentiment($source, $claim);
            
            if ($sentiment === 'supporting') {
                $supportingSources[] = $source;
            } elseif ($sentiment === 'contradicting') {
                $contradictingSources[] = $source;
            } else {
                $neutralSources[] = $source;
            }
        }

        // Générer une explication
        $totalSources = count($sources);
        $supportingCount = count($supportingSources);
        $contradictingCount = count($contradictingSources);

        $explanation = sprintf(
            'Analyse de %d source(s): %d confirme(nt), %d contredit/contredisent, %d neutre(s).',
            $totalSources,
            $supportingCount,
            $contradictingCount,
            count($neutralSources)
        );

        return [
            'supporting_sources' => array_map(fn($s) => $s['url'], $supportingSources),
            'contradicting_sources' => $contradictingSources,
            'neutral_sources' => array_map(fn($s) => $s['url'], $neutralSources),
            'explanation' => $explanation,
        ];
    }

    /**
     * Analyser le sentiment d'une source par rapport au claim
     */
    protected function analyzeSentiment(array $source, string $claim): string
    {
        $content = strtolower($source['title'] . ' ' . ($source['excerpt'] ?? ''));
        $claimLower = strtolower($claim);

        // Extraire les mots-clés du claim
        $claimWords = preg_split('/\s+/', $claimLower);
        $claimWords = array_filter($claimWords, fn($w) => strlen($w) > 3);

        // Compter les correspondances
        $matches = 0;
        foreach ($claimWords as $word) {
            if (str_contains($content, $word)) {
                $matches++;
            }
        }

        $matchRate = count($claimWords) > 0 ? $matches / count($claimWords) : 0;

        // Détecter les mots de contradiction
        $contradictionWords = ['faux', 'incorrect', 'non', 'pas', 'erreur', 'inexact'];
        foreach ($contradictionWords as $word) {
            if (str_contains($content, $word)) {
                return 'contradicting';
            }
        }

        // Si beaucoup de correspondances, considérer comme supportant
        if ($matchRate > 0.5) {
            return 'supporting';
        }

        return 'neutral';
    }

    /**
     * Calculer le niveau de confiance
     */
    protected function calculateConfidence(array $analysis): string
    {
        $supportingCount = count($analysis['supporting_sources']);
        $contradictingCount = count($analysis['contradicting_sources']);
        $totalRelevant = $supportingCount + $contradictingCount;

        if ($totalRelevant === 0) {
            return 'low';
        }

        // Calcul du ratio
        $supportRatio = $supportingCount / $totalRelevant;

        // Confiance basée sur le consensus
        if ($supportRatio >= 0.8 && $supportingCount >= 3) {
            return 'high';
        } elseif ($supportRatio >= 0.6 && $supportingCount >= 2) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Déterminer le statut de vérification
     */
    protected function determineVerificationStatus(array $analysis, string $confidence): string
    {
        $supportingCount = count($analysis['supporting_sources']);
        $contradictingCount = count($analysis['contradicting_sources']);

        if ($confidence === 'high' && $supportingCount > $contradictingCount) {
            return 'verified';
        }

        if ($contradictingCount > $supportingCount) {
            return 'disputed';
        }

        return 'unknown';
    }

    /**
     * Générer une recommandation
     */
    protected function generateRecommendation(string $status, string $confidence): string
    {
        if ($status === 'verified' && $confidence === 'high') {
            return 'OK to use';
        }

        if ($status === 'disputed') {
            return 'Do not use';
        }

        return 'Needs review';
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Trouver l'élément le plus commun dans un array
     */
    protected function findMostCommon(array $items): mixed
    {
        if (empty($items)) {
            return null;
        }

        $counts = array_count_values($items);
        arsort($counts);
        
        return array_key_first($counts);
    }
}