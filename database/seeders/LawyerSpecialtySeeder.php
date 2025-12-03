<?php

namespace Database\Seeders;

use App\Models\LawyerSpecialty;
use App\Models\LawyerSpecialtyTranslation;
use Illuminate\Database\Seeder;

class LawyerSpecialtySeeder extends Seeder
{
    /**
     * Spécialités juridiques pour EXPATRIÉS, VOYAGEURS et VACANCIERS
     * 
     * Public cible : Toutes nationalités dans 197 pays
     * Contexte : Problèmes juridiques rencontrés à l'étranger
     * 
     * 22 catégories - 91 spécialités
     */
    public function run(): void
    {
        $specialties = [
            // ═══════════════════════════════════════════════════════════════
            // 1. URGENCES (URG) - 6 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'URG', 'code' => 'URG_ARRESTATION_DETENTION', 'icon' => 'exclamation-triangle', 'order' => 1,
                'fr' => 'Arrestation et détention', 'en' => 'Arrest and detention', 'es' => 'Arresto y detención', 'de' => 'Verhaftung und Haft',
                'pt' => 'Prisão e detenção', 'ru' => 'Арест и содержание под стражей', 'zh' => '逮捕和拘留', 'ar' => 'الاعتقال والاحتجاز', 'hi' => 'गिरफ्तारी और हिरासत'],
            
            ['category_code' => 'URG', 'code' => 'URG_EXPULSION_REFOULEMENT', 'icon' => 'exclamation-triangle', 'order' => 2,
                'fr' => 'Expulsion et refoulement', 'en' => 'Deportation and removal', 'es' => 'Expulsión y devolución', 'de' => 'Abschiebung und Zurückweisung',
                'pt' => 'Expulsão e remoção', 'ru' => 'Депортация и выдворение', 'zh' => '驱逐和遣返', 'ar' => 'الترحيل والإبعاد', 'hi' => 'निर्वासन और निष्कासन'],
            
            ['category_code' => 'URG', 'code' => 'URG_ACCIDENT_RESPONSABILITE', 'icon' => 'exclamation-triangle', 'order' => 3,
                'fr' => 'Accident et responsabilité civile', 'en' => 'Accident and civil liability', 'es' => 'Accidente y responsabilidad civil', 'de' => 'Unfall und Haftpflicht',
                'pt' => 'Acidente e responsabilidade civil', 'ru' => 'ДТП и гражданская ответственность', 'zh' => '事故和民事责任', 'ar' => 'حادث ومسؤولية مدنية', 'hi' => 'दुर्घटना और नागरिक दायित्व'],
            
            ['category_code' => 'URG', 'code' => 'URG_VOL_AGRESSION', 'icon' => 'exclamation-triangle', 'order' => 4,
                'fr' => 'Vol et agression', 'en' => 'Theft and assault', 'es' => 'Robo y agresión', 'de' => 'Diebstahl und Körperverletzung',
                'pt' => 'Roubo e agressão', 'ru' => 'Кража и нападение', 'zh' => '盗窃和攻击', 'ar' => 'السرقة والاعتداء', 'hi' => 'चोरी और हमला'],
            
            ['category_code' => 'URG', 'code' => 'URG_URGENCE_MEDICALE_LEGALE', 'icon' => 'exclamation-triangle', 'order' => 5,
                'fr' => 'Urgence médicale légale', 'en' => 'Legal medical emergency', 'es' => 'Emergencia médica legal', 'de' => 'Rechtlicher medizinischer Notfall',
                'pt' => 'Emergência médica legal', 'ru' => 'Правовая медицинская помощь', 'zh' => '法律医疗紧急情况', 'ar' => 'حالة طبية قانونية طارئة', 'hi' => 'कानूनी चिकित्सा आपातकाल'],
            
            ['category_code' => 'URG', 'code' => 'URG_RAPATRIEMENT_URGENCE', 'icon' => 'exclamation-triangle', 'order' => 6,
                'fr' => 'Rapatriement d\'urgence', 'en' => 'Emergency repatriation', 'es' => 'Repatriación de emergencia', 'de' => 'Notfall-Rückführung',
                'pt' => 'Repatriação de emergência', 'ru' => 'Экстренная репатриация', 'zh' => '紧急遣返', 'ar' => 'الإعادة الطارئة', 'hi' => 'आपातकालीन प्रत्यावर्तन'],

            // ═══════════════════════════════════════════════════════════════
            // 2. IMMIGRATION & VISAS (VISA) - 7 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'VISA', 'code' => 'VISA_TOURISTE', 'icon' => 'identification', 'order' => 7,
                'fr' => 'Visa touristique', 'en' => 'Tourist visa', 'es' => 'Visa turística', 'de' => 'Touristenvisum',
                'pt' => 'Visto de turista', 'ru' => 'Туристическая виза', 'zh' => '旅游签证', 'ar' => 'تأشيرة سياحية', 'hi' => 'पर्यटक वीज़ा'],
            
            ['category_code' => 'VISA', 'code' => 'VISA_TRAVAIL', 'icon' => 'identification', 'order' => 8,
                'fr' => 'Visa et permis de travail', 'en' => 'Work visa and permit', 'es' => 'Visa y permiso de trabajo', 'de' => 'Arbeitsvisum und -erlaubnis',
                'pt' => 'Visto e autorização de trabalho', 'ru' => 'Рабочая виза и разрешение', 'zh' => '工作签证和许可', 'ar' => 'تأشيرة وتصريح عمل', 'hi' => 'कार्य वीज़ा और परमिट'],
            
            ['category_code' => 'VISA', 'code' => 'VISA_ETUDIANT', 'icon' => 'identification', 'order' => 9,
                'fr' => 'Visa étudiant', 'en' => 'Student visa', 'es' => 'Visa de estudiante', 'de' => 'Studentenvisum',
                'pt' => 'Visto de estudante', 'ru' => 'Студенческая виза', 'zh' => '学生签证', 'ar' => 'تأشيرة طالب', 'hi' => 'छात्र वीज़ा'],
            
            ['category_code' => 'VISA', 'code' => 'VISA_RESIDENCE_PERMANENTE', 'icon' => 'identification', 'order' => 10,
                'fr' => 'Résidence permanente', 'en' => 'Permanent residence', 'es' => 'Residencia permanente', 'de' => 'Dauerhafter Aufenthalt',
                'pt' => 'Residência permanente', 'ru' => 'Постоянное проживание', 'zh' => '永久居留', 'ar' => 'إقامة دائمة', 'hi' => 'स्थायी निवास'],
            
            ['category_code' => 'VISA', 'code' => 'VISA_INVESTISSEUR', 'icon' => 'identification', 'order' => 11,
                'fr' => 'Visa investisseur', 'en' => 'Investor visa', 'es' => 'Visa de inversionista', 'de' => 'Investorenvisum',
                'pt' => 'Visto de investidor', 'ru' => 'Инвесторская виза', 'zh' => '投资者签证', 'ar' => 'تأشيرة مستثمر', 'hi' => 'निवेशक वीज़ा'],
            
