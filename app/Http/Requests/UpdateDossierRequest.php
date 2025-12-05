<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDossierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $dossierId = $this->route('dossier');
        
        return [
            'platform_id' => 'sometimes|exists:platforms,id',
            'title' => 'sometimes|string|max:255',
            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('press_dossiers', 'slug')->ignore($dossierId)
            ],
            'description' => 'sometimes|string',
            'status' => 'sometimes|in:draft,published,archived',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
            'keywords' => 'nullable|array',
            'published_at' => 'nullable|date',
        ];
    }
}
