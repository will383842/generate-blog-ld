<?php

namespace App\Services\Content;

use App\Models\Platform;
use App\Models\PlatformKnowledge;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class PlatformKnowledgeService
{
    /**
     * Récupère le contexte de connaissance pour injection dans un prompt
     *
     * @param Platform $platform
     * @param string $languageCode
     * @param string $contentType (articles, landings, comparatives, pillars, press)
     * @return string
     */
    public function getKnowledgeContext(
        Platform $platform,
        string $languageCode,
        string $contentType
    ): string {
        // Récupérer les connaissances actives pour cette plateforme/langue/type
        $knowledge = PlatformKnowledge::where('platform_id', $platform->id)
            ->where('language_code', $languageCode)
            ->active()
            ->forContentType($contentType)
            ->orderedByTypePriority()
            ->get();
        
        if ($knowledge->isEmpty()) {
            Log::warning("Aucune knowledge trouvée pour platform {$platform->id}, lang {$languageCode}, type {$contentType}");
            return '';
        }
        
        return $this->formatKnowledgeForPrompt($platform, $knowledge);
    }

    /**
     * Formate les connaissances pour injection dans un prompt GPT
     *
     * @param Platform $platform
     * @param Collection $knowledge
     * @return string
     */
    public function formatKnowledgeForPrompt(Platform $platform, Collection $knowledge): string
    {
        $formatted = "# INFORMATIONS ESSENTIELLES SUR {$platform->name}\n";
        $formatted .= "⚠️ CRITIQUE : Ces informations DOIVENT être respectées à 100%. Aucune erreur tolérée.\n\n";
        
        // Grouper par type
        $groupedByType = $knowledge->groupBy('knowledge_type');
        
        // Ordre de priorité des sections
        $typeOrder = PlatformKnowledge::TYPE_PRIORITY_ORDER;
        
        foreach ($typeOrder as $type) {
            if (!isset($groupedByType[$type])) {
                continue;
            }
            
            $items = $groupedByType[$type];
            $sectionTitle = $this->getSectionTitle($type);
            
            $formatted .= "## {$sectionTitle}\n";
            
            foreach ($items as $item) {
                if ($item->title && $item->title !== $sectionTitle) {
                    $formatted .= "### {$item->title}\n";
                }
                $formatted .= $item->content . "\n\n";
            }
        }
        
        $formatted .= "---\n";
        $formatted .= "⚠️ RAPPEL : Respectez scrupuleusement ces informations. Vérifiez tous les chiffres.\n\n";
        
        return $formatted;
    }

    /**
     * Valide si un contenu respecte les règles de la plateforme
     *
     * @param string $content
     * @param Platform $platform
     * @param string $languageCode
     * @return array ['valid' => bool, 'score' => int, 'errors' => array, 'warnings' => array]
     */
    public function validateContent(
        string $content,
        Platform $platform,
        string $languageCode
    ): array {
        $errors = [];
        $warnings = [];
        $score = 100;
        
        // Récupérer les facts pour cette plateforme/langue
        $facts = PlatformKnowledge::where('platform_id', $platform->id)
            ->where('language_code', $languageCode)
            ->where('knowledge_type', 'facts')
            ->first();
        
        if ($facts) {
            $requiredFacts = $this->parseRequiredFacts($facts->content, $languageCode);
            
            foreach ($requiredFacts as $fact) {
                if (!str_contains($content, $fact)) {
                    $errors[] = "Chiffre clé manquant : '{$fact}'";
                    $score -= 20;
                }
            }
        }
        
        // Vérifier le vocabulaire interdit
        $vocabulary = PlatformKnowledge::where('platform_id', $platform->id)
            ->where('language_code', $languageCode)
            ->where('knowledge_type', 'vocabulary')
            ->first();
        
        if ($vocabulary) {
            $forbiddenWords = $this->parseForbiddenWords($vocabulary->content, $languageCode);
            
            foreach ($forbiddenWords as $word) {
                if (str_contains(strtolower($content), strtolower($word))) {
                    $errors[] = "Vocabulaire interdit trouvé : '{$word}'";
                    $score -= 15;
                }
            }
        }
        
        // Vérifier la présence du nom de la plateforme
        if (!str_contains($content, $platform->name)) {
            $warnings[] = "Nom de la plateforme absent du contenu";
            $score -= 5;
        }
        
        // Vérifier les don'ts
        $donts = PlatformKnowledge::where('platform_id', $platform->id)
            ->where('language_code', $languageCode)
            ->where('knowledge_type', 'donts')
            ->first();
        
        if ($donts) {
            // Vérification basique des phrases trop longues
            $sentences = preg_split('/[.!?]+/', $content);
            foreach ($sentences as $sentence) {
                $wordCount = str_word_count($sentence);
                if ($wordCount > 25) {
                    $warnings[] = "Phrase trop longue détectée ({$wordCount} mots)";
                    $score -= 2;
                }
            }
        }
        
        $score = max(0, min(100, $score));
        
        return [
            'valid' => $score >= 70,
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * Extrait les faits obligatoires depuis le contenu facts
     *
     * @param string $factsContent
     * @param string $languageCode
     * @return array
     */
    public function parseRequiredFacts(string $factsContent, string $languageCode): array
    {
        $facts = [];
        
        // Extraction basée sur les patterns communs
        $patterns = [
            '/(\d+\s*(?:million|milli|млн|مليون|百万)[^\n]*)/iu',
            '/(\d+\s*(?:pays|countries|países|Länder|国家|دولة)[^\n]*)/iu',
            '/([<\d]+\s*(?:minutes?|minutos?|Minuten|分钟|دقائق)[^\n]*)/iu',
            '/(\d+[+\s]*(?:avocat|lawyer|abogado|Anwalt|律师|محامٍ)[^\n]*)/iu',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $factsContent, $matches)) {
                foreach ($matches[1] as $match) {
                    $facts[] = trim($match);
                }
            }
        }
        
        return array_unique($facts);
    }

    /**
     * Parse les mots interdits depuis le vocabulaire
     *
     * @param string $vocabularyContent
     * @param string $languageCode
     * @return array
     */
    private function parseForbiddenWords(string $vocabularyContent, string $languageCode): array
    {
        $forbidden = [];
        
        // Chercher la section "JAMAIS" ou "NEVER"
        $keywords = ['JAMAIS', 'NEVER', 'NUNCA', 'NIEMALS', '从不', 'أبدا'];
        
        foreach ($keywords as $keyword) {
            if (str_contains($vocabularyContent, $keyword)) {
                // Extraire les lignes après le keyword
                $lines = explode("\n", $vocabularyContent);
                $capturing = false;
                
                foreach ($lines as $line) {
                    if (str_contains($line, $keyword)) {
                        $capturing = true;
                        continue;
                    }
                    
                    if ($capturing && trim($line)) {
                        // Extraire les mots entre quotes ou après •
                        if (preg_match_all("/['\"]([^'\"]+)['\"]/", $line, $matches)) {
                            $forbidden = array_merge($forbidden, $matches[1]);
                        } elseif (preg_match('/•\s*(.+)/', $line, $match)) {
                            $word = trim($match[1]);
                            $word = preg_replace('/,.*$/', '', $word); // Enlever tout après virgule
                            $forbidden[] = $word;
                        }
                    }
                    
                    // Stop si ligne vide ou nouveau keyword
                    if ($capturing && !trim($line)) {
                        break;
                    }
                }
            }
        }
        
        return array_unique(array_filter($forbidden));
    }

    /**
     * Retourne le titre de section traduit
     *
     * @param string $type
     * @return string
     */
    private function getSectionTitle(string $type): string
    {
        $titles = [
            'facts' => 'FAITS ET CHIFFRES OBLIGATOIRES',
            'about' => 'À PROPOS',
            'services' => 'SERVICES',
            'differentiators' => 'DIFFÉRENCIATEURS CLÉS',
            'tone' => 'TON ET COMMUNICATION',
            'style' => 'STYLE RÉDACTIONNEL',
            'vocabulary' => 'VOCABULAIRE',
            'examples' => 'EXEMPLES',
            'donts' => 'INTERDICTIONS',
            'values' => 'VALEURS',
        ];
        
        return $titles[$type] ?? strtoupper($type);
    }

    /**
     * Traduit automatiquement une entrée knowledge vers toutes les langues
     *
     * @param PlatformKnowledge $knowledge
     * @param array $targetLanguages
     * @return array
     */
    public function translateKnowledge(PlatformKnowledge $knowledge, array $targetLanguages): array
    {
        // TODO: Implémenter avec TranslationService
        // Pour l'instant, retourner vide
        return [];
    }
}