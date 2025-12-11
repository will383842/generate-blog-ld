<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\AuthorTranslation;
use Illuminate\Database\Seeder;

/**
 * AuthorSeeder - Création des profils auteurs E-E-A-T
 * 
 * PRODUCTION READY - Version avec Manon d'Ulixai
 */
class AuthorSeeder extends Seeder
{
    public function run(): void
    {
        $authors = [
            // Auteur par défaut (SOS-Expat)
            [
                'slug' => 'sos-expat',
                'name' => 'Équipe SOS-Expat',
                'email' => 'redaction@sos-expat.com',
                'photo_url' => '/images/authors/sos-expat-team.jpg',
                'credentials' => ['Experts expatriation', 'Réseau international', 'Depuis 2020'],
                'countries' => [], // Tous les pays
                'specialties' => [], // Toutes spécialités
                'themes' => ['expatriation', 'affiliation', 'fondateur'],
                'linkedin_url' => 'https://linkedin.com/company/sos-expat',
                'website_url' => 'https://sos-expat.com',
                'is_default' => true,
                'translations' => [
                    'fr' => [
                        'bio' => "L'équipe SOS-Expat accompagne les expatriés du monde entier depuis 2020. Notre mission : que personne ne soit seul à l'étranger.",
                        'job_title' => 'Équipe éditoriale SOS-Expat',
                    ],
                    'en' => [
                        'bio' => "The SOS-Expat team has been supporting expats worldwide since 2020. Our mission: no one should be alone abroad.",
                        'job_title' => 'SOS-Expat Editorial Team',
                    ],
                    'de' => [
                        'bio' => "Das SOS-Expat-Team unterstützt Expats weltweit seit 2020. Unsere Mission: Niemand sollte im Ausland allein sein.",
                        'job_title' => 'SOS-Expat Redaktionsteam',
                    ],
                    'es' => [
                        'bio' => "El equipo de SOS-Expat apoya a los expatriados de todo el mundo desde 2020. Nuestra misión: nadie debería estar solo en el extranjero.",
                        'job_title' => 'Equipo editorial SOS-Expat',
                    ],
                    'pt' => [
                        'bio' => "A equipe SOS-Expat apoia expatriados em todo o mundo desde 2020. Nossa missão: ninguém deve estar sozinho no exterior.",
                        'job_title' => 'Equipe editorial SOS-Expat',
                    ],
                    'ru' => [
                        'bio' => "Команда SOS-Expat поддерживает экспатов по всему миру с 2020 года. Наша миссия: никто не должен быть одинок за границей.",
                        'job_title' => 'Редакционная команда SOS-Expat',
                    ],
                    'zh' => [
                        'bio' => "SOS-Expat团队自2020年以来一直支持全球外籍人士。我们的使命：没有人应该在国外孤独。",
                        'job_title' => 'SOS-Expat编辑团队',
                    ],
                    'ar' => [
                        'bio' => "يدعم فريق SOS-Expat المغتربين في جميع أنحاء العالم منذ عام 2020. مهمتنا: لا ينبغي لأحد أن يكون وحيداً في الخارج.",
                        'job_title' => 'فريق تحرير SOS-Expat',
                    ],
                    'hi' => [
                        'bio' => "SOS-Expat टीम 2020 से दुनिया भर में प्रवासियों का समर्थन कर रही है। हमारा मिशन: विदेश में कोई अकेला नहीं होना चाहिए।",
                        'job_title' => 'SOS-Expat संपादकीय टीम',
                    ],
                ],
            ],
            
            // Manon - Expert Ulixai
            [
                'slug' => 'manon-ulixai',
                'name' => 'Manon',
                'email' => 'manon@ulixai.com',
                'photo_url' => '/images/authors/manon-ulixai.jpg',
                'credentials' => ['Expert services expatriés', 'Marketplace Ulixai', 'International'],
                'countries' => [], // Tous les pays
                'specialties' => ['services', 'quotidien', 'marketplace'],
                'themes' => ['expatriation', 'affiliation'],
                'linkedin_url' => 'https://linkedin.com/in/manon-ulixai',
                'website_url' => 'https://ulixai.com',
                'is_default' => false,
                'translations' => [
                    'fr' => [
                        'bio' => "Expert Ulixai, Manon accompagne les expatriés dans leur quotidien à l'étranger en les connectant aux meilleurs prestataires de services locaux.",
                        'job_title' => 'Expert Services Expatriés',
                    ],
                    'en' => [
                        'bio' => "Ulixai expert, Manon helps expats in their daily life abroad by connecting them with the best local service providers.",
                        'job_title' => 'Expat Services Expert',
                    ],
                    'de' => [
                        'bio' => "Ulixai-Expertin Manon unterstützt Expats in ihrem Alltag im Ausland, indem sie sie mit den besten lokalen Dienstleistern verbindet.",
                        'job_title' => 'Expertin für Expat-Dienstleistungen',
                    ],
                    'es' => [
                        'bio' => "Experta de Ulixai, Manon ayuda a los expatriados en su vida diaria en el extranjero conectándolos con los mejores proveedores de servicios locales.",
                        'job_title' => 'Experta en Servicios para Expatriados',
                    ],
                    'pt' => [
                        'bio' => "Especialista da Ulixai, Manon ajuda expatriados no seu dia a dia no exterior, conectando-os aos melhores prestadores de serviços locais.",
                        'job_title' => 'Especialista em Serviços para Expatriados',
                    ],
                    'ru' => [
                        'bio' => "Эксперт Ulixai, Манон помогает экспатам в их повседневной жизни за границей, связывая их с лучшими местными поставщиками услуг.",
                        'job_title' => 'Эксперт по услугам для экспатов',
                    ],
                    'zh' => [
                        'bio' => "Ulixai专家Manon通过将外籍人士与最好的本地服务提供商联系起来，帮助他们在国外的日常生活。",
                        'job_title' => '外籍人士服务专家',
                    ],
                    'ar' => [
                        'bio' => "خبيرة Ulixai، مانون تساعد المغتربين في حياتهم اليومية في الخارج من خلال ربطهم بأفضل مقدمي الخدمات المحليين.",
                        'job_title' => 'خبيرة خدمات المغتربين',
                    ],
                    'hi' => [
                        'bio' => "Ulixai विशेषज्ञ, मैनन विदेश में प्रवासियों को स्थानीय सेवा प्रदाताओं से जोड़कर उनके दैनिक जीवन में मदद करती हैं।",
                        'job_title' => 'प्रवासी सेवा विशेषज्ञ',
                    ],
                ],
            ],
            
            // Ulixai Team
            [
                'slug' => 'ulixai-team',
                'name' => 'Équipe Ulixai',
                'email' => 'redaction@ulixai.com',
                'photo_url' => '/images/authors/ulixai-team.jpg',
                'credentials' => ['Marketplace expat', 'Services quotidien', 'International'],
                'countries' => [],
                'specialties' => [],
                'themes' => ['expatriation'],
                'website_url' => 'https://ulixai.com',
                'is_default' => false,
                'translations' => [
                    'fr' => [
                        'bio' => "Ulixai est la marketplace des services pour expatriés. Notre équipe éditoriale partage conseils et bonnes pratiques pour faciliter votre vie à l'étranger.",
                        'job_title' => 'Équipe éditoriale Ulixai',
                    ],
                    'en' => [
                        'bio' => "Ulixai is the expat services marketplace. Our editorial team shares tips and best practices to make your life abroad easier.",
                        'job_title' => 'Ulixai Editorial Team',
                    ],
                    'de' => [
                        'bio' => "Ulixai ist der Marktplatz für Expat-Dienstleistungen. Unser Redaktionsteam teilt Tipps und Best Practices, um Ihr Leben im Ausland zu erleichtern.",
                        'job_title' => 'Ulixai Redaktionsteam',
                    ],
                    'es' => [
                        'bio' => "Ulixai es el marketplace de servicios para expatriados. Nuestro equipo editorial comparte consejos y mejores prácticas para facilitar su vida en el extranjero.",
                        'job_title' => 'Equipo editorial Ulixai',
                    ],
                    'pt' => [
                        'bio' => "Ulixai é o marketplace de serviços para expatriados. Nossa equipe editorial compartilha dicas e melhores práticas para facilitar sua vida no exterior.",
                        'job_title' => 'Equipe editorial Ulixai',
                    ],
                    'ru' => [
                        'bio' => "Ulixai - это торговая площадка услуг для экспатов. Наша редакционная команда делится советами и лучшими практиками, чтобы облегчить вашу жизнь за границей.",
                        'job_title' => 'Редакционная команда Ulixai',
                    ],
                    'zh' => [
                        'bio' => "Ulixai是外籍人士服务市场。我们的编辑团队分享技巧和最佳实践，让您的国外生活更轻松。",
                        'job_title' => 'Ulixai编辑团队',
                    ],
                    'ar' => [
                        'bio' => "Ulixai هو سوق خدمات المغتربين. يشارك فريقنا التحريري النصائح وأفضل الممارسات لتسهيل حياتك في الخارج.",
                        'job_title' => 'فريق تحرير Ulixai',
                    ],
                    'hi' => [
                        'bio' => "Ulixai प्रवासी सेवाओं का बाज़ार है। हमारी संपादकीय टीम आपके विदेश में जीवन को आसान बनाने के लिए सुझाव और सर्वोत्तम प्रथाएं साझा करती है।",
                        'job_title' => 'Ulixai संपादकीय टीम',
                    ],
                ],
            ],
        ];

        foreach ($authors as $authorData) {
            $translations = $authorData['translations'] ?? [];
            unset($authorData['translations']);
            
            $author = Author::updateOrCreate(
                ['slug' => $authorData['slug']],
                $authorData
            );
            
            foreach ($translations as $langCode => $translation) {
                AuthorTranslation::updateOrCreate(
                    [
                        'author_id' => $author->id,
                        'language_code' => $langCode,
                    ],
                    $translation
                );
            }
        }

        $this->command->info('✓ ' . count($authors) . ' auteurs E-E-A-T créés');
    }
}
