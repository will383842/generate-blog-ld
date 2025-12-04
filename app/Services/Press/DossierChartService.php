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
     * @param string $template Template d'infographie
     * @return string Path du fichier généré
     */
    public function createInfographic(array $data, string $template = 'stats_card'): string
    {
        // TODO: Implémenter génération d'infographies simples
        // Pour l'instant, créer une image avec des stats
        
        $templates = [
            'stats_card' => $this->createStatsCardInfographic($data),
            'timeline' => $this->createTimelineInfographic($data),
            'comparison' => $this->createComparisonInfographic($data),
        ];
        
        return $templates[$template] ?? $templates['stats_card'];
    }

    /**
     * Créer une carte de statistiques
     *
     * @param array $data
     * @return string Path
     */
    protected function createStatsCardInfographic(array $data): string
    {
        // Utiliser QuickChart avec un graphique personnalisé
        $chartData = [
            'labels' => array_keys($data),
            'values' => array_values($data),
            'label' => 'Statistiques',
            'title' => $data['title'] ?? 'Chiffres Clés',
        ];
        
        return $this->chartGenerator->generateBarChart($chartData, $chartData['title']);
    }

    /**
     * Créer une timeline (placeholder)
     *
     * @param array $data
     * @return string
     */
    protected function createTimelineInfographic(array $data): string
    {
        // TODO: Implémenter
        return $this->createStatsCardInfographic($data);
    }

    /**
     * Créer une comparaison visuelle (placeholder)
     *
     * @param array $data
     * @return string
     */
    protected function createComparisonInfographic(array $data): string
    {
        // TODO: Implémenter
        return $this->createStatsCardInfographic($data);
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