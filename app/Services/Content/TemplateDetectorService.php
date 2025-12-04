<?php

namespace App\Services\Content;

class TemplateDetectorService
{
    /**
     * Templates disponibles avec leurs mots-clés
     */
    protected array $templateKeywords = [
        'guide_ultime' => [
            'keywords' => ['guide ultime', 'guide complet', 'guide définitif', 'tout savoir', 'ultimate guide'],
            'priority' => 10, // Haute priorité
        ],
        'guide_pratique' => [
            'keywords' => ['guide', 'comment', 'tutoriel', 'étapes', 'procédure', 'how to', 'step by step'],
            'priority' => 8,
        ],
        'liste_top_n' => [
            'keywords' => ['top 10', 'top 5', 'meilleurs', 'meilleures', 'classement', 'ranking', 'best'],
            'priority' => 9,
        ],
        'comparatif' => [
            'keywords' => ['vs', 'versus', 'comparaison', 'compare', 'différence', 'comparison'],
            'priority' => 9,
        ],
        'analyse_approfondie' => [
            'keywords' => ['analyse', 'étude', 'examen', 'investigation', 'analysis', 'study'],
            'priority' => 7,
        ],
        'faq_complete' => [
            'keywords' => ['faq', 'questions', 'réponses', 'q&a', 'frequently asked'],
            'priority' => 6,
        ],
        'storytelling' => [
            'keywords' => ['histoire', 'témoignage', 'expérience', 'récit', 'story', 'testimonial'],
            'priority' => 5,
        ],
        'actualite' => [
            'keywords' => ['actualité', 'news', 'récent', 'nouveau', 'dernière', 'latest'],
            'priority' => 4,
        ],
    ];

    /**
     * Templates par défaut si aucune détection
     */
    protected string $defaultTemplate = 'guide_pratique';

    /**
     * Détecte le template optimal basé sur le titre et la description
     *
     * @param string $title Titre de l'article
     * @param string|null $description Description optionnelle
     * @return string Code du template détecté
     */
    public function detectOptimalTemplate(string $title, ?string $description = null): string
    {
        $text = strtolower($title);
        
        if ($description) {
            $text .= ' ' . strtolower($description);
        }

        $matches = [];

        // Recherche de correspondances pour chaque template
        foreach ($this->templateKeywords as $template => $config) {
            $score = 0;
            
            foreach ($config['keywords'] as $keyword) {
                if (str_contains($text, $keyword)) {
                    // Score = priorité du template
                    $score = $config['priority'];
                    break;
                }
            }
            
            if ($score > 0) {
                $matches[$template] = $score;
            }
        }

        // Si aucune correspondance, retourner template par défaut
        if (empty($matches)) {
            return $this->defaultTemplate;
        }

        // Retourner le template avec le score le plus élevé
        arsort($matches);
        return array_key_first($matches);
    }

    /**
     * Obtient la configuration d'un template
     *
     * @param string $templateCode Code du template
     * @return array Configuration du template
     */
    public function getTemplateConfig(string $templateCode): array
    {
        $configs = [
            'guide_ultime' => [
                'name' => 'Guide Ultime',
                'word_count' => [3000, 5000],
                'structure' => [
                    'sections' => 8-12,
                    'with_toc' => true,
                    'with_faq' => true,
                    'with_research' => true,
                ],
                'estimated_time' => 180, // minutes
                'estimated_cost' => 0.50, // dollars
                'generator' => 'PillarArticleGenerator',
            ],
            'guide_pratique' => [
                'name' => 'Guide Pratique',
                'word_count' => [800, 1500],
                'structure' => [
                    'sections' => 5-8,
                    'with_toc' => false,
                    'with_faq' => true,
                    'with_research' => false,
                ],
                'estimated_time' => 15, // minutes
                'estimated_cost' => 0.05,
                'generator' => 'ArticleGenerator',
            ],
            'liste_top_n' => [
                'name' => 'Liste Top N',
                'word_count' => [1000, 1800],
                'structure' => [
                    'sections' => 'dynamic', // 5-15 items
                    'with_toc' => true,
                    'with_faq' => false,
                    'with_research' => false,
                ],
                'estimated_time' => 20,
                'estimated_cost' => 0.07,
                'generator' => 'ArticleGenerator',
            ],
            'comparatif' => [
                'name' => 'Comparatif',
                'word_count' => [1200, 2000],
                'structure' => [
                    'sections' => 6-10,
                    'with_toc' => true,
                    'with_faq' => true,
                    'with_research' => false,
                    'with_comparison_table' => true,
                ],
                'estimated_time' => 25,
                'estimated_cost' => 0.08,
                'generator' => 'ComparativeGenerator',
            ],
            'analyse_approfondie' => [
                'name' => 'Analyse Approfondie',
                'word_count' => [1500, 2500],
                'structure' => [
                    'sections' => 7-10,
                    'with_toc' => true,
                    'with_faq' => true,
                    'with_research' => true,
                ],
                'estimated_time' => 40,
                'estimated_cost' => 0.12,
                'generator' => 'ArticleGenerator',
            ],
            'faq_complete' => [
                'name' => 'FAQ Complète',
                'word_count' => [800, 1200],
                'structure' => [
                    'sections' => 'faq', // Format spécial FAQ
                    'with_toc' => false,
                    'with_faq' => true,
                    'with_research' => false,
                ],
                'estimated_time' => 12,
                'estimated_cost' => 0.04,
                'generator' => 'ArticleGenerator',
            ],
            'storytelling' => [
                'name' => 'Storytelling',
                'word_count' => [1000, 1500],
                'structure' => [
                    'sections' => 5-7,
                    'with_toc' => false,
                    'with_faq' => false,
                    'with_research' => false,
                ],
                'estimated_time' => 18,
                'estimated_cost' => 0.06,
                'generator' => 'ArticleGenerator',
            ],
            'actualite' => [
                'name' => 'Actualité',
                'word_count' => [600, 1000],
                'structure' => [
                    'sections' => 4-6,
                    'with_toc' => false,
                    'with_faq' => false,
                    'with_research' => true,
                ],
                'estimated_time' => 10,
                'estimated_cost' => 0.03,
                'generator' => 'ArticleGenerator',
            ],
        ];

        return $configs[$templateCode] ?? $configs[$this->defaultTemplate];
    }

    /**
     * Obtient la liste de tous les templates disponibles
     *
     * @return array Liste des templates
     */
    public function getAvailableTemplates(): array
    {
        return array_keys($this->templateKeywords);
    }

    /**
     * Vérifie si un template existe
     *
     * @param string $templateCode Code du template
     * @return bool
     */
    public function templateExists(string $templateCode): bool
    {
        return isset($this->templateKeywords[$templateCode]);
    }

    /**
     * Obtient le générateur approprié pour un template
     *
     * @param string $templateCode Code du template
     * @return string Nom de la classe du générateur
     */
    public function getGeneratorClass(string $templateCode): string
    {
        $config = $this->getTemplateConfig($templateCode);
        return $config['generator'];
    }
}