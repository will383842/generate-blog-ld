<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\TitleTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * TitleService - Génération de titres optimisés SEO avec templates
 * 
 * Fonctionnalités :
 * - 24 variables dynamiques pour templates (✅ avec aliases et versions _lower)
 * - Anti-doublon avec hash SHA256
 * - Gestion multi-langues (9 langues: fr, en, de, es, pt, ru, zh, ar, hi)
 * - Templates spécifiques par plateforme/thème/type
 * - Fallback sur génération GPT si pas de template
 * - Support de 197 pays dans toutes les langues
 * 
 * Variables disponibles :
 * {platform}, {country}, {country_in}, {provider_type}, {provider_type_lower}, 
 * {lawyer_specialty}, {lawyer_specialty_lower}, {specialty}, {specialty_lower},
 * {expat_domain}, {expat_domain_lower}, {theme}, {theme_lower}, 
 * {service}, {service_lower}, {year}, {month}, {season}, {urgency}, {benefit}, 
 * {problem}, {solution}, {statistic}, {question}
 * 
 * @package App\Services\Content
 */
class TitleService
{
    // 24 variables disponibles pour les templates
    protected array $availableVariables = [
        'platform',              // ex: "SOS-Expat", "Ulixai"
        'country',              // ex: "Thaïlande", "Japon"
        'country_in',           // ex: "en Thaïlande", "au Japon"
        'provider_type',        // ex: "Avocat", "Traducteur"
        'provider_type_lower',  // ex: "avocat", "traducteur"
        'lawyer_specialty',     // ex: "Droit des affaires", "Droit familial"
        'lawyer_specialty_lower', // ex: "droit des affaires"
        'specialty',            // ex: "Droit des affaires" (alias)
        'specialty_lower',      // ex: "droit des affaires" (alias)
        'expat_domain',         // ex: "Logement", "Santé"
        'expat_domain_lower',   // ex: "logement", "santé"
        'theme',                // ex: "Urgence juridique", "Installation"
        'theme_lower',          // ex: "urgence juridique", "installation"
        'service',              // ex: "Traduction de documents"
        'service_lower',        // ex: "traduction de documents"
        'year',                 // ex: "2024"
        'month',                // ex: "Décembre"
        'season',               // ex: "hiver"
        'urgency',              // ex: "urgent", "rapide"
        'benefit',              // ex: "simplement", "facilement"
        'problem',              // ex: "visa refusé", "contrat litigieux"
        'solution',             // ex: "aide immédiate", "experts disponibles"
        'statistic',            // ex: "10 000+ Français"
        'question',             // ex: "Comment", "Pourquoi"
    ];

    // Mots d'urgence par langue (9 langues)
    protected array $urgencyWords = [
        'fr' => ['urgent', 'rapide', 'immédiat', 'express', 'prioritaire'],
        'en' => ['urgent', 'fast', 'immediate', 'express', 'priority'],
        'de' => ['dringend', 'schnell', 'sofort', 'express', 'priorität'],
        'es' => ['urgente', 'rápido', 'inmediato', 'express', 'prioritario'],
        'pt' => ['urgente', 'rápido', 'imediato', 'expresso', 'prioritário'],
        'ru' => ['срочно', 'быстро', 'немедленно', 'экспресс', 'приоритетно'],
        'zh' => ['紧急', '快速', '立即', '特快', '优先'],
        'ar' => ['عاجل', 'سريع', 'فوري', 'سريع', 'أولوية'],
        'hi' => ['तत्काल', 'तेज़', 'तुरंत', 'एक्सप्रेस', 'प्राथमिकता'],
    ];

