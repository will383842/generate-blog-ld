<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PressReleaseTemplate extends Model
{
    protected $fillable = [
        'template_code', 'name', 'type', 'language_code',
        'structure', 'variables', 'instructions', 'is_active',
    ];

    protected $casts = [
        'structure' => 'array',
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    // Scopes
    public function scopeType($query, $type) { return $query->where('type', $type); }
    public function scopeLanguage($query, $code) { return $query->where('language_code', $code); }
    public function scopeActive($query) { return $query->where('is_active', true); }

    // Methods
    public function getPattern(string $section): ?string { return $this->structure[$section] ?? null; }
    
    public static function getByTypeAndLanguage(string $type, string $code): ?self
    {
        return static::where('type', $type)
            ->where('language_code', $code)
            ->where('is_active', true)
            ->first();
    }

    public static function getAvailableTypes(): array
    {
        return [
            'lancement_produit' => 'Lancement de produit/service',
            'partenariat' => 'Partenariat stratégique',
            'resultats_milestone' => 'Résultats et milestones',
            'evenement' => 'Événement ou conférence',
            'nomination' => 'Nomination RH',
        ];
    }
}