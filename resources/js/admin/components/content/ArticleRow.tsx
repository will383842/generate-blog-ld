/**
 * Article Row
 * Table row for article list
 */

import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TableRow, TableCell } from '@/components/ui/Table';
import { PLATFORMS, LANGUAGES, CONTENT_TYPES } from '@/utils/constants';
import type { Article, ArticleStatus } from '@/types/article';

export interface ArticleRowProps {
  article: Article;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  pending_review: { label: 'En révision', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approuvé', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Programmé', color: 'bg-purple-100 text-purple-700' },
  published: { label: 'Publié', color: 'bg-green-100 text-green-700' },
  unpublished: { label: 'Dépublié', color: 'bg-orange-100 text-orange-700' },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-600' },
};

function QualityBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    if (score >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Badge className={cn('font-mono', getColor())}>
      {score}%
    </Badge>
  );
}

export const ArticleRow = memo(function ArticleRow({
  article,
  isSelected,
  onSelect,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  onPublish,
}: ArticleRowProps) {
  const platform = PLATFORMS.find((p) => p.id === article.platformId);
  const language = LANGUAGES.find((l) => l.code === article.languageId);
  const contentType = CONTENT_TYPES.find((t) => t.id === article.type);
  const status = STATUS_CONFIG[article.status];

  // Memoized callbacks to prevent unnecessary re-renders
  const handleSelect = useCallback(
    (checked: boolean) => onSelect?.(article.id, checked),
    [article.id, onSelect]
  );
  const handleEdit = useCallback(() => onEdit?.(article.id), [article.id, onEdit]);
  const handleView = useCallback(() => onView?.(article.id), [article.id, onView]);
  const handleDuplicate = useCallback(() => onDuplicate?.(article.id), [article.id, onDuplicate]);
  const handleDelete = useCallback(() => onDelete?.(article.id), [article.id, onDelete]);
  const handlePublish = useCallback(() => onPublish?.(article.id), [article.id, onPublish]);

  return (
    <TableRow className={cn(isSelected && 'bg-primary/5')}>
      {/* Checkbox */}
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => handleSelect(!!checked)}
        />
      </TableCell>

      {/* Image */}
      <TableCell className="w-16">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            loading="lazy"
            decoding="async"
            className="w-12 h-8 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-[10px] text-gray-400">N/A</span>
          </div>
        )}
      </TableCell>

      {/* Title */}
      <TableCell className="max-w-xs">
        <Link
          to={`/content/articles/${article.id}`}
          className="font-medium hover:text-primary line-clamp-1"
        >
          {article.title}
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {article.slug}
        </p>
      </TableCell>

      {/* Type */}
      <TableCell>
        {contentType && (
          <div className="flex items-center gap-1.5">
            <contentType.icon
              className="w-4 h-4"
              style={{ color: contentType.color }}
            />
            <span className="text-sm">{contentType.name}</span>
          </div>
        )}
      </TableCell>

      {/* Platform */}
      <TableCell>
        {platform && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: platform.color }}
            />
            <span className="text-sm">{platform.name}</span>
          </div>
        )}
      </TableCell>

      {/* Country / Language */}
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="font-medium">{article.countryId}</span>
          <span className="text-muted-foreground">/</span>
          <span>{language?.flag}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={status.color}>{status.label}</Badge>
      </TableCell>

      {/* Quality */}
      <TableCell>
        <QualityBadge score={article.qualityScore} />
      </TableCell>

      {/* Word Count */}
      <TableCell className="text-right tabular-nums">
        {article.wordCount.toLocaleString()}
      </TableCell>

      {/* Date */}
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {format(new Date(article.updatedAt), 'dd/MM/yy HH:mm', { locale: fr })}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            {article.status === 'published' && (
              <DropdownMenuItem asChild>
                <a
                  href={`https://${article.platformId}.com/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir sur le site
                </a>
              </DropdownMenuItem>
            )}
            {article.status !== 'published' && (
              <DropdownMenuItem onClick={handlePublish}>
                <Globe className="w-4 h-4 mr-2" />
                Publier
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export default ArticleRow;
