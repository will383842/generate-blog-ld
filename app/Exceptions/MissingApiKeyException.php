<?php

namespace App\Exceptions;

use Exception;

/**
 * Exception levée quand une clé API critique est manquante
 *
 * Cette exception est fatale et empêche le démarrage de l'application
 * en production si des clés API essentielles ne sont pas configurées.
 */
class MissingApiKeyException extends Exception
{
    /**
     * Les clés manquantes
     */
    protected array $missingKeys = [];

    public function __construct(string $message = '', array $missingKeys = [], int $code = 0, ?Exception $previous = null)
    {
        $this->missingKeys = $missingKeys;
        parent::__construct($message, $code, $previous);
    }

    /**
     * Retourne les clés API manquantes
     */
    public function getMissingKeys(): array
    {
        return $this->missingKeys;
    }

    /**
     * Rapport d'erreur pour les logs
     */
    public function report(): void
    {
        \Illuminate\Support\Facades\Log::critical('Application startup blocked: ' . $this->getMessage(), [
            'missing_keys' => $this->missingKeys,
        ]);
    }

    /**
     * Rendu de l'erreur pour la console
     */
    public function renderForConsole($output): void
    {
        $output->writeln('');
        $output->writeln('<error> ERREUR FATALE: Clés API manquantes </error>');
        $output->writeln('');
        $output->writeln('<comment>' . $this->getMessage() . '</comment>');
        $output->writeln('');
        $output->writeln('Ajoutez les clés suivantes dans votre fichier .env :');

        foreach ($this->missingKeys as $key) {
            $output->writeln("  - <info>{$key}</info>");
        }

        $output->writeln('');
    }
}
