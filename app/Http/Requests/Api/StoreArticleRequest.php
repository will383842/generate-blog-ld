<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Vérifie que l'utilisateur authentifié a les permissions nécessaires
     * pour créer un article sur la plateforme spécifiée.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        // Pas d'utilisateur authentifié
        if (!$user) {
            return false;
        }

        // Super admin a tous les droits
        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return true;
        }

        // Admin a les droits de création
        if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
            return true;
        }

        // Editor peut créer des articles
        if (method_exists($user, 'isEditor') && $user->isEditor()) {
            return true;
        }

        // Vérification via Spatie Permissions si disponible
        if (method_exists($user, 'hasPermissionTo')) {
            if ($user->hasPermissionTo('create articles')) {
                return true;
            }
        }

        // Vérification via le rôle direct
        if (isset($user->role)) {
            $allowedRoles = ['super_admin', 'admin', 'editor', 'content_manager'];
            if (in_array($user->role, $allowedRoles)) {
                return true;
            }
        }

        // Par défaut, refuser l'accès
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'required|integer|exists:countries,id',
            'language_code' => 'required|string|size:2|exists:languages,code',
            'theme_id' => 'nullable|integer|exists:themes,id',
            'title' => 'nullable|string|max:255',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'nullable|string',
            'status' => 'nullable|in:draft,pending,published,failed',
            'image_url' => 'nullable|url',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'generate_image' => 'nullable|boolean',
            'auto_translate' => 'nullable|boolean',
            'priority' => 'nullable|in:low,default,high',

            // Multi-langues: génère automatiquement les traductions
            // Exemple: languages: ['en', 'de', 'ar'] pour traduire vers ces langues après génération
            'languages' => 'nullable|array|max:8',
            'languages.*' => 'string|size:2|in:fr,en,de,es,pt,ru,zh,ar,hi',

            // Options SEO avancées
            'enable_full_seo' => 'nullable|boolean', // Applique le SEO complet (meta, liens, JSON-LD)
            'enable_affiliate_links' => 'nullable|boolean', // Injecte les liens affiliés
            'auto_publish' => 'nullable|boolean', // Publie automatiquement si score qualité OK
            'min_quality_score' => 'nullable|integer|min:0|max:100', // Score minimum pour auto-publish

            // Template de contenu
            'content_template_slug' => 'nullable|string|max:100|exists:content_templates,slug',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'platform_id.required' => 'La plateforme est obligatoire.',
            'platform_id.exists' => 'La plateforme spécifiée n\'existe pas.',
            'country_id.required' => 'Le pays est obligatoire.',
            'country_id.exists' => 'Le pays spécifié n\'existe pas.',
            'language_code.required' => 'La langue est obligatoire.',
            'language_code.exists' => 'La langue spécifiée n\'existe pas.',
            'language_code.size' => 'Le code langue doit faire 2 caractères.',
            'status.in' => 'Le statut doit être draft, pending, published ou failed.',
            'priority.in' => 'La priorité doit être low, default ou high.',
            'languages.array' => 'Les langues doivent être un tableau.',
            'languages.max' => 'Maximum 8 langues cibles autorisées.',
            'languages.*.in' => 'Langue non supportée. Langues valides: fr, en, de, es, pt, ru, zh, ar, hi.',
            'min_quality_score.min' => 'Le score minimum doit être entre 0 et 100.',
            'min_quality_score.max' => 'Le score minimum doit être entre 0 et 100.',
        ];
    }
}