            ['category_code' => 'VISA', 'code' => 'VISA_REGROUPEMENT_FAMILIAL', 'icon' => 'identification', 'order' => 12,
                'fr' => 'Regroupement familial', 'en' => 'Family reunification', 'es' => 'Reagrupación familiar', 'de' => 'Familienzusammenführung',
                'pt' => 'Reagrupamento familiar', 'ru' => 'Воссоединение семьи', 'zh' => '家庭团聚', 'ar' => 'لم شمل الأسرة', 'hi' => 'परिवार पुनर्मिलन'],
            
            ['category_code' => 'VISA', 'code' => 'VISA_NATURALISATION', 'icon' => 'identification', 'order' => 13,
                'fr' => 'Naturalisation et citoyenneté', 'en' => 'Naturalization and citizenship', 'es' => 'Naturalización y ciudadanía', 'de' => 'Einbürgerung und Staatsbürgerschaft',
                'pt' => 'Naturalização e cidadania', 'ru' => 'Натурализация и гражданство', 'zh' => '入籍和公民身份', 'ar' => 'التجنس والمواطنة', 'hi' => 'नागरिकता प्राप्ति'],

            // ═══════════════════════════════════════════════════════════════
            // 3. LOGEMENT & IMMOBILIER (LOG) - 6 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'LOG', 'code' => 'LOG_LOCATION_COURTE_DUREE', 'icon' => 'home', 'order' => 14,
                'fr' => 'Location courte durée (vacances)', 'en' => 'Short-term rental (vacation)', 'es' => 'Alquiler corta estancia', 'de' => 'Kurzzeitmiete (Urlaub)',
                'pt' => 'Aluguel de curta duração', 'ru' => 'Краткосрочная аренда', 'zh' => '短期租赁（度假）', 'ar' => 'إيجار قصير الأجل', 'hi' => 'अल्पकालिक किराया'],
            
            ['category_code' => 'LOG', 'code' => 'LOG_LOCATION_LONGUE_DUREE', 'icon' => 'home', 'order' => 15,
                'fr' => 'Location longue durée', 'en' => 'Long-term rental', 'es' => 'Alquiler larga estancia', 'de' => 'Langzeitmiete',
                'pt' => 'Aluguel de longa duração', 'ru' => 'Долгосрочная аренда', 'zh' => '长期租赁', 'ar' => 'إيجار طويل الأجل', 'hi' => 'दीर्घकालिक किराया'],
            
            ['category_code' => 'LOG', 'code' => 'LOG_ACHAT_VENTE_BIEN', 'icon' => 'home', 'order' => 16,
                'fr' => 'Achat/vente de bien immobilier', 'en' => 'Property purchase/sale', 'es' => 'Compra/venta de propiedad', 'de' => 'Immobilienkauf/-verkauf',
                'pt' => 'Compra/venda de imóvel', 'ru' => 'Покупка/продажа недвижимости', 'zh' => '房产买卖', 'ar' => 'شراء/بيع العقارات', 'hi' => 'संपत्ति खरीद/बिक्री'],
            
            ['category_code' => 'LOG', 'code' => 'LOG_LITIGES_PROPRIETAIRE_LOCATAIRE', 'icon' => 'home', 'order' => 17,
                'fr' => 'Litiges propriétaire/locataire', 'en' => 'Landlord/tenant disputes', 'es' => 'Disputas propietario/inquilino', 'de' => 'Vermieter-Mieter-Streitigkeiten',
                'pt' => 'Disputas proprietário/inquilino', 'ru' => 'Споры арендодателя/арендатора', 'zh' => '房东/租客纠纷', 'ar' => 'نزاعات المالك/المستأجر', 'hi' => 'मकान मालिक/किरायेदार विवाद'],
            
            ['category_code' => 'LOG', 'code' => 'LOG_CAUTION_DEPOT_GARANTIE', 'icon' => 'home', 'order' => 18,
                'fr' => 'Caution et dépôt de garantie', 'en' => 'Security deposit', 'es' => 'Depósito de garantía', 'de' => 'Kaution',
                'pt' => 'Depósito caução', 'ru' => 'Залоговый депозит', 'zh' => '押金', 'ar' => 'الضمان والتأمين', 'hi' => 'जमा राशि'],
            
            ['category_code' => 'LOG', 'code' => 'LOG_EXPULSION_LOCATIVE', 'icon' => 'home', 'order' => 19,
                'fr' => 'Expulsion locative', 'en' => 'Eviction', 'es' => 'Desalojo', 'de' => 'Räumung',
                'pt' => 'Despejo', 'ru' => 'Выселение', 'zh' => '驱逐', 'ar' => 'الإخلاء', 'hi' => 'बेदखली'],

            // ═══════════════════════════════════════════════════════════════
            // 4. TRAVAIL & EMPLOI (TRAV) - 6 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'TRAV', 'code' => 'TRAV_CONTRAT_TRAVAIL_INTERNATIONAL', 'icon' => 'briefcase', 'order' => 20,
                'fr' => 'Contrat de travail international', 'en' => 'International employment contract', 'es' => 'Contrato de trabajo internacional', 'de' => 'Internationaler Arbeitsvertrag',
                'pt' => 'Contrato de trabalho internacional', 'ru' => 'Международный трудовой договор', 'zh' => '国际劳动合同', 'ar' => 'عقد عمل دولي', 'hi' => 'अंतर्राष्ट्रीय रोजगार अनुबंध'],
            
            ['category_code' => 'TRAV', 'code' => 'TRAV_LICENCIEMENT_RUPTURE', 'icon' => 'briefcase', 'order' => 21,
                'fr' => 'Licenciement et rupture', 'en' => 'Termination and dismissal', 'es' => 'Despido y terminación', 'de' => 'Kündigung und Entlassung',
                'pt' => 'Demissão e rescisão', 'ru' => 'Увольнение', 'zh' => '解雇和终止', 'ar' => 'الفصل والإنهاء', 'hi' => 'बर्खास्तगी'],
            
            ['category_code' => 'TRAV', 'code' => 'TRAV_SALAIRES_IMPAYES', 'icon' => 'briefcase', 'order' => 22,
                'fr' => 'Salaires impayés', 'en' => 'Unpaid wages', 'es' => 'Salarios impagos', 'de' => 'Unbezahlte Löhne',
                'pt' => 'Salários não pagos', 'ru' => 'Невыплаченная зарплата', 'zh' => '未付工资', 'ar' => 'الأجور غير المدفوعة', 'hi' => 'अवैतनिक वेतन'],
            
            ['category_code' => 'TRAV', 'code' => 'TRAV_DISCRIMINATION_HARCELEMENT', 'icon' => 'briefcase', 'order' => 23,
                'fr' => 'Discrimination et harcèlement au travail', 'en' => 'Workplace discrimination and harassment', 'es' => 'Discriminación y acoso laboral', 'de' => 'Diskriminierung und Belästigung',
                'pt' => 'Discriminação e assédio no trabalho', 'ru' => 'Дискриминация и домогательства', 'zh' => '工作场所歧视和骚扰', 'ar' => 'التمييز والتحرش في العمل', 'hi' => 'कार्यस्थल भेदभाव और उत्पीड़न'],
            
            ['category_code' => 'TRAV', 'code' => 'TRAV_FREELANCE_INDEPENDANT', 'icon' => 'briefcase', 'order' => 24,
                'fr' => 'Freelance et travail indépendant', 'en' => 'Freelance and self-employment', 'es' => 'Freelance y trabajo autónomo', 'de' => 'Freiberuflich und Selbstständig',
                'pt' => 'Freelance e trabalho autônomo', 'ru' => 'Фриланс и самозанятость', 'zh' => '自由职业和自雇', 'ar' => 'العمل الحر والمستقل', 'hi' => 'फ्रीलांस और स्व-रोजगार'],
            
            ['category_code' => 'TRAV', 'code' => 'TRAV_ACCIDENT_TRAVAIL', 'icon' => 'briefcase', 'order' => 25,
                'fr' => 'Accident du travail', 'en' => 'Work accident', 'es' => 'Accidente de trabajo', 'de' => 'Arbeitsunfall',
                'pt' => 'Acidente de trabalho', 'ru' => 'Несчастный случай на работе', 'zh' => '工伤', 'ar' => 'حادث عمل', 'hi' => 'कार्य दुर्घटना'],

            // ═══════════════════════════════════════════════════════════════
            // 5. ENTREPRISE & BUSINESS (ENTR) - 5 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'ENTR', 'code' => 'ENTR_CREATION_SOCIETE', 'icon' => 'building-office', 'order' => 26,
                'fr' => 'Création de société', 'en' => 'Company formation', 'es' => 'Creación de empresa', 'de' => 'Unternehmensgründung',
                'pt' => 'Criação de empresa', 'ru' => 'Создание компании', 'zh' => '公司成立', 'ar' => 'إنشاء شركة', 'hi' => 'कंपनी गठन'],
            
            ['category_code' => 'ENTR', 'code' => 'ENTR_LICENCES_COMMERCIALES', 'icon' => 'building-office', 'order' => 27,
                'fr' => 'Licences commerciales', 'en' => 'Business licenses', 'es' => 'Licencias comerciales', 'de' => 'Geschäftslizenzen',
                'pt' => 'Licenças comerciais', 'ru' => 'Коммерческие лицензии', 'zh' => '营业执照', 'ar' => 'تراخيص تجارية', 'hi' => 'व्यावसायिक लाइसेंस'],
            
            ['category_code' => 'ENTR', 'code' => 'ENTR_INVESTISSEMENT_ETRANGER', 'icon' => 'building-office', 'order' => 28,
                'fr' => 'Investissement étranger', 'en' => 'Foreign investment', 'es' => 'Inversión extranjera', 'de' => 'Auslandsinvestitionen',
                'pt' => 'Investimento estrangeiro', 'ru' => 'Иностранные инвестиции', 'zh' => '外国投资', 'ar' => 'استثمار أجنبي', 'hi' => 'विदेशी निवेश'],
            
            ['category_code' => 'ENTR', 'code' => 'ENTR_IMPORT_EXPORT', 'icon' => 'building-office', 'order' => 29,
                'fr' => 'Import/export et douanes', 'en' => 'Import/export and customs', 'es' => 'Importación/exportación y aduanas', 'de' => 'Import/Export und Zoll',
                'pt' => 'Importação/exportação e alfândega', 'ru' => 'Импорт/экспорт и таможня', 'zh' => '进出口和海关', 'ar' => 'الاستيراد/التصدير والجمارك', 'hi' => 'आयात/निर्यात और सीमा शुल्क'],
            
            ['category_code' => 'ENTR', 'code' => 'ENTR_LITIGES_COMMERCIAUX', 'icon' => 'building-office', 'order' => 30,
                'fr' => 'Litiges commerciaux', 'en' => 'Commercial disputes', 'es' => 'Disputas comerciales', 'de' => 'Handelsstreitigkeiten',
                'pt' => 'Disputas comerciais', 'ru' => 'Коммерческие споры', 'zh' => '商业纠纷', 'ar' => 'النزاعات التجارية', 'hi' => 'व्यावसायिक विवाद'],

            // ═══════════════════════════════════════════════════════════════
            // 6. FISCALITÉ INTERNATIONALE (FISC) - 4 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'FISC', 'code' => 'FISC_DECLARATIONS_FISCALES', 'icon' => 'calculator', 'order' => 31,
                'fr' => 'Déclarations fiscales internationales', 'en' => 'International tax returns', 'es' => 'Declaraciones fiscales internacionales', 'de' => 'Internationale Steuererklärungen',
                'pt' => 'Declarações fiscais internacionais', 'ru' => 'Международные налоговые декларации', 'zh' => '国际纳税申报', 'ar' => 'الإقرارات الضريبية الدولية', 'hi' => 'अंतर्राष्ट्रीय कर रिटर्न'],
            
            ['category_code' => 'FISC', 'code' => 'FISC_DOUBLE_IMPOSITION', 'icon' => 'calculator', 'order' => 32,
                'fr' => 'Double imposition', 'en' => 'Double taxation', 'es' => 'Doble imposición', 'de' => 'Doppelbesteuerung',
                'pt' => 'Dupla tributação', 'ru' => 'Двойное налогообложение', 'zh' => '双重征税', 'ar' => 'الازدواج الضريبي', 'hi' => 'दोहरा कराधान'],
            
            ['category_code' => 'FISC', 'code' => 'FISC_TVA_TAXES_LOCALES', 'icon' => 'calculator', 'order' => 33,
                'fr' => 'TVA et taxes locales', 'en' => 'VAT and local taxes', 'es' => 'IVA e impuestos locales', 'de' => 'MwSt. und lokale Steuern',
                'pt' => 'IVA e impostos locais', 'ru' => 'НДС и местные налоги', 'zh' => '增值税和地方税', 'ar' => 'ضريبة القيمة المضافة والضرائب المحلية', 'hi' => 'वैट और स्थानीय कर'],
            
            ['category_code' => 'FISC', 'code' => 'FISC_CONTROLES_FISCAUX', 'icon' => 'calculator', 'order' => 34,
                'fr' => 'Contrôles fiscaux', 'en' => 'Tax audits', 'es' => 'Auditorías fiscales', 'de' => 'Steuerprüfungen',
                'pt' => 'Auditorias fiscais', 'ru' => 'Налоговые проверки', 'zh' => '税务审计', 'ar' => 'التدقيق الضريبي', 'hi' => 'कर लेखा परीक्षा'],

            // ═══════════════════════════════════════════════════════════════
            // 7. BANQUE & FINANCE (BANK) - 5 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'BANK', 'code' => 'BANK_OUVERTURE_COMPTE', 'icon' => 'building-library', 'order' => 35,
                'fr' => 'Ouverture de compte bancaire', 'en' => 'Bank account opening', 'es' => 'Apertura de cuenta bancaria', 'de' => 'Kontoeröffnung',
                'pt' => 'Abertura de conta bancária', 'ru' => 'Открытие банковского счета', 'zh' => '开设银行账户', 'ar' => 'فتح حساب مصرفي', 'hi' => 'बैंक खाता खोलना'],
            
            ['category_code' => 'BANK', 'code' => 'BANK_VIREMENTS_BLOQUES', 'icon' => 'building-library', 'order' => 36,
                'fr' => 'Virements bloqués', 'en' => 'Blocked transfers', 'es' => 'Transferencias bloqueadas', 'de' => 'Blockierte Überweisungen',
                'pt' => 'Transferências bloqueadas', 'ru' => 'Заблокированные переводы', 'zh' => '冻结转账', 'ar' => 'التحويلات المحظورة', 'hi' => 'अवरुद्ध स्थानांतरण'],
            
            ['category_code' => 'BANK', 'code' => 'BANK_LITIGES_BANCAIRES', 'icon' => 'building-library', 'order' => 37,
                'fr' => 'Litiges bancaires', 'en' => 'Banking disputes', 'es' => 'Disputas bancarias', 'de' => 'Bankstreitigkeiten',
                'pt' => 'Disputas bancárias', 'ru' => 'Банковские споры', 'zh' => '银行纠纷', 'ar' => 'نزاعات مصرفية', 'hi' => 'बैंकिंग विवाद'],
            
            ['category_code' => 'BANK', 'code' => 'BANK_CREDITS_PRETS', 'icon' => 'building-library', 'order' => 38,
                'fr' => 'Crédits et prêts', 'en' => 'Loans and credit', 'es' => 'Préstamos y créditos', 'de' => 'Kredite und Darlehen',
                'pt' => 'Empréstimos e crédito', 'ru' => 'Кредиты и займы', 'zh' => '贷款和信贷', 'ar' => 'القروض والائتمان', 'hi' => 'ऋण और क्रेडिट'],
            
            ['category_code' => 'BANK', 'code' => 'BANK_FRAUDE_BANCAIRE', 'icon' => 'building-library', 'order' => 39,
                'fr' => 'Fraude bancaire', 'en' => 'Banking fraud', 'es' => 'Fraude bancario', 'de' => 'Bankbetrug',
                'pt' => 'Fraude bancária', 'ru' => 'Банковское мошенничество', 'zh' => '银行欺诈', 'ar' => 'احتيال مصرفي', 'hi' => 'बैंकिंग धोखाधड़ी'],

            // ═══════════════════════════════════════════════════════════════
            // 8. FAMILLE INTERNATIONALE (FAM) - 5 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'FAM', 'code' => 'FAM_MARIAGE_INTERNATIONAL', 'icon' => 'users', 'order' => 40,
                'fr' => 'Mariage international', 'en' => 'International marriage', 'es' => 'Matrimonio internacional', 'de' => 'Internationale Ehe',
                'pt' => 'Casamento internacional', 'ru' => 'Международный брак', 'zh' => '国际婚姻', 'ar' => 'زواج دولي', 'hi' => 'अंतर्राष्ट्रीय विवाह'],
            
            ['category_code' => 'FAM', 'code' => 'FAM_DIVORCE_INTERNATIONAL', 'icon' => 'users', 'order' => 41,
                'fr' => 'Divorce international', 'en' => 'International divorce', 'es' => 'Divorcio internacional', 'de' => 'Internationale Scheidung',
                'pt' => 'Divórcio internacional', 'ru' => 'Международный развод', 'zh' => '国际离婚', 'ar' => 'طلاق دولي', 'hi' => 'अंतर्राष्ट्रीय तलाक'],
            
            ['category_code' => 'FAM', 'code' => 'FAM_GARDE_ENFANTS', 'icon' => 'users', 'order' => 42,
                'fr' => 'Garde d\'enfants transfrontalière', 'en' => 'Cross-border child custody', 'es' => 'Custodia transfronteriza', 'de' => 'Grenzüberschreitendes Sorgerecht',
                'pt' => 'Guarda transfronteiriça', 'ru' => 'Трансграничная опека', 'zh' => '跨境监护', 'ar' => 'حضانة عبر الحدود', 'hi' => 'सीमा पार हिरासत'],
            
            ['category_code' => 'FAM', 'code' => 'FAM_PENSION_ALIMENTAIRE', 'icon' => 'users', 'order' => 43,
                'fr' => 'Pension alimentaire internationale', 'en' => 'International alimony', 'es' => 'Pensión alimenticia internacional', 'de' => 'Internationaler Unterhalt',
                'pt' => 'Pensão alimentícia internacional', 'ru' => 'Международные алименты', 'zh' => '国际赡养费', 'ar' => 'نفقة دولية', 'hi' => 'अंतर्राष्ट्रीय गुजारा भत्ता'],
            
            ['category_code' => 'FAM', 'code' => 'FAM_ADOPTION_INTERNATIONALE', 'icon' => 'users', 'order' => 44,
                'fr' => 'Adoption internationale', 'en' => 'International adoption', 'es' => 'Adopción internacional', 'de' => 'Internationale Adoption',
                'pt' => 'Adoção internacional', 'ru' => 'Международное усыновление', 'zh' => '国际收养', 'ar' => 'تبني دولي', 'hi' => 'अंतर्राष्ट्रीय गोद लेना'],

            // ═══════════════════════════════════════════════════════════════
            // 9. VÉHICULES & TRANSPORT (VEH) - 5 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'VEH', 'code' => 'VEH_ACHAT_VENTE_VEHICULE', 'icon' => 'car', 'order' => 45,
                'fr' => 'Achat/vente de véhicule', 'en' => 'Vehicle purchase/sale', 'es' => 'Compra/venta de vehículo', 'de' => 'Fahrzeugkauf/-verkauf',
                'pt' => 'Compra/venda de veículo', 'ru' => 'Покупка/продажа транспорта', 'zh' => '车辆买卖', 'ar' => 'شراء/بيع مركبة', 'hi' => 'वाहन खरीद/बिक्री'],
            
            ['category_code' => 'VEH', 'code' => 'VEH_IMMATRICULATION', 'icon' => 'car', 'order' => 46,
                'fr' => 'Immatriculation de véhicule', 'en' => 'Vehicle registration', 'es' => 'Matriculación de vehículo', 'de' => 'Fahrzeugzulassung',
                'pt' => 'Registro de veículo', 'ru' => 'Регистрация транспорта', 'zh' => '车辆登记', 'ar' => 'تسجيل مركبة', 'hi' => 'वाहन पंजीकरण'],
            
            ['category_code' => 'VEH', 'code' => 'VEH_PERMIS_CONDUIRE', 'icon' => 'car', 'order' => 47,
                'fr' => 'Permis de conduire international', 'en' => 'International driving license', 'es' => 'Licencia de conducir internacional', 'de' => 'Internationaler Führerschein',
                'pt' => 'Carta de condução internacional', 'ru' => 'Международные права', 'zh' => '国际驾照', 'ar' => 'رخصة قيادة دولية', 'hi' => 'अंतर्राष्ट्रीय ड्राइविंग लाइसेंस'],
            
            ['category_code' => 'VEH', 'code' => 'VEH_ACCIDENT_ROUTE', 'icon' => 'car', 'order' => 48,
                'fr' => 'Accident de la route', 'en' => 'Road accident', 'es' => 'Accidente de tráfico', 'de' => 'Verkehrsunfall',
                'pt' => 'Acidente de trânsito', 'ru' => 'ДТП', 'zh' => '交通事故', 'ar' => 'حادث طريق', 'hi' => 'सड़क दुर्घटना'],
            
            ['category_code' => 'VEH', 'code' => 'VEH_LOCATION_VEHICULE', 'icon' => 'car', 'order' => 49,
                'fr' => 'Litiges location de véhicule', 'en' => 'Car rental disputes', 'es' => 'Disputas de alquiler de vehículos', 'de' => 'Mietwagenstreitigkeiten',
                'pt' => 'Disputas de aluguel de veículos', 'ru' => 'Споры по аренде авто', 'zh' => '租车纠纷', 'ar' => 'نزاعات تأجير المركبات', 'hi' => 'कार किराया विवाद'],

            // ═══════════════════════════════════════════════════════════════
            // 10. VOYAGES & TOURISME (VOY) - 5 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'VOY', 'code' => 'VOY_ANNULATION_RETARD_VOL', 'icon' => 'paper-airplane', 'order' => 50,
                'fr' => 'Annulation/retard de vol', 'en' => 'Flight cancellation/delay', 'es' => 'Cancelación/retraso de vuelo', 'de' => 'Flugstornierung/-verspätung',
                'pt' => 'Cancelamento/atraso de voo', 'ru' => 'Отмена/задержка рейса', 'zh' => '航班取消/延误', 'ar' => 'إلغاء/تأخير الرحلة', 'hi' => 'उड़ान रद्द/विलंब'],
            
            ['category_code' => 'VOY', 'code' => 'VOY_BAGAGES_PERDUS', 'icon' => 'paper-airplane', 'order' => 51,
                'fr' => 'Bagages perdus/endommagés', 'en' => 'Lost/damaged luggage', 'es' => 'Equipaje perdido/dañado', 'de' => 'Verlorenes/beschädigtes Gepäck',
                'pt' => 'Bagagem perdida/danificada', 'ru' => 'Потерянный/поврежденный багаж', 'zh' => '行李丢失/损坏', 'ar' => 'أمتعة مفقودة/تالفة', 'hi' => 'खोया/क्षतिग्रस्त सामान'],
            
            ['category_code' => 'VOY', 'code' => 'VOY_HOTELS_HEBERGEMENT', 'icon' => 'paper-airplane', 'order' => 52,
                'fr' => 'Litiges hôtels et hébergement', 'en' => 'Hotel and accommodation disputes', 'es' => 'Disputas de hoteles y alojamiento', 'de' => 'Hotel- und Unterkunftsstreitigkeiten',
                'pt' => 'Disputas de hotéis e acomodação', 'ru' => 'Споры с отелями', 'zh' => '酒店和住宿纠纷', 'ar' => 'نزاعات الفنادق والإقامة', 'hi' => 'होटल और आवास विवाद'],
            
            ['category_code' => 'VOY', 'code' => 'VOY_TOUR_OPERATEUR', 'icon' => 'paper-airplane', 'order' => 53,
                'fr' => 'Litiges tour opérateur', 'en' => 'Tour operator disputes', 'es' => 'Disputas con operadores turísticos', 'de' => 'Reiseveranstalter-Streitigkeiten',
                'pt' => 'Disputas com operadoras', 'ru' => 'Споры с туроператорами', 'zh' => '旅游运营商纠纷', 'ar' => 'نزاعات منظمي الرحلات', 'hi' => 'टूर ऑपरेटर विवाद'],
            
            ['category_code' => 'VOY', 'code' => 'VOY_ASSURANCE_VOYAGE', 'icon' => 'paper-airplane', 'order' => 54,
                'fr' => 'Assurance voyage', 'en' => 'Travel insurance', 'es' => 'Seguro de viaje', 'de' => 'Reiseversicherung',
                'pt' => 'Seguro de viagem', 'ru' => 'Страхование путешествий', 'zh' => '旅行保险', 'ar' => 'تأمين السفر', 'hi' => 'यात्रा बीमा'],

            // ═══════════════════════════════════════════════════════════════
            // 11. SANTÉ & ASSURANCES (SANT) - 4 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'SANT', 'code' => 'SANT_ASSURANCE_INTERNATIONALE', 'icon' => 'heart', 'order' => 55,
                'fr' => 'Assurance santé internationale', 'en' => 'International health insurance', 'es' => 'Seguro de salud internacional', 'de' => 'Internationale Krankenversicherung',
                'pt' => 'Seguro de saúde internacional', 'ru' => 'Международная мед. страховка', 'zh' => '国际健康保险', 'ar' => 'تأمين صحي دولي', 'hi' => 'अंतर्राष्ट्रीय स्वास्थ्य बीमा'],
            
            ['category_code' => 'SANT', 'code' => 'SANT_ERREUR_MEDICALE', 'icon' => 'heart', 'order' => 56,
                'fr' => 'Erreur médicale', 'en' => 'Medical malpractice', 'es' => 'Error médico', 'de' => 'Medizinischer Fehler',
                'pt' => 'Erro médico', 'ru' => 'Медицинская ошибка', 'zh' => '医疗事故', 'ar' => 'خطأ طبي', 'hi' => 'चिकित्सा त्रुटि'],
            
            ['category_code' => 'SANT', 'code' => 'SANT_REMBOURSEMENTS', 'icon' => 'heart', 'order' => 57,
                'fr' => 'Remboursements de soins', 'en' => 'Healthcare reimbursements', 'es' => 'Reembolsos de atención médica', 'de' => 'Erstattung von Gesundheitskosten',
                'pt' => 'Reembolsos de saúde', 'ru' => 'Возмещение медицинских расходов', 'zh' => '医疗报销', 'ar' => 'استرداد تكاليف الرعاية', 'hi' => 'स्वास्थ्य प्रतिपूर्ति'],
            
            ['category_code' => 'SANT', 'code' => 'SANT_RAPATRIEMENT_MEDICAL', 'icon' => 'heart', 'order' => 58,
                'fr' => 'Rapatriement médical', 'en' => 'Medical repatriation', 'es' => 'Repatriación médica', 'de' => 'Medizinische Rückführung',
                'pt' => 'Repatriação médica', 'ru' => 'Медицинская репатриация', 'zh' => '医疗遣返', 'ar' => 'إعادة طبية', 'hi' => 'चिकित्सा प्रत्यावर्तन'],

            // ═══════════════════════════════════════════════════════════════
            // 12. ÉDUCATION (EDU) - 3 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'EDU', 'code' => 'EDU_INSCRIPTION_SCOLAIRE', 'icon' => 'academic-cap', 'order' => 59,
                'fr' => 'Inscription scolaire', 'en' => 'School enrollment', 'es' => 'Inscripción escolar', 'de' => 'Schulanmeldung',
                'pt' => 'Inscrição escolar', 'ru' => 'Зачисление в школу', 'zh' => '学校入学', 'ar' => 'التسجيل المدرسي', 'hi' => 'स्कूल नामांकन'],
            
            ['category_code' => 'EDU', 'code' => 'EDU_UNIVERSITES_BOURSES', 'icon' => 'academic-cap', 'order' => 60,
                'fr' => 'Universités et bourses', 'en' => 'Universities and scholarships', 'es' => 'Universidades y becas', 'de' => 'Universitäten und Stipendien',
                'pt' => 'Universidades e bolsas', 'ru' => 'Университеты и стипендии', 'zh' => '大学和奖学金', 'ar' => 'الجامعات والمنح', 'hi' => 'विश्वविद्यालय और छात्रवृत्ति'],
            
            ['category_code' => 'EDU', 'code' => 'EDU_EQUIVALENCES_DIPLOMES', 'icon' => 'academic-cap', 'order' => 61,
                'fr' => 'Équivalences de diplômes', 'en' => 'Diploma equivalency', 'es' => 'Equivalencia de diplomas', 'de' => 'Anerkennung von Abschlüssen',
                'pt' => 'Equivalência de diplomas', 'ru' => 'Признание дипломов', 'zh' => '学历认证', 'ar' => 'معادلة الشهادات', 'hi' => 'डिप्लोमा समतुल्यता'],

            // ═══════════════════════════════════════════════════════════════
            // 13. SUCCESSION & PATRIMOINE (PATR) - 4 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'PATR', 'code' => 'PATR_SUCCESSION_INTERNATIONALE', 'icon' => 'banknotes', 'order' => 62,
                'fr' => 'Succession internationale', 'en' => 'International inheritance', 'es' => 'Sucesión internacional', 'de' => 'Internationale Erbschaft',
                'pt' => 'Sucessão internacional', 'ru' => 'Международное наследство', 'zh' => '国际继承', 'ar' => 'ميراث دولي', 'hi' => 'अंतर्राष्ट्रीय विरासत'],
            
            ['category_code' => 'PATR', 'code' => 'PATR_TESTAMENT_INTERNATIONAL', 'icon' => 'banknotes', 'order' => 63,
                'fr' => 'Testament international', 'en' => 'International will', 'es' => 'Testamento internacional', 'de' => 'Internationales Testament',
                'pt' => 'Testamento internacional', 'ru' => 'Международное завещание', 'zh' => '国际遗嘱', 'ar' => 'وصية دولية', 'hi' => 'अंतर्राष्ट्रीय वसीयत'],
            
            ['category_code' => 'PATR', 'code' => 'PATR_RAPATRIEMENT_DEFUNT', 'icon' => 'banknotes', 'order' => 64,
                'fr' => 'Rapatriement de corps/cendres', 'en' => 'Repatriation of remains', 'es' => 'Repatriación de restos', 'de' => 'Rückführung von Verstorbenen',
                'pt' => 'Repatriação de restos mortais', 'ru' => 'Репатриация тела', 'zh' => '遗体遣返', 'ar' => 'إعادة الرفات', 'hi' => 'अवशेष प्रत्यावर्तन'],
            
            ['category_code' => 'PATR', 'code' => 'PATR_HERITAGE_BLOQUE', 'icon' => 'banknotes', 'order' => 65,
                'fr' => 'Héritage bloqué', 'en' => 'Blocked inheritance', 'es' => 'Herencia bloqueada', 'de' => 'Blockierte Erbschaft',
                'pt' => 'Herança bloqueada', 'ru' => 'Заблокированное наследство', 'zh' => '冻结遗产', 'ar' => 'ميراث محظور', 'hi' => 'अवरुद्ध विरासत'],

            // ═══════════════════════════════════════════════════════════════
            // 14. CONSOMMATION (CONS) - 4 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'CONS', 'code' => 'CONS_ACHATS_DEFECTUEUX', 'icon' => 'shopping-cart', 'order' => 66,
                'fr' => 'Achats défectueux', 'en' => 'Defective purchases', 'es' => 'Compras defectuosas', 'de' => 'Fehlerhafte Käufe',
                'pt' => 'Compras defeituosas', 'ru' => 'Дефектные покупки', 'zh' => '有缺陷的购买', 'ar' => 'مشتريات معيبة', 'hi' => 'दोषपूर्ण खरीदारी'],
            
            ['category_code' => 'CONS', 'code' => 'CONS_ECOMMERCE', 'icon' => 'shopping-cart', 'order' => 67,
                'fr' => 'E-commerce international', 'en' => 'International e-commerce', 'es' => 'Comercio electrónico internacional', 'de' => 'Internationaler E-Commerce',
                'pt' => 'Comércio eletrônico internacional', 'ru' => 'Международная электронная коммерция', 'zh' => '国际电子商务', 'ar' => 'التجارة الإلكترونية الدولية', 'hi' => 'अंतर्राष्ट्रीय ई-कॉमर्स'],
            
            ['category_code' => 'CONS', 'code' => 'CONS_GARANTIES', 'icon' => 'shopping-cart', 'order' => 68,
                'fr' => 'Garanties et retours', 'en' => 'Warranties and returns', 'es' => 'Garantías y devoluciones', 'de' => 'Garantien und Rücksendungen',
                'pt' => 'Garantias e devoluções', 'ru' => 'Гарантии и возврат', 'zh' => '保修和退货', 'ar' => 'الضمانات والإرجاع', 'hi' => 'वारंटी और रिटर्न'],
            
            ['category_code' => 'CONS', 'code' => 'CONS_ARNAQUES', 'icon' => 'shopping-cart', 'order' => 69,
                'fr' => 'Arnaques et escroqueries', 'en' => 'Scams and fraud', 'es' => 'Estafas y fraudes', 'de' => 'Betrug',
                'pt' => 'Golpes e fraudes', 'ru' => 'Мошенничество', 'zh' => '诈骗', 'ar' => 'عمليات احتيال', 'hi' => 'घोटाले'],

            // ═══════════════════════════════════════════════════════════════
            // 15. DÉMÉNAGEMENT & STOCKAGE (DEM) - 3 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'DEM', 'code' => 'DEM_DEMENAGEMENT_INTERNATIONAL', 'icon' => 'truck', 'order' => 70,
                'fr' => 'Déménagement international', 'en' => 'International moving', 'es' => 'Mudanza internacional', 'de' => 'Internationaler Umzug',
                'pt' => 'Mudança internacional', 'ru' => 'Международный переезд', 'zh' => '国际搬家', 'ar' => 'انتقال دولي', 'hi' => 'अंतर्राष्ट्रीय स्थानांतरण'],
            
            ['category_code' => 'DEM', 'code' => 'DEM_BIENS_PERDUS_ENDOMMAGES', 'icon' => 'truck', 'order' => 71,
                'fr' => 'Biens perdus/endommagés', 'en' => 'Lost/damaged goods', 'es' => 'Bienes perdidos/dañados', 'de' => 'Verlorene/beschädigte Güter',
                'pt' => 'Bens perdidos/danificados', 'ru' => 'Потерянное/поврежденное имущество', 'zh' => '物品丢失/损坏', 'ar' => 'سلع مفقودة/تالفة', 'hi' => 'खोया/क्षतिग्रस्त सामान'],
            
            ['category_code' => 'DEM', 'code' => 'DEM_DOUANES', 'icon' => 'truck', 'order' => 72,
                'fr' => 'Problèmes douaniers', 'en' => 'Customs issues', 'es' => 'Problemas aduaneros', 'de' => 'Zollprobleme',
                'pt' => 'Problemas alfandegários', 'ru' => 'Таможенные проблемы', 'zh' => '海关问题', 'ar' => 'مشاكل جمركية', 'hi' => 'सीमा शुल्क समस्याएं'],

            // ═══════════════════════════════════════════════════════════════
            // 16. LITIGES & CONTENTIEUX (LIT) - 3 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'LIT', 'code' => 'LIT_MEDIATION_INTERNATIONALE', 'icon' => 'scale', 'order' => 73,
                'fr' => 'Médiation internationale', 'en' => 'International mediation', 'es' => 'Mediación internacional', 'de' => 'Internationale Mediation',
                'pt' => 'Mediação internacional', 'ru' => 'Международное посредничество', 'zh' => '国际调解', 'ar' => 'وساطة دولية', 'hi' => 'अंतर्राष्ट्रीय मध्यस्थता'],
            
            ['category_code' => 'LIT', 'code' => 'LIT_RECOUVREMENT_CREANCES', 'icon' => 'scale', 'order' => 74,
                'fr' => 'Recouvrement de créances', 'en' => 'Debt collection', 'es' => 'Cobro de deudas', 'de' => 'Forderungsbeitreibung',
                'pt' => 'Cobrança de dívidas', 'ru' => 'Взыскание долгов', 'zh' => '债务追收', 'ar' => 'تحصيل الديون', 'hi' => 'ऋण वसूली'],
            
            ['category_code' => 'LIT', 'code' => 'LIT_CONTRATS_INTERNATIONAUX', 'icon' => 'scale', 'order' => 75,
                'fr' => 'Litiges contractuels', 'en' => 'Contract disputes', 'es' => 'Disputas contractuales', 'de' => 'Vertragsstreitigkeiten',
                'pt' => 'Disputas contratuais', 'ru' => 'Договорные споры', 'zh' => '合同纠纷', 'ar' => 'نزاعات تعاقدية', 'hi' => 'अनुबंध विवाद'],

            // ═══════════════════════════════════════════════════════════════
            // 17. PROPRIÉTÉ INTELLECTUELLE (IP) - 3 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'IP', 'code' => 'IP_BREVETS_MARQUES', 'icon' => 'light-bulb', 'order' => 76,
                'fr' => 'Brevets et marques', 'en' => 'Patents and trademarks', 'es' => 'Patentes y marcas', 'de' => 'Patente und Marken',
                'pt' => 'Patentes e marcas', 'ru' => 'Патенты и товарные знаки', 'zh' => '专利和商标', 'ar' => 'براءات الاختراع والعلامات', 'hi' => 'पेटेंट और ट्रेडमार्क'],
            
            ['category_code' => 'IP', 'code' => 'IP_DROITS_AUTEUR', 'icon' => 'light-bulb', 'order' => 77,
                'fr' => 'Droits d\'auteur', 'en' => 'Copyright', 'es' => 'Derechos de autor', 'de' => 'Urheberrecht',
                'pt' => 'Direitos autorais', 'ru' => 'Авторские права', 'zh' => '版权', 'ar' => 'حقوق النشر', 'hi' => 'कॉपीराइट'],
            
            ['category_code' => 'IP', 'code' => 'IP_CONTREFACON', 'icon' => 'light-bulb', 'order' => 78,
                'fr' => 'Contrefaçon', 'en' => 'Counterfeiting', 'es' => 'Falsificación', 'de' => 'Fälschung',
                'pt' => 'Contrafação', 'ru' => 'Подделка', 'zh' => '假冒', 'ar' => 'تزييف', 'hi' => 'जालसाजी'],

            // ═══════════════════════════════════════════════════════════════
            // 18. VIOLENCES & PROTECTION (VIO) - 4 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'VIO', 'code' => 'VIO_VIOLENCES_DOMESTIQUES', 'icon' => 'shield-exclamation', 'order' => 79,
                'fr' => 'Violences domestiques', 'en' => 'Domestic violence', 'es' => 'Violencia doméstica', 'de' => 'Häusliche Gewalt',
                'pt' => 'Violência doméstica', 'ru' => 'Домашнее насилие', 'zh' => '家庭暴力', 'ar' => 'عنف منزلي', 'hi' => 'घरेलू हिंसा'],
            
            ['category_code' => 'VIO', 'code' => 'VIO_HARCELEMENT', 'icon' => 'shield-exclamation', 'order' => 80,
                'fr' => 'Harcèlement', 'en' => 'Harassment', 'es' => 'Acoso', 'de' => 'Belästigung',
                'pt' => 'Assédio', 'ru' => 'Преследование', 'zh' => '骚扰', 'ar' => 'مضايقة', 'hi' => 'उत्पीड़न'],
            
            ['category_code' => 'VIO', 'code' => 'VIO_DISCRIMINATION', 'icon' => 'shield-exclamation', 'order' => 81,
                'fr' => 'Discrimination', 'en' => 'Discrimination', 'es' => 'Discriminación', 'de' => 'Diskriminierung',
                'pt' => 'Discriminação', 'ru' => 'Дискриминация', 'zh' => '歧视', 'ar' => 'تمييز', 'hi' => 'भेदभाव'],
            
            ['category_code' => 'VIO', 'code' => 'VIO_ORDONNANCE_PROTECTION', 'icon' => 'shield-exclamation', 'order' => 82,
                'fr' => 'Ordonnance de protection', 'en' => 'Protection order', 'es' => 'Orden de protección', 'de' => 'Schutzanordnung',
                'pt' => 'Ordem de proteção', 'ru' => 'Охранный ордер', 'zh' => '保护令', 'ar' => 'أمر حماية', 'hi' => 'सुरक्षा आदेश'],

            // ═══════════════════════════════════════════════════════════════
            // 19. NUMÉRIQUE & CYBERSÉCURITÉ (NUM) - 4 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'NUM', 'code' => 'NUM_CYBERCRIMINALITE', 'icon' => 'computer-desktop', 'order' => 83,
                'fr' => 'Cybercriminalité', 'en' => 'Cybercrime', 'es' => 'Ciberdelincuencia', 'de' => 'Cyberkriminalität',
                'pt' => 'Cibercrime', 'ru' => 'Киберпреступность', 'zh' => '网络犯罪', 'ar' => 'جرائم إلكترونية', 'hi' => 'साइबर अपराध'],
            
            ['category_code' => 'NUM', 'code' => 'NUM_VOL_IDENTITE', 'icon' => 'computer-desktop', 'order' => 84,
                'fr' => 'Vol d\'identité', 'en' => 'Identity theft', 'es' => 'Robo de identidad', 'de' => 'Identitätsdiebstahl',
                'pt' => 'Roubo de identidade', 'ru' => 'Кража личных данных', 'zh' => '身份盗窃', 'ar' => 'سرقة الهوية', 'hi' => 'पहचान चोरी'],
            
            ['category_code' => 'NUM', 'code' => 'NUM_FRAUDE_EN_LIGNE', 'icon' => 'computer-desktop', 'order' => 85,
                'fr' => 'Fraude en ligne', 'en' => 'Online fraud', 'es' => 'Fraude en línea', 'de' => 'Online-Betrug',
                'pt' => 'Fraude online', 'ru' => 'Онлайн-мошенничество', 'zh' => '网络诈骗', 'ar' => 'احتيال عبر الإنترنت', 'hi' => 'ऑनलाइन धोखाधड़ी'],
            
            ['category_code' => 'NUM', 'code' => 'NUM_PROTECTION_DONNEES', 'icon' => 'computer-desktop', 'order' => 86,
                'fr' => 'Protection des données', 'en' => 'Data protection', 'es' => 'Protección de datos', 'de' => 'Datenschutz',
                'pt' => 'Proteção de dados', 'ru' => 'Защита данных', 'zh' => '数据保护', 'ar' => 'حماية البيانات', 'hi' => 'डेटा सुरक्षा'],

            // ═══════════════════════════════════════════════════════════════
            // 20. ENVIRONNEMENT & URBANISME (ENV) - 2 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'ENV', 'code' => 'ENV_NUISANCES', 'icon' => 'globe-europe-africa', 'order' => 87,
                'fr' => 'Nuisances', 'en' => 'Nuisances', 'es' => 'Molestias', 'de' => 'Belästigungen',
                'pt' => 'Incômodos', 'ru' => 'Неудобства', 'zh' => '滋扰', 'ar' => 'مضايقات', 'hi' => 'उपद्रव'],
            
            ['category_code' => 'ENV', 'code' => 'ENV_PERMIS_CONSTRUIRE', 'icon' => 'globe-europe-africa', 'order' => 88,
                'fr' => 'Permis de construire', 'en' => 'Building permits', 'es' => 'Permisos de construcción', 'de' => 'Baugenehmigungen',
                'pt' => 'Licenças de construção', 'ru' => 'Разрешения на строительство', 'zh' => '建筑许可', 'ar' => 'تصاريح البناء', 'hi' => 'निर्माण परमिट'],

            // ═══════════════════════════════════════════════════════════════
            // 21. RETOUR & RAPATRIEMENT (RET) - 2 spécialités
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'RET', 'code' => 'RET_RAPATRIEMENT_BIENS', 'icon' => 'arrow-uturn-left', 'order' => 89,
                'fr' => 'Rapatriement de biens', 'en' => 'Repatriation of goods', 'es' => 'Repatriación de bienes', 'de' => 'Rückführung von Gütern',
                'pt' => 'Repatriação de bens', 'ru' => 'Репатриация имущества', 'zh' => '财产遣返', 'ar' => 'إعادة الممتلكات', 'hi' => 'संपत्ति प्रत्यावर्तन'],
            
            ['category_code' => 'RET', 'code' => 'RET_REINTEGRATION_PAYS_ORIGINE', 'icon' => 'arrow-uturn-left', 'order' => 90,
                'fr' => 'Réintégration pays d\'origine', 'en' => 'Reintegration in home country', 'es' => 'Reintegración en país de origen', 'de' => 'Wiedereingliederung im Heimatland',
                'pt' => 'Reintegração no país de origem', 'ru' => 'Реинтеграция на родине', 'zh' => '原籍国重新融入', 'ar' => 'إعادة الإدماج في بلد المنشأ', 'hi' => 'मूल देश में पुन: एकीकरण'],

            // ═══════════════════════════════════════════════════════════════
            // 22. DIVERS (DIV) - 1 spécialité
            // ═══════════════════════════════════════════════════════════════
            ['category_code' => 'DIV', 'code' => 'DIV_AUTRE', 'icon' => 'question-mark-circle', 'order' => 91,
                'fr' => 'Autre besoin juridique', 'en' => 'Other legal need', 'es' => 'Otra necesidad legal', 'de' => 'Andere rechtliche Bedürfnisse',
                'pt' => 'Outra necessidade legal', 'ru' => 'Другая юридическая потребность', 'zh' => '其他法律需求', 'ar' => 'حاجة قانونية أخرى', 'hi' => 'अन्य कानूनी आवश्यकता'],
        ];

        echo "🌱 Insertion de " . count($specialties) . " spécialités juridiques internationales...\n";

        foreach ($specialties as $data) {
            // ÉTAPE 1: Créer l'enregistrement principal (FR et EN uniquement)
            $specialty = LawyerSpecialty::create([
                'category_code' => $data['category_code'],
                'code' => $data['code'],
                'slug' => strtolower(str_replace('_', '-', $data['code'])),
                'name_fr' => $data['fr'],
                'name_en' => $data['en'],
                'icon' => $data['icon'],
                'order' => $data['order'],
                'is_active' => true,
            ]);

            // ÉTAPE 2: Créer les traductions (7 autres langues)
            $otherLanguages = ['de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
            
            foreach ($otherLanguages as $lang) {
                if (isset($data[$lang])) {
                    LawyerSpecialtyTranslation::create([
                        'lawyer_specialty_id' => $specialty->id,
                        'language_code' => $lang,
                        'name' => $data[$lang],
                    ]);
                }
            }
        }

        echo "✅ " . count($specialties) . " spécialités insérées\n";
        echo "✅ " . (count($specialties) * 7) . " traductions insérées\n";
        echo "🌍 Couverture: Expatriés, voyageurs, vacanciers dans 197 pays\n";
    }
}