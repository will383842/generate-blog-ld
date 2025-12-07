import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  FileText,
  Sparkles,
  Copy,
  RotateCcw,
  Loader2,
  Target,
  BookOpen,
  MessageSquare,
  Type,
  ListChecks,
  Gauge,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
import { useValidateText, useKnowledgeList } from '@/hooks/usePlatformKnowledge';
import { usePlatform } from '@/hooks/usePlatform';
import { useToast } from '@/hooks/useToast';
import { KNOWLEDGE_TYPES, ValidationResult, ValidationIssue } from '@/types/knowledge';
import { cn } from '@/lib/utils';

const VALIDATION_CRITERIA = [
  { key: 'tone', label: 'Ton', icon: MessageSquare, description: 'Cohérence avec le ton de la plateforme' },
  { key: 'vocabulary', label: 'Vocabulaire', icon: BookOpen, description: 'Utilisation du vocabulaire recommandé' },
  { key: 'forbidden', label: 'Termes interdits', icon: AlertCircle, description: 'Absence de termes à éviter' },
  { key: 'formatting', label: 'Formatage', icon: Type, description: 'Respect des règles de formatage' },
  { key: 'readability', label: 'Lisibilité', icon: FileText, description: 'Score de lisibilité du texte' },
  { key: 'length', label: 'Longueur', icon: ListChecks, description: 'Longueur appropriée du contenu' },
  { key: 'structure', label: 'Structure', icon: Target, description: 'Organisation et structure du texte' },
  { key: 'cta', label: 'CTA', icon: Sparkles, description: 'Présence et qualité des appels à l\'action' },
];

const SAMPLE_TEXTS = [
  {
    label: 'Article de blog',
    text: `Découvrez comment nos experts accompagnent les expatriés dans leurs démarches administratives. Avec plus de 10 ans d'expérience, notre équipe vous guide pas à pas pour une expatriation sereine.

Notre plateforme met en relation les expatriés avec des prestataires qualifiés dans 197 pays. Que vous ayez besoin d'aide pour votre visa, votre fiscalité ou votre assurance santé, nos experts sont là pour vous.

Contactez-nous dès maintenant pour bénéficier d'un accompagnement personnalisé !`,
  },
  {
    label: 'Page service',
    text: `Service d'assistance juridique pour expatriés

Vous faites face à une urgence juridique à l'étranger ? Notre service d'assistance vous met en contact avec un avocat spécialisé en moins de 5 minutes.

✓ Disponible 24h/24, 7j/7
✓ Avocats dans 197 pays
✓ Première consultation gratuite

N'attendez plus, protégez vos droits où que vous soyez dans le monde.`,
  },
  {
    label: 'Email marketing',
    text: `Cher expatrié,

Saviez-vous que 67% des expatriés rencontrent des difficultés administratives dans leur pays d'accueil ?

C'est pourquoi nous avons créé une solution complète pour vous simplifier la vie. Notre plateforme vous connecte instantanément avec des experts locaux.

Profitez de -20% sur votre première consultation avec le code EXPAT20.

À très bientôt,
L'équipe SOS-Expat`,
  },
];

