<?php

namespace App\Services\Press;

use Illuminate\Support\Facades\Storage;

/**
 * CsvParserService - Parse et analyse des fichiers CSV pour génération automatique de graphiques
 * 
 * Fonctionnalités :
 * - Parse CSV avec détection automatique du séparateur
 * - Détection des types de données (nombres, textes, dates)
 * - Suggestion de types de graphiques adaptés
 * - Extraction de données "chartables"
 * - Support Unicode/UTF-8
 * 
 * @package App\Services\Press
 */
class CsvParserService
{
    /**
     * Parser un fichier CSV
     *
     * @param string $filePath Chemin du fichier dans Storage
     * @return array Données parsées
     * @throws \Exception
     */
    public function parseCSV(string $filePath): array
    {
        if (!Storage::exists($filePath)) {
            throw new \Exception("Fichier CSV introuvable : {$filePath}");
        }

        $content = Storage::get($filePath);
        
        // Détecter l'encodage et convertir en UTF-8 si nécessaire
        $content = $this->ensureUtf8($content);
        
        // Détecter le séparateur
        $delimiter = $this->detectDelimiter($content);
        
        // Parser le CSV
        $lines = str_getcsv($content, "\n");
        $data = [];
        
        foreach ($lines as $line) {
            if (trim($line)) {
                $data[] = str_getcsv($line, $delimiter);
            }
        }

        if (empty($data)) {
            throw new \Exception("Le fichier CSV est vide");
        }

        // La première ligne est considérée comme les headers
        $headers = array_shift($data);
        
        // Nettoyer les headers
        $headers = array_map('trim', $headers);
        
        // Construire le résultat structuré
        $result = [
            'headers' => $headers,
            'rows' => [],
            'column_types' => [],
            'statistics' => [],
        ];

        // Convertir les données en tableau associatif
        foreach ($data as $row) {
            if (count($row) === count($headers)) {
                $rowData = [];
                foreach ($headers as $index => $header) {
                    $rowData[$header] = $row[$index] ?? null;
                }
                $result['rows'][] = $rowData;
            }
        }

        // Détecter les types de chaque colonne
        $result['column_types'] = $this->detectColumnTypes($result['rows'], $headers);
        
        // Calculer des statistiques basiques
        $result['statistics'] = $this->calculateStatistics($result['rows'], $headers, $result['column_types']);

        return $result;
    }

    /**
     * S'assurer que le contenu est en UTF-8
     *
     * @param string $content
     * @return string
     */
    protected function ensureUtf8(string $content): string
    {
        $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        
        if ($encoding && $encoding !== 'UTF-8') {
            return mb_convert_encoding($content, 'UTF-8', $encoding);
        }
        
        return $content;
    }

    /**
     * Détecter le séparateur du CSV
     *
     * @param string $content
     * @return string
     */
    protected function detectDelimiter(string $content): string
    {
        $delimiters = [',', ';', "\t", '|'];
        $counts = [];
        
        // Prendre les 5 premières lignes pour l'analyse
        $lines = array_slice(explode("\n", $content), 0, 5);
        $sample = implode("\n", $lines);
        
        foreach ($delimiters as $delimiter) {
            $counts[$delimiter] = substr_count($sample, $delimiter);
        }
        
        // Retourner le délimiteur le plus fréquent
        arsort($counts);
        return array_key_first($counts);
    }

    /**
     * Détecter les types de données de chaque colonne
     *
     * @param array $rows
     * @param array $headers
     * @return array Types par colonne
     */
    protected function detectColumnTypes(array $rows, array $headers): array
    {
        $types = [];
        
        foreach ($headers as $header) {
            $values = array_column($rows, $header);
            $types[$header] = $this->detectDataType($values);
        }
        
        return $types;
    }

    /**
     * Détecter le type de données d'un ensemble de valeurs
     *
     * @param array $values
     * @return string 'number', 'date', 'text'
     */
    protected function detectDataType(array $values): string
    {
        $numericCount = 0;
        $dateCount = 0;
        $total = count($values);
        
        foreach ($values as $value) {
            if (is_numeric($value)) {
                $numericCount++;
            } elseif ($this->isDate($value)) {
                $dateCount++;
            }
        }
        
        // Si plus de 80% sont numériques
        if ($numericCount / $total > 0.8) {
            return 'number';
        }
        
        // Si plus de 80% sont des dates
        if ($dateCount / $total > 0.8) {
            return 'date';
        }
        
        return 'text';
    }

