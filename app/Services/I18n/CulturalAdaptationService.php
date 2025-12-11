<?php

namespace App\Services\I18n;

/**
 * CulturalAdaptationService
 * 
 * Adapte contenus selon culture locale (pas juste traduction)
 * 
 * OBJECTIF: Engagement +40-50% marchés non-FR/EN
 * 
 * ADAPTATIONS:
 * - Dates formats (DD/MM/YYYY vs MM/DD/YYYY vs YYYY-MM-DD)
 * - Currency formats (1.234,56 € vs 1,234.56 USD)
 * - Phone formats (+33 vs +1 vs +86)
 * - Formality levels (vous/tu, Sie/du, usted/tú)
 * - Exemples locaux (noms, villes, références)
 * - RTL support (Arabic)
 * - CJK optimization (Chinese, Japanese, Korean)
 * 
 * UTILISATION:
 * 
 * $service = new CulturalAdaptationService();
 * 
 * $adapted = $service->adapt($content, 'fr', 'FR'); // Langue + Pays
 * $adapted = $service->adapt($content, 'ar', 'SA'); // Arabic Saudi Arabia
 */
class CulturalAdaptationService
{
    // Configuration par langue
    private const LANGUAGE_CONFIG = [
        'fr' => [
            'date_format' => 'd/m/Y',
            'currency_symbol' => '€',
            'currency_position' => 'after', // "50 €"
            'decimal_separator' => ',',
            'thousands_separator' => ' ',
            'phone_prefix' => '+33',
            'formality' => 'formal', // vous
            'example_names' => ['Jean', 'Marie', 'Pierre', 'Sophie'],
            'example_cities' => ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
        ],
        'en' => [
            'date_format' => 'm/d/Y', // US format
            'currency_symbol' => '$',
            'currency_position' => 'before', // "$50"
            'decimal_separator' => '.',
            'thousands_separator' => ',',
            'phone_prefix' => '+1',
            'formality' => 'informal', // direct
            'example_names' => ['John', 'Sarah', 'Mike', 'Emily'],
            'example_cities' => ['New York', 'Los Angeles', 'Chicago', 'Houston'],
        ],
        'es' => [
            'date_format' => 'd/m/Y',
            'currency_symbol' => '€',
            'currency_position' => 'after',
            'decimal_separator' => ',',
            'thousands_separator' => '.',
            'phone_prefix' => '+34',
            'formality' => 'formal', // usted
            'example_names' => ['Juan', 'María', 'Carlos', 'Ana'],
            'example_cities' => ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
        ],
        'de' => [
            'date_format' => 'd.m.Y',
            'currency_symbol' => '€',
            'currency_position' => 'after',
            'decimal_separator' => ',',
            'thousands_separator' => '.',
            'phone_prefix' => '+49',
            'formality' => 'formal', // Sie
            'example_names' => ['Hans', 'Anna', 'Peter', 'Maria'],
            'example_cities' => ['Berlin', 'München', 'Hamburg', 'Frankfurt'],
        ],
        'ar' => [
            'date_format' => 'd/m/Y',
            'currency_symbol' => 'ر.س', // Saudi Riyal
            'currency_position' => 'after',
            'decimal_separator' => '٫',
            'thousands_separator' => '٬',
            'phone_prefix' => '+966',
            'formality' => 'formal', // MSA
            'example_names' => ['محمد', 'فاطمة', 'أحمد', 'نورة'],
            'example_cities' => ['الرياض', 'جدة', 'مكة', 'دبي'],
            'rtl' => true,
            'font' => 'Noto Sans Arabic',
        ],
        'zh' => [
            'date_format' => 'Y年m月d日',
            'currency_symbol' => '¥',
            'currency_position' => 'before',
            'decimal_separator' => '.',
            'thousands_separator' => ',',
            'phone_prefix' => '+86',
            'formality' => 'formal', // 您
            'example_names' => ['张伟', '王芳', '李明', '刘静'],
            'example_cities' => ['北京', '上海', '广州', '深圳'],
            'cjk' => true,
            'font' => 'Noto Sans SC',
        ],
        'ja' => [
            'date_format' => 'Y年m月d日',
            'currency_symbol' => '¥',
            'currency_position' => 'before',
            'decimal_separator' => '.',
            'thousands_separator' => ',',
            'phone_prefix' => '+81',
            'formality' => 'formal', // です・ます
            'example_names' => ['太郎', '花子', '健', '美咲'],
            'example_cities' => ['東京', '大阪', '京都', '福岡'],
            'cjk' => true,
            'font' => 'Noto Sans JP',
        ],
    ];
    
