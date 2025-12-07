<?php

namespace App\Services\AI\Exceptions;

/**
 * Exception thrown when rate limit is exceeded
 *
 * Supports Retry-After header for intelligent backoff
 */
class RateLimitException extends ApiException
{
    protected ?int $retryAfter = null;

    public function __construct(string $message = '', ?int $retryAfter = null, int $code = 429, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->retryAfter = $retryAfter;
    }

    public function setRetryAfter(int $seconds): self
    {
        $this->retryAfter = $seconds;
        return $this;
    }

    public function getRetryAfter(): ?int
    {
        return $this->retryAfter;
    }
}
