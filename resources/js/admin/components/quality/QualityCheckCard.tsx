/**
 * Quality Check Card Component
 * File 269 - Display card for individual quality check
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Gauge,
  ExternalLink,
  RefreshCw,
  MoreHorizontal,
  Eye,
  FileText,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useRevalidate } from '@/hooks/useQuality';
import {
  QualityCheck,
  QUALITY_CRITERIA,
  getScoreColor,
  getScoreLabel,
  getQualityStatusColor,
  getQualityStatusLabel,
} from '@/types/quality';
import { cn } from '@/lib/utils';

interface QualityCheckCardProps {
  check: QualityCheck;
  compact?: boolean;
  showActions?: boolean;
  onView?: (check: QualityCheck) => void;
}

export function QualityCheckCard({
  check,
  compact = false,
  showActions = true,
  onView,
}: QualityCheckCardProps) {
  const { t } = useTranslation();
  const revalidate = useRevalidate();

  const handleRevalidate = () => {
    revalidate.mutate(check.article_id);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: getScoreColor(check.overall_score) }}
          >
            {check.overall_score}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/quality/checks/${check.id}`}
              className="font-medium text-sm hover:underline truncate block"
            >
              {check.article_title}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {check.content_type}
              </Badge>
              <span>{new Date(check.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevalidate}
            disabled={revalidate.isPending}
          >
            <RefreshCw className={cn('h-4 w-4', revalidate.isPending && 'animate-spin')} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link
              to={`/quality/checks/${check.id}`}
              className="font-semibold hover:underline truncate block"
            >
              {check.article_title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{check.content_type}</Badge>
              <Badge
                style={{
                  backgroundColor: getQualityStatusColor(check.status),
                  color: 'white',
                }}
              >
                {getQualityStatusLabel(check.status)}
              </Badge>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/quality/checks/${check.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/content/${check.content_type}/${check.article_id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Voir l'article
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRevalidate}
                  disabled={revalidate.isPending}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', revalidate.isPending && 'animate-spin')} />
                  Revalider
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: getScoreColor(check.overall_score) }}
            >
              {check.overall_score}
            </div>
            <p className="text-xs text-muted-foreground">{getScoreLabel(check.overall_score)}</p>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${check.overall_score}%`,
                  backgroundColor: getScoreColor(check.overall_score),
                }}
              />
            </div>
          </div>
        </div>

        {/* Mini Breakdown */}
        <TooltipProvider>
          <div className="grid grid-cols-6 gap-1">
            {QUALITY_CRITERIA.map(criterion => {
              const score = check[`${criterion.key}_score` as keyof QualityCheck] as number;
              return (
                <Tooltip key={criterion.key}>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: getScoreColor(score) }}
                      >
                        {score}
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full"
                          style={{
                            width: `${score}%`,
                            backgroundColor: getScoreColor(score),
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {criterion.label.substring(0, 4)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{criterion.label}</p>
                    <p className="text-sm">{score}/100</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Metadata */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(check.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <span>{check.word_count} mots</span>
            <span>•</span>
            <span>{check.reading_time} min lecture</span>
          </div>
        </div>

        {/* Suggestions Preview */}
        {check.suggestions && check.suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">
              {check.suggestions.length} suggestion(s)
            </p>
            <div className="flex flex-wrap gap-1">
              {check.suggestions.slice(0, 3).map((s, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {s.criterion}
                </Badge>
              ))}
              {check.suggestions.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{check.suggestions.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QualityCheckCard;