    /**
     * Adapter contenu selon langue et pays
     */
    public function adapt(string $content, string $language, string $country = null): string
    {
        $config = self::LANGUAGE_CONFIG[$language] ?? self::LANGUAGE_CONFIG['en'];
        
        // Adapter dates
        $content = $this->adaptDates($content, $config['date_format']);
        
        // Adapter currency
        $content = $this->adaptCurrency($content, $config);
        
        // Adapter phones
        $content = $this->adaptPhones($content, $config['phone_prefix']);
        
        // Adapter exemples (noms, villes)
        $content = $this->adaptExamples($content, $config);
        
        return $content;
    }
    
    /**
     * Adapter format dates
     */
    private function adaptDates(string $content, string $format): string
    {
        // Pattern ISO: 2024-12-10
        $pattern = '/\b(\d{4})-(\d{2})-(\d{2})\b/';
        
        return preg_replace_callback($pattern, function($matches) use ($format) {
            $date = \DateTime::createFromFormat('Y-m-d', $matches[0]);
            return $date ? $date->format($format) : $matches[0];
        }, $content);
    }
    
    /**
     * Adapter format currency
     */
    private function adaptCurrency(string $content, array $config): string
    {
        // Pattern: 1234.56 ou 1,234.56
        $pattern = '/\b(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(EUR|USD|€|\$|dollars?|euros?)\b/i';
        
        return preg_replace_callback($pattern, function($matches) use ($config) {
            $amount = (float) str_replace(',', '', $matches[1]);
            
            $formatted = number_format(
                $amount,
                2,
                $config['decimal_separator'],
                $config['thousands_separator']
            );
            
            return $config['currency_position'] === 'before'
                ? $config['currency_symbol'] . $formatted
                : $formatted . ' ' . $config['currency_symbol'];
        }, $content);
    }
    
    /**
     * Adapter format téléphones
     */
    private function adaptPhones(string $content, string $prefix): string
    {
        // Pattern: +XX XXX XXX XXX ou 06 XX XX XX XX
        $pattern = '/\b(?:\+\d{1,3}[\s-]?)?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/';
        
        return preg_replace_callback($pattern, function($matches) use ($prefix) {
            // Extraire chiffres
            $digits = preg_replace('/\D/', '', $matches[0]);
            
            // Format local
            if (strlen($digits) === 10) {
                return $prefix . ' ' . chunk_split(substr($digits, 1), 2, ' ');
            }
            
            return $matches[0];
        }, $content);
    }
    
    /**
     * Adapter exemples (noms, villes)
     */
    private function adaptExamples(string $content, array $config): string
    {
        // Liste noms génériques à remplacer
        $genericNames = ['Jean', 'John', 'Juan', 'Hans', 'Mike', 'Sarah', 'Maria'];
        
        foreach ($genericNames as $index => $generic) {
            if (isset($config['example_names'][$index])) {
                $content = str_ireplace($generic, $config['example_names'][$index], $content);
            }
        }
        
        return $content;
    }
    
    /**
     * Générer HTML avec direction RTL si nécessaire
     */
    public function wrapWithDirection(string $content, string $language): string
    {
        $config = self::LANGUAGE_CONFIG[$language] ?? [];
        
        if (isset($config['rtl']) && $config['rtl']) {
            return "<div dir=\"rtl\" lang=\"{$language}\" style=\"font-family: '{$config['font']}', sans-serif;\">{$content}</div>";
        }
        
        if (isset($config['cjk']) && $config['cjk']) {
            return "<div lang=\"{$language}\" style=\"font-family: '{$config['font']}', sans-serif; line-height: 1.8;\">{$content}</div>";
        }
        
        return "<div lang=\"{$language}\">{$content}</div>";
    }
    
    /**
     * Obtenir formality pronoun selon langue
     */
    public function getFormalityPronoun(string $language, bool $formal = true): string
    {
        $pronouns = [
            'fr' => ['informal' => 'tu', 'formal' => 'vous'],
            'es' => ['informal' => 'tú', 'formal' => 'usted'],
            'de' => ['informal' => 'du', 'formal' => 'Sie'],
            'pt' => ['informal' => 'tu', 'formal' => 'você'],
            'it' => ['informal' => 'tu', 'formal' => 'Lei'],
        ];
        
        $type = $formal ? 'formal' : 'informal';
        
        return $pronouns[$language][$type] ?? 'you';
    }
}
