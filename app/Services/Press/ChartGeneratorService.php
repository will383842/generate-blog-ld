<?php

namespace App\Services\Press;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * ChartGeneratorService - Génération de graphiques via QuickChart.io
 * 
 * API gratuite : 60 requêtes/minute
 * Types supportés : bar, line, pie, doughnut, radar, scatter
 * 
 * @package App\Services\Press
 */
class ChartGeneratorService
{
    protected string $apiUrl;
    
    public function __construct()
    {
        $this->apiUrl = config('press.quickchart.api_url', 'https://quickchart.io');
    }

    /**
     * Générer un graphique
     *
     * @param array $data Données du graphique
     * @param string $type Type (bar, line, pie, doughnut, radar, scatter)
     * @param array $options Options supplémentaires
     * @return string Path du fichier sauvegardé
     */
    public function generateChart(array $data, string $type = 'bar', array $options = []): string
    {
        // Construire la config Chart.js
        $config = $this->buildChartConfig($data, $type, $options);
        
        // Générer l'URL de l'API
        $chartUrl = $this->buildChartUrl($config);
        
        // Télécharger l'image
        $localPath = $this->downloadChart($chartUrl);
        
        return $localPath;
    }

    /**
     * Construire la configuration Chart.js
     *
     * @param array $data
     * @param string $type
     * @param array $options
     * @return array
     */
    public function buildChartConfig(array $data, string $type, array $options = []): array
    {
        $config = [
            'type' => $type,
            'data' => [
                'labels' => $data['labels'] ?? [],
                'datasets' => [
                    [
                        'label' => $data['label'] ?? 'Dataset',
                        'data' => $data['values'] ?? [],
                        'backgroundColor' => $this->getDefaultColors($type),
                        'borderColor' => $this->getDefaultBorderColors($type),
                        'borderWidth' => 2,
                    ]
                ]
            ],
            'options' => array_merge([
                'responsive' => true,
                'maintainAspectRatio' => true,
                'plugins' => [
                    'legend' => [
                        'display' => true,
                        'position' => 'top',
                    ],
                    'title' => [
                        'display' => !empty($data['title']),
                        'text' => $data['title'] ?? '',
                        'font' => [
                            'size' => 16,
                            'weight' => 'bold',
                        ]
                    ]
                ],
                'scales' => $this->getScalesConfig($type),
            ], $options['chartOptions'] ?? [])
        ];

        return $config;
    }

    /**
     * Construire l'URL de l'API QuickChart
     *
     * @param array $config
     * @return string
     */
    protected function buildChartUrl(array $config): string
    {
        $configJson = json_encode($config);
        $encodedConfig = urlencode($configJson);
        
        return "{$this->apiUrl}/chart?c={$encodedConfig}&width=800&height=400&format=png";
    }

    /**
     * Télécharger le graphique et le sauvegarder localement
     *
     * @param string $url
     * @return string Path du fichier
     */
    protected function downloadChart(string $url): string
    {
        try {
            // Télécharger l'image
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                throw new \Exception("Erreur lors du téléchargement du graphique : " . $response->status());
            }
            
            // Générer un nom de fichier unique
            $filename = 'chart_' . Str::random(16) . '.png';
            $path = config('press.storage.media', 'press_releases/media') . '/' . $filename;
            
            // Sauvegarder
            Storage::put($path, $response->body());
            
            return $path;
            
        } catch (\Exception $e) {
            \Log::error('ChartGenerator: Erreur téléchargement', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Obtenir les couleurs par défaut selon le type
     *
     * @param string $type
     * @return array|string
     */
    protected function getDefaultColors(string $type)
    {
        $colors = [
            'rgba(54, 162, 235, 0.6)',   // Bleu
            'rgba(255, 99, 132, 0.6)',   // Rouge
            'rgba(255, 206, 86, 0.6)',   // Jaune
            'rgba(75, 192, 192, 0.6)',   // Vert
            'rgba(153, 102, 255, 0.6)',  // Violet
            'rgba(255, 159, 64, 0.6)',   // Orange
        ];

        // Pour les graphiques en secteurs, retourner toutes les couleurs
        if (in_array($type, ['pie', 'doughnut'])) {
            return $colors;
        }

        // Pour les autres, une seule couleur
        return $colors[0];
    }

    /**
     * Obtenir les couleurs de bordure par défaut
     *
     * @param string $type
     * @return array|string
     */
    protected function getDefaultBorderColors(string $type)
    {
        $colors = [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
        ];

        if (in_array($type, ['pie', 'doughnut'])) {
            return $colors;
        }

        return $colors[0];
    }

    /**
     * Obtenir la configuration des axes selon le type
     *
     * @param string $type
     * @return array
     */
    protected function getScalesConfig(string $type): array
    {
        // Pas d'axes pour les graphiques en secteurs
        if (in_array($type, ['pie', 'doughnut', 'radar'])) {
            return [];
        }

        return [
            'y' => [
                'beginAtZero' => true,
                'ticks' => [
                    'font' => ['size' => 12]
                ]
            ],
            'x' => [
                'ticks' => [
                    'font' => ['size' => 12]
                ]
            ]
        ];
    }

    /**
     * Générer un graphique en barres
     *
     * @param array $data
     * @param string $title
     * @return string
     */
    public function generateBarChart(array $data, string $title = ''): string
    {
        return $this->generateChart(
            array_merge($data, ['title' => $title]),
            'bar'
        );
    }

    /**
     * Générer un graphique en ligne
     *
     * @param array $data
     * @param string $title
     * @return string
     */
    public function generateLineChart(array $data, string $title = ''): string
    {
        return $this->generateChart(
            array_merge($data, ['title' => $title]),
            'line'
        );
    }

    /**
     * Générer un graphique circulaire
     *
     * @param array $data
     * @param string $title
     * @return string
     */
    public function generatePieChart(array $data, string $title = ''): string
    {
        return $this->generateChart(
            array_merge($data, ['title' => $title]),
            'pie'
        );
    }

    /**
     * Vérifier la disponibilité de l'API
     *
     * @return bool
     */
    public function checkApiAvailability(): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->apiUrl}/healthcheck");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}