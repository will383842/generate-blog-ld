<?php

namespace App\Services\Export;

use App\Models\Article;
use App\Models\PillarArticle;
use App\Models\PressRelease;
use App\Models\PressDossier;
use App\Models\PdfConfig;
use App\Models\ExportQueue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UniversalExportService
{
    private const FONT_MAPPINGS = [
        'fr' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'en' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'es' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'de' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'it' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'pt' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'ru' => ['font_family' => 'Noto Sans', 'rtl' => false],
        'ar' => ['font_family' => 'Noto Sans Arabic', 'rtl' => true],
        'zh' => ['font_family' => 'Noto Sans CJK SC', 'rtl' => false],
        'hi' => ['font_family' => 'Noto Sans Devanagari', 'rtl' => false],
    ];

    /**
     * Export content to PDF
     */
    public function exportToPdf($content, string $languageCode, int $configId = null): string
    {
        try {
            $contentType = class_basename(get_class($content));
            $config = $this->loadPdfConfig($content->platform_id, $contentType, $configId);
            $langConfig = $this->detectLanguageFont($languageCode);
            
            // Générer HTML
            $html = $this->generateHtml($content, $langConfig, $languageCode, $contentType);
            
            // Créer répertoire de sortie
            $outputDir = storage_path("app/public/exports/{$contentType}/{$content->id}/{$languageCode}");
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }
            
            $outputPath = "{$outputDir}/document.pdf";
            $tempHtmlPath = "{$outputDir}/temp.html";
            
            // Sauvegarder HTML temporaire
            file_put_contents($tempHtmlPath, $html);
            
            // Détecter le chemin wkhtmltopdf selon l'OS
            $wkhtmltopdf = $this->getWkhtmltopdfPath();
            
            // Convertir en PDF avec wkhtmltopdf
            $command = sprintf(
                '%s --encoding utf-8 --page-size A4 --margin-top 20mm --margin-bottom 15mm --enable-local-file-access %s %s 2>&1',
                $wkhtmltopdf,
                escapeshellarg($tempHtmlPath),
                escapeshellarg($outputPath)
            );
            
            exec($command, $output, $returnCode);
            
            // Nettoyer HTML temporaire
            @unlink($tempHtmlPath);
            
            if ($returnCode !== 0) {
                throw new \Exception('PDF generation failed: ' . implode("\n", $output));
            }
            
            return $outputPath;
            
        } catch (\Exception $e) {
            Log::error('PDF Export Error', [
                'content_type' => get_class($content),
                'content_id' => $content->id,
                'language' => $languageCode,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get wkhtmltopdf path based on OS
     */
    private function getWkhtmltopdfPath(): string
    {
        // Windows
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $windowsPath = 'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe';
            if (file_exists($windowsPath)) {
                return '"' . $windowsPath . '"';
            }
        }
        
        // Linux/Mac - utilise la commande dans le PATH
        return 'wkhtmltopdf';
    }

    /**
     * Export content to Word
     */
    public function exportToWord($content, string $languageCode, int $configId = null): string
    {
        $wordExportService = app(WordExportService::class);
        return $wordExportService->exportToWord($content, $languageCode, $configId);
    }

    /**
     * Detect language font configuration
     */
    public function detectLanguageFont(string $languageCode): array
    {
        return self::FONT_MAPPINGS[$languageCode] ?? self::FONT_MAPPINGS['en'];
    }

    /**
     * Generate HTML from content
     */
    private function generateHtml($content, array $langConfig, string $languageCode, string $contentType): string
    {
        $templateMap = [
            'Article' => 'exports.pdf.article',
            'PillarArticle' => 'exports.pdf.pilier',
            'PressRelease' => 'exports.pdf.press-release',
            'PressDossier' => 'exports.pdf.dossier'
        ];

        $template = $templateMap[$contentType] ?? 'exports.pdf.article';

        // Préparer les données
        $data = [
            'content' => $content,
            'language' => $languageCode,
            'lang' => $languageCode,
            'rtl' => $langConfig['rtl'],
            'fontFamily' => $langConfig['font_family'],
            'title' => $content->title ?? '',
            'body' => $content->content ?? $content->html ?? ''
        ];

        return view($template, $data)->render();
    }

    /**
     * Load PDF configuration
     */
    private function loadPdfConfig(int $platformId, string $contentType, int $configId = null)
    {
        if ($configId) {
            return PdfConfig::findOrFail($configId);
        }

        return PdfConfig::where('platform_id', $platformId)
            ->where('content_type', $contentType)
            ->first();
    }

    /**
     * Dispatch export to queue
     */
    public function queueExport($content, string $languageCode, string $format = 'pdf'): void
    {
        $contentType = class_basename(get_class($content));

        ExportQueue::create([
            'content_type' => $contentType,
            'content_id' => $content->id,
            'export_format' => $format,
            'language_code' => $languageCode,
            'status' => 'pending'
        ]);
    }

    /**
     * Queue exports for all translations
     */
    public function queueAllTranslations($content, array $formats = ['pdf', 'word']): void
    {
        if (!method_exists($content, 'translations')) {
            return;
        }

        foreach ($content->translations as $translation) {
            foreach ($formats as $format) {
                $this->queueExport($content, $translation->language_code, $format);
            }
        }
    }
}