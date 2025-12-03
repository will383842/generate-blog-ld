<?php

namespace App\Services\Translation;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * Service de génération de slugs avec support multi-alphabets
 * Gère la translittération pour cyrillique, chinois, arabe et devanagari
 */
class SlugService
{
    // Mapping des langues vers leurs méthodes de translittération
    protected array $transliterationMap = [
        'ru' => 'cyrillicToLatin',
        'zh' => 'chineseToPinyin',
        'ar' => 'arabicToLatin',
        'hi' => 'devanagariToLatin',
    ];

    // =========================================================================
    // GÉNÉRATION DE SLUGS
    // =========================================================================

    /**
     * Génère un slug pour un titre dans une langue donnée
     * 
     * @param string $title Titre à slugifier
     * @param string $lang Code langue (fr, en, ru, zh, ar, hi, etc.)
     * @return string Slug généré
     */
    public function generateSlug(string $title, string $lang = 'en'): string
    {
        // Si la langue nécessite une translittération
        if (isset($this->transliterationMap[$lang])) {
            $method = $this->transliterationMap[$lang];
            $title = $this->$method($title);
            
            Log::debug("🔤 Translittération appliquée", [
                'lang' => $lang,
                'method' => $method,
                'result' => $title,
            ]);
        }

        // Génération du slug standard Laravel
        $slug = Str::slug($title);

        // Nettoyage additionnel si nécessaire
        $slug = $this->cleanSlug($slug);

        return $slug;
    }

    /**
     * Translittère un texte selon son script
     * 
     * @param string $text Texte à translittérer
     * @param string $script Type de script (cyrillic, chinese, arabic, devanagari)
     * @return string Texte translittéré
     */
    public function transliterate(string $text, string $script): string
    {
        $methods = [
            'cyrillic' => 'cyrillicToLatin',
            'chinese' => 'chineseToPinyin',
            'arabic' => 'arabicToLatin',
            'devanagari' => 'devanagariToLatin',
        ];

        if (!isset($methods[$script])) {
            Log::warning("Script de translittération non supporté: {$script}");
            return $text;
        }

        $method = $methods[$script];
        return $this->$method($text);
    }

    // =========================================================================
    // TRANSLITTÉRATION CYRILLIQUE (RUSSE)
    // =========================================================================

    /**
     * Convertit le cyrillique russe en latin
     * Utilise la translittération ISO 9 simplifiée
     * 
     * @param string $text Texte en cyrillique
     * @return string Texte en latin
     */
    public function cyrillicToLatin(string $text): string
    {
        // Table de translittération russe → latin
        $translitMap = [
            // Minuscules
            'а' => 'a',  'б' => 'b',  'в' => 'v',  'г' => 'g',  'д' => 'd',
            'е' => 'e',  'ё' => 'yo', 'ж' => 'zh', 'з' => 'z',  'и' => 'i',
            'й' => 'y',  'к' => 'k',  'л' => 'l',  'м' => 'm',  'н' => 'n',
            'о' => 'o',  'п' => 'p',  'р' => 'r',  'с' => 's',  'т' => 't',
            'у' => 'u',  'ф' => 'f',  'х' => 'h',  'ц' => 'ts', 'ч' => 'ch',
            'ш' => 'sh', 'щ' => 'sch','ъ' => '',   'ы' => 'y',  'ь' => '',
            'э' => 'e',  'ю' => 'yu', 'я' => 'ya',
            
            // Majuscules
            'А' => 'A',  'Б' => 'B',  'В' => 'V',  'Г' => 'G',  'Д' => 'D',
            'Е' => 'E',  'Ё' => 'Yo', 'Ж' => 'Zh', 'З' => 'Z',  'И' => 'I',
            'Й' => 'Y',  'К' => 'K',  'Л' => 'L',  'М' => 'M',  'Н' => 'N',
            'О' => 'O',  'П' => 'P',  'Р' => 'R',  'С' => 'S',  'Т' => 'T',
            'У' => 'U',  'Ф' => 'F',  'Х' => 'H',  'Ц' => 'Ts', 'Ч' => 'Ch',
            'Ш' => 'Sh', 'Щ' => 'Sch','Ъ' => '',   'Ы' => 'Y',  'Ь' => '',
            'Э' => 'E',  'Ю' => 'Yu', 'Я' => 'Ya',

            // Caractères ukrainiens supplémentaires
            'є' => 'ye', 'і' => 'i',  'ї' => 'yi', 'ґ' => 'g',
            'Є' => 'Ye', 'І' => 'I',  'Ї' => 'Yi', 'Ґ' => 'G',
        ];

        return strtr($text, $translitMap);
    }

    // =========================================================================
    // TRANSLITTÉRATION CHINOISE (PINYIN)
    // =========================================================================

