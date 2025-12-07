<?php

namespace App\Services\AI\Exceptions;

/**
 * Exception thrown when context length is exceeded
 */
class ContextLengthException extends ApiException
{
    protected ?int $maxTokens = null;
    protected ?int $requestedTokens = null;

    public function setMaxTokens(int $tokens): self
    {
        $this->maxTokens = $tokens;
        return $this;
    }

    public function getMaxTokens(): ?int
    {
        return $this->maxTokens;
    }

    public function setRequestedTokens(int $tokens): self
    {
        $this->requestedTokens = $tokens;
        return $this;
    }

    public function getRequestedTokens(): ?int
    {
        return $this->requestedTokens;
    }
}
