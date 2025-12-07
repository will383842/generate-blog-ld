<?php

namespace App\Services\Content\Traits;

use App\Models\ContentTemplate;
use App\Services\Content\TemplateManager;

/**
 * Trait UseContentTemplates
 * 
 * Ajoute le support des ContentTemplates aux générateurs existants
 * sans modifier leur logique principale.
 * 
 * UTILISATION :
 * 1. Ajouter `use UseContentTemplates;` dans le générateur
 * 2. Injecter TemplateManager dans le constructeur
 * 3. Appeler `$this->loadTemplate()` au début de generate()
 * 4. Utiliser `$this->getSystemPrompt()` et `$this->getUserPrompt()` 
 *    au lieu des prompts hardcodés
 */
trait UseContentTemplates
{
    protected ?TemplateManager $templateManager = null;
    protected ?ContentTemplate $activeTemplate = null;
    protected array $templateVariables = [];

    /**
     * Injecter le TemplateManager
     */
    public function setTemplateManager(TemplateManager $templateManager): self
    {
        $this->templateManager = $templateManager;
        return $this;
    }

    /**
     * Charger un template pour la génération
     * 
     * @param string $type Type de contenu (article, pillar, landing, etc.)
     * @param string $languageCode Code langue (fr, en, etc.)
     * @param string|null $templateSlug Slug spécifique ou null pour le défaut
     * @return ContentTemplate|null
     */
    protected function loadTemplate(string $type, string $languageCode, ?string $templateSlug = null): ?ContentTemplate
    {
        if (!$this->templateManager) {
            return null;
        }

        $this->activeTemplate = $this->templateManager->getTemplate($type, $languageCode, $templateSlug);
        
        return $this->activeTemplate;
    }

    /**
     * Définir les variables pour le template
     */
    protected function setTemplateVariables(array $variables): self
    {
        $this->templateVariables = $variables;
        return $this;
    }

    /**
     * Obtenir le system prompt (depuis template ou fallback)
     * 
     * @param string $fallbackPrompt Prompt de fallback si pas de template
     * @return string
     */
    protected function getSystemPrompt(string $fallbackPrompt = ''): string
    {
        if ($this->activeTemplate) {
            return $this->replaceVariables($this->activeTemplate->system_prompt);
        }
        
        return $this->replaceVariables($fallbackPrompt);
    }

    /**
     * Obtenir le user prompt (depuis template ou fallback)
     * 
     * @param string $fallbackPrompt Prompt de fallback si pas de template
     * @return string
     */
    protected function getUserPrompt(string $fallbackPrompt = ''): string
    {
        if ($this->activeTemplate) {
            return $this->replaceVariables($this->activeTemplate->user_prompt);
        }
        
        return $this->replaceVariables($fallbackPrompt);
    }

    /**
     * Remplacer les variables dans un texte
     */
    protected function replaceVariables(string $text): string
    {
        foreach ($this->templateVariables as $key => $value) {
            $text = str_replace('{' . $key . '}', (string) $value, $text);
        }
        
        return $text;
    }

    /**
     * Obtenir la configuration GPT depuis le template
     */
    protected function getTemplateGptConfig(): array
    {
        if (!$this->activeTemplate) {
            return [
                'model' => 'gpt-4o',
                'max_tokens' => 4000,
                'temperature' => 0.7,
            ];
        }

        return [
            'model' => $this->activeTemplate->model,
            'max_tokens' => $this->activeTemplate->max_tokens,
            'temperature' => $this->activeTemplate->temperature,
        ];
    }

    /**
     * Obtenir le word count cible depuis le template
     */
    protected function getTemplateWordCount(): array
    {
        if (!$this->activeTemplate) {
            return [
                'min' => 1200,
                'target' => 1500,
                'max' => 2000,
            ];
        }

        return [
            'min' => $this->activeTemplate->word_count_min ?? 1200,
            'target' => $this->activeTemplate->word_count_target ?? 1500,
            'max' => $this->activeTemplate->word_count_max ?? 2000,
        ];
    }

    /**
     * Obtenir le nombre de FAQ depuis le template
     */
    protected function getTemplateFaqCount(): int
    {
        return $this->activeTemplate?->faq_count ?? 8;
    }

    /**
     * Obtenir la structure depuis le template
     */
    protected function getTemplateStructure(): array
    {
        return $this->activeTemplate?->structure ?? [];
    }

    /**
     * Incrémenter le compteur d'utilisation du template
     */
    protected function trackTemplateUsage(): void
    {
        $this->activeTemplate?->incrementUsage();
    }

    /**
     * Vérifier si un template est chargé
     */
    protected function hasActiveTemplate(): bool
    {
        return $this->activeTemplate !== null;
    }

    /**
     * Obtenir l'ID du template actif
     */
    protected function getActiveTemplateId(): ?int
    {
        return $this->activeTemplate?->id;
    }

    /**
     * Obtenir le slug du template actif
     */
    protected function getActiveTemplateSlug(): ?string
    {
        return $this->activeTemplate?->slug;
    }
}
