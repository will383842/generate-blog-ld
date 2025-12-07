<?php

namespace App\Policies;

use App\Models\PressRelease;
use App\Models\AdminUser;

/**
 * Policy pour la gestion des communiqués de presse
 *
 * Règles :
 * - Super Admin : tous les droits
 * - Admin : tous les droits
 * - Editor : peut créer et modifier les brouillons, voir tous
 */
class PressReleasePolicy
{
    /**
     * Bypass pour super admin
     */
    public function before(AdminUser $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * Peut voir la liste
     */
    public function viewAny(AdminUser $user): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut voir un communiqué
     */
    public function view(AdminUser $user, PressRelease $pressRelease): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut créer un communiqué
     */
    public function create(AdminUser $user): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut modifier un communiqué
     */
    public function update(AdminUser $user, PressRelease $pressRelease): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Editor : seulement les brouillons
        return $pressRelease->status === 'draft';
    }

    /**
     * Peut supprimer un communiqué
     */
    public function delete(AdminUser $user, PressRelease $pressRelease): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Editor : seulement les brouillons
        return $pressRelease->status === 'draft';
    }

    /**
     * Peut restaurer
     */
    public function restore(AdminUser $user, PressRelease $pressRelease): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut supprimer définitivement
     */
    public function forceDelete(AdminUser $user, PressRelease $pressRelease): bool
    {
        // Seuls les admins, et pas si publié
        return $user->isAdmin() && $pressRelease->status !== 'published';
    }

    /**
     * Peut publier
     */
    public function publish(AdminUser $user, PressRelease $pressRelease): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut exporter (PDF, Word, etc.)
     */
    public function export(AdminUser $user, PressRelease $pressRelease): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut traduire
     */
    public function translate(AdminUser $user, PressRelease $pressRelease): bool
    {
        return $user->isEditor() && $pressRelease->status !== 'draft';
    }
}
