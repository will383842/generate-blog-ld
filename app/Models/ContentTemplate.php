<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * ContentTemplate - Modèle centralisé pour tous les templates de génération
 * 
 * Gère les templates pour :
 * - Contenus en ligne : article, pillar, landing, comparative
 * - Contenus PDF : press_release, dossier
 * 
 * @property int $id
 * @property string $uuid
 * @property string $category
 * @property string $type
 * @property string $slug
 * @property string $name
 * @property string|null $description
 * @property string $language_code
 * @property string $output_format
 * @property string $system_prompt
 * @property string $user_prompt
 * @property array|null $structure
 * @property array|null $variables
 * @property string $model
 * @property int $max_tokens
 * @property float $temperature
 * @property int|null $word_count_min
 * @property int|null $word_count_target
 * @property int|null $word_count_max
 * @property int $faq_count
 * @property bool $is_default
 * @property bool $is_active
 * @property int $version
 * @property int $usage_count
 */
class ContentTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'category',
        'type',
        'slug',
        'name',
        'description',
        'language_code',
        'output_format',
        'system_prompt',
        'user_prompt',
        'structure',
        'variables',
        'model',
        'max_tokens',
        'temperature',
        'word_count_min',
        'word_count_target',
        'word_count_max',
        'faq_count',
        'is_default',
        'is_active',
        'version',
        'usage_count',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'structure' => 'array',
        'variables' => 'array',
        'temperature' => 'float',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTES
    // ═══════════════════════════════════════════════════════════════════════════

    // Catégories
    const CATEGORY_CONTENT = 'content';
    const CATEGORY_PRESS = 'press';

    // Types de contenus en ligne
    const TYPE_ARTICLE = 'article';
    const TYPE_PILLAR = 'pillar';
    const TYPE_LANDING = 'landing';
    const TYPE_COMPARATIVE = 'comparative';

    // Types de contenus PDF
    const TYPE_PRESS_RELEASE = 'press_release';
    const TYPE_DOSSIER = 'dossier';

    // Formats de sortie
    const OUTPUT_HTML = 'html';
    const OUTPUT_PDF = 'pdf';

    // Langues supportées
    const LANGUAGES = [
        'fr' => 'Français',
        'en' => 'English',
        'de' => 'Deutsch',
        'es' => 'Español',
        'pt' => 'Português',
        'ru' => 'Русский',
        'zh' => '中文',
        'ar' => 'العربية',
        'hi' => 'हिन्दी',
    ];

    // Types par catégorie
    const TYPES_BY_CATEGORY = [
        self::CATEGORY_CONTENT => [
            self::TYPE_ARTICLE,
            self::TYPE_PILLAR,
            self::TYPE_LANDING,
            self::TYPE_COMPARATIVE,
        ],
        self::CATEGORY_PRESS => [
            self::TYPE_PRESS_RELEASE,
            self::TYPE_DOSSIER,
        ],
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════════════════════════════════════════

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($template) {
            if (empty($template->uuid)) {
                $template->uuid = Str::uuid();
            }
            if (empty($template->slug)) {
                $template->slug = Str::slug($template->type . '-' . $template->name . '-' . $template->language_code);
            }
        });

        // Quand on définit un template par défaut, désactiver les autres
        static::saving(function ($template) {
            if ($template->is_default && $template->isDirty('is_default')) {
                static::where('type', $template->type)
                    ->where('language_code', $template->language_code)
                    ->where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RELATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public function versions(): HasMany
    {
        return $this->hasMany(ContentTemplateVersion::class, 'template_id')->orderBy('version', 'desc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'updated_by');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════════════════════

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOfCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('language_code', $languageCode);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeContent($query)
    {
        return $query->where('category', self::CATEGORY_CONTENT);
    }

    public function scopePress($query)
    {
        return $query->where('category', self::CATEGORY_PRESS);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTHODES STATIQUES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Récupérer le template par défaut pour un type et une langue
     */
    public static function getDefault(string $type, string $languageCode): ?self
    {
        return static::active()
            ->ofType($type)
            ->forLanguage($languageCode)
            ->default()
            ->first();
    }

    /**
     * Récupérer un template avec fallback sur la langue par défaut (fr)
     */
    public static function getWithFallback(string $type, string $languageCode): ?self
    {
        $template = static::getDefault($type, $languageCode);
        
        if (!$template && $languageCode !== 'fr') {
            $template = static::getDefault($type, 'fr');
        }
        
        return $template;
    }

    /**
     * Récupérer tous les templates pour un type, groupés par langue
     */
    public static function getByTypeGroupedByLanguage(string $type): array
    {
        return static::active()
            ->ofType($type)
            ->get()
            ->groupBy('language_code')
            ->toArray();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTHODES D'INSTANCE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Construire le prompt utilisateur avec les variables
     */
    public function buildUserPrompt(array $variables): string
    {
        $prompt = $this->user_prompt;
        
        foreach ($variables as $key => $value) {
            $prompt = str_replace('{' . $key . '}', $value, $prompt);
        }
        
        return $prompt;
    }

    /**
     * Obtenir la liste des variables requises
     */
    public function getRequiredVariables(): array
    {
        preg_match_all('/\{([^}]+)\}/', $this->user_prompt, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Valider que toutes les variables requises sont fournies
     */
    public function validateVariables(array $variables): array
    {
        $required = $this->getRequiredVariables();
        $missing = [];
        
        foreach ($required as $var) {
            if (!isset($variables[$var]) || $variables[$var] === '') {
                $missing[] = $var;
            }
        }
        
        return $missing;
    }

    /**
     * Créer une nouvelle version du template
     */
    public function createVersion(?string $changeNote = null, ?int $userId = null): ContentTemplateVersion
    {
        return ContentTemplateVersion::create([
            'template_id' => $this->id,
            'version' => $this->version,
            'system_prompt' => $this->system_prompt,
            'user_prompt' => $this->user_prompt,
            'structure' => $this->structure,
            'variables' => $this->variables,
            'change_note' => $changeNote,
            'created_by' => $userId,
        ]);
    }

    /**
     * Incrémenter le compteur d'utilisation
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Dupliquer le template pour une autre langue
     */
    public function duplicateForLanguage(string $targetLanguageCode): self
    {
        $newTemplate = $this->replicate();
        $newTemplate->uuid = Str::uuid();
        $newTemplate->language_code = $targetLanguageCode;
        $newTemplate->slug = Str::slug($this->type . '-' . $this->name . '-' . $targetLanguageCode);
        $newTemplate->is_default = false;
        $newTemplate->usage_count = 0;
        $newTemplate->save();
        
        return $newTemplate;
    }

    /**
     * Obtenir le nom de la langue
     */
    public function getLanguageNameAttribute(): string
    {
        return self::LANGUAGES[$this->language_code] ?? $this->language_code;
    }

    /**
     * Vérifier si c'est un template pour contenu en ligne
     */
    public function isOnlineContent(): bool
    {
        return $this->category === self::CATEGORY_CONTENT;
    }

    /**
     * Vérifier si c'est un template pour PDF
     */
    public function isPdfContent(): bool
    {
        return $this->category === self::CATEGORY_PRESS;
    }

    /**
     * Obtenir la configuration complète pour la génération
     */
    public function getGenerationConfig(): array
    {
        return [
            'model' => $this->model,
            'max_tokens' => $this->max_tokens,
            'temperature' => $this->temperature,
            'system_prompt' => $this->system_prompt,
            'word_count' => [
                'min' => $this->word_count_min,
                'target' => $this->word_count_target,
                'max' => $this->word_count_max,
            ],
            'faq_count' => $this->faq_count,
            'structure' => $this->structure,
        ];
    }
}
