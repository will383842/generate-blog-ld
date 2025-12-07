<?php

namespace App\Services\Content;

use App\Models\ContentTemplate;
use Illuminate\Support\Facades\Cache;

/**
 * TemplateDetectorService - Version utilisant ContentTemplate
 * 
 * Détecte automatiquement le meilleur template basé sur le titre/description
 * et récupère la configuration depuis la table content_templates.
 * 
 * MIGRATION depuis l'ancienne version :
 * - Les keywords de détection restent en code (logique de matching)
 * - Les configs (word_count, structure) viennent de ContentTemplate
 */
class TemplateDetectorService
{
    /**
     * Templates disponibles avec leurs mots-clés de détection
     * Mappés vers les slugs de ContentTemplate
     */
    protected array $templateKeywords = [
        // Articles
        'guide_ultime' => [
            'keywords' => ['guide ultime', 'guide complet', 'guide définitif', 'tout savoir', 'ultimate guide'],
            'priority' => 10,
            'type' => 'pillar',
            'variant' => 'guide_ultime',
        ],
        'guide_pratique' => [
            'keywords' => ['guide', 'comment', 'tutoriel', 'étapes', 'procédure', 'how to', 'step by step'],
            'priority' => 8,
            'type' => 'article',
            'variant' => 'guide_pratique',
        ],
        'liste_top_n' => [
            'keywords' => ['top 10', 'top 5', 'meilleurs', 'meilleures', 'classement', 'ranking', 'best'],
            'priority' => 9,
            'type' => 'article',
            'variant' => 'liste_top_n',
        ],
        'comparatif' => [
            'keywords' => ['vs', 'versus', 'comparaison', 'compare', 'différence', 'comparison'],
            'priority' => 9,
            'type' => 'comparative',
            'variant' => 'standard',
        ],
        'analyse_approfondie' => [
            'keywords' => ['analyse', 'étude', 'examen', 'investigation', 'analysis', 'study'],
            'priority' => 7,
            'type' => 'article',
            'variant' => 'analyse_approfondie',
        ],
        'faq_complete' => [
            'keywords' => ['faq', 'questions', 'réponses', 'q&a', 'frequently asked'],
            'priority' => 6,
            'type' => 'article',
            'variant' => 'faq_complete',
        ],
        'storytelling' => [
            'keywords' => ['histoire', 'témoignage', 'expérience', 'récit', 'story', 'testimonial'],
            'priority' => 5,
            'type' => 'article',
            'variant' => 'storytelling',
        ],
        'actualite' => [
            'keywords' => ['actualité', 'news', 'récent', 'nouveau', 'dernière', 'latest'],
            'priority' => 4,
            'type' => 'article',
            'variant' => 'actualite',
        ],
        'checklist' => [
            'keywords' => ['checklist', 'liste', 'vérification', 'à faire', 'todo'],
            'priority' => 6,
            'type' => 'article',
            'variant' => 'checklist',
        ],
    ];

    protected string $defaultTemplateCode = 'guide_pratique';

    protected TemplateManager $templateManager;

    public function __construct(TemplateManager $templateManager)
    {
        $this->templateManager = $templateManager;
    }

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

        foreach ($this->templateKeywords as $templateCode => $config) {
            $score = 0;
            
            foreach ($config['keywords'] as $keyword) {
                if (str_contains($text, $keyword)) {
                    $score = $config['priority'];
                    break;
                }
            }
            
            if ($score > 0) {
                $matches[$templateCode] = $score;
            }
        }

        if (empty($matches)) {
            return $this->defaultTemplateCode;
        }

