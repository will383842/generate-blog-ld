/**
 * Compliance Tester Component
 * File 252 - Test content compliance with brand guidelines
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
  Copy,
  Gauge,
  MessageSquare,
  BookOpen,
  Type,
  FileText,
  ListChecks,
  Target,
  XCircle,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useValidateContent, useFixContent } from '@/hooks/useBrandValidation';
import { usePlatform } from '@/hooks/usePlatform';
import {
  ComplianceResult,
  Violation,
  getViolationSeverityColor,
  getViolationSeverityLabel,
} from '@/types/brand';
import { cn } from '@/lib/utils';

// Compliance criteria configuration
const COMPLIANCE_CRITERIA = [
  { key: 'tone', label: 'Ton', icon: MessageSquare, description: 'Cohérence avec le ton de marque' },
  { key: 'vocabulary', label: 'Vocabulaire', icon: BookOpen, description: 'Utilisation du vocabulaire recommandé' },
  { key: 'formatting', label: 'Formatage', icon: Type, description: 'Respect des règles de formatage' },
  { key: 'structure', label: 'Structure', icon: Target, description: 'Organisation du contenu' },
  { key: 'readability', label: 'Lisibilité', icon: FileText, description: 'Score de lisibilité' },
  { key: 'forbidden_terms', label: 'Termes interdits', icon: XCircle, description: 'Absence de termes interdits' },
  { key: 'required_elements', label: 'Éléments requis', icon: ListChecks, description: 'Présence des éléments obligatoires' },
  { key: 'length', label: 'Longueur', icon: Gauge, description: 'Longueur appropriée du contenu' },
];

const CONTENT_TYPES = [
  { value: 'article', label: 'Article de blog' },
  { value: 'landing', label: 'Page landing' },
  { value: 'comparative', label: 'Comparatif' },
  { value: 'pillar', label: 'Page pilier' },
  { value: 'press', label: 'Communiqué presse' },
  { value: 'email', label: 'Email marketing' },
];

interface ComplianceTesterProps {
  initialContent?: string;
  platformId?: number;
  contentType?: string;
  onResultChange?: (result: ComplianceResult | null) => void;
  compact?: boolean;
}

export function ComplianceTester({
  initialContent = '',
  platformId,
  contentType: initialContentType = 'article',
  onResultChange,
  compact = false,
}: ComplianceTesterProps) {
  const { t } = useTranslation();
  const { currentPlatform, platforms } = usePlatform();

  // State
  const [content, setContent] = useState(initialContent);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    platformId?.toString() || currentPlatform?.id?.toString() || ''
  );
  const [contentType, setContentType] = useState(initialContentType);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  // API hooks
  const validateContent = useValidateContent();
  const fixContent = useFixContent();

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // Handle validate
  const handleValidate = async () => {
    if (!content.trim() || !selectedPlatform) return;

    const response = await validateContent.mutateAsync({
      platform_id: parseInt(selectedPlatform),
      content,
      content_type: contentType,
    });

    setResult(response);
    onResultChange?.(response);
  };

  // Handle auto-fix
  const handleAutoFix = async () => {
    if (!content.trim() || !selectedPlatform) return;

    const response = await fixContent.mutateAsync({
      platform_id: parseInt(selectedPlatform),
      content,
      content_type: contentType,
      auto_fix: true,
    });

    setContent(response.content);
    // Re-validate after fix
    handleValidate();
  };

  // Handle reset
  const handleReset = () => {
    setContent('');
    setResult(null);
    onResultChange?.(null);
  };

  // Handle copy
  const handleCopy = () => {
    if (result?.fixed_content) {
      navigator.clipboard.writeText(result.fixed_content);
    }
  };

  // Score utilities
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Conforme';
    if (score >= 60) return 'Acceptable';
    if (score >= 40) return 'À améliorer';
    return 'Non conforme';
  };

  // Severity icon
  const getSeverityIcon = (severity: Violation['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'minor':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Group violations by severity
  const groupedViolations = result?.violations.reduce((acc, violation) => {
    if (!acc[violation.severity]) acc[violation.severity] = [];
    acc[violation.severity].push(violation);
    return acc;
  }, {} as Record<string, Violation[]>) || {};

  // Auto-fixable violations count
  const autoFixableCount = result?.violations.filter(v => v.auto_fixable).length || 0;

  if (compact) {
    return (
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Collez votre contenu ici..."
          className="min-h-[150px]"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {charCount} car. · {wordCount} mots
          </span>
          <Button
            onClick={handleValidate}
            disabled={!content.trim() || !selectedPlatform || validateContent.isPending}
            size="sm"
          >
            {validateContent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Analyser'
            )}
          </Button>
        </div>
        {result && (
          <div className={cn(
            'p-4 rounded-lg border',
            result.score >= 80 && 'bg-green-50 border-green-200',
            result.score >= 60 && result.score < 80 && 'bg-yellow-50 border-yellow-200',
            result.score < 60 && 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className={cn('h-5 w-5', getScoreColor(result.score))} />
                <span className="font-medium">Score: {result.score}/100</span>
              </div>
              <Badge variant={result.is_compliant ? 'default' : 'destructive'}>
                {getScoreLabel(result.score)}
              </Badge>
            </div>
            {result.violations.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {result.violations.length} problème(s) détecté(s)
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Test de conformité</CardTitle>
            <CardDescription>
              Analysez votre contenu par rapport aux guidelines de la marque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plateforme</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms?.map(platform => (
                      <SelectItem key={platform.id} value={platform.id.toString()}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type de contenu</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Input */}
            <div>
              <Label>Contenu à analyser</Label>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setResult(null);
                }}
                placeholder="Collez ou tapez votre contenu ici..."
                className="mt-1 min-h-[300px] font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <span>{charCount} caractères · {wordCount} mots</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!content}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {result && autoFixableCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleAutoFix}
                  disabled={fixContent.isPending}
                >
                  {fixContent.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Corriger auto ({autoFixableCount})
                </Button>
              )}
              <Button
                onClick={handleValidate}
                disabled={!content.trim() || !selectedPlatform || validateContent.isPending}
                size="lg"
              >
                {validateContent.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {result ? (
          <>
            {/* Overall Score */}
            <Card className={cn(
              result.score >= 80 && 'bg-green-50',
              result.score >= 60 && result.score < 80 && 'bg-yellow-50',
              result.score < 60 && 'bg-red-50'
            )}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Gauge className={cn('h-12 w-12 mx-auto mb-2', getScoreColor(result.score))} />
                  <div className={cn('text-5xl font-bold', getScoreColor(result.score))}>
                    {result.score}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Score de conformité
                  </div>
                  <Badge
                    className="mt-2"
                    variant={result.is_compliant ? 'default' : 'destructive'}
                  >
                    {getScoreLabel(result.score)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Criteria Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détail par critère</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TooltipProvider>
                  {COMPLIANCE_CRITERIA.map(criteria => {
                    const score = result.criteria[criteria.key as keyof typeof result.criteria] || 0;
                    const Icon = criteria.icon;

                    return (
                      <Tooltip key={criteria.key}>
                        <TooltipTrigger asChild>
                          <div className="space-y-1 cursor-help">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span>{criteria.label}</span>
                              </div>
                              <span className={cn('font-medium', getScoreColor(score))}>
                                {score}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full transition-all', getScoreBgColor(score))}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="max-w-xs">{criteria.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </CardContent>
            </Card>

            {/* Violations */}
            {result.violations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Violations
                    <Badge variant="destructive">{result.violations.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(groupedViolations).map(([severity, violations]) => (
                      <AccordionItem key={severity} value={severity}>
                        <AccordionTrigger className="text-sm">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(severity as Violation['severity'])}
                            <span>{getViolationSeverityLabel(severity as Violation['severity'])}</span>
                            <Badge variant="outline">{violations.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {violations.map((violation, idx) => (
                              <li
                                key={idx}
                                className="text-sm p-2 rounded border bg-muted/50"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{violation.message}</p>
                                    {violation.context && (
                                      <p className="text-muted-foreground text-xs mt-1 font-mono">
                                        "{violation.context}"
                                      </p>
                                    )}
                                    {violation.suggestion && (
                                      <p className="text-green-600 text-xs mt-1">
                                        💡 {violation.suggestion}
                                      </p>
                                    )}
                                  </div>
                                  {violation.auto_fixable && (
                                    <Badge variant="outline" className="shrink-0">
                                      Auto-fix
                                    </Badge>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Fixed Content */}
            {result.fixed_content && result.fixed_content !== content && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      Contenu corrigé
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                    {result.fixed_content}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gauge className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">Aucune analyse</h3>
              <p className="text-muted-foreground text-center text-sm mt-2">
                Collez votre contenu et cliquez sur "Analyser" pour vérifier sa conformité
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ComplianceTester;
