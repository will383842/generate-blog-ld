<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformKnowledgeTranslation extends Model
{
    use HasFactory;

    protected $table = 'platform_knowledge_translations';

    /**
     * Champs mass-assignables
     */
    protected $fillable = [
        'knowledge_id',
        'language_code',
        'title',
        'content',
    ];

    /**
     * Relation vers PlatformKnowledge
     */
    public function knowledge(): BelongsTo
    {
        return $this->belongsTo(PlatformKnowledge::class, 'knowledge_id');
    }

    /**
     * Retourne la langue de manière formatée
     */
    public function getLanguageName(): string
    {
        $languages = [
            'fr' => 'Français',
            'en' => 'English',
            'es' => 'Español',
            'de' => 'Deutsch',
            'it' => 'Italiano',
            'pt' => 'Português',
            'ar' => 'العربية',
            'zh' => '中文',
            'hi' => 'हिन्दी',
        ];

        return $languages[$this->language_code] ?? $this->language_code;
    }
}