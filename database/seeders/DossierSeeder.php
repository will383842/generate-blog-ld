<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Platform;
use App\Models\PressDossier;
use App\Models\DossierSection;
use Illuminate\Support\Str;

/**
 * DossierSeeder - Seed dossiers de presse pour 3 plateformes × 9 langues
 * 
 * Génère des exemples de dossiers pour :
 * - SOS-Expat (sos-expat)
 * - Ulixai (ulixai)
 * - Ulysse.AI (ulysse-ai)
 * 
 * Pour chaque langue : FR, EN, ES, DE, IT, PT, AR, ZH, HI
 * 
 * Usage : php artisan db:seed --class=DossierSeeder
 */
class DossierSeeder extends Seeder
{
    /**
     * Langues supportées
     */
    private array $languages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'hi'];

    /**
     * Templates de dossiers
     */
    private array $templates = [
        'press_kit_entreprise',
        'rapport_annuel',
        'case_study',
    ];

    /**
     * Titres traduits pour chaque template × langue
     */
    private array $titles = [
        'press_kit_entreprise' => [
            'fr' => 'Kit Presse {platform} 2025',
            'en' => '{platform} Press Kit 2025',
            'es' => 'Kit de Prensa {platform} 2025',
            'de' => '{platform} Pressemappe 2025',
            'it' => 'Kit Stampa {platform} 2025',
            'pt' => 'Kit de Imprensa {platform} 2025',
            'ar' => 'مجموعة صحفية {platform} 2025',
            'zh' => '{platform} 新闻资料包 2025',
            'hi' => '{platform} प्रेस किट 2025',
        ],
        'rapport_annuel' => [
            'fr' => 'Rapport Annuel {platform} 2024',
            'en' => '{platform} Annual Report 2024',
            'es' => 'Informe Anual {platform} 2024',
            'de' => '{platform} Jahresbericht 2024',
            'it' => 'Rapporto Annuale {platform} 2024',
            'pt' => 'Relatório Anual {platform} 2024',
            'ar' => 'التقرير السنوي {platform} 2024',
            'zh' => '{platform} 年度报告 2024',
            'hi' => '{platform} वार्षिक रिपोर्ट 2024',
        ],
        'case_study' => [
            'fr' => 'Étude de Cas : Succès {platform}',
            'en' => 'Case Study: {platform} Success Story',
            'es' => 'Caso de Estudio: Éxito de {platform}',
            'de' => 'Fallstudie: {platform} Erfolgsgeschichte',
            'it' => 'Caso Studio: Successo di {platform}',
            'pt' => 'Estudo de Caso: Sucesso da {platform}',
            'ar' => 'دراسة حالة: نجاح {platform}',
            'zh' => '案例研究：{platform} 成功案例',
            'hi' => 'केस स्टडी: {platform} सफलता की कहानी',
        ],
    ];

    /**
     * Sous-titres traduits
     */
    private array $subtitles = [
        'press_kit_entreprise' => [
            'fr' => 'Votre partenaire de confiance',
            'en' => 'Your trusted partner',
            'es' => 'Su socio de confianza',
            'de' => 'Ihr vertrauenswürdiger Partner',
            'it' => 'Il vostro partner di fiducia',
            'pt' => 'Seu parceiro confiável',
            'ar' => 'شريكك الموثوق',
            'zh' => '您值得信赖的合作伙伴',
            'hi' => 'आपका विश्वसनीय साथी',
        ],
        'rapport_annuel' => [
            'fr' => 'Résultats et perspectives',
            'en' => 'Results and outlook',
            'es' => 'Resultados y perspectivas',
            'de' => 'Ergebnisse und Ausblick',
            'it' => 'Risultati e prospettive',
            'pt' => 'Resultados e perspectivas',
            'ar' => 'النتائج والآفاق',
            'zh' => '成果与展望',
            'hi' => 'परिणाम और दृष्टिकोण',
        ],
        'case_study' => [
            'fr' => 'Comment nous avons transformé le secteur',
            'en' => 'How we transformed the industry',
            'es' => 'Cómo transformamos el sector',
            'de' => 'Wie wir die Branche transformierten',
            'it' => 'Come abbiamo trasformato il settore',
            'pt' => 'Como transformamos o setor',
            'ar' => 'كيف حولنا الصناعة',
            'zh' => '我们如何改变行业',
            'hi' => 'हमने उद्योग को कैसे बदला',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Début du seed des dossiers de presse...');
        
        // Récupérer les plateformes
        $platforms = Platform::whereIn('slug', ['sos-expat', 'ulixai', 'ulysse-ai'])->get();

        if ($platforms->isEmpty()) {
            $this->command->error('❌ Aucune plateforme trouvée. Créez d\'abord les plateformes.');
            return;
        }

        $totalDossiers = 0;

        foreach ($platforms as $platform) {
            $this->command->info("\n📁 Plateforme : {$platform->name}");
            
            // Pour chaque template
            foreach ($this->templates as $template) {
                $this->command->info("  📝 Template : {$template}");
                
                // Pour chaque langue
                foreach ($this->languages as $lang) {
                    $dossier = $this->createDossierWithSections($platform, $template, $lang);
                    
                    if ($dossier) {
                        $totalDossiers++;
                        $this->command->info("    ✅ {$lang} - Dossier #{$dossier->id} créé");
                    }
                }
            }
        }

        $this->command->info("\n✨ Seed terminé : {$totalDossiers} dossiers créés");
        $this->command->info("   (3 plateformes × 3 templates × 9 langues = 81 dossiers)");
    }

    /**
     * Créer un dossier avec ses sections
     *
     * @param Platform $platform
     * @param string $template
     * @param string $lang
     * @return PressDossier|null
     */
    private function createDossierWithSections(Platform $platform, string $template, string $lang): ?PressDossier
    {
        try {
            // Obtenir le titre et sous-titre traduits
            $title = str_replace('{platform}', $platform->name, $this->titles[$template][$lang]);
            $subtitle = $this->subtitles[$template][$lang] ?? null;

            // Créer le dossier
            $dossier = PressDossier::create([
                'platform_id' => $platform->id,
                'template_type' => $template,
                'title' => $title,
                'subtitle' => $subtitle,
                'language_code' => $lang,
                'status' => 'published',
                'published_at' => now(),
                'total_pages' => 0, // Sera calculé après
                'generation_cost' => 0.25, // Coût fictif
                'generation_time_seconds' => 45,
                'metadata' => [
                    'author' => 'Williams Jullin',
                    'date' => now()->format('Y-m-d'),
                    'version' => '1.0',
                ],
            ]);

            // Créer les sections selon le template
            $sections = $this->getSectionsForTemplate($template, $lang, $platform);
            
            foreach ($sections as $index => $sectionData) {
                DossierSection::create([
                    'dossier_id' => $dossier->id,
                    'section_type' => $sectionData['type'],
                    'title' => $sectionData['title'],
                    'content' => $sectionData['content'],
                    'word_count' => $sectionData['word_count'],
                    'page_number' => $index + 1,
                    'order_index' => $index,
                    'show_in_toc' => $sectionData['type'] !== 'cover',
                ]);
            }

            // Mettre à jour le nombre de pages
            $dossier->update(['total_pages' => count($sections)]);

            return $dossier;

        } catch (\Exception $e) {
            $this->command->error("    ❌ Erreur : {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Obtenir les sections pour un template donné
     *
     * @param string $template
     * @param string $lang
     * @param Platform $platform
     * @return array
     */
    private function getSectionsForTemplate(string $template, string $lang, Platform $platform): array
    {
        $platformName = $platform->name;
        
        // Contenus de base (simplifiés pour le seed)
        $baseContent = [
            'fr' => "<p>{$platformName} est une plateforme innovante qui révolutionne le secteur. Avec plus de 304 millions d'utilisateurs dans 197 pays, nous sommes le leader mondial dans notre domaine.</p><p>Notre mission est de connecter les personnes et de faciliter leur vie quotidienne à travers des services de qualité.</p>",
            'en' => "<p>{$platformName} is an innovative platform revolutionizing the industry. With over 304 million users in 197 countries, we are the global leader in our field.</p><p>Our mission is to connect people and make their daily lives easier through quality services.</p>",
            'es' => "<p>{$platformName} es una plataforma innovadora que revoluciona el sector. Con más de 304 millones de usuarios en 197 países, somos líderes mundiales en nuestro campo.</p><p>Nuestra misión es conectar personas y facilitar su vida diaria a través de servicios de calidad.</p>",
            'de' => "<p>{$platformName} ist eine innovative Plattform, die die Branche revolutioniert. Mit über 304 Millionen Nutzern in 197 Ländern sind wir Weltmarktführer in unserem Bereich.</p><p>Unsere Mission ist es, Menschen zu verbinden und ihr tägliches Leben durch qualitativ hochwertige Dienstleistungen zu erleichtern.</p>",
            'it' => "<p>{$platformName} è una piattaforma innovativa che sta rivoluzionando il settore. Con oltre 304 milioni di utenti in 197 paesi, siamo leader mondiali nel nostro campo.</p><p>La nostra missione è connettere le persone e facilitare la loro vita quotidiana attraverso servizi di qualità.</p>",
            'pt' => "<p>{$platformName} é uma plataforma inovadora que está revolucionando o setor. Com mais de 304 milhões de usuários em 197 países, somos líderes mundiais em nosso campo.</p><p>Nossa missão é conectar pessoas e facilitar seu dia a dia através de serviços de qualidade.</p>",
            'ar' => "<p>{$platformName} هي منصة مبتكرة تُحدث ثورة في القطاع. مع أكثر من 304 مليون مستخدم في 197 دولة، نحن الرواد العالميون في مجالنا.</p><p>مهمتنا هي ربط الناس وتسهيل حياتهم اليومية من خلال خدمات عالية الجودة.</p>",
            'zh' => "<p>{$platformName} 是一个革新行业的创新平台。我们在197个国家拥有超过3.04亿用户，是全球领先者。</p><p>我们的使命是连接人们，通过优质服务让他们的日常生活更轻松。</p>",
            'hi' => "<p>{$platformName} एक अभिनव मंच है जो उद्योग में क्रांति ला रहा है। 197 देशों में 304 मिलियन से अधिक उपयोगकर्ताओं के साथ, हम अपने क्षेत्र में वैश्विक नेता हैं।</p><p>हमारा मिशन लोगों को जोड़ना और गुणवत्तापूर्ण सेवाओं के माध्यम से उनके दैनिक जीवन को आसान बनाना है।</p>",
        ];

        $content = $baseContent[$lang] ?? $baseContent['en'];

        // Structures par template
        switch ($template) {
            case 'press_kit_entreprise':
                return [
                    ['type' => 'cover', 'title' => $this->translate('Page de Couverture', $lang), 'content' => null, 'word_count' => 0],
                    ['type' => 'intro', 'title' => $this->translate('À propos', $lang), 'content' => $content, 'word_count' => 150],
                    ['type' => 'chapter', 'title' => $this->translate('Notre Équipe', $lang), 'content' => $content, 'word_count' => 180],
                    ['type' => 'chapter', 'title' => $this->translate('Nos Services', $lang), 'content' => $content, 'word_count' => 200],
                    ['type' => 'chapter', 'title' => $this->translate('Nos Réalisations', $lang), 'content' => $content, 'word_count' => 170],
                    ['type' => 'chapter', 'title' => $this->translate('Chiffres Clés', $lang), 'content' => $content, 'word_count' => 120],
                    ['type' => 'chapter', 'title' => $this->translate('Contacts Presse', $lang), 'content' => $content, 'word_count' => 80],
                ];

            case 'rapport_annuel':
                return [
                    ['type' => 'cover', 'title' => $this->translate('Couverture', $lang), 'content' => null, 'word_count' => 0],
                    ['type' => 'intro', 'title' => $this->translate('Message du Président', $lang), 'content' => $content, 'word_count' => 180],
                    ['type' => 'chapter', 'title' => $this->translate('Faits Marquants', $lang), 'content' => $content, 'word_count' => 220],
                    ['type' => 'chapter', 'title' => $this->translate('Résultats Financiers', $lang), 'content' => $content, 'word_count' => 250],
                    ['type' => 'chapter', 'title' => $this->translate('Activités et Réalisations', $lang), 'content' => $content, 'word_count' => 230],
                    ['type' => 'chapter', 'title' => $this->translate('Perspectives', $lang), 'content' => $content, 'word_count' => 200],
                    ['type' => 'conclusion', 'title' => $this->translate('Conclusion', $lang), 'content' => $content, 'word_count' => 150],
                ];

            case 'case_study':
                return [
                    ['type' => 'cover', 'title' => $this->translate('Couverture', $lang), 'content' => null, 'word_count' => 0],
                    ['type' => 'intro', 'title' => $this->translate('Présentation du Cas', $lang), 'content' => $content, 'word_count' => 160],
                    ['type' => 'chapter', 'title' => $this->translate('Contexte et Problématique', $lang), 'content' => $content, 'word_count' => 220],
                    ['type' => 'chapter', 'title' => $this->translate('Solution Mise en Place', $lang), 'content' => $content, 'word_count' => 250],
                    ['type' => 'chapter', 'title' => $this->translate('Résultats et Impact', $lang), 'content' => $content, 'word_count' => 230],
                    ['type' => 'conclusion', 'title' => $this->translate('Leçons Apprises', $lang), 'content' => $content, 'word_count' => 180],
                ];

            default:
                return [];
        }
    }

    /**
     * Traductions de base pour les titres de sections
     *
     * @param string $text
     * @param string $lang
     * @return string
     */
    private function translate(string $text, string $lang): string
    {
        $translations = [
            'Page de Couverture' => ['fr' => 'Page de Couverture', 'en' => 'Cover Page', 'es' => 'Portada', 'de' => 'Deckblatt', 'it' => 'Copertina', 'pt' => 'Capa', 'ar' => 'صفحة الغلاف', 'zh' => '封面', 'hi' => 'कवर पेज'],
            'À propos' => ['fr' => 'À propos', 'en' => 'About', 'es' => 'Acerca de', 'de' => 'Über uns', 'it' => 'Chi siamo', 'pt' => 'Sobre', 'ar' => 'حول', 'zh' => '关于', 'hi' => 'के बारे में'],
            'Notre Équipe' => ['fr' => 'Notre Équipe', 'en' => 'Our Team', 'es' => 'Nuestro Equipo', 'de' => 'Unser Team', 'it' => 'Il Nostro Team', 'pt' => 'Nossa Equipe', 'ar' => 'فريقنا', 'zh' => '我们的团队', 'hi' => 'हमारी टीम'],
            'Nos Services' => ['fr' => 'Nos Services', 'en' => 'Our Services', 'es' => 'Nuestros Servicios', 'de' => 'Unsere Dienstleistungen', 'it' => 'I Nostri Servizi', 'pt' => 'Nossos Serviços', 'ar' => 'خدماتنا', 'zh' => '我们的服务', 'hi' => 'हमारी सेवाएं'],
            'Nos Réalisations' => ['fr' => 'Nos Réalisations', 'en' => 'Our Achievements', 'es' => 'Nuestros Logros', 'de' => 'Unsere Erfolge', 'it' => 'I Nostri Successi', 'pt' => 'Nossas Realizações', 'ar' => 'إنجازاتنا', 'zh' => '我们的成就', 'hi' => 'हमारी उपलब्धियां'],
            'Chiffres Clés' => ['fr' => 'Chiffres Clés', 'en' => 'Key Figures', 'es' => 'Cifras Clave', 'de' => 'Kennzahlen', 'it' => 'Cifre Chiave', 'pt' => 'Números-Chave', 'ar' => 'أرقام رئيسية', 'zh' => '关键数据', 'hi' => 'मुख्य आंकड़े'],
            'Contacts Presse' => ['fr' => 'Contacts Presse', 'en' => 'Press Contacts', 'es' => 'Contactos de Prensa', 'de' => 'Pressekontakte', 'it' => 'Contatti Stampa', 'pt' => 'Contatos de Imprensa', 'ar' => 'جهات الاتصال الصحفية', 'zh' => '新闻联系', 'hi' => 'प्रेस संपर्क'],
            'Couverture' => ['fr' => 'Couverture', 'en' => 'Cover', 'es' => 'Portada', 'de' => 'Umschlag', 'it' => 'Copertina', 'pt' => 'Capa', 'ar' => 'غلاف', 'zh' => '封面', 'hi' => 'कवर'],
            'Message du Président' => ['fr' => 'Message du Président', 'en' => 'President\'s Message', 'es' => 'Mensaje del Presidente', 'de' => 'Präsidentenbotschaft', 'it' => 'Messaggio del Presidente', 'pt' => 'Mensagem do Presidente', 'ar' => 'رسالة الرئيس', 'zh' => '总裁致辞', 'hi' => 'अध्यक्ष का संदेश'],
            'Faits Marquants' => ['fr' => 'Faits Marquants', 'en' => 'Highlights', 'es' => 'Aspectos Destacados', 'de' => 'Höhepunkte', 'it' => 'Punti Salienti', 'pt' => 'Destaques', 'ar' => 'أبرز الأحداث', 'zh' => '亮点', 'hi' => 'मुख्य बातें'],
            'Résultats Financiers' => ['fr' => 'Résultats Financiers', 'en' => 'Financial Results', 'es' => 'Resultados Financieros', 'de' => 'Finanzielle Ergebnisse', 'it' => 'Risultati Finanziari', 'pt' => 'Resultados Financeiros', 'ar' => 'النتائج المالية', 'zh' => '财务结果', 'hi' => 'वित्तीय परिणाम'],
            'Activités et Réalisations' => ['fr' => 'Activités et Réalisations', 'en' => 'Activities and Achievements', 'es' => 'Actividades y Logros', 'de' => 'Aktivitäten und Erfolge', 'it' => 'Attività e Realizzazioni', 'pt' => 'Atividades e Realizações', 'ar' => 'الأنشطة والإنجازات', 'zh' => '活动与成就', 'hi' => 'गतिविधियां और उपलब्धियां'],
            'Perspectives' => ['fr' => 'Perspectives', 'en' => 'Outlook', 'es' => 'Perspectivas', 'de' => 'Ausblick', 'it' => 'Prospettive', 'pt' => 'Perspectivas', 'ar' => 'التوقعات', 'zh' => '展望', 'hi' => 'दृष्टिकोण'],
            'Conclusion' => ['fr' => 'Conclusion', 'en' => 'Conclusion', 'es' => 'Conclusión', 'de' => 'Schlussfolgerung', 'it' => 'Conclusione', 'pt' => 'Conclusão', 'ar' => 'خاتمة', 'zh' => '结论', 'hi' => 'निष्कर्ष'],
            'Présentation du Cas' => ['fr' => 'Présentation du Cas', 'en' => 'Case Presentation', 'es' => 'Presentación del Caso', 'de' => 'Falldarstellung', 'it' => 'Presentazione del Caso', 'pt' => 'Apresentação do Caso', 'ar' => 'عرض الحالة', 'zh' => '案例介绍', 'hi' => 'केस प्रस्तुति'],
            'Contexte et Problématique' => ['fr' => 'Contexte et Problématique', 'en' => 'Context and Problem', 'es' => 'Contexto y Problema', 'de' => 'Kontext und Problem', 'it' => 'Contesto e Problema', 'pt' => 'Contexto e Problema', 'ar' => 'السياق والمشكلة', 'zh' => '背景与问题', 'hi' => 'संदर्भ और समस्या'],
            'Solution Mise en Place' => ['fr' => 'Solution Mise en Place', 'en' => 'Implemented Solution', 'es' => 'Solución Implementada', 'de' => 'Umgesetzte Lösung', 'it' => 'Soluzione Implementata', 'pt' => 'Solução Implementada', 'ar' => 'الحل المطبق', 'zh' => '实施的解决方案', 'hi' => 'लागू समाधान'],
            'Résultats et Impact' => ['fr' => 'Résultats et Impact', 'en' => 'Results and Impact', 'es' => 'Resultados e Impacto', 'de' => 'Ergebnisse und Auswirkungen', 'it' => 'Risultati e Impatto', 'pt' => 'Resultados e Impacto', 'ar' => 'النتائج والتأثير', 'zh' => '结果与影响', 'hi' => 'परिणाम और प्रभाव'],
            'Leçons Apprises' => ['fr' => 'Leçons Apprises', 'en' => 'Lessons Learned', 'es' => 'Lecciones Aprendidas', 'de' => 'Gewonnene Erkenntnisse', 'it' => 'Lezioni Apprese', 'pt' => 'Lições Aprendidas', 'ar' => 'الدروس المستفادة', 'zh' => '经验教训', 'hi' => 'सीखे गए सबक'],
        ];

        return $translations[$text][$lang] ?? $text;
    }
}