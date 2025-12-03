<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(Request $request, Closure $next, ?string $role = null): Response
    {
        $user = $request->user('sanctum');

        if (!$user || !($user instanceof \App\Models\AdminUser)) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        if ($role) {
            $hasRole = match ($role) {
                'super_admin' => $user->isSuperAdmin(),
                'admin' => $user->isAdmin(),
                'editor' => $user->isEditor(),
                default => false,
            };

            if (!$hasRole) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
        }

        return $next($request);
    }
}