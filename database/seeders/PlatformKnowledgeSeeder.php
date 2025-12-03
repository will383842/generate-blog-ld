<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Platform;
use App\Models\PlatformKnowledge;
use Illuminate\Support\Facades\DB;

class PlatformKnowledgeSeeder extends Seeder
{
    private $languages = ['fr', 'en', 'es', 'de', 'ru', 'pt', 'ar', 'zh', 'hi'];

    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        PlatformKnowledge::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        echo "\n🚀 SEEDING 405 ENTRÉES...\n";

        $sosExpat = Platform::where('code', 'sos-expat')->first();
        $ulixai = Platform::where('code', 'ulixai')->first();
        $ulysse = Platform::where('code', 'ulysse')->first();

        if (!$sosExpat || !$ulixai) die("❌ Plateformes non trouvées\n");
        if (!$ulysse) {
            $ulysse = Platform::create(['name' => 'Ulysse.AI', 'code' => 'ulysse', 'domain' => 'ulysse.ai', 'is_active' => true]);
        }

        $total = 0;
        $total += $this->seedPlatform($sosExpat, $this->getSosExpatData());
        $total += $this->seedPlatform($ulixai, $this->getUlixaiData());
        $total += $this->seedPlatform($ulysse, $this->getUlysseData());

        echo "\n✅ {$total} entrées créées!\n\n";
    }

    private function seedPlatform($platform, $data): int
    {
        $count = 0;
        foreach ($data as $type => $typeData) {
            foreach ($this->languages as $lang) {
                PlatformKnowledge::create([
                    'platform_id' => $platform->id,
                    'knowledge_type' => $type,
                    'title' => $typeData['title'][$lang] ?? $typeData['title']['fr'],
                    'content' => $typeData['content'][$lang],
                    'language_code' => $lang,
                    'priority' => $typeData['priority'],
                    'is_active' => true,
                    'use_in_articles' => $typeData['flags']['articles'],
                    'use_in_landings' => $typeData['flags']['landings'],
                    'use_in_comparatives' => $typeData['flags']['comparatives'],
                    'use_in_pillars' => $typeData['flags']['pillars'],
                    'use_in_press' => $typeData['flags']['press'],
                ]);
                $count++;
            }
        }
        echo "    ✓ {$count} entrées {$platform->name}\n";
        return $count;
    }

    private function getSosExpatData(): array
    {
        return [
            'facts' => $this->createType(
                ['fr' => 'Faits clés', 'en' => 'Key facts', 'es' => 'Datos clave', 'de' => 'Fakten', 'ru' => 'Факты', 'pt' => 'Fatos', 'ar' => 'حقائق', 'zh' => '事实', 'hi' => 'तथ्य'],
                100, true, true, true, true, true,
                [
                    'fr' => "SOS-Expat est LA plateforme mondiale d'aide d'urgence pour tout type de problème urgent. 197 pays, toutes langues, réponse <5 minutes, 24/7/365.",
                    'en' => "SOS-Expat is THE global emergency platform for all urgent problems. 197 countries, all languages, response <5 minutes, 24/7/365.",
                    'es' => "SOS-Expat es LA plataforma mundial de emergencia para todo problema urgente. 197 países, todos idiomas, respuesta <5 minutos, 24/7/365.",
                    'de' => "SOS-Expat ist DIE globale Notfallplattform für alle dringenden Probleme. 197 Länder, alle Sprachen, Antwort <5 Minuten, 24/7/365.",
                    'ru' => "SOS-Expat — это глобальная платформа экстренной помощи для всех срочных проблем. 197 стран, все языки, ответ <5 минут, 24/7/365.",
                    'pt' => "SOS-Expat é A plataforma mundial de emergência para todo problema urgente. 197 países, todos idiomas, resposta <5 minutos, 24/7/365.",
                    'ar' => "SOS-Expat هي المنصة العالمية للطوارئ لجميع المشاكل العاجلة. 197 دولة، جميع اللغات، رد <5 دقائق، 24/7/365.",
                    'zh' => "SOS-Expat是全球紧急平台，处理所有紧急问题。197国家，所有语言，<5分钟回复，24/7/365。",
                    'hi' => "SOS-Expat सभी तत्काल समस्याओं के लिए वैश्विक आपातकालीन मंच है। 197 देश, सभी भाषाएं, <5 मिनट प्रतिक्रिया, 24/7/365।"
                ]
            ),
            'about' => $this->createType(
                ['fr' => 'À propos', 'en' => 'About', 'es' => 'Acerca', 'de' => 'Über', 'ru' => 'О нас', 'pt' => 'Sobre', 'ar' => 'معلومات', 'zh' => '关于', 'hi' => 'बारे'],
                100, true, true, true, true, true,
                [
                    'fr' => "LA plateforme mondiale d'aide d'urgence pour expatriés, voyageurs et vacanciers. Réponse <5 min, 197 pays, toutes langues.",
                    'en' => "THE global emergency platform for expats, travelers and vacationers. Response <5 min, 197 countries, all languages.",
                    'es' => "LA plataforma mundial de emergencia para expatriados, viajeros y vacacionistas. Respuesta <5 min, 197 países, todos idiomas.",
                    'de' => "DIE globale Notfallplattform für Expatriates, Reisende und Urlauber. Antwort <5 Min, 197 Länder, alle Sprachen.",
                    'ru' => "Глобальная платформа экстренной помощи для экспатов, путешественников и отдыхающих. Ответ <5 мин, 197 стран, все языки.",
                    'pt' => "A plataforma mundial de emergência para expatriados, viajantes e turistas. Resposta <5 min, 197 países, todos idiomas.",
                    'ar' => "المنصة العالمية للطوارئ للمغتربين والمسافرين والمصطافين. رد <5 دقيقة، 197 دولة، جميع اللغات.",
                    'zh' => "全球紧急平台为外籍人士、旅行者和度假者服务。<5分钟回复，197国家，所有语言。",
                    'hi' => "प्रवासियों, यात्रियों और छुट्टियों वालों के लिए वैश्विक आपातकालीन मंच। <5 मिनट प्रतिक्रिया, 197 देश, सभी भाषाएं।"
                ]
            ),
            'services' => $this->createType(
                ['fr' => 'Services', 'en' => 'Services', 'es' => 'Servicios', 'de' => 'Dienste', 'ru' => 'Услуги', 'pt' => 'Serviços', 'ar' => 'خدمات', 'zh' => '服务', 'hi' => 'सेवाएं'],
                90, true, true, true, true, true,
                [
                    'fr' => "Aide d'urgence 24/7 pour TOUT problème. Professionnels qualifiés 197 pays. TOUTES langues. Réponse <5 min.",
                    'en' => "24/7 emergency help for ANY problem. Qualified professionals 197 countries. ALL languages. Response <5 min.",
                    'es' => "Ayuda de emergencia 24/7 para CUALQUIER problema. Profesionales calificados 197 países. TODOS idiomas. Respuesta <5 min.",
                    'de' => "24/7 Nothilfe für JEDES Problem. Qualifizierte Fachleute 197 Länder. ALLE Sprachen. Antwort <5 Min.",
                    'ru' => "Экстренная помощь 24/7 для ЛЮБОЙ проблемы. Квалифицированные специалисты 197 стран. ВСЕ языки. Ответ <5 мин.",
                    'pt' => "Ajuda de emergência 24/7 para QUALQUER problema. Profissionais qualificados 197 países. TODOS idiomas. Resposta <5 min.",
                    'ar' => "مساعدة طوارئ 24/7 لأي مشكلة. محترفون مؤهلون 197 دولة. جميع اللغات. رد <5 دقيقة.",
                    'zh' => "24/7紧急帮助任何问题。合格专业人员197国家。所有语言。<5分钟回复。",
                    'hi' => "किसी भी समस्या के लिए 24/7 आपातकालीन सहायता। योग्य पेशेवर 197 देश। सभी भाषाएं। <5 मिनट प्रतिक्रिया।"
                ]
            ),
            'differentiators' => $this->createType(
                ['fr' => 'Différenciateurs', 'en' => 'Differentiators', 'es' => 'Diferenciadores', 'de' => 'Unterschiede', 'ru' => 'Отличия', 'pt' => 'Diferenciadores', 'ar' => 'مميزات', 'zh' => '优势', 'hi' => 'विभेदक'],
                95, true, true, true, true, true,
                [
                    'fr' => "Seule plateforme <5 min (vs 24-48h ailleurs). 197 pays, toutes nationalités, TOUTES langues.",
                    'en' => "Only platform <5 min (vs 24-48h elsewhere). 197 countries, all nationalities, ALL languages.",
                    'es' => "Única plataforma <5 min (vs 24-48h otros). 197 países, todas nacionalidades, TODOS idiomas.",
                    'de' => "Einzige Plattform <5 Min (vs 24-48h anderswo). 197 Länder, alle Nationalitäten, ALLE Sprachen.",
                    'ru' => "Единственная платформа <5 мин (против 24-48ч в других местах). 197 стран, все национальности, ВСЕ языки.",
                    'pt' => "Única plataforma <5 min (vs 24-48h outros). 197 países, todas nacionalidades, TODOS idiomas.",
                    'ar' => "المنصة الوحيدة <5 دقيقة (مقابل 24-48س). 197 دولة، جميع الجنسيات، جميع اللغات.",
                    'zh' => "唯一<5分钟平台（其他24-48小时）。197国家，所有国籍，所有语言。",
                    'hi' => "केवल <5 मिनट मंच (अन्य 24-48घंटे)। 197 देश, सभी राष्ट्रीयताएं, सभी भाषाएं।"
                ]
            ),
            'tone' => $this->createType(
                ['fr' => 'Ton', 'en' => 'Tone', 'es' => 'Tono', 'de' => 'Ton', 'ru' => 'Тон', 'pt' => 'Tom', 'ar' => 'نبرة', 'zh' => '语气', 'hi' => 'स्वर'],
                85, true, true, true, true, true,
                [
                    'fr' => "Vouvoiement OBLIGATOIRE. Rassurant, professionnel, empathique. JAMAIS: panique. TOUJOURS: sérénité, solution.",
                    'en' => "Formal MANDATORY. Reassuring, professional, empathetic. NEVER: panic. ALWAYS: serenity, solution.",
                    'es' => "Formal OBLIGATORIO. Tranquilizador, profesional, empático. NUNCA: pánico. SIEMPRE: serenidad, solución.",
                    'de' => "Förmlich PFLICHT. Beruhigend, professionell, einfühlsam. NIEMALS: Panik. IMMER: Gelassenheit, Lösung.",
                    'ru' => "Формальный ОБЯЗАТЕЛЕН. Успокаивающий, профессиональный, эмпатичный. НИКОГДА: паника. ВСЕГДА: спокойствие, решение.",
                    'pt' => "Formal OBRIGATÓRIO. Tranquilizador, profissional, empático. NUNCA: pânico. SEMPRE: serenidade, solução.",
                    'ar' => "رسمي إلزامي. مطمئن، مهني، متعاطف. أبدا: ذعر. دائما: هدوء، حل.",
                    'zh' => "正式必需。安心、专业、同理心。绝不：恐慌。始终：平静、解决。",
                    'hi' => "औपचारिक अनिवार्य। आश्वस्त, पेशेवर, सहानुभूतिपूर्ण। कभी नहीं: घबराहट। हमेशा: शांति, समाधान।"
                ]
            ),
            'style' => $this->createType(
                ['fr' => 'Style', 'en' => 'Style', 'es' => 'Estilo', 'de' => 'Stil', 'ru' => 'Стиль', 'pt' => 'Estilo', 'ar' => 'أسلوب', 'zh' => '风格', 'hi' => 'शैली'],
                80, true, true, true, true, true,
                [
                    'fr' => "Phrases courtes 15-20 mots. Paragraphes 3-4 lignes. Listes à puces. Chiffres précis.",
                    'en' => "Short sentences 15-20 words. Paragraphs 3-4 lines. Bullet points. Precise numbers.",
                    'es' => "Frases cortas 15-20 palabras. Párrafos 3-4 líneas. Viñetas. Números precisos.",
                    'de' => "Kurze Sätze 15-20 Wörter. Absätze 3-4 Zeilen. Aufzählungspunkte. Präzise Zahlen.",
                    'ru' => "Короткие предложения 15-20 слов. Абзацы 3-4 строки. Маркированные списки. Точные цифры.",
                    'pt' => "Frases curtas 15-20 palavras. Parágrafos 3-4 linhas. Marcadores. Números precisos.",
                    'ar' => "جمل قصيرة 15-20 كلمة. فقرات 3-4 أسطر. نقاط. أرقام دقيقة.",
                    'zh' => "短句15-20字。段落3-4行。项目符号。精确数字。",
                    'hi' => "छोटे वाक्य 15-20 शब्द। पैराग्राफ 3-4 पंक्तियां। बुलेट पॉइंट। सटीक संख्या।"
                ]
            ),
            'vocabulary' => $this->createType(
                ['fr' => 'Vocabulaire', 'en' => 'Vocabulary', 'es' => 'Vocabulario', 'de' => 'Vokabular', 'ru' => 'Словарь', 'pt' => 'Vocabulário', 'ar' => 'مفردات', 'zh' => '词汇', 'hi' => 'शब्दावली'],
                70, true, true, true, true, true,
                [
                    'fr' => "TOUJOURS: 'aide d'urgence', 'professionnel qualifié', 'expatrié', 'voyageur', 'vacancier'. JAMAIS: 'immigrant', 'assistant'.",
                    'en' => "ALWAYS: 'emergency assistance', 'qualified professional', 'expat', 'traveler', 'vacationer'. NEVER: 'immigrant', 'assistant'.",
                    'es' => "SIEMPRE: 'ayuda de emergencia', 'profesional calificado', 'expatriado', 'viajero', 'vacacionista'. NUNCA: 'inmigrante', 'asistente'.",
                    'de' => "IMMER: 'Nothilfe', 'qualifizierter Fachmann', 'Expatriate', 'Reisender', 'Urlauber'. NIEMALS: 'Einwanderer', 'Assistent'.",
                    'ru' => "ВСЕГДА: 'экстренная помощь', 'квалифицированный специалист', 'экспат', 'путешественник', 'отдыхающий'. НИКОГДА: 'иммигрант', 'ассистент'.",
                    'pt' => "SEMPRE: 'assistência de emergência', 'profissional qualificado', 'expatriado', 'viajante', 'turista'. NUNCA: 'imigrante', 'assistente'.",
                    'ar' => "دائما: 'مساعدة طارئة'، 'محترف مؤهل'، 'مغترب'، 'مسافر'، 'مصطاف'. أبدا: 'مهاجر'، 'مساعد'.",
                    'zh' => "始终：'紧急援助'、'合格专业人员'、'外籍人士'、'旅行者'、'度假者'。绝不：'移民'、'助理'。",
                    'hi' => "हमेशा: 'आपातकालीन सहायता', 'योग्य पेशेवर', 'प्रवासी', 'यात्री', 'छुट्टियों वाले'। कभी नहीं: 'अप्रवासी', 'सहायक'।"
                ]
            ),
            'examples' => $this->createType(
                ['fr' => 'Exemples', 'en' => 'Examples', 'es' => 'Ejemplos', 'de' => 'Beispiele', 'ru' => 'Примеры', 'pt' => 'Exemplos', 'ar' => 'أمثلة', 'zh' => '示例', 'hi' => 'उदाहरण'],
                60, true, true, false, true, false,
                [
                    'fr' => "Intro: 'Problème urgent? SOS-Expat vous connecte en <5 min.' CTA: 'Obtenez de l'aide maintenant'.",
                    'en' => "Intro: 'Urgent problem? SOS-Expat connects you in <5 min.' CTA: 'Get help now'.",
                    'es' => "Intro: '¿Problema urgente? SOS-Expat lo conecta en <5 min.' CTA: 'Obtenga ayuda ahora'.",
                    'de' => "Intro: 'Dringendes Problem? SOS-Expat verbindet Sie in <5 Min.' CTA: 'Jetzt Hilfe erhalten'.",
                    'ru' => "Вступление: 'Срочная проблема? SOS-Expat соединит вас за <5 мин.' CTA: 'Получить помощь сейчас'.",
                    'pt' => "Intro: 'Problema urgente? SOS-Expat conecta você em <5 min.' CTA: 'Obtenha ajuda agora'.",
                    'ar' => "مقدمة: 'مشكلة عاجلة؟ SOS-Expat يربطك في <5 دقيقة.' CTA: 'احصل على المساعدة الآن'.",
                    'zh' => "引言：'紧急问题？SOS-Expat在<5分钟内连接您。' CTA：'立即获得帮助'。",
                    'hi' => "परिचय: 'तत्काल समस्या? SOS-Expat आपको <5 मिनट में जोड़ता है।' CTA: 'अभी सहायता प्राप्त करें'।"
                ]
            ),
            'donts' => $this->createType(
                ['fr' => 'Interdictions', 'en' => 'Prohibitions', 'es' => 'Prohibiciones', 'de' => 'Verbote', 'ru' => 'Запреты', 'pt' => 'Proibições', 'ar' => 'محظورات', 'zh' => '禁止', 'hi' => 'निषेध'],
                100, true, true, true, true, true,
                [
                    'fr' => "JAMAIS humour sur urgences. JAMAIS minimiser. JAMAIS >25 mots. JAMAIS tutoyer. JAMAIS 'immigrant'. JAMAIS limiter aux expatriés.",
                    'en' => "NEVER joke about emergencies. NEVER minimize. NEVER >25 words. NEVER informal. NEVER 'immigrant'. NEVER limit to expats.",
                    'es' => "NUNCA humor sobre emergencias. NUNCA minimizar. NUNCA >25 palabras. NUNCA tutear. NUNCA 'inmigrante'. NUNCA limitar a expatriados.",
                    'de' => "NIEMALS Witze über Notfälle. NIEMALS herunterspielen. NIEMALS >25 Wörter. NIEMALS duzen. NIEMALS 'Einwanderer'. NIEMALS auf Expatriates beschränken.",
                    'ru' => "НИКОГДА не шутить о чрезвычайных ситуациях. НИКОГДА не преуменьшать. НИКОГДА >25 слов. НИКОГДА неформально. НИКОГДА 'иммигрант'. НИКОГДА не ограничиваться экспатами.",
                    'pt' => "NUNCA humor sobre emergências. NUNCA minimizar. NUNCA >25 palavras. NUNCA tratamento informal. NUNCA 'imigrante'. NUNCA limitar a expatriados.",
                    'ar' => "أبدا مزاح عن طوارئ. أبدا تقليل. أبدا >25 كلمة. أبدا غير رسمي. أبدا 'مهاجر'. أبدا حصر على مغتربين.",
                    'zh' => "绝不开玩笑紧急情况。绝不轻视。绝不>25字。绝不非正式。绝不'移民'。绝不限外籍人士。",
                    'hi' => "कभी नहीं आपातकाल पर मजाक। कभी नहीं कम करें। कभी नहीं >25 शब्द। कभी नहीं अनौपचारिक। कभी नहीं 'अप्रवासी'। कभी नहीं केवल प्रवासियों तक।"
                ]
            ),
            'values' => $this->createType(
                ['fr' => 'Valeurs', 'en' => 'Values', 'es' => 'Valores', 'de' => 'Werte', 'ru' => 'Ценности', 'pt' => 'Valores', 'ar' => 'قيم', 'zh' => '价值', 'hi' => 'मूल्य'],
                50, false, true, false, true, true,
                [
                    'fr' => "Excellence. Rapidité (<5 min). Disponibilité (24/7/365). Universalité (197 pays, toutes langues). Empathie. Inclusion (expatriés, voyageurs, vacanciers).",
                    'en' => "Excellence. Speed (<5 min). Availability (24/7/365). Universality (197 countries, all languages). Empathy. Inclusion (expats, travelers, vacationers).",
                    'es' => "Excelencia. Rapidez (<5 min). Disponibilidad (24/7/365). Universalidad (197 países, todos idiomas). Empatía. Inclusión (expatriados, viajeros, vacacionistas).",
                    'de' => "Exzellenz. Geschwindigkeit (<5 Min). Verfügbarkeit (24/7/365). Universalität (197 Länder, alle Sprachen). Empathie. Inklusion (Expatriates, Reisende, Urlauber).",
                    'ru' => "Превосходство. Скорость (<5 мин). Доступность (24/7/365). Универсальность (197 стран, все языки). Эмпатия. Включение (экспаты, путешественники, отдыхающие).",
                    'pt' => "Excelência. Rapidez (<5 min). Disponibilidade (24/7/365). Universalidade (197 países, todos idiomas). Empatia. Inclusão (expatriados, viajantes, turistas).",
                    'ar' => "التميز. السرعة (<5 دقيقة). التوفر (24/7/365). العالمية (197 دولة، جميع اللغات). التعاطف. الشمول (مغتربون، مسافرون، مصطافون).",
                    'zh' => "卓越。速度（<5分钟）。可用性（24/7/365）。普遍性（197国家，所有语言）。同理心。包容性（外籍人士、旅行者、度假者）。",
                    'hi' => "उत्कृष्टता। गति (<5 मिनट)। उपलब्धता (24/7/365)। सार्वभौमिकता (197 देश, सभी भाषाएं)। सहानुभूति। समावेश (प्रवासी, यात्री, छुट्टियों वाले)।"
                ]
            ),
            'grammar' => $this->createType(
                ['fr' => 'Grammaire', 'en' => 'Grammar', 'es' => 'Gramática', 'de' => 'Grammatik', 'ru' => 'Грамматика', 'pt' => 'Gramática', 'ar' => 'قواعد', 'zh' => '语法', 'hi' => 'व्याकरण'],
                75, true, true, true, true, true,
                [
                    'fr' => "Temps : Présent prioritaire. Voix : Active (vs passive). Ponctuation : Points fréquents. Virgules : Pas d'abus.",
                    'en' => "Tense: Present priority. Voice: Active (vs passive). Punctuation: Frequent periods. Commas: No abuse.",
                    'es' => "Tiempo: Presente prioritario. Voz: Activa (vs pasiva). Puntuación: Puntos frecuentes. Comas: Sin abuso.",
                    'de' => "Zeit: Präsens Priorität. Stimme: Aktiv (vs passiv). Interpunktion: Häufige Punkte. Kommas: Kein Missbrauch.",
                    'ru' => "Время: Настоящее приоритет. Залог: Активный (не пассивный). Пунктуация: Частые точки. Запятые: Не злоупотреблять.",
                    'pt' => "Tempo: Presente prioritário. Voz: Ativa (vs passiva). Pontuação: Pontos frequentes. Vírgulas: Sem abuso.",
                    'ar' => "الزمن: الحاضر أولوية. الصوت: نشط (مقابل سلبي). الترقيم: نقاط متكررة. الفواصل: لا إفراط.",
                    'zh' => "时态：现在时优先。语态：主动（非被动）。标点：句号频繁。逗号：不滥用。",
                    'hi' => "काल: वर्तमान प्राथमिकता। स्वर: सक्रिय (निष्क्रिय नहीं)। विराम चिह्न: बार-बार पूर्ण विराम। अल्पविराम: दुरुपयोग नहीं।"
                ]
            ),
            'formatting' => $this->createType(
                ['fr' => 'Formatage', 'en' => 'Formatting', 'es' => 'Formato', 'de' => 'Formatierung', 'ru' => 'Форматирование', 'pt' => 'Formatação', 'ar' => 'تنسيق', 'zh' => '格式', 'hi' => 'स्वरूपण'],
                70, true, true, true, true, true,
                [
                    'fr' => "Titres : H2 questions, H3 précisions. Gras : 3-5 mots-clés/article. Italique : Termes techniques 1ère occurrence. Listes : Bullets (•) ou numérotées.",
                    'en' => "Titles: H2 questions, H3 details. Bold: 3-5 keywords/article. Italic: Technical terms 1st occurrence. Lists: Bullets (•) or numbered.",
                    'es' => "Títulos: H2 preguntas, H3 detalles. Negrita: 3-5 palabras clave/artículo. Cursiva: Términos técnicos 1ª aparición. Listas: Viñetas (•) o numeradas.",
                    'de' => "Titel: H2 Fragen, H3 Details. Fett: 3-5 Schlüsselwörter/Artikel. Kursiv: Fachbegriffe 1. Vorkommen. Listen: Aufzählungspunkte (•) oder nummeriert.",
                    'ru' => "Заголовки: H2 вопросы, H3 детали. Жирный: 3-5 ключевых слов/статья. Курсив: Технические термины первое упоминание. Списки: Маркеры (•) или нумерованные.",
                    'pt' => "Títulos: H2 perguntas, H3 detalhes. Negrito: 3-5 palavras-chave/artigo. Itálico: Termos técnicos 1ª ocorrência. Listas: Marcadores (•) ou numeradas.",
                    'ar' => "العناوين: H2 أسئلة، H3 تفاصيل. غامق: 3-5 كلمات مفتاحية/مقال. مائل: مصطلحات تقنية أول ظهور. قوائم: نقاط (•) أو مرقمة.",
                    'zh' => "标题：H2问题，H3详情。粗体：3-5关键词/文章。斜体：技术术语首次出现。列表：项目符号(•)或编号。",
                    'hi' => "शीर्षक: H2 प्रश्न, H3 विवरण। बोल्ड: 3-5 मुख्य शब्द/लेख। इटैलिक: तकनीकी शब्द पहली बार। सूचियां: बुलेट (•) या क्रमांकित।"
                ]
            ),
            'headlines' => $this->createType(
                ['fr' => 'Titres', 'en' => 'Headlines', 'es' => 'Títulos', 'de' => 'Überschriften', 'ru' => 'Заголовки', 'pt' => 'Títulos', 'ar' => 'عناوين', 'zh' => '标题', 'hi' => 'शीर्षक'],
                65, true, true, true, true, true,
                [
                    'fr' => "Format : Question (50%) ou Affirmation bénéfice (50%). Longueur : 50-70 caractères. Ex: 'Comment trouver un avocat en urgence en Thaïlande ?' ou 'Assistance juridique 24/7 pour expatriés'",
                    'en' => "Format: Question (50%) or Benefit statement (50%). Length: 50-70 chars. Ex: 'How to find a lawyer urgently in Thailand?' or '24/7 legal assistance for expats'",
                    'es' => "Formato: Pregunta (50%) o Declaración de beneficio (50%). Longitud: 50-70 caracteres. Ej: '¿Cómo encontrar abogado urgente en Tailandia?' o 'Asistencia legal 24/7 para expatriados'",
                    'de' => "Format: Frage (50%) oder Nutzenaussage (50%). Länge: 50-70 Zeichen. Bsp: 'Wie finde ich dringend einen Anwalt in Thailand?' oder '24/7 Rechtsberatung für Expats'",
                    'ru' => "Формат: Вопрос (50%) или Утверждение о пользе (50%). Длина: 50-70 символов. Пример: 'Как срочно найти адвоката в Таиланде?' или 'Юридическая помощь 24/7 для экспатов'",
                    'pt' => "Formato: Pergunta (50%) ou Declaração de benefício (50%). Comprimento: 50-70 caracteres. Ex: 'Como encontrar advogado urgente na Tailândia?' ou 'Assistência jurídica 24/7 para expatriados'",
                    'ar' => "التنسيق: سؤال (50%) أو بيان فائدة (50%). الطول: 50-70 حرف. مثال: 'كيف تجد محامياً عاجلاً في تايلاند؟' أو 'مساعدة قانونية 24/7 للمغتربين'",
                    'zh' => "格式：问题(50%)或利益声明(50%)。长度：50-70字符。例：'如何在泰国紧急找律师？'或'外籍人士24/7法律援助'",
                    'hi' => "प्रारूप: प्रश्न (50%) या लाभ कथन (50%)। लंबाई: 50-70 वर्ण। उदा: 'थाईलैंड में तत्काल वकील कैसे खोजें?' या 'प्रवासियों के लिए 24/7 कानूनी सहायता'"
                ]
            ),
            'cta' => $this->createType(
                ['fr' => 'CTA', 'en' => 'CTA', 'es' => 'CTA', 'de' => 'CTA', 'ru' => 'Призыв', 'pt' => 'CTA', 'ar' => 'دعوة', 'zh' => '行动号召', 'hi' => 'CTA'],
                60, true, true, true, true, true,
                [
                    'fr' => "Formats efficaces : 'Contactez un avocat maintenant', 'Obtenez une consultation en 5 minutes', 'Trouvez votre expert vérifié'. ÉVITER : 'Cliquez ici', 'En savoir plus' (trop vague).",
                    'en' => "Effective formats: 'Contact a lawyer now', 'Get a consultation in 5 minutes', 'Find your verified expert'. AVOID: 'Click here', 'Learn more' (too vague).",
                    'es' => "Formatos efectivos: 'Contacte abogado ahora', 'Obtenga consulta en 5 minutos', 'Encuentre su experto verificado'. EVITAR: 'Haga clic aquí', 'Más información' (demasiado vago).",
                    'de' => "Effektive Formate: 'Kontaktieren Sie jetzt einen Anwalt', 'Erhalten Sie Beratung in 5 Minuten', 'Finden Sie Ihren verifizierten Experten'. VERMEIDEN: 'Hier klicken', 'Mehr erfahren' (zu vage).",
                    'ru' => "Эффективные форматы: 'Свяжитесь с адвокатом сейчас', 'Получите консультацию за 5 минут', 'Найдите проверенного эксперта'. ИЗБЕГАТЬ: 'Нажмите здесь', 'Узнать больше' (слишком расплывчато).",
                    'pt' => "Formatos eficazes: 'Contacte advogado agora', 'Obtenha consulta em 5 minutos', 'Encontre especialista verificado'. EVITAR: 'Clique aqui', 'Saiba mais' (muito vago).",
                    'ar' => "تنسيقات فعالة: 'اتصل بمحامٍ الآن'، 'احصل على استشارة في 5 دقائق'، 'ابحث عن خبير موثق'. تجنب: 'انقر هنا'، 'تعرف على المزيد' (غامض للغاية).",
                    'zh' => "有效格式：'立即联系律师'，'5分钟获得咨询'，'找到认证专家'。避免：'点击这里'，'了解更多'（太模糊）。",
                    'hi' => "प्रभावी प्रारूप: 'अभी वकील से संपर्क करें', '5 मिनट में परामर्श प्राप्त करें', 'सत्यापित विशेषज्ञ खोजें'। बचें: 'यहां क्लिक करें', 'और जानें' (बहुत अस्पष्ट)।"
                ]
            ),
            'storytelling' => $this->createType(
                ['fr' => 'Storytelling', 'en' => 'Storytelling', 'es' => 'Narrativa', 'de' => 'Storytelling', 'ru' => 'Рассказ', 'pt' => 'Storytelling', 'ar' => 'سرد', 'zh' => '故事讲述', 'hi' => 'कहानी'],
                55, true, true, true, false, false,
                [
                    'fr' => "Structure : Situation → Complication → Résolution. Ex: 'Marie, expatriée à Bangkok, arrêtée excès vitesse. Panique, barrière langue, méconnaissance lois. SOS-Expat : avocat thaï 3 min, situation réglée 24h.'",
                    'en' => "Structure: Situation → Complication → Resolution. Ex: 'Marie, expat in Bangkok, arrested speeding. Panic, language barrier, unknown laws. SOS-Expat: Thai lawyer 3 min, resolved 24h.'",
                    'es' => "Estructura: Situación → Complicación → Resolución. Ej: 'María, expatriada Bangkok, arrestada exceso velocidad. Pánico, barrera idioma, leyes desconocidas. SOS-Expat: abogado tailandés 3 min, resuelto 24h.'",
                    'de' => "Struktur: Situation → Komplikation → Auflösung. Bsp: 'Maria, Expat Bangkok, wegen Geschwindigkeitsüberschreitung verhaftet. Panik, Sprachbarriere, unbekannte Gesetze. SOS-Expat: Thai-Anwalt 3 Min, gelöst 24h.'",
                    'ru' => "Структура: Ситуация → Осложнение → Решение. Пример: 'Мария, экспат в Бангкоке, арестована за превышение скорости. Паника, языковой барьер, незнание законов. SOS-Expat: тайский адвокат 3 мин, решено за 24ч.'",
                    'pt' => "Estrutura: Situação → Complicação → Resolução. Ex: 'Maria, expatriada Bangkok, presa excesso velocidade. Pânico, barreira idioma, leis desconhecidas. SOS-Expat: advogado tailandês 3 min, resolvido 24h.'",
                    'ar' => "الهيكل: وضع ← تعقيد ← حل. مثال: 'ماريا، مغتربة بانكوك، اعتقلت سرعة زائدة. ذعر، حاجز لغوي، قوانين مجهولة. SOS-Expat: محامٍ تايلاندي 3 دقائق، حُل 24س.'",
                    'zh' => "结构：情况→复杂化→解决。例：'玛丽，曼谷外籍人士，超速被捕。恐慌、语言障碍、法律不明。SOS-Expat：泰国律师3分钟，24小时解决。'",
                    'hi' => "संरचना: स्थिति → जटिलता → समाधान। उदा: 'मारिया, बैंकॉक प्रवासी, तेज गति से गिरफ्तार। घबराहट, भाषा बाधा, अज्ञात कानून। SOS-Expat: थाई वकील 3 मिनट, 24घंटे हल।'"
                ]
            ),
        ];
    }

    private function getUlixaiData(): array
    {
        return [
            'facts' => $this->createType(
                ['fr' => 'Faits clés', 'en' => 'Key facts', 'es' => 'Datos clave', 'de' => 'Fakten', 'ru' => 'Факты', 'pt' => 'Fatos', 'ar' => 'حقائق', 'zh' => '事实', 'hi' => 'तथ्य'],
                100, true, true, true, true, true,
                [
                    'fr' => "Ulixai est LA SEULE marketplace collaborative internationale. Demandeurs et prestataires. Paiement séquestre. TOUS services. 197 pays. 9 langues.",
                    'en' => "Ulixai is THE ONLY international collaborative marketplace. Seekers and providers. Escrow payment. ALL services. 197 countries. 9 languages.",
                    'es' => "Ulixai es EL ÚNICO marketplace colaborativo internacional. Solicitantes y proveedores. Pago en custodia. TODOS servicios. 197 países. 9 idiomas.",
                    'de' => "Ulixai ist DER EINZIGE internationale kollaborative Marktplatz. Suchende und Anbieter. Treuhandzahlung. ALLE Dienstleistungen. 197 Länder. 9 Sprachen.",
                    'ru' => "Ulixai — это ЕДИНСТВЕННАЯ международная коллаборативная торговая площадка. Запрашивающие и поставщики. Эскроу-платеж. ВСЕ услуги. 197 стран. 9 языков.",
                    'pt' => "Ulixai é O ÚNICO marketplace colaborativo internacional. Solicitantes e prestadores. Pagamento custódia. TODOS serviços. 197 países. 9 idiomas.",
                    'ar' => "Ulixai هو السوق التعاوني الدولي الوحيد. طالبون ومقدمون. دفع ضمان. جميع الخدمات. 197 دولة. 9 لغات.",
                    'zh' => "Ulixai是唯一国际协作市场。需求者和提供者。托管支付。所有服务。197国家。9语言。",
                    'hi' => "Ulixai एकमात्र अंतर्राष्ट्रीय सहयोगी बाज़ार है। मांगने वाले और प्रदाता। एस्क्रो भुगतान। सभी सेवाएं। 197 देश। 9 भाषाएं।"
                ]
            ),
            'about' => $this->createType(
                ['fr' => 'À propos', 'en' => 'About', 'es' => 'Acerca', 'de' => 'Über', 'ru' => 'О нас', 'pt' => 'Sobre', 'ar' => 'معلومات', 'zh' => '关于', 'hi' => 'बारे'],
                100, true, true, true, true, true,
                [
                    'fr' => "LA SEULE marketplace collaborative. Demandeur poste > prestataires répondent > choix libre. Paiement séquestre. Concurrence bienveillante. 197 pays.",
                    'en' => "THE ONLY collaborative marketplace. Seeker posts > providers respond > free choice. Escrow payment. Benevolent competition. 197 countries.",
                    'es' => "EL ÚNICO marketplace colaborativo. Solicitante publica > proveedores responden > elección libre. Pago custodia. Competencia benevolente. 197 países.",
                    'de' => "DER EINZIGE kollaborative Marktplatz. Suchender postet > Anbieter antworten > freie Wahl. Treuhand. Wohlwollender Wettbewerb. 197 Länder.",
                    'ru' => "ЕДИНСТВЕННАЯ коллаборативная площадка. Запрашивающий публикует > поставщики отвечают > свободный выбор. Эскроу-платеж. Доброжелательная конкуренция. 197 стран.",
                    'pt' => "O ÚNICO marketplace colaborativo. Solicitante publica > prestadores respondem > escolha livre. Custódia. Competição benevolente. 197 países.",
                    'ar' => "السوق التعاوني الوحيد. طالب ينشر > مقدمون يردون > اختيار حر. ضمان. منافسة خيرة. 197 دولة.",
                    'zh' => "唯一协作市场。需求者发布>提供者回应>自由选择。托管。良性竞争。197国家。",
                    'hi' => "एकमात्र सहयोगी बाज़ार। मांगने वाला पोस्ट>प्रदाता जवाब>मुक्त विकल्प। एस्क्रो। दयालु प्रतिस्पर्धा। 197 देश।"
                ]
            ),
            'services' => $this->createType(
                ['fr' => 'Services', 'en' => 'Services', 'es' => 'Servicios', 'de' => 'Dienste', 'ru' => 'Услуги', 'pt' => 'Serviços', 'ar' => 'خدمات', 'zh' => '服务', 'hi' => 'सेवाएं'],
                90, true, true, true, true, true,
                [
                    'fr' => "TOUS services: déménagement, immobilier, papiers, traductions, travaux, ménage, garde enfants, etc. 197 pays.",
                    'en' => "ALL services: moving, real estate, paperwork, translations, construction, cleaning, childcare, etc. 197 countries.",
                    'es' => "TODOS servicios: mudanza, inmobiliario, trámites, traducciones, trabajos, limpieza, cuidado niños, etc. 197 países.",
                    'de' => "ALLE Dienstleistungen: Umzug, Immobilien, Papiere, Übersetzungen, Arbeiten, Reinigung, Kinderbetreuung, etc. 197 Länder.",
                    'ru' => "ВСЕ услуги: переезд, недвижимость, документы, переводы, работы, уборка, уход за детьми и т.д. 197 стран.",
                    'pt' => "TODOS serviços: mudança, imobiliário, documentos, traduções, trabalhos, limpeza, cuidado infantil, etc. 197 países.",
                    'ar' => "جميع الخدمات: نقل، عقارات، أوراق، ترجمات، أعمال، تنظيف، رعاية أطفال، إلخ. 197 دولة.",
                    'zh' => "所有服务：搬家、房地产、文件、翻译、建筑、清洁、儿童看护等。197国家。",
                    'hi' => "सभी सेवाएं: स्थानांतरण, रियल एस्टेट, कागजात, अनुवाद, काम, सफाई, बाल देखभाल आदि। 197 देश।"
                ]
            ),
            'differentiators' => $this->createType(
                ['fr' => 'Différenciateurs', 'en' => 'Differentiators', 'es' => 'Diferenciadores', 'de' => 'Unterschiede', 'ru' => 'Отличия', 'pt' => 'Diferenciadores', 'ar' => 'مميزات', 'zh' => '优势', 'hi' => 'विभेदक'],
                95, true, true, true, true, true,
                [
                    'fr' => "UNIQUE: Paiement séquestre. Marketplace collaborative. 197 pays. Concurrence bienveillante = tarifs économiques. Messagerie publique transparente.",
                    'en' => "UNIQUE: Escrow payment. Collaborative marketplace. 197 countries. Benevolent competition = economical rates. Transparent public messaging.",
                    'es' => "ÚNICO: Pago custodia. Marketplace colaborativo. 197 países. Competencia benevolente = tarifas económicas. Mensajería pública transparente.",
                    'de' => "EINZIGARTIG: Treuhandzahlung. Kollaborativer Marktplatz. 197 Länder. Wohlwollender Wettbewerb = wirtschaftliche Tarife. Transparentes öffentliches Messaging.",
                    'ru' => "УНИКАЛЬНО: Эскроу-платеж. Коллаборативная площадка. 197 стран. Доброжелательная конкуренция = экономичные тарифы. Прозрачный публичный обмен сообщениями.",
                    'pt' => "ÚNICO: Pagamento custódia. Marketplace colaborativo. 197 países. Competição benevolente = tarifas econômicas. Mensagem pública transparente.",
                    'ar' => "فريد: دفع ضمان. سوق تعاوني. 197 دولة. منافسة خيرة = أسعار اقتصادية. مراسلة عامة شفافة.",
                    'zh' => "独特：托管支付。协作市场。197国家。良性竞争=经济价格。透明公共消息。",
                    'hi' => "अद्वितीय: एस्क्रो भुगतान। सहयोगी बाज़ार। 197 देश। दयालु प्रतिस्पर्धा=किफायती दरें। पारदर्शी सार्वजनिक संदेश।"
                ]
            ),
            'tone' => $this->createType(
                ['fr' => 'Ton', 'en' => 'Tone', 'es' => 'Tono', 'de' => 'Ton', 'ru' => 'Тон', 'pt' => 'Tom', 'ar' => 'نبرة', 'zh' => '语气', 'hi' => 'स्वर'],
                85, true, true, true, true, true,
                [
                    'fr' => "Casual dynamique (5/10). Positif, énergique. S'adresser à tous: expatriés, voyageurs, vacanciers. TOUJOURS: enthousiaste, collaboratif.",
                    'en' => "Casual dynamic (5/10). Positive, energetic. Address everyone: expats, travelers, vacationers. ALWAYS: enthusiastic, collaborative.",
                    'es' => "Casual dinámico (5/10). Positivo, enérgico. Dirigirse a todos: expatriados, viajeros, vacacionistas. SIEMPRE: entusiasta, colaborativo.",
                    'de' => "Locker dynamisch (5/10). Positiv, energisch. Alle ansprechen: Expatriates, Reisende, Urlauber. IMMER: enthusiastisch, kollaborativ.",
                    'ru' => "Непринужденный динамичный (5/10). Позитивный, энергичный. Обращаться ко всем: экспаты, путешественники, отдыхающие. ВСЕГДА: восторженный, совместный.",
                    'pt' => "Casual dinâmico (5/10). Positivo, energético. Dirigir-se a todos: expatriados, viajantes, turistas. SEMPRE: entusiasta, colaborativo.",
                    'ar' => "عفوي ديناميكي (5/10). إيجابي، نشط. التوجه للجميع: مغتربون، مسافرون، مصطافون. دائما: متحمس، تعاوني.",
                    'zh' => "轻松动态（5/10）。积极、有活力。面向所有人：外籍人士、旅行者、度假者。始终：热情、协作。",
                    'hi' => "आकस्मिक गतिशील (5/10)। सकारात्मक, ऊर्जावान। सभी को संबोधित: प्रवासी, यात्री, छुट्टियों वाले। हमेशा: उत्साही, सहयोगी।"
                ]
            ),
            'style' => $this->createType(
                ['fr' => 'Style', 'en' => 'Style', 'es' => 'Estilo', 'de' => 'Stil', 'ru' => 'Стиль', 'pt' => 'Estilo', 'ar' => 'أسلوب', 'zh' => '风格', 'hi' => 'शैली'],
                80, true, true, true, true, true,
                [
                    'fr' => "Dynamique engageant. Phrases 15-25 mots. Paragraphes 4-5 lignes. Émojis occasionnels ✨. Exemples concrets.",
                    'en' => "Dynamic engaging. Sentences 15-25 words. Paragraphs 4-5 lines. Occasional emojis ✨. Concrete examples.",
                    'es' => "Dinámico atractivo. Frases 15-25 palabras. Párrafos 4-5 líneas. Emojis ocasionales ✨. Ejemplos concretos.",
                    'de' => "Dynamisch ansprechend. Sätze 15-25 Wörter. Absätze 4-5 Zeilen. Gelegentliche Emojis ✨. Konkrete Beispiele.",
                    'ru' => "Динамичный увлекательный. Предложения 15-25 слов. Абзацы 4-5 строк. Случайные эмодзи ✨. Конкретные примеры.",
                    'pt' => "Dinâmico envolvente. Frases 15-25 palavras. Parágrafos 4-5 linhas. Emojis ocasionais ✨. Exemplos concretos.",
                    'ar' => "ديناميكي جذاب. جمل 15-25 كلمة. فقرات 4-5 أسطر. رموز عرضية ✨. أمثلة ملموسة.",
                    'zh' => "动态引人。句子15-25字。段落4-5行。偶尔表情符号✨。具体示例。",
                    'hi' => "गतिशील आकर्षक। वाक्य 15-25 शब्द। पैराग्राफ 4-5 पंक्तियां। कभी-कभार इमोजी✨। ठोस उदाहरण।"
                ]
            ),
            'vocabulary' => $this->createType(
                ['fr' => 'Vocabulaire', 'en' => 'Vocabulary', 'es' => 'Vocabulario', 'de' => 'Vokabular', 'ru' => 'Словарь', 'pt' => 'Vocabulário', 'ar' => 'مفردات', 'zh' => '词汇', 'hi' => 'शब्दावली'],
                70, true, true, true, true, true,
                [
                    'fr' => "TOUJOURS: 'prestataire' (JAMAIS 'assistant'/'freelance'), 'demandeur', 'paiement séquestre', 'SEULE plateforme mondiale'. JAMAIS: 'assistant', 'freelance'.",
                    'en' => "ALWAYS: 'provider' (NEVER 'assistant'/'freelancer'), 'seeker', 'escrow payment', 'ONLY global platform'. NEVER: 'assistant', 'freelancer'.",
                    'es' => "SIEMPRE: 'proveedor' (NUNCA 'asistente'/'freelance'), 'solicitante', 'pago custodia', 'ÚNICA plataforma global'. NUNCA: 'asistente', 'freelance'.",
                    'de' => "IMMER: 'Anbieter' (NIEMALS 'Assistent'/'Freelancer'), 'Suchender', 'Treuhandzahlung', 'EINZIGE globale Plattform'. NIEMALS: 'Assistent', 'Freelancer'.",
                    'ru' => "ВСЕГДА: 'поставщик' (НИКОГДА 'ассистент'/'фрилансер'), 'запрашивающий', 'эскроу-платеж', 'ЕДИНСТВЕННАЯ глобальная платформа'. НИКОГДА: 'ассистент', 'фрилансер'.",
                    'pt' => "SEMPRE: 'prestador' (NUNCA 'assistente'/'freelancer'), 'solicitante', 'pagamento custódia', 'ÚNICA plataforma global'. NUNCA: 'assistente', 'freelancer'.",
                    'ar' => "دائما: 'مقدم' (أبدا 'مساعد'/'مستقل')، 'طالب'، 'دفع ضمان'، 'المنصة العالمية الوحيدة'. أبدا: 'مساعد'، 'مستقل'.",
                    'zh' => "始终：'提供者'（绝不'助理'/'自由职业者'）、'需求者'、'托管支付'、'唯一全球平台'。绝不：'助理'、'自由职业者'。",
                    'hi' => "हमेशा: 'प्रदाता' (कभी नहीं 'सहायक'/'फ्रीलांसर'), 'मांगने वाला', 'एस्क्रो भुगतान', 'एकमात्र वैश्विक मंच'। कभी नहीं: 'सहायक', 'फ्रीलांसर'।"
                ]
            ),
            'examples' => $this->createType(
                ['fr' => 'Exemples', 'en' => 'Examples', 'es' => 'Ejemplos', 'de' => 'Beispiele', 'ru' => 'Примеры', 'pt' => 'Exemplos', 'ar' => 'أمثلة', 'zh' => '示例', 'hi' => 'उदाहरण'],
                60, true, true, false, true, false,
                [
                    'fr' => "Intro: 'Ulixai, LA SEULE marketplace mondiale. Postez, recevez offres, comparez, choisissez ✨' CTA: 'Postez maintenant - Gratuit'.",
                    'en' => "Intro: 'Ulixai, THE ONLY global marketplace. Post, receive offers, compare, choose ✨' CTA: 'Post now - Free'.",
                    'es' => "Intro: 'Ulixai, EL ÚNICO marketplace global. Publique, reciba ofertas, compare, elija ✨' CTA: 'Publique ahora - Gratis'.",
                    'de' => "Intro: 'Ulixai, DER EINZIGE globale Marktplatz. Posten, Angebote erhalten, vergleichen, wählen ✨' CTA: 'Jetzt posten - Kostenlos'.",
                    'ru' => "Вступление: 'Ulixai, ЕДИНСТВЕННАЯ глобальная площадка. Публикуйте, получайте предложения, сравнивайте, выбирайте ✨' CTA: 'Опубликовать сейчас - Бесплатно'.",
                    'pt' => "Intro: 'Ulixai, O ÚNICO marketplace global. Publique, receba ofertas, compare, escolha ✨' CTA: 'Publique agora - Grátis'.",
                    'ar' => "مقدمة: 'Ulixai، السوق العالمي الوحيد. انشر، استلم عروض، قارن، اختر ✨' CTA: 'انشر الآن - مجاني'.",
                    'zh' => "引言：'Ulixai，唯一全球市场。发布、收到报价、比较、选择✨' CTA：'立即发布 - 免费'。",
                    'hi' => "परिचय: 'Ulixai, एकमात्र वैश्विक बाज़ार। पोस्ट करें, प्रस्ताव प्राप्त करें, तुलना करें, चुनें✨' CTA: 'अभी पोस्ट करें - मुफ्त'।"
                ]
            ),
            'donts' => $this->createType(
                ['fr' => 'Interdictions', 'en' => 'Prohibitions', 'es' => 'Prohibiciones', 'de' => 'Verbote', 'ru' => 'Запреты', 'pt' => 'Proibições', 'ar' => 'محظورات', 'zh' => '禁止', 'hi' => 'निषेध'],
                100, true, true, true, true, true,
                [
                    'fr' => "JAMAIS résultats garantis. JAMAIS critiquer autres. JAMAIS >30 mots. JAMAIS 'assistant', 'freelance'. JAMAIS oublier: SEULE plateforme mondiale.",
                    'en' => "NEVER guaranteed results. NEVER criticize others. NEVER >30 words. NEVER 'assistant', 'freelancer'. NEVER forget: ONLY global platform.",
                    'es' => "NUNCA resultados garantizados. NUNCA criticar otros. NUNCA >30 palabras. NUNCA 'asistente', 'freelance'. NUNCA olvidar: ÚNICA plataforma global.",
                    'de' => "NIEMALS garantierte Ergebnisse. NIEMALS andere kritisieren. NIEMALS >30 Wörter. NIEMALS 'Assistent', 'Freelancer'. NIEMALS vergessen: EINZIGE globale Plattform.",
                    'ru' => "НИКОГДА не гарантированные результаты. НИКОГДА не критиковать других. НИКОГДА >30 слов. НИКОГДА 'ассистент', 'фрилансер'. НИКОГДА не забывать: ЕДИНСТВЕННАЯ глобальная платформа.",
                    'pt' => "NUNCA resultados garantidos. NUNCA criticar outros. NUNCA >30 palavras. NUNCA 'assistente', 'freelancer'. NUNCA esquecer: ÚNICA plataforma global.",
                    'ar' => "أبدا نتائج مضمونة. أبدا انتقاد آخرين. أبدا >30 كلمة. أبدا 'مساعد'، 'مستقل'. أبدا نسيان: المنصة العالمية الوحيدة.",
                    'zh' => "绝不保证结果。绝不批评他人。绝不>30字。绝不'助理'、'自由职业者'。绝不忘记：唯一全球平台。",
                    'hi' => "कभी नहीं गारंटीकृत परिणाम। कभी नहीं दूसरों की आलोचना। कभी नहीं >30 शब्द। कभी नहीं 'सहायक', 'फ्रीलांसर'। कभी नहीं भूलें: एकमात्र वैश्विक मंच।"
                ]
            ),
            'values' => $this->createType(
                ['fr' => 'Valeurs', 'en' => 'Values', 'es' => 'Valores', 'de' => 'Werte', 'ru' => 'Ценности', 'pt' => 'Valores', 'ar' => 'قيم', 'zh' => '价值', 'hi' => 'मूल्य'],
                50, false, true, false, true, true,
                [
                    'fr' => "Collaboration (marketplace unique). Sécurité (séquestre). Transparence. Équité (concurrence bienveillante). Universalité (expatriés, voyageurs, vacanciers).",
                    'en' => "Collaboration (unique marketplace). Security (escrow). Transparency. Fairness (benevolent competition). Universality (expats, travelers, vacationers).",
                    'es' => "Colaboración (marketplace único). Seguridad (custodia). Transparencia. Equidad (competencia benevolente). Universalidad (expatriados, viajeros, vacacionistas).",
                    'de' => "Zusammenarbeit (einzigartiger Marktplatz). Sicherheit (Treuhand). Transparenz. Fairness (wohlwollender Wettbewerb). Universalität (Expatriates, Reisende, Urlauber).",
                    'ru' => "Сотрудничество (уникальная площадка). Безопасность (эскроу). Прозрачность. Справедливость (доброжелательная конкуренция). Универсальность (экспаты, путешественники, отдыхающие).",
                    'pt' => "Colaboração (marketplace único). Segurança (custódia). Transparência. Equidade (competição benevolente). Universalidade (expatriados, viajantes, turistas).",
                    'ar' => "التعاون (سوق فريد). الأمان (ضمان). الشفافية. العدالة (منافسة خيرة). العالمية (مغتربون، مسافرون، مصطافون).",
                    'zh' => "协作（独特市场）。安全（托管）。透明。公平（良性竞争）。普遍性（外籍人士、旅行者、度假者）。",
                    'hi' => "सहयोग (अद्वितीय बाज़ार)। सुरक्षा (एस्क्रो)। पारदर्शिता। निष्पक्षता (दयालु प्रतिस्पर्धा)। सार्वभौमिकता (प्रवासी, यात्री, छुट्टियों वाले)।"
                ]
            ),
            'grammar' => $this->createType(
                ['fr' => 'Grammaire', 'en' => 'Grammar', 'es' => 'Gramática', 'de' => 'Grammatik', 'ru' => 'Грамматика', 'pt' => 'Gramática', 'ar' => 'قواعد', 'zh' => '语法', 'hi' => 'व्याकरण'],
                75, true, true, true, true, true,
                [
                    'fr' => "Temps : Présent dynamique. Voix : Active énergique. Ponctuation : Points d'exclamation occasionnels ! Virgules : Rythme fluide.",
                    'en' => "Tense: Dynamic present. Voice: Energetic active. Punctuation: Occasional exclamation marks! Commas: Fluid rhythm.",
                    'es' => "Tiempo: Presente dinámico. Voz: Activa enérgica. Puntuación: ¡Signos exclamación ocasionales! Comas: Ritmo fluido.",
                    'de' => "Zeit: Dynamisches Präsens. Stimme: Energisch aktiv. Interpunktion: Gelegentliche Ausrufezeichen! Kommas: Fließender Rhythmus.",
                    'ru' => "Время: Динамичное настоящее. Залог: Энергичный активный. Пунктуация: Случайные восклицательные знаки! Запятые: Плавный ритм.",
                    'pt' => "Tempo: Presente dinâmico. Voz: Ativa energética. Pontuação: Pontos exclamação ocasionais! Vírgulas: Ritmo fluido.",
                    'ar' => "الزمن: حاضر ديناميكي. الصوت: نشط حيوي. الترقيم: علامات تعجب عرضية! الفواصل: إيقاع سلس.",
                    'zh' => "时态：动态现在时。语态：活力主动。标点：偶尔感叹号！逗号：流畅节奏。",
                    'hi' => "काल: गतिशील वर्तमान। स्वर: ऊर्जावान सक्रिय। विराम चिह्न: कभी-कभार विस्मयादिबोधक! अल्पविराम: तरल लय।"
                ]
            ),
            'formatting' => $this->createType(
                ['fr' => 'Formatage', 'en' => 'Formatting', 'es' => 'Formato', 'de' => 'Formatierung', 'ru' => 'Форматирование', 'pt' => 'Formatação', 'ar' => 'تنسيق', 'zh' => '格式', 'hi' => 'स्वरूपण'],
                70, true, true, true, true, true,
                [
                    'fr' => "Titres : H2 bénéfices, H3 étapes. Gras : Avantages clés. Italique : Témoignages. Listes : Étapes numérotées (1,2,3). Émojis ✨ pour dynamiser.",
                    'en' => "Titles: H2 benefits, H3 steps. Bold: Key advantages. Italic: Testimonials. Lists: Numbered steps (1,2,3). Emojis ✨ for dynamism.",
                    'es' => "Títulos: H2 beneficios, H3 pasos. Negrita: Ventajas clave. Cursiva: Testimonios. Listas: Pasos numerados (1,2,3). Emojis ✨ para dinamismo.",
                    'de' => "Titel: H2 Vorteile, H3 Schritte. Fett: Hauptvorteile. Kursiv: Testimonials. Listen: Nummerierte Schritte (1,2,3). Emojis ✨ für Dynamik.",
                    'ru' => "Заголовки: H2 преимущества, H3 шаги. Жирный: Ключевые преимущества. Курсив: Отзывы. Списки: Нумерованные шаги (1,2,3). Эмодзи ✨ для динамики.",
                    'pt' => "Títulos: H2 benefícios, H3 passos. Negrito: Vantagens-chave. Itálico: Testemunhos. Listas: Passos numerados (1,2,3). Emojis ✨ para dinamismo.",
                    'ar' => "العناوين: H2 فوائد، H3 خطوات. غامق: مزايا رئيسية. مائل: شهادات. قوائم: خطوات مرقمة (1،2،3). رموز ✨ للحيوية.",
                    'zh' => "标题：H2好处，H3步骤。粗体：关键优势。斜体：推荐。列表：编号步骤(1,2,3)。表情符号✨增添活力。",
                    'hi' => "शीर्षक: H2 लाभ, H3 कदम। बोल्ड: प्रमुख लाभ। इटैलिक: प्रशंसापत्र। सूचियां: क्रमांकित कदम (1,2,3)। इमोजी✨ गतिशीलता के लिए।"
                ]
            ),
            'headlines' => $this->createType(
                ['fr' => 'Titres', 'en' => 'Headlines', 'es' => 'Títulos', 'de' => 'Überschriften', 'ru' => 'Заголовки', 'pt' => 'Títulos', 'ar' => 'عناوين', 'zh' => '标题', 'hi' => 'शीर्षक'],
                65, true, true, true, true, true,
                [
                    'fr' => "Format : Promesse résultat (60%) ou Question pratique (40%). Longueur : 45-65 caractères. Ex: 'Trouvez votre prestataire idéal en 24h' ou 'Comment comparer 5 devis gratuitement ?'",
                    'en' => "Format: Result promise (60%) or Practical question (40%). Length: 45-65 chars. Ex: 'Find your ideal provider in 24h' or 'How to compare 5 quotes for free?'",
                    'es' => "Formato: Promesa resultado (60%) o Pregunta práctica (40%). Longitud: 45-65 caracteres. Ej: 'Encuentre su proveedor ideal en 24h' o '¿Cómo comparar 5 presupuestos gratis?'",
                    'de' => "Format: Ergebnisversprechen (60%) oder Praktische Frage (40%). Länge: 45-65 Zeichen. Bsp: 'Finden Sie Ihren idealen Anbieter in 24h' oder 'Wie vergleicht man 5 Angebote kostenlos?'",
                    'ru' => "Формат: Обещание результата (60%) или Практический вопрос (40%). Длина: 45-65 символов. Пример: 'Найдите идеального поставщика за 24ч' или 'Как сравнить 5 предложений бесплатно?'",
                    'pt' => "Formato: Promessa resultado (60%) ou Pergunta prática (40%). Comprimento: 45-65 caracteres. Ex: 'Encontre seu prestador ideal em 24h' ou 'Como comparar 5 orçamentos grátis?'",
                    'ar' => "التنسيق: وعد نتيجة (60%) أو سؤال عملي (40%). الطول: 45-65 حرف. مثال: 'ابحث عن مقدمك المثالي في 24س' أو 'كيف تقارن 5 عروض مجاناً؟'",
                    'zh' => "格式：结果承诺(60%)或实用问题(40%)。长度：45-65字符。例：'24小时找到理想提供者'或'如何免费比较5个报价？'",
                    'hi' => "प्रारूप: परिणाम वादा (60%) या व्यावहारिक प्रश्न (40%)। लंबाई: 45-65 वर्ण। उदा: '24घंटे में अपना आदर्श प्रदाता खोजें' या 'मुफ्त में 5 उद्धरण की तुलना कैसे करें?'"
                ]
            ),
            'cta' => $this->createType(
                ['fr' => 'CTA', 'en' => 'CTA', 'es' => 'CTA', 'de' => 'CTA', 'ru' => 'Призыв', 'pt' => 'CTA', 'ar' => 'دعوة', 'zh' => '行动号召', 'hi' => 'CTA'],
                60, true, true, true, true, true,
                [
                    'fr' => "Formats efficaces : 'Postez votre demande - Gratuit', 'Comparez 5 devis maintenant', 'Trouvez votre prestataire aujourd'hui'. ÉVITER : 'S'inscrire', 'Commencer' (trop vague).",
                    'en' => "Effective formats: 'Post your request - Free', 'Compare 5 quotes now', 'Find your provider today'. AVOID: 'Sign up', 'Start' (too vague).",
                    'es' => "Formatos efectivos: 'Publique su solicitud - Gratis', 'Compare 5 presupuestos ahora', 'Encuentre su proveedor hoy'. EVITAR: 'Registrarse', 'Comenzar' (demasiado vago).",
                    'de' => "Effektive Formate: 'Anfrage posten - Kostenlos', 'Vergleichen Sie jetzt 5 Angebote', 'Finden Sie heute Ihren Anbieter'. VERMEIDEN: 'Anmelden', 'Starten' (zu vage).",
                    'ru' => "Эффективные форматы: 'Разместите запрос - Бесплатно', 'Сравните 5 предложений сейчас', 'Найдите поставщика сегодня'. ИЗБЕГАТЬ: 'Зарегистрироваться', 'Начать' (слишком расплывчато).",
                    'pt' => "Formatos eficazes: 'Publique sua solicitação - Grátis', 'Compare 5 orçamentos agora', 'Encontre seu prestador hoje'. EVITAR: 'Inscrever-se', 'Começar' (muito vago).",
                    'ar' => "تنسيقات فعالة: 'انشر طلبك - مجاني'، 'قارن 5 عروض الآن'، 'ابحث عن مقدمك اليوم'. تجنب: 'سجل'، 'ابدأ' (غامض للغاية).",
                    'zh' => "有效格式：'发布您的需求 - 免费'，'立即比较5个报价'，'今天找到您的提供者'。避免：'注册'，'开始'（太模糊）。",
                    'hi' => "प्रभावी प्रारूप: 'अपना अनुरोध पोस्ट करें - मुफ्त', 'अभी 5 उद्धरण की तुलना करें', 'आज अपना प्रदाता खोजें'। बचें: 'साइन अप', 'शुरू' (बहुत अस्पष्ट)।"
                ]
            ),
            'storytelling' => $this->createType(
                ['fr' => 'Storytelling', 'en' => 'Storytelling', 'es' => 'Narrativa', 'de' => 'Storytelling', 'ru' => 'Рассказ', 'pt' => 'Storytelling', 'ar' => 'سرد', 'zh' => '故事讲述', 'hi' => 'कहानी'],
                55, true, true, true, false, false,
                [
                    'fr' => "Structure : Besoin → Solution marketplace → Résultat. Ex: 'Paul cherche déménageur Tokyo. Poste Ulixai. 8 offres 2h. Compare, choisit meilleur prix. Déménagement réussi, paiement sécurisé ✨'",
                    'en' => "Structure: Need → Marketplace solution → Result. Ex: 'Paul seeks mover Tokyo. Posts Ulixai. 8 offers 2h. Compares, chooses best price. Successful move, secure payment ✨'",
                    'es' => "Estructura: Necesidad → Solución marketplace → Resultado. Ej: 'Pablo busca mudanza Tokio. Publica Ulixai. 8 ofertas 2h. Compara, elige mejor precio. Mudanza exitosa, pago seguro ✨'",
                    'de' => "Struktur: Bedarf → Marketplace-Lösung → Ergebnis. Bsp: 'Paul sucht Umzug Tokio. Postet Ulixai. 8 Angebote 2h. Vergleicht, wählt besten Preis. Erfolgreicher Umzug, sichere Zahlung ✨'",
                    'ru' => "Структура: Потребность → Решение площадки → Результат. Пример: 'Пол ищет переезд Токио. Публикует Ulixai. 8 предложений 2ч. Сравнивает, выбирает лучшую цену. Успешный переезд, безопасный платеж ✨'",
                    'pt' => "Estrutura: Necessidade → Solução marketplace → Resultado. Ex: 'Paulo busca mudança Tóquio. Publica Ulixai. 8 ofertas 2h. Compara, escolhe melhor preço. Mudança bem-sucedida, pagamento seguro ✨'",
                    'ar' => "الهيكل: حاجة ← حل السوق ← نتيجة. مثال: 'بول يبحث ناقل طوكيو. ينشر Ulixai. 8 عروض 2س. يقارن، يختار أفضل سعر. نقل ناجح، دفع آمن ✨'",
                    'zh' => "结构：需求→市场解决方案→结果。例：'保罗找东京搬家。发布Ulixai。2小时8个报价。比较，选最佳价格。搬家成功，安全支付✨'",
                    'hi' => "संरचना: आवश्यकता → बाज़ार समाधान → परिणाम। उदा: 'पॉल टोक्यो में चलाने वाला खोज रहा। Ulixai पोस्ट करता। 2घं में 8 प्रस्ताव। तुलना करता, सर्वोत्तम मूल्य चुनता। सफल स्थानांतरण, सुरक्षित भुगतान✨'"
                ]
            ),
        ];
    }

    private function getUlysseData(): array
    {
        return [
            'facts' => $this->createType(
                ['fr' => 'Faits clés', 'en' => 'Key facts', 'es' => 'Datos clave', 'de' => 'Fakten', 'ru' => 'Факты', 'pt' => 'Fatos', 'ar' => 'حقائق', 'zh' => '事实', 'hi' => 'तथ्य'],
                100, true, true, true, true, true,
                [
                    'fr' => "Ulysse.AI: IA nouvelle génération pour expatriés, voyageurs, vacanciers. GPT-4. Assistance 24/7. 9 langues. 197 pays.",
                    'en' => "Ulysse.AI: Next-gen AI for expats, travelers, vacationers. GPT-4. Assistance 24/7. 9 languages. 197 countries.",
                    'es' => "Ulysse.AI: IA nueva generación para expatriados, viajeros, vacacionistas. GPT-4. Asistencia 24/7. 9 idiomas. 197 países.",
                    'de' => "Ulysse.AI: KI nächste Generation für Expatriates, Reisende, Urlauber. GPT-4. Unterstützung 24/7. 9 Sprachen. 197 Länder.",
                    'ru' => "Ulysse.AI: ИИ нового поколения для экспатов, путешественников, отдыхающих. GPT-4. Помощь 24/7. 9 языков. 197 стран.",
                    'pt' => "Ulysse.AI: IA nova geração para expatriados, viajantes, turistas. GPT-4. Assistência 24/7. 9 idiomas. 197 países.",
                    'ar' => "Ulysse.AI: ذكاء اصطناعي جيل جديد للمغتربين والمسافرين والمصطافين. GPT-4. مساعدة 24/7. 9 لغات. 197 دولة.",
                    'zh' => "Ulysse.AI：新一代AI为外籍人士、旅行者、度假者服务。GPT-4。24/7援助。9语言。197国家。",
                    'hi' => "Ulysse.AI: प्रवासियों, यात्रियों, छुट्टियों वालों के लिए अगली पीढ़ी का AI। GPT-4। 24/7 सहायता। 9 भाषाएं। 197 देश।"
                ]
            ),
            'about' => $this->createType(
                ['fr' => 'À propos', 'en' => 'About', 'es' => 'Acerca', 'de' => 'Über', 'ru' => 'О нас', 'pt' => 'Sobre', 'ar' => 'معلومات', 'zh' => '关于', 'hi' => 'बारे'],
                100, true, true, true, true, true,
                [
                    'fr' => "Plateforme IA nouvelle génération. GPT-4. Conseils personnalisés 24/7. Expatriation et voyage. 197 pays. 9 langues.",
                    'en' => "Next-gen AI platform. GPT-4. Personalized advice 24/7. Expatriation and travel. 197 countries. 9 languages.",
                    'es' => "Plataforma IA nueva generación. GPT-4. Consejos personalizados 24/7. Expatriación y viajes. 197 países. 9 idiomas.",
                    'de' => "KI-Plattform nächste Generation. GPT-4. Personalisierte Beratung 24/7. Expatriation und Reisen. 197 Länder. 9 Sprachen.",
                    'ru' => "Платформа ИИ нового поколения. GPT-4. Персонализированные советы 24/7. Эмиграция и путешествия. 197 стран. 9 языков.",
                    'pt' => "Plataforma IA nova geração. GPT-4. Conselhos personalizados 24/7. Expatriação e viagens. 197 países. 9 idiomas.",
                    'ar' => "منصة ذكاء اصطناعي جيل جديد. GPT-4. نصائح شخصية 24/7. اغتراب وسفر. 197 دولة. 9 لغات.",
                    'zh' => "新一代AI平台。GPT-4。24/7个性化建议。外派和旅行。197国家。9语言。",
                    'hi' => "अगली पीढ़ी का AI प्लेटफ़ॉर्म। GPT-4। 24/7 व्यक्तिगत सलाह। प्रवासन और यात्रा। 197 देश। 9 भाषाएं।"
                ]
            ),
            'services' => $this->createType(
                ['fr' => 'Services', 'en' => 'Services', 'es' => 'Servicios', 'de' => 'Dienste', 'ru' => 'Услуги', 'pt' => 'Serviços', 'ar' => 'خدمات', 'zh' => '服务', 'hi' => 'सेवाएं'],
                90, true, true, true, true, true,
                [
                    'fr' => "Conseils IA 24/7. Recommandations culturelles. Guides expatriation. Traduction instantanée. Itinéraires optimisés. 9 langues. 197 pays.",
                    'en' => "AI advice 24/7. Cultural recommendations. Expat guides. Instant translation. Optimized itineraries. 9 languages. 197 countries.",
                    'es' => "Consejos IA 24/7. Recomendaciones culturales. Guías expatriación. Traducción instantánea. Itinerarios optimizados. 9 idiomas. 197 países.",
                    'de' => "KI-Beratung 24/7. Kulturelle Empfehlungen. Expat-Anleitungen. Sofortübersetzung. Optimierte Routen. 9 Sprachen. 197 Länder.",
                    'ru' => "Советы ИИ 24/7. Культурные рекомендации. Гиды для экспатов. Мгновенный перевод. Оптимизированные маршруты. 9 языков. 197 стран.",
                    'pt' => "Conselhos IA 24/7. Recomendações culturais. Guias expatriação. Tradução instantânea. Itinerários otimizados. 9 idiomas. 197 países.",
                    'ar' => "نصائح ذكاء اصطناعي 24/7. توصيات ثقافية. أدلة اغتراب. ترجمة فورية. مسارات محسنة. 9 لغات. 197 دولة.",
                    'zh' => "24/7AI建议。文化推荐。外派指南。即时翻译。优化行程。9语言。197国家。",
                    'hi' => "24/7 AI सलाह। सांस्कृतिक सिफारिशें। प्रवासी गाइड। तत्काल अनुवाद। अनुकूलित यात्रा कार्यक्रम। 9 भाषाएं। 197 देश।"
                ]
            ),
            'differentiators' => $this->createType(
                ['fr' => 'Différenciateurs', 'en' => 'Differentiators', 'es' => 'Diferenciadores', 'de' => 'Unterschiede', 'ru' => 'Отличия', 'pt' => 'Diferenciadores', 'ar' => 'مميزات', 'zh' => '优势', 'hi' => 'विभेदक'],
                95, true, true, true, true, true,
                [
                    'fr' => "Seule IA dédiée expatriation/voyage. GPT-4 avancé. Personnalisation extrême. Multilingue natif (9 langues). 24/7 instantané. 197 pays.",
                    'en' => "Only AI dedicated to expat/travel. Advanced GPT-4. Extreme personalization. Native multilingual (9 languages). Instant 24/7. 197 countries.",
                    'es' => "Única IA dedicada expatriación/viajes. GPT-4 avanzado. Personalización extrema. Multilingüe nativo (9 idiomas). Instantáneo 24/7. 197 países.",
                    'de' => "Einzige KI für Expat/Reisen. Fortgeschrittenes GPT-4. Extreme Personalisierung. Native Mehrsprachigkeit (9 Sprachen). Sofort 24/7. 197 Länder.",
                    'ru' => "Единственный ИИ для эмиграции/путешествий. Продвинутый GPT-4. Экстремальная персонализация. Родной многоязычный (9 языков). Мгновенно 24/7. 197 стран.",
                    'pt' => "Única IA dedicada expat/viagens. GPT-4 avançado. Personalização extrema. Multilíngue nativo (9 idiomas). Instantâneo 24/7. 197 países.",
                    'ar' => "ذكاء اصطناعي وحيد مخصص للاغتراب/السفر. GPT-4 متقدم. تخصيص شديد. متعدد اللغات الأصلي (9 لغات). فوري 24/7. 197 دولة.",
                    'zh' => "唯一专注外派/旅行的AI。先进GPT-4。极致个性化。母语多语言（9种）。24/7即时。197国家。",
                    'hi' => "प्रवासन/यात्रा के लिए समर्पित एकमात्र AI। उन्नत GPT-4। चरम वैयक्तिकरण। मूल बहुभाषी (9 भाषाएं)। तत्काल 24/7। 197 देश।"
                ]
            ),
            'tone' => $this->createType(
                ['fr' => 'Ton', 'en' => 'Tone', 'es' => 'Tono', 'de' => 'Ton', 'ru' => 'Тон', 'pt' => 'Tom', 'ar' => 'نبرة', 'zh' => '语气', 'hi' => 'स्वर'],
                85, true, true, true, true, true,
                [
                    'fr' => "Tech moderne innovant (4/10). Dynamique, enthousiaste, futuriste. Émojis tech 🚀🌍✨. Tous: expatriés, voyageurs, vacanciers. TOUJOURS: intelligent, personnalisé.",
                    'en' => "Modern tech innovative (4/10). Dynamic, enthusiastic, futuristic. Tech emojis 🚀🌍✨. Everyone: expats, travelers, vacationers. ALWAYS: intelligent, personalized.",
                    'es' => "Tech moderno innovador (4/10). Dinámico, entusiasta, futurista. Emojis tech 🚀🌍✨. Todos: expatriados, viajeros, vacacionistas. SIEMPRE: inteligente, personalizado.",
                    'de' => "Modern tech innovativ (4/10). Dynamisch, enthusiastisch, futuristisch. Tech-Emojis 🚀🌍✨. Alle: Expatriates, Reisende, Urlauber. IMMER: intelligent, personalisiert.",
                    'ru' => "Современный инновационный техно (4/10). Динамичный, восторженный, футуристический. Техно эмодзи 🚀🌍✨. Все: экспаты, путешественники, отдыхающие. ВСЕГДА: интеллектуальный, персонализированный.",
                    'pt' => "Tech moderno inovador (4/10). Dinâmico, entusiasta, futurista. Emojis tech 🚀🌍✨. Todos: expatriados, viajantes, turistas. SEMPRE: inteligente, personalizado.",
                    'ar' => "تقني حديث مبتكر (4/10). ديناميكي، متحمس، مستقبلي. رموز تقنية 🚀🌍✨. الجميع: مغتربون، مسافرون، مصطافون. دائما: ذكي، شخصي.",
                    'zh' => "现代科技创新（4/10）。动态、热情、未来主义。科技表情符号🚀🌍✨。所有人：外籍人士、旅行者、度假者。始终：智能、个性化。",
                    'hi' => "आधुनिक तकनीकी नवीन (4/10)। गतिशील, उत्साही, भविष्यवादी। तकनीकी इमोजी🚀🌍✨। सभी: प्रवासी, यात्री, छुट्टियों वाले। हमेशा: बुद्धिमान, व्यक्तिगत।"
                ]
            ),
            'style' => $this->createType(
                ['fr' => 'Style', 'en' => 'Style', 'es' => 'Estilo', 'de' => 'Stil', 'ru' => 'Стиль', 'pt' => 'Estilo', 'ar' => 'أسلوب', 'zh' => '风格', 'hi' => 'शैली'],
                80, true, true, true, true, true,
                [
                    'fr' => "Moderne tech. Phrases courtes 10-20 mots. Paragraphes 3-4 lignes. Émojis tech. Structure: hook tech > features > benefits > CTA.",
                    'en' => "Modern tech. Short sentences 10-20 words. Paragraphs 3-4 lines. Tech emojis. Structure: tech hook > features > benefits > CTA.",
                    'es' => "Tech moderno. Frases cortas 10-20 palabras. Párrafos 3-4 líneas. Emojis tech. Estructura: gancho tech > características > beneficios > CTA.",
                    'de' => "Modern tech. Kurze Sätze 10-20 Wörter. Absätze 3-4 Zeilen. Tech-Emojis. Struktur: Tech-Hook > Features > Vorteile > CTA.",
                    'ru' => "Современный техно. Короткие предложения 10-20 слов. Абзацы 3-4 строки. Техно эмодзи. Структура: техно крючок > функции > преимущества > CTA.",
                    'pt' => "Tech moderno. Frases curtas 10-20 palavras. Parágrafos 3-4 linhas. Emojis tech. Estrutura: gancho tech > recursos > benefícios > CTA.",
                    'ar' => "تقني حديث. جمل قصيرة 10-20 كلمة. فقرات 3-4 أسطر. رموز تقنية. الهيكل: خطاف تقني > ميزات > فوائد > CTA.",
                    'zh' => "现代科技。短句10-20字。段落3-4行。科技表情符号。结构：科技钩子>特点>好处>CTA。",
                    'hi' => "आधुनिक तकनीकी। छोटे वाक्य 10-20 शब्द। पैराग्राफ 3-4 पंक्तियां। तकनीकी इमोजी। संरचना: तकनीकी हुक > विशेषताएं > लाभ > CTA।"
                ]
            ),
            'vocabulary' => $this->createType(
                ['fr' => 'Vocabulaire', 'en' => 'Vocabulary', 'es' => 'Vocabulario', 'de' => 'Vokabular', 'ru' => 'Словарь', 'pt' => 'Vocabulário', 'ar' => 'مفردات', 'zh' => '词汇', 'hi' => 'शब्दावली'],
                70, true, true, true, true, true,
                [
                    'fr' => "TOUJOURS: 'IA', 'personnalisé', 'moderne', 'innovation', 'expatrié', 'voyageur', 'vacancier'. JAMAIS: 'robot', 'automatique', 'immigrant', 'basique'.",
                    'en' => "ALWAYS: 'AI', 'personalized', 'modern', 'innovation', 'expat', 'traveler', 'vacationer'. NEVER: 'robot', 'automatic', 'immigrant', 'basic'.",
                    'es' => "SIEMPRE: 'IA', 'personalizado', 'moderno', 'innovación', 'expatriado', 'viajero', 'vacacionista'. NUNCA: 'robot', 'automático', 'inmigrante', 'básico'.",
                    'de' => "IMMER: 'KI', 'personalisiert', 'modern', 'Innovation', 'Expatriate', 'Reisender', 'Urlauber'. NIEMALS: 'Roboter', 'automatisch', 'Einwanderer', 'einfach'.",
                    'ru' => "ВСЕГДА: 'ИИ', 'персонализированный', 'современный', 'инновация', 'экспат', 'путешественник', 'отдыхающий'. НИКОГДА: 'робот', 'автоматический', 'иммигрант', 'базовый'.",
                    'pt' => "SEMPRE: 'IA', 'personalizado', 'moderno', 'inovação', 'expatriado', 'viajante', 'turista'. NUNCA: 'robô', 'automático', 'imigrante', 'básico'.",
                    'ar' => "دائما: 'ذكاء اصطناعي'، 'شخصي'، 'حديث'، 'ابتكار'، 'مغترب'، 'مسافر'، 'مصطاف'. أبدا: 'روبوت'، 'تلقائي'، 'مهاجر'، 'أساسي'.",
                    'zh' => "始终：'AI'、'个性化'、'现代'、'创新'、'外籍人士'、'旅行者'、'度假者'。绝不：'机器人'、'自动'、'移民'、'基础'。",
                    'hi' => "हमेशा: 'AI', 'व्यक्तिगत', 'आधुनिक', 'नवाचार', 'प्रवासी', 'यात्री', 'छुट्टियों वाले'। कभी नहीं: 'रोबोट', 'स्वचालित', 'अप्रवासी', 'बुनियादी'।"
                ]
            ),
            'examples' => $this->createType(
                ['fr' => 'Exemples', 'en' => 'Examples', 'es' => 'Ejemplos', 'de' => 'Beispiele', 'ru' => 'Примеры', 'pt' => 'Exemplos', 'ar' => 'أمثلة', 'zh' => '示例', 'hi' => 'उदाहरण'],
                60, true, true, false, true, false,
                [
                    'fr' => "Intro: 'Ulysse.AI révolutionne l'expatriation avec l'IA 🚀 Conseils 24/7, assistance intelligente. Futur du voyage.' CTA: 'Essayez l'IA - Gratuit ✨'",
                    'en' => "Intro: 'Ulysse.AI revolutionizes expat life with AI 🚀 Advice 24/7, intelligent assistance. Future of travel.' CTA: 'Try AI - Free ✨'",
                    'es' => "Intro: 'Ulysse.AI revoluciona la vida expat con IA 🚀 Consejos 24/7, asistencia inteligente. Futuro del viaje.' CTA: 'Prueba IA - Gratis ✨'",
                    'de' => "Intro: 'Ulysse.AI revolutioniert Expat-Leben mit KI 🚀 Beratung 24/7, intelligente Unterstützung. Zukunft des Reisens.' CTA: 'KI testen - Kostenlos ✨'",
                    'ru' => "Вступление: 'Ulysse.AI революционизирует жизнь экспатов с ИИ 🚀 Советы 24/7, интеллектуальная помощь. Будущее путешествий.' CTA: 'Попробовать ИИ - Бесплатно ✨'",
                    'pt' => "Intro: 'Ulysse.AI revoluciona vida expat com IA 🚀 Conselhos 24/7, assistência inteligente. Futuro viagens.' CTA: 'Experimente IA - Grátis ✨'",
                    'ar' => "مقدمة: 'Ulysse.AI يُحدث ثورة في حياة المغتربين بالذكاء الاصطناعي 🚀 نصائح 24/7، مساعدة ذكية. مستقبل السفر.' CTA: 'جرب الذكاء الاصطناعي - مجاني ✨'",
                    'zh' => "引言：'Ulysse.AI通过AI革新外派生活🚀 24/7建议、智能援助。旅行的未来。' CTA：'试用AI - 免费✨'",
                    'hi' => "परिचय: 'Ulysse.AI AI के साथ प्रवासी जीवन में क्रांति🚀 24/7 सलाह, बुद्धिमान सहायता। यात्रा का भविष्य।' CTA: 'AI आज़माएं - मुफ़्त✨'"
                ]
            ),
            'donts' => $this->createType(
                ['fr' => 'Interdictions', 'en' => 'Prohibitions', 'es' => 'Prohibiciones', 'de' => 'Verbote', 'ru' => 'Запреты', 'pt' => 'Proibições', 'ar' => 'محظورات', 'zh' => '禁止', 'hi' => 'निषेध'],
                100, true, true, true, true, true,
                [
                    'fr' => "JAMAIS remplacer humains. JAMAIS garanties absolues. JAMAIS >30 mots. JAMAIS jargon incompréhensible. JAMAIS 'robot', 'automatique'. JAMAIS oublier tous: expatriés, voyageurs, vacanciers.",
                    'en' => "NEVER replace humans. NEVER absolute guarantees. NEVER >30 words. NEVER incomprehensible jargon. NEVER 'robot', 'automatic'. NEVER forget everyone: expats, travelers, vacationers.",
                    'es' => "NUNCA reemplazar humanos. NUNCA garantías absolutas. NUNCA >30 palabras. NUNCA jerga incomprensible. NUNCA 'robot', 'automático'. NUNCA olvidar todos: expatriados, viajeros, vacacionistas.",
                    'de' => "NIEMALS Menschen ersetzen. NIEMALS absolute Garantien. NIEMALS >30 Wörter. NIEMALS unverständlicher Jargon. NIEMALS 'Roboter', 'automatisch'. NIEMALS alle vergessen: Expatriates, Reisende, Urlauber.",
                    'ru' => "НИКОГДА не заменять людей. НИКОГДА не абсолютные гарантии. НИКОГДА >30 слов. НИКОГДА не непонятный жаргон. НИКОГДА 'робот', 'автоматический'. НИКОГДА не забывать всех: экспаты, путешественники, отдыхающие.",
                    'pt' => "NUNCA substituir humanos. NUNCA garantias absolutas. NUNCA >30 palavras. NUNCA jargão incompreensível. NUNCA 'robô', 'automático'. NUNCA esquecer todos: expatriados, viajantes, turistas.",
                    'ar' => "أبدا استبدال البشر. أبدا ضمانات مطلقة. أبدا >30 كلمة. أبدا مصطلحات غير مفهومة. أبدا 'روبوت'، 'تلقائي'. أبدا نسيان الجميع: مغتربون، مسافرون، مصطافون.",
                    'zh' => "绝不取代人类。绝不绝对保证。绝不>30字。绝不难懂术语。绝不'机器人'、'自动'。绝不忘记所有人：外籍人士、旅行者、度假者。",
                    'hi' => "कभी नहीं मनुष्यों को प्रतिस्थापित। कभी नहीं पूर्ण गारंटी। कभी नहीं >30 शब्द। कभी नहीं समझ में न आने वाला शब्दजाल। कभी नहीं 'रोबोट', 'स्वचालित'। कभी नहीं सभी को भूलें।"
                ]
            ),
            'values' => $this->createType(
                ['fr' => 'Valeurs', 'en' => 'Values', 'es' => 'Valores', 'de' => 'Werte', 'ru' => 'Ценности', 'pt' => 'Valores', 'ar' => 'قيم', 'zh' => '价值', 'hi' => 'मूल्य'],
                50, false, true, false, true, true,
                [
                    'fr' => "Innovation (IA pointe). Personnalisation (conseils uniques). Accessibilité (9 langues, 24/7, 197 pays). Modernité. Intelligence (GPT-4). Simplicité. Universalité (expatriés, voyageurs, vacanciers).",
                    'en' => "Innovation (cutting-edge AI). Personalization (unique advice). Accessibility (9 languages, 24/7, 197 countries). Modernity. Intelligence (GPT-4). Simplicity. Universality (expats, travelers, vacationers).",
                    'es' => "Innovación (IA vanguardia). Personalización (consejos únicos). Accesibilidad (9 idiomas, 24/7, 197 países). Modernidad. Inteligencia (GPT-4). Simplicidad. Universalidad (expatriados, viajeros, vacacionistas).",
                    'de' => "Innovation (Spitzen-KI). Personalisierung (einzigartige Beratung). Zugänglichkeit (9 Sprachen, 24/7, 197 Länder). Modernität. Intelligenz (GPT-4). Einfachheit. Universalität (Expatriates, Reisende, Urlauber).",
                    'ru' => "Инновация (передовой ИИ). Персонализация (уникальные советы). Доступность (9 языков, 24/7, 197 стран). Современность. Интеллект (GPT-4). Простота. Универсальность (экспаты, путешественники, отдыхающие).",
                    'pt' => "Inovação (IA ponta). Personalização (conselhos únicos). Acessibilidade (9 idiomas, 24/7, 197 países). Modernidade. Inteligência (GPT-4). Simplicidade. Universalidade (expatriados, viajantes, turistas).",
                    'ar' => "الابتكار (ذكاء اصطناعي متطور). التخصيص (نصائح فريدة). إمكانية الوصول (9 لغات، 24/7، 197 دولة). الحداثة. الذكاء (GPT-4). البساطة. العالمية (مغتربون، مسافرون، مصطافون).",
                    'zh' => "创新（尖端AI）。个性化（独特建议）。可访问性（9语言，24/7，197国家）。现代性。智能（GPT-4）。简单性。普遍性（外籍人士、旅行者、度假者）。",
                    'hi' => "नवाचार (अत्याधुनिक AI)। वैयक्तिकरण (अद्वितीय सलाह)। पहुंच (9 भाषाएं, 24/7, 197 देश)। आधुनिकता। बुद्धिमत्ता (GPT-4)। सरलता। सार्वभौमिकता (प्रवासी, यात्री, छुट्टियों वाले)।"
                ]
            ),
            'grammar' => $this->createType(
                ['fr' => 'Grammaire', 'en' => 'Grammar', 'es' => 'Gramática', 'de' => 'Grammatik', 'ru' => 'Грамматика', 'pt' => 'Gramática', 'ar' => 'قواعد', 'zh' => '语法', 'hi' => 'व्याकरण'],
                75, true, true, true, true, true,
                [
                    'fr' => "Temps : Futur et présent. Voix : Active tech. Ponctuation : Points brefs. Virgules : Clarté technique. Phrases : 10-15 mots max.",
                    'en' => "Tense: Future and present. Voice: Tech active. Punctuation: Brief periods. Commas: Technical clarity. Sentences: 10-15 words max.",
                    'es' => "Tiempo: Futuro y presente. Voz: Activa tech. Puntuación: Puntos breves. Comas: Claridad técnica. Frases: 10-15 palabras máx.",
                    'de' => "Zeit: Zukunft und Präsens. Stimme: Tech aktiv. Interpunktion: Kurze Punkte. Kommas: Technische Klarheit. Sätze: 10-15 Wörter max.",
                    'ru' => "Время: Будущее и настоящее. Залог: Техно активный. Пунктуация: Краткие точки. Запятые: Техническая ясность. Предложения: 10-15 слов макс.",
                    'pt' => "Tempo: Futuro e presente. Voz: Ativa tech. Pontuação: Pontos breves. Vírgulas: Clareza técnica. Frases: 10-15 palavras máx.",
                    'ar' => "الزمن: مستقبل وحاضر. الصوت: تقني نشط. الترقيم: نقاط موجزة. الفواصل: وضوح تقني. الجمل: 10-15 كلمة كحد أقصى.",
                    'zh' => "时态：未来和现在。语态：技术主动。标点：简短句号。逗号：技术清晰。句子：最多10-15字。",
                    'hi' => "काल: भविष्य और वर्तमान। स्वर: तकनीकी सक्रिय। विराम चिह्न: संक्षिप्त पूर्ण विराम। अल्पविराम: तकनीकी स्पष्टता। वाक्य: अधिकतम 10-15 शब्द।"
                ]
            ),
            'formatting' => $this->createType(
                ['fr' => 'Formatage', 'en' => 'Formatting', 'es' => 'Formato', 'de' => 'Formatierung', 'ru' => 'Форматирование', 'pt' => 'Formatação', 'ar' => 'تنسيق', 'zh' => '格式', 'hi' => 'स्वरूपण'],
                70, true, true, true, true, true,
                [
                    'fr' => "Titres : H2 innovation, H3 fonctionnalités. Gras : Tech keywords. Italique : Termes IA. Listes : Features tech (•). Émojis tech 🚀✨ stratégiques.",
                    'en' => "Titles: H2 innovation, H3 features. Bold: Tech keywords. Italic: AI terms. Lists: Tech features (•). Strategic tech emojis 🚀✨.",
                    'es' => "Títulos: H2 innovación, H3 funcionalidades. Negrita: Palabras clave tech. Cursiva: Términos IA. Listas: Features tech (•). Emojis tech 🚀✨ estratégicos.",
                    'de' => "Titel: H2 Innovation, H3 Funktionen. Fett: Tech-Schlüsselwörter. Kursiv: KI-Begriffe. Listen: Tech-Features (•). Strategische Tech-Emojis 🚀✨.",
                    'ru' => "Заголовки: H2 инновация, H3 функции. Жирный: Техно ключевые слова. Курсив: Термины ИИ. Списки: Техно функции (•). Стратегические техно эмодзи 🚀✨.",
                    'pt' => "Títulos: H2 inovação, H3 funcionalidades. Negrito: Palavras-chave tech. Itálico: Termos IA. Listas: Features tech (•). Emojis tech 🚀✨ estratégicos.",
                    'ar' => "العناوين: H2 ابتكار، H3 ميزات. غامق: كلمات تقنية. مائل: مصطلحات ذكاء اصطناعي. قوائم: ميزات تقنية (•). رموز تقنية 🚀✨ استراتيجية.",
                    'zh' => "标题：H2创新，H3功能。粗体：技术关键词。斜体：AI术语。列表：技术功能(•)。战略性技术表情符号🚀✨。",
                    'hi' => "शीर्षक: H2 नवाचार, H3 विशेषताएं। बोल्ड: तकनीकी मुख्य शब्द। इटैलिक: AI शब्द। सूचियां: तकनीकी विशेषताएं (•)। रणनीतिक तकनीकी इमोजी🚀✨।"
                ]
            ),
            'headlines' => $this->createType(
                ['fr' => 'Titres', 'en' => 'Headlines', 'es' => 'Títulos', 'de' => 'Überschriften', 'ru' => 'Заголовки', 'pt' => 'Títulos', 'ar' => 'عناوين', 'zh' => '标题', 'hi' => 'शीर्षक'],
                65, true, true, true, true, true,
                [
                    'fr' => "Format : Innovation tech (70%) ou Question futur (30%). Longueur : 40-60 caractères. Ex: 'IA qui révolutionne l'expatriation 🚀' ou 'Et si l'IA planifiait votre voyage ?'",
                    'en' => "Format: Tech innovation (70%) or Future question (30%). Length: 40-60 chars. Ex: 'AI revolutionizing expat life 🚀' or 'What if AI planned your trip?'",
                    'es' => "Formato: Innovación tech (70%) o Pregunta futuro (30%). Longitud: 40-60 caracteres. Ej: 'IA revolucionando vida expat 🚀' o '¿Y si IA planificara tu viaje?'",
                    'de' => "Format: Tech-Innovation (70%) oder Zukunftsfrage (30%). Länge: 40-60 Zeichen. Bsp: 'KI revolutioniert Expat-Leben 🚀' oder 'Was wenn KI Ihre Reise plant?'",
                    'ru' => "Формат: Техно инновация (70%) или Вопрос о будущем (30%). Длина: 40-60 символов. Пример: 'ИИ революционизирует жизнь экспатов 🚀' или 'Что если ИИ спланирует вашу поездку?'",
                    'pt' => "Formato: Inovação tech (70%) ou Pergunta futuro (30%). Comprimento: 40-60 caracteres. Ex: 'IA revolucionando vida expat 🚀' ou 'E se IA planejasse sua viagem?'",
                    'ar' => "التنسيق: ابتكار تقني (70%) أو سؤال مستقبلي (30%). الطول: 40-60 حرف. مثال: 'ذكاء اصطناعي يحدث ثورة في حياة المغتربين 🚀' أو 'ماذا لو خطط الذكاء الاصطناعي لرحلتك؟'",
                    'zh' => "格式：技术创新(70%)或未来问题(30%)。长度：40-60字符。例：'AI革新外派生活🚀'或'如果AI规划您的旅行？'",
                    'hi' => "प्रारूप: तकनीकी नवाचार (70%) या भविष्य का प्रश्न (30%)। लंबाई: 40-60 वर्ण। उदा: 'AI प्रवासी जीवन में क्रांति🚀' या 'यदि AI आपकी यात्रा की योजना बनाए?'"
                ]
            ),
            'cta' => $this->createType(
                ['fr' => 'CTA', 'en' => 'CTA', 'es' => 'CTA', 'de' => 'CTA', 'ru' => 'Призыв', 'pt' => 'CTA', 'ar' => 'دعوة', 'zh' => '行动号召', 'hi' => 'CTA'],
                60, true, true, true, true, true,
                [
                    'fr' => "Formats efficaces : 'Essayez l'IA maintenant 🚀', 'Découvrez le futur du voyage', 'Activez votre assistant IA'. ÉVITER : 'Télécharger', 'S'abonner' (trop classique).",
                    'en' => "Effective formats: 'Try AI now 🚀', 'Discover travel's future', 'Activate your AI assistant'. AVOID: 'Download', 'Subscribe' (too classic).",
                    'es' => "Formatos efectivos: 'Pruebe IA ahora 🚀', 'Descubra futuro del viaje', 'Active su asistente IA'. EVITAR: 'Descargar', 'Suscribirse' (demasiado clásico).",
                    'de' => "Effektive Formate: 'Jetzt KI testen 🚀', 'Entdecken Sie Reisezukunft', 'Aktivieren Sie Ihren KI-Assistenten'. VERMEIDEN: 'Herunterladen', 'Abonnieren' (zu klassisch).",
                    'ru' => "Эффективные форматы: 'Попробуйте ИИ сейчас 🚀', 'Откройте будущее путешествий', 'Активируйте вашего ИИ-помощника'. ИЗБЕГАТЬ: 'Скачать', 'Подписаться' (слишком классично).",
                    'pt' => "Formatos eficazes: 'Experimente IA agora 🚀', 'Descubra futuro da viagem', 'Ative seu assistente IA'. EVITAR: 'Baixar', 'Assinar' (muito clássico).",
                    'ar' => "تنسيقات فعالة: 'جرب الذكاء الاصطناعي الآن 🚀'، 'اكتشف مستقبل السفر'، 'فعّل مساعد الذكاء الاصطناعي'. تجنب: 'تنزيل'، 'اشترك' (كلاسيكي للغاية).",
                    'zh' => "有效格式：'立即试用AI🚀'，'发现旅行的未来'，'激活您的AI助手'。避免：'下载'，'订阅'（太传统）。",
                    'hi' => "प्रभावी प्रारूप: 'अभी AI आज़माएं🚀', 'यात्रा का भविष्य खोजें', 'अपने AI सहायक को सक्रिय करें'। बचें: 'डाउनलोड', 'सदस्यता' (बहुत क्लासिक)।"
                ]
            ),
            'storytelling' => $this->createType(
                ['fr' => 'Storytelling', 'en' => 'Storytelling', 'es' => 'Narrativa', 'de' => 'Storytelling', 'ru' => 'Рассказ', 'pt' => 'Storytelling', 'ar' => 'سرد', 'zh' => '故事讲述', 'hi' => 'कहानी'],
                55, true, true, true, false, false,
                [
                    'fr' => "Structure : Défis traditionnels → Innovation IA → Transformation. Ex: 'Lisa planifie Tokyo : guides contradictoires, info obsolète. Ulysse.AI : itinéraire personnalisé temps réel, traduction instantanée. Voyage parfait, zéro stress 🚀'",
                    'en' => "Structure: Traditional challenges → AI innovation → Transformation. Ex: 'Lisa plans Tokyo: conflicting guides, outdated info. Ulysse.AI: real-time personalized itinerary, instant translation. Perfect trip, zero stress 🚀'",
                    'es' => "Estructura: Desafíos tradicionales → Innovación IA → Transformación. Ej: 'Lisa planifica Tokio: guías contradictorias, info obsoleta. Ulysse.AI: itinerario personalizado tiempo real, traducción instantánea. Viaje perfecto, cero estrés 🚀'",
                    'de' => "Struktur: Traditionelle Herausforderungen → KI-Innovation → Transformation. Bsp: 'Lisa plant Tokio: widersprüchliche Führer, veraltete Info. Ulysse.AI: personalisierte Echtzeit-Route, Sofortübersetzung. Perfekte Reise, null Stress 🚀'",
                    'ru' => "Структура: Традиционные вызовы → Инновация ИИ → Трансформация. Пример: 'Лиза планирует Токио: противоречивые гиды, устаревшая инфо. Ulysse.AI: персонализированный маршрут в реальном времени, мгновенный перевод. Идеальная поездка, нулевой стресс 🚀'",
                    'pt' => "Estrutura: Desafios tradicionais → Inovação IA → Transformação. Ex: 'Lisa planeja Tóquio: guias conflitantes, info desatualizada. Ulysse.AI: itinerário personalizado tempo real, tradução instantânea. Viagem perfeita, zero estresse 🚀'",
                    'ar' => "الهيكل: تحديات تقليدية ← ابتكار ذكاء اصطناعي ← تحول. مثال: 'ليزا تخطط طوكيو: أدلة متضاربة، معلومات قديمة. Ulysse.AI: مسار شخصي وقت حقيقي، ترجمة فورية. رحلة مثالية، صفر توتر 🚀'",
                    'zh' => "结构：传统挑战→AI创新→转变。例：'丽莎计划东京：指南矛盾、信息过时。Ulysse.AI：实时个性化行程、即时翻译。完美旅行、零压力🚀'",
                    'hi' => "संरचना: पारंपरिक चुनौतियां → AI नवाचार → परिवर्तन। उदा: 'लिसा टोक्यो की योजना बनाती: विरोधाभासी गाइड, पुरानी जानकारी। Ulysse.AI: वास्तविक समय व्यक्तिगत यात्रा कार्यक्रम, तत्काल अनुवाद। सही यात्रा, शून्य तनाव🚀'"
                ]
            ),
        ];
    }

    private function createType($title, $priority, $articles, $landings, $comparatives, $pillars, $press, $content): array
    {
        return [
            'title' => $title,
            'priority' => $priority,
            'flags' => [
                'articles' => $articles,
                'landings' => $landings,
                'comparatives' => $comparatives,
                'pillars' => $pillars,
                'press' => $press,
            ],
            'content' => $content,
        ];
    }
}