    /**
     * Convertit le chinois en pinyin (romanisation)
     * Utilise une approche simplifiée pour les caractères courants
     * 
     * @param string $text Texte en chinois
     * @return string Texte en pinyin
     */
    public function chineseToPinyin(string $text): string
    {
        // Pour une vraie implémentation production, utiliser une librairie comme:
        // composer require overtrue/pinyin
        // Ici, approche simplifiée avec caractères les plus courants

        $pinyinMap = [
            // Caractères très fréquents
            '中' => 'zhong', '国' => 'guo',  '人' => 'ren',  '的' => 'de',
            '我' => 'wo',    '你' => 'ni',   '他' => 'ta',   '她' => 'ta',
            '们' => 'men',   '这' => 'zhe',  '那' => 'na',   '里' => 'li',
            '是' => 'shi',   '不' => 'bu',   '了' => 'le',   '在' => 'zai',
            '有' => 'you',   '个' => 'ge',   '和' => 'he',   '好' => 'hao',
            '大' => 'da',    '小' => 'xiao', '年' => 'nian', '月' => 'yue',
            '日' => 'ri',    '天' => 'tian', '上' => 'shang','下' => 'xia',
            '来' => 'lai',   '去' => 'qu',   '说' => 'shuo', '看' => 'kan',
            '要' => 'yao',   '会' => 'hui',  '能' => 'neng', '得' => 'de',
            '可' => 'ke',    '以' => 'yi',   '为' => 'wei',  '到' => 'dao',
            '没' => 'mei',   '就' => 'jiu',  '都' => 'dou',  '对' => 'dui',
            '生' => 'sheng', '活' => 'huo',  '作' => 'zuo',  '工' => 'gong',
            '家' => 'jia',   '学' => 'xue',  '校' => 'xiao', '文' => 'wen',
            '法' => 'fa',    '律' => 'lv',   '师' => 'shi',  '服' => 'fu',
            '务' => 'wu',    '公' => 'gong', '司' => 'si',   '钱' => 'qian',
            '元' => 'yuan',  '价' => 'jia',  '格' => 'ge',   '买' => 'mai',
            '卖' => 'mai',   '商' => 'shang','业' => 'ye',   '行' => 'xing',
            '银' => 'yin',   '保' => 'bao',  '险' => 'xian', '医' => 'yi',
            '院' => 'yuan',  '房' => 'fang', '车' => 'che',  '站' => 'zhan',
            '路' => 'lu',    '门' => 'men',  '城' => 'cheng','市' => 'shi',
            
            // Mots composés courants
            '外国' => 'waiguo',  '法国' => 'faguo',   '美国' => 'meiguo',
            '英国' => 'yingguo', '德国' => 'deguo',   '中国' => 'zhongguo',
            '移民' => 'yimin',   '签证' => 'qianzheng','护照' => 'huzhao',
            '居留' => 'juliu',   '工作' => 'gongzuo', '学习' => 'xuexi',
        ];

        // Application du mapping
        $result = $text;
        foreach ($pinyinMap as $chinese => $pinyin) {
            $result = str_replace($chinese, $pinyin . ' ', $result);
        }

        // Nettoyage
        $result = trim($result);
        $result = preg_replace('/\s+/', '-', $result);

        // Si le texte contient encore du chinois non mappé, utiliser une approche générique
        if (preg_match('/[\x{4e00}-\x{9fa5}]/u', $result)) {
            Log::warning("⚠️ Caractères chinois non mappés détectés", ['text' => $text]);
            // Fallback: convertir en représentation hex ou garder tel quel
            $result = $this->chineseFallback($result);
        }

        return $result;
    }

    /**
     * Fallback pour caractères chinois non mappés
     */
    protected function chineseFallback(string $text): string
    {
        // Si disponible, on pourrait utiliser iconv pour une translittération basique
        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
            if ($converted !== false && !empty($converted)) {
                return $converted;
            }
        }

