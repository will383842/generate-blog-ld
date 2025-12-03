<?php

namespace App\Services\Press;

use App\Models\PressRelease;
use App\Models\PressReleaseExport;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;

/**
 * PressReleaseExportService - Export PDF et Word de communiqués
 * 
 * Génère des documents professionnels :
 * - Export PDF via DomPDF
 * - Export Word via PHPWord
 * - Templates avec logo et mise en page
 * - Support RTL (arabe)
 * 
 * @package App\Services\Press
 */
class PressReleaseExportService
{
    /**
     * Exporter en PDF
     *
     * @param PressRelease $pressRelease
     * @param string|null $languageCode
     * @return PressReleaseExport
     */
    public function exportToPdf(PressRelease $pressRelease, ?string $languageCode = null): PressReleaseExport
    {
        $languageCode = $languageCode ?? $pressRelease->language_code;
        $isRtl = $languageCode === 'ar';
        
        // Générer le HTML
        $html = view('exports.press-release-template', [
            'pressRelease' => $pressRelease,
            'platform' => $pressRelease->platform,
            'languageCode' => $languageCode,
            'isRtl' => $isRtl,
        ])->render();
        
        // Générer le PDF
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', $isRtl ? 'DejaVu Sans' : 'Arial');
        
        // Générer un nom de fichier
        $filename = $this->generateFilename($pressRelease, 'pdf', $languageCode);
        $path = config('press.storage.exports', 'press_releases/exports') . '/' . $filename;
        
        // Sauvegarder
        Storage::put($path, $pdf->output());
        
        // Créer l'entrée en base
        return $this->createExportRecord($pressRelease, $path, $filename, 'pdf', $languageCode);
    }

    /**
     * Exporter en Word
     *
     * @param PressRelease $pressRelease
     * @param string|null $languageCode
     * @return PressReleaseExport
     */
    public function exportToWord(PressRelease $pressRelease, ?string $languageCode = null): PressReleaseExport
    {
        $languageCode = $languageCode ?? $pressRelease->language_code;
        $isRtl = $languageCode === 'ar';
        
        $phpWord = new PhpWord();
        
        // Configuration du document
        $section = $phpWord->addSection([
            'marginLeft' => 1440,    // 1 inch
            'marginRight' => 1440,
            'marginTop' => 1440,
            'marginBottom' => 1440,
        ]);
        
        if ($isRtl) {
            $section->setRTL(true);
        }
        
        // Styles
        $phpWord->addFontStyle('title', [
            'bold' => true,
            'size' => 18,
            'name' => 'Arial',
        ]);
        
        $phpWord->addFontStyle('heading', [
            'bold' => true,
            'size' => 14,
            'name' => 'Arial',
        ]);
        
        $phpWord->addFontStyle('normal', [
            'size' => 11,
            'name' => 'Arial',
        ]);
        
        $phpWord->addFontStyle('quote', [
            'italic' => true,
            'size' => 11,
            'name' => 'Arial',
            'color' => '666666',
        ]);
        
        // Titre
        $section->addText($pressRelease->title, 'title');
        $section->addTextBreak(1);
        
        // Lead
        $section->addText($pressRelease->lead, 'normal');
        $section->addTextBreak(2);
        
        // Body 1
        $this->addParagraph($section, $pressRelease->body1);
        
        // Body 2
        if ($pressRelease->body2) {
            $this->addParagraph($section, $pressRelease->body2);
        }
        
        // Body 3
        if ($pressRelease->body3) {
            $this->addParagraph($section, $pressRelease->body3);
        }
        
        // Citation
        if ($pressRelease->quote) {
            $section->addTextBreak(1);
            $section->addText($pressRelease->quote, 'quote');
            $section->addTextBreak(1);
        }
        
        // À propos
        $section->addText($this->getTranslation('about', $languageCode), 'heading');
        $section->addText($pressRelease->boilerplate, 'normal');
        $section->addTextBreak(1);
        
        // Contact
        if ($pressRelease->contact) {
            $section->addText($this->getTranslation('contact', $languageCode), 'heading');
            $contact = $pressRelease->contact;
            $section->addText($contact['name'] ?? '', 'normal');
            $section->addText($contact['email'] ?? '', 'normal');
            if (!empty($contact['phone'])) {
                $section->addText($contact['phone'], 'normal');
            }
        }
        
        // Générer un nom de fichier
        $filename = $this->generateFilename($pressRelease, 'docx', $languageCode);
        $path = config('press.storage.exports', 'press_releases/exports') . '/' . $filename;
        $fullPath = Storage::path($path);
        
        // Sauvegarder
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($fullPath);
        
        // Créer l'entrée en base
        return $this->createExportRecord($pressRelease, $path, $filename, 'word', $languageCode);
    }

