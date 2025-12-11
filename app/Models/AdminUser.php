<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminUser extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_EDITOR = 'editor';
    
    public const ROLES = [
        self::ROLE_SUPER_ADMIN => 'Super Admin',
        self::ROLE_ADMIN => 'Admin',
        self::ROLE_EDITOR => 'Éditeur',
    ];

    protected $fillable = [
        'name', 'email', 'password', 'role', 'avatar', 'phone', 
        'timezone', 'locale', 'is_active', 'last_login_at'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function notificationSettings(): HasMany
    {
        return $this->hasMany(NotificationSetting::class);
    }

    protected function usesSpatie(): bool
    {
        return in_array(\Spatie\Permission\Traits\HasRoles::class, class_uses_recursive($this));
    }
    
    public function isSuperAdmin(): bool
    {
        if ($this->usesSpatie() && method_exists($this, 'hasRole')) {
            if ($this->hasRole(['super_admin', 'Super Admin'])) {
                return true;
            }
        }
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        if ($this->usesSpatie() && method_exists($this, 'hasAnyRole')) {
            if ($this->hasAnyRole(['super_admin', 'admin'])) {
                return true;
            }
        }
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN]);
    }

    public function isEditor(): bool
    {
        if ($this->usesSpatie() && method_exists($this, 'hasAnyRole')) {
            if ($this->hasAnyRole(['super_admin', 'admin', 'editor'])) {
                return true;
            }
        }
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_EDITOR]);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->usesSpatie() && method_exists($this, 'hasPermissionTo')) {
            return $this->hasPermissionTo($permission);
        }
        return $this->isAdmin();
    }

    public function hasMinimumRole(string $role): bool
    {
        $hierarchy = [
            'editor' => 1,
            self::ROLE_EDITOR => 1,
            'admin' => 2,
            self::ROLE_ADMIN => 2,
            'super_admin' => 3,
            self::ROLE_SUPER_ADMIN => 3,
        ];
        
        $userLevel = $hierarchy[$this->role] ?? 0;
        $requiredLevel = $hierarchy[$role] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }

    public function getRoleLabelAttribute(): string
    {
        if ($this->usesSpatie() && method_exists($this, 'getRoleNames')) {
            $roles = $this->getRoleNames();
            if ($roles->isNotEmpty()) {
                return $roles->first();
            }
        }
        return self::ROLES[$this->role] ?? $this->role;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
