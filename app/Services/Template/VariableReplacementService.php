<?php

namespace App\Services\Template;

use App\Models\TemplateVariable;
use Illuminate\Support\Facades\Log;

class VariableReplacementService
{
    protected array $variables;
    protected array $replacementLog = [];

    public function __construct()
    {
        $this->variables = TemplateVariable::getAllActive();
    }

    /**
     * Remplace toutes les variables dans le contenu
     * Supporte les variables imbriquées: {{VAR1}} peut contenir {{VAR2}}
     * 
     * @param string $content Contenu avec {{VARIABLES}}
     * @param int $maxDepth Profondeur max pour variables imbriquées
     * @return string Contenu avec variables remplacées
     */
    public function replace(string $content, int $maxDepth = 3): string
    {
        $this->replacementLog = [];
        $depth = 0;
        
        while ($depth < $maxDepth && $this->hasVariables($content)) {
            $content = $this->replaceOnce($content);
            $depth++;
        }
        
        if ($depth >= $maxDepth && $this->hasVariables($content)) {
            Log::warning('Max depth atteint pour remplacement variables', [
                'depth' => $depth,
                'remaining_variables' => $this->detectVariables($content)
            ]);
        }
        
        return $content;
    }

    /**
     * Un passage de remplacement
     */
    protected function replaceOnce(string $content): string
    {
        $pattern = '/\{\{([A-Z_0-9]+)\}\}/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $key = $matches[1];
            
            if (isset($this->variables[$key])) {
                $this->replacementLog[$key] = ($this->replacementLog[$key] ?? 0) + 1;
                return $this->variables[$key];
            }
            
            // Variable manquante - log warning
            if (!isset($this->replacementLog[$key])) {
                Log::warning("Variable template manquante: {$key}");
                $this->replacementLog[$key] = 'MISSING';
            }
            
            return $matches[0]; // Retourne {{KEY}} inchangé
        }, $content);
    }

    /**
     * Vérifie si le contenu contient des variables
     */
    public function hasVariables(string $content): bool
    {
        return (bool) preg_match('/\{\{[A-Z_0-9]+\}\}/', $content);
    }

    /**
     * Détecte toutes les variables utilisées dans un contenu
     * 
     * @param string $content
     * @return array Liste des clés utilisées
     */
    public function detectVariables(string $content): array
    {
        $pattern = '/\{\{([A-Z_0-9]+)\}\}/';
        preg_match_all($pattern, $content, $matches);
        
        return array_unique($matches[1]);
    }

    /**
     * Valide que toutes les variables utilisées existent
     * 
     * @param string $content
     * @return array ['valid' => bool, 'missing' => array]
     */
    public function validate(string $content): array
    {
        $usedKeys = $this->detectVariables($content);
        $missing = array_diff($usedKeys, array_keys($this->variables));
        
        return [
            'valid' => empty($missing),
            'used_variables' => $usedKeys,
            'missing_variables' => array_values($missing),
            'available_variables' => array_keys($this->variables)
        ];
    }

    /**
     * Obtient un snapshot des variables actuelles (pour historique)
     * 
     * @return array
     */
    public function getSnapshot(): array
    {
        return $this->variables;
    }

    /**
     * Obtient le log des remplacements effectués
     * 
     * @return array
     */
    public function getReplacementLog(): array
    {
        return $this->replacementLog;
    }

    /**
     * Recharge les variables depuis la BDD (si modifiées)
     */
    public function refresh(): void
    {
        $this->variables = TemplateVariable::getAllActive();
        $this->replacementLog = [];
    }

    /**
     * Preview du résultat avec highlighting des remplacements
     * Utile pour l'interface admin
     */
    public function previewWithHighlight(string $content): string
    {
        $pattern = '/\{\{([A-Z_0-9]+)\}\}/';
        
        return preg_replace_callback($pattern, function ($matches) {
            $key = $matches[1];
            
            if (isset($this->variables[$key])) {
                $value = $this->variables[$key];
                return "<mark data-variable='{$key}' title='Variable: {$key}'>{$value}</mark>";
            }
            
            return "<mark class='missing' data-variable='{$key}' title='Variable manquante'>{$matches[0]}</mark>";
        }, $content);
    }

    /**
     * Remplace avec un set personnalisé de variables (pour tests)
     */
    public function replaceWith(string $content, array $customVariables): string
    {
        $originalVars = $this->variables;
        $this->variables = array_merge($this->variables, $customVariables);
        
        $result = $this->replace($content);
        
        $this->variables = $originalVars;
        
        return $result;
    }
}
