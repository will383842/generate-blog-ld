/**
 * Violations List Component
 * File 255 - Display brand violations with highlighting and fix suggestions
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Wand2,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Violation,
  ViolationSeverity,
  getViolationSeverityColor,
  getViolationSeverityLabel,
} from '@/types/brand';
import { cn } from '@/lib/utils';

// Extended violation with article context
interface ViolationWithContext extends Violation {
  article_id?: number;
  article_title?: string;
  article_type?: string;
}

interface ViolationsListProps {
  violations: ViolationWithContext[];
  onFix?: (violation: ViolationWithContext) => void;
  onFixSelected?: (violations: ViolationWithContext[]) => void;
  onDismiss?: (violation: ViolationWithContext) => void;
  showArticleLinks?: boolean;
  highlightText?: string;
  maxHeight?: string;
  compact?: boolean;
}

export function ViolationsList({
  violations,
  onFix,
  onFixSelected,
  onDismiss,
  showArticleLinks = true,
  highlightText,
  maxHeight = '500px',
  compact = false,
}: ViolationsListProps) {
  const { t } = useTranslation();

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<ViolationSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get unique violation types
  const violationTypes = [...new Set(violations.map(v => v.type))];

  // Filter violations
  const filteredViolations = violations.filter(v => {
    if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    return true;
  });

  // Group by severity
  const groupedBySeverity = filteredViolations.reduce((acc, v) => {
    if (!acc[v.severity]) acc[v.severity] = [];
    acc[v.severity].push(v);
    return acc;
  }, {} as Record<ViolationSeverity, ViolationWithContext[]>);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredViolations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredViolations.map(v => v.id)));
    }
  };

  // Expand/collapse handlers
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Copy suggestion
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle fix selected
  const handleFixSelected = () => {
    const selectedViolations = filteredViolations.filter(v => selectedIds.has(v.id));
    onFixSelected?.(selectedViolations);
  };

  // Severity icon
  const getSeverityIcon = (severity: ViolationSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" style={{ color: getViolationSeverityColor(severity) }} />;
      case 'major':
        return <AlertTriangle className="h-4 w-4" style={{ color: getViolationSeverityColor(severity) }} />;
      case 'minor':
        return <AlertTriangle className="h-4 w-4" style={{ color: getViolationSeverityColor(severity) }} />;
      default:
        return <Info className="h-4 w-4" style={{ color: getViolationSeverityColor(severity) }} />;
    }
  };

  // Highlight context text
  const highlightContext = (context: string) => {
    if (!highlightText) return context;
    
    const regex = new RegExp(`(${highlightText})`, 'gi');
    const parts = context.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Auto-fixable count
  const autoFixableCount = filteredViolations.filter(v => v.auto_fixable).length;
  const selectedAutoFixable = filteredViolations.filter(
    v => selectedIds.has(v.id) && v.auto_fixable
  ).length;

  if (violations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Check className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="font-medium text-lg">Aucune violation</h3>
          <p className="text-muted-foreground text-sm">
            Le contenu est conforme aux guidelines
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredViolations.slice(0, 5).map(violation => (
          <div
            key={violation.id}
            className="flex items-start gap-2 p-2 border rounded text-sm"
          >
            {getSeverityIcon(violation.severity)}
            <div className="flex-1 min-w-0">
              <p className="truncate">{violation.message}</p>
              {violation.article_title && showArticleLinks && (
                <Link
                  to={`/content/${violation.article_type}/${violation.article_id}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {violation.article_title}
                </Link>
              )}
            </div>
          </div>
        ))}
        {filteredViolations.length > 5 && (
          <p className="text-sm text-muted-foreground text-center">
            +{filteredViolations.length - 5} autres violations
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Select All */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === filteredViolations.length && filteredViolations.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} sélectionnée(s)` : 'Tout sélectionner'}
            </span>
          </div>

          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onValueChange={(v) => setSeverityFilter(v as ViolationSeverity | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="critical">Critiques</SelectItem>
              <SelectItem value="major">Majeures</SelectItem>
              <SelectItem value="minor">Mineures</SelectItem>
              <SelectItem value="info">Infos</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {violationTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && onFixSelected && selectedAutoFixable > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixSelected}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Corriger ({selectedAutoFixable})
            </Button>
          )}
          <Badge variant="outline">
            {filteredViolations.length} violation(s)
          </Badge>
          {autoFixableCount > 0 && (
            <Badge variant="secondary">
              {autoFixableCount} auto-fixable(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Violations List */}
      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-2">
          {(['critical', 'major', 'minor', 'info'] as ViolationSeverity[]).map(severity => {
            const items = groupedBySeverity[severity];
            if (!items || items.length === 0) return null;

            return (
              <div key={severity} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium sticky top-0 bg-background py-1">
                  {getSeverityIcon(severity)}
                  <span>{getViolationSeverityLabel(severity)}</span>
                  <Badge variant="outline" className="text-xs">
                    {items.length}
                  </Badge>
                </div>

                {items.map(violation => (
                  <Collapsible
                    key={violation.id}
                    open={expandedIds.has(violation.id)}
                    onOpenChange={() => toggleExpanded(violation.id)}
                  >
                    <div
                      className={cn(
                        'border rounded-lg transition-colors',
                        selectedIds.has(violation.id) && 'border-primary bg-primary/5'
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 p-3">
                        <Checkbox
                          checked={selectedIds.has(violation.id)}
                          onCheckedChange={() => toggleSelection(violation.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{violation.message}</p>
                              {violation.context && (
                                <p className="text-sm text-muted-foreground mt-1 font-mono">
                                  "{highlightContext(violation.context)}"
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {violation.auto_fixable && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-xs">
                                        Auto-fix
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Correction automatique disponible
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {violation.type}
                              </Badge>
                            </div>
                          </div>

                          {/* Article Link */}
                          {violation.article_title && showArticleLinks && (
                            <Link
                              to={`/content/${violation.article_type}/${violation.article_id}`}
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {violation.article_title}
                            </Link>
                          )}
                        </div>

                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedIds.has(violation.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      {/* Expanded Content */}
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-0 space-y-3 border-t ml-8">
                          {/* Position Info */}
                          {violation.position && (
                            <div className="text-xs text-muted-foreground pt-3">
                              Position: caractères {violation.position.start}-{violation.position.end}
                              {violation.position.line && `, ligne ${violation.position.line}`}
                            </div>
                          )}

                          {/* Suggestion */}
                          {violation.suggestion && (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                                    <Wand2 className="h-4 w-4" />
                                    Suggestion
                                  </p>
                                  <p className="text-sm text-green-700 mt-1">
                                    {violation.suggestion}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(violation.suggestion!, violation.id)}
                                >
                                  {copiedId === violation.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2">
                            {onFix && violation.auto_fixable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onFix(violation)}
                              >
                                <Wand2 className="h-4 w-4 mr-2" />
                                Corriger
                              </Button>
                            )}
                            {onDismiss && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDismiss(violation)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Ignorer
                              </Button>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ViolationsList;
