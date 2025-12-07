<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Trait ApiResponse - Standardise les réponses API
 */
trait ApiResponse
{
    protected function success($data = null, ?string $message = null, int $code = 200): JsonResponse
    {
        $response = ['success' => true];

        if ($data !== null) {
            if ($data instanceof LengthAwarePaginator) {
                $response['data'] = $data->items();
                $response['meta'] = [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $data->total(),
                ];
            } else {
                $response['data'] = $data;
            }
        }

        if ($message) {
            $response['message'] = $message;
        }

        return response()->json($response, $code);
    }

    protected function created($data = null, ?string $message = null): JsonResponse
    {
        return $this->success($data, $message ?? 'Ressource créée', 201);
    }

    protected function error(string $message, int $code = 500, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    protected function notFound(string $message = 'Ressource non trouvée'): JsonResponse
    {
        return $this->error($message, 404);
    }

    protected function unauthorized(string $message = 'Non authentifié'): JsonResponse
    {
        return $this->error($message, 401);
    }

    protected function forbidden(string $message = 'Accès non autorisé'): JsonResponse
    {
        return $this->error($message, 403);
    }

    protected function validationError(array $errors, string $message = 'Erreur de validation'): JsonResponse
    {
        return $this->error($message, 422, $errors);
    }
}
