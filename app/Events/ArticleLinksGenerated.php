<?php

namespace App\Events;

use App\Models\Article;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ArticleLinksGenerated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Article $article;
    public array $results;

    /**
     * Create a new event instance.
     */
    public function __construct(Article $article, array $results)
    {
        $this->article = $article;
        $this->results = $results;
    }

    /**
     * Get internal links count
     */
    public function getInternalLinksCount(): int
    {
        return $this->results['internal_links']['created'] ?? 0;
    }

    /**
     * Get external links count
     */
    public function getExternalLinksCount(): int
    {
        return $this->results['external_links']['created'] ?? 0;
    }

    /**
     * Get affiliate links count
     */
    public function getAffiliateLinksCount(): int
    {
        return $this->results['affiliate_links']['injected'] ?? 0;
    }

    /**
     * Get pillar links count
     */
    public function getPillarLinksCount(): int
    {
        return $this->results['pillar_links']['created'] ?? 0;
    }

    /**
     * Get total links created
     */
    public function getTotalLinksCount(): int
    {
        return $this->getInternalLinksCount() 
            + $this->getExternalLinksCount() 
            + $this->getAffiliateLinksCount()
            + $this->getPillarLinksCount();
    }

    /**
     * Check if content was updated
     */
    public function wasContentUpdated(): bool
    {
        return $this->results['content_updated'] ?? false;
    }

    /**
     * Check if there were errors
     */
    public function hasErrors(): bool
    {
        return !empty($this->results['errors']);
    }

    /**
     * Get errors
     */
    public function getErrors(): array
    {
        return $this->results['errors'] ?? [];
    }

    /**
     * Get duration in milliseconds
     */
    public function getDurationMs(): int
    {
        return $this->results['duration_ms'] ?? 0;
    }
}