    /**
     * Ajouter un paragraphe au document Word
     *
     * @param \PhpOffice\PhpWord\Element\Section $section
     * @param string $text
     */
    protected function addParagraph($section, string $text): void
    {
        // Diviser en paragraphes si nécessaire
        $paragraphs = explode("\n", $text);
        
        foreach ($paragraphs as $para) {
            if (!empty(trim($para))) {
                $section->addText(trim($para), 'normal');
                $section->addTextBreak(1);
            }
        }
    }

    /**
     * Générer un nom de fichier unique
     *
     * @param PressRelease $pressRelease
     * @param string $format
     * @param string $languageCode
     * @return string
     */
    protected function generateFilename(PressRelease $pressRelease, string $format, string $languageCode): string
    {
        $slug = Str::slug(substr($pressRelease->title, 0, 50));
        $timestamp = now()->format('Ymd_His');
        
        return "{$slug}_{$languageCode}_{$timestamp}.{$format}";
    }

    /**
     * Créer l'entrée d'export en base de données
     *
     * @param PressRelease $pressRelease
     * @param string $path
     * @param string $filename
     * @param string $format
     * @param string $languageCode
     * @return PressReleaseExport
     */
    protected function createExportRecord(
        PressRelease $pressRelease,
        string $path,
        string $filename,
        string $format,
        string $languageCode
    ): PressReleaseExport {
        $fileSize = Storage::exists($path) ? Storage::size($path) : 0;
        
        return PressReleaseExport::create([
            'press_release_id' => $pressRelease->id,
            'export_format' => $format,
            'language_code' => $languageCode,
            'file_path' => $path,
            'file_name' => $filename,
            'file_size' => $fileSize,
            'generated_by' => auth()->id() ?? 'system',
        ]);
    }

    /**
     * Obtenir une traduction simple
     *
     * @param string $key
     * @param string $languageCode
     * @return string
     */
    protected function getTranslation(string $key, string $languageCode): string
    {
        $translations = [
            'about' => [
                'fr' => 'À propos',
                'en' => 'About',
                'de' => 'Über uns',
                'es' => 'Acerca de',
                'pt' => 'Sobre',
                'ru' => 'О нас',
                'zh' => '关于',
                'ar' => 'حول',
                'hi' => 'के बारे में',
            ],
            'contact' => [
                'fr' => 'Contact',
                'en' => 'Contact',
                'de' => 'Kontakt',
                'es' => 'Contacto',
                'pt' => 'Contato',
                'ru' => 'Контакт',
                'zh' => '联系方式',
                'ar' => 'اتصل',
                'hi' => 'संपर्क',
            ],
        ];
        
        return $translations[$key][$languageCode] ?? $translations[$key]['en'];
    }

    /**
     * Générer un export HTML (pour preview)
     *
     * @param PressRelease $pressRelease
     * @param string|null $languageCode
     * @return string HTML content
     */
    public function generateHtml(PressRelease $pressRelease, ?string $languageCode = null): string
    {
        $languageCode = $languageCode ?? $pressRelease->language_code;
        $isRtl = $languageCode === 'ar';
        
        return view('exports.press-release-template', [
            'pressRelease' => $pressRelease,
            'platform' => $pressRelease->platform,
            'languageCode' => $languageCode,
            'isRtl' => $isRtl,
        ])->render();
    }
}