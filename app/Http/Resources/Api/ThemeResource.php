<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThemeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'platform_id' => $this->platform_id,
            'platform' => $this->whenLoaded('platform', function () {
                return [
                    'id' => $this->platform->id,
                    'name' => $this->platform->name,
                    'slug' => $this->platform->slug,
                ];
            }),
            'name_fr' => $this->name_fr,
            'name_en' => $this->name_en,
            'name_es' => $this->name_es,
            'name_de' => $this->name_de,
            'name_pt' => $this->name_pt,
            'name_ru' => $this->name_ru,
            'name_zh' => $this->name_zh,
            'name_ar' => $this->name_ar,
            'name_hi' => $this->name_hi,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'color' => $this->color,
            'is_active' => $this->is_active,
            'articles_count' => $this->whenCounted('articles'),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}