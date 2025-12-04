<?php

namespace App\Services\Export;

use App\Models\WordConfig;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\Shared\Html;

class WordExportService
{
    private const FONT_MAPPINGS = [
        'fr' => 'Noto Sans',
        'en' => 'Noto Sans',
        'es' => 'Noto Sans',
        'de' => 'Noto Sans',
        'it' => 'Noto Sans',
        'pt' => 'Noto Sans',
        'ru' => 'Noto Sans',
        'ar' => 'Noto Sans Arabic',
        'zh' => 'Noto Sans CJK SC',
        'hi' => 'Noto Sans Devanagari',
    ];

    /**
     * Export content to Word document
     */
    public function exportToWord($content, string $languageCode, int $configId = null): string
    {
        try {
            $contentType = class_basename(get_class($content));
            $config = $this->loadWordConfig($content->platform_id, $contentType, $configId);
            
            // Créer document PHPWord
            $phpWord = $this->createWordDocument($content, $languageCode, $config);
            
            // Créer répertoire de sortie
            $outputDir = storage_path("app/public/exports/{$contentType}/{$content->id}/{$languageCode}");
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }
            
            $outputPath = "{$outputDir}/document.docx";
            
            // Sauvegarder
            $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($outputPath);
            
            return $outputPath;
            
        } catch (\Exception $e) {
            Log::error('Word Export Error', [
                'content_type' => get_class($content),
                'content_id' => $content->id,
                'language' => $languageCode,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Create PHPWord document
     */
    private function createWordDocument($content, string $languageCode, $config): PhpWord
    {
        $phpWord = new PhpWord();
        $fontFamily = self::FONT_MAPPINGS[$languageCode] ?? 'Noto Sans';
        $isRtl = $languageCode === 'ar';

        // Configuration styles
        $phpWord->setDefaultFontName($fontFamily);
        $phpWord->setDefaultFontSize(11);

        // Styles personnalisés
        $phpWord->addParagraphStyle('Title', [
            'alignment' => $isRtl ? Jc::END : Jc::START,
            'spaceAfter' => 300
        ]);

        $phpWord->addFontStyle('TitleFont', [
            'name' => $fontFamily,
            'size' => 18,
            'bold' => true
        ]);

        $phpWord->addParagraphStyle('Body', [
            'alignment' => $isRtl ? Jc::END : Jc::START,
            'spaceAfter' => 120
        ]);

        $phpWord->addFontStyle('BodyFont', [
            'name' => $fontFamily,
            'size' => 11
        ]);

        // Créer section
        $section = $phpWord->addSection([
            'marginTop' => 1440,
            'marginBottom' => 1440,
            'marginLeft' => 1440,
            'marginRight' => 1440
        ]);

        // Ajouter page de garde
        $this->addCover($section, $content, $fontFamily, $isRtl);

        // Ajouter contenu
        $html = $content->content ?? $content->html ?? '';
        $this->addContent($section, $html, $fontFamily, $isRtl);

        return $phpWord;
    }

    /**
     * Add cover page
     */
    private function addCover($section, $content, string $fontFamily, bool $isRtl): void
    {
        $section->addText(
            $content->title ?? 'Document',
            [
                'name' => $fontFamily,
                'size' => 24,
                'bold' => true
            ],
            [
                'alignment' => $isRtl ? Jc::END : Jc::CENTER,
                'spaceAfter' => 600
            ]
        );

        if (isset($content->subtitle)) {
            $section->addText(
                $content->subtitle,
                [
                    'name' => $fontFamily,
                    'size' => 14
                ],
                [
                    'alignment' => $isRtl ? Jc::END : Jc::CENTER,
                    'spaceAfter' => 300
                ]
            );
        }

        $section->addTextBreak(2);
    }

    /**
     * Add content from HTML
     */
    private function addContent($section, string $html, string $fontFamily, bool $isRtl): void
    {
        try {
            // Nettoyer HTML
            $html = strip_tags($html, '<p><h1><h2><h3><h4><h5><h6><strong><em><ul><ol><li><br><a>');
            
            // Convertir HTML en PHPWord
            Html::addHtml($section, $html, false, false);
            
        } catch (\Exception $e) {
            // Fallback : ajouter comme texte brut
            $text = strip_tags($html);
            $section->addText(
                $text,
                ['name' => $fontFamily, 'size' => 11],
                ['alignment' => $isRtl ? Jc::END : Jc::START]
            );
        }
    }

    /**
     * Add table of contents
     */
    public function addTableOfContents($section): void
    {
        $section->addTOC(['name' => 'Noto Sans', 'size' => 11]);
        $section->addPageBreak();
    }

    /**
     * Load Word configuration
     */
    private function loadWordConfig(int $platformId, string $contentType, int $configId = null)
    {
        if ($configId) {
            return WordConfig::findOrFail($configId);
        }

        return WordConfig::where('platform_id', $platformId)
            ->where('content_type', $contentType)
            ->first();
    }

    /**
     * Save document to path
     */
    public function saveDocument(PhpWord $phpWord, string $path): string
    {
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($path);
        return $path;
    }
}