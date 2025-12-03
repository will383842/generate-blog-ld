<?php

namespace Database\Seeders;

use App\Models\Platform;
use App\Models\ProviderType;
use App\Models\ProviderTypeTranslation;
use Illuminate\Database\Seeder;

class ProviderTypeSeeder extends Seeder
{
    /**
     * Seeder pour les types de prestataires - VERSION CORRIGÉE
     * 
     * 3 plateformes :
     * - SOS-EXPAT (8 types)
     * - ULIXAI (8 types)
     * - ULYSSE.AI (1 type)
     * 
     * ARCHITECTURE DE TRADUCTION:
     * - name_fr et name_en dans provider_types (table principale)
     * - Autres langues (de, es, pt, ru, zh, ar, hi) dans provider_type_translations
     */
    public function run(): void
    {
        $platforms = Platform::pluck('id', 'slug')->toArray();
        
        $providerTypes = [
            // ═══════════════════════════════════════════════════════════════
            // SOS-EXPAT - Types de prestataires d'urgence
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'sos-expat',
                'slug' => 'avocat',
                'icon' => 'scale',
                'color' => '#1E40AF',
                'order' => 1,
                'translations' => [
                    'fr' => 'Avocat',
                    'en' => 'Lawyer',
                    'de' => 'Anwalt',
                    'es' => 'Abogado',
                    'pt' => 'Advogado',
                    'ru' => 'Адвокат',
                    'zh' => '律师',
                    'ar' => 'محامي',
                    'hi' => 'वकील',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'medecin',
                'icon' => 'heart',
                'color' => '#DC2626',
                'order' => 2,
                'translations' => [
                    'fr' => 'Médecin',
                    'en' => 'Doctor',
                    'de' => 'Arzt',
                    'es' => 'Médico',
                    'pt' => 'Médico',
                    'ru' => 'Врач',
                    'zh' => '医生',
                    'ar' => 'طبيب',
                    'hi' => 'डॉक्टर',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'psychologue',
                'icon' => 'brain',
                'color' => '#7C3AED',
                'order' => 3,
                'translations' => [
                    'fr' => 'Psychologue',
                    'en' => 'Psychologist',
                    'de' => 'Psychologe',
                    'es' => 'Psicólogo',
                    'pt' => 'Psicólogo',
                    'ru' => 'Психолог',
                    'zh' => '心理学家',
                    'ar' => 'طبيب نفسي',
                    'hi' => 'मनोवैज्ञानिक',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'comptable',
                'icon' => 'calculator',
                'color' => '#059669',
                'order' => 4,
                'translations' => [
                    'fr' => 'Comptable',
                    'en' => 'Accountant',
                    'de' => 'Buchhalter',
                    'es' => 'Contador',
                    'pt' => 'Contabilista',
                    'ru' => 'Бухгалтер',
                    'zh' => '会计师',
                    'ar' => 'محاسب',
                    'hi' => 'लेखाकार',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'notaire',
                'icon' => 'document-text',
                'color' => '#D97706',
                'order' => 5,
                'translations' => [
                    'fr' => 'Notaire',
                    'en' => 'Notary',
                    'de' => 'Notar',
                    'es' => 'Notario',
                    'pt' => 'Notário',
                    'ru' => 'Нотариус',
                    'zh' => '公证人',
                    'ar' => 'كاتب عدل',
                    'hi' => 'नोटरी',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'traducteur',
                'icon' => 'language',
                'color' => '#0891B2',
                'order' => 6,
                'translations' => [
                    'fr' => 'Traducteur Assermenté',
                    'en' => 'Sworn Translator',
                    'de' => 'Beeidigter Übersetzer',
                    'es' => 'Traductor Jurado',
                    'pt' => 'Tradutor Juramentado',
                    'ru' => 'Присяжный переводчик',
                    'zh' => '宣誓翻译',
                    'ar' => 'مترجم محلف',
                    'hi' => 'शपथ अनुवादक',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'conseiller-fiscal',
                'icon' => 'currency-dollar',
                'color' => '#10B981',
                'order' => 7,
                'translations' => [
                    'fr' => 'Conseiller Fiscal',
                    'en' => 'Tax Advisor',
                    'de' => 'Steuerberater',
                    'es' => 'Asesor Fiscal',
                    'pt' => 'Consultor Fiscal',
                    'ru' => 'Налоговый консультант',
                    'zh' => '税务顾问',
                    'ar' => 'مستشار ضرائب',
                    'hi' => 'कर सलाहकार',
                ],
            ],
            [
                'platform' => 'sos-expat',
                'slug' => 'coach-expatriation',
                'icon' => 'user-group',
                'color' => '#8B5CF6',
                'order' => 8,
                'translations' => [
                    'fr' => 'Coach Expatriation',
                    'en' => 'Expat Coach',
                    'de' => 'Expat-Coach',
                    'es' => 'Coach de Expatriación',
                    'pt' => 'Coach de Expatriação',
                    'ru' => 'Коуч по экспатриации',
                    'zh' => '外派教练',
                    'ar' => 'مدرب المغتربين',
                    'hi' => 'प्रवासी कोच',
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // ULIXAI - Types de prestataires marketplace
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulixai',
                'slug' => 'demenageur',
                'icon' => 'truck',
                'color' => '#F59E0B',
                'order' => 1,
                'translations' => [
                    'fr' => 'Déménageur',
                    'en' => 'Mover',
                    'de' => 'Umzugsunternehmen',
                    'es' => 'Empresa de mudanzas',
                    'pt' => 'Empresa de mudanças',
                    'ru' => 'Грузоперевозчик',
                    'zh' => '搬家公司',
                    'ar' => 'شركة نقل',
                    'hi' => 'मूवर',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'agent-immobilier',
                'icon' => 'home',
                'color' => '#3B82F6',
                'order' => 2,
                'translations' => [
                    'fr' => 'Agent Immobilier',
                    'en' => 'Real Estate Agent',
                    'de' => 'Immobilienmakler',
                    'es' => 'Agente Inmobiliario',
                    'pt' => 'Agente Imobiliário',
                    'ru' => 'Риелтор',
                    'zh' => '房地产经纪人',
                    'ar' => 'وكيل عقارات',
                    'hi' => 'रियल एस्टेट एजेंट',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'relocation-manager',
                'icon' => 'globe',
                'color' => '#6366F1',
                'order' => 3,
                'translations' => [
                    'fr' => 'Relocation Manager',
                    'en' => 'Relocation Manager',
                    'de' => 'Relocation Manager',
                    'es' => 'Gestor de Reubicación',
                    'pt' => 'Gestor de Relocalização',
                    'ru' => 'Менеджер по релокации',
                    'zh' => '搬迁经理',
                    'ar' => 'مدير النقل',
                    'hi' => 'स्थानांतरण प्रबंधक',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'assureur',
                'icon' => 'shield-check',
                'color' => '#10B981',
                'order' => 4,
                'translations' => [
                    'fr' => 'Assureur',
                    'en' => 'Insurance Agent',
                    'de' => 'Versicherungsvertreter',
                    'es' => 'Agente de Seguros',
                    'pt' => 'Agente de Seguros',
                    'ru' => 'Страховой агент',
                    'zh' => '保险代理人',
                    'ar' => 'وكيل تأمين',
                    'hi' => 'बीमा एजेंट',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'banquier',
                'icon' => 'building-bank',
                'color' => '#14B8A6',
                'order' => 5,
                'translations' => [
                    'fr' => 'Banquier',
                    'en' => 'Banker',
                    'de' => 'Bankier',
                    'es' => 'Banquero',
                    'pt' => 'Banqueiro',
                    'ru' => 'Банкир',
                    'zh' => '银行家',
                    'ar' => 'مصرفي',
                    'hi' => 'बैंकर',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'gestionnaire-patrimoine',
                'icon' => 'chart-bar',
                'color' => '#8B5CF6',
                'order' => 6,
                'translations' => [
                    'fr' => 'Gestionnaire de Patrimoine',
                    'en' => 'Wealth Manager',
                    'de' => 'Vermögensverwalter',
                    'es' => 'Gestor de Patrimonio',
                    'pt' => 'Gestor de Património',
                    'ru' => 'Управляющий активами',
                    'zh' => '财富管理师',
                    'ar' => 'مدير الثروة',
                    'hi' => 'धन प्रबंधक',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'conseiller-education',
                'icon' => 'academic-cap',
                'color' => '#EC4899',
                'order' => 7,
                'translations' => [
                    'fr' => 'Conseiller Éducation',
                    'en' => 'Education Consultant',
                    'de' => 'Bildungsberater',
                    'es' => 'Asesor Educativo',
                    'pt' => 'Consultor de Educação',
                    'ru' => 'Консультант по образованию',
                    'zh' => '教育顾问',
                    'ar' => 'مستشار تعليمي',
                    'hi' => 'शिक्षा सलाहकार',
                ],
            ],
            [
                'platform' => 'ulixai',
                'slug' => 'pet-relocation',
                'icon' => 'paw',
                'color' => '#F59E0B',
                'order' => 8,
                'translations' => [
                    'fr' => 'Transport Animaux',
                    'en' => 'Pet Relocation',
                    'de' => 'Tiertransport',
                    'es' => 'Transporte de Mascotas',
                    'pt' => 'Transporte de Animais',
                    'ru' => 'Перевозка животных',
                    'zh' => '宠物搬迁',
                    'ar' => 'نقل الحيوانات الأليفة',
                    'hi' => 'पालतू जानवर स्थानांतरण',
                ],
            ],
            
            // ═══════════════════════════════════════════════════════════════
            // ULYSSE.AI - Types pour assistant IA
            // ═══════════════════════════════════════════════════════════════
            [
                'platform' => 'ulysse',
                'slug' => 'assistant-ia',
                'icon' => 'cpu-chip',
                'color' => '#06B6D4',
                'order' => 1,
                'translations' => [
                    'fr' => 'Assistant IA',
                    'en' => 'AI Assistant',
                    'de' => 'KI-Assistent',
                    'es' => 'Asistente IA',
                    'pt' => 'Assistente IA',
                    'ru' => 'ИИ-ассистент',
                    'zh' => 'AI助手',
                    'ar' => 'مساعد الذكاء الاصطناعي',
                    'hi' => 'AI सहायक',
                ],
            ],
        ];

        echo "🌱 Insertion de " . count($providerTypes) . " types de prestataires...\n";

        foreach ($providerTypes as $data) {
            if (!isset($platforms[$data['platform']])) {
                echo "⚠️  Plateforme '{$data['platform']}' introuvable, passage au suivant...\n";
                continue;
            }
            
            // ✅ ÉTAPE 1: Créer le type de prestataire principal (seulement FR et EN)
            $providerType = ProviderType::create([
                'platform_id' => $platforms[$data['platform']],
                'slug' => $data['slug'],
                'name_fr' => $data['translations']['fr'],
                'name_en' => $data['translations']['en'],
                'icon' => $data['icon'] ?? null,
                'color' => $data['color'] ?? null,
                'order' => $data['order'],
                'is_active' => true,
            ]);

            // ✅ ÉTAPE 2: Créer les traductions pour les 7 autres langues
            $languages = ['de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];
            
            foreach ($languages as $lang) {
                if (isset($data['translations'][$lang])) {
                    ProviderTypeTranslation::create([
                        'provider_type_id' => $providerType->id,
                        'language_code' => $lang,
                        'singular' => $data['translations'][$lang],
                        'plural' => $data['translations'][$lang] . 's', // Pluriel simple
                        'slug' => $data['slug'],
                    ]);
                }
            }
        }

        echo "✅ " . count($providerTypes) . " types de prestataires insérés\n";
        echo "✅ Traductions créées pour 7 langues\n";
    }
}