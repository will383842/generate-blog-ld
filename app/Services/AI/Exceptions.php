<?php

namespace App\Services\AI\Exceptions;

/**
 * Exception de base pour tous les services IA
 */
class ApiException extends \RuntimeException
{
    //
}

/**
 * Exception levée quand le rate limit est dépassé
 */
class RateLimitException extends ApiException
{
    //
}

/**
 * Exception levée quand le quota est insuffisant
 */
class InsufficientQuotaException extends ApiException
{
    //
}

/**
 * Exception levée quand le contexte est trop long
 */
class ContextLengthException extends ApiException
{
    //
}

/**
 * Exception levée pour une requête invalide
 */
class InvalidRequestException extends ApiException
{
    //
}

/**
 * Exception levée pour une erreur serveur (500, 502, 503)
 */
class ServerException extends ApiException
{
    //
}