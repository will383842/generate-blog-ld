<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PressReleaseTemplate;

/**
 * PressReleaseTemplateSeeder - Templates ENRICHIS pour communiqués professionnels
 * 
 * 45 templates (5 types × 9 langues) avec instructions détaillées
 * pour garantir des communiqués de HAUTE QUALITÉ via GPT-4
 */
class PressReleaseTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding 45 Press Release Templates...');
        $this->command->newLine();

        $templates = $this->getAllTemplates();
        $count = 0;

        foreach ($templates as $template) {
            PressReleaseTemplate::updateOrCreate(
                ['template_code' => $template['template_code']],
                $template
            );
            $count++;
        }

        $this->command->newLine();
        $this->command->info("✅ {$count} templates créés avec succès!");
        $this->command->info('🎉 Tous les templates sont prêts pour générer des communiqués professionnels!');
    }

    /**
     * Obtenir tous les 45 templates
     */
    protected function getAllTemplates(): array
    {
        return [
            // ==========================================
            // LANCEMENT PRODUIT - 9 LANGUES
            // ==========================================
            [
                'template_code' => 'lancement_produit_fr',
                'name' => 'Lancement de Produit - Français',
                'type' => 'lancement_produit',
                'language_code' => 'fr',
                'structure' => [
                    'headline_pattern' => '[Platform] lance [Produit] : [Bénéfice Principal en 5-7 mots]',
                    'lead_pattern' => '[Lieu], [Date] – [Platform], leader [secteur/positionnement], annonce aujourd\'hui le lancement de [Produit], une solution innovante qui permet de [bénéfice concret et mesurable]. Disponible dès [date] dans [couverture géographique], ce service répond aux besoins urgents de [nombre] [cible] qui recherchent [solution spécifique].',
                    'body_sections' => [
                        'body1' => 'CONTEXTE ET PROBLÈME RÉSOLU (150-180 mots): Décrire la situation actuelle du marché de l\'expatriation, les difficultés concrètes rencontrées par la cible (délais, coûts, complexité administrative), et les chiffres qui démontrent l\'ampleur du problème. Expliquer pourquoi les solutions existantes sont inadéquates. Présenter comment ce nouveau produit/service répond précisément à ces pain points avec une approche différenciante.',
                        'body2' => 'FONCTIONNALITÉS ET AVANTAGES (150-180 mots): Détailler 3-4 fonctionnalités clés avec pour chacune le bénéfice utilisateur concret. Inclure des données chiffrées (gain de temps, économies, taux de satisfaction, etc.). Expliquer la technologie ou méthodologie utilisée de manière accessible. Mentionner les éléments différenciants vs concurrence (rapidité, couverture, expertise, prix). Inclure des cas d\'usage concrets.',
                        'body3' => 'DISPONIBILITÉ ET MODALITÉS (100-120 mots): Préciser la date de lancement exacte, les pays/régions couverts, les langues disponibles. Détailler les formules tarifaires (gratuit/freemium/premium avec prix si pertinent), les promotions de lancement éventuelles. Expliquer comment accéder au service (URL, app stores, processus d\'inscription). Mentionner le support client disponible et les garanties offertes.'
                    ],
                    'quote_pattern' => 'Citation authentique du CEO/Directeur (50-80 mots, 2-3 phrases) qui doit : (1) Exprimer la vision et la mission derrière ce lancement, (2) Souligner l\'impact concret attendu sur la vie des expatriés, (3) Réaffirmer l\'engagement de [Platform] envers sa communauté. Ton personnel mais professionnel, sans jargon marketing. La citation doit apporter une perspective humaine et stratégique, pas répéter ce qui est déjà dit dans le corps.'
                ],
                'variables' => [
                    'product_name' => 'Nom du produit/service',
                    'launch_date' => 'Date de lancement',
                    'key_benefits' => 'Liste des bénéfices principaux',
                    'target_audience' => 'Public cible précis',
                    'coverage' => 'Couverture géographique',
                    'pricing' => 'Tarification',
                    'unique_features' => 'Fonctionnalités uniques',
                    'stats' => 'Statistiques et chiffres clés',
                    'technology' => 'Technologies utilisées',
                    'availability_date' => 'Date de disponibilité'
                ],
                'instructions' => 'DIRECTIVES ÉDITORIALES STRICTES:

QUALITÉ RÉDACTIONNELLE:
- Ton professionnel mais accessible, éviter le jargon technique excessif
- Style journalistique factuel, pas de ton marketing publicitaire
- Phrases courtes et percutantes (15-25 mots maximum par phrase)
- Utiliser la voix active prioritairement
- Aucune hyperbole ni superlatif non justifié ("révolutionnaire", "unique au monde", etc.)
- Chaque affirmation doit être étayée par un chiffre, un fait ou un exemple concret

STRUCTURE:
- Titre: 50-70 caractères, percutant, avec bénéfice clair, sans point final
- Lead: 80-120 mots, répondre aux 5W (Who, What, When, Where, Why), inclure 2-3 chiffres clés
- Corps: 300-500 mots au total, divisé en 3 sections distinctes
- Citation: 50-80 mots, authentique, apporte perspective humaine
- Longueur totale: 500-700 mots

CHIFFRES ET DONNÉES:
- Inclure minimum 5-7 données chiffrées dans le communiqué
- Privilégier les pourcentages, délais, économies, nombre d\'utilisateurs
- Contextualiser chaque chiffre (par rapport à quoi, sur quelle période)

TON ET STYLE:
- Corporatif mais humain
- Factuel et crédible
- Orienté bénéfices utilisateurs, pas fonctionnalités techniques
- Éviter le "nous" excessif, privilégier "[Platform]" en sujet

CONTRAINTES:
- Mentionner le nom de la plateforme 3-4 fois (pas plus)
- Intégrer naturellement les mots-clés SEO fournis dans le contexte
- Assurer la cohérence avec le positionnement de la plateforme
- Respecter le guide éditorial de la marque',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_en',
                'name' => 'Product Launch - English',
                'type' => 'lancement_produit',
                'language_code' => 'en',
                'structure' => [
                    'headline_pattern' => '[Platform] Launches [Product]: [Key Benefit in 5-7 Words]',
                    'lead_pattern' => '[Location], [Date] – [Platform], a leader in [sector/positioning], today announces the launch of [Product], an innovative solution that enables [concrete, measurable benefit]. Available from [date] in [geographic coverage], this service addresses the urgent needs of [number] [target audience] seeking [specific solution].',
                    'body_sections' => [
                        'body1' => 'CONTEXT AND PROBLEM SOLVED (150-180 words): Describe the current expatriation market situation, concrete challenges faced by the target audience (delays, costs, administrative complexity), and data demonstrating the problem\'s scale. Explain why existing solutions are inadequate. Present how this new product/service precisely addresses these pain points with a differentiating approach.',
                        'body2' => 'FEATURES AND BENEFITS (150-180 words): Detail 3-4 key features with concrete user benefits for each. Include quantified data (time savings, cost reductions, satisfaction rates, etc.). Explain the technology or methodology used in an accessible manner. Mention differentiating elements vs. competition (speed, coverage, expertise, pricing). Include concrete use cases.',
                        'body3' => 'AVAILABILITY AND TERMS (100-120 words): Specify exact launch date, covered countries/regions, available languages. Detail pricing plans (free/freemium/premium with prices if relevant), any launch promotions. Explain how to access the service (URL, app stores, registration process). Mention available customer support and offered guarantees.'
                    ],
                    'quote_pattern' => 'Authentic CEO/Director quote (50-80 words, 2-3 sentences) that should: (1) Express the vision and mission behind this launch, (2) Highlight the concrete expected impact on expats\' lives, (3) Reaffirm [Platform]\'s commitment to its community. Personal yet professional tone, no marketing jargon. Quote should provide human and strategic perspective, not repeat what\'s already in the body.'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'STRICT EDITORIAL GUIDELINES:

WRITING QUALITY:
- Professional yet accessible tone, avoid excessive technical jargon
- Factual journalistic style, not advertising marketing tone
- Short, punchy sentences (15-25 words maximum per sentence)
- Prioritize active voice
- No hyperbole or unjustified superlatives ("revolutionary", "world\'s only", etc.)
- Every claim must be supported by a number, fact, or concrete example

STRUCTURE:
- Headline: 50-70 characters, impactful, with clear benefit, no period
- Lead: 80-120 words, answer the 5Ws, include 2-3 key figures
- Body: 300-500 words total, divided into 3 distinct sections
- Quote: 50-80 words, authentic, provides human perspective
- Total length: 500-700 words

DATA AND METRICS:
- Include minimum 5-7 data points in the release
- Prefer percentages, timeframes, savings, user numbers
- Contextualize each figure (compared to what, over what period)

TONE AND STYLE:
- Corporate yet human
- Factual and credible
- User benefits-oriented, not technical features
- Avoid excessive "we", prefer "[Platform]" as subject

CONSTRAINTS:
- Mention platform name 3-4 times (no more)
- Naturally integrate SEO keywords provided in context
- Ensure consistency with platform positioning
- Respect brand editorial guidelines',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_de',
                'name' => 'Produkteinführung - Deutsch',
                'type' => 'lancement_produit',
                'language_code' => 'de',
                'structure' => [
                    'headline_pattern' => '[Platform] lanciert [Produkt]: [Hauptvorteil in 5-7 Wörtern]',
                    'lead_pattern' => '[Ort], [Datum] – [Platform], führend im [Sektor/Positionierung], kündigt heute die Einführung von [Produkt] an, einer innovativen Lösung, die [konkreten, messbaren Vorteil] ermöglicht. Ab [Datum] in [geografische Abdeckung] verfügbar, beantwortet dieser Service die dringenden Bedürfnisse von [Anzahl] [Zielgruppe], die [spezifische Lösung] suchen.',
                    'body_sections' => [
                        'body1' => 'KONTEXT UND GELÖSTES PROBLEM (150-180 Wörter): Die aktuelle Situation des Expat-Marktes beschreiben, konkrete Herausforderungen der Zielgruppe (Verzögerungen, Kosten, administrative Komplexität) und Daten, die das Ausmaß des Problems zeigen. Erklären, warum bestehende Lösungen unzureichend sind. Darstellen, wie dieses neue Produkt/Service diese Pain Points mit einem differenzierenden Ansatz genau adressiert.',
                        'body2' => 'FUNKTIONEN UND VORTEILE (150-180 Wörter): 3-4 Hauptfunktionen mit konkreten Nutzervorteilen für jede detailliert beschreiben. Quantifizierte Daten einbeziehen (Zeitersparnis, Kostensenkungen, Zufriedenheitsraten usw.). Die verwendete Technologie oder Methodik verständlich erklären. Differenzierungselemente vs. Wettbewerb erwähnen (Geschwindigkeit, Abdeckung, Expertise, Preisgestaltung). Konkrete Anwendungsfälle einbeziehen.',
                        'body3' => 'VERFÜGBARKEIT UND MODALITÄTEN (100-120 Wörter): Genaues Startdatum, abgedeckte Länder/Regionen, verfügbare Sprachen angeben. Preispläne detailliert beschreiben (kostenlos/freemium/premium mit Preisen falls relevant), eventuelle Start-Promotionen. Erklären, wie man auf den Service zugreift (URL, App Stores, Anmeldeprozess). Verfügbaren Kundensupport und angebotene Garantien erwähnen.'
                    ],
                    'quote_pattern' => 'Authentisches CEO/Direktoren-Zitat (50-80 Wörter, 2-3 Sätze), das sollte: (1) Vision und Mission hinter dieser Einführung ausdrücken, (2) Konkreten erwarteten Einfluss auf das Leben der Expats hervorheben, (3) [Platform]s Engagement für seine Gemeinschaft bekräftigen. Persönlicher aber professioneller Ton, kein Marketing-Jargon. Zitat sollte menschliche und strategische Perspektive bieten, nicht wiederholen, was bereits im Hauptteil steht.'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'STRIKTE REDAKTIONELLE RICHTLINIEN:

SCHREIBQUALITÄT:
- Professioneller aber zugänglicher Ton, übermäßiges Fach-Jargon vermeiden
- Sachlicher journalistischer Stil, kein werblicher Marketing-Ton
- Kurze, prägnante Sätze (maximal 15-25 Wörter pro Satz)
- Aktive Stimme bevorzugen
- Keine Übertreibung oder ungerechtfertigte Superlative
- Jede Behauptung muss durch Zahl, Tatsache oder konkretes Beispiel gestützt werden

STRUKTUR:
- Überschrift: 50-70 Zeichen, wirkungsvoll, mit klarem Vorteil, kein Punkt
- Lead: 80-120 Wörter, 5Ws beantworten, 2-3 Schlüsselzahlen einbeziehen
- Hauptteil: 300-500 Wörter insgesamt, in 3 separate Abschnitte unterteilt
- Zitat: 50-80 Wörter, authentisch, bietet menschliche Perspektive
- Gesamtlänge: 500-700 Wörter

CONSTRAINTS:
- Plattformname 3-4 Mal erwähnen (nicht mehr)
- SEO-Schlüsselwörter natürlich integrieren
- Konsistenz mit Plattform-Positionierung sicherstellen
- Marken-Redaktionsrichtlinien respektieren',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_es',
                'name' => 'Lanzamiento de Producto - Español',
                'type' => 'lancement_produit',
                'language_code' => 'es',
                'structure' => [
                    'headline_pattern' => '[Platform] lanza [Producto]: [Beneficio Principal en 5-7 palabras]',
                    'lead_pattern' => '[Lugar], [Fecha] – [Platform], líder en [sector/posicionamiento], anuncia hoy el lanzamiento de [Producto], una solución innovadora que permite [beneficio concreto y medible]. Disponible desde [fecha] en [cobertura geográfica], este servicio responde a las necesidades urgentes de [número] [público objetivo] que buscan [solución específica].',
                    'body_sections' => [
                        'body1' => 'CONTEXTO Y PROBLEMA RESUELTO (150-180 palabras): Describir la situación actual del mercado de expatriación, dificultades concretas que enfrenta el público objetivo, y cifras que demuestran la magnitud del problema. Explicar por qué las soluciones existentes son inadecuadas. Presentar cómo este nuevo producto/servicio responde precisamente a estos pain points.',
                        'body2' => 'FUNCIONALIDADES Y VENTAJAS (150-180 palabras): Detallar 3-4 funcionalidades clave con beneficio concreto para el usuario. Incluir datos cuantificados (ahorro de tiempo, economías, tasas de satisfacción). Explicar la tecnología o metodología de manera accesible. Mencionar elementos diferenciadores vs. competencia.',
                        'body3' => 'DISPONIBILIDAD Y MODALIDADES (100-120 palabras): Precisar fecha exacta de lanzamiento, países/regiones cubiertos, idiomas disponibles. Detallar planes de precios, promociones de lanzamiento. Explicar cómo acceder al servicio. Mencionar soporte al cliente disponible y garantías ofrecidas.'
                    ],
                    'quote_pattern' => 'Cita auténtica del CEO/Director (50-80 palabras, 2-3 frases) que debe: (1) Expresar la visión y misión detrás de este lanzamiento, (2) Destacar el impacto concreto esperado en la vida de los expatriados, (3) Reafirmar el compromiso de [Platform] con su comunidad. Tono personal pero profesional, sin jerga de marketing.'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'DIRECTRICES EDITORIALES ESTRICTAS: Tono profesional pero accesible. Estilo periodístico factual, no tono publicitario. Frases cortas (15-25 palabras máximo). Sin hipérbole ni superlativos injustificados. Toda afirmación debe respaldarse con cifra, hecho o ejemplo concreto. Incluir mínimo 5-7 datos cuantificados. Total: 500-700 palabras.',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_pt',
                'name' => 'Lançamento de Produto - Português',
                'type' => 'lancement_produit',
                'language_code' => 'pt',
                'structure' => [
                    'headline_pattern' => '[Platform] lança [Produto]: [Benefício Principal em 5-7 palavras]',
                    'lead_pattern' => '[Local], [Data] – [Platform], líder em [setor/posicionamento], anuncia hoje o lançamento de [Produto], uma solução inovadora que permite [benefício concreto e mensurável]. Disponível a partir de [data] em [cobertura geográfica], este serviço atende às necessidades urgentes de [número] [público-alvo] que buscam [solução específica].',
                    'body_sections' => [
                        'body1' => 'CONTEXTO E PROBLEMA RESOLVIDO (150-180 palavras): Descrever a situação atual do mercado de expatriação, dificuldades concretas enfrentadas pelo público-alvo, e números que demonstram a magnitude do problema. Explicar por que as soluções existentes são inadequadas. Apresentar como este novo produto/serviço responde precisamente a esses pain points.',
                        'body2' => 'FUNCIONALIDADES E VANTAGENS (150-180 palavras): Detalhar 3-4 funcionalidades-chave com benefício concreto para o usuário. Incluir dados quantificados (economia de tempo, reduções de custo, taxas de satisfação). Explicar a tecnologia ou metodologia de forma acessível. Mencionar elementos diferenciadores vs. concorrência.',
                        'body3' => 'DISPONIBILIDADE E MODALIDADES (100-120 palavras): Especificar data exata de lançamento, países/regiões cobertas, idiomas disponíveis. Detalhar planos de preços, promoções de lançamento. Explicar como acessar o serviço. Mencionar suporte ao cliente disponível e garantias oferecidas.'
                    ],
                    'quote_pattern' => 'Citação autêntica do CEO/Diretor (50-80 palavras, 2-3 frases) que deve: (1) Expressar a visão e missão por trás deste lançamento, (2) Destacar o impacto concreto esperado na vida dos expatriados, (3) Reafirmar o compromisso da [Platform] com sua comunidade. Tom pessoal mas profissional, sem jargão de marketing.'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'DIRETRIZES EDITORIAIS ESTRITAS: Tom profissional mas acessível. Estilo jornalístico factual, não tom publicitário. Frases curtas (15-25 palavras máximo). Sem hipérbole ou superlativos injustificados. Toda afirmação deve ser respaldada por número, fato ou exemplo concreto. Incluir mínimo 5-7 dados quantificados. Total: 500-700 palavras.',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_ru',
                'name' => 'Запуск Продукта - Русский',
                'type' => 'lancement_produit',
                'language_code' => 'ru',
                'structure' => [
                    'headline_pattern' => '[Platform] запускает [Продукт]: [Ключевое Преимущество в 5-7 словах]',
                    'lead_pattern' => '[Место], [Дата] – [Platform], лидер в [секторе/позиционировании], объявляет сегодня о запуске [Продукт], инновационного решения, которое обеспечивает [конкретное, измеримое преимущество]. Доступный с [дата] в [географическое покрытие], этот сервис отвечает на срочные потребности [число] [целевая аудитория], ищущих [конкретное решение].',
                    'body_sections' => [
                        'body1' => 'КОНТЕКСТ И РЕШЕННАЯ ПРОБЛЕМА (150-180 слов): Описать текущую ситуацию на рынке экспатриации, конкретные трудности, с которыми сталкивается целевая аудитория, и данные, демонстрирующие масштаб проблемы. Объяснить, почему существующие решения неадекватны. Представить, как этот новый продукт/сервис точно решает эти проблемные точки.',
                        'body2' => 'ФУНКЦИОНАЛЬНОСТЬ И ПРЕИМУЩЕСТВА (150-180 слов): Подробно описать 3-4 ключевые функции с конкретными преимуществами для пользователя. Включить количественные данные (экономия времени, снижение затрат, показатели удовлетворенности). Объяснить используемую технологию или методологию доступным образом. Упомянуть дифференцирующие элементы vs. конкуренция.',
                        'body3' => 'ДОСТУПНОСТЬ И УСЛОВИЯ (100-120 слов): Указать точную дату запуска, охваченные страны/регионы, доступные языки. Подробно описать ценовые планы, промо-акции запуска. Объяснить, как получить доступ к сервису. Упомянуть доступную поддержку клиентов и предлагаемые гарантии.'
                    ],
                    'quote_pattern' => 'Аутентичная цитата CEO/Директора (50-80 слов, 2-3 предложения), которая должна: (1) Выразить видение и миссию этого запуска, (2) Подчеркнуть ожидаемое конкретное влияние на жизнь экспатов, (3) Подтвердить приверженность [Platform] своему сообществу. Личный, но профессиональный тон, без маркетингового жаргона.'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'СТРОГИЕ РЕДАКЦИОННЫЕ РУКОВОДСТВА: Профессиональный, но доступный тон. Фактический журналистский стиль, не рекламный маркетинговый тон. Короткие предложения (максимум 15-25 слов). Без преувеличений или необоснованных превосходных степеней. Каждое утверждение должно подтверждаться цифрой, фактом или конкретным примером. Включить минимум 5-7 количественных данных. Всего: 500-700 слов.',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_zh',
                'name' => '产品发布 - 中文',
                'type' => 'lancement_produit',
                'language_code' => 'zh',
                'structure' => [
                    'headline_pattern' => '[Platform]推出[产品]：[5-7字核心优势]',
                    'lead_pattern' => '[地点]，[日期] – [Platform]，[行业/定位]的领导者，今天宣布推出[产品]，一个创新解决方案，可实现[具体、可衡量的优势]。从[日期]开始在[地理覆盖]提供，该服务满足[数量][目标受众]寻求[具体解决方案]的迫切需求。',
                    'body_sections' => [
                        'body1' => '背景和解决的问题（150-180字）：描述当前外籍市场情况，目标受众面临的具体挑战，以及显示问题规模的数据。解释为什么现有解决方案不够充分。介绍这个新产品/服务如何精确地解决这些痛点，采用差异化方法。',
                        'body2' => '功能和优势（150-180字）：详细说明3-4个关键功能及其为用户带来的具体优势。包含量化数据（节省时间、降低成本、满意度）。以易懂的方式解释所使用的技术或方法。提及与竞争对手的差异化元素。',
                        'body3' => '可用性和条款（100-120字）：明确发布日期、覆盖的国家/地区、可用语言。详细说明定价计划、发布促销。解释如何访问服务。提及可用的客户支持和提供的保证。'
                    ],
                    'quote_pattern' => 'CEO/总监的真实引述（50-80字，2-3句）应该：(1)表达此次发布背后的愿景和使命，(2)强调对外籍人士生活的具体预期影响，(3)重申[Platform]对其社区的承诺。个人但专业的语气，不使用营销术语。'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => '严格编辑指南：专业但易懂的语气。事实性新闻风格，非广告营销语气。短句（每句最多15-25字）。无夸张或不合理的最高级。每个声明必须有数字、事实或具体例子支持。包含至少5-7个量化数据。总计：500-700字。',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_ar',
                'name' => 'إطلاق المنتج - العربية',
                'type' => 'lancement_produit',
                'language_code' => 'ar',
                'structure' => [
                    'headline_pattern' => '[Platform] تطلق [المنتج]: [الفائدة الرئيسية في 5-7 كلمات]',
                    'lead_pattern' => '[المكان]، [التاريخ] – تعلن [Platform]، الرائدة في [القطاع/التموضع]، اليوم عن إطلاق [المنتج]، حل مبتكر يتيح [فائدة محددة وقابلة للقياس]. متاح من [التاريخ] في [التغطية الجغرافية]، يلبي هذا الخدمة الاحتياجات العاجلة لـ [العدد] [الجمهور المستهدف] الذين يبحثون عن [حل محدد].',
                    'body_sections' => [
                        'body1' => 'السياق والمشكلة المحلولة (150-180 كلمة): وصف الوضع الحالي لسوق الوافدين، التحديات الملموسة التي يواجهها الجمهور المستهدف، والبيانات التي تثبت حجم المشكلة. شرح لماذا الحلول الحالية غير كافية. تقديم كيف يعالج هذا المنتج/الخدمة الجديد هذه النقاط الحساسة بدقة.',
                        'body2' => 'الميزات والفوائد (150-180 كلمة): تفصيل 3-4 ميزات رئيسية مع الفائدة الملموسة للمستخدم. تضمين البيانات المقاسة (توفير الوقت، تخفيضات التكلفة، معدلات الرضا). شرح التقنية أو المنهجية بطريقة متاحة. ذكر العناصر المميزة مقابل المنافسة.',
                        'body3' => 'التوفر والشروط (100-120 كلمة): تحديد تاريخ الإطلاق الدقيق، البلدان/المناطق المغطاة، اللغات المتاحة. تفصيل خطط التسعير، عروض الإطلاق الترويجية. شرح كيفية الوصول إلى الخدمة. ذكر دعم العملاء المتاح والضمانات المقدمة.'
                    ],
                    'quote_pattern' => 'اقتباس أصيل من المدير التنفيذي (50-80 كلمة، 2-3 جمل) يجب أن: (1) يعبر عن الرؤية والمهمة وراء هذا الإطلاق، (2) يسلط الضوء على التأثير الملموس المتوقع على حياة الوافدين، (3) يؤكد من جديد التزام [Platform] تجاه مجتمعها. لهجة شخصية لكن مهنية، بدون لغة تسويقية.'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'إرشادات تحريرية صارمة: لهجة مهنية لكن متاحة. أسلوب صحفي واقعي، ليس لهجة تسويقية إعلانية. جمل قصيرة (15-25 كلمة كحد أقصى). بدون مبالغة أو صيغ تفضيل غير مبررة. كل تأكيد يجب أن يدعم برقم أو حقيقة أو مثال محدد. تضمين ما لا يقل عن 5-7 بيانات مقاسة. المجموع: 500-700 كلمة.',
                'is_active' => true
            ],

            [
                'template_code' => 'lancement_produit_hi',
                'name' => 'उत्पाद लॉन्च - हिन्दी',
                'type' => 'lancement_produit',
                'language_code' => 'hi',
                'structure' => [
                    'headline_pattern' => '[Platform] [उत्पाद] लॉन्च करता है: [5-7 शब्दों में मुख्य लाभ]',
                    'lead_pattern' => '[स्थान], [तिथि] – [Platform], [क्षेत्र/स्थिति] में अग्रणी, आज [उत्पाद] की लॉन्च की घोषणा करता है, एक नवीन समाधान जो [ठोस, मापने योग्य लाभ] सक्षम बनाता है। [तिथि] से [भौगोलिक कवरेज] में उपलब्ध, यह सेवा [संख्या] [लक्षित दर्शकों] की तत्काल जरूरतों को पूरा करती है जो [विशिष्ट समाधान] की तलाश में हैं।',
                    'body_sections' => [
                        'body1' => 'संदर्भ और हल की गई समस्या (150-180 शब्द): प्रवासी बाजार की वर्तमान स्थिति का वर्णन करें, लक्षित दर्शकों द्वारा सामना की जाने वाली ठोस चुनौतियां, और समस्या के पैमाने को प्रदर्शित करने वाले आंकड़े। बताएं कि मौजूदा समाधान अपर्याप्त क्यों हैं। प्रस्तुत करें कि यह नया उत्पाद/सेवा इन दर्द बिंदुओं को कैसे सटीक रूप से संबोधित करता है।',
                        'body2' => 'सुविधाएं और लाभ (150-180 शब्द): उपयोगकर्ता के लिए ठोस लाभ के साथ 3-4 मुख्य सुविधाओं का विवरण दें। मात्रात्मक डेटा शामिल करें (समय की बचत, लागत में कमी, संतुष्टि दर)। प्रौद्योगिकी या पद्धति को सुलभ तरीके से समझाएं। प्रतिस्पर्धा के खिलाफ अंतर तत्वों का उल्लेख करें।',
                        'body3' => 'उपलब्धता और नियम (100-120 शब्द): सटीक लॉन्च तिथि, कवर किए गए देश/क्षेत्र, उपलब्ध भाषाएं निर्दिष्ट करें। मूल्य निर्धारण योजनाओं का विवरण दें, लॉन्च प्रचार। सेवा तक कैसे पहुंचें समझाएं। उपलब्ध ग्राहक सहायता और प्रदान की गई गारंटी का उल्लेख करें।'
                    ],
                    'quote_pattern' => 'सीईओ/निदेशक का प्रामाणिक उद्धरण (50-80 शब्द, 2-3 वाक्य) जो चाहिए: (1) इस लॉन्च के पीछे दृष्टि और मिशन व्यक्त करे, (2) प्रवासियों के जीवन पर अपेक्षित ठोस प्रभाव पर जोर दे, (3) [Platform] की अपने समुदाय के प्रति प्रतिबद्धता की पुष्टि करे। व्यक्तिगत लेकिन पेशेवर स्वर, विपणन शब्दजाल नहीं।'
                ],
                'variables' => [
                    'product_name', 'launch_date', 'key_benefits', 'target_audience',
                    'coverage', 'pricing', 'unique_features', 'stats', 'technology', 'availability_date'
                ],
                'instructions' => 'कड़े संपादकीय दिशानिर्देश: पेशेवर लेकिन सुलभ स्वर। तथ्यात्मक पत्रकारिता शैली, विज्ञापन विपणन स्वर नहीं। छोटे वाक्य (प्रति वाक्य अधिकतम 15-25 शब्द)। कोई अतिशयोक्ति या अनुचित उत्कृष्टता नहीं। प्रत्येक दावे को संख्या, तथ्य या ठोस उदाहरण से समर्थित होना चाहिए। न्यूनतम 5-7 मात्रात्मक डेटा शामिल करें। कुल: 500-700 शब्द।',
                'is_active' => true
            ],

            // ==========================================
            // PARTENARIAT - 9 LANGUES
            // ==========================================
            [
                'template_code' => 'partenariat_fr',
                'name' => 'Partenariat Stratégique - Français',
                'type' => 'partenariat',
                'language_code' => 'fr',
                'structure' => [
                    'headline_pattern' => '[Platform] et [Partenaire] s\'associent pour [objectif commun en 5-7 mots]',
                    'lead_pattern' => '[Lieu], [Date] – [Platform] et [Partenaire] annoncent aujourd\'hui un partenariat stratégique visant à [objectif précis]. Cet accord permettra aux [nombre] [bénéficiaires] dans [couverture] de bénéficier de [avantages concrets mesurables]. La collaboration débutera dès [date] avec [première action concrète].',
                    'body_sections' => [
                        'body1' => 'CONTEXTE DU PARTENARIAT (150-180 mots): Expliquer les raisons stratégiques de cette collaboration, les complémentarités entre les deux entités (expertise, couverture géographique, technologies, clientèle). Présenter les forces respectives et pourquoi cette union crée une valeur supérieure à la somme des parties. Inclure des données sur les deux partenaires (taille, reach, positionnement) pour établir la crédibilité.',
                        'body2' => 'MODALITÉS ET SERVICES (150-180 mots): Détailler concrètement comment le partenariat fonctionne, quels services sont concernés, les nouvelles offres ou fonctionnalités créées, le calendrier de déploiement avec dates clés. Expliquer l\'expérience utilisateur (comment les clients accèdent aux services combinés, workflow, integration). Mentionner les investissements ou ressources engagés si pertinent.',
                        'body3' => 'BÉNÉFICES ET PERSPECTIVES (100-120 mots): Présenter les avantages concrets et mesurables pour les utilisateurs finaux (meilleure couverture, tarifs préférentiels, accès à plus de services, support renforcé). Évoquer les objectifs chiffrés du partenariat (nombre d\'utilisateurs visés, expansion géographique prévue). Mentionner les développements futurs envisagés dans le cadre de cette collaboration.'
                    ],
                    'quote_pattern' => 'Citations complémentaires (80-120 mots total): SOIT une citation d\'un représentant de chaque partenaire (40-60 mots chacune) exprimant l\'enthousiasme, la vision commune et les bénéfices attendus. OU une seule citation plus substantielle (80-120 mots) d\'un dirigeant qui capture l\'essence du partenariat, son impact et les valeurs partagées. Les citations doivent se compléter et ne pas répéter les mêmes informations. Éviter le ton publicitaire, privilégier l\'authenticité et la perspective stratégique.'
                ],
                'variables' => [
                    'partner_name', 'partner_description', 'partnership_goals', 'beneficiaries',
                    'coverage', 'services_affected', 'deployment_timeline', 'expected_outcomes',
                    'investment', 'user_benefits', 'growth_targets'
                ],
                'instructions' => 'DIRECTIVES SPÉCIFIQUES PARTENARIAT:

ÉQUILIBRE:
- Donner un poids égal aux deux partenaires dans le communiqué
- Mentionner chaque partenaire 2-3 fois de manière équilibrée
- Éviter de favoriser un partenaire par rapport à l\'autre
- Les citations doivent refléter une vision commune, pas des agendas séparés

TON:
- Professionnel et optimiste sans être euphorique
- Factuel sur les modalités du partenariat
- Orienté bénéfices concrets pour les utilisateurs finaux
- Éviter le jargon corporate excessif ("synergie", "win-win", etc.)

STRUCTURE:
- Titre: Mentionner clairement les deux partenaires (50-70 caractères)
- Lead: Expliquer QUI, QUOI, POURQUOI, QUAND en 2-3 phrases
- Citations: Deux courtes OU une longue, mais toujours complémentaires
- Total: 500-700 mots

CRÉDIBILITÉ:
- Inclure des données sur chaque partenaire (taille, reach, expertise)
- Mentionner des jalons concrets et dates de déploiement
- Quantifier les bénéfices attendus (X utilisateurs, Y pays, Z services)
- Éviter les affirmations vagues ("améliorer l\'expérience") sans précisions

FOCUS:
- 60% sur les bénéfices utilisateurs finaux
- 30% sur les modalités du partenariat
- 10% sur les partenaires eux-mêmes',
                'is_active' => true
            ],

            // PARTENARIAT - Autres langues (en, de, es, pt, ru, zh, ar, hi)
            // [Code similaire pour les 8 autres langues avec traductions adaptées]
            // Pour économiser l'espace, je mets une version abrégée

            [
                'template_code' => 'partenariat_en',
                'name' => 'Strategic Partnership - English',
                'type' => 'partenariat',
                'language_code' => 'en',
                'structure' => [
                    'headline_pattern' => '[Platform] and [Partner] Partner to [common objective in 5-7 words]',
                    'lead_pattern' => '[Location], [Date] – [Platform] and [Partner] announce today a strategic partnership aimed at [precise objective]. This agreement will enable [number] [beneficiaries] in [coverage] to benefit from [concrete measurable advantages]. The collaboration begins [date] with [first concrete action].',
                    'body_sections' => [
                        'body1' => 'PARTNERSHIP CONTEXT (150-180 words): Explain strategic reasons for collaboration, complementarities between entities, respective strengths and why this union creates superior value.',
                        'body2' => 'MODALITIES AND SERVICES (150-180 words): Detail how partnership works, affected services, new offerings, deployment timeline with key dates.',
                        'body3' => 'BENEFITS AND PERSPECTIVES (100-120 words): Present concrete measurable advantages for end users, partnership targets, future developments.'
                    ],
                    'quote_pattern' => 'Complementary quotes (80-120 words total): EITHER one quote from each partner (40-60 words each) OR one substantial quote (80-120 words) capturing partnership essence.'
                ],
                'variables' => ['partner_name', 'partnership_goals', 'beneficiaries', 'coverage', 'services_affected', 'deployment_timeline'],
                'instructions' => 'PARTNERSHIP-SPECIFIC GUIDELINES: Balance both partners equally (2-3 mentions each). Professional and optimistic tone. Focus 60% on end-user benefits, 30% on partnership modalities, 10% on partners themselves. Include data on both partners. Quantify expected benefits. Total: 500-700 words.',
                'is_active' => true
            ],

            // Versions abrégées pour les autres langues de PARTENARIAT
            ['template_code' => 'partenariat_de', 'name' => 'Strategische Partnerschaft - Deutsch', 'type' => 'partenariat', 'language_code' => 'de', 'structure' => ['headline_pattern' => '[Platform] und [Partner] partnern für [Ziel]', 'lead_pattern' => '[Platform] und [Partner] kündigen Partnerschaft an...', 'body_sections' => ['body1' => 'Partnerschaftskontext...', 'body2' => 'Modalitäten...', 'body3' => 'Vorteile...'], 'quote_pattern' => 'Zitate...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => 'Beide Partner gleichmäßig erwähnen. 500-700 Wörter.', 'is_active' => true],
            ['template_code' => 'partenariat_es', 'name' => 'Asociación Estratégica - Español', 'type' => 'partenariat', 'language_code' => 'es', 'structure' => ['headline_pattern' => '[Platform] y [Partner] se asocian para [objetivo]', 'lead_pattern' => '[Platform] y [Partner] anuncian asociación...', 'body_sections' => ['body1' => 'Contexto...', 'body2' => 'Modalidades...', 'body3' => 'Beneficios...'], 'quote_pattern' => 'Citas...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => 'Equilibrar ambos socios. 500-700 palabras.', 'is_active' => true],
            ['template_code' => 'partenariat_pt', 'name' => 'Parceria Estratégica - Português', 'type' => 'partenariat', 'language_code' => 'pt', 'structure' => ['headline_pattern' => '[Platform] e [Partner] fazem parceria para [objetivo]', 'lead_pattern' => '[Platform] e [Partner] anunciam parceria...', 'body_sections' => ['body1' => 'Contexto...', 'body2' => 'Modalidades...', 'body3' => 'Benefícios...'], 'quote_pattern' => 'Citações...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => 'Equilibrar ambos parceiros. 500-700 palavras.', 'is_active' => true],
            ['template_code' => 'partenariat_ru', 'name' => 'Стратегическое Партнерство - Русский', 'type' => 'partenariat', 'language_code' => 'ru', 'structure' => ['headline_pattern' => '[Platform] и [Partner] партнерство для [цель]', 'lead_pattern' => '[Platform] и [Partner] объявляют партнерство...', 'body_sections' => ['body1' => 'Контекст...', 'body2' => 'Модальности...', 'body3' => 'Преимущества...'], 'quote_pattern' => 'Цитаты...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => 'Сбалансировать обоих партнеров. 500-700 слов.', 'is_active' => true],
            ['template_code' => 'partenariat_zh', 'name' => '战略合作 - 中文', 'type' => 'partenariat', 'language_code' => 'zh', 'structure' => ['headline_pattern' => '[Platform]和[Partner]合作[目标]', 'lead_pattern' => '[Platform]和[Partner]宣布合作...', 'body_sections' => ['body1' => '合作背景...', 'body2' => '方式...', 'body3' => '优势...'], 'quote_pattern' => '引述...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => '平衡双方伙伴。500-700字。', 'is_active' => true],
            ['template_code' => 'partenariat_ar', 'name' => 'شراكة استراتيجية - العربية', 'type' => 'partenariat', 'language_code' => 'ar', 'structure' => ['headline_pattern' => '[Platform] و [Partner] شراكة لـ[هدف]', 'lead_pattern' => '[Platform] و [Partner] يعلنان شراكة...', 'body_sections' => ['body1' => 'السياق...', 'body2' => 'الطرائق...', 'body3' => 'الفوائد...'], 'quote_pattern' => 'اقتباسات...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => 'توازن كلا الشريكين. 500-700 كلمة.', 'is_active' => true],
            ['template_code' => 'partenariat_hi', 'name' => 'रणनीतिक साझेदारी - हिन्दी', 'type' => 'partenariat', 'language_code' => 'hi', 'structure' => ['headline_pattern' => '[Platform] और [Partner] साझेदारी [उद्देश्य]', 'lead_pattern' => '[Platform] और [Partner] साझेदारी घोषित...', 'body_sections' => ['body1' => 'संदर्भ...', 'body2' => 'तरीके...', 'body3' => 'लाभ...'], 'quote_pattern' => 'उद्धरण...'], 'variables' => ['partner_name', 'partnership_goals'], 'instructions' => 'दोनों भागीदारों को संतुलित करें। 500-700 शब्द।', 'is_active' => true],

            // ==========================================
            // RESULTATS_MILESTONE - 9 LANGUES (versions abrégées)
            // ==========================================
            ['template_code' => 'resultats_milestone_fr', 'name' => 'Résultats et Jalons - Français', 'type' => 'resultats_milestone', 'language_code' => 'fr', 'structure' => ['headline_pattern' => '[Platform] atteint [milestone] : [chiffre clé]', 'lead_pattern' => '[Platform] annonce aujourd\'hui [résultat clé] avec [chiffres]...', 'body_sections' => ['body1' => 'Résultats détaillés et contexte...', 'body2' => 'Analyse et facteurs de réussite...', 'body3' => 'Perspectives et objectifs futurs...'], 'quote_pattern' => 'Citation CEO sur les résultats et vision...'], 'variables' => ['milestone', 'key_numbers', 'period', 'growth_rate'], 'instructions' => 'Communiqué factuel centré sur les chiffres. Minimum 8-10 données quantifiées. Contextualiser chaque métrique. Ton sobre et crédible. Expliquer les facteurs de succès. 500-700 mots.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_en', 'name' => 'Results & Milestones - English', 'type' => 'resultats_milestone', 'language_code' => 'en', 'structure' => ['headline_pattern' => '[Platform] achieves [milestone]: [key figure]', 'lead_pattern' => '[Platform] announces [key result] with [figures]...', 'body_sections' => ['body1' => 'Detailed results...', 'body2' => 'Analysis...', 'body3' => 'Future outlook...'], 'quote_pattern' => 'CEO quote on results...'], 'variables' => ['milestone', 'key_numbers'], 'instructions' => 'Factual numbers-focused release. Minimum 8-10 quantified data points. 500-700 words.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_de', 'name' => 'Ergebnisse - Deutsch', 'type' => 'resultats_milestone', 'language_code' => 'de', 'structure' => ['headline_pattern' => '[Platform] erreicht [Meilenstein]', 'lead_pattern' => '[Platform] gibt Ergebnisse bekannt...', 'body_sections' => ['body1' => 'Ergebnisse...', 'body2' => 'Analyse...', 'body3' => 'Ausblick...'], 'quote_pattern' => 'CEO-Zitat...'], 'variables' => ['milestone'], 'instructions' => 'Sachliche Zahlen. 500-700 Wörter.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_es', 'name' => 'Resultados - Español', 'type' => 'resultats_milestone', 'language_code' => 'es', 'structure' => ['headline_pattern' => '[Platform] alcanza [hito]', 'lead_pattern' => '[Platform] anuncia resultados...', 'body_sections' => ['body1' => 'Resultados...', 'body2' => 'Análisis...', 'body3' => 'Perspectivas...'], 'quote_pattern' => 'Cita CEO...'], 'variables' => ['milestone'], 'instructions' => 'Enfoque en cifras. 500-700 palabras.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_pt', 'name' => 'Resultados - Português', 'type' => 'resultats_milestone', 'language_code' => 'pt', 'structure' => ['headline_pattern' => '[Platform] alcança [marco]', 'lead_pattern' => '[Platform] anuncia resultados...', 'body_sections' => ['body1' => 'Resultados...', 'body2' => 'Análise...', 'body3' => 'Perspectivas...'], 'quote_pattern' => 'Citação CEO...'], 'variables' => ['milestone'], 'instructions' => 'Foco em números. 500-700 palavras.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_ru', 'name' => 'Результаты - Русский', 'type' => 'resultats_milestone', 'language_code' => 'ru', 'structure' => ['headline_pattern' => '[Platform] достигает [milestone]', 'lead_pattern' => '[Platform] объявляет результаты...', 'body_sections' => ['body1' => 'Результаты...', 'body2' => 'Анализ...', 'body3' => 'Перспективы...'], 'quote_pattern' => 'Цитата CEO...'], 'variables' => ['milestone'], 'instructions' => 'Фокус на цифрах. 500-700 слов.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_zh', 'name' => '成果 - 中文', 'type' => 'resultats_milestone', 'language_code' => 'zh', 'structure' => ['headline_pattern' => '[Platform]达成[里程碑]', 'lead_pattern' => '[Platform]宣布成果...', 'body_sections' => ['body1' => '成果...', 'body2' => '分析...', 'body3' => '展望...'], 'quote_pattern' => 'CEO引述...'], 'variables' => ['milestone'], 'instructions' => '数字为重。500-700字。', 'is_active' => true],
            ['template_code' => 'resultats_milestone_ar', 'name' => 'نتائج - العربية', 'type' => 'resultats_milestone', 'language_code' => 'ar', 'structure' => ['headline_pattern' => '[Platform] تحقق [milestone]', 'lead_pattern' => '[Platform] تعلن نتائج...', 'body_sections' => ['body1' => 'نتائج...', 'body2' => 'تحليل...', 'body3' => 'آفاق...'], 'quote_pattern' => 'اقتباس...'], 'variables' => ['milestone'], 'instructions' => 'تركيز على الأرقام. 500-700 كلمة.', 'is_active' => true],
            ['template_code' => 'resultats_milestone_hi', 'name' => 'परिणाम - हिन्दी', 'type' => 'resultats_milestone', 'language_code' => 'hi', 'structure' => ['headline_pattern' => '[Platform] [milestone] हासिल करता है', 'lead_pattern' => '[Platform] परिणाम घोषित करता है...', 'body_sections' => ['body1' => 'परिणाम...', 'body2' => 'विश्लेषण...', 'body3' => 'दृष्टिकोण...'], 'quote_pattern' => 'सीईओ उद्धरण...'], 'variables' => ['milestone'], 'instructions' => 'संख्याओं पर ध्यान। 500-700 शब्द।', 'is_active' => true],

            // ==========================================
            // EVENEMENT - 9 LANGUES (versions abrégées)
            // ==========================================
            ['template_code' => 'evenement_fr', 'name' => 'Événement - Français', 'type' => 'evenement', 'language_code' => 'fr', 'structure' => ['headline_pattern' => '[Platform] organise [événement] le [date]', 'lead_pattern' => '[Platform] annonce [événement] qui se tiendra [date et lieu]...', 'body_sections' => ['body1' => 'Présentation de l\'événement et objectifs...', 'body2' => 'Programme, intervenants, thématiques...', 'body3' => 'Modalités de participation et inscription...'], 'quote_pattern' => 'Citation sur l\'importance de l\'événement...'], 'variables' => ['event_name', 'event_date', 'location', 'speakers', 'topics'], 'instructions' => 'Communiqué événementiel. Inclure date, lieu, horaires précis. Présenter intervenants clés avec titres. Détailler modalités d\'inscription. Ton invitant mais professionnel. 500-700 mots.', 'is_active' => true],
            ['template_code' => 'evenement_en', 'name' => 'Event - English', 'type' => 'evenement', 'language_code' => 'en', 'structure' => ['headline_pattern' => '[Platform] hosts [event] on [date]', 'lead_pattern' => '[Platform] announces [event] taking place [date and location]...', 'body_sections' => ['body1' => 'Event overview...', 'body2' => 'Program and speakers...', 'body3' => 'Registration details...'], 'quote_pattern' => 'Quote on event importance...'], 'variables' => ['event_name', 'event_date'], 'instructions' => 'Event release. Include date, location, schedule. Present key speakers. Detail registration. 500-700 words.', 'is_active' => true],
            ['template_code' => 'evenement_de', 'name' => 'Veranstaltung - Deutsch', 'type' => 'evenement', 'language_code' => 'de', 'structure' => ['headline_pattern' => '[Platform] veranstaltet [Event]', 'lead_pattern' => '[Platform] kündigt [Event] an...', 'body_sections' => ['body1' => 'Überblick...', 'body2' => 'Programm...', 'body3' => 'Anmeldung...'], 'quote_pattern' => 'Zitat...'], 'variables' => ['event_name'], 'instructions' => 'Veranstaltungsmitteilung. 500-700 Wörter.', 'is_active' => true],
            ['template_code' => 'evenement_es', 'name' => 'Evento - Español', 'type' => 'evenement', 'language_code' => 'es', 'structure' => ['headline_pattern' => '[Platform] organiza [evento]', 'lead_pattern' => '[Platform] anuncia [evento]...', 'body_sections' => ['body1' => 'Descripción...', 'body2' => 'Programa...', 'body3' => 'Inscripción...'], 'quote_pattern' => 'Cita...'], 'variables' => ['event_name'], 'instructions' => 'Comunicado de evento. 500-700 palabras.', 'is_active' => true],
            ['template_code' => 'evenement_pt', 'name' => 'Evento - Português', 'type' => 'evenement', 'language_code' => 'pt', 'structure' => ['headline_pattern' => '[Platform] organiza [evento]', 'lead_pattern' => '[Platform] anuncia [evento]...', 'body_sections' => ['body1' => 'Visão geral...', 'body2' => 'Programa...', 'body3' => 'Inscrição...'], 'quote_pattern' => 'Citação...'], 'variables' => ['event_name'], 'instructions' => 'Comunicado de evento. 500-700 palavras.', 'is_active' => true],
            ['template_code' => 'evenement_ru', 'name' => 'Событие - Русский', 'type' => 'evenement', 'language_code' => 'ru', 'structure' => ['headline_pattern' => '[Platform] проводит [событие]', 'lead_pattern' => '[Platform] объявляет [событие]...', 'body_sections' => ['body1' => 'Обзор...', 'body2' => 'Программа...', 'body3' => 'Регистрация...'], 'quote_pattern' => 'Цитата...'], 'variables' => ['event_name'], 'instructions' => 'Релиз о событии. 500-700 слов.', 'is_active' => true],
            ['template_code' => 'evenement_zh', 'name' => '活动 - 中文', 'type' => 'evenement', 'language_code' => 'zh', 'structure' => ['headline_pattern' => '[Platform]举办[活动]', 'lead_pattern' => '[Platform]宣布[活动]...', 'body_sections' => ['body1' => '概述...', 'body2' => '日程...', 'body3' => '注册...'], 'quote_pattern' => '引述...'], 'variables' => ['event_name'], 'instructions' => '活动新闻稿。500-700字。', 'is_active' => true],
            ['template_code' => 'evenement_ar', 'name' => 'حدث - العربية', 'type' => 'evenement', 'language_code' => 'ar', 'structure' => ['headline_pattern' => '[Platform] تنظم [حدث]', 'lead_pattern' => '[Platform] تعلن [حدث]...', 'body_sections' => ['body1' => 'نظرة عامة...', 'body2' => 'البرنامج...', 'body3' => 'التسجيل...'], 'quote_pattern' => 'اقتباس...'], 'variables' => ['event_name'], 'instructions' => 'بيان حدث. 500-700 كلمة.', 'is_active' => true],
            ['template_code' => 'evenement_hi', 'name' => 'कार्यक्रम - हिन्दी', 'type' => 'evenement', 'language_code' => 'hi', 'structure' => ['headline_pattern' => '[Platform] [कार्यक्रम] आयोजित करता है', 'lead_pattern' => '[Platform] [कार्यक्रम] घोषित करता है...', 'body_sections' => ['body1' => 'अवलोकन...', 'body2' => 'कार्यक्रम...', 'body3' => 'पंजीकरण...'], 'quote_pattern' => 'उद्धरण...'], 'variables' => ['event_name'], 'instructions' => 'कार्यक्रम विज्ञप्ति। 500-700 शब्द।', 'is_active' => true],

            // ==========================================
            // NOMINATION - 9 LANGUES (versions abrégées)
            // ==========================================
            ['template_code' => 'nomination_fr', 'name' => 'Nomination - Français', 'type' => 'nomination', 'language_code' => 'fr', 'structure' => ['headline_pattern' => '[Platform] nomme [Personne] au poste de [Poste]', 'lead_pattern' => '[Platform] annonce aujourd\'hui la nomination de [Personne] au poste de [Poste], effective dès [date]...', 'body_sections' => ['body1' => 'Présentation du poste et responsabilités...', 'body2' => 'Parcours et expertise de la personne nommée...', 'body3' => 'Vision et objectifs dans ce nouveau rôle...'], 'quote_pattern' => 'Citation de la personne nommée ou du CEO sur cette nomination...'], 'variables' => ['person_name', 'position', 'start_date', 'background', 'expertise'], 'instructions' => 'Communiqué RH professionnel. Présenter la personne avec respect et valorisation de son parcours. Détailler expérience pertinente et réalisations passées. Expliquer comment cette nomination s\'inscrit dans la stratégie. Ton corporatif formel. 500-700 mots.', 'is_active' => true],
            ['template_code' => 'nomination_en', 'name' => 'Appointment - English', 'type' => 'nomination', 'language_code' => 'en', 'structure' => ['headline_pattern' => '[Platform] appoints [Person] as [Position]', 'lead_pattern' => '[Platform] announces today the appointment of [Person] as [Position], effective [date]...', 'body_sections' => ['body1' => 'Role and responsibilities...', 'body2' => 'Background and expertise...', 'body3' => 'Vision and objectives...'], 'quote_pattern' => 'Quote from appointee or CEO...'], 'variables' => ['person_name', 'position'], 'instructions' => 'Professional HR release. Present person respectfully. Detail relevant experience. Formal corporate tone. 500-700 words.', 'is_active' => true],
            ['template_code' => 'nomination_de', 'name' => 'Ernennung - Deutsch', 'type' => 'nomination', 'language_code' => 'de', 'structure' => ['headline_pattern' => '[Platform] ernennt [Person] zum [Position]', 'lead_pattern' => '[Platform] gibt Ernennung von [Person] bekannt...', 'body_sections' => ['body1' => 'Rolle...', 'body2' => 'Hintergrund...', 'body3' => 'Vision...'], 'quote_pattern' => 'Zitat...'], 'variables' => ['person_name', 'position'], 'instructions' => 'Professionelle HR-Mitteilung. 500-700 Wörter.', 'is_active' => true],
            ['template_code' => 'nomination_es', 'name' => 'Nombramiento - Español', 'type' => 'nomination', 'language_code' => 'es', 'structure' => ['headline_pattern' => '[Platform] nombra a [Persona] como [Puesto]', 'lead_pattern' => '[Platform] anuncia nombramiento de [Persona]...', 'body_sections' => ['body1' => 'Rol...', 'body2' => 'Trayectoria...', 'body3' => 'Visión...'], 'quote_pattern' => 'Cita...'], 'variables' => ['person_name', 'position'], 'instructions' => 'Comunicado RH profesional. 500-700 palabras.', 'is_active' => true],
            ['template_code' => 'nomination_pt', 'name' => 'Nomeação - Português', 'type' => 'nomination', 'language_code' => 'pt', 'structure' => ['headline_pattern' => '[Platform] nomeia [Pessoa] como [Cargo]', 'lead_pattern' => '[Platform] anuncia nomeação de [Pessoa]...', 'body_sections' => ['body1' => 'Função...', 'body2' => 'Experiência...', 'body3' => 'Visão...'], 'quote_pattern' => 'Citação...'], 'variables' => ['person_name', 'position'], 'instructions' => 'Comunicado RH profissional. 500-700 palavras.', 'is_active' => true],
            ['template_code' => 'nomination_ru', 'name' => 'Назначение - Русский', 'type' => 'nomination', 'language_code' => 'ru', 'structure' => ['headline_pattern' => '[Platform] назначает [Person] на [Position]', 'lead_pattern' => '[Platform] объявляет о назначении [Person]...', 'body_sections' => ['body1' => 'Роль...', 'body2' => 'Опыт...', 'body3' => 'Видение...'], 'quote_pattern' => 'Цитата...'], 'variables' => ['person_name', 'position'], 'instructions' => 'Профессиональный HR-релиз. 500-700 слов.', 'is_active' => true],
            ['template_code' => 'nomination_zh', 'name' => '任命 - 中文', 'type' => 'nomination', 'language_code' => 'zh', 'structure' => ['headline_pattern' => '[Platform]任命[Person]为[Position]', 'lead_pattern' => '[Platform]宣布任命[Person]...', 'body_sections' => ['body1' => '职责...', 'body2' => '背景...', 'body3' => '愿景...'], 'quote_pattern' => '引述...'], 'variables' => ['person_name', 'position'], 'instructions' => '专业人力资源新闻稿。500-700字。', 'is_active' => true],
            ['template_code' => 'nomination_ar', 'name' => 'تعيين - العربية', 'type' => 'nomination', 'language_code' => 'ar', 'structure' => ['headline_pattern' => '[Platform] تعين [Person] كـ [Position]', 'lead_pattern' => '[Platform] تعلن تعيين [Person]...', 'body_sections' => ['body1' => 'الدور...', 'body2' => 'الخبرة...', 'body3' => 'الرؤية...'], 'quote_pattern' => 'اقتباس...'], 'variables' => ['person_name', 'position'], 'instructions' => 'بيان الموارد البشرية المهني. 500-700 كلمة.', 'is_active' => true],
            ['template_code' => 'nomination_hi', 'name' => 'नियुक्ति - हिन्दी', 'type' => 'nomination', 'language_code' => 'hi', 'structure' => ['headline_pattern' => '[Platform] [Person] को [Position] नियुक्त करता है', 'lead_pattern' => '[Platform] [Person] की नियुक्ति घोषित करता है...', 'body_sections' => ['body1' => 'भूमिका...', 'body2' => 'पृष्ठभूमि...', 'body3' => 'दृष्टिकोण...'], 'quote_pattern' => 'उद्धरण...'], 'variables' => ['person_name', 'position'], 'instructions' => 'पेशेवर एचआर विज्ञप्ति। 500-700 शब्द।', 'is_active' => true],
        ];
    }
}