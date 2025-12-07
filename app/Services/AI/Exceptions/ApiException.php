<?php

namespace App\Services\AI\Exceptions;

/**
 * Base exception for all AI services
 */
class ApiException extends \RuntimeException
{
    protected ?string $provider = null;
    protected ?array $context = null;

    public function setProvider(string $provider): self
    {
        $this->provider = $provider;
        return $this;
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setContext(array $context): self
    {
        $this->context = $context;
        return $this;
    }

    public function getContext(): ?array
    {
        return $this->context;
    }
}
