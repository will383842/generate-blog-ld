<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\AdminUser;

/**
 * Policy pour la gestion des programmes de génération
 *
 * Règles :
 * - Super Admin : tous les droits
 * - Admin : tous les droits sauf suppression de programmes actifs avec du contenu
 * - Editor : peut voir, créer des brouillons, modifier ses propres programmes en brouillon
 */
class ProgramPolicy
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
     * Peut voir la liste des programmes
     */
    public function viewAny(AdminUser $user): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut voir un programme spécifique
     */
    public function view(AdminUser $user, Program $program): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut créer un programme
     */
    public function create(AdminUser $user): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut modifier un programme
     *
     * - Admin : peut modifier tous les programmes non actifs
     * - Editor : peut modifier ses propres brouillons
     */
    public function update(AdminUser $user, Program $program): bool
    {
        if ($user->isAdmin()) {
            // Admin ne peut pas modifier un programme en cours d'exécution
            return $program->status !== 'running';
        }

        // Editor : seulement ses brouillons
        return $program->created_by === $user->id
            && $program->status === 'draft';
    }

    /**
     * Peut supprimer un programme
     */
    public function delete(AdminUser $user, Program $program): bool
    {
        if ($user->isAdmin()) {
            // Ne peut pas supprimer si en cours
            if ($program->status === 'running') {
                return false;
            }

            // Ne peut pas supprimer si a généré du contenu (sauf super admin)
            if ($program->total_generated > 0) {
                return false;
            }

            return true;
        }

        // Editor : seulement ses brouillons sans contenu
        return $program->created_by === $user->id
            && $program->status === 'draft'
            && $program->total_generated === 0;
    }

    /**
     * Peut restaurer un programme supprimé
     */
    public function restore(AdminUser $user, Program $program): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut supprimer définitivement
     */
    public function forceDelete(AdminUser $user, Program $program): bool
    {
        // Uniquement si aucun contenu généré
        return $user->isAdmin() && $program->total_generated === 0;
    }

    /**
     * Peut activer/lancer un programme
     */
    public function activate(AdminUser $user, Program $program): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut mettre en pause un programme
     */
    public function pause(AdminUser $user, Program $program): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Editor peut pauser ses propres programmes
        return $program->created_by === $user->id;
    }

    /**
     * Peut reprendre un programme en pause
     */
    public function resume(AdminUser $user, Program $program): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut arrêter définitivement un programme
     */
    public function stop(AdminUser $user, Program $program): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut dupliquer un programme
     */
    public function duplicate(AdminUser $user, Program $program): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut voir les statistiques détaillées
     */
    public function viewStats(AdminUser $user, Program $program): bool
    {
        return $user->isEditor();
    }

    /**
     * Peut exécuter manuellement (run now)
     */
    public function runNow(AdminUser $user, Program $program): bool
    {
        return $user->isAdmin() && in_array($program->status, ['active', 'scheduled', 'paused']);
    }
}
