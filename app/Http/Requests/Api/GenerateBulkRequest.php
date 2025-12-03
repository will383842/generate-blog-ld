<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class GenerateBulkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:article,landing,comparative',
            'platform_id' => 'required|integer|exists:platforms,id',
            'country_ids' => 'required|array|min:1',
            'country_ids.*' => 'integer|exists:countries,id',
            'language_codes' => 'required|array|min:1',
            'language_codes.*' => 'string|size:2|exists:languages,code',
            'theme_ids' => 'nullable|array',
            'theme_ids.*' => 'integer|exists:themes,id',
            'priority' => 'nullable|in:low,default,high',
            'auto_translate' => 'nullable|boolean',
            'generate_images' => 'nullable|boolean',
        ];
    }
}