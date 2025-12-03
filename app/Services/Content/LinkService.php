<?php

namespace App\Services\Content;

use App\Models\Article;
use App\Models\AffiliateLink;
use App\Models\CtaTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * LinkService - Gestion intelligente des liens dans les articles
 * 
 * Types de liens gérés :
 * 1. Liens internes : Vers autres articles du site (SEO, maillage interne)
 * 2. Liens externes : Vers sources officielles/autorités (crédibilité)
 * 3. Liens affiliés : Vers partenaires (Amazon, Wise, Booking...) avec tracking
 * 4. CTA (Call-to-Action) : Boutons/liens vers services internes
 * 
 * Stratégies d'insertion :
 * - Contextuelle : Analyse sémantique du texte pour placement pertinent
 * - Limitée : Max 3-5 liens internes, 2-4 externes, 2-3 affiliés
 * - Naturelle : Respect du flux de lecture, pas de bourrage
 * - Trackée : UTM parameters pour analytics
 * 
 * @package App\Services\Content
 * @version 9.4.1 - Fixed affiliate_links JSON queries
 */
class LinkService
{
    // Configuration des limites
    protected array $limits = [
        'internal_max' => 5,      // Liens internes max
        'external_max' => 4,      // Liens externes max
        'affiliate_max' => 3,     // Liens affiliés max
        'cta_positions' => [      // Positions CTA (% du contenu)
            'top' => 0.2,         // Après 20% du contenu
            'middle' => 0.5,      // Au milieu
            'bottom' => 0.9,      // Vers la fin
        ],
    ];

    // Mots-clés courants pour détecter les opportunités de liens
    protected array $linkOpportunities = [
        'internal' => [
            'guide' => ['article', 'guide', 'tutoriel', 'explication'],
            'service' => ['service', 'plateforme', 'solution', 'outil'],
            'country' => ['pays', 'destination', 'ville'],
            'legal' => ['avocat', 'juridique', 'droit', 'légal'],
        ],
        'external' => [
            'official' => ['gouvernement', 'ambassade', 'consulat', 'administration'],
            'authority' => ['officiel', 'source', 'référence', 'documentation'],
        ],
        'affiliate' => [
            'visa' => ['visa', 'passeport', 'permis de séjour'],
            'transfer' => ['transfert', 'argent', 'banque', 'devise', 'change'],
            'booking' => ['hôtel', 'logement', 'hébergement', 'location', 'appartement'],
            'insurance' => ['assurance', 'couverture', 'protection'],
            'shopping' => ['achat', 'produit', 'commander'],
        ],
    ];

    /**
     * Insérer tous les types de liens dans le contenu
     * 
     * @param string $content Contenu HTML de l'article
     * @param array $context Contexte (platform, country, language, theme...)
     * @return string Contenu avec liens insérés
     */
    public function insertLinks(string $content, array $context): string
    {
        Log::info('LinkService: Insertion des liens', [
            'country' => $context['country']->name ?? 'unknown',
            'language' => $context['language']->code ?? 'unknown',
        ]);

        // 1. Liens internes (maillage SEO)
        $content = $this->insertInternalLinks($content, $context);

        // 2. Liens externes (sources officielles)
        $content = $this->insertExternalLinks($content, $context);

        // 3. Liens affiliés (monétisation)
        $content = $this->insertAffiliateLinks($content, $context);

        // 4. CTAs (conversion)
        $content = $this->insertCta($content, $context);

        return $content;
    }