        // Sinon, générer un identifiant unique basé sur le hash
        return 'chinese-' . substr(md5($text), 0, 8);
    }

    // =========================================================================
    // TRANSLITTÉRATION ARABE
    // =========================================================================

    /**
     * Convertit l'arabe en latin
     * Utilise la translittération ISO 233 simplifiée
     * 
     * @param string $text Texte en arabe
     * @return string Texte en latin
     */
    public function arabicToLatin(string $text): string
    {
        // Table de translittération arabe → latin
        $translitMap = [
            // Lettres arabes
            'ا' => 'a',  'أ' => 'a',  'إ' => 'i',  'آ' => 'a',
            'ب' => 'b',  'ت' => 't',  'ث' => 'th', 'ج' => 'j',
            'ح' => 'h',  'خ' => 'kh', 'د' => 'd',  'ذ' => 'dh',
            'ر' => 'r',  'ز' => 'z',  'س' => 's',  'ش' => 'sh',
            'ص' => 's',  'ض' => 'd',  'ط' => 't',  'ظ' => 'z',
            'ع' => 'a',  'غ' => 'gh', 'ف' => 'f',  'ق' => 'q',
            'ك' => 'k',  'ل' => 'l',  'م' => 'm',  'ن' => 'n',
            'ه' => 'h',  'و' => 'w',  'ي' => 'y',  'ى' => 'a',
            'ة' => 'h',  'ء' => 'a',
            
            // Voyelles longues
            'َ' => 'a',  'ِ' => 'i',  'ُ' => 'u',
            'ً' => 'an', 'ٍ' => 'in', 'ٌ' => 'un',
            'ّ' => '',   'ْ' => '',

            // Lettres persanes/urdu supplémentaires
            'پ' => 'p',  'چ' => 'ch', 'ژ' => 'zh', 'گ' => 'g',

            // Chiffres arabes
            '٠' => '0',  '١' => '1',  '٢' => '2',  '٣' => '3',  '٤' => '4',
            '٥' => '5',  '٦' => '6',  '٧' => '7',  '٨' => '8',  '٩' => '9',
        ];

        $result = strtr($text, $translitMap);

        // Suppression des caractères diacritiques restants
        $result = preg_replace('/[\x{064B}-\x{065F}]/u', '', $result);

        return $result;
    }

    // =========================================================================
    // TRANSLITTÉRATION DEVANAGARI (HINDI)
    // =========================================================================

    /**
     * Convertit le devanagari (hindi) en latin
     * Utilise la translittération IAST simplifiée
     * 
     * @param string $text Texte en devanagari
     * @return string Texte en latin
     */
    public function devanagariToLatin(string $text): string
    {
        // Table de translittération devanagari → latin
        $translitMap = [
            // Voyelles
            'अ' => 'a',  'आ' => 'aa', 'इ' => 'i',  'ई' => 'ii',
            'उ' => 'u',  'ऊ' => 'uu', 'ए' => 'e',  'ऐ' => 'ai',
            'ओ' => 'o',  'औ' => 'au', 'ऋ' => 'ri', 'ॠ' => 'rii',
            
            // Consonnes
            'क' => 'ka', 'ख' => 'kha','ग' => 'ga', 'घ' => 'gha','ङ' => 'nga',
            'च' => 'cha','छ' => 'chha','ज' => 'ja','झ' => 'jha','ञ' => 'nya',
            'ट' => 'ta', 'ठ' => 'tha','ड' => 'da', 'ढ' => 'dha','ण' => 'na',
            'त' => 'ta', 'थ' => 'tha','द' => 'da', 'ध' => 'dha','न' => 'na',
            'प' => 'pa', 'फ' => 'pha','ब' => 'ba', 'भ' => 'bha','म' => 'ma',
            'य' => 'ya', 'र' => 'ra', 'ल' => 'la', 'व' => 'va',
            'श' => 'sha','ष' => 'sha','स' => 'sa', 'ह' => 'ha',
            
            // Consonnes composées
            'क्ष' => 'ksha','त्र' => 'tra','ज्ञ' => 'gya',
            
            // Diacritiques (matra)
            'ा' => 'aa', 'ि' => 'i',  'ी' => 'ii', 'ु' => 'u',
            'ू' => 'uu', 'े' => 'e',  'ै' => 'ai', 'ो' => 'o',
            'ौ' => 'au', 'ं' => 'n',  'ः' => 'h',  '्' => '',
            
            // Chiffres devanagari
            '०' => '0',  '१' => '1',  '२' => '2',  '३' => '3',  '४' => '4',
            '५' => '5',  '६' => '6',  '७' => '7',  '८' => '8',  '९' => '9',
        ];

        return strtr($text, $translitMap);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Nettoie un slug
     * 
     * @param string $slug Slug à nettoyer
     * @return string Slug nettoyé
     */
    protected function cleanSlug(string $slug): string
    {
        // Suppression des tirets multiples
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Suppression des tirets en début/fin
        $slug = trim($slug, '-');
        
        // Longueur maximale
        if (strlen($slug) > 200) {
            $slug = substr($slug, 0, 200);
            $slug = preg_replace('/-[^-]*$/', '', $slug); // Coupe au dernier mot complet
        }

        return $slug;
    }

    /**
     * Détecte le script d'un texte
     * 
     * @param string $text Texte à analyser
     * @return string Type de script détecté
     */
    public function detectScript(string $text): string
    {
        // Détection par plages Unicode
        if (preg_match('/[\x{0400}-\x{04FF}]/u', $text)) {
            return 'cyrillic';
        }
        
        if (preg_match('/[\x{4E00}-\x{9FFF}]/u', $text)) {
            return 'chinese';
        }
        
        if (preg_match('/[\x{0600}-\x{06FF}]/u', $text)) {
            return 'arabic';
        }
        
        if (preg_match('/[\x{0900}-\x{097F}]/u', $text)) {
            return 'devanagari';
        }

        return 'latin';
    }

    /**
     * Vérifie si un texte nécessite une translittération
     * 
     * @param string $text Texte à vérifier
     * @return bool True si translittération nécessaire
     */
    public function needsTransliteration(string $text): bool
    {
        $script = $this->detectScript($text);
        return in_array($script, ['cyrillic', 'chinese', 'arabic', 'devanagari']);
    }
}