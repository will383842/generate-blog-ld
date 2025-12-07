<?php

namespace App\Mail;

use App\Models\Article;
use App\Models\Platform;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PublicationSuccessMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Article $article,
        public Platform $platform
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->platform->name}] Publication réussie - {$this->article->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.publication-success',
            with: [
                'article' => $this->article,
                'platform' => $this->platform,
                'publishedAt' => $this->article->published_at?->format('d/m/Y H:i:s') ?? now()->format('d/m/Y H:i:s'),
                'articleUrl' => $this->platform->url . '/articles/' . $this->article->slug,
                'adminUrl' => config('app.url') . '/admin/content/articles/' . $this->article->id,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
