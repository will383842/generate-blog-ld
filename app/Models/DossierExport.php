<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Model DossierExport - Exports de dossiers de presse
 * 
 * Formats supportés :
 * - pdf : PDF design professionnel
 * - word : Document Word éditable
 * - excel : Fichier Excel avec datasets
 * - powerpoint : Présentation PowerPoint
 * 
 * @package App\Models
 */
class DossierExport extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'dossier_id',
        'export_format',
        'language_code',
        'file_path',
        'filename',
        'file_size',
        'status',
        'error_message',
        'generation_time_seconds',
        'started_at',
        'completed_at',
        'export_options',
        'download_count',
        'last_downloaded_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'generation_time_seconds' => 'integer',
        'download_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_downloaded_at' => 'datetime',
        'export_options' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
        
        // Supprimer le fichier lors de la suppression du modèle
        static::deleting(function ($model) {
            if ($model->file_path && Storage::exists($model->file_path)) {
                Storage::delete($model->file_path);
            }
        });
    }

    // ============================================
    // RELATIONS
    // ============================================

    /**
     * Dossier parent
     */
    public function dossier(): BelongsTo
    {
        return $this->belongsTo(PressDossier::class, 'dossier_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Filtrer par format
     */
    public function scopeFormat($query, string $format)
    {
        return $query->where('export_format', $format);
    }

    /**
     * Filtrer par langue
     */
    public function scopeLanguage($query, string $code)
    {
        return $query->where('language_code', $code);
    }

    /**
     * Filtrer par statut
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Exports complétés
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Exports en cours
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    /**
     * Exports échoués
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Exports récents
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ============================================
    // MÉTHODES
    // ============================================

    /**
     * Marquer l'export comme démarré
     */
    public function markAsStarted(): bool
    {
        return $this->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);
    }

    /**
     * Marquer l'export comme complété
     */
    public function markAsCompleted(string $filePath, int $fileSize): bool
    {
        $startTime = $this->started_at ?? $this->created_at;
        $generationTime = now()->diffInSeconds($startTime);

        return $this->update([
            'status' => 'completed',
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'completed_at' => now(),
            'generation_time_seconds' => $generationTime,
            'error_message' => null,
        ]);
    }

    /**
     * Marquer l'export comme échoué
     */
    public function markAsFailed(string $errorMessage): bool
    {
        return $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'completed_at' => now(),
        ]);
    }

    /**
     * Incrémenter le compteur de téléchargements
     */
    public function incrementDownloads(): bool
    {
        return $this->increment('download_count', 1, [
            'last_downloaded_at' => now(),
        ]);
    }

    /**
     * Obtenir l'URL publique du fichier
     */
    public function getUrlAttribute(): ?string
    {
        if (!$this->file_path || $this->status !== 'completed') {
            return null;
        }

        return Storage::url($this->file_path);
    }

    /**
     * Obtenir l'URL complète du fichier
     */
    public function getFullUrlAttribute(): ?string
    {
        $url = $this->url;
        return $url ? url($url) : null;
    }

    /**
     * Vérifier si le fichier existe
     */
    public function fileExists(): bool
    {
        return $this->file_path && Storage::exists($this->file_path);
    }

    /**
     * Obtenir la taille du fichier formatée
     */
    public function getFormattedSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'N/A';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unitIndex = 0;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return round($size, 2) . ' ' . $units[$unitIndex];
    }

    /**
     * Obtenir le temps de génération formaté
     */
    public function getFormattedGenerationTimeAttribute(): string
    {
        if (!$this->generation_time_seconds) {
            return 'N/A';
        }

        $seconds = $this->generation_time_seconds;

        if ($seconds < 60) {
            return $seconds . 's';
        }

        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;

        return $minutes . 'min ' . $remainingSeconds . 's';
    }

    /**
     * Obtenir le nom du format en français
     */
    public function getFormatNameAttribute(): string
    {
        $formats = [
            'pdf' => 'PDF',
            'word' => 'Word (DOCX)',
            'excel' => 'Excel (XLSX)',
            'powerpoint' => 'PowerPoint (PPTX)',
        ];

        return $formats[$this->export_format] ?? strtoupper($this->export_format);
    }

    /**
     * Obtenir l'extension du fichier
     */
    public function getFileExtensionAttribute(): string
    {
        $extensions = [
            'pdf' => 'pdf',
            'word' => 'docx',
            'excel' => 'xlsx',
            'powerpoint' => 'pptx',
        ];

        return $extensions[$this->export_format] ?? $this->export_format;
    }

    /**
     * Vérifier si l'export est prêt pour téléchargement
     */
    public function isReady(): bool
    {
        return $this->status === 'completed' && $this->fileExists();
    }

    /**
     * Obtenir le pourcentage de progression (si applicable)
     */
    public function getProgressPercentageAttribute(): int
    {
        if ($this->status === 'completed') {
            return 100;
        }

        if ($this->status === 'failed') {
            return 0;
        }

        if ($this->status === 'processing' && $this->started_at) {
            // Estimation simple basée sur le temps écoulé (max 2 minutes)
            $elapsed = now()->diffInSeconds($this->started_at);
            $progress = min(($elapsed / 120) * 100, 95); // Max 95% jusqu'à completion
            return (int) $progress;
        }

        return 0;
    }
}