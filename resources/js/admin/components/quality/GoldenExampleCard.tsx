/**
 * Golden Example Card Component
 * File 272 - Display card for golden examples
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Eye,
  Tag,
  Clock,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useUnmarkGolden } from '@/hooks/useGoldenExamples';
import { GoldenExample, getScoreColor } from '@/types/quality';
import { cn } from '@/lib/utils';

interface GoldenExampleCardProps {
  example: GoldenExample;
  compact?: boolean;
  showActions?: boolean;
  onView?: (example: GoldenExample) => void;
  onUnmark?: (example: GoldenExample) => void;
}

export function GoldenExampleCard({
  example,
  compact = false,
  showActions = true,
  onView,
  onUnmark,
}: GoldenExampleCardProps) {
  const { t } = useTranslation();
  const unmarkGolden = useUnmarkGolden();

  const handleUnmark = () => {
    if (onUnmark) {
      onUnmark(example);
    } else {
      unmarkGolden.mutate(example.id);
    }
  };

  const isPositive = example.example_type === 'positive';

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 border rounded-lg transition-colors',
          isPositive ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isPositive ? 'bg-green-100' : 'bg-red-100'
            )}
          >
            {isPositive ? (
              <ThumbsUp className="h-4 w-4 text-green-600" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/content/${example.content_type}/${example.article_id}`}
              className="font-medium text-sm hover:underline truncate block"
            >
              {example.article_title}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {example.category}
              </Badge>
              <span>{example.content_type}</span>
            </div>
          </div>
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnmark}
            disabled={unmarkGolden.isPending}
          >
            <Trash2 className={cn('h-4 w-4', unmarkGolden.isPending && 'animate-spin')} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        isPositive ? 'border-green-200' : 'border-red-200'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-lg',
                isPositive ? 'bg-green-100' : 'bg-red-100'
              )}
            >
              {isPositive ? (
                <ThumbsUp className="h-5 w-5 text-green-600" />
              ) : (
                <ThumbsDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <Badge variant={isPositive ? 'default' : 'destructive'}>
                {isPositive ? 'Exemple positif' : 'Exemple négatif'}
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
                  <Link to={`/content/${example.content_type}/${example.article_id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir l'article
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleUnmark}
                  disabled={unmarkGolden.isPending}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Retirer des exemples
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Title */}
        <Link
          to={`/content/${example.content_type}/${example.article_id}`}
          className="font-semibold hover:underline block mb-2"
        >
          {example.article_title}
        </Link>

        {/* Excerpt */}
        {example.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {example.excerpt}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline">{example.category}</Badge>
          <Badge variant="secondary">{example.content_type}</Badge>
          {example.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {example.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{example.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Quality Score */}
        {example.quality_score !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <span
              className="font-medium"
              style={{ color: getScoreColor(example.quality_score) }}
            >
              {example.quality_score}/100
            </span>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {example.marked_by_name}
              </TooltipTrigger>
              <TooltipContent>
                Marqué par {example.marked_by_name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(example.marked_at).toLocaleDateString()}
              </TooltipTrigger>
              <TooltipContent>
                Marqué le {new Date(example.marked_at).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>
            Utilisé {example.usage_count} fois
          </span>
        </div>

        {/* Inactive badge */}
        {!example.is_active && (
          <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-600">
            Inactif
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default GoldenExampleCard;
