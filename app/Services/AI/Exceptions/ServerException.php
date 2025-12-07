<?php

namespace App\Services\AI\Exceptions;

/**
 * Exception thrown for server errors (500, 502, 503)
 */
class ServerException extends ApiException
{
    protected ?int $statusCode = null;

    public function setStatusCode(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function getStatusCode(): ?int
    {
        return $this->statusCode;
    }
}