    /**
     * Vérifier si une valeur est une date
     *
     * @param mixed $value
     * @return bool
     */
    protected function isDate($value): bool
    {
        if (!is_string($value)) {
            return false;
        }
        
        $dateFormats = [
            'Y-m-d',
            'd/m/Y',
            'm/d/Y',
            'Y/m/d',
            'd-m-Y',
        ];
        
        foreach ($dateFormats as $format) {
            $date = \DateTime::createFromFormat($format, $value);
            if ($date && $date->format($format) === $value) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Calculer des statistiques basiques
     *
     * @param array $rows
     * @param array $headers
     * @param array $types
     * @return array
     */
    protected function calculateStatistics(array $rows, array $headers, array $types): array
    {
        $stats = [];
        
        foreach ($headers as $header) {
            if ($types[$header] === 'number') {
                $values = array_map('floatval', array_column($rows, $header));
                $stats[$header] = [
                    'min' => min($values),
                    'max' => max($values),
                    'avg' => array_sum($values) / count($values),
                    'sum' => array_sum($values),
                ];
            }
        }
        
        return $stats;
    }

    /**
     * Extraire les données "chartables" (adaptées aux graphiques)
     *
     * @param array $parsedData Données issues de parseCSV()
     * @return array Suggestions de graphiques
     */
    public function extractChartableData(array $parsedData): array
    {
        $suggestions = [];
        $headers = $parsedData['headers'];
        $rows = $parsedData['rows'];
        $types = $parsedData['column_types'];
        
        // Trouver les colonnes texte (pour labels) et colonnes numériques (pour valeurs)
        $textColumns = [];
        $numberColumns = [];
        
        foreach ($types as $column => $type) {
            if ($type === 'text' || $type === 'date') {
                $textColumns[] = $column;
            } elseif ($type === 'number') {
                $numberColumns[] = $column;
            }
        }
        
        // Si on a au moins une colonne texte et une colonne numérique
        if (!empty($textColumns) && !empty($numberColumns)) {
            foreach ($textColumns as $labelColumn) {
                foreach ($numberColumns as $valueColumn) {
                    $suggestions[] = [
                        'chart_type' => $this->suggestChartType($rows, $labelColumn, $valueColumn),
                        'label_column' => $labelColumn,
                        'value_column' => $valueColumn,
                        'data' => [
                            'labels' => array_column($rows, $labelColumn),
                            'values' => array_map('floatval', array_column($rows, $valueColumn)),
                            'label' => $valueColumn,
                            'title' => "{$valueColumn} par {$labelColumn}",
                        ],
                        'description' => "Graphique de {$valueColumn} en fonction de {$labelColumn}",
                    ];
                }
            }
        }
        
        return $suggestions;
    }

    /**
     * Suggérer un type de graphique adapté
     *
     * @param array $rows
     * @param string $labelColumn
     * @param string $valueColumn
     * @return string Type de graphique suggéré
     */
    protected function suggestChartType(array $rows, string $labelColumn, string $valueColumn): string
    {
        $labelCount = count(array_unique(array_column($rows, $labelColumn)));
        
        // Peu de catégories (≤6) : graphique circulaire ou barre
        if ($labelCount <= 6) {
            return 'pie'; // ou 'bar'
        }
        
        // Beaucoup de catégories : graphique en barres ou ligne
        if ($labelCount > 15) {
            return 'line';
        }
        
        // Cas moyen : graphique en barres
        return 'bar';
    }

    /**
     * Créer un tableau HTML à partir des données CSV
     *
     * @param array $parsedData
     * @param int $maxRows Nombre max de lignes à afficher
     * @return string HTML table
     */
    public function createHtmlTable(array $parsedData, int $maxRows = 50): string
    {
        $headers = $parsedData['headers'];
        $rows = array_slice($parsedData['rows'], 0, $maxRows);
        
        $html = '<table class="csv-table">';
        
        // Headers
        $html .= '<thead><tr>';
        foreach ($headers as $header) {
            $html .= '<th>' . htmlspecialchars($header) . '</th>';
        }
        $html .= '</tr></thead>';
        
        // Rows
        $html .= '<tbody>';
        foreach ($rows as $row) {
            $html .= '<tr>';
            foreach ($headers as $header) {
                $value = $row[$header] ?? '';
                $html .= '<td>' . htmlspecialchars($value) . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody>';
        
        $html .= '</table>';
        
        return $html;
    }
}