<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
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
            'type' => $this->type,
            'platform' => [
                'id' => $this->platform_id,
                'name' => $this->platform->name ?? null,
                'slug' => $this->platform->slug ?? null,
            ],
            'country' => [
                'id' => $this->country_id,
                'name' => $this->country->name ?? null,
                'code' => $this->country->iso2 ?? null,
            ],
            'language' => [
                'id' => $this->language_id,
                'code' => $this->language->code ?? null,
                'name' => $this->language->name ?? null,
            ],
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->when($request->has('full'), $this->content),
            'word_count' => $this->word_count,
            'reading_time' => $this->reading_time,
            'image_url' => $this->image_url,
            'image_alt' => $this->image_alt,
            'status' => $this->status,
            'quality_score' => $this->quality_score,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            
            // Meta SEO
            'meta' => [
                'title' => $this->meta_title,
                'description' => $this->meta_description,
            ],
            
            // Relations conditionnelles
            'author' => $this->whenLoaded('author', function () {
                return [
                    'id' => $this->author->id,
                    'name' => $this->author->name,
                ];
            }),
            
            'theme' => $this->whenLoaded('theme', function () {
                return [
                    'id' => $this->theme->id,
                    'name' => $this->theme->name,
                ];
            }),
            
            'faqs' => $this->whenLoaded('faqs', function () {
                return $this->faqs->map(fn($faq) => [
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                ]);
            }),
            
            'translations' => $this->whenLoaded('translations', function () {
                return $this->translations->map(fn($t) => [
                    'language_code' => $t->language->code ?? null,
                    'title' => $t->title,
                    'slug' => $t->slug,
                ]);
            }),
            
            // Stats
            'stats' => $this->when($request->has('stats'), [
                'internal_links_count' => $this->internalLinks()->count(),
                'external_links_count' => $this->externalLinks()->count(),
                'translations_count' => $this->translations()->count(),
                'generation_cost' => $this->generation_cost,
            ]),
        ];
    }
}