    /**
     * Insérer des liens internes vers d'autres articles
     */
    public function insertInternalLinks(string $content, array $context): string
    {
        // Rechercher des articles pertinents dans l'index
        $candidateArticles = $this->findRelatedArticles($content, $context);

        if (empty($candidateArticles)) {
            Log::debug('LinkService: Aucun article interne trouvé');
            return $content;
        }

        $linksInserted = 0;
        $maxLinks = $this->limits['internal_max'];

        // Pour chaque article candidat
        foreach ($candidateArticles as $article) {
            if ($linksInserted >= $maxLinks) {
                break;
            }

            // Trouver les mots-clés de l'article dans le contenu
            $keywords = $this->extractKeywords($article->title ?? '');
            
            foreach ($keywords as $keyword) {
                if ($linksInserted >= $maxLinks) {
                    break;
                }

                // Chercher le mot-clé dans le contenu (case-insensitive, hors liens existants)
                $pattern = '/(?<!["\'>])(' . preg_quote($keyword, '/') . ')(?!["\'>])/iu';
                
                if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                    // Vérifier qu'on n'est pas déjà dans un lien
                    $position = $matches[0][1];
                    if (!$this->isInsideLink($content, $position)) {
                        // Construire le lien
                        $url = route('articles.show', ['slug' => $article->slug ?? '']);
                        $linkHtml = sprintf(
                            '<a href="%s" class="internal-link" title="%s">%s</a>',
                            $url,
                            htmlspecialchars($article->title ?? ''),
                            $matches[0][0]
                        );

                        // Remplacer UNIQUEMENT la première occurrence
                        $content = preg_replace(
                            $pattern,
                            $linkHtml,
                            $content,
                            1
                        );

                        $linksInserted++;
                        
                        Log::debug('LinkService: Lien interne inséré', [
                            'keyword' => $keyword,
                            'article' => $article->title ?? 'unknown',
                        ]);
                        
                        break; // Un seul lien par article
                    }
                }
            }
        }

        Log::info('LinkService: Liens internes insérés', [
            'count' => $linksInserted,
        ]);

