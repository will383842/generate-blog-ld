<?php

namespace Database\Seeders;

use App\Models\UlixaiService;
use Illuminate\Database\Seeder;

class UlixaiServiceSeeder extends Seeder
{
    /**
     * Seeder COMPLET pour les services Ulixai
     * 
     * Structure hiérarchique sur 3 niveaux
     * Basé sur les données récupérées de la base Ulixai existante
     * 
     * 11 catégories de niveau 1
     * ~50 sous-catégories de niveau 2
     * ~150 services de niveau 3
     */
    public function run(): void
    {
        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : ADMINISTRATIVE, IMMIGRATION & VISAS (ID: 504)
        // ═══════════════════════════════════════════════════════════════════════
        $admin = UlixaiService::create([
            'code' => 'ADMINISTRATIVE_IMMIGRATION_VISAS',
            'slug' => 'administrative-immigration-visas',
            'name_en' => 'Administrative, Immigration & Visas',
            'name_fr' => 'Administratif, Immigration & Visas',
            'name_es' => 'Administrativo, Inmigración y Visas',
            'name_de' => 'Verwaltung, Einwanderung & Visa',
            'name_pt' => 'Administrativo, Imigração e Vistos',
            'name_ru' => 'Административный, Иммиграция и Визы',
            'name_zh' => '行政、移民和签证',
            'name_ar' => 'الإدارة والهجرة والتأشيرات',
            'name_hi' => 'प्रशासनिक, आप्रवासन और वीज़ा',
            'parent_id' => null,
            'level' => 1,
            'icon' => 'document-text',
            'order' => 1,
            'is_active' => true,
        ]);

        // Niveau 2 : Visas & Residence Permits
        $visas = $this->createLevel2($admin->id, 'VISAS_RESIDENCE_PERMITS', 'visas-residence-permits', 
            'Visas & Residence Permits', 'Visas et Permis de Séjour', 'identification', 1);
        $this->createLevel3Services($visas->id, [
            ['HELP_WITH_VISA', 'help-with-my-visa', 'Help with my visa (application – renewal – status change)', 'Aide pour mon visa (demande – renouvellement – changement de statut)'],
            ['HANDLE_VISA_A_TO_Z', 'handle-my-visa-application-from-a-to-z', 'Handle my visa application from A to Z', 'Gérer ma demande de visa de A à Z'],
        ]);

        // Niveau 2 : Lost or Stolen Papers
        $lost = $this->createLevel2($admin->id, 'LOST_STOLEN_PAPERS', 'lost-or-stolen-papers',
            'Lost or Stolen Papers', 'Documents Perdus ou Volés', 'exclamation-triangle', 2);
        $this->createLevel3Services($lost->id, [
            ['REPORT_LOSS_THEFT', 'help-with-reporting-loss-theft', 'Help with reporting the loss/theft of passport/visa', 'Aide pour déclarer la perte/vol de passeport/visa'],
            ['REISSUANCE_DOCUMENTS', 'handle-reissuance-documents', 'Handle the reissuance of lost/stolen documents from A to Z', 'Gérer la réémission des documents perdus/volés de A à Z'],
        ]);

        // Niveau 2 : Legal Advice, Notaries, and Lawyers
        $legal = $this->createLevel2($admin->id, 'LEGAL_ADVICE_NOTARIES', 'legal-advice-notaries-lawyers',
            'Legal Advice, Notaries, and Lawyers', 'Conseils Juridiques, Notaires et Avocats', 'scale', 3);
        $this->createLevel3Services($legal->id, [
            ['ASSIST_NOTARY_LAWYER', 'assist-me-at-notary-lawyer', 'Assist me at a notary or a lawyer', 'M\'assister chez un notaire ou un avocat'],
            ['REVIEW_CONTRACT', 'review-secure-contract', 'Review and secure a contract (housing/work/others)', 'Relire et sécuriser un contrat (logement/travail/autres)'],
            ['EXPLAIN_LEGAL_RIGHTS', 'explain-legal-rights', 'Explain my legal rights and obligations', 'Expliquer mes droits et obligations légales'],
        ]);

        // Niveau 2 : Civil Status and Official Documents
        $civil = $this->createLevel2($admin->id, 'CIVIL_STATUS_DOCUMENTS', 'civil-status-official-documents',
            'Civil Status and Official Documents', 'État Civil et Documents Officiels', 'document-text', 4);
        $this->createLevel3Services($civil->id, [
            ['OBTAIN_CERTIFICATES', 'obtain-certificates', 'Obtain certificates (birth/marriage/divorce/others)', 'Obtenir des certificats (naissance/mariage/divorce/autres)'],
        ]);

        // Niveau 2 : Identifiers and Registrations
        $identifiers = $this->createLevel2($admin->id, 'IDENTIFIERS_REGISTRATIONS', 'identifiers-registrations',
            'Identifiers and Registrations with Authorities', 'Identifiants et Inscriptions aux Autorités', 'identification', 5);
        $this->createLevel3Services($identifiers->id, [
            ['OBTAIN_TAX_NUMBER', 'obtain-tax-number', 'Obtain a tax number / local identifiers', 'Obtenir un numéro fiscal / identifiants locaux'],
            ['REGISTER_AUTHORITIES', 'register-presence-authorities', 'Register my presence with the public authorities', 'Enregistrer ma présence auprès des autorités'],
            ['UPDATE_CONSULAR', 'update-consular-registration', 'Update my consular registration', 'Mettre à jour mon inscription consulaire'],
        ]);

        // Niveau 2 : Embassy & Consulate
        $embassy = $this->createLevel2($admin->id, 'EMBASSY_CONSULATE', 'embassy-consulate',
            'Embassy & Consulate', 'Ambassade et Consulat', 'building-library', 6);
        $this->createLevel3Services($embassy->id, [
            ['HELP_EXPATRIATION', 'help-expatriation-request', 'Help me with my expatriation request', 'M\'aider avec ma demande d\'expatriation'],
            ['ACCOMPANY_EMBASSY', 'accompany-embassy-consulate', 'Accompany and assist me at the embassy or consulate', 'M\'accompagner et m\'assister à l\'ambassade ou au consulat'],
            ['PREPARE_CONSULAR_FILE', 'prepare-consular-file', 'Prepare my consular file (certificate, laissez-passer)', 'Préparer mon dossier consulaire (certificat, laissez-passer)'],
        ]);

        // Niveau 2 : Incidents and Disputes
        $incidents = $this->createLevel2($admin->id, 'INCIDENTS_DISPUTES', 'incidents-disputes',
            'Incidents and Disputes', 'Incidents et Litiges', 'exclamation-circle', 7);
        $this->createLevel3Services($incidents->id, [
            ['REPORT_SCAM', 'report-scam-appeal', 'Report a scam, file an administrative appeal', 'Signaler une arnaque, déposer un recours administratif'],
            ['DISPUTE_HOUSING', 'dispute-housing', 'Dispute with my housing', 'Litige avec mon logement'],
            ['DISPUTE_TRAFFIC', 'dispute-traffic-ticket', 'Dispute a traffic ticket (vehicles)', 'Contester une contravention (véhicules)'],
            ['DISPUTE_FINE', 'dispute-fine-offense', 'Dispute/handle a fine or an offense', 'Contester/gérer une amende ou une infraction'],
            ['FILE_COMPLAINT', 'file-complaint-hearing', 'File a complaint, attend a hearing', 'Déposer une plainte, assister à une audience'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : HOUSING & SETTLEMENT (ID: 771)
        // ═══════════════════════════════════════════════════════════════════════
        $housing = UlixaiService::create([
            'code' => 'HOUSING_SETTLEMENT',
            'slug' => 'housing-settlement',
            'name_en' => 'Housing & Settlement',
            'name_fr' => 'Logement et Installation',
            'name_es' => 'Vivienda e Instalación',
            'name_de' => 'Wohnung und Einrichtung',
            'name_pt' => 'Habitação e Instalação',
            'name_ru' => 'Жилье и Обустройство',
            'name_zh' => '住房和安置',
            'name_ar' => 'السكن والاستقرار',
            'name_hi' => 'आवास और निपटान',
            'parent_id' => null,
            'level' => 1,
            'icon' => 'home',
            'order' => 2,
            'is_active' => true,
        ]);

        $rental = $this->createLevel2($housing->id, 'HOUSING_RENTAL', 'housing-rental', 'Housing rental', 'Location de Logement', 'home', 1);
        $this->createLevel3Services($rental->id, [
            ['SEARCH_RENTAL', 'search-visiting-rental', 'Assist with searching and visiting rental housing', 'Aider à rechercher et visiter des logements à louer'],
            ['PREPARE_RENTAL_FILE', 'prepare-rental-file', 'Prepare a rental application file', 'Préparer un dossier de location'],
            ['NEGOTIATE_LEASE', 'negotiate-signing-lease', 'Negotiate and assist with signing a lease', 'Négocier et aider à signer un bail'],
            ['MOVE_IN_OUT', 'move-in-out-inspection', 'Assist with conducting a move-in or move-out inspection', 'Aider à réaliser un état des lieux'],
            ['TERMINATE_LEASE', 'terminate-housing-lease', 'Terminate my housing lease', 'Résilier mon bail de logement'],
        ]);

        $purchase = $this->createLevel2($housing->id, 'REAL_ESTATE_PURCHASE', 'real-estate-purchase-sale', 'Real Estate Purchase / Sale', 'Achat / Vente Immobilier', 'building-office', 2);
        $this->createLevel3Services($purchase->id, [
            ['SEARCH_BUY', 'search-visiting-buy', 'Assist with searching and visiting housing to buy', 'Aider à rechercher et visiter des logements à acheter'],
            ['MORTGAGE_APPLICATION', 'mortgage-application', 'Feasibility, prepare and track my mortgage application', 'Faisabilité, préparer et suivre ma demande de prêt immobilier'],
            ['PROPERTY_MANAGEMENT', 'property-management', 'Assist with placing my property under management', 'Aider à mettre mon bien en gestion'],
        ]);

        $utilities = $this->createLevel2($housing->id, 'PHONE_INTERNET_ENERGY', 'phone-internet-energy', 'Phone, Internet & Energy', 'Téléphone, Internet et Énergie', 'device-phone-mobile', 3);
        $this->createLevel3Services($utilities->id, [
            ['SUBSCRIBE_PHONE', 'subscribe-phone-internet', 'Subscribe to a phone, internet, or TV plan', 'Souscrire un forfait téléphone, internet ou TV'],
            ['SUBSCRIBE_ENERGY', 'subscribe-water-gas-electricity', 'Help with water, gas, and electricity subscription', 'Aide pour l\'abonnement eau, gaz et électricité'],
            ['CANCEL_SUBSCRIPTIONS', 'cancellation-subscriptions', 'Cancellation of various subscriptions', 'Résiliation de divers abonnements'],
        ]);

        $repairs = $this->createLevel2($housing->id, 'REPAIRS_RENOVATIONS', 'repairs-renovations', 'Repairs and Renovations', 'Réparations et Rénovations', 'wrench', 4);
        $this->createLevel3Services($repairs->id, [
            ['EMERGENCY_REPAIRS', 'emergency-repairs', 'Emergency repairs (electricity, plumbing, locksmith, others)', 'Réparations d\'urgence (électricité, plomberie, serrurier, autres)'],
            ['SMALL_JOBS', 'small-jobs', 'Carry out small jobs (painting, assembly, others)', 'Réaliser des petits travaux (peinture, montage, autres)'],
            ['FULL_RENOVATION', 'full-renovation', 'Full renovation', 'Rénovation complète'],
            ['INSTALL_EQUIPMENT', 'install-equipment', 'Install and secure equipment (furniture, TV, curtains)', 'Installer et fixer des équipements'],
        ]);

        $gardening = $this->createLevel2($housing->id, 'GARDENING_OUTDOOR', 'gardening-outdoor', 'Gardening & Outdoor', 'Jardinage et Extérieur', 'sun', 5);
        $this->createLevel3Services($gardening->id, [
            ['OUTDOOR_MAINTENANCE', 'outdoor-maintenance', 'Outdoor maintenance (mowing, weeding, pool care, others)', 'Entretien extérieur (tonte, désherbage, piscine, autres)'],
            ['TRIM_HEDGES', 'trim-hedges-shrubs', 'Trim and prune hedges and shrubs', 'Tailler et élaguer haies et arbustes'],
        ]);

        $mail = $this->createLevel2($housing->id, 'MAIL_PARCELS', 'mail-parcels', 'Mail & Parcels', 'Courrier et Colis', 'envelope', 6);
        $this->createLevel3Services($mail->id, [
            ['RECEIVE_PARCELS', 'receive-store-parcels', 'Receive and store my parcels', 'Recevoir et stocker mes colis'],
            ['INTERNATIONAL_FORWARDING', 'international-forwarding', 'Arrange international forwarding', 'Organiser le réacheminement international'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : PRACTICAL LIFE (ID: 723)
        // ═══════════════════════════════════════════════════════════════════════
        $practical = UlixaiService::create([
            'code' => 'PRACTICAL_LIFE', 'slug' => 'practical-life',
            'name_en' => 'Practical Life', 'name_fr' => 'Vie Pratique',
            'name_es' => 'Vida Práctica', 'name_de' => 'Praktisches Leben',
            'name_pt' => 'Vida Prática', 'name_ru' => 'Практическая Жизнь',
            'name_zh' => '日常生活', 'name_ar' => 'الحياة العملية', 'name_hi' => 'व्यावहारिक जीवन',
            'parent_id' => null, 'level' => 1, 'icon' => 'clipboard-document-list', 'order' => 3, 'is_active' => true,
        ]);

        $homeAssist = $this->createLevel2($practical->id, 'HOME_ASSISTANCE', 'home-assistance-service', 'Home assistance service', 'Service d\'aide à domicile', 'user', 1);
        $this->createLevel3Services($homeAssist->id, [
            ['ADMIN_TASKS', 'assist-administrative-tasks', 'Assist with administrative tasks', 'Aider aux tâches administratives'],
            ['GROCERIES_DELIVERED', 'groceries-delivered', 'Have groceries delivered', 'Faire livrer les courses'],
            ['PREPARE_MEALS', 'prepare-meals', 'Prepare meals', 'Préparer les repas'],
            ['SENIORS_ASSISTANCE', 'seniors-disabilities-mobility', 'Assistance for seniors / disabilities / mobility', 'Assistance pour seniors / handicap / mobilité'],
        ]);

        $cleaning = $this->createLevel2($practical->id, 'HOUSEKEEPING_CLEANING', 'housekeeping-cleaning-ironing', 'Housekeeping, cleaning & ironing', 'Ménage, nettoyage et repassage', 'sparkles', 2);
        $this->createLevel3Services($cleaning->id, [
            ['INDOOR_HOUSEKEEPING', 'indoor-housekeeping', 'Indoor housekeeping', 'Ménage intérieur'],
            ['CLOTHES_IRONING', 'clothes-ironing', 'Clothes ironing', 'Repassage'],
            ['WINDOW_CLEANING', 'window-cleaning', 'Window cleaning', 'Nettoyage des vitres'],
            ['VEHICLE_CLEANING', 'vehicle-cleaning', 'Interior / exterior vehicle cleaning', 'Nettoyage intérieur / extérieur de véhicule'],
        ]);

        $it = $this->createLevel2($practical->id, 'IT_SERVICES', 'it-services', 'IT Services', 'Services Informatiques', 'computer-desktop', 3);
        $this->createLevel3Services($it->id, [
            ['TROUBLESHOOT_COMPUTER', 'troubleshoot-computer-phone', 'Troubleshoot / maintain computer or phone', 'Dépanner / maintenir ordinateur ou téléphone'],
            ['INSTALL_SOFTWARE', 'install-software', 'Install applications or software', 'Installer des applications ou logiciels'],
            ['SECURE_DEVICES', 'secure-devices', 'Secure computer and phone (antivirus, backup)', 'Sécuriser ordinateur et téléphone'],
            ['COMPUTER_LESSONS', 'computer-lessons', 'General computer lessons', 'Cours d\'informatique généraux'],
        ]);

        $animals = $this->createLevel2($practical->id, 'ANIMALS', 'animals', 'Animals', 'Animaux', 'paw', 4);
        $this->createLevel3Services($animals->id, [
            ['PET_SITTING', 'pet-sitting', 'Pet sitting', 'Garde d\'animaux'],
            ['VET_TRANSPORT', 'vet-transport', 'Transport my pet to the veterinarian', 'Transporter mon animal chez le vétérinaire'],
            ['PET_PASSPORTS', 'pet-passports-vaccinations', 'Assist with pet passports and vaccinations', 'Aider avec les passeports et vaccinations d\'animaux'],
        ]);

        $concierge = $this->createLevel2($practical->id, 'CONCIERGE_SERVICES', 'concierge-services', 'Concierge Services', 'Services de Conciergerie', 'key', 5);
        $this->createLevel3Services($concierge->id, [
            ['CHECK_IN_OUT', 'check-in-check-out', 'Manage check-in / check-out for short-term rentals', 'Gérer l\'arrivée / départ pour locations courte durée'],
            ['KEY_HANDOVER', 'key-handover', 'Key handover for short-term rentals', 'Remise des clés pour locations courte durée'],
            ['INVENTORY_INSPECTION', 'inventory-inspection', 'Inventory inspection for short-term rentals', 'État des lieux pour locations courte durée'],
        ]);

        $booking = $this->createLevel2($practical->id, 'BOOKING_FLIGHTS_HOTELS', 'booking-flights-hotels', 'Booking flights, hotels...', 'Réservation vols, hôtels...', 'paper-airplane', 6);
        $this->createLevel3Services($booking->id, [
            ['BOOK_PLANE', 'book-plane-ticket', 'Book a plane ticket', 'Réserver un billet d\'avion'],
            ['BOOK_TRAIN', 'book-train-ticket', 'Book a train ticket', 'Réserver un billet de train'],
            ['BOOK_TAXI', 'book-taxi', 'Book a taxi', 'Réserver un taxi'],
            ['BOOK_HOTEL', 'book-hotel', 'Book a hotel', 'Réserver un hôtel'],
            ['OTHER_RESERVATIONS', 'other-reservations', 'Other reservations', 'Autres réservations'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : TRANSLATORS & INTERPRETERS (ID: 755)
        // ═══════════════════════════════════════════════════════════════════════
        $translators = UlixaiService::create([
            'code' => 'TRANSLATORS_INTERPRETERS', 'slug' => 'translators-interpreters',
            'name_en' => 'Translators & Interpreters', 'name_fr' => 'Traducteurs et Interprètes',
            'name_es' => 'Traductores e Intérpretes', 'name_de' => 'Übersetzer und Dolmetscher',
            'name_pt' => 'Tradutores e Intérpretes', 'name_ru' => 'Переводчики',
            'name_zh' => '翻译和口译', 'name_ar' => 'المترجمون', 'name_hi' => 'अनुवादक और दुभाषिए',
            'parent_id' => null, 'level' => 1, 'icon' => 'language', 'order' => 4, 'is_active' => true,
        ]);

        $docTranslation = $this->createLevel2($translators->id, 'DOCUMENT_TRANSLATION', 'document-translation', 'Document translation', 'Traduction de Documents', 'document-text', 1);
        $this->createLevel3Services($docTranslation->id, [
            ['PERSONAL_DOCS', 'translate-personal-documents', 'Translate personal documents', 'Traduire des documents personnels'],
            ['ADMIN_FORM', 'translate-admin-form', 'Translate and assist with completing an administrative form', 'Traduire et aider à remplir un formulaire administratif'],
            ['PROFESSIONAL_DOCS', 'translate-professional-documents', 'Translate professional documents', 'Traduire des documents professionnels'],
        ]);

        $certified = $this->createLevel2($translators->id, 'CERTIFIED_TRANSLATIONS', 'certified-legalized-translations', 'Certified and legalized translations', 'Traductions Certifiées et Légalisées', 'shield-check', 2);
        $this->createLevel3Services($certified->id, [
            ['SWORN_TRANSLATION', 'sworn-certified-translation', 'Obtain a sworn / certified translation', 'Obtenir une traduction assermentée / certifiée'],
            ['APOSTILLE_TRANSLATION', 'apostille-legalized-translation', 'Have a translation apostilled / legalized', 'Faire apostiller / légaliser une traduction'],
            ['CHECK_TRANSLATION', 'check-translation-required', 'Check if a translation is required', 'Vérifier si une traduction est nécessaire'],
        ]);

        $interpreting = $this->createLevel2($translators->id, 'INTERPRETING', 'interpreting', 'Interpreting', 'Interprétation', 'chat-bubble-left-right', 3);
        $this->createLevel3Services($interpreting->id, [
            ['INTERPRETER_PERSON', 'interpreter-in-person', 'I need an interpreter in person', 'J\'ai besoin d\'un interprète en personne'],
            ['INTERPRETER_PHONE', 'interpreter-phone-video', 'I need an interpreter by phone / video call', 'J\'ai besoin d\'un interprète par téléphone / vidéo'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : BANKS, TAXATION & INSURANCE (ID: 535)
        // ═══════════════════════════════════════════════════════════════════════
        $banks = UlixaiService::create([
            'code' => 'BANKS_TAXATION_INSURANCE', 'slug' => 'banks-taxation-insurance',
            'name_en' => 'Banks, Taxation & Insurance', 'name_fr' => 'Banques, Fiscalité et Assurances',
            'name_es' => 'Bancos, Fiscalidad y Seguros', 'name_de' => 'Banken, Steuern und Versicherungen',
            'name_pt' => 'Bancos, Fiscalidade e Seguros', 'name_ru' => 'Банки, Налоги и Страхование',
            'name_zh' => '银行、税务和保险', 'name_ar' => 'البنوك والضرائب والتأمين', 'name_hi' => 'बैंक, कराधान और बीमा',
            'parent_id' => null, 'level' => 1, 'icon' => 'building-library', 'order' => 5, 'is_active' => true,
        ]);

        $insurance = $this->createLevel2($banks->id, 'INSURANCE', 'insurance', 'Insurance', 'Assurances', 'shield-check', 1);
        $this->createLevel3Services($insurance->id, [
            ['SUBSCRIBE_INSURANCE', 'subscribe-insurance', 'Help with subscribing to and choosing insurance', 'Aide pour souscrire et choisir une assurance'],
            ['INSURE_MOVE', 'insure-belongings-move', 'Insure my belongings during a move', 'Assurer mes biens pendant un déménagement'],
            ['INSURE_VEHICLE', 'insure-vehicle', 'Insure a vehicle', 'Assurer un véhicule'],
            ['SCHOOL_INSURANCE', 'school-insurance', 'School insurance', 'Assurance scolaire'],
            ['CLAIMS_FOLLOWUP', 'claims-declaration-followup', 'Help with claims, declaration & follow-up', 'Aide avec les sinistres, déclaration et suivi'],
            ['OPTIMIZE_INSURANCE', 'optimization-insurance', 'Optimization of insurance contracts', 'Optimisation des contrats d\'assurance'],
        ]);

        $banking = $this->createLevel2($banks->id, 'BANKING_SERVICES', 'banking-services', 'Banking Services', 'Services Bancaires', 'banknotes', 2);
        $this->createLevel3Services($banking->id, [
            ['OPEN_ACCOUNT', 'open-bank-account', 'Open a bank account', 'Ouvrir un compte bancaire'],
            ['MODIFY_ACCOUNT', 'bank-account-modifications', 'Bank account modifications', 'Modifications de compte bancaire'],
            ['CLOSE_ACCOUNT', 'close-transfer-account', 'Close/transfer my bank account', 'Fermer/transférer mon compte bancaire'],
            ['RESOLVE_BANK_ISSUES', 'resolve-bank-issues', 'Resolve issues with my bank', 'Résoudre des problèmes avec ma banque'],
            ['BLOCKED_ACCOUNT', 'resolve-blocked-account', 'Resolve blocked/closed bank account issues', 'Résoudre problèmes de compte bloqué/fermé'],
        ]);

        $taxation = $this->createLevel2($banks->id, 'EXPATRIATE_TAXATION', 'expatriate-taxation', 'Expatriate Taxation', 'Fiscalité Expatriés', 'calculator', 3);
        $this->createLevel3Services($taxation->id, [
            ['TAX_RETURN', 'income-tax-return', 'Income tax return (resident/non-resident)', 'Déclaration de revenus (résident/non-résident)'],
            ['TAX_RESIDENCE', 'establish-tax-residence', 'Help to establish my primary residence', 'Aide pour établir ma résidence principale'],
            ['DOUBLE_TAXATION', 'manage-double-taxation', 'Manage double taxation', 'Gérer la double imposition'],
            ['OPTIMIZE_TAXES', 'optimize-taxes', 'Optimize my taxes', 'Optimiser mes impôts'],
        ]);

        $transfers = $this->createLevel2($banks->id, 'MONEY_TRANSFERS', 'money-transfers-currency', 'Money Transfers & Currency Exchange', 'Virements et Change de Devises', 'currency-dollar', 4);
        $this->createLevel3Services($transfers->id, [
            ['INTERNATIONAL_TRANSFERS', 'international-transfers', 'Help with making international transfers', 'Aide pour effectuer des virements internationaux'],
            ['EXCHANGE_RATES', 'compare-exchange-rates', 'Compare and negotiate exchange rates', 'Comparer et négocier les taux de change'],
            ['RECURRING_TRANSFERS', 'recurring-transfers', 'Set up recurring transfers and limits', 'Configurer des virements récurrents et des limites'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : DRIVER'S LICENSE, MOBILITY & TRANSPORT (ID: 632)
        // ═══════════════════════════════════════════════════════════════════════
        $mobility = UlixaiService::create([
            'code' => 'DRIVERS_LICENSE_MOBILITY', 'slug' => 'drivers-license-mobility-transport',
            'name_en' => "Driver's License, Mobility & Transport", 'name_fr' => 'Permis de Conduire, Mobilité et Transport',
            'name_es' => 'Licencia de Conducir, Movilidad y Transporte', 'name_de' => 'Führerschein, Mobilität und Transport',
            'name_pt' => 'Carta de Condução, Mobilidade e Transporte', 'name_ru' => 'Водительские Права, Мобильность и Транспорт',
            'name_zh' => '驾照、出行和交通', 'name_ar' => 'رخصة القيادة والتنقل والنقل', 'name_hi' => 'ड्राइविंग लाइसेंस, गतिशीलता और परिवहन',
            'parent_id' => null, 'level' => 1, 'icon' => 'truck', 'order' => 6, 'is_active' => true,
        ]);

        $license = $this->createLevel2($mobility->id, 'DRIVERS_LICENSE', 'drivers-license', "Driver's license", 'Permis de Conduire', 'identification', 1);
        $this->createLevel3Services($license->id, [
            ['LOCAL_LICENSE', 'local-drivers-license', "Help with my local driver's license", 'Aide pour mon permis local'],
            ['LICENSE_A_TO_Z', 'drivers-license-a-to-z', "Handle my driver's license application from A to Z", 'Gérer ma demande de permis de A à Z'],
            ['INTERNATIONAL_LICENSE', 'international-drivers-license', "Handle my international driver's license application", 'Gérer ma demande de permis international'],
        ]);

        $violations = $this->createLevel2($mobility->id, 'VIOLATIONS_ACCIDENTS', 'violations-accidents', 'Violations and Accidents', 'Infractions et Accidents', 'exclamation-triangle', 2);
        $this->createLevel3Services($violations->id, [
            ['DISPUTE_TICKET', 'contest-traffic-ticket', 'Dispute a traffic ticket', 'Contester une contravention'],
            ['ACCIDENT_REPORT', 'accident-report-claim', 'Prepare an accident report and an insurance claim', 'Préparer un constat et une déclaration de sinistre'],
            ['VEHICLE_IMPOUND', 'vehicle-impound', 'Handle a vehicle impound or immobilization', 'Gérer une mise en fourrière ou immobilisation'],
        ]);

        $transport = $this->createLevel2($mobility->id, 'TRANSPORT_SOLUTIONS', 'transport-solutions', 'Transport Solutions', 'Solutions de Transport', 'map-pin', 3);
        $this->createLevel3Services($transport->id, [
            ['TRANSPORT_PASSES', 'transport-passes-cards', 'Help with getting transport passes and cards', 'Aide pour obtenir des abonnements transport'],
            ['SCHOOL_PICKUP', 'school-pickup', 'Pick up child from school', 'Récupérer l\'enfant à l\'école'],
            ['FIND_DRIVER', 'find-driver-transfer', 'Find a driver / airport transfer', 'Trouver un chauffeur / transfert aéroport'],
            ['RENT_VEHICLE', 'rent-car-scooter', 'Rent a car / scooter', 'Louer une voiture / scooter'],
            ['EMERGENCY_TRANSPORT', 'emergency-transport', 'Arrange 24/7 emergency transport', 'Organiser un transport d\'urgence 24/7'],
        ]);

        $buyVehicle = $this->createLevel2($mobility->id, 'BUY_VEHICLE', 'buy-vehicle', 'Buy a vehicle (car / motorcycle)', 'Acheter un véhicule', 'car', 4);
        $this->createLevel3Services($buyVehicle->id, [
            ['BUY_INSPECT_VEHICLE', 'buy-inspect-negotiate-vehicle', 'Help with buying, inspecting, and negotiating a vehicle', 'Aide pour acheter, inspecter et négocier un véhicule'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : FAMILY, EDUCATION & LANGUAGES (ID: 668)
        // ═══════════════════════════════════════════════════════════════════════
        $family = UlixaiService::create([
            'code' => 'FAMILY_EDUCATION_LANGUAGES', 'slug' => 'family-education-languages',
            'name_en' => 'Family, Education & Languages', 'name_fr' => 'Famille, Éducation et Langues',
            'name_es' => 'Familia, Educación e Idiomas', 'name_de' => 'Familie, Bildung und Sprachen',
            'name_pt' => 'Família, Educação e Idiomas', 'name_ru' => 'Семья, Образование и Языки',
            'name_zh' => '家庭、教育和语言', 'name_ar' => 'الأسرة والتعليم واللغات', 'name_hi' => 'परिवार, शिक्षा और भाषाएं',
            'parent_id' => null, 'level' => 1, 'icon' => 'academic-cap', 'order' => 7, 'is_active' => true,
        ]);

        $languages = $this->createLevel2($family->id, 'LANGUAGES', 'languages-adults-students', 'Languages (adults, students, children)', 'Langues (adultes, étudiants, enfants)', 'language', 1);
        $this->createLevel3Services($languages->id, [
            ['LANGUAGE_COURSES', 'language-courses', 'Take language courses (at home/online)', 'Suivre des cours de langue'],
            ['LANGUAGE_CERTIFICATION', 'language-certification', 'Prepare for a language certification', 'Préparer une certification de langue'],
            ['COMPANY_TRAINING', 'company-training', 'Organize training courses for company teams', 'Organiser des formations pour équipes d\'entreprise'],
        ]);

        $schooling = $this->createLevel2($family->id, 'SCHOOLING', 'schooling-children-students', 'Schooling for Children / Students', 'Scolarité pour Enfants / Étudiants', 'academic-cap', 2);
        $this->createLevel3Services($schooling->id, [
            ['ENROLL_SCHOOL_CHILD', 'enroll-school-child', 'Choose & enroll in a school – child', 'Choisir et inscrire dans une école – enfant'],
            ['ENROLL_SCHOOL_STUDENT', 'enroll-school-student', 'Choose & enroll in a school – student', 'Choisir et inscrire dans une école – étudiant'],
            ['FULL_SUPPORT_CHILD', 'full-support-enrollment-child', 'Full support for school enrollment – child', 'Accompagnement complet inscription – enfant'],
            ['FULL_SUPPORT_STUDENT', 'full-support-enrollment-student', 'Full support for school enrollment – student', 'Accompagnement complet inscription – étudiant'],
            ['SCHOOL_TRANSPORT', 'school-transportation-cafeteria', 'Arrange school transportation – cafeteria', 'Organiser le transport scolaire – cantine'],
        ]);

        $lessons = $this->createLevel2($family->id, 'PRIVATE_LESSONS', 'private-lessons', 'Private lessons (all subjects)', 'Cours Particuliers', 'book-open', 3);
        $this->createLevel3Services($lessons->id, [
            ['FIND_TEACHER', 'find-teacher', 'Find a teacher (at home/online)', 'Trouver un professeur'],
            ['HOMEWORK_HELP', 'homework-study-methods', 'Help with homework and study methods', 'Aide aux devoirs et méthodes d\'étude'],
            ['EXAM_PREPARATION', 'exam-diploma-preparation', 'Prepare for an exam or diploma', 'Préparer un examen ou diplôme'],
        ]);

        $childcare = $this->createLevel2($family->id, 'CHILDCARE_ELDERLY', 'childcare-elderly-care', 'Childcare / Elderly care', 'Garde d\'Enfants / Personnes Âgées', 'users', 4);
        $this->createLevel3Services($childcare->id, [
            ['OCCASIONAL_CHILDCARE', 'occasional-childcare', 'Occasional childcare', 'Garde d\'enfants occasionnelle'],
            ['OCCASIONAL_ELDERLY', 'occasional-elderly-care', 'Occasional elderly care', 'Garde de personnes âgées occasionnelle'],
            ['REGULAR_CHILDCARE', 'regular-childcare', 'Regular childcare', 'Garde d\'enfants régulière'],
            ['REGULAR_ELDERLY', 'regular-elderly-care', 'Regular elderly care', 'Garde de personnes âgées régulière'],
            ['AFTER_SCHOOL', 'after-school-care', 'After-school care', 'Garde périscolaire'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : MOVING AND LOGISTICS (ID: 597)
        // ═══════════════════════════════════════════════════════════════════════
        $moving = UlixaiService::create([
            'code' => 'MOVING_LOGISTICS', 'slug' => 'moving-and-logistics',
            'name_en' => 'Moving and Logistics', 'name_fr' => 'Déménagement et Logistique',
            'name_es' => 'Mudanza y Logística', 'name_de' => 'Umzug und Logistik',
            'name_pt' => 'Mudança e Logística', 'name_ru' => 'Переезд и Логистика',
            'name_zh' => '搬家和物流', 'name_ar' => 'النقل والخدمات اللوجستية', 'name_hi' => 'स्थानांतरण और रसद',
            'parent_id' => null, 'level' => 1, 'icon' => 'truck', 'order' => 8, 'is_active' => true,
        ]);

        $movingOrg = $this->createLevel2($moving->id, 'MOVING_ORGANIZATION', 'moving-organization', 'Moving organization', 'Organisation de Déménagement', 'clipboard-document-list', 1);
        $this->createLevel3Services($movingOrg->id, [
            ['PLAN_MOVE', 'plan-local-international-move', 'Plan a local / international move', 'Planifier un déménagement local / international'],
            ['BOXES_PACKAGING', 'boxes-packaging-handling', 'Find boxes, packaging & professional handling', 'Trouver cartons, emballages et manutention'],
            ['INSURE_TRANSPORT', 'insure-belongings-transport', 'Insure my belongings during transport', 'Assurer mes biens pendant le transport'],
        ]);

        $storage = $this->createLevel2($moving->id, 'STORAGE_WAREHOUSING', 'storage-warehousing', 'Storage and Warehousing', 'Stockage et Entreposage', 'archive-box', 2);
        $this->createLevel3Services($storage->id, [
            ['SHORT_SMALL_STORAGE', 'short-term-small-storage', 'Find a short-term small storage unit to rent', 'Trouver un petit stockage court terme'],
            ['LONG_LARGE_STORAGE', 'long-term-large-storage', 'Find a large storage space to rent long-term', 'Trouver un grand espace de stockage long terme'],
            ['INSURE_STORAGE', 'insure-stored-belongings', 'Insure my stored belongings', 'Assurer mes biens stockés'],
        ]);

        $security = $this->createLevel2($moving->id, 'SECURITY_STORAGE', 'security-storage-services', 'Security & Storage Services', 'Services de Sécurité et Stockage', 'lock-closed', 3);
        $this->createLevel3Services($security->id, [
            ['LUGGAGE_LOCKERS', 'luggage-lockers', 'Store luggage in lockers (short-term)', 'Stocker bagages dans des casiers'],
            ['KEEP_BELONGINGS', 'keep-personal-belongings', 'Keep personal belongings (days/weeks)', 'Garder des effets personnels'],
            ['HOME_SITTING', 'home-sitting-surveillance', 'Provide home-sitting / housing surveillance', 'Fournir du home-sitting / surveillance'],
        ]);

        $delivery = $this->createLevel2($moving->id, 'DELIVERY_SMALL_TRANSPORT', 'delivery-small-transport', 'Delivery & Small Transport', 'Livraison et Petit Transport', 'shopping-bag', 4);
        $this->createLevel3Services($delivery->id, [
            ['RUN_ERRANDS', 'run-errands-pickups', 'Run errands and in-store pickups', 'Faire des courses et récupérations'],
            ['TRANSPORT_GROCERIES', 'transport-groceries-parcels', 'Transport groceries / parcels', 'Transporter courses / colis'],
            ['DELIVER_FURNITURE', 'deliver-furniture-appliances', 'Deliver furniture / household appliances', 'Livrer meubles / électroménager'],
        ]);

        $transportItems = $this->createLevel2($moving->id, 'TRANSPORT_ITEMS', 'transport-items-belongings', 'Transport of items and belongings', 'Transport d\'effets personnels', 'cube', 5);
        $this->createLevel3Services($transportItems->id, [
            ['TRANSPORT_PERSONAL', 'transport-personal-belongings', 'Transport a few personal belongings', 'Transporter quelques effets personnels'],
            ['TRANSPORT_FRAGILE', 'transport-fragile-bulky', 'Transport fragile / bulky items', 'Transporter des objets fragiles / volumineux'],
            ['TRANSPORT_VEHICLES', 'transport-vehicles-equipment', 'Transport vehicles / large equipment', 'Transporter véhicules / gros équipements'],
            ['EMERGENCY_TRANSPORT_ITEMS', 'emergency-transport-items', 'Arrange emergency transport of items', 'Organiser un transport d\'urgence d\'objets'],
        ]);

        $customs = $this->createLevel2($moving->id, 'CUSTOMS_FORMALITIES', 'customs-formalities', 'Customs Formalities', 'Formalités Douanières', 'clipboard-document-check', 6);
        $this->createLevel3Services($customs->id, [
            ['CUSTOMS_FORMS', 'fill-customs-forms', 'Fill out customs forms', 'Remplir les formulaires douaniers'],
            ['CUSTOMS_CLEARANCE', 'prepare-customs-clearance', 'Prepare my customs clearance', 'Préparer mon dédouanement'],
            ['CUSTOMS_EXEMPTION', 'customs-duty-exemption', 'Request a customs duty exemption', 'Demander une exonération de droits de douane'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : EMPLOYMENT & PROFESSIONAL DEVELOPMENT (ID: 695)
        // ═══════════════════════════════════════════════════════════════════════
        $employment = UlixaiService::create([
            'code' => 'EMPLOYMENT_PROFESSIONAL', 'slug' => 'employment-professional-development',
            'name_en' => 'Employment & Professional Development', 'name_fr' => 'Emploi et Développement Professionnel',
            'name_es' => 'Empleo y Desarrollo Profesional', 'name_de' => 'Beschäftigung und Berufliche Entwicklung',
            'name_pt' => 'Emprego e Desenvolvimento Profissional', 'name_ru' => 'Трудоустройство и Профессиональное Развитие',
            'name_zh' => '就业和职业发展', 'name_ar' => 'التوظيف والتطوير المهني', 'name_hi' => 'रोजगार और व्यावसायिक विकास',
            'parent_id' => null, 'level' => 1, 'icon' => 'briefcase', 'order' => 9, 'is_active' => true,
        ]);

        $jobSearch = $this->createLevel2($employment->id, 'JOB_SEARCH', 'job-search', 'Job search', 'Recherche d\'Emploi', 'magnifying-glass', 1);
        $this->createLevel3Services($jobSearch->id, [
            ['OPTIMIZE_CV', 'improve-optimize-cv', 'Improve and optimize my CV', 'Améliorer et optimiser mon CV'],
            ['HELP_FIND_JOB', 'help-find-job', 'Help to find a job (search, structure)', 'Aide pour trouver un emploi'],
            ['INTERVIEW_COACH', 'interview-coach', 'Coach for local job interviews', 'Coach pour entretiens d\'embauche'],
        ]);

        $selfEmployment = $this->createLevel2($employment->id, 'SELF_EMPLOYMENT', 'self-employment-freelancing', 'Self-Employment & Freelancing', 'Auto-Entrepreneur et Freelance', 'user', 2);
        $this->createLevel3Services($selfEmployment->id, [
            ['CHOOSE_LEGAL_STATUS', 'choose-legal-status', 'Choose a legal status', 'Choisir un statut juridique'],
            ['SET_UP_ACCOUNTING', 'set-up-accounting', 'Set up accounting', 'Mettre en place la comptabilité'],
            ['UMBRELLA_COMPANY', 'umbrella-company-services', 'Use umbrella company services', 'Utiliser des services de portage salarial'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : COMPANY & BUSINESS (ID: 704)
        // ═══════════════════════════════════════════════════════════════════════
        $company = UlixaiService::create([
            'code' => 'COMPANY_BUSINESS', 'slug' => 'company-business',
            'name_en' => 'Company & Business', 'name_fr' => 'Entreprise et Business',
            'name_es' => 'Empresa y Negocios', 'name_de' => 'Unternehmen und Geschäft',
            'name_pt' => 'Empresa e Negócios', 'name_ru' => 'Компания и Бизнес',
            'name_zh' => '公司和商业', 'name_ar' => 'الشركة والأعمال', 'name_hi' => 'कंपनी और व्यापार',
            'parent_id' => null, 'level' => 1, 'icon' => 'building-office', 'order' => 10, 'is_active' => true,
        ]);

        $creation = $this->createLevel2($company->id, 'CREATION_STRUCTURE', 'creation-structure', 'Creation & Structure', 'Création et Structure', 'plus-circle', 1);
        $this->createLevel3Services($creation->id, [
            ['CHOOSE_LEGAL_STRUCTURE', 'choose-legal-structure', 'Choose a legal structure', 'Choisir une structure juridique'],
            ['INCORPORATION', 'complete-incorporation', 'Complete the incorporation formalities', 'Accomplir les formalités de constitution'],
            ['REGISTER_ADDRESS', 'register-address-account', "Register the company's address and open a business account", 'Enregistrer l\'adresse de l\'entreprise et ouvrir un compte pro'],
        ]);

        $compliance = $this->createLevel2($company->id, 'COMPLIANCE_LEGAL', 'compliance-legal', 'Compliance & Legal', 'Conformité et Juridique', 'shield-check', 2);
        $this->createLevel3Services($compliance->id, [
            ['RESEARCH_LEGISLATION', 'research-legislation', 'Research local legislation and obligations', 'Rechercher la législation et obligations locales'],
            ['ENSURE_COMPLIANCE', 'ensure-compliance', "Ensure the company's compliance with laws", 'Assurer la conformité aux lois'],
            ['DRAFT_CONTRACTS', 'draft-commercial-contracts', 'Draft commercial contracts', 'Rédiger des contrats commerciaux'],
            ['REGISTER_TRADEMARKS', 'register-trademarks-patents', 'Register trademarks & patents', 'Enregistrer marques et brevets'],
        ]);

        $operations = $this->createLevel2($company->id, 'OPERATIONAL_MANAGEMENT', 'operational-management', 'Operational Management', 'Gestion Opérationnelle', 'cog', 3);
        $this->createLevel3Services($operations->id, [
            ['RECRUIT_PAYROLL', 'recruit-manage-payroll', 'Recruit and manage payroll', 'Recruter et gérer la paie'],
            ['WORK_VISAS', 'manage-work-visas', 'Manage work visas for employees', 'Gérer les visas de travail des employés'],
            ['IMPLEMENT_TOOLS', 'implement-tools-processes', 'Implement tools and processes', 'Mettre en place outils et processus'],
        ]);

        $bizDev = $this->createLevel2($company->id, 'BUSINESS_DEVELOPMENT', 'business-development', 'Business Development', 'Développement Commercial', 'chart-bar', 4);
        $this->createLevel3Services($bizDev->id, [
            ['MARKET_RESEARCH', 'market-research-prospect', 'Conduct market research and prospect', 'Réaliser une étude de marché et prospecter'],
            ['BUY_SELL_BUSINESS', 'buy-sell-business-asset', 'Buy / Sell a business asset', 'Acheter / Vendre un actif d\'entreprise'],
        ]);

        $assets = $this->createLevel2($company->id, 'BUSINESS_ASSETS', 'business-assets', 'Business & Assets', 'Entreprise et Actifs', 'building-storefront', 5);
        $this->createLevel3Services($assets->id, [
            ['SEARCH_BUSINESS', 'search-visiting-business', 'Assist with searching and visiting a business', 'Aider à rechercher et visiter une entreprise'],
            ['SELL_BUSINESS', 'assist-selling-business', 'Assist with selling a business', 'Aider à vendre une entreprise'],
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // NIVEAU 1 : HEALTH & WELL-BEING (ID: 654)
        // ═══════════════════════════════════════════════════════════════════════
        $health = UlixaiService::create([
            'code' => 'HEALTH_WELLBEING', 'slug' => 'health-well-being',
            'name_en' => 'Health & Well-being', 'name_fr' => 'Santé et Bien-être',
            'name_es' => 'Salud y Bienestar', 'name_de' => 'Gesundheit und Wohlbefinden',
            'name_pt' => 'Saúde e Bem-estar', 'name_ru' => 'Здоровье и Благополучие',
            'name_zh' => '健康和福祉', 'name_ar' => 'الصحة والرفاهية', 'name_hi' => 'स्वास्थ्य और कल्याण',
            'parent_id' => null, 'level' => 1, 'icon' => 'heart', 'order' => 11, 'is_active' => true,
        ]);

        $healthInsurance = $this->createLevel2($health->id, 'HEALTH_INSURANCE', 'health-insurance-coverage', 'Health Insurance & Coverage', 'Assurance Santé et Couverture', 'shield-check', 1);
        $this->createLevel3Services($healthInsurance->id, [
            ['SUBSCRIBE_HEALTH', 'subscribe-international-health', 'Help with subscribing to international health insurance', 'Aide pour souscrire une assurance santé internationale'],
            ['REQUEST_COVERAGE', 'request-health-coverage', 'Help with requesting health insurance coverage', 'Aide pour demander une couverture santé'],
            ['HEALTH_REIMBURSEMENTS', 'health-reimbursements', 'Help with getting health reimbursements', 'Aide pour obtenir des remboursements santé'],
        ]);

        $medical = $this->createLevel2($health->id, 'MEDICAL_CONSULTATIONS', 'medical-consultations', 'Medical Consultations', 'Consultations Médicales', 'user', 2);
        $this->createLevel3Services($medical->id, [
            ['ACCOMPANY_CONSULTATION', 'accompany-consultation', 'Accompany me to a consultation (bilingual)', 'M\'accompagner à une consultation (bilingue)'],
            ['EMERGENCY_ROOM', 'help-emergency-room', 'Help with going to the emergency room', 'Aide pour aller aux urgences'],
        ]);

        $medication = $this->createLevel2($health->id, 'MEDICATION_PHARMACY', 'medication-pharmacy', 'Medication and Pharmacy', 'Médicaments et Pharmacie', 'beaker', 3);
        $this->createLevel3Services($medication->id, [
            ['PICKUP_MEDICATION', 'pickup-medication', 'Pick up medication or accompany me', 'Récupérer des médicaments ou m\'accompagner'],
            ['MEDICATION_DELIVERY', 'medication-delivery', 'Medication delivery', 'Livraison de médicaments'],
        ]);
    }

    private function createLevel2(int $parentId, string $code, string $slug, string $nameEn, string $nameFr, string $icon, int $order): UlixaiService
    {
        return UlixaiService::create([
            'code' => $code, 'slug' => $slug,
            'name_en' => $nameEn, 'name_fr' => $nameFr,
            'name_es' => $nameEn, 'name_de' => $nameEn, 'name_pt' => $nameEn,
            'name_ru' => $nameEn, 'name_zh' => $nameEn, 'name_ar' => $nameEn, 'name_hi' => $nameEn,
            'parent_id' => $parentId, 'level' => 2, 'icon' => $icon, 'order' => $order, 'is_active' => true,
        ]);
    }

    private function createLevel3Services(int $parentId, array $services): void
    {
        $order = 1;
        foreach ($services as $service) {
            UlixaiService::create([
                'code' => $service[0], 'slug' => $service[1],
                'name_en' => $service[2], 'name_fr' => $service[3],
                'name_es' => $service[2], 'name_de' => $service[2], 'name_pt' => $service[2],
                'name_ru' => $service[2], 'name_zh' => $service[2], 'name_ar' => $service[2], 'name_hi' => $service[2],
                'parent_id' => $parentId, 'level' => 3, 'icon' => null, 'order' => $order++, 'is_active' => true,
            ]);
        }
    }
}
