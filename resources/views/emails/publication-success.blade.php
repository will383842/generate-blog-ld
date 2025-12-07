<x-mail::message>
# Publication réussie

L'article suivant a été publié avec succès sur **{{ $platform->name }}**.

## Détails de l'article

- **Titre**: {{ $article->title }}
- **ID**: {{ $article->id }}
- **Langue**: {{ $article->language->name ?? 'N/A' }}
- **Pays**: {{ $article->country->name ?? 'N/A' }}
- **Date de publication**: {{ $publishedAt }}

<x-mail::button :url="$articleUrl" color="success">
Voir l'article publié
</x-mail::button>

<x-mail::button :url="$adminUrl" color="primary">
Voir dans l'admin
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
