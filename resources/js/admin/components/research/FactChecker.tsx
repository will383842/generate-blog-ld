/**
 * Fact Checker Component
 * File 289 - Interface for verifying claims and facts
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { useFactCheck, useExtractClaims } from '@/hooks/useResearch';
import {
  FactCheckResult,
  ExtractedClaim,
  getVerificationStatusColor,
  getVerificationStatusLabel,
  getConfidenceColor,
  getConfidenceLabel,
} from '@/types/research';
import { ConfidenceMeter } from './ConfidenceMeter';
import { ClaimVerifier } from './ClaimVerifier';
import { cn } from '@/lib/utils';

interface FactCheckerProps {
  compact?: boolean;
  onResultsChange?: (results: FactCheckResult[]) => void;
}

export function FactChecker({ compact = false, onResultsChange }: FactCheckerProps) {
  const { t } = useTranslation();

  // State
  const [text, setText] = useState('');
  const [extractedClaims, setExtractedClaims] = useState<ExtractedClaim[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<FactCheckResult[]>([]);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  // API hooks
  const extractClaims = useExtractClaims();
  const factCheck = useFactCheck();

  // Handle extract claims
  const handleExtractClaims = () => {
    extractClaims.mutate(
      { text, method: 'ai' },
      {
        onSuccess: (data) => {
          setExtractedClaims(data.claims);
          // Auto-select checkable claims
          const checkable = new Set(
            data.claims.filter(c => c.checkable).map(c => c.id)
          );
          setSelectedClaims(checkable);
        },
      }
    );
  };

  // Handle verify selected claims
  const handleVerifyClaims = () => {
    const claimsToVerify = extractedClaims
      .filter(c => selectedClaims.has(c.id))
      .map(c => c.text);

    factCheck.mutate(
      { claims: claimsToVerify },
      {
        onSuccess: (data) => {
          setResults(data);
          onResultsChange?.(data);
        },
      }
    );
  };

  // Toggle claim selection
  const toggleClaim = (id: string) => {
    const newSelected = new Set(selectedClaims);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClaims(newSelected);
  };

  // Toggle result expansion
  const toggleResultExpand = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  // Get claim type badge
  const getClaimTypeBadge = (type: ExtractedClaim['type']) => {
    const colors: Record<string, string> = {
      factual: 'bg-blue-100 text-blue-800',
      statistical: 'bg-purple-100 text-purple-800',
      opinion: 'bg-gray-100 text-gray-800',
      prediction: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <Badge className={cn('text-xs', colors[type] || 'bg-gray-100')}>
        {type}
      </Badge>
    );
  };

  // Get verification icon
  const getVerificationIcon = (status: FactCheckResult['status']) => {
    switch (status) {
      case 'verified':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'false':
        return <X className="h-4 w-4 text-red-500" />;
      case 'partially_verified':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Vérification rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Entrez une affirmation à vérifier..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="mb-2"
          />
          <Button
            onClick={() => {
              if (text.trim()) {
                factCheck.mutate({ claims: [text.trim()] }, {
                  onSuccess: (data) => {
                    setResults(data);
                    onResultsChange?.(data);
                  },
                });
              }
            }}
            disabled={factCheck.isPending || !text.trim()}
            className="w-full"
          >
            {factCheck.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Vérifier
          </Button>
          {results.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <ClaimVerifier result={results[0]} compact />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Vérificateur de faits
          </CardTitle>
          <CardDescription>
            Entrez du texte pour extraire et vérifier les affirmations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Texte à analyser</Label>
              <Textarea
                id="text"
                placeholder="Collez ici le texte contenant des affirmations à vérifier..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {text.length} caractères
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExtractClaims}
                disabled={extractClaims.isPending || !text.trim()}
              >
                {extractClaims.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Extraire les affirmations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Claims */}
      {extractedClaims.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Affirmations extraites ({extractedClaims.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const checkable = extractedClaims.filter(c => c.checkable).map(c => c.id);
                    setSelectedClaims(new Set(checkable));
                  }}
                >
                  Sélectionner vérifiables
                </Button>
                <Button
                  size="sm"
                  onClick={handleVerifyClaims}
                  disabled={factCheck.isPending || selectedClaims.size === 0}
                >
                  {factCheck.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  Vérifier ({selectedClaims.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {extractedClaims.map(claim => (
                <div
                  key={claim.id}
                  onClick={() => claim.checkable && toggleClaim(claim.id)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedClaims.has(claim.id) && 'border-primary bg-primary/5',
                    !claim.checkable && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedClaims.has(claim.id)}
                      onChange={() => claim.checkable && toggleClaim(claim.id)}
                      disabled={!claim.checkable}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm">{claim.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getClaimTypeBadge(claim.type)}
                        <span className="text-xs text-muted-foreground">
                          Confiance: {claim.confidence}%
                        </span>
                        {!claim.checkable && (
                          <Badge variant="outline" className="text-xs">
                            Non vérifiable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Résultats de vérification ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {results.map(result => (
                  <Collapsible
                    key={result.id}
                    open={expandedResults.has(result.id)}
                    onOpenChange={() => toggleResultExpand(result.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            {getVerificationIcon(result.status)}
                            <div>
                              <p className="font-medium text-sm line-clamp-1">
                                {result.claim}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  style={{
                                    backgroundColor: getVerificationStatusColor(result.status),
                                    color: 'white',
                                  }}
                                >
                                  {getVerificationStatusLabel(result.status)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {result.sources.length} source(s)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <ConfidenceMeter
                              value={result.confidence}
                              size="sm"
                              showLabel={false}
                            />
                            {expandedResults.has(result.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4 border-t pt-4">
                          {/* Explanation */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Explication</Label>
                            <p className="text-sm mt-1">{result.explanation}</p>
                          </div>

                          {/* Sources */}
                          {result.sources.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Sources</Label>
                              <div className="space-y-2 mt-1">
                                {result.sources.map((source, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      'p-2 rounded border text-sm',
                                      source.supports_claim
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-red-200 bg-red-50'
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium hover:underline flex items-center gap-1"
                                      >
                                        {source.title}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                      <Badge variant="outline" className="text-xs">
                                        {source.reliability}% fiable
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {source.snippet}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Corrections */}
                          {result.corrections && result.corrections.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Corrections suggérées</Label>
                              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                {result.corrections.map((correction, idx) => (
                                  <li key={idx} className="text-green-700">{correction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FactChecker;