    // Bénéfices par langue (9 langues)
    protected array $benefitWords = [
        'fr' => ['simplement', 'facilement', 'efficacement', 'sereinement', 'en toute confiance'],
        'en' => ['simply', 'easily', 'efficiently', 'confidently', 'with confidence'],
        'de' => ['einfach', 'leicht', 'effizient', 'sicher', 'vertrauensvoll'],
        'es' => ['simplemente', 'fácilmente', 'eficientemente', 'con confianza', 'serenamente'],
        'pt' => ['simplesmente', 'facilmente', 'eficientemente', 'com confiança', 'serenamente'],
        'ru' => ['просто', 'легко', 'эффективно', 'уверенно', 'спокойно'],
        'zh' => ['简单地', '轻松地', '有效地', '自信地', '平静地'],
        'ar' => ['ببساطة', 'بسهولة', 'بكفاءة', 'بثقة', 'بهدوء'],
        'hi' => ['सरलता से', 'आसानी से', 'कुशलता से', 'आत्मविश्वास से', 'शांति से'],
    ];

    // Mots de question par langue (9 langues)
    protected array $questionWords = [
        'fr' => ['Comment', 'Pourquoi', 'Que Faire', 'Quand', 'Où Trouver'],
        'en' => ['How', 'Why', 'What to Do', 'When', 'Where to Find'],
        'de' => ['Wie', 'Warum', 'Was Tun', 'Wann', 'Wo Finden'],
        'es' => ['Cómo', 'Por Qué', 'Qué Hacer', 'Cuándo', 'Dónde Encontrar'],
        'pt' => ['Como', 'Por Que', 'O Que Fazer', 'Quando', 'Onde Encontrar'],
        'ru' => ['Как', 'Почему', 'Что Делать', 'Когда', 'Где Найти'],
        'zh' => ['如何', '为什么', '该怎么办', '什么时候', '在哪里找到'],
        'ar' => ['كيف', 'لماذا', 'ماذا تفعل', 'متى', 'أين تجد'],
        'hi' => ['कैसे', 'क्यों', 'क्या करें', 'कब', 'कहाँ मिलेगा'],
    ];

    /**
     * Générer un titre unique
     * 
     * @param array $context Contexte de génération (platform, country, language, theme...)
     * @return string Titre généré et validé unique
     * @throws \Exception Si impossible de générer un titre unique après 10 tentatives
     */
    public function generate(array $context): string
    {
        $maxAttempts = 10;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $attempt++;

            // 1. Chercher un template approprié
            $template = $this->findTemplate($context);

            // 2. Générer le titre à partir du template
            $title = $template 
                ? $this->fillTemplate($template, $context)
                : $this->generateWithGpt($context);

            // 3. Nettoyer et optimiser le titre
            $title = $this->cleanTitle($title, $context);

            // 4. Vérifier l'unicité (SHA256)
            if ($this->isUnique($title)) {
                Log::info('TitleService: Titre généré avec succès', [
                    'title' => $title,
                    'attempt' => $attempt,
                    'used_template' => !empty($template),
                ]);
                return $title;
            }

            Log::debug('TitleService: Titre déjà existant, nouvelle tentative', [
                'title' => $title,
                'attempt' => $attempt,
            ]);
        }

