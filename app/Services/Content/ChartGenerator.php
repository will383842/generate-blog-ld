<?php

namespace App\Services\Content;

/**
 * ChartGenerator - Générateur de graphiques et tableaux pour comparatifs
 * 
 * Génère des visualisations SVG inline et tableaux HTML responsives
 * pour articles comparatifs sans dépendance externe.
 * 
 * Fonctionnalités :
 * - Graphiques en barres horizontales (SVG)
 * - Tableaux comparatifs avec couleurs et scores
 * - Support RTL (arabe)
 * - Responsive mobile-first
 * - Accessibilité ARIA
 * 
 * @package App\Services\Content
 */
class ChartGenerator
{
    // Configuration des couleurs
    protected array $scoreColors = [
        'excellent' => ['bg' => '#10b981', 'text' => '#ffffff'], // Vert (9-10)
        'very_good' => ['bg' => '#3b82f6', 'text' => '#ffffff'], // Bleu (7.5-8.9)
        'good' => ['bg' => '#8b5cf6', 'text' => '#ffffff'],      // Violet (6-7.4)
        'average' => ['bg' => '#f59e0b', 'text' => '#ffffff'],   // Orange (4-5.9)
        'poor' => ['bg' => '#ef4444', 'text' => '#ffffff'],      // Rouge (0-3.9)
    ];

    /**
     * Générer graphique en barres horizontales (SVG inline)
     * 
     * @param array  $competitors  Liste des concurrents avec scores
     * @param string $languageCode Code langue pour labels
     * @return string SVG du graphique
     */
    public function generateBarChartSvg(array $competitors, string $languageCode): string
    {
        $width = 800;
        $height = 60 + (count($competitors) * 60);
        $maxScore = 10;
        $barHeight = 40;
        $spacing = 60;
        $leftMargin = 200;
        $rightMargin = 100;
        $chartWidth = $width - $leftMargin - $rightMargin;

        // Direction RTL pour arabe
        $isRtl = $languageCode === 'ar';
        $textAnchor = $isRtl ? 'end' : 'start';
        $nameX = $isRtl ? ($width - 20) : 20;

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" ';
        $svg .= 'viewBox="0 0 ' . $width . ' ' . $height . '" ';
        $svg .= 'class="comparative-bar-chart" ';
        $svg .= 'role="img" ';
        $svg .= 'aria-label="' . $this->getTranslation('bar_chart_label', $languageCode) . '">';
        
        // Titre
        $svg .= '<text x="' . ($width / 2) . '" y="30" ';
        $svg .= 'text-anchor="middle" ';
        $svg .= 'font-size="18" ';
        $svg .= 'font-weight="bold" ';
        $svg .= 'fill="#1f2937">';
        $svg .= $this->getTranslation('overall_scores', $languageCode);
        $svg .= '</text>';

        foreach ($competitors as $index => $competitor) {
            $y = 60 + ($index * $spacing);
            $score = $competitor['overall_score'];
            $barWidth = ($score / $maxScore) * $chartWidth;
            $barX = $isRtl ? ($width - $leftMargin - $barWidth) : $leftMargin;
            $scoreX = $isRtl ? ($barX - 10) : ($barX + $barWidth + 10);
            $scoreAnchor = $isRtl ? 'end' : 'start';

            // Nom du concurrent
            $svg .= '<text x="' . $nameX . '" y="' . ($y + ($barHeight / 2) + 5) . '" ';
            $svg .= 'text-anchor="' . $textAnchor . '" ';
            $svg .= 'font-size="14" ';
            $svg .= 'fill="#374151">';
            $svg .= htmlspecialchars($competitor['name']);
            $svg .= '</text>';

            // Barre de score
            $color = $this->getScoreColor($score);
            $svg .= '<rect x="' . $barX . '" y="' . $y . '" ';
            $svg .= 'width="' . $barWidth . '" height="' . $barHeight . '" ';
            $svg .= 'fill="' . $color . '" ';
            $svg .= 'rx="4" />';

            // Score numérique
            $svg .= '<text x="' . $scoreX . '" y="' . ($y + ($barHeight / 2) + 5) . '" ';
            $svg .= 'text-anchor="' . $scoreAnchor . '" ';
            $svg .= 'font-size="16" ';
            $svg .= 'font-weight="bold" ';
            $svg .= 'fill="#1f2937">';
            $svg .= number_format($score, 1) . '/10';
            $svg .= '</text>';
        }

        $svg .= '</svg>';

        return $svg;
    }