        return $content;
    }

    /**
     * Insérer des liens externes vers sources officielles
     */
    public function insertExternalLinks(string $content, array $context): string
    {
        // Les sources sont normalement déjà présentes depuis Perplexity
        // Ici on peut ajouter des liens vers des ressources standard

        $officialResources = $this->getOfficialResources($context);
        
        if (empty($officialResources)) {
            return $content;
        }

        $linksInserted = 0;
        $maxLinks = $this->limits['external_max'];

        foreach ($officialResources as $resource) {
            if ($linksInserted >= $maxLinks) {
                break;
            }

            // Chercher des mentions de mots-clés liés à cette ressource
            foreach ($resource['keywords'] as $keyword) {
                if ($linksInserted >= $maxLinks) {
                    break;
                }

                $pattern = '/(?<!["\'>])(' . preg_quote($keyword, '/') . ')(?!["\'>])/iu';
                
                if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                    $position = $matches[0][1];
                    
                    if (!$this->isInsideLink($content, $position)) {
                        $linkHtml = sprintf(
                            '<a href="%s" target="_blank" rel="noopener" class="external-link" title="%s">%s</a>',
                            $resource['url'],
                            htmlspecialchars($resource['title']),
                            $matches[0][0]
                        );

                        $content = preg_replace(
                            $pattern,
                            $linkHtml,
                            $content,
                            1
                        );

                        $linksInserted++;
                        
                        Log::debug('LinkService: Lien externe inséré', [
                            'keyword' => $keyword,
                            'resource' => $resource['title'],
                        ]);
                        
                        break;
                    }
                }
            }
        }

        Log::info('LinkService: Liens externes insérés', [
            'count' => $linksInserted,
        ]);

        return $content;
    }

    /**
     * Insérer des liens affiliés contextuels
     * 
     * ✅ FIXED: Utilise le système JSON (countries, excluded_countries, is_global)
     * au lieu de country_id qui n'existe pas dans la table
     */
    public function insertAffiliateLinks(string $content, array $context): string
    {
        $countryCode = $context['country']->code ?? null;
        $platformId = $context['platform']->id ?? null;

        if (!$countryCode) {
            Log::warning('LinkService: Code pays manquant, skip affiliate links');
            return $content;
        }

        // ✅ CORRECTION: Requête compatible avec la structure JSON réelle
        $affiliateLinks = AffiliateLink::query()
            ->where('is_active', true)
            ->where(function ($q) use ($countryCode) {
                // Liens globaux OU liens pour ce pays spécifique
                $q->where('is_global', true)
                  ->orWhere(function ($subQ) use ($countryCode) {
                      // Si countries est NULL ou contient ce pays
                      $subQ->whereNull('countries')
                           ->orWhereJsonContains('countries', $countryCode);
                  });
            })
            ->where(function ($q) use ($countryCode) {
                // Pas dans les pays exclus
                $q->whereNull('excluded_countries')
                  ->orWhereJsonDoesntContain('excluded_countries', $countryCode);
            })
            ->where(function ($q) use ($platformId) {
                // Pour toutes les plateformes OU cette plateforme spécifique
                $q->whereNull('platform_id')
                  ->orWhere('platform_id', $platformId);
            })
            ->orderBy('priority', 'desc')
            ->get();

        if ($affiliateLinks->isEmpty()) {
            Log::debug('LinkService: Aucun lien affilié trouvé', [
                'country' => $countryCode,
                'platform' => $platformId,
            ]);
            return $content;
        }

        Log::info('LinkService: Liens affiliés disponibles', [
            'count' => $affiliateLinks->count(),
            'country' => $countryCode,
        ]);

        $linksInserted = 0;
        $maxLinks = $this->limits['affiliate_max'];

        foreach ($affiliateLinks as $link) {
            if ($linksInserted >= $maxLinks) {
                break;
            }

            // Mots-clés déclencheurs pour ce lien affilié
            $triggerWords = $this->getAffiliateTriggerWords($link);

            if (empty($triggerWords)) {
                continue;
            }

            foreach ($triggerWords as $word) {
                if ($linksInserted >= $maxLinks) {
                    break;
                }

                $pattern = '/(?<!["\'>])(' . preg_quote($word, '/') . ')(?!["\'>])/iu';
                
                if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                    $position = $matches[0][1];
                    
                    if (!$this->isInsideLink($content, $position)) {
                        // Construire l'URL avec tracking
                        $trackedUrl = $this->addTrackingParams($link->url ?? '', [
                            'source' => 'article',
                            'medium' => 'affiliate',
                            'campaign' => $context['platform']->slug ?? 'default',
                            'content' => Str::slug($context['theme']->name_en ?? 'content'),
                        ]);

                        $linkHtml = sprintf(
                            '<a href="%s" target="_blank" rel="noopener sponsored" class="affiliate-link" data-affiliate="%s">%s</a>',
                            $trackedUrl,
                            $link->slug ?? 'unknown',
                            $matches[0][0]
                        );

                        $content = preg_replace(
                            $pattern,
                            $linkHtml,
                            $content,
                            1
                        );

                        // Incrémenter le compteur d'usage
                        $link->increment('usage_count');

                        $linksInserted++;
                        
                        Log::debug('LinkService: Lien affilié inséré', [
                            'keyword' => $word,
                            'affiliate' => $link->name ?? 'unknown',
                        ]);
                        
                        break;
                    }
                }
            }
        }

        Log::info('LinkService: Liens affiliés insérés', [
            'count' => $linksInserted,
        ]);

        return $content;
    }

    /**
     * Insérer des CTAs (call-to-action) aux positions stratégiques
     */
    public function insertCta(string $content, array $context): string
    {
        // Récupérer les templates CTA appropriés
        $ctaTemplates = CtaTemplate::query()
            ->where('language_id', $context['language']->id ?? null)
            ->where('is_active', true)
            ->where(function ($q) use ($context) {
                $q->whereNull('platform_id')
                  ->orWhere('platform_id', $context['platform']->id ?? null);
            })
            ->inRandomOrder()
            ->limit(3)
            ->get();

        if ($ctaTemplates->isEmpty()) {
            Log::debug('LinkService: Aucun template CTA trouvé');
            return $content;
        }

        // Diviser le contenu en sections (par H2)
        $sections = preg_split('/(<h2[^>]*>.*?<\/h2>)/i', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
        $totalSections = count($sections);

        if ($totalSections < 3) {
            // Pas assez de sections, insertion simple
            return $this->insertCtaSimple($content, $ctaTemplates, $context);
        }

        // Calculer les positions d'insertion
        $positions = [
            'top' => (int) ($totalSections * $this->limits['cta_positions']['top']),
            'middle' => (int) ($totalSections * $this->limits['cta_positions']['middle']),
            'bottom' => (int) ($totalSections * $this->limits['cta_positions']['bottom']),
        ];

        // Insérer les CTAs
        $ctaIndex = 0;
        foreach ($positions as $position => $sectionIndex) {
            if ($ctaIndex >= $ctaTemplates->count()) {
                break;
            }

            $cta = $ctaTemplates[$ctaIndex];
            $ctaHtml = $this->renderCta($cta, $context);

            // Insérer après la section
            if (isset($sections[$sectionIndex * 2 + 1])) {
                $sections[$sectionIndex * 2 + 1] .= "\n" . $ctaHtml . "\n";
                $ctaIndex++;
                
                Log::debug('LinkService: CTA inséré', [
                    'position' => $position,
                    'type' => $cta->type ?? 'unknown',
                ]);
            }
        }

        $content = implode('', $sections);

        Log::info('LinkService: CTAs insérés', [
            'count' => $ctaIndex,
        ]);

        return $content;
    }

    /**
     * Rechercher des articles liés dans l'index
     */
    protected function findRelatedArticles(string $content, array $context): array
    {
        // Extraire les mots-clés importants du contenu
        $keywords = $this->extractContentKeywords($content);

        // Rechercher des articles similaires
        $query = Article::query()
            ->where('platform_id', $context['platform']->id ?? null)
            ->where('language_code', $context['language']->code ?? 'en')
            ->where('status', 'published')
            ->where(function ($q) use ($context) {
                // Même pays OU même thème
                $q->where('country_id', $context['country']->id ?? null)
                  ->orWhere('theme_id', $context['theme']->id ?? null);
            });

        // Recherche par mots-clés dans le titre
        if (!empty($keywords)) {
            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->orWhere('title', 'LIKE', "%{$keyword}%");
                }
            });
        }

        return $query->limit($this->limits['internal_max'] * 2) // Plus de candidats que nécessaire
            ->get()
            ->toArray();
    }

    /**
     * Extraire les mots-clés d'un titre
     */
    protected function extractKeywords(string $title): array
    {
        if (empty($title)) {
            return [];
        }

        // Retirer les stop words et ponctuation
        $stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'pour', 'avec', 'dans'];
        
        $words = preg_split('/[\s\-:]+/', mb_strtolower($title));
        $keywords = array_filter($words, function ($word) use ($stopWords) {
            return mb_strlen($word) > 3 && !in_array($word, $stopWords);
        });

        return array_values($keywords);
    }

    /**
     * Extraire les mots-clés importants du contenu
     */
    protected function extractContentKeywords(string $content, int $limit = 10): array
    {
        $text = strip_tags($content);
        $text = mb_strtolower($text);
        
        // Découper en mots
        $words = preg_split('/[\s\.,;:!?\(\)\[\]]+/', $text);
        
        // Stop words
        $stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'pour', 'avec', 'dans', 'sur', 'est', 'sont', 'plus', 'comme'];
        
        // Compter les occurrences
        $wordCounts = [];
        foreach ($words as $word) {
            if (mb_strlen($word) > 4 && !in_array($word, $stopWords)) {
                $wordCounts[$word] = ($wordCounts[$word] ?? 0) + 1;
            }
        }

        // Trier par fréquence
        arsort($wordCounts);

        return array_slice(array_keys($wordCounts), 0, $limit);
    }

    /**
     * Obtenir les ressources officielles pour un contexte
     */
    protected function getOfficialResources(array $context): array
    {
        $countryCode = $context['country']->code ?? '';
        $countryName = $context['country']->name_fr ?? $context['country']->name_en ?? 'unknown';

        // Ressources standards par pays (à enrichir)
        $resources = [
            // Ambassades/Consulats
            [
                'url' => "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/",
                'title' => "Conseils aux voyageurs - {$countryName}",
                'keywords' => ['ambassade', 'consulat', 'voyage', 'sécurité'],
            ],
            // Service-public.fr
            [
                'url' => 'https://www.service-public.fr/particuliers/vosdroits/N120',
                'title' => 'Service Public - Français à l\'étranger',
                'keywords' => ['démarches', 'administratif', 'officiel'],
            ],
        ];

        return $resources;
    }

    /**
     * Obtenir les mots déclencheurs pour un lien affilié
     * 
     * ✅ FIXED: Protection contre null avec ?? ''
     */
    protected function getAffiliateTriggerWords(AffiliateLink $link): array
    {
        // Si keywords existe dans le modèle, les utiliser en priorité
        if (!empty($link->keywords) && is_array($link->keywords)) {
            return array_slice($link->keywords, 0, 5); // Max 5 keywords
        }

        // Sinon, mapping partenaire -> mots-clés
        $triggers = [
            'wise' => ['transfert', 'virement', 'devise', 'argent', 'banque'],
            'booking' => ['hôtel', 'hébergement', 'logement', 'réservation'],
            'amazon' => ['achat', 'produit', 'commander', 'acheter'],
            'chapka' => ['assurance', 'couverture', 'protection', 'santé'],
            'action-visa' => ['visa', 'passeport', 'permis'],
            'airbnb' => ['location', 'appartement', 'logement'],
            'revolut' => ['carte', 'paiement', 'devise', 'banque'],
        ];

        // ✅ CORRIGÉ : Protection contre null
        $slug = mb_strtolower($link->slug ?? '');
        $name = mb_strtolower($link->name ?? '');
        
        foreach ($triggers as $key => $words) {
            if (str_contains($slug, $key) || str_contains($name, $key)) {
                return $words;
            }
        }

        // Par défaut, utiliser la catégorie
        $category = mb_strtolower($link->category ?? '');
        if (!empty($category) && isset($triggers[$category])) {
            return $triggers[$category];
        }

        return [];
    }

    /**
     * Ajouter des paramètres de tracking à une URL
     */
    protected function addTrackingParams(string $url, array $params): string
    {
        if (empty($url)) {
            return '';
        }

        $utmParams = [
            'utm_source' => $params['source'] ?? 'website',
            'utm_medium' => $params['medium'] ?? 'link',
            'utm_campaign' => $params['campaign'] ?? 'content',
            'utm_content' => $params['content'] ?? '',
        ];

        $separator = str_contains($url, '?') ? '&' : '?';
        return $url . $separator . http_build_query(array_filter($utmParams));
    }

    /**
     * Rendre un CTA en HTML
     * 
     * ✅ FIXED: Protection contre null avec ?? ''
     */
    protected function renderCta(CtaTemplate $cta, array $context): string
    {
        // Remplacer les variables dans le template
        $variables = [
            '{platform}' => $context['platform']->name ?? 'Platform',
            '{country}' => $context['country']->name_fr ?? $context['country']->name_en ?? 'Country',
            '{service}' => $context['theme']->name_fr ?? $context['theme']->name_en ?? 'Service',
        ];

        // ✅ CORRIGÉ : Protection contre null
        $text = str_replace(array_keys($variables), array_values($variables), $cta->text ?? '');
        $buttonText = str_replace(array_keys($variables), array_values($variables), $cta->button_text ?? 'En savoir plus');
        $url = $cta->url ?? '#';
        $type = $cta->type ?? 'button';

        // Générer le HTML selon le type
        return match ($type) {
            'button' => sprintf(
                '<div class="cta-block cta-button"><div class="cta-content"><p>%s</p><a href="%s" class="btn btn-primary">%s</a></div></div>',
                htmlspecialchars($text),
                htmlspecialchars($url),
                htmlspecialchars($buttonText)
            ),
            'banner' => sprintf(
                '<div class="cta-block cta-banner"><div class="cta-content"><strong>%s</strong><a href="%s" class="cta-link">%s →</a></div></div>',
                htmlspecialchars($text),
                htmlspecialchars($url),
                htmlspecialchars($buttonText)
            ),
            'inline' => sprintf(
                '<p class="cta-inline"><strong>%s</strong> <a href="%s" class="cta-link">%s</a></p>',
                htmlspecialchars($text),
                htmlspecialchars($url),
                htmlspecialchars($buttonText)
            ),
            default => '',
        };
    }

    /**
     * Insertion simple des CTAs (si peu de sections)
     */
    protected function insertCtaSimple(string $content, $ctaTemplates, array $context): string
    {
        $contentLength = mb_strlen($content);
        
        foreach ($ctaTemplates as $index => $cta) {
            $position = (int) (($index + 1) / ($ctaTemplates->count() + 1) * $contentLength);
            
            $ctaHtml = $this->renderCta($cta, $context);
            
            // Insérer à la position calculée
            $content = mb_substr($content, 0, $position) . "\n" . $ctaHtml . "\n" . mb_substr($content, $position);
        }

        return $content;
    }

    /**
     * Vérifier si une position est déjà dans un lien
     */
    protected function isInsideLink(string $content, int $position): bool
    {
        // Chercher les balises <a> avant et après la position
        $before = mb_substr($content, 0, $position);
        $after = mb_substr($content, $position);

        $openTags = substr_count($before, '<a ');
        $closeTags = substr_count($before, '</a>');

        // Si plus de balises ouvrantes que fermantes, on est dans un lien
        return $openTags > $closeTags;
    }
}