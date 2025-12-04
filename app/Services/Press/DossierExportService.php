<?php

namespace App\Services\Press;

use App\Models\PressDossier;
use App\Models\DossierExport;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Shared\Html;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * DossierExportService - Export de dossiers de presse en PDF/Word/Excel
 * 
 * Fonctionnalités :
 * - Export PDF design "magazine" professionnel (wkhtmltopdf)
 * - Export Word éditable avec styles (PHPWord)
 * - Export Excel des datasets (PhpSpreadsheet)
 * - Support multi-langues avec fonts appropriées
 * - Gestion asynchrone via queue
 * 
 * @package App\Services\Press
 */
class DossierExportService
{
    /**
     * Exporter un dossier en PDF
     *
     * @param PressDossier $dossier
     * @param string $languageCode
     * @return DossierExport
     * @throws \Exception
     */
    public function exportToPdf(PressDossier $dossier, string $languageCode): DossierExport
    {
        // Créer l'entrée d'export
        $export = DossierExport::create([
            'dossier_id' => $dossier->id,
            'export_format' => 'pdf',
            'language_code' => $languageCode,
            'filename' => $this->generateFilename($dossier, 'pdf', $languageCode),
            'status' => 'processing',
        ]);

        $export->markAsStarted();

        try {
            // Charger les sections et médias
            $dossier->load(['sections.media', 'media', 'platform']);
            
            // Générer le HTML
            $html = $this->generatePdfHtml($dossier, $languageCode);
            
            // Générer le PDF avec wkhtmltopdf
            $pdfPath = $this->convertHtmlToPdf($html, $dossier, $languageCode);
            
            // Calculer la taille du fichier
            $fileSize = Storage::size($pdfPath);
            
            // Marquer comme complété
            $export->markAsCompleted($pdfPath, $fileSize);
            
            return $export->fresh();

        } catch (\Exception $e) {
            $export->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Générer le HTML pour le PDF
     *
     * @param PressDossier $dossier
     * @param string $lang
     * @return string
     */
    protected function generatePdfHtml(PressDossier $dossier, string $lang): string
    {
        $langConfig = $this->getLanguageConfig($lang);
        
        return View::make('exports.dossier.pdf-template', [
            'dossier' => $dossier,
            'language' => $lang,
            'lang_config' => $langConfig,
            'platform' => $dossier->platform,
        ])->render();
    }

    /**
     * Convertir HTML en PDF avec wkhtmltopdf
     *
     * @param string $html
     * @param PressDossier $dossier
     * @param string $lang
     * @return string Path du PDF
     * @throws \Exception
     */
    protected function convertHtmlToPdf(string $html, PressDossier $dossier, string $lang): string
    {
        // Sauvegarder le HTML temporairement
        $tempHtmlPath = storage_path('app/temp/dossier_' . $dossier->id . '_' . time() . '.html');
        
        if (!is_dir(dirname($tempHtmlPath))) {
            mkdir(dirname($tempHtmlPath), 0755, true);
        }
        
        file_put_contents($tempHtmlPath, $html);
        
        // Générer le nom du fichier PDF
        $pdfFilename = 'dossier_' . $dossier->id . '_' . $lang . '_' . time() . '.pdf';
        $pdfPath = 'dossiers/exports/' . $dossier->id . '/' . $pdfFilename;
        $fullPdfPath = storage_path('app/public/' . $pdfPath);
        
        if (!is_dir(dirname($fullPdfPath))) {
            mkdir(dirname($fullPdfPath), 0755, true);
        }
        
        // Commande wkhtmltopdf
        $command = sprintf(
            'wkhtmltopdf --encoding utf-8 --page-size A4 --margin-top 20mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm --enable-local-file-access %s %s',
            escapeshellarg($tempHtmlPath),
            escapeshellarg($fullPdfPath)
        );
        
        exec($command, $output, $returnCode);
        
        // Supprimer le fichier HTML temporaire
        @unlink($tempHtmlPath);
        
        if ($returnCode !== 0) {
            throw new \Exception("Erreur lors de la génération du PDF : " . implode("\n", $output));
        }
        
        if (!file_exists($fullPdfPath)) {
            throw new \Exception("Le fichier PDF n'a pas été créé");
        }
        
        return 'public/' . $pdfPath;
    }

    /**
     * Exporter un dossier en Word
     *
     * @param PressDossier $dossier
     * @param string $languageCode
     * @return DossierExport
     * @throws \Exception
     */
    public function exportToWord(PressDossier $dossier, string $languageCode): DossierExport
    {
        // Créer l'entrée d'export
        $export = DossierExport::create([
            'dossier_id' => $dossier->id,
            'export_format' => 'word',
            'language_code' => $languageCode,
            'filename' => $this->generateFilename($dossier, 'docx', $languageCode),
            'status' => 'processing',
        ]);

        $export->markAsStarted();

        try {
            // Charger les données
            $dossier->load(['sections.media', 'media', 'platform']);
            
            // Créer le document Word
            $phpWord = $this->createWordDocument($dossier, $languageCode);
            
            // Sauvegarder
            $wordPath = $this->saveWordDocument($phpWord, $dossier, $languageCode);
            
            // Calculer la taille
            $fileSize = Storage::size($wordPath);
            
            // Marquer comme complété
            $export->markAsCompleted($wordPath, $fileSize);
            
            return $export->fresh();

        } catch (\Exception $e) {
            $export->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Créer un document Word
     *
     * @param PressDossier $dossier
     * @param string $lang
     * @return PhpWord
     */
    protected function createWordDocument(PressDossier $dossier, string $lang): PhpWord
    {
        $phpWord = new PhpWord();
        $langConfig = $this->getLanguageConfig($lang);
        
        // Définir la langue du document
        $phpWord->getSettings()->setThemeFontLang(new \PhpOffice\PhpWord\Style\Language($lang));
        
        // Styles
        $phpWord->addTitleStyle(1, ['size' => 20, 'bold' => true], ['alignment' => 'center']);
        $phpWord->addTitleStyle(2, ['size' => 16, 'bold' => true]);
        $phpWord->addTitleStyle(3, ['size' => 14, 'bold' => true]);
        
        // Créer une section
        $section = $phpWord->addSection([
            'marginTop' => 1440,    // 1 inch
            'marginBottom' => 1440,
            'marginLeft' => 1440,
            'marginRight' => 1440,
        ]);
        
        // Page de couverture
        $section->addTitle(htmlspecialchars($dossier->title), 1);
        
        if ($dossier->subtitle) {
            $section->addText(htmlspecialchars($dossier->subtitle), [
                'size' => 14,
                'italic' => true,
            ], ['alignment' => 'center']);
        }
        
        $section->addTextBreak(2);
        
        // Table des matières
        $section->addTitle('Table des Matières', 2);
        $section->addTOC(['size' => 12], null, 1, 2);
        $section->addPageBreak();
        
        // Sections du dossier
        foreach ($dossier->sections as $section_model) {
            if ($section_model->section_type === 'cover') {
                continue; // Skip cover, already added
            }
            
            // Titre de la section
            $section->addTitle(htmlspecialchars($section_model->title), 2);
            
            // Contenu
            if ($section_model->content) {
                Html::addHtml($section, $section_model->content, false, false);
            }
            
            // Saut de page si nécessaire
            if ($section_model->page_break_after) {
                $section->addPageBreak();
            }
        }
        
        return $phpWord;
    }

    /**
     * Sauvegarder le document Word
     *
     * @param PhpWord $phpWord
     * @param PressDossier $dossier
     * @param string $lang
     * @return string Path
     */
    protected function saveWordDocument(PhpWord $phpWord, PressDossier $dossier, string $lang): string
    {
        $filename = 'dossier_' . $dossier->id . '_' . $lang . '_' . time() . '.docx';
        $path = 'dossiers/exports/' . $dossier->id . '/' . $filename;
        $fullPath = storage_path('app/public/' . $path);
        
        if (!is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }
        
        $writer = IOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($fullPath);
        
        return 'public/' . $path;
    }

    /**
     * Exporter les datasets en Excel
     *
     * @param PressDossier $dossier
     * @return DossierExport
     * @throws \Exception
     */
    public function exportDatasetToExcel(PressDossier $dossier): DossierExport
    {
        // Créer l'entrée d'export
        $export = DossierExport::create([
            'dossier_id' => $dossier->id,
            'export_format' => 'excel',
            'language_code' => $dossier->language_code,
            'filename' => $this->generateFilename($dossier, 'xlsx', $dossier->language_code),
            'status' => 'processing',
        ]);

        $export->markAsStarted();

        try {
            // Charger les médias de type dataset ou table
            $dossier->load(['media' => function ($query) {
                $query->whereIn('media_type', ['dataset', 'table', 'chart'])
                      ->whereNotNull('table_data');
            }]);
            
            if ($dossier->media->isEmpty()) {
                throw new \Exception("Aucun dataset à exporter");
            }
            
            // Créer le fichier Excel
            $excelPath = $this->createExcelFromDatasets($dossier);
            
            // Calculer la taille
            $fileSize = Storage::size($excelPath);
            
            // Marquer comme complété
            $export->markAsCompleted($excelPath, $fileSize);
            
            return $export->fresh();

        } catch (\Exception $e) {
            $export->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Créer un fichier Excel à partir des datasets
     *
     * @param PressDossier $dossier
     * @return string Path
     */
    protected function createExcelFromDatasets(PressDossier $dossier): string
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0); // Supprimer la feuille par défaut
        
        foreach ($dossier->media as $index => $media) {
            if (!$media->table_data) {
                continue;
            }
            
            $data = $media->table_data;
            $sheetTitle = Str::limit($media->caption ?? "Dataset " . ($index + 1), 30);
            
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($sheetTitle);
            
            // Headers
            if (isset($data['headers'])) {
                $sheet->fromArray($data['headers'], null, 'A1');
                
                // Style des headers
                $headerRange = 'A1:' . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($data['headers'])) . '1';
                $sheet->getStyle($headerRange)->getFont()->setBold(true);
                $sheet->getStyle($headerRange)->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('4472C4');
                $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
            }
            
            // Données
            if (isset($data['rows'])) {
                $sheet->fromArray($data['rows'], null, 'A2');
            }
            
            // Auto-size colonnes
            foreach (range('A', \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($data['headers'] ?? []))) as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }
        
        // Sauvegarder
        $filename = 'dossier_' . $dossier->id . '_datasets_' . time() . '.xlsx';
        $path = 'dossiers/exports/' . $dossier->id . '/' . $filename;
        $fullPath = storage_path('app/public/' . $path);
        
        if (!is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($fullPath);
        
        return 'public/' . $path;
    }

    /**
     * Obtenir la configuration de langue
     *
     * @param string $langCode
     * @return array
     */
    protected function getLanguageConfig(string $langCode): array
    {
        $configs = [
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

        return $configs[$langCode] ?? $configs['en'];
    }

    /**
     * Générer un nom de fichier
     *
     * @param PressDossier $dossier
     * @param string $extension
     * @param string $lang
     * @return string
     */
    protected function generateFilename(PressDossier $dossier, string $extension, string $lang): string
    {
        $slug = Str::slug($dossier->title);
        return "{$slug}_{$lang}_{$dossier->id}.{$extension}";
    }
}