export default function ValidatorPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentPlatform, platforms } = usePlatform();

  const [text, setText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    currentPlatform?.id?.toString() || ''
  );
  const [contentType, setContentType] = useState<string>('article');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateText = useValidateText();

  const { data: knowledgeData } = useKnowledgeList({
    platform_id: parseInt(selectedPlatform) || undefined,
    is_active: true,
    per_page: 100,
  });

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  const handleValidate = useCallback(() => {
    if (!text.trim()) {
      toast({
        title: t('knowledge.validator.errors.emptyText'),
        variant: 'destructive',
      });
      return;
    }

    validateText.mutate({
      text,
      platform_id: parseInt(selectedPlatform),
      content_type: contentType,
    }, {
      onSuccess: (result) => {
        setValidationResult(result);
      },
    });
  }, [text, selectedPlatform, contentType, validateText, toast, t]);

  const handleReset = () => {
    setText('');
    setValidationResult(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
    });
  };

  const handleLoadSample = (sampleText: string) => {
    setText(sampleText);
    setValidationResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const groupedIssues = validationResult?.issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>) || {};

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground">
          {t('settings.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/settings/knowledge" className="hover:text-foreground">
          {t('knowledge.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{t('knowledge.validator.title')}</span>
      </nav>

      <PageHeader
        title={t('knowledge.validator.title')}
        description={t('knowledge.validator.description')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('knowledge.validator.input.title')}</CardTitle>
              <CardDescription>
                {t('knowledge.validator.input.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('knowledge.validator.platform')}
                  </label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('knowledge.validator.selectPlatform')} />
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
                  <label className="text-sm font-medium mb-2 block">
                    {t('knowledge.validator.contentType')}
                  </label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article de blog</SelectItem>
                      <SelectItem value="landing">Page landing</SelectItem>
                      <SelectItem value="comparative">Comparatif</SelectItem>
                      <SelectItem value="pillar">Page pilier</SelectItem>
                      <SelectItem value="press">Communiqué presse</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    {t('knowledge.validator.textToValidate')}
                  </label>
                  <div className="flex items-center gap-2">
                    {SAMPLE_TEXTS.map((sample, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadSample(sample.text)}
                      >
                        {sample.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder={t('knowledge.validator.placeholder')}
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <span>{charCount} caractères · {wordCount} mots</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!text}>
                      <Copy className="h-4 w-4 mr-1" />
                      {t('common.copy')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleReset} disabled={!text}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t('common.reset')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  onClick={handleValidate}
                  disabled={!text.trim() || !selectedPlatform || validateText.isPending}
                  size="lg"
                >
                  {validateText.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('knowledge.validator.validating')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('knowledge.validator.validate')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('knowledge.validator.knowledgeBase')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                {KNOWLEDGE_TYPES.filter(kt => kt.required).slice(0, 4).map(type => {
                  const count = knowledgeData?.data.filter(k => k.type === type.value).length || 0;
                  return (
                    <div key={type.value} className="p-2">
                      <div className={cn(
                        'text-xl font-bold',
                        count > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {count}
                      </div>
                      <div className="text-xs text-muted-foreground">{type.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {validationResult ? (
            <>
              {/* Overall Score */}
              <Card className={getScoreBg(validationResult.score)}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Gauge className={cn('h-12 w-12 mx-auto mb-2', getScoreColor(validationResult.score))} />
                    <div className={cn('text-5xl font-bold', getScoreColor(validationResult.score))}>
                      {validationResult.score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Score global sur 100
                    </div>
                    <Badge
                      variant={validationResult.score >= 80 ? 'default' : validationResult.score >= 60 ? 'secondary' : 'destructive'}
                      className="mt-2"
                    >
                      {validationResult.score >= 80 ? 'Excellent' :
                        validationResult.score >= 60 ? 'Acceptable' :
                          validationResult.score >= 40 ? 'À améliorer' : 'Insuffisant'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Criteria Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('knowledge.validator.criteriaBreakdown')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {VALIDATION_CRITERIA.map(criteria => {
                    const score = validationResult.criteria[criteria.key] || 0;
                    const Icon = criteria.icon;
                    return (
                      <TooltipProvider key={criteria.key}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span>{criteria.label}</span>
                                </div>
                                <span className={cn('font-medium', getScoreColor(score))}>
                                  {score}%
                                </span>
                              </div>
                              <Progress
                                value={score}
                                className="h-2"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{criteria.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Issues */}
              {validationResult.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t('knowledge.validator.issues')}
                      <Badge variant="secondary">{validationResult.issues.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedIssues).map(([severity, issues]) => (
                        <AccordionItem key={severity} value={severity}>
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(severity)}
                              <span className="capitalize">{severity}</span>
                              <Badge variant="outline" className="ml-2">
                                {issues.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {issues.map((issue, idx) => (
                                <li key={idx} className="text-sm pl-6 border-l-2 border-muted">
                                  <p>{issue.message}</p>
                                  {issue.context && (
                                    <p className="text-muted-foreground text-xs mt-1">
                                      "{issue.context}"
                                    </p>
                                  )}
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
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t('knowledge.validator.suggestions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {validationResult.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gauge className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">
                  {t('knowledge.validator.noResults.title')}
                </h3>
                <p className="text-muted-foreground text-center text-sm mt-2">
                  {t('knowledge.validator.noResults.description')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
