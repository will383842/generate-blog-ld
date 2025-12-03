<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class GenerateLandingRequest extends FormRequest
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
            'language_id' => 'required|integer|exists:languages,id',
            'service' => 'required|string|max:255',
            'target_audience' => 'nullable|string|max:255',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:100',
            'sections_enabled' => 'nullable|array',
            'priority' => 'nullable|in:low,default,high',
        ];
    }
}