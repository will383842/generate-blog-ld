<?php

namespace Database\Seeders;

use App\Models\ExpatDomain;
use App\Models\ExpatDomainTranslation;
use Illuminate\Database\Seeder;

class ExpatDomainSeeder extends Seeder
{
    /**
     * Seeder pour les domaines d'aide expatriés (Ulysse.AI) - VERSION CORRIGÉE
     * 
     * Basé sur : expat-help-types.ts
     * Total : 24 types d'aide
     * Traductions : 9 langues (FR, EN, ES, DE, PT, RU, ZH, AR, HI)
     * 
     * ARCHITECTURE DE TRADUCTION:
     * - name_fr et name_en dans expat_domains (table principale)
     * - Autres langues (de, es, pt, ru, zh, ar, hi) dans expat_domain_translations
     */
    public function run(): void
    {
        $domains = [
            ['code' => 'INSTALLATION', 'icon' => 'home', 'order' => 1, 'requires_details' => false,
                'fr' => 'S\'installer', 'en' => 'Settling in', 'es' => 'Instalarse', 'de' => 'Sich niederlassen',
                'pt' => 'Instalar-se', 'ru' => 'Обустройство', 'zh' => '定居', 'ar' => 'الاستقرار', 'hi' => 'बसना'],

            ['code' => 'DEMARCHES_ADMINISTRATIVES', 'icon' => 'document-text', 'order' => 2, 'requires_details' => false,
                'fr' => 'Démarches administratives', 'en' => 'Administrative procedures', 'es' => 'Trámites administrativos', 'de' => 'Verwaltungsverfahren',
                'pt' => 'Procedimentos administrativos', 'ru' => 'Административные процедуры', 'zh' => '行政手续', 'ar' => 'الإجراءات الإدارية', 'hi' => 'प्रशासनिक प्रक्रियाएं'],

            ['code' => 'RECHERCHE_LOGEMENT', 'icon' => 'building-office-2', 'order' => 3, 'requires_details' => false,
                'fr' => 'Recherche de logement', 'en' => 'Housing search', 'es' => 'Búsqueda de vivienda', 'de' => 'Wohnungssuche',
                'pt' => 'Procura de habitação', 'ru' => 'Поиск жилья', 'zh' => '寻找住房', 'ar' => 'البحث عن سكن', 'hi' => 'आवास खोज'],

            ['code' => 'OUVERTURE_COMPTE_BANCAIRE', 'icon' => 'building-library', 'order' => 4, 'requires_details' => false,
                'fr' => 'Ouverture de compte bancaire', 'en' => 'Bank account opening', 'es' => 'Apertura de cuenta bancaria', 'de' => 'Kontoeröffnung',
                'pt' => 'Abertura de conta bancária', 'ru' => 'Открытие банковского счета', 'zh' => '开设银行账户', 'ar' => 'فتح حساب مصرفي', 'hi' => 'बैंक खाता खोलना'],

            ['code' => 'SYSTEME_SANTE', 'icon' => 'heart', 'order' => 5, 'requires_details' => false,
                'fr' => 'Système de santé', 'en' => 'Healthcare system', 'es' => 'Sistema de salud', 'de' => 'Gesundheitssystem',
                'pt' => 'Sistema de saúde', 'ru' => 'Система здравоохранения', 'zh' => '医疗系统', 'ar' => 'نظام الرعاية الصحية', 'hi' => 'स्वास्थ्य प्रणाली'],

            ['code' => 'EDUCATION_ECOLES', 'icon' => 'academic-cap', 'order' => 6, 'requires_details' => false,
                'fr' => 'Éducation et écoles', 'en' => 'Education and schools', 'es' => 'Educación y escuelas', 'de' => 'Bildung und Schulen',
                'pt' => 'Educação e escolas', 'ru' => 'Образование и школы', 'zh' => '教育和学校', 'ar' => 'التعليم والمدارس', 'hi' => 'शिक्षा और विद्यालय'],

            ['code' => 'TRANSPORT', 'icon' => 'truck', 'order' => 7, 'requires_details' => false,
                'fr' => 'Transport', 'en' => 'Transportation', 'es' => 'Transporte', 'de' => 'Transport',
                'pt' => 'Transporte', 'ru' => 'Транспорт', 'zh' => '交通', 'ar' => 'النقل', 'hi' => 'परिवहन'],

            ['code' => 'RECHERCHE_EMPLOI', 'icon' => 'briefcase', 'order' => 8, 'requires_details' => false,
                'fr' => 'Recherche d\'emploi', 'en' => 'Job search', 'es' => 'Búsqueda de empleo', 'de' => 'Jobsuche',
                'pt' => 'Procura de emprego', 'ru' => 'Поиск работы', 'zh' => '求职', 'ar' => 'البحث عن عمل', 'hi' => 'नौकरी खोज'],

            ['code' => 'CREATION_ENTREPRISE', 'icon' => 'building-office', 'order' => 9, 'requires_details' => false,
                'fr' => 'Création d\'entreprise', 'en' => 'Business creation', 'es' => 'Creación de empresa', 'de' => 'Unternehmensgründung',
                'pt' => 'Criação de empresa', 'ru' => 'Создание бизнеса', 'zh' => '创业', 'ar' => 'إنشاء شركة', 'hi' => 'व्यवसाय निर्माण'],

            ['code' => 'FISCALITE_LOCALE', 'icon' => 'calculator', 'order' => 10, 'requires_details' => false,
                'fr' => 'Fiscalité locale', 'en' => 'Local taxation', 'es' => 'Fiscalidad local', 'de' => 'Lokale Besteuerung',
                'pt' => 'Fiscalidade local', 'ru' => 'Местное налогообложение', 'zh' => '地方税务', 'ar' => 'الضرائب المحلية', 'hi' => 'स्थानीय कराधान'],

            ['code' => 'CULTURE_INTEGRATION', 'icon' => 'globe-alt', 'order' => 11, 'requires_details' => false,
                'fr' => 'Culture et intégration', 'en' => 'Culture and integration', 'es' => 'Cultura e integración', 'de' => 'Kultur und Integration',
                'pt' => 'Cultura e integração', 'ru' => 'Культура и интеграция', 'zh' => '文化和融入', 'ar' => 'الثقافة والاندماج', 'hi' => 'संस्कृति और एकीकरण'],

            ['code' => 'VISA_IMMIGRATION', 'icon' => 'identification', 'order' => 12, 'requires_details' => false,
                'fr' => 'Visa et immigration', 'en' => 'Visa and immigration', 'es' => 'Visa e inmigración', 'de' => 'Visum und Einwanderung',
                'pt' => 'Visto e imigração', 'ru' => 'Виза и иммиграция', 'zh' => '签证和移民', 'ar' => 'التأشيرة والهجرة', 'hi' => 'वीजा और आप्रवासन'],

            ['code' => 'ASSURANCES', 'icon' => 'shield-check', 'order' => 13, 'requires_details' => false,
                'fr' => 'Assurances', 'en' => 'Insurance', 'es' => 'Seguros', 'de' => 'Versicherungen',
                'pt' => 'Seguros', 'ru' => 'Страхование', 'zh' => '保险', 'ar' => 'التأمين', 'hi' => 'बीमा'],

            ['code' => 'TELEPHONE_INTERNET', 'icon' => 'device-phone-mobile', 'order' => 14, 'requires_details' => false,
                'fr' => 'Téléphone et internet', 'en' => 'Phone and internet', 'es' => 'Teléfono e internet', 'de' => 'Telefon und Internet',
                'pt' => 'Telefone e internet', 'ru' => 'Телефон и интернет', 'zh' => '电话和互联网', 'ar' => 'الهاتف والإنترنت', 'hi' => 'फोन और इंटरनेट'],

            ['code' => 'ALIMENTATION_COURSES', 'icon' => 'shopping-cart', 'order' => 15, 'requires_details' => false,
                'fr' => 'Alimentation et courses', 'en' => 'Food and shopping', 'es' => 'Alimentación y compras', 'de' => 'Lebensmittel und Einkaufen',
                'pt' => 'Alimentação e compras', 'ru' => 'Питание и покупки', 'zh' => '食品和购物', 'ar' => 'الطعام والتسوق', 'hi' => 'भोजन और खरीदारी'],

            ['code' => 'LOISIRS_SORTIES', 'icon' => 'ticket', 'order' => 16, 'requires_details' => false,
                'fr' => 'Loisirs et sorties', 'en' => 'Leisure and outings', 'es' => 'Ocio y salidas', 'de' => 'Freizeit und Ausgehen',
                'pt' => 'Lazer e saídas', 'ru' => 'Досуг и развлечения', 'zh' => '休闲和外出', 'ar' => 'الترفيه والخروج', 'hi' => 'मनोरंजन और बाहर जाना'],

            ['code' => 'SPORTS_ACTIVITES', 'icon' => 'trophy', 'order' => 17, 'requires_details' => false,
                'fr' => 'Sports et activités', 'en' => 'Sports and activities', 'es' => 'Deportes y actividades', 'de' => 'Sport und Aktivitäten',
                'pt' => 'Desportos e atividades', 'ru' => 'Спорт и занятия', 'zh' => '运动和活动', 'ar' => 'الرياضة والأنشطة', 'hi' => 'खेल और गतिविधियां'],

            ['code' => 'SECURITE', 'icon' => 'shield-exclamation', 'order' => 18, 'requires_details' => false,
                'fr' => 'Sécurité', 'en' => 'Security', 'es' => 'Seguridad', 'de' => 'Sicherheit',
                'pt' => 'Segurança', 'ru' => 'Безопасность', 'zh' => '安全', 'ar' => 'الأمن', 'hi' => 'सुरक्षा'],

            ['code' => 'URGENCES', 'icon' => 'exclamation-triangle', 'order' => 19, 'requires_details' => false,
                'fr' => 'Urgences', 'en' => 'Emergencies', 'es' => 'Emergencias', 'de' => 'Notfälle',
                'pt' => 'Emergências', 'ru' => 'Срочные случаи', 'zh' => '紧急情况', 'ar' => 'حالات الطوارئ', 'hi' => 'आपातकाल'],

            ['code' => 'PROBLEMES_ARGENT', 'icon' => 'currency-dollar', 'order' => 20, 'requires_details' => false,
                'fr' => 'Problèmes d\'argent', 'en' => 'Money problems', 'es' => 'Problemas de dinero', 'de' => 'Geldprobleme',
                'pt' => 'Problemas de dinheiro', 'ru' => 'Денежные проблемы', 'zh' => '资金问题', 'ar' => 'مشاكل مالية', 'hi' => 'धन की समस्याएं'],

            ['code' => 'PROBLEMES_RELATIONNELS', 'icon' => 'user-group', 'order' => 21, 'requires_details' => false,
                'fr' => 'Problèmes relationnels', 'en' => 'Relationship problems', 'es' => 'Problemas relacionales', 'de' => 'Beziehungsprobleme',
                'pt' => 'Problemas relacionais', 'ru' => 'Проблемы в отношениях', 'zh' => '关系问题', 'ar' => 'مشاكل العلاقات', 'hi' => 'संबंध समस्याएं'],

            ['code' => 'PROBLEMES_DIVERS', 'icon' => 'puzzle-piece', 'order' => 22, 'requires_details' => false,
                'fr' => 'Problèmes divers', 'en' => 'Various problems', 'es' => 'Problemas diversos', 'de' => 'Verschiedene Probleme',
                'pt' => 'Problemas diversos', 'ru' => 'Различные проблемы', 'zh' => '各种问题', 'ar' => 'مشاكل متنوعة', 'hi' => 'विभिन्न समस्याएं'],

            ['code' => 'PARTIR_OU_RENTRER', 'icon' => 'arrow-uturn-left', 'order' => 23, 'requires_details' => false,
                'fr' => 'Partir ou rentrer', 'en' => 'Leaving or returning', 'es' => 'Salir o volver', 'de' => 'Abreisen oder zurückkehren',
                'pt' => 'Partir ou voltar', 'ru' => 'Уезд или возвращение', 'zh' => '离开或返回', 'ar' => 'المغادرة أو العودة', 'hi' => 'जाना या लौटना'],

            ['code' => 'AUTRE_PRECISER', 'icon' => 'question-mark-circle', 'order' => 24, 'requires_details' => true,
                'fr' => 'Autre (précisez)', 'en' => 'Other (specify)', 'es' => 'Otro (especificar)', 'de' => 'Andere (angeben)',
                'pt' => 'Outro (especificar)', 'ru' => 'Другое (уточните)', 'zh' => '其他（请说明）', 'ar' => 'أخرى (حدد)', 'hi' => 'अन्य (निर्दिष्ट करें)'],
        ];

        echo "🌱 Insertion de " . count($domains) . " domaines d'aide expatriés...\n";

        foreach ($domains as $data) {
            // ✅ ÉTAPE 1: Créer le domaine principal (seulement FR et EN)
            $domain = ExpatDomain::create([
                'code' => $data['code'],
                'slug' => strtolower(str_replace('_', '-', $data['code'])),
                'name_fr' => $data['fr'],
                'name_en' => $data['en'],
                'icon' => $data['icon'],
                'order' => $data['order'],
                'requires_details' => $data['requires_details'],
                'is_active' => true,
            ]);

            // ✅ ÉTAPE 2: Créer les traductions pour les 7 autres langues
            $languages = ['de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
            
            foreach ($languages as $lang) {
                if (isset($data[$lang])) {
                    ExpatDomainTranslation::create([
                        'expat_domain_id' => $domain->id,
                        'language_code' => $lang,
                        'name' => $data[$lang],
                    ]);
                }
            }
        }

        echo "✅ " . count($domains) . " domaines insérés avec succès\n";
        echo "✅ " . (count($domains) * 7) . " traductions créées\n";
    }
}