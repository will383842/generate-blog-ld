/**
 * Prompt Optimizer Component
 * File 302 - Edit, test, and optimize AI prompts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Sparkles,
  Play,
  Save,
  History,
  GitCompare,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Copy,
  Loader2,
  Hash,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
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
import {
  usePromptTemplates,
  usePromptVersions,
  useUpdatePromptTemplate,
  useTestPrompt,
  PromptTemplate,
  PromptVersion,
} from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

interface PromptOptimizerProps {
  selectedTemplateId?: number;
  onTemplateChange?: (templateId: number) => void;
}

export function PromptOptimizer({
  selectedTemplateId,
  onTemplateChange,
}: PromptOptimizerProps) {
  const { t } = useTranslation();

  // State
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<PromptVersion | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // API hooks
  const { data: templates } = usePromptTemplates();
  const { data: versions } = usePromptVersions(activeTemplate?.id || 0);
  const updateTemplate = useUpdatePromptTemplate();
  const testPrompt = useTestPrompt();

  // Set active template
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setActiveTemplate(template);
        setEditedTemplate(template.template);
        initTestVariables(template.variables);
      }
    }
  }, [selectedTemplateId, templates]);

  // Initialize test variables
  const initTestVariables = (variables: string[]) => {
    const vars: Record<string, string> = {};
    variables.forEach(v => {
      vars[v] = '';
    });
    setTestVariables(vars);
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: number) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setActiveTemplate(template);
      setEditedTemplate(template.template);
      initTestVariables(template.variables);
      setTestOutput(null);
      setCompareVersion(null);
      onTemplateChange?.(templateId);
    }
  };

  // Count tokens (rough estimate)
  const estimateTokens = useCallback((text: string) => {
    return Math.ceil(text.length / 4);
  }, []);

  // Detect variables in template
  const detectVariables = useCallback((text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = text.match(regex) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  }, []);

  // Handle test
  const handleTest = () => {
    testPrompt.mutate(
      { template: editedTemplate, variables: testVariables },
      {
        onSuccess: (data) => setTestOutput(data.output),
      }
    );
  };

  // Handle save
  const handleSave = () => {
    if (!activeTemplate) return;
    updateTemplate.mutate({
      id: activeTemplate.id,
      template: editedTemplate,
      variables: detectVariables(editedTemplate),
    });
  };

  // Check if has changes
  const hasChanges = activeTemplate && editedTemplate !== activeTemplate.template;

  // Suggestions (mock - in real app would be AI-generated)
  const suggestions = [
    {
      type: 'improvement',
      message: 'Ajouter des instructions plus spécifiques sur le format de sortie',
      impact: 'Améliore la cohérence des réponses de 15%',
    },
    {
      type: 'warning',
      message: 'Le prompt manque de contexte sur le ton à adopter',
      impact: 'Peut causer des variations de style',
    },
    {
      type: 'optimization',
      message: 'Réduire la redondance dans les instructions',
      impact: 'Économie de ~100 tokens',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template Selector */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {templates?.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    'hover:bg-muted/50',
                    activeTemplate?.id === template.id && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{template.name}</span>
                    {template.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Badge variant="outline">{template.content_type}</Badge>
                    <span>v{template.version}</span>
                    <span>~{template.token_estimate} tokens</span>
                  </div>
                  {template.performance_score && (
                    <div className="mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs">Score: {template.performance_score}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                {activeTemplate?.name || 'Éditeur de prompt'}
              </CardTitle>
              {activeTemplate && (
                <CardDescription className="flex items-center gap-2 mt-1">
                  Version {activeTemplate.version}
                  {hasChanges && (
                    <Badge variant="outline" className="bg-yellow-50">Non sauvegardé</Badge>
                  )}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersions(true)}
                disabled={!activeTemplate}
              >
                <History className="h-4 w-4 mr-2" />
                Versions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(true)}
                disabled={!activeTemplate}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Suggestions
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTemplate ? (
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Éditer</TabsTrigger>
                <TabsTrigger value="test">Tester</TabsTrigger>
                {compareVersion && (
                  <TabsTrigger value="compare">Comparer</TabsTrigger>
                )}
              </TabsList>

              {/* Edit Tab */}
              <TabsContent value="edit" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Template</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      {estimateTokens(editedTemplate)} tokens estimés
                    </div>
                  </div>
                  <Textarea
                    value={editedTemplate}
                    onChange={(e) => setEditedTemplate(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="Entrez votre prompt ici..."
                  />
                </div>

                {/* Variables */}
                <div>
                  <Label className="flex items-center gap-2">
                    Variables détectées
                    <Badge variant="secondary">{detectVariables(editedTemplate).length}</Badge>
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {detectVariables(editedTemplate).map(v => (
                      <Badge key={v} variant="outline">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setEditedTemplate(activeTemplate.template)}
                    disabled={!hasChanges}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleTest}
                      disabled={testPrompt.isPending}
                    >
                      {testPrompt.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Tester
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || updateTemplate.isPending}
                    >
                      {updateTemplate.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Test Tab */}
              <TabsContent value="test" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {activeTemplate.variables.map(variable => (
                    <div key={variable}>
                      <Label htmlFor={variable}>{variable}</Label>
                      <Input
                        id={variable}
                        value={testVariables[variable] || ''}
                        onChange={(e) => setTestVariables({
                          ...testVariables,
                          [variable]: e.target.value,
                        })}
                        placeholder={`Valeur pour ${variable}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleTest}
                  disabled={testPrompt.isPending}
                  className="w-full"
                >
                  {testPrompt.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Exécuter le test
                </Button>

                {testOutput && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Résultat</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(testOutput)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <pre className="text-sm whitespace-pre-wrap">{testOutput}</pre>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              {/* Compare Tab */}
              {compareVersion && (
                <TabsContent value="compare" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Version actuelle (v{activeTemplate.version})</Label>
                      <Textarea
                        value={editedTemplate}
                        readOnly
                        rows={15}
                        className="mt-2 font-mono text-sm bg-muted"
                      />
                    </div>
                    <div>
                      <Label>Version {compareVersion.version}</Label>
                      <Textarea
                        value={compareVersion.template}
                        readOnly
                        rows={15}
                        className="mt-2 font-mono text-sm bg-muted"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedTemplate(compareVersion.template);
                      setCompareVersion(null);
                    }}
                  >
                    Restaurer cette version
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Sélectionnez un template pour commencer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versions Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historique des versions</DialogTitle>
            <DialogDescription>
              Consultez et restaurez les versions précédentes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {versions?.map(version => (
                <div
                  key={version.id}
                  className="p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Version {version.version}</span>
                      <p className="text-sm text-muted-foreground">
                        {new Date(version.created_at).toLocaleString()}
                      </p>
                      {version.notes && (
                        <p className="text-sm mt-1">{version.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCompareVersion(version);
                        setShowVersions(false);
                      }}
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      Comparer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Suggestions d'amélioration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg border',
                  suggestion.type === 'warning' && 'border-yellow-200 bg-yellow-50',
                  suggestion.type === 'improvement' && 'border-blue-200 bg-blue-50',
                  suggestion.type === 'optimization' && 'border-green-200 bg-green-50'
                )}
              >
                <div className="flex items-start gap-2">
                  {suggestion.type === 'warning' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  )}
                  {suggestion.type === 'improvement' && (
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                  )}
                  {suggestion.type === 'optimization' && (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{suggestion.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PromptOptimizer;
