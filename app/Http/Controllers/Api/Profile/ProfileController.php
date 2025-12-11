<?php

namespace App\Http\Controllers\Api\Profile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Récupérer les sessions actives depuis la table sessions
        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($session) use ($request) {
                $isCurrent = $session->id === $request->session()->getId();
                
                return [
                    'id' => $session->id,
                    'device' => $this->parseDevice($session->user_agent),
                    'deviceType' => $this->getDeviceType($session->user_agent),
                    'browser' => $this->parseBrowser($session->user_agent),
                    'os' => $this->parseOS($session->user_agent),
                    'location' => $this->getLocation($session->ip_address),
                    'ip' => $session->ip_address,
                    'lastActive' => $this->formatLastActive($session->last_activity),
                    'isCurrent' => $isCurrent,
                ];
            });
        
        return response()->json($sessions);
    }
    
    public function loginHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Récupérer l'historique de connexion
        $history = DB::table('login_history')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($login) {
                return [
                    'id' => $login->id,
                    'timestamp' => $login->created_at,
                    'device' => $this->parseDevice($login->user_agent),
                    'location' => $this->getLocation($login->ip_address),
                    'ip' => $login->ip_address,
                    'success' => (bool) $login->success,
                ];
            });
        
        return response()->json($history);
    }
    
    public function revokeSession(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();
        
        // Supprimer la session
        DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->delete();
        
        return response()->json(['success' => true]);
    }
    
    public function revokeAllSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentSessionId = $request->session()->getId();
        
        // Supprimer toutes les sessions sauf la session actuelle
        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();
        
        return response()->json(['success' => true]);
    }
    
    private function parseDevice(string $userAgent): string
    {
        // Simple device detection
        if (preg_match('/Windows/i', $userAgent)) return 'Windows PC';
        if (preg_match('/Mac/i', $userAgent)) return 'MacBook';
        if (preg_match('/iPhone/i', $userAgent)) return 'iPhone';
        if (preg_match('/iPad/i', $userAgent)) return 'iPad';
        if (preg_match('/Android/i', $userAgent)) return 'Android';
        return 'Unknown Device';
    }
    
    private function getDeviceType(string $userAgent): string
    {
        if (preg_match('/Mobile|iPhone|Android/i', $userAgent)) return 'mobile';
        if (preg_match('/iPad|Tablet/i', $userAgent)) return 'tablet';
        return 'desktop';
    }
    
    private function parseBrowser(string $userAgent): string
    {
        if (preg_match('/Chrome/i', $userAgent)) return 'Chrome';
        if (preg_match('/Firefox/i', $userAgent)) return 'Firefox';
        if (preg_match('/Safari/i', $userAgent)) return 'Safari';
        if (preg_match('/Edge/i', $userAgent)) return 'Edge';
        return 'Unknown';
    }
    
    private function parseOS(string $userAgent): string
    {
        if (preg_match('/Windows NT 10/i', $userAgent)) return 'Windows 10/11';
        if (preg_match('/Mac OS X/i', $userAgent)) return 'macOS';
        if (preg_match('/iPhone OS ([0-9]+)/i', $userAgent, $matches)) return 'iOS ' . $matches[1];
        if (preg_match('/Android/i', $userAgent)) return 'Android';
        return 'Unknown';
    }
    
    private function getLocation(string $ip): string
    {
        // Placeholder - utiliser un service de géolocalisation en production
        return 'Unknown Location';
    }
    
    private function formatLastActive(int $timestamp): string
    {
        $diff = time() - $timestamp;
        
        if ($diff < 60) return 'Maintenant';
        if ($diff < 3600) return 'Il y a ' . floor($diff / 60) . ' minutes';
        if ($diff < 86400) return 'Il y a ' . floor($diff / 3600) . ' heures';
        return 'Il y a ' . floor($diff / 86400) . ' jours';
    }
}
