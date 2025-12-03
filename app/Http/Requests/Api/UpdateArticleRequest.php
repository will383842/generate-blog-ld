<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'excerpt' => 'sometimes|string|max:500',
            'content' => 'sometimes|string',
            'status' => 'sometimes|in:draft,pending,published,failed',
            'image_url' => 'sometimes|url',
            'meta_title' => 'sometimes|string|max:60',
            'meta_description' => 'sometimes|string|max:160',
            'theme_id' => 'sometimes|integer|exists:themes,id',
        ];
    }
}