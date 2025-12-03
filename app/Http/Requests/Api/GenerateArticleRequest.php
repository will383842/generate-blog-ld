<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class GenerateArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_id' => 'required|integer|exists:countries,id',
            'language_code' => 'required|string|size:2|exists:languages,code',
            'theme_id' => 'required|integer|exists:themes,id',
            'provider_type_id' => 'nullable|integer|exists:provider_types,id',
            'lawyer_specialty_id' => 'nullable|integer|exists:lawyer_specialties,id',
            'expat_domain_id' => 'nullable|integer|exists:expat_domains,id',
            'ulixai_service_id' => 'nullable|integer|exists:ulixai_services,id',
            'generate_image' => 'nullable|boolean',
            'auto_translate' => 'nullable|boolean',
            'priority' => 'nullable|in:low,default,high',
        ];
    }

    public function messages(): array
    {
        return [
            'platform_id.required' => 'La plateforme est obligatoire.',
            'country_id.required' => 'Le pays est obligatoire.',
            'language_code.required' => 'La langue est obligatoire.',
            'theme_id.required' => 'Le thème est obligatoire.',
        ];
    }
}