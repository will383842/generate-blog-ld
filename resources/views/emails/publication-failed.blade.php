<x-mail::message>
# Échec de publication

L'article suivant n'a pas pu être publié sur **{{ $platform->name }}**.

## Détails de l'article

- **Titre**: {{ $article->title }}
- **ID**: {{ $article->id }}
- **Langue**: {{ $article->language->name ?? 'N/A' }}
- **Pays**: {{ $article->country->name ?? 'N/A' }}
- **Date d'échec**: {{ $failedAt }}

## Erreur rencontrée

```
{{ $errorMessage }}
```

<x-mail::button :url="$adminUrl" color="primary">
Voir l'article dans l'admin
</x-mail::button>

---

### Trace technique (pour debug)

<small>
{{ Str::limit($errorTrace, 500) }}
</small>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
