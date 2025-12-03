<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class GenerateComparativeRequest extends FormRequest
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
            'service_type' => 'required|string|max:255',
            'competitors_count' => 'nullable|integer|min:3|max:10',
            'criteria' => 'nullable|array',
            'criteria.*' => 'string|max:100',
            'with_cta' => 'nullable|boolean',
            'priority' => 'nullable|in:low,default,high',
        ];
    }
}