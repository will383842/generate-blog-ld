<?php

namespace App\Services\Press;

use App\Models\DossierMedia;
use App\Models\PressDossier;
use Illuminate\Support\Facades\Storage;

/**
 * DossierChartService - Création de graphiques et tableaux pour dossiers de presse
 * 
 * Utilise ChartGeneratorService (QuickChart.io) pour les graphiques
 * Génère des tableaux HTML stylisés
 * Crée des infographies simples
 * 
 * @package App\Services\Press
 */
class DossierChartService
{
    protected ChartGeneratorService $chartGenerator;
    protected CsvParserService $csvParser;

    public function __construct(
        ChartGeneratorService $chartGenerator,
        CsvParserService $csvParser
    ) {
        $this->chartGenerator = $chartGenerator;
        $this->csvParser = $csvParser;
    }

    /**
     * Créer un graphique à partir de données
     *
     * @param array $data Données du graphique
     * @param string $type Type de graphique (bar, line, pie, etc.)
     * @param array $options Options supplémentaires
     * @return string Path du fichier graphique généré
     */
    public function createChartFromData(array $data, string $type = 'bar', array $options = []): string
    {
        return $this->chartGenerator->generateChart($data, $type, $options);
    }

    /**
     * Créer un graphique à partir d'un fichier CSV
     *
     * @param string $csvFilePath Path du fichier CSV dans Storage
     * @param string $labelColumn Nom de la colonne pour les labels
     * @param string $valueColumn Nom de la colonne pour les valeurs
     * @param string $chartType Type de graphique
     * @return array ['chart_path' => string, 'chart_config' => array]
     * @throws \Exception
     */
    public function createChartFromCSV(
        string $csvFilePath,
        string $labelColumn,
        string $valueColumn,
        string $chartType = 'bar'
    ): array {
        // Parser le CSV
        $parsedData = $this->csvParser->parseCSV($csvFilePath);
        
        // Vérifier que les colonnes existent
        if (!in_array($labelColumn, $parsedData['headers'])) {
            throw new \Exception("Colonne de labels '{$labelColumn}' introuvable");
        }
        
        if (!in_array($valueColumn, $parsedData['headers'])) {
            throw new \Exception("Colonne de valeurs '{$valueColumn}' introuvable");
        }
        
        // Extraire les données
        $labels = array_column($parsedData['rows'], $labelColumn);
        $values = array_map('floatval', array_column($parsedData['rows'], $valueColumn));
        
        // Préparer les données pour le graphique
        $chartData = [
            'labels' => $labels,
            'values' => $values,
            'label' => $valueColumn,
            'title' => "{$valueColumn} par {$labelColumn}",
        ];
        
        // Générer le graphique
        $chartPath = $this->chartGenerator->generateChart($chartData, $chartType);
        
        return [
            'chart_path' => $chartPath,
            'chart_config' => [
                'type' => $chartType,
                'label_column' => $labelColumn,
                'value_column' => $valueColumn,
                'data' => $chartData,
            ],
        ];
    }

