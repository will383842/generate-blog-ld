<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // TODO: Ajouter les permissions appropriées
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
        ];
    }
}