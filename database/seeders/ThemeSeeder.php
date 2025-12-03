<?php

namespace Database\Seeders;

use App\Models\Theme;
use App\Models\ThemeTranslation;
use Illuminate\Database\Seeder;

class ThemeSeeder extends Seeder
{
    /**
     * Seeder pour les thèmes d'articles - VERSION CORRIGÉE
     * 
     * Total : 15 thèmes
     * Traductions : 9 langues (FR, EN, ES, DE, PT, RU, ZH, AR, HI)
     * 
     * ARCHITECTURE DE TRADUCTION:
     * - name_fr, name_en, description_fr, description_en dans themes (table principale)
     * - Autres langues (de, es, pt, ru, zh, ar, hi) dans theme_translations
     */
    public function run(): void
    {
        $themes = [
            // ═══════════════════════════════════════════════════════════════
            // THÈMES PRINCIPAUX EXPATRIATION
            // ═══════════════════════════════════════════════════════════════
            [
                'slug' => 'visa-immigration',
                'icon' => 'passport',
                'color' => '#3B82F6',
                'order' => 1,
                'translations' => [
                    'fr' => ['name' => 'Visa & Immigration', 'description' => 'Procédures de visa, permis de séjour et immigration'],
                    'en' => ['name' => 'Visa & Immigration', 'description' => 'Visa procedures, residence permits and immigration'],
                    'de' => ['name' => 'Visum & Einwanderung', 'description' => 'Visumverfahren, Aufenthaltsgenehmigungen und Einwanderung'],
                    'es' => ['name' => 'Visa e Inmigración', 'description' => 'Procedimientos de visa, permisos de residencia e inmigración'],
                    'pt' => ['name' => 'Visto e Imigração', 'description' => 'Procedimentos de visto, autorizações de residência e imigração'],
                    'ru' => ['name' => 'Виза и иммиграция', 'description' => 'Визовые процедуры, виды на жительство и иммиграция'],
                    'zh' => ['name' => '签证与移民', 'description' => '签证程序、居留许可和移民'],
                    'ar' => ['name' => 'التأشيرة والهجرة', 'description' => 'إجراءات التأشيرة وتصاريح الإقامة والهجرة'],
                    'hi' => ['name' => 'वीज़ा और आव्रजन', 'description' => 'वीज़ा प्रक्रियाएं, निवास परमिट और आव्रजन'],
                ],
            ],
            [
                'slug' => 'fiscalite-impots',
                'icon' => 'calculator',
                'color' => '#10B981',
                'order' => 2,
                'translations' => [
                    'fr' => ['name' => 'Fiscalité & Impôts', 'description' => 'Impôts, déclarations fiscales et optimisation'],
                    'en' => ['name' => 'Taxation & Taxes', 'description' => 'Taxes, tax returns and optimization'],
                    'de' => ['name' => 'Steuern & Abgaben', 'description' => 'Steuern, Steuererklärungen und Optimierung'],
                    'es' => ['name' => 'Fiscalidad e Impuestos', 'description' => 'Impuestos, declaraciones fiscales y optimización'],
                    'pt' => ['name' => 'Fiscalidade e Impostos', 'description' => 'Impostos, declarações fiscais e otimização'],
                    'ru' => ['name' => 'Налогообложение', 'description' => 'Налоги, налоговые декларации и оптимизация'],
                    'zh' => ['name' => '税务', 'description' => '税收、纳税申报和优化'],
                    'ar' => ['name' => 'الضرائب', 'description' => 'الضرائب والإقرارات الضريبية والتحسين'],
                    'hi' => ['name' => 'कराधान', 'description' => 'कर, कर रिटर्न और अनुकूलन'],
                ],
            ],
            [
                'slug' => 'banque-finance',
                'icon' => 'building-bank',
                'color' => '#8B5CF6',
                'order' => 3,
                'translations' => [
                    'fr' => ['name' => 'Banque & Finance', 'description' => 'Comptes bancaires, transferts et services financiers'],
                    'en' => ['name' => 'Banking & Finance', 'description' => 'Bank accounts, transfers and financial services'],
                    'de' => ['name' => 'Bank & Finanzen', 'description' => 'Bankkonten, Überweisungen und Finanzdienstleistungen'],
                    'es' => ['name' => 'Banca y Finanzas', 'description' => 'Cuentas bancarias, transferencias y servicios financieros'],
                    'pt' => ['name' => 'Banco e Finanças', 'description' => 'Contas bancárias, transferências e serviços financeiros'],
                    'ru' => ['name' => 'Банки и финансы', 'description' => 'Банковские счета, переводы и финансовые услуги'],
                    'zh' => ['name' => '银行与金融', 'description' => '银行账户、转账和金融服务'],
                    'ar' => ['name' => 'البنوك والمالية', 'description' => 'الحسابات المصرفية والتحويلات والخدمات المالية'],
                    'hi' => ['name' => 'बैंकिंग और वित्त', 'description' => 'बैंक खाते, स्थानांतरण और वित्तीय सेवाएं'],
                ],
            ],
            [
                'slug' => 'assurance-sante',
                'icon' => 'shield-check',
                'color' => '#EF4444',
                'order' => 4,
                'translations' => [
                    'fr' => ['name' => 'Assurance & Santé', 'description' => 'Assurance maladie, couverture santé et soins médicaux'],
                    'en' => ['name' => 'Insurance & Health', 'description' => 'Health insurance, coverage and medical care'],
                    'de' => ['name' => 'Versicherung & Gesundheit', 'description' => 'Krankenversicherung, Deckung und medizinische Versorgung'],
                    'es' => ['name' => 'Seguro y Salud', 'description' => 'Seguro médico, cobertura y atención sanitaria'],
                    'pt' => ['name' => 'Seguro e Saúde', 'description' => 'Seguro de saúde, cobertura e cuidados médicos'],
                    'ru' => ['name' => 'Страхование и здоровье', 'description' => 'Медицинское страхование, покрытие и медицинская помощь'],
                    'zh' => ['name' => '保险与健康', 'description' => '健康保险、保障和医疗护理'],
                    'ar' => ['name' => 'التأمين والصحة', 'description' => 'التأمين الصحي والتغطية والرعاية الطبية'],
                    'hi' => ['name' => 'बीमा और स्वास्थ्य', 'description' => 'स्वास्थ्य बीमा, कवरेज और चिकित्सा देखभाल'],
                ],
            ],
            [
                'slug' => 'logement-immobilier',
                'icon' => 'home',
                'color' => '#F59E0B',
                'order' => 5,
                'translations' => [
                    'fr' => ['name' => 'Logement & Immobilier', 'description' => 'Location, achat et gestion immobilière'],
                    'en' => ['name' => 'Housing & Real Estate', 'description' => 'Rental, purchase and property management'],
                    'de' => ['name' => 'Wohnen & Immobilien', 'description' => 'Miete, Kauf und Immobilienverwaltung'],
                    'es' => ['name' => 'Vivienda e Inmobiliaria', 'description' => 'Alquiler, compra y gestión inmobiliaria'],
                    'pt' => ['name' => 'Habitação e Imobiliário', 'description' => 'Arrendamento, compra e gestão imobiliária'],
                    'ru' => ['name' => 'Жилье и недвижимость', 'description' => 'Аренда, покупка и управление недвижимостью'],
                    'zh' => ['name' => '住房与房地产', 'description' => '租赁、购买和物业管理'],
                    'ar' => ['name' => 'السكن والعقارات', 'description' => 'الإيجار والشراء وإدارة العقارات'],
                    'hi' => ['name' => 'आवास और रियल एस्टेट', 'description' => 'किराया, खरीद और संपत्ति प्रबंधन'],
                ],
            ],
            [
                'slug' => 'demenagement',
                'icon' => 'truck',
                'color' => '#6366F1',
                'order' => 6,
                'translations' => [
                    'fr' => ['name' => 'Déménagement', 'description' => 'Déménagement international, transport et stockage'],
                    'en' => ['name' => 'Moving & Relocation', 'description' => 'International moving, transport and storage'],
                    'de' => ['name' => 'Umzug', 'description' => 'Internationaler Umzug, Transport und Lagerung'],
                    'es' => ['name' => 'Mudanza', 'description' => 'Mudanza internacional, transporte y almacenamiento'],
                    'pt' => ['name' => 'Mudança', 'description' => 'Mudança internacional, transporte e armazenamento'],
                    'ru' => ['name' => 'Переезд', 'description' => 'Международный переезд, транспортировка и хранение'],
                    'zh' => ['name' => '搬家', 'description' => '国际搬家、运输和存储'],
                    'ar' => ['name' => 'الانتقال', 'description' => 'النقل الدولي والنقل والتخزين'],
                    'hi' => ['name' => 'स्थानांतरण', 'description' => 'अंतर्राष्ट्रीय स्थानांतरण, परिवहन और भंडारण'],
                ],
            ],
            [
                'slug' => 'emploi-travail',
                'icon' => 'briefcase',
                'color' => '#0891B2',
                'order' => 7,
                'translations' => [
                    'fr' => ['name' => 'Emploi & Travail', 'description' => 'Recherche d\'emploi, contrats et droits du travail'],
                    'en' => ['name' => 'Employment & Work', 'description' => 'Job search, contracts and labor rights'],
                    'de' => ['name' => 'Arbeit & Beschäftigung', 'description' => 'Jobsuche, Verträge und Arbeitsrechte'],
                    'es' => ['name' => 'Empleo y Trabajo', 'description' => 'Búsqueda de empleo, contratos y derechos laborales'],
                    'pt' => ['name' => 'Emprego e Trabalho', 'description' => 'Procura de emprego, contratos e direitos laborais'],
                    'ru' => ['name' => 'Работа и занятость', 'description' => 'Поиск работы, контракты и трудовые права'],
                    'zh' => ['name' => '就业与工作', 'description' => '求职、合同和劳工权利'],
                    'ar' => ['name' => 'التوظيف والعمل', 'description' => 'البحث عن عمل والعقود وحقوق العمل'],
                    'hi' => ['name' => 'रोजगार और काम', 'description' => 'नौकरी खोज, अनुबंध और श्रम अधिकार'],
                ],
            ],
            [
                'slug' => 'famille-scolarite',
                'icon' => 'user-group',
                'color' => '#EC4899',
                'order' => 8,
                'translations' => [
                    'fr' => ['name' => 'Famille & Scolarité', 'description' => 'Vie de famille, éducation des enfants et scolarité'],
                    'en' => ['name' => 'Family & Education', 'description' => 'Family life, children\'s education and schooling'],
                    'de' => ['name' => 'Familie & Bildung', 'description' => 'Familienleben, Kindererziehung und Schulbildung'],
                    'es' => ['name' => 'Familia y Educación', 'description' => 'Vida familiar, educación de los niños y escolarización'],
                    'pt' => ['name' => 'Família e Educação', 'description' => 'Vida familiar, educação das crianças e escolaridade'],
                    'ru' => ['name' => 'Семья и образование', 'description' => 'Семейная жизнь, образование детей и школьное обучение'],
                    'zh' => ['name' => '家庭与教育', 'description' => '家庭生活、儿童教育和学校教育'],
                    'ar' => ['name' => 'الأسرة والتعليم', 'description' => 'الحياة الأسرية وتعليم الأطفال والتعليم المدرسي'],
                    'hi' => ['name' => 'परिवार और शिक्षा', 'description' => 'पारिवारिक जीवन, बच्चों की शिक्षा और स्कूली शिक्षा'],
                ],
            ],
            [
                'slug' => 'langue-culture',
                'icon' => 'language',
                'color' => '#14B8A6',
                'order' => 9,
                'translations' => [
                    'fr' => ['name' => 'Langue & Culture', 'description' => 'Apprentissage de la langue et intégration culturelle'],
                    'en' => ['name' => 'Language & Culture', 'description' => 'Language learning and cultural integration'],
                    'de' => ['name' => 'Sprache & Kultur', 'description' => 'Sprachenlernen und kulturelle Integration'],
                    'es' => ['name' => 'Idioma y Cultura', 'description' => 'Aprendizaje de idiomas e integración cultural'],
                    'pt' => ['name' => 'Língua e Cultura', 'description' => 'Aprendizagem de línguas e integração cultural'],
                    'ru' => ['name' => 'Язык и культура', 'description' => 'Изучение языка и культурная интеграция'],
                    'zh' => ['name' => '语言与文化', 'description' => '语言学习和文化融入'],
                    'ar' => ['name' => 'اللغة والثقافة', 'description' => 'تعلم اللغة والاندماج الثقافي'],
                    'hi' => ['name' => 'भाषा और संस्कृति', 'description' => 'भाषा सीखना और सांस्कृतिक एकीकरण'],
                ],
            ],
            [
                'slug' => 'patrimoine-succession',
                'icon' => 'banknotes',
                'color' => '#F59E0B',
                'order' => 10,
                'translations' => [
                    'fr' => ['name' => 'Patrimoine & Succession', 'description' => 'Gestion de patrimoine, investissements et successions'],
                    'en' => ['name' => 'Wealth & Inheritance', 'description' => 'Wealth management, investments and inheritance'],
                    'de' => ['name' => 'Vermögen & Erbschaft', 'description' => 'Vermögensverwaltung, Investitionen und Erbschaften'],
                    'es' => ['name' => 'Patrimonio y Sucesión', 'description' => 'Gestión patrimonial, inversiones y sucesiones'],
                    'pt' => ['name' => 'Património e Sucessão', 'description' => 'Gestão patrimonial, investimentos e sucessões'],
                    'ru' => ['name' => 'Имущество и наследство', 'description' => 'Управление активами, инвестиции и наследство'],
                    'zh' => ['name' => '财富与继承', 'description' => '财富管理、投资和继承'],
                    'ar' => ['name' => 'الثروة والميراث', 'description' => 'إدارة الثروة والاستثمارات والميراث'],
                    'hi' => ['name' => 'संपत्ति और उत्तराधिकार', 'description' => 'संपत्ति प्रबंधन, निवेश और उत्तराधिकार'],
                ],
            ],
            [
                'slug' => 'vehicule-permis',
                'icon' => 'truck',
                'color' => '#06B6D4',
                'order' => 11,
                'translations' => [
                    'fr' => ['name' => 'Véhicule & Permis', 'description' => 'Permis de conduire, immatriculation et assurance auto'],
                    'en' => ['name' => 'Vehicle & License', 'description' => 'Driving license, registration and car insurance'],
                    'de' => ['name' => 'Fahrzeug & Führerschein', 'description' => 'Führerschein, Zulassung und Kfz-Versicherung'],
                    'es' => ['name' => 'Vehículo y Licencia', 'description' => 'Licencia de conducir, matriculación y seguro de auto'],
                    'pt' => ['name' => 'Veículo e Carta', 'description' => 'Carta de condução, matrícula e seguro automóvel'],
                    'ru' => ['name' => 'Транспорт и права', 'description' => 'Водительские права, регистрация и автострахование'],
                    'zh' => ['name' => '车辆与驾照', 'description' => '驾照、注册和汽车保险'],
                    'ar' => ['name' => 'المركبة والرخصة', 'description' => 'رخصة القيادة والتسجيل وتأمين السيارة'],
                    'hi' => ['name' => 'वाहन और लाइसेंस', 'description' => 'ड्राइविंग लाइसेंस, पंजीकरण और कार बीमा'],
                ],
            ],
            [
                'slug' => 'droit-juridique',
                'icon' => 'scale',
                'color' => '#64748B',
                'order' => 12,
                'translations' => [
                    'fr' => ['name' => 'Droit & Juridique', 'description' => 'Conseils juridiques, contrats et litiges'],
                    'en' => ['name' => 'Law & Legal', 'description' => 'Legal advice, contracts and disputes'],
                    'de' => ['name' => 'Recht & Justiz', 'description' => 'Rechtsberatung, Verträge und Streitigkeiten'],
                    'es' => ['name' => 'Derecho y Legal', 'description' => 'Asesoramiento legal, contratos y disputas'],
                    'pt' => ['name' => 'Direito e Jurídico', 'description' => 'Aconselhamento jurídico, contratos e litígios'],
                    'ru' => ['name' => 'Право и юриспруденция', 'description' => 'Юридические консультации, контракты и споры'],
                    'zh' => ['name' => '法律', 'description' => '法律咨询、合同和纠纷'],
                    'ar' => ['name' => 'القانون', 'description' => 'الاستشارات القانونية والعقود والنزاعات'],
                    'hi' => ['name' => 'कानून', 'description' => 'कानूनी सलाह, अनुबंध और विवाद'],
                ],
            ],
            [
                'slug' => 'entrepreneuriat',
                'icon' => 'building-office',
                'color' => '#A855F7',
                'order' => 13,
                'translations' => [
                    'fr' => ['name' => 'Entrepreneuriat', 'description' => 'Création d\'entreprise, freelance et business'],
                    'en' => ['name' => 'Entrepreneurship', 'description' => 'Business creation, freelance and business'],
                    'de' => ['name' => 'Unternehmertum', 'description' => 'Unternehmensgründung, Freelance und Business'],
                    'es' => ['name' => 'Emprendimiento', 'description' => 'Creación de empresas, freelance y negocios'],
                    'pt' => ['name' => 'Empreendedorismo', 'description' => 'Criação de empresas, freelance e negócios'],
                    'ru' => ['name' => 'Предпринимательство', 'description' => 'Создание бизнеса, фриланс и бизнес'],
                    'zh' => ['name' => '创业', 'description' => '创业、自由职业和商业'],
                    'ar' => ['name' => 'ريادة الأعمال', 'description' => 'إنشاء الأعمال والعمل الحر والأعمال التجارية'],
                    'hi' => ['name' => 'उद्यमिता', 'description' => 'व्यवसाय निर्माण, फ्रीलांस और व्यापार'],
                ],
            ],
            [
                'slug' => 'vie-quotidienne',
                'icon' => 'sparkles',
                'color' => '#22C55E',
                'order' => 14,
                'translations' => [
                    'fr' => ['name' => 'Vie Quotidienne', 'description' => 'Vie pratique, culture et intégration'],
                    'en' => ['name' => 'Daily Life', 'description' => 'Practical life, culture and integration'],
                    'de' => ['name' => 'Alltag', 'description' => 'Praktisches Leben, Kultur und Integration'],
                    'es' => ['name' => 'Vida Cotidiana', 'description' => 'Vida práctica, cultura e integración'],
                    'pt' => ['name' => 'Vida Quotidiana', 'description' => 'Vida prática, cultura e integração'],
                    'ru' => ['name' => 'Повседневная жизнь', 'description' => 'Практическая жизнь, культура и интеграция'],
                    'zh' => ['name' => '日常生活', 'description' => '实用生活、文化和融入'],
                    'ar' => ['name' => 'الحياة اليومية', 'description' => 'الحياة العملية والثقافة والاندماج'],
                    'hi' => ['name' => 'दैनिक जीवन', 'description' => 'व्यावहारिक जीवन, संस्कृति और एकीकरण'],
                ],
            ],
            [
                'slug' => 'urgences-securite',
                'icon' => 'exclamation-triangle',
                'color' => '#DC2626',
                'order' => 15,
                'translations' => [
                    'fr' => ['name' => 'Urgences & Sécurité', 'description' => 'Situations d\'urgence, sécurité et assistance'],
                    'en' => ['name' => 'Emergencies & Safety', 'description' => 'Emergency situations, safety and assistance'],
                    'de' => ['name' => 'Notfälle & Sicherheit', 'description' => 'Notfallsituationen, Sicherheit und Hilfe'],
                    'es' => ['name' => 'Emergencias y Seguridad', 'description' => 'Situaciones de emergencia, seguridad y asistencia'],
                    'pt' => ['name' => 'Emergências e Segurança', 'description' => 'Situações de emergência, segurança e assistência'],
                    'ru' => ['name' => 'Экстренные ситуации', 'description' => 'Чрезвычайные ситуации, безопасность и помощь'],
                    'zh' => ['name' => '紧急情况与安全', 'description' => '紧急情况、安全和援助'],
                    'ar' => ['name' => 'الطوارئ والأمان', 'description' => 'حالات الطوارئ والسلامة والمساعدة'],
                    'hi' => ['name' => 'आपातकाल और सुरक्षा', 'description' => 'आपातकालीन स्थितियां, सुरक्षा और सहायता'],
                ],
            ],
        ];

        echo "🌱 Insertion de " . count($themes) . " thèmes...\n";

        foreach ($themes as $themeData) {
            // ✅ ÉTAPE 1: Créer le thème principal (FR et EN)
            $theme = Theme::create([
                'slug' => $themeData['slug'],
                'name_fr' => $themeData['translations']['fr']['name'],
                'name_en' => $themeData['translations']['en']['name'],
                'description_fr' => $themeData['translations']['fr']['description'] ?? null,
                'description_en' => $themeData['translations']['en']['description'] ?? null,
                'icon' => $themeData['icon'],
                'color' => $themeData['color'],
                'order' => $themeData['order'],
                'is_active' => true,
            ]);

            // ✅ ÉTAPE 2: Créer les traductions pour les 7 autres langues
            $languages = ['de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
            
            foreach ($languages as $lang) {
                if (isset($themeData['translations'][$lang])) {
                    ThemeTranslation::create([
                    'theme_id' => $theme->id,
                    'language_code' => $lang,
                    'name' => $themeData['translations'][$lang]['name'],
                    'slug' => $themeData['slug'], // ← LIGNE AJOUTÉE
                    'description' => $themeData['translations'][$lang]['description'] ?? null,
                ]);
                }
            }
        }

        echo "✅ " . count($themes) . " thèmes insérés avec succès\n";
        echo "✅ " . (count($themes) * 7) . " traductions créées\n";
    }
}