    /**
     * Créer un tableau HTML stylisé
     *
     * @param array $data Données du tableau (rows + headers)
     * @param array $options Options de style
     * @return string HTML du tableau
     */
    public function createTable(array $data, array $options = []): string
    {
        $headers = $data['headers'] ?? [];
        $rows = $data['rows'] ?? [];
        
        $style = $options['style'] ?? 'default';
        $caption = $options['caption'] ?? null;
        $numbered = $options['numbered'] ?? false;
        
        $html = '<div class="dossier-table-wrapper">';
        $html .= '<table class="dossier-table style-' . $style . '">';
        
        // Caption si fourni
        if ($caption) {
            $html .= '<caption>' . htmlspecialchars($caption) . '</caption>';
        }
        
        // Headers
        $html .= '<thead><tr>';
        
        if ($numbered) {
            $html .= '<th class="col-number">#</th>';
        }
        
        foreach ($headers as $header) {
            $html .= '<th>' . htmlspecialchars($header) . '</th>';
        }
        $html .= '</tr></thead>';
        
        // Body
        $html .= '<tbody>';
        foreach ($rows as $index => $row) {
            $html .= '<tr>';
            
            if ($numbered) {
                $html .= '<td class="col-number">' . ($index + 1) . '</td>';
            }
            
            foreach ($headers as $header) {
                $value = $row[$header] ?? '';
                
                // Détection du type pour formattage
                $formattedValue = $this->formatCellValue($value);
                
                $html .= '<td>' . $formattedValue . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody>';
        
        $html .= '</table>';
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Formater une valeur de cellule
     *
     * @param mixed $value
     * @return string
     */
    protected function formatCellValue($value): string
    {
        if ($value === null || $value === '') {
            return '<span class="cell-empty">-</span>';
        }
        
        // Si c'est un nombre
        if (is_numeric($value)) {
            $floatValue = (float) $value;
            
            // Si c'est un grand nombre
            if (abs($floatValue) >= 1000) {
                return '<span class="cell-number">' . number_format($floatValue, 0, ',', ' ') . '</span>';
            }
            
            // Si c'est un petit nombre avec décimales
            if ($floatValue != (int) $floatValue) {
                return '<span class="cell-number">' . number_format($floatValue, 2, ',', ' ') . '</span>';
            }
            
            return '<span class="cell-number">' . $value . '</span>';
        }
        
        // Si c'est un pourcentage
        if (preg_match('/^(\d+(?:\.\d+)?)\s*%$/', $value, $matches)) {
            return '<span class="cell-percentage">' . htmlspecialchars($value) . '</span>';
        }
        
        // Texte normal
        return htmlspecialchars($value);
    }

    /**
     * Créer une infographie simple
     *
     * @param array $data Données pour l'infographie
     * @param string $template Template d'infographie (stats_card, timeline, comparison, progress, highlight)
     * @return string Path du fichier généré
     */
    public function createInfographic(array $data, string $template = 'stats_card'): string
    {
        $templates = [
            'stats_card' => fn() => $this->createStatsCardInfographic($data),
            'timeline' => fn() => $this->createTimelineInfographic($data),
            'comparison' => fn() => $this->createComparisonInfographic($data),
            'progress' => fn() => $this->createProgressInfographic($data),
            'highlight' => fn() => $this->createHighlightInfographic($data),
        ];

        $generator = $templates[$template] ?? $templates['stats_card'];

        return $generator();
    }

    /**
     * Créer une carte de statistiques
     * Affiche des chiffres clés sous forme de barres horizontales
     *
     * @param array $data ['stats' => ['label' => value, ...], 'title' => '...']
     * @return string Path
     */
    protected function createStatsCardInfographic(array $data): string
    {
        $stats = $data['stats'] ?? $data;
        $title = $data['title'] ?? 'Chiffres Clés';

        // Filtrer les valeurs non numériques
        $filteredStats = array_filter($stats, fn($v) => is_numeric($v));

        if (empty($filteredStats)) {
            $filteredStats = ['Aucune donnée' => 0];
        }

        $chartData = [
            'labels' => array_keys($filteredStats),
            'values' => array_values($filteredStats),
            'label' => 'Valeur',
            'title' => $title,
        ];

        // Utiliser un graphique en barres horizontales pour les stats
        return $this->chartGenerator->generateChart($chartData, 'horizontalBar', [
            'chartOptions' => [
                'indexAxis' => 'y',
                'plugins' => [
                    'legend' => ['display' => false],
                    'title' => [
                        'display' => true,
                        'text' => $title,
                        'font' => ['size' => 18, 'weight' => 'bold'],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Créer une timeline d'événements/dates
     * Affiche une progression chronologique
     *
     * @param array $data ['events' => [['date' => '', 'label' => '', 'value' => 0], ...], 'title' => '...']
     * @return string
     */
    protected function createTimelineInfographic(array $data): string
    {
        $events = $data['events'] ?? [];
        $title = $data['title'] ?? 'Timeline';

        if (empty($events)) {
            return $this->createStatsCardInfographic(['stats' => ['Aucun événement' => 0], 'title' => $title]);
        }

        // Extraire les données pour un graphique en ligne
        $labels = array_map(fn($e) => $e['date'] ?? $e['label'] ?? '', $events);
        $values = array_map(fn($e) => $e['value'] ?? 1, $events);

        $chartData = [
            'labels' => $labels,
            'values' => $values,
            'label' => 'Progression',
            'title' => $title,
        ];

        // Graphique en ligne pour visualiser la progression temporelle
        return $this->chartGenerator->generateChart($chartData, 'line', [
            'chartOptions' => [
                'elements' => [
                    'line' => ['tension' => 0.4],
                    'point' => ['radius' => 6, 'hoverRadius' => 8],
                ],
                'plugins' => [
                    'title' => [
                        'display' => true,
                        'text' => $title,
                        'font' => ['size' => 18, 'weight' => 'bold'],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Créer une comparaison visuelle entre éléments
     * Affiche une comparaison côte à côte
     *
     * @param array $data ['items' => [['name' => '', 'values' => []], ...], 'categories' => [], 'title' => '...']
     * @return string
     */
    protected function createComparisonInfographic(array $data): string
    {
        $items = $data['items'] ?? [];
        $categories = $data['categories'] ?? [];
        $title = $data['title'] ?? 'Comparaison';

        if (empty($items)) {
            return $this->createStatsCardInfographic(['stats' => ['Aucune donnée' => 0], 'title' => $title]);
        }

        // Construire un graphique radar pour la comparaison
        $datasets = [];
        $colors = [
            ['rgba(54, 162, 235, 0.5)', 'rgba(54, 162, 235, 1)'],
            ['rgba(255, 99, 132, 0.5)', 'rgba(255, 99, 132, 1)'],
            ['rgba(75, 192, 192, 0.5)', 'rgba(75, 192, 192, 1)'],
        ];

        foreach ($items as $index => $item) {
            $colorPair = $colors[$index % count($colors)];
            $datasets[] = [
                'label' => $item['name'] ?? "Item " . ($index + 1),
                'data' => $item['values'] ?? [],
                'backgroundColor' => $colorPair[0],
                'borderColor' => $colorPair[1],
                'borderWidth' => 2,
            ];
        }

        // Configuration du graphique radar
        $config = [
            'type' => 'radar',
            'data' => [
                'labels' => $categories,
                'datasets' => $datasets,
            ],
            'options' => [
                'plugins' => [
                    'title' => [
                        'display' => true,
                        'text' => $title,
                        'font' => ['size' => 18, 'weight' => 'bold'],
                    ],
                ],
                'scales' => [
                    'r' => [
                        'beginAtZero' => true,
                    ],
                ],
            ],
        ];

        // Générer via l'URL directement
        $configJson = json_encode($config);
        $url = "https://quickchart.io/chart?c=" . urlencode($configJson) . "&width=800&height=600&format=png";

        return $this->downloadAndSaveChart($url);
    }

    /**
     * Créer une infographie de progression/jauge
     * Affiche un pourcentage ou une progression
     *
     * @param array $data ['value' => 75, 'max' => 100, 'label' => '...', 'title' => '...']
     * @return string
     */
    protected function createProgressInfographic(array $data): string
    {
        $value = $data['value'] ?? 0;
        $max = $data['max'] ?? 100;
        $label = $data['label'] ?? 'Progression';
        $title = $data['title'] ?? $label;

        $percentage = min(100, max(0, ($value / $max) * 100));
        $remaining = 100 - $percentage;

        // Graphique doughnut comme jauge
        $chartData = [
            'labels' => [$label, ''],
            'values' => [$percentage, $remaining],
            'title' => $title,
        ];

        $config = [
            'type' => 'doughnut',
            'data' => [
                'labels' => [$label, ''],
                'datasets' => [[
                    'data' => [$percentage, $remaining],
                    'backgroundColor' => [
                        $percentage >= 75 ? 'rgba(75, 192, 192, 0.8)' : ($percentage >= 50 ? 'rgba(255, 206, 86, 0.8)' : 'rgba(255, 99, 132, 0.8)'),
                        'rgba(200, 200, 200, 0.3)',
                    ],
                    'borderWidth' => 0,
                ]],
            ],
            'options' => [
                'circumference' => 180,
                'rotation' => -90,
                'cutout' => '70%',
                'plugins' => [
                    'legend' => ['display' => false],
                    'title' => [
                        'display' => true,
                        'text' => $title,
                        'font' => ['size' => 18, 'weight' => 'bold'],
                    ],
                    'datalabels' => [
                        'display' => true,
                        'formatter' => round($percentage) . '%',
                        'font' => ['size' => 24, 'weight' => 'bold'],
                    ],
                ],
            ],
        ];

        $configJson = json_encode($config);
        $url = "https://quickchart.io/chart?c=" . urlencode($configJson) . "&width=600&height=400&format=png";

        return $this->downloadAndSaveChart($url);
    }

    /**
     * Créer une infographie de mise en avant (highlight)
     * Affiche un gros chiffre avec contexte
     *
     * @param array $data ['highlights' => [['value' => '', 'label' => ''], ...], 'title' => '...']
     * @return string
     */
    protected function createHighlightInfographic(array $data): string
    {
        $highlights = $data['highlights'] ?? [];
        $title = $data['title'] ?? 'Points Clés';

        if (empty($highlights)) {
            return $this->createStatsCardInfographic(['stats' => ['Aucune donnée' => 0], 'title' => $title]);
        }

        // Convertir en format graphique en barres avec gros labels
        $labels = array_map(fn($h) => $h['label'] ?? '', $highlights);
        $values = array_map(fn($h) => is_numeric($h['value']) ? $h['value'] : 0, $highlights);

        $chartData = [
            'labels' => $labels,
            'values' => $values,
            'label' => 'Valeur',
            'title' => $title,
        ];

        return $this->chartGenerator->generateChart($chartData, 'bar', [
            'chartOptions' => [
                'plugins' => [
                    'legend' => ['display' => false],
                    'title' => [
                        'display' => true,
                        'text' => $title,
                        'font' => ['size' => 20, 'weight' => 'bold'],
                    ],
                    'datalabels' => [
                        'display' => true,
                        'anchor' => 'end',
                        'align' => 'top',
                        'font' => ['size' => 16, 'weight' => 'bold'],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Télécharger et sauvegarder un graphique depuis une URL
     *
     * @param string $url
     * @return string Path du fichier
     */
    protected function downloadAndSaveChart(string $url): string
    {
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(30)->get($url);

            if (!$response->successful()) {
                throw new \Exception("Erreur téléchargement graphique: " . $response->status());
            }

            $filename = 'infographic_' . \Illuminate\Support\Str::random(16) . '.png';
            $path = config('press.storage.media', 'press_releases/media') . '/' . $filename;

            Storage::put($path, $response->body());

            return $path;
        } catch (\Exception $e) {
            \Log::error('DossierChartService: Erreur téléchargement infographie', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Créer automatiquement plusieurs graphiques à partir d'un CSV
     *
     * @param string $csvFilePath
     * @param int $maxCharts Nombre maximum de graphiques à générer
     * @return array Tableau de graphiques générés
     */
    public function createChartsFromCSVAuto(string $csvFilePath, int $maxCharts = 5): array
    {
        $parsedData = $this->csvParser->parseCSV($csvFilePath);
        $suggestions = $this->csvParser->extractChartableData($parsedData);
        
        $charts = [];
        $count = 0;
        
        foreach ($suggestions as $suggestion) {
            if ($count >= $maxCharts) {
                break;
            }
            
            try {
                $chartPath = $this->chartGenerator->generateChart(
                    $suggestion['data'],
                    $suggestion['chart_type']
                );
                
                $charts[] = [
                    'path' => $chartPath,
                    'type' => $suggestion['chart_type'],
                    'description' => $suggestion['description'],
                    'config' => $suggestion,
                ];
                
                $count++;
                
            } catch (\Exception $e) {
                // Ignorer les erreurs et continuer
                \Log::warning('Erreur génération graphique auto', [
                    'error' => $e->getMessage(),
                    'suggestion' => $suggestion,
                ]);
            }
        }
        
        return $charts;
    }

    /**
     * Attacher un graphique à un dossier
     *
     * @param PressDossier $dossier
     * @param string $chartPath
     * @param array $config
     * @param int|null $sectionId
     * @return DossierMedia
     */
    public function attachChartToDossier(
        PressDossier $dossier,
        string $chartPath,
        array $config,
        ?int $sectionId = null
    ): DossierMedia {
        return DossierMedia::create([
            'dossier_id' => $dossier->id,
            'section_id' => $sectionId,
            'media_type' => 'chart',
            'file_path' => $chartPath,
            'caption' => $config['title'] ?? null,
            'chart_config' => $config,
        ]);
    }
}