    /**
     * Générer tableau comparatif HTML responsive
     * 
     * @param array  $competitors  Liste des concurrents avec scores
     * @param array  $criteria     Critères de comparaison
     * @param string $languageCode Code langue
     * @return string HTML du tableau
     */
    public function generateComparisonTableHtml(
        array $competitors,
        array $criteria,
        string $languageCode
    ): string {
        $isRtl = $languageCode === 'ar';
        $dirAttr = $isRtl ? ' dir="rtl"' : '';

        $html = '<div class="comparison-table-wrapper"' . $dirAttr . '>';
        $html .= '<h2>' . $this->getTranslation('detailed_comparison', $languageCode) . '</h2>';
        
        $html .= '<div class="table-responsive">';
        $html .= '<table class="comparison-table">';
        
        // En-tête
        $html .= '<thead>';
        $html .= '<tr>';
        $html .= '<th>' . $this->getTranslation('criteria', $languageCode) . '</th>';
        
        foreach ($competitors as $competitor) {
            $html .= '<th>' . htmlspecialchars($competitor['name']) . '</th>';
        }
        
        $html .= '</tr>';
        $html .= '</thead>';
        
        // Corps du tableau - Critères
        $html .= '<tbody>';
        
        foreach ($criteria as $criterion) {
            $html .= '<tr>';
            $html .= '<td class="criterion-name">';
            $html .= '<strong>' . htmlspecialchars($criterion['name']) . '</strong>';
            
            if (!empty($criterion['description'])) {
                $html .= '<br><small>' . htmlspecialchars($criterion['description']) . '</small>';
            }
            
            $html .= '</td>';
            
            foreach ($competitors as $competitor) {
                $criterionKey = $criterion['key'];
                $score = $competitor['scores'][$criterionKey] ?? 0;
                
                $html .= '<td class="score-cell">';
                $html .= $this->renderScoreBadge($score, $languageCode);
                $html .= '</td>';
            }
            
            $html .= '</tr>';
        }
        
        // Ligne score global
        $html .= '<tr class="overall-score-row">';
        $html .= '<td><strong>' . $this->getTranslation('overall_score', $languageCode) . '</strong></td>';
        
        foreach ($competitors as $competitor) {
            $html .= '<td class="score-cell">';
            $html .= $this->renderScoreBadge($competitor['overall_score'], $languageCode, true);
            $html .= '</td>';
        }
        
        $html .= '</tr>';
        
        // Ligne prix
        $html .= '<tr class="price-row">';
        $html .= '<td><strong>' . $this->getTranslation('price', $languageCode) . '</strong></td>';
        
        foreach ($competitors as $competitor) {
            $html .= '<td class="price-cell">';
            $html .= '<strong>' . htmlspecialchars($competitor['price']) . '</strong>';
            $html .= '</td>';
        }
        
        $html .= '</tr>';
        
        $html .= '</tbody>';
        $html .= '</table>';
        $html .= '</div>';
        
        // Légende des couleurs
        $html .= $this->generateColorLegend($languageCode);
        
        $html .= '</div>';

        return $html;
    }

    /**
     * Générer badge de score avec couleur
     * 
     * @param float  $score        Score (0-10)
     * @param string $languageCode Code langue
     * @param bool   $large        Taille large pour score global
     * @return string HTML du badge
     */
    private function renderScoreBadge(float $score, string $languageCode, bool $large = false): string
    {
        $category = $this->getScoreCategory($score);
        $colors = $this->scoreColors[$category];
        $sizeClass = $large ? 'score-badge-large' : 'score-badge';
        
        $html = '<span class="' . $sizeClass . '" ';
        $html .= 'style="background-color: ' . $colors['bg'] . '; color: ' . $colors['text'] . ';" ';
        $html .= 'aria-label="' . $this->getTranslation('score', $languageCode) . ': ' . $score . '">';
        $html .= '<strong>' . number_format($score, 1) . '</strong>/10';
        $html .= '</span>';

        return $html;
    }

