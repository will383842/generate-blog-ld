/**
 * Brand Prompts Preview Page
 * File 262 - Full page for previewing and testing generated prompts
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Code,
  ArrowLeft,
  Loader2,
  Play,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { usePlatform } from '@/hooks/usePlatform';
import { useBrandSections, useBrandStats } from '@/hooks/useBrandValidation';
import { PromptPreview } from '@/components/settings/PromptPreview';
import { BRAND_SECTION_TYPES } from '@/types/brand';
import { cn } from '@/lib/utils';

export default function BrandPromptsPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [testContentType, setTestContentType] = useState('article');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // API hooks
  const { data: sections, isLoading: sectionsLoading } = useBrandSections(platformId);
  const { data: stats, isLoading: statsLoading } = useBrandStats(platformId);

  // Calculate missing sections
  const configuredSections = sections?.map(s => s.section_type) || [];
  const essentialSections = ['mission', 'values', 'tone', 'vocabulary'];
  const missingEssentials = essentialSections.filter(s => !configuredSections.includes(s));

  // Handle test generation
  const handleTestGeneration = async (prompt: string, contentType: string) => {
    setTestPrompt(prompt);
    setTestContentType(contentType);
    setTestDialogOpen(true);
  };

  // Simulate generation (would be API call)
  const runTestGeneration = async () => {
    setIsGenerating(true);
    setTestResult(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock result
    setTestResult(`# Exemple de contenu généré

Ceci est un exemple de contenu qui serait généré en utilisant le prompt configuré.

## Points clés

Le contenu respecterait les paramètres de style définis :
- Ton adapté selon les settings
- Vocabulaire approprié
- Structure conforme aux guidelines

## Conclusion

Ce test vous permet de vérifier que vos paramètres de brand book produisent des résultats cohérents.`);

    setIsGenerating(false);
  };

  // Handle copy
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = sectionsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/brand">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6" />
              Prévisualisation des prompts
            </h1>
            <p className="text-muted-foreground">
              Visualisez et testez les prompts générés à partir de votre brand book
            </p>
          </div>
        </div>
      </div>

      {/* Missing Sections Warning */}
      {missingEssentials.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="mb-2">
              Certaines sections essentielles ne sont pas configurées.
              Les prompts générés pourraient être incomplets.
            </p>
            <div className="flex flex-wrap gap-2">
              {missingEssentials.map(section => {
                const metadata = BRAND_SECTION_TYPES.find(t => t.value === section);
                return (
                  <Badge key={section} variant="outline" className="bg-white">
                    {metadata?.label || section}
                  </Badge>
                );
              })}
            </div>
            <Button variant="link" asChild className="p-0 mt-2 h-auto">
              <Link to="/settings/brand/sections">
                Configurer les sections →
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Sections configurées</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {configuredSections.length}/{BRAND_SECTION_TYPES.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Taille du prompt</div>
              <Code className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              ~{Math.round((sections?.reduce((acc, s) => acc + s.content.length, 0) || 0) / 100) * 100} car.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Variables dynamiques</div>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              7
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggestions d'optimisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {missingEssentials.length > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <span>Configurez les sections essentielles manquantes pour des prompts plus complets</span>
              </li>
            )}
            {(sections?.filter(s => s.section_type === 'examples').length || 0) === 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <span>Ajoutez des exemples pour améliorer la qualité de génération</span>
              </li>
            )}
            {(sections?.filter(s => s.section_type === 'donts').length || 0) === 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <span>Définissez ce qu'il ne faut pas faire pour éviter les erreurs</span>
              </li>
            )}
            {missingEssentials.length === 0 && (
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Votre configuration de base est complète !</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Prompt Preview Component */}
      <PromptPreview
        platformId={platformId}
        onTestGeneration={handleTestGeneration}
        showTestButton
      />

      {/* Test Generation Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test de génération</DialogTitle>
            <DialogDescription>
              Testez la génération de contenu avec votre prompt
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Prompt utilisé</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(testPrompt)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Textarea
                value={testPrompt}
                readOnly
                className="h-[400px] font-mono text-xs"
              />
            </div>

            {/* Result */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Résultat</Label>
                {testResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(testResult)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="h-[400px] border rounded-md p-4 overflow-auto bg-muted">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Génération en cours...</p>
                  </div>
                ) : testResult ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {testResult}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Sparkles className="h-8 w-8 mb-2" />
                    <p className="text-sm">Cliquez sur "Générer" pour tester</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Fermer
            </Button>
            <Button
              onClick={runTestGeneration}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
