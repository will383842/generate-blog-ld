<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\AdminUser;
use Illuminate\Auth\Access\Response;

/**
 * Policy pour la gestion des articles
 *
 * Règles :
 * - Super Admin : tous les droits
 * - Admin : tous les droits sauf forceDelete sur articles publiés > 30 jours
 * - Editor : peut créer, voir et modifier ses propres articles ou les brouillons
 */
class ArticlePolicy
{
    /**
     * Bypass pour super admin - tous les droits
     */
    public function before(AdminUser $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null; // Continue vers les autres méthodes
    }

    /**
     * Peut voir la liste des articles
     */
    public function viewAny(AdminUser $user): bool
    {
        return $user->isEditor(); // Tous les rôles (editor+)
    }

    /**
     * Peut voir un article spécifique
     */
    public function view(AdminUser $user, Article $article): bool
    {
        return $user->isEditor(); // Tous les rôles peuvent voir
    }

    /**
     * Peut créer un article
     */
    public function create(AdminUser $user): bool
    {
        return $user->isEditor(); // Tous les rôles peuvent créer
    }

    /**
     * Peut modifier un article
     *
     * - Admin : peut modifier tous les articles
     * - Editor : peut modifier ses propres articles ou les brouillons
     */
    public function update(AdminUser $user, Article $article): bool
    {
        // Admin peut tout modifier
        if ($user->isAdmin()) {
            return true;
        }

        // Editor : ses propres articles
        if ($article->created_by === $user->id) {
            return true;
        }

        // Editor : brouillons de n'importe qui
        if ($article->status === Article::STATUS_DRAFT) {
            return true;
        }

        return false;
    }

    /**
     * Peut supprimer un article (soft delete)
     *
     * - Admin : peut supprimer tous les articles
     * - Editor : peut supprimer ses propres brouillons uniquement
     */
    public function delete(AdminUser $user, Article $article): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Editor : seulement ses propres brouillons
        return $article->created_by === $user->id
            && $article->status === Article::STATUS_DRAFT;
    }

    /**
     * Peut restaurer un article supprimé
     */
    public function restore(AdminUser $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut supprimer définitivement un article
     *
     * Restriction : pas de suppression définitive sur articles publiés > 30 jours
     * (pour éviter de casser des backlinks/SEO)
     */
    public function forceDelete(AdminUser $user, Article $article): bool
    {
        // Seul super admin peut forceDelete (géré par before())
        // Mais on ajoute une protection supplémentaire ici

        if (!$user->isAdmin()) {
            return false;
        }

        // Protection : pas de suppression définitive si publié depuis > 30 jours
        if ($article->status === Article::STATUS_PUBLISHED
            && $article->published_at
            && $article->published_at->lt(now()->subDays(30))) {
            return false;
        }

        return true;
    }

    /**
     * Peut publier un article
     */
    public function publish(AdminUser $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut dépublier un article
     */
    public function unpublish(AdminUser $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    /**
     * Peut lancer une traduction
     */
    public function translate(AdminUser $user, Article $article): bool
    {
        return $user->isEditor() && $article->status !== Article::STATUS_DRAFT;
    }

    /**
     * Peut régénérer le contenu
     */
    public function regenerate(AdminUser $user, Article $article): bool
    {
        // Admin peut toujours régénérer
        if ($user->isAdmin()) {
            return true;
        }

        // Editor : seulement ses brouillons
        return $article->created_by === $user->id
            && $article->status === Article::STATUS_DRAFT;
    }
}