    /**
     * Générer légende des couleurs
     * 
     * @param string $languageCode Code langue
     * @return string HTML de la légende
     */
    private function generateColorLegend(string $languageCode): string
    {
        $html = '<div class="score-legend">';
        $html .= '<h4>' . $this->getTranslation('legend', $languageCode) . '</h4>';
        $html .= '<div class="legend-items">';
        
        $labels = [
            'excellent' => ['min' => 9.0, 'max' => 10],
            'very_good' => ['min' => 7.5, 'max' => 8.9],
            'good' => ['min' => 6.0, 'max' => 7.4],
            'average' => ['min' => 4.0, 'max' => 5.9],
            'poor' => ['min' => 0, 'max' => 3.9],
        ];
        
        foreach ($labels as $category => $range) {
            $colors = $this->scoreColors[$category];
            
            $html .= '<div class="legend-item">';
            $html .= '<span class="legend-color" style="background-color: ' . $colors['bg'] . ';"></span>';
            $html .= '<span class="legend-label">';
            $html .= $this->getTranslation($category, $languageCode);
            $html .= ' (' . $range['min'] . '-' . $range['max'] . ')';
            $html .= '</span>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Obtenir catégorie de score
     * 
     * @param float $score Score (0-10)
     * @return string Catégorie
     */
    private function getScoreCategory(float $score): string
    {
        if ($score >= 9.0) return 'excellent';
        if ($score >= 7.5) return 'very_good';
        if ($score >= 6.0) return 'good';
        if ($score >= 4.0) return 'average';
        return 'poor';
    }

    /**
     * Obtenir couleur de score
     * 
     * @param float $score Score (0-10)
     * @return string Couleur hex
     */
    private function getScoreColor(float $score): string
    {
        $category = $this->getScoreCategory($score);
        return $this->scoreColors[$category]['bg'];
    }

    /**
     * Obtenir traductions selon langue
     * 
     * @param string $key          Clé de traduction
     * @param string $languageCode Code langue
     * @return string Traduction
     */
    private function getTranslation(string $key, string $languageCode): string
    {
        $translations = [
            'bar_chart_label' => [
                'fr' => 'Graphique des scores globaux',
                'en' => 'Overall scores chart',
                'de' => 'Gesamtbewertungen Diagramm',
                'es' => 'Gráfico de puntuaciones globales',
                'pt' => 'Gráfico de pontuações gerais',
                'ru' => 'График общих оценок',
                'zh' => '总分图表',
                'ar' => 'مخطط النتائج الإجمالية',
                'hi' => 'कुल स्कोर चार्ट',
            ],
            'overall_scores' => [
                'fr' => 'Notes globales',
                'en' => 'Overall Scores',
                'de' => 'Gesamtbewertungen',
                'es' => 'Puntuaciones Globales',
                'pt' => 'Pontuações Gerais',
                'ru' => 'Общие Оценки',
                'zh' => '总分',
                'ar' => 'النتائج الإجمالية',
                'hi' => 'कुल स्कोर',
            ],
            'detailed_comparison' => [
                'fr' => 'Comparaison détaillée',
                'en' => 'Detailed Comparison',
                'de' => 'Detaillierter Vergleich',
                'es' => 'Comparación Detallada',
                'pt' => 'Comparação Detalhada',
                'ru' => 'Подробное Сравнение',
                'zh' => '详细对比',
                'ar' => 'مقارنة تفصيلية',
                'hi' => 'विस्तृत तुलना',
            ],
            'criteria' => [
                'fr' => 'Critères',
                'en' => 'Criteria',
                'de' => 'Kriterien',
                'es' => 'Criterios',
                'pt' => 'Critérios',
                'ru' => 'Критерии',
                'zh' => '标准',
                'ar' => 'المعايير',
                'hi' => 'मानदंड',
            ],
            'overall_score' => [
                'fr' => 'Note globale',
                'en' => 'Overall Score',
                'de' => 'Gesamtbewertung',
                'es' => 'Puntuación Global',
                'pt' => 'Pontuação Geral',
                'ru' => 'Общая Оценка',
                'zh' => '总分',
                'ar' => 'النتيجة الإجمالية',
                'hi' => 'कुल स्कोर',
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
            'score' => [
                'fr' => 'Note',
                'en' => 'Score',
                'de' => 'Bewertung',
                'es' => 'Puntuación',
                'pt' => 'Pontuação',
                'ru' => 'Оценка',
                'zh' => '分数',
                'ar' => 'النتيجة',
                'hi' => 'स्कोर',
            ],
            'legend' => [
                'fr' => 'Légende',
                'en' => 'Legend',
                'de' => 'Legende',
                'es' => 'Leyenda',
                'pt' => 'Legenda',
                'ru' => 'Легенда',
                'zh' => '图例',
                'ar' => 'وسيلة الإيضاح',
                'hi' => 'लीजेंड',
            ],
            'excellent' => [
                'fr' => 'Excellent',
                'en' => 'Excellent',
                'de' => 'Ausgezeichnet',
                'es' => 'Excelente',
                'pt' => 'Excelente',
                'ru' => 'Отлично',
                'zh' => '优秀',
                'ar' => 'ممتاز',
                'hi' => 'उत्कृष्ट',
            ],
            'very_good' => [
                'fr' => 'Très bien',
                'en' => 'Very Good',
                'de' => 'Sehr gut',
                'es' => 'Muy Bien',
                'pt' => 'Muito Bom',
                'ru' => 'Очень хорошо',
                'zh' => '非常好',
                'ar' => 'جيد جدا',
                'hi' => 'बहुत अच्छा',
            ],
            'good' => [
                'fr' => 'Bien',
                'en' => 'Good',
                'de' => 'Gut',
                'es' => 'Bien',
                'pt' => 'Bom',
                'ru' => 'Хорошо',
                'zh' => '好',
                'ar' => 'جيد',
                'hi' => 'अच्छा',
            ],
            'average' => [
                'fr' => 'Moyen',
                'en' => 'Average',
                'de' => 'Durchschnittlich',
                'es' => 'Promedio',
                'pt' => 'Médio',
                'ru' => 'Средне',
                'zh' => '一般',
                'ar' => 'متوسط',
                'hi' => 'औसत',
            ],
            'poor' => [
                'fr' => 'Faible',
                'en' => 'Poor',
                'de' => 'Schwach',
                'es' => 'Bajo',
                'pt' => 'Fraco',
                'ru' => 'Слабо',
                'zh' => '差',
                'ar' => 'ضعيف',
                'hi' => 'कमजोर',
            ],
        ];

        return $translations[$key][$languageCode] ?? $translations[$key]['en'];
    }

    /**
     * Générer CSS inline pour les graphiques et tableaux
     * 
     * @return string CSS
     */
    public function generateInlineCss(): string
    {
        return <<<CSS
<style>
/* Tableau comparatif */
.comparison-table-wrapper {
    margin: 2rem 0;
}

.table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.comparison-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.comparison-table thead {
    background-color: #f3f4f6;
}

.comparison-table th,
.comparison-table td {
    padding: 12px;
    text-align: center;
    border: 1px solid #e5e7eb;
}

.comparison-table th:first-child,
.comparison-table td.criterion-name {
    text-align: left;
    font-weight: 500;
}

.comparison-table tr[dir="rtl"] th:first-child,
.comparison-table tr[dir="rtl"] td.criterion-name {
    text-align: right;
}

.overall-score-row {
    background-color: #f9fafb;
    font-weight: 600;
}

.price-row {
    background-color: #fef3c7;
}

/* Badges de score */
.score-badge,
.score-badge-large {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
}

.score-badge-large {
    padding: 8px 16px;
    font-size: 16px;
}

/* Légende */
.score-legend {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 8px;
}

.score-legend h4 {
    margin: 0 0 0.75rem 0;
    font-size: 14px;
    font-weight: 600;
}

.legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.legend-color {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 4px;
}

.legend-label {
    font-size: 13px;
    color: #374151;
}

/* Graphique SVG */
.comparative-bar-chart {
    width: 100%;
    height: auto;
    margin: 2rem 0;
}

/* Podium */
.podium-container {
    margin: 3rem 0;
    text-align: center;
}

.podium-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.podium-item {
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    color: white;
}

.podium-rank-1 {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.podium-rank-2 {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.podium-rank-3 {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.podium-medal {
    font-size: 48px;
    margin-bottom: 0.5rem;
}

.podium-position {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 1rem;
}

.podium-score {
    margin: 1rem 0;
    font-size: 18px;
}

/* Graphique radar */
.radar-chart-container {
    margin: 3rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Points forts/faibles */
.pros-cons-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
}

.pros,
.cons {
    padding: 1.5rem;
    border-radius: 8px;
}

.pros {
    background-color: #ecfdf5;
    border-left: 4px solid #10b981;
}

.cons {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
}

.pros h3,
.cons h3 {
    margin: 0 0 1rem 0;
    font-size: 18px;
}

.pros ul,
.cons ul {
    margin: 0;
    padding-left: 1.5rem;
}

.pros li,
.cons li {
    margin-bottom: 0.5rem;
}

/* Mobile */
@media (max-width: 640px) {
    .comparison-table {
        font-size: 12px;
    }
    
    .comparison-table th,
    .comparison-table td {
        padding: 8px 4px;
    }
    
    .podium-grid {
        grid-template-columns: 1fr;
    }
}
</style>
CSS;
    }
}