/**
 * Article Card
 * Grid view card for articles
 */

import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Globe,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { PLATFORMS, LANGUAGES } from '@/utils/constants';
import type { Article, ArticleStatus } from '@/types/article';

export interface ArticleCardProps {
  article: Article;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  className?: string;
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

function getQualityColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  if (score >= 40) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export const ArticleCard = memo(function ArticleCard({
  article,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  onPublish,
  className,
}: ArticleCardProps) {
  const platform = PLATFORMS.find((p) => p.id === article.platformId);
  const language = LANGUAGES.find((l) => l.code === article.languageId);
  const status = STATUS_CONFIG[article.status];

  const handleEdit = useCallback(() => onEdit?.(article.id), [article.id, onEdit]);
  const handleView = useCallback(() => onView?.(article.id), [article.id, onView]);
  const handleDuplicate = useCallback(() => onDuplicate?.(article.id), [article.id, onDuplicate]);
  const handleDelete = useCallback(() => onDelete?.(article.id), [article.id, onDelete]);
  const handlePublish = useCallback(() => onPublish?.(article.id), [article.id, onPublish]);

  return (
    <div
      className={cn(
        'group border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        {/* Quality score overlay */}
        <div className="absolute top-2 right-2">
          <Badge className={getQualityColor(article.qualityScore)}>
            {article.qualityScore}%
          </Badge>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleView}
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Éditer
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Platform & Language */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {platform && (
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              {platform.name}
            </span>
          )}
          <span>•</span>
          <span>{article.countryId}</span>
          <span>•</span>
          <span>{language?.flag} {language?.code.toUpperCase()}</span>
        </div>

        {/* Title */}
        <Link
          to={`/content/articles/${article.id}`}
          className="block font-semibold text-lg hover:text-primary line-clamp-2 mb-2"
        >
          {article.title}
        </Link>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {article.wordCount} mots
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime} min
            </span>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
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
        </div>

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
          <Calendar className="w-3 h-3" />
          {article.publishedAt
            ? `Publié le ${format(new Date(article.publishedAt), 'dd MMM yyyy', { locale: fr })}`
            : `Créé le ${format(new Date(article.createdAt), 'dd MMM yyyy', { locale: fr })}`}
        </div>
      </div>
    </div>
  );
});

export default ArticleCard;
