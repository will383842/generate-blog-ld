<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\AuthorTranslation;
use Illuminate\Database\Seeder;

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
            
            // Expert Immigration Asie
            [
                'slug' => 'jean-martin-immigration',
                'name' => 'Jean Martin',
                'email' => 'j.martin@sos-expat.com',
                'photo_url' => '/images/authors/jean-martin.jpg',
                'credentials' => ['Avocat en droit international', '15 ans d\'expérience', 'Expert visas Asie'],
                'countries' => ['TH', 'VN', 'SG', 'MY', 'ID', 'PH', 'KH', 'LA', 'MM'],
                'specialties' => ['immigration', 'visa', 'permis_travail'],
                'themes' => ['expatriation'],
                'linkedin_url' => 'https://linkedin.com/in/jean-martin-immigration',
                'is_default' => false,
                'translations' => [
                    'fr' => [
                        'bio' => "Avocat spécialisé en droit de l'immigration, Jean Martin conseille les expatriés en Asie du Sud-Est depuis 15 ans. Basé à Bangkok, il maîtrise les procédures de visa de toute la région.",
                        'job_title' => 'Avocat en droit de l\'immigration',
                    ],
                    'en' => [
                        'bio' => "Immigration law specialist Jean Martin has been advising expats in Southeast Asia for 15 years. Based in Bangkok, he masters visa procedures across the region.",
                        'job_title' => 'Immigration Lawyer',
                    ],
                ],
            ],
            
            // Expert Fiscal Europe
            [
                'slug' => 'marie-dupont-fiscal',
                'name' => 'Marie Dupont',
                'email' => 'm.dupont@sos-expat.com',
                'photo_url' => '/images/authors/marie-dupont.jpg',
                'credentials' => ['Expert-comptable', 'Fiscalité internationale', '12 ans d\'expérience'],
                'countries' => ['ES', 'PT', 'DE', 'FR', 'IT', 'BE', 'NL', 'CH'],
                'specialties' => ['fiscal', 'comptabilite', 'creation_entreprise'],
                'themes' => ['expatriation', 'fondateur'],
                'linkedin_url' => 'https://linkedin.com/in/marie-dupont-fiscal',
                'is_default' => false,
                'translations' => [
                    'fr' => [
                        'bio' => "Expert-comptable spécialisée en fiscalité internationale, Marie Dupont accompagne les entrepreneurs expatriés en Europe depuis 12 ans.",
                        'job_title' => 'Expert-comptable, fiscalité internationale',
                    ],
                    'en' => [
                        'bio' => "International tax specialist Marie Dupont has been supporting expat entrepreneurs in Europe for 12 years.",
                        'job_title' => 'Chartered Accountant, International Tax',
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
