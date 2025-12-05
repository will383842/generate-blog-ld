<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDossierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'platform_id' => 'required|exists:platforms,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:press_dossiers,slug',
            'description' => 'required|string',
            'status' => 'required|in:draft,published,archived',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
            'keywords' => 'nullable|array',
            'published_at' => 'nullable|date',
        ];
    }
}