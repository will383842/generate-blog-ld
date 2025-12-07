<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ContentTemplateVersion - Historique des versions de templates
 */
class ContentTemplateVersion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'template_id',
        'version',
        'system_prompt',
        'user_prompt',
        'structure',
        'variables',
        'change_note',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'structure' => 'array',
        'variables' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($version) {
            $version->created_at = now();
        });
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ContentTemplate::class, 'template_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    /**
     * Restaurer cette version sur le template parent
     */
    public function restore(): ContentTemplate
    {
        $template = $this->template;
        
        // Sauvegarder la version actuelle avant restauration
        $template->createVersion('Avant restauration vers v' . $this->version);
        
        // Restaurer
        $template->update([
            'system_prompt' => $this->system_prompt,
            'user_prompt' => $this->user_prompt,
            'structure' => $this->structure,
            'variables' => $this->variables,
            'version' => $template->version + 1,
        ]);
        
        return $template;
    }
}