        throw new \Exception("Impossible de générer un titre unique après {$maxAttempts} tentatives");
    }

    /**
     * Trouver un template approprié selon le contexte
     */
    protected function findTemplate(array $context): ?string
    {
        $query = TitleTemplate::query()
            ->where('language_code', $context['language']->code)
            ->where('is_active', true);

        // Filtres optionnels par priorité
        if (isset($context['platform'])) {
            $query->where(function ($q) use ($context) {
                $q->where('platform_id', $context['platform']->id)
                  ->orWhereNull('platform_id');
            });
        }

        if (isset($context['theme'])) {
            $query->where(function ($q) use ($context) {
                $q->where('theme_id', $context['theme']->id)
                  ->orWhereNull('theme_id');
            });
        }

        if (isset($context['provider_type'])) {
            $query->where(function ($q) use ($context) {
                $q->where('provider_type_id', $context['provider_type']->id)
                  ->orWhereNull('provider_type_id');
            });
        }

        // Récupérer un template aléatoire parmi les plus spécifiques
        $template = $query->inRandomOrder()->first();

        return $template?->template;
    }

    /**
     * Remplir un template avec les variables du contexte
     */
    protected function fillTemplate(string $template, array $context): string
    {
        $variables = $this->buildVariables($context);

        // Remplacer toutes les variables {xxx}
        $title = $template;
        foreach ($variables as $key => $value) {
            $title = str_replace("{{$key}}", $value ?? '', $title);
        }

        return $title;
    }

    /**
     * Construire toutes les variables disponibles pour le contexte
     * ✅ CORRIGÉ : Utilise les méthodes natives getName() des modèles avec isset()
     */
    protected function buildVariables(array $context): array
    {
        $languageCode = $context['language']->code;
        
        // ✅ CORRECTION : Utiliser les méthodes natives getName() des modèles avec vérification isset()
        $themeName = $context['theme']->getName($languageCode) ?? '';
        $providerTypeName = isset($context['provider_type']) ? $context['provider_type']->getName($languageCode) : '';
        $lawyerSpecialtyName = isset($context['lawyer_specialty']) ? $context['lawyer_specialty']->getName($languageCode) : '';
        $expatDomainName = isset($context['expatDomain']) ? $context['expatDomain']->getName($languageCode) : '';
        $serviceName = isset($context['service']) ? $context['service']->getName($languageCode) : '';
        
        return [
            // Entités de base
            'platform' => $context['platform']->name ?? '',
            'country' => $context['country']->{"name_{$languageCode}"} ?? $context['country']->name_en ?? '',
            'country_in' => $this->getCountryWithPreposition($context['country'], $languageCode),
            'theme' => $themeName,
            'theme_lower' => mb_strtolower($themeName),
            
            // Entités optionnelles (avec versions _lower et aliases)
            'provider_type' => $providerTypeName,
            'provider_type_lower' => mb_strtolower($providerTypeName),
            
            'lawyer_specialty' => $lawyerSpecialtyName,
            'lawyer_specialty_lower' => mb_strtolower($lawyerSpecialtyName),
            'specialty' => $lawyerSpecialtyName,  // ✅ AJOUT : Alias pour compatibilité
            'specialty_lower' => mb_strtolower($lawyerSpecialtyName),  // ✅ AJOUT : Alias
            
            'expat_domain' => $expatDomainName,
            'expat_domain_lower' => mb_strtolower($expatDomainName),
            
            'service' => $serviceName,
            'service_lower' => mb_strtolower($serviceName),
            
            // Variables temporelles
            'year' => now()->year,
            'month' => $this->getMonthName($languageCode),
            'season' => $this->getSeasonName($languageCode),
            
            // Variables dynamiques
            'urgency' => $this->urgencyWords[$languageCode][array_rand($this->urgencyWords[$languageCode])],
            'benefit' => $this->benefitWords[$languageCode][array_rand($this->benefitWords[$languageCode])],
            'question' => $this->questionWords[$languageCode][array_rand($this->questionWords[$languageCode])],
            
            // Variables spécifiques métier
            'problem' => $this->getProblemExample($context, $languageCode),
            'solution' => $this->getSolutionExample($context, $languageCode),
            'statistic' => $this->getStatisticExample($context, $languageCode),
        ];
    }

    /**
     * ✅ CORRECTION : Obtenir le nom du pays avec la bonne préposition (en/au/aux)
     */
    protected function getCountryWithPreposition($country, string $languageCode): string
    {
        if (!$country) {
            return '';
        }

        $countryName = $country->{"name_{$languageCode}"} ?? $country->name_en ?? '';

        if ($languageCode === 'fr') {
            $code = $country->code;
            
            // Pays masculins commençant par consonne → "au"
            $masculinCountries = ['BR', 'CA', 'CL', 'CN', 'CR', 'EG', 'GB', 'IN', 'IR', 'IQ', 'JP', 'KW', 'LB', 'MA', 'MX', 'NP', 'PE', 'PT', 'SN', 'VE', 'VN', 'ZW'];
            if (in_array($code, $masculinCountries)) {
                return "au {$countryName}";
            }
            
            // Pays pluriels → "aux"
            $pluralCountries = ['AE', 'US', 'NL', 'PH'];
            if (in_array($code, $pluralCountries)) {
                return "aux {$countryName}";
            }
            
            // Pays commençant par voyelle → "en" (Australie, Italie, etc.)
            if (preg_match('/^[aeiouyh]/i', $countryName)) {
                return "en {$countryName}";
            }
            
            // ✅ CORRECTION SPÉCIFIQUE : France est féminin → "en France"
            if ($code === 'FR') {
                return "en {$countryName}";
            }
            
            // Pays féminins → "en" (la plupart des pays se terminant par 'e')
            if (preg_match('/e$/i', $countryName) && !in_array($code, $masculinCountries)) {
                return "en {$countryName}";
            }
            
            // Défaut masculin → "au"
            return "au {$countryName}";
        }

        // Anglais → "in"
        if ($languageCode === 'en') {
            return "in {$countryName}";
        }

        // Allemand → "in"
        if ($languageCode === 'de') {
            return "in {$countryName}";
        }

        // Espagnol → "en"
        if ($languageCode === 'es') {
            return "en {$countryName}";
        }

        // Portugais → "em"
        if ($languageCode === 'pt') {
            return "em {$countryName}";
        }

        // Russe → "в"
        if ($languageCode === 'ru') {
            return "в {$countryName}";
        }

        // Chinois → "在"
        if ($languageCode === 'zh') {
            return "在{$countryName}";
        }

        // Arabe → "في"
        if ($languageCode === 'ar') {
            return "في {$countryName}";
        }

        // Hindi → " में"
        if ($languageCode === 'hi') {
            return "{$countryName} में";
        }

        // Défaut
        return "in {$countryName}";
    }

    /**
     * Obtenir le nom du mois actuel dans la langue (✅ 9 LANGUES)
     */
    protected function getMonthName(string $languageCode): string
    {
        $months = [
            'fr' => ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            'en' => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            'de' => ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            'es' => ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            'pt' => ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            'ru' => ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            'zh' => ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
            'ar' => ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
            'hi' => ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
        ];

        $monthIndex = (int) now()->format('n') - 1;
        return $months[$languageCode][$monthIndex] ?? now()->format('F');
    }

    /**
     * Obtenir le nom de la saison actuelle dans la langue (✅ 9 LANGUES)
     */
    protected function getSeasonName(string $languageCode): string
    {
        $month = (int) now()->format('n');
        $seasonIndex = match (true) {
            $month >= 3 && $month <= 5 => 0,   // Printemps
            $month >= 6 && $month <= 8 => 1,   // Été
            $month >= 9 && $month <= 11 => 2,  // Automne
            default => 3,                       // Hiver
        };

        $seasons = [
            'fr' => ['printemps', 'été', 'automne', 'hiver'],
            'en' => ['spring', 'summer', 'autumn', 'winter'],
            'de' => ['Frühling', 'Sommer', 'Herbst', 'Winter'],
            'es' => ['primavera', 'verano', 'otoño', 'invierno'],
            'pt' => ['primavera', 'verão', 'outono', 'inverno'],
            'ru' => ['весна', 'лето', 'осень', 'зима'],
            'zh' => ['春天', '夏天', '秋天', '冬天'],
            'ar' => ['الربيع', 'الصيف', 'الخريف', 'الشتاء'],
            'hi' => ['वसंत', 'गर्मी', 'शरद', 'सर्दी'],
        ];

        return $seasons[$languageCode][$seasonIndex] ?? 'season';
    }

    /**
     * Obtenir un exemple de problème selon le contexte (✅ 9 LANGUES)
     */
    protected function getProblemExample(array $context, string $languageCode): string
    {
        $problems = [
            'fr' => ['visa refusé', 'contrat litigieux', 'démarche urgente', 'situation bloquée'],
            'en' => ['visa denied', 'contract dispute', 'urgent procedure', 'stuck situation'],
            'de' => ['Visum abgelehnt', 'Vertragsstreit', 'dringendes Verfahren', 'festgefahrene Situation'],
            'es' => ['visa denegada', 'disputa contractual', 'trámite urgente', 'situación bloqueada'],
            'pt' => ['visto negado', 'disputa contratual', 'procedimento urgente', 'situação travada'],
            'ru' => ['виза отклонена', 'спор по контракту', 'срочная процедура', 'застой'],
            'zh' => ['签证被拒', '合同纠纷', '紧急程序', '困境'],
            'ar' => ['تأشيرة مرفوضة', 'نزاع عقد', 'إجراء عاجل', 'وضع مسدود'],
            'hi' => ['वीजा अस्वीकृत', 'अनुबंध विवाद', 'तत्काल प्रक्रिया', 'अटका हुआ'],
        ];

        return $problems[$languageCode][array_rand($problems[$languageCode])] ?? 'issue';
    }

    /**
     * Obtenir un exemple de solution selon le contexte (✅ 9 LANGUES)
     */
    protected function getSolutionExample(array $context, string $languageCode): string
    {
        $solutions = [
            'fr' => ['aide immédiate', 'experts disponibles', 'réponse en 24h', 'accompagnement complet'],
            'en' => ['immediate help', 'experts available', 'answer within 24h', 'full support'],
            'de' => ['sofortige Hilfe', 'Experten verfügbar', 'Antwort in 24h', 'vollständige Unterstützung'],
            'es' => ['ayuda inmediata', 'expertos disponibles', 'respuesta en 24h', 'apoyo completo'],
            'pt' => ['ajuda imediata', 'especialistas disponíveis', 'resposta em 24h', 'suporte completo'],
            'ru' => ['немедленная помощь', 'доступны эксперты', 'ответ в течение 24 часов', 'полная поддержка'],
            'zh' => ['即时帮助', '专家可用', '24小时内答复', '全面支持'],
            'ar' => ['مساعدة فورية', 'خبراء متاحون', 'رد خلال 24 ساعة', 'دعم كامل'],
            'hi' => ['तत्काल सहायता', 'विशेषज्ञ उपलब्ध', '24 घंटे में उत्तर', 'पूर्ण समर्थन'],
        ];

        return $solutions[$languageCode][array_rand($solutions[$languageCode])] ?? 'solution';
    }

    /**
     * Obtenir un exemple de statistique selon le contexte (✅ 9 LANGUES)
     */
    protected function getStatisticExample(array $context, string $languageCode): string
    {
        $stats = [
            'fr' => ['10 000+ Français', 'Plus de 5 000 expatriés', '95% de satisfaction', 'Réponse en moins de 5 minutes'],
            'en' => ['10,000+ French expats', 'Over 5,000 expats', '95% satisfaction', 'Response in under 5 minutes'],
            'de' => ['10.000+ Franzosen', 'Über 5.000 Expats', '95% Zufriedenheit', 'Antwort in unter 5 Minuten'],
            'es' => ['10,000+ franceses', 'Más de 5,000 expatriados', '95% de satisfacción', 'Respuesta en menos de 5 minutos'],
            'pt' => ['10.000+ franceses', 'Mais de 5.000 expatriados', '95% de satisfação', 'Resposta em menos de 5 minutos'],
            'ru' => ['10 000+ французов', 'Более 5 000 экспатов', '95% удовлетворенности', 'Ответ менее чем за 5 минут'],
            'zh' => ['10,000+ 法国人', '超过5,000名外籍人士', '95%满意度', '5分钟内回复'],
            'ar' => ['10,000+ فرنسي', 'أكثر من 5,000 مغترب', '95٪ رضا', 'رد في أقل من 5 دقائق'],
            'hi' => ['10,000+ फ्रांसीसी', '5,000 से अधिक प्रवासी', '95% संतुष्टि', '5 मिनट से कम में उत्तर'],
        ];

        return $stats[$languageCode][array_rand($stats[$languageCode])] ?? '1000+ users';
    }

    /**
     * Générer un titre avec GPT si aucun template disponible
     */
    protected function generateWithGpt(array $context): string
    {
        // Cette méthode sera appelée si aucun template n'est trouvé
        // On utilise un prompt simple pour générer un titre
        
        $countryName = $context['country']->name ?? 'unknown';
        $themeName = $context['theme']->name ?? 'topic';
        $languageName = $context['language']->native_name ?? 'language';

        $prompt = "Génère un titre SEO-optimisé (max 60 caractères) pour un article destiné aux expatriés français en {$countryName}. " .
            "Thème: {$themeName}. " .
            "Langue: {$languageName}. " .
            "Le titre doit être accrocheur, informatif et optimisé pour le référencement. " .
            "Réponds UNIQUEMENT avec le titre, sans guillemets ni commentaire.";

        // Note : Dans un contexte réel, on appellerait GptService ici
        // Pour l'instant, on retourne un titre par défaut
        return "{$themeName} en {$countryName} : Guide Complet " . now()->year;
    }

    /**
     * Nettoyer et optimiser le titre
     */
    protected function cleanTitle(string $title, array $context): string
    {
        // Nettoyer les espaces multiples
        $title = preg_replace('/\s+/', ' ', $title);
        $title = trim($title);

        // Capitaliser correctement
        $title = $this->capitalizeTitle($title, $context['language']->code);

        // Limiter à 60 caractères (SEO optimal)
        if (mb_strlen($title) > 60) {
            $title = mb_substr($title, 0, 57) . '...';
        }

        return $title;
    }

    /**
     * ✅ NOUVELLE VERSION : Capitaliser intelligemment en préservant les noms propres
     * 
     * Stratégie intelligente pour 197 pays × 9 langues :
     * - NE PAS tout mettre en minuscule (détruirait les noms propres)
     * - Capitaliser UNIQUEMENT la première lettre du titre
     * - Préserver les majuscules existantes (noms de pays, villes, spécialités)
     * - Mettre en minuscules les mots de liaison identifiés
     */
    protected function capitalizeTitle(string $title, string $languageCode): string
    {
        // Découper le titre en mots (avec préservation des espaces)
        $words = preg_split('/(\s+)/', $title, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        
        if (empty($words)) {
            return $title;
        }

        // Mots de liaison à mettre en minuscule (par langue)
        $lowercaseWords = [
            'fr' => ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux', 'en', 'et', 'ou', 'pour', 'par', 'dans', 'sur', 'avec'],
            'en' => ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
            'de' => ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines', 'und', 'oder', 'in', 'an', 'zu', 'von', 'mit'],
            'es' => ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'a', 'al', 'en', 'y', 'o', 'para', 'por', 'con'],
            'pt' => ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'e', 'ou', 'para', 'por', 'com'],
        ];

        $lowercaseList = $lowercaseWords[$languageCode] ?? [];
        $result = [];
        $isFirstWord = true;

        foreach ($words as $word) {
            // Si c'est un espace, le garder tel quel
            if (preg_match('/^\s+$/', $word)) {
                $result[] = $word;
                continue;
            }

            // Nettoyer le mot pour vérification
            $cleanWord = mb_strtolower(trim($word, '.,;:!?"\'-()[]{}'));

            // Vérifier si c'est un mot de liaison à mettre en minuscule
            if (!$isFirstWord && in_array($cleanWord, $lowercaseList)) {
                // Préserver la ponctuation, mettre le mot en minuscule
                $result[] = $this->preservePunctuationLowercase($word);
            } else {
                // Garder tel quel (préserve les noms propres)
                // Mais assurer que la première lettre du titre est en majuscule
                if ($isFirstWord) {
                    $word = ucfirst($word);
                    $isFirstWord = false;
                }
                $result[] = $word;
            }
        }

        return implode('', $result);
    }

    /**
     * Mettre un mot en minuscule en préservant la ponctuation
     */
    protected function preservePunctuationLowercase(string $word): string
    {
        // Extraire la ponctuation de début et fin
        $prefix = '';
        $suffix = '';
        
        if (preg_match('/^([.,;:!?"\'\-()[\]{}]+)/', $word, $m)) {
            $prefix = $m[1];
            $word = mb_substr($word, mb_strlen($prefix));
        }
        
        if (preg_match('/([.,;:!?"\'\-()[\]{}]+)$/', $word, $m)) {
            $suffix = $m[1];
            $word = mb_substr($word, 0, mb_strlen($word) - mb_strlen($suffix));
        }
        
        return $prefix . mb_strtolower($word) . $suffix;
    }

    /**
     * Vérifier l'unicité du titre avec hash SHA256
     */
    protected function isUnique(string $title): bool
    {
        $hash = hash('sha256', $title);
        
        return !Article::where('title_hash', $hash)->exists();
    }

    /**
     * Générer un titre pour article comparatif
     * Compatible avec les 9 langues supportées
     * 
     * @param array $params Paramètres du comparatif
     * @return string Titre optimisé SEO
     */
    public function generateComparativeTitle(array $params): string
    {
        $serviceType = $params['service_type'] ?? 'Services';
        $platformName = $params['platform_name'] ?? 'Notre plateforme';
        $country = $params['country'] ?? 'France';
        $languageCode = $params['language_code'] ?? 'fr';
        $year = now()->year;
        
        // Templates par langue (9 langues supportées)
        $templates = [
            'fr' => "Meilleurs {$serviceType} en {$country} : Comparatif {$platformName} {$year}",
            'en' => "Best {$serviceType} in {$country}: {$platformName} Comparison {$year}",
            'de' => "Beste {$serviceType} in {$country}: {$platformName} Vergleich {$year}",
            'es' => "Mejores {$serviceType} en {$country}: Comparación {$platformName} {$year}",
            'pt' => "Melhores {$serviceType} em {$country}: Comparação {$platformName} {$year}",
            'ru' => "Лучшие {$serviceType} в {$country}: Сравнение {$platformName} {$year}",
            'zh' => "{$country}最佳{$serviceType}：{$platformName}对比 {$year}",
            'ar' => "أفضل {$serviceType} في {$country}: مقارنة {$platformName} {$year}",
            'hi' => "{$country} में सर्वश्रेष्ठ {$serviceType}: {$platformName} तुलना {$year}",
        ];
        
        $title = $templates[$languageCode] ?? $templates['en'];
        
        // Nettoyer et limiter à 60 caractères
        $title = preg_replace('/\s+/', ' ', $title);
        $title = trim($title);
        
        if (mb_strlen($title) > 60) {
            $title = mb_substr($title, 0, 57) . '...';
        }
        
        Log::info('TitleService: Titre comparatif généré', [
            'title' => $title,
            'language' => $languageCode,
            'service_type' => $serviceType,
        ]);
        
        return $title;
    }

    /**
     * Obtenir toutes les variables disponibles avec leurs valeurs
     * (Utile pour debug/admin)
     */
    public function getAvailableVariables(array $context): array
    {
        return $this->buildVariables($context);
    }

    /**
     * Prévisualiser un template avec le contexte donné
     * (Utile pour tester les templates en admin)
     */
    public function previewTemplate(string $template, array $context): string
    {
        return $this->fillTemplate($template, $context);
    }
}