        arsort($matches);
        return array_key_first($matches);
    }

    /**
     * Obtient le ContentTemplate correspondant au code détecté
     *
     * @param string $templateCode Code du template (ex: 'guide_pratique')
     * @param string $languageCode Code langue (ex: 'fr')
     * @return ContentTemplate|null
     */
    public function getContentTemplate(string $templateCode, string $languageCode = 'fr'): ?ContentTemplate
    {
        $config = $this->templateKeywords[$templateCode] ?? $this->templateKeywords[$this->defaultTemplateCode];
        
        $type = $config['type'];
        $variant = $config['variant'];
        
        // Construire le slug du template
        $slug = "{$type}-{$variant}-{$languageCode}";
        
        return $this->templateManager->getBySlug($slug);
    }

    /**
     * Détecte ET récupère le ContentTemplate en une seule opération
     *
     * @param string $title Titre
     * @param string $languageCode Code langue
     * @param string|null $description Description optionnelle
     * @return ContentTemplate|null
     */
    public function detectAndGetTemplate(string $title, string $languageCode = 'fr', ?string $description = null): ?ContentTemplate
    {
        $templateCode = $this->detectOptimalTemplate($title, $description);
        return $this->getContentTemplate($templateCode, $languageCode);
    }

    /**
     * Obtient la configuration d'un template (depuis ContentTemplate)
     *
     * @param string $templateCode Code du template
     * @param string $languageCode Code langue
     * @return array Configuration du template
     */
    public function getTemplateConfig(string $templateCode, string $languageCode = 'fr'): array
    {
        $template = $this->getContentTemplate($templateCode, $languageCode);
        
        if (!$template) {
            // Fallback sur config hardcodée si template non trouvé
            return $this->getFallbackConfig($templateCode);
        }

        return [
            'name' => $template->name,
            'word_count' => [
                $template->word_count_min ?? 800,
                $template->word_count_max ?? 1500,
            ],
            'word_count_target' => $template->word_count_target,
            'structure' => $template->structure ?? [],
            'faq_count' => $template->faq_count,
            'model' => $template->model,
            'max_tokens' => $template->max_tokens,
            'temperature' => $template->temperature,
            'generator' => $this->getGeneratorClass($templateCode),
            'template_id' => $template->id,
            'template_slug' => $template->slug,
        ];
    }

    /**
     * Config de fallback si le template n'existe pas encore en BDD
     */
    protected function getFallbackConfig(string $templateCode): array
    {
        $configs = [
            'guide_ultime' => [
                'name' => 'Guide Ultime',
                'word_count' => [3000, 5000],
                'word_count_target' => 4000,
                'structure' => ['sections' => '8-12', 'with_toc' => true, 'with_faq' => true],
                'faq_count' => 12,
                'generator' => 'PillarArticleGenerator',
            ],
            'guide_pratique' => [
                'name' => 'Guide Pratique',
                'word_count' => [800, 1500],
                'word_count_target' => 1200,
                'structure' => ['sections' => '5-8', 'with_toc' => false, 'with_faq' => true],
                'faq_count' => 8,
                'generator' => 'ArticleGenerator',
            ],
            'liste_top_n' => [
                'name' => 'Liste Top N',
                'word_count' => [1000, 1800],
                'word_count_target' => 1400,
                'structure' => ['sections' => 'dynamic', 'with_toc' => true],
                'faq_count' => 6,
                'generator' => 'ArticleGenerator',
            ],
            'comparatif' => [
                'name' => 'Comparatif',
                'word_count' => [1200, 2000],
                'word_count_target' => 1600,
                'structure' => ['sections' => '6-10', 'with_toc' => true, 'with_comparison_table' => true],
                'faq_count' => 6,
                'generator' => 'ComparativeGenerator',
            ],
            'analyse_approfondie' => [
                'name' => 'Analyse Approfondie',
                'word_count' => [1500, 2500],
                'word_count_target' => 2000,
                'structure' => ['sections' => '7-10', 'with_toc' => true, 'with_research' => true],
                'faq_count' => 8,
                'generator' => 'ArticleGenerator',
            ],
            'faq_complete' => [
                'name' => 'FAQ Complète',
                'word_count' => [800, 1200],
                'word_count_target' => 1000,
                'structure' => ['format' => 'faq'],
                'faq_count' => 15,
                'generator' => 'ArticleGenerator',
            ],
            'storytelling' => [
                'name' => 'Storytelling',
                'word_count' => [1000, 1500],
                'word_count_target' => 1200,
                'structure' => ['sections' => '5-7', 'format' => 'narrative'],
                'faq_count' => 4,
                'generator' => 'ArticleGenerator',
            ],
            'actualite' => [
                'name' => 'Actualité',
                'word_count' => [600, 1000],
                'word_count_target' => 800,
                'structure' => ['sections' => '4-6', 'with_research' => true],
                'faq_count' => 3,
                'generator' => 'ArticleGenerator',
            ],
            'checklist' => [
                'name' => 'Checklist',
                'word_count' => [800, 1200],
                'word_count_target' => 1000,
                'structure' => ['format' => 'checklist', 'with_toc' => true],
                'faq_count' => 5,
                'generator' => 'ArticleGenerator',
            ],
        ];

        return $configs[$templateCode] ?? $configs[$this->defaultTemplateCode];
    }

    /**
     * Obtient la liste de tous les templates disponibles
     */
    public function getAvailableTemplates(): array
    {
        return array_keys($this->templateKeywords);
    }

    /**
     * Vérifie si un template existe
     */
    public function templateExists(string $templateCode): bool
    {
        return isset($this->templateKeywords[$templateCode]);
    }

    /**
     * Obtient le générateur approprié pour un template
     */
    public function getGeneratorClass(string $templateCode): string
    {
        $mapping = [
            'guide_ultime' => 'PillarArticleGenerator',
            'guide_pratique' => 'ArticleGenerator',
            'liste_top_n' => 'ArticleGenerator',
            'comparatif' => 'ComparativeGenerator',
            'analyse_approfondie' => 'ArticleGenerator',
            'faq_complete' => 'ArticleGenerator',
            'storytelling' => 'ArticleGenerator',
            'actualite' => 'ArticleGenerator',
            'checklist' => 'ArticleGenerator',
        ];

        return $mapping[$templateCode] ?? 'ArticleGenerator';
    }

    /**
     * Obtient le type de contenu pour un template
     */
    public function getContentType(string $templateCode): string
    {
        return $this->templateKeywords[$templateCode]['type'] ?? 'article';
    }

    /**
     * Obtient la variante pour un template
     */
    public function getVariant(string $templateCode): string
    {
        return $this->templateKeywords[$templateCode]['variant'] ?? 'guide_pratique';
    }

    /**
     * Obtient tous les templates d'un certain type
     */
    public function getTemplatesByType(string $type): array
    {
        return array_filter($this->templateKeywords, fn($config) => $config['type'] === $type);
    }
}
