/**
 * Comparative Card
 * Grid view card for comparison articles
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
  Trophy,
  List,
  Scale,
  BarChart3,
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
import { PLATFORMS } from '@/utils/constants';
import type { Comparative, ComparativeType } from '@/types/comparative';
import type { ArticleStatus } from '@/types/article';

export interface ComparativeCardProps {
  comparative: Comparative;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  pending_review: { label: 'En révision', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approuvé', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Programmé', color: 'bg-purple-100 text-purple-700' },
  published: { label: 'Publié', color: 'bg-green-100 text-green-700' },
  unpublished: { label: 'Dépublié', color: 'bg-orange-100 text-orange-700' },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-500' },
};

const TYPE_CONFIG: Record<ComparativeType, { label: string; color: string }> = {
  product: { label: 'Produits', color: 'bg-blue-100 text-blue-700' },
  service: { label: 'Services', color: 'bg-green-100 text-green-700' },
  provider: { label: 'Prestataires', color: 'bg-purple-100 text-purple-700' },
  location: { label: 'Destinations', color: 'bg-orange-100 text-orange-700' },
  method: { label: 'Méthodes', color: 'bg-pink-100 text-pink-700' },
  general: { label: 'Général', color: 'bg-gray-100 text-gray-700' },
};

export const ComparativeCard = memo(function ComparativeCard({
  comparative,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: ComparativeCardProps) {
  const platform = PLATFORMS.find((p) => p.id === comparative.platformId);
  const statusConfig = STATUS_CONFIG[comparative.status];
  const typeConfig = TYPE_CONFIG[comparative.comparativeType];

  const winnerItem = comparative.items.find((i) => i.id === comparative.winnerId);

  const handleView = useCallback(() => onView?.(comparative.id), [comparative.id, onView]);
  const handleEdit = useCallback(() => onEdit?.(comparative.id), [comparative.id, onEdit]);
  const handleDuplicate = useCallback(() => onDuplicate?.(comparative.id), [comparative.id, onDuplicate]);
  const handleDelete = useCallback(() => onDelete?.(comparative.id), [comparative.id, onDelete]);

  return (
    <div
      className={cn(
        'bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={typeConfig.color}>
              <Scale className="w-3 h-3 mr-1" />
              {typeConfig.label}
            </Badge>
            {platform && (
              <Badge variant="outline">
                <span
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: platform.color }}
                />
                {platform.name}
              </Badge>
            )}
          </div>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link to={`/content/comparatives/${comparative.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {comparative.title}
          </h3>
        </Link>

        {/* Winner */}
        {winnerItem && comparative.highlightWinner && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-yellow-700">Gagnant</p>
              <p className="font-medium text-sm truncate">{winnerItem.name}</p>
            </div>
            {winnerItem.imageUrl && (
              <img
                src={winnerItem.imageUrl}
                alt={winnerItem.name}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 rounded object-cover"
              />
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <List className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{comparative.items.length}</p>
            <p className="text-[10px] text-muted-foreground">éléments</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <BarChart3 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{comparative.criteria.length}</p>
            <p className="text-[10px] text-muted-foreground">critères</p>
          </div>
        </div>

        {/* Items Preview */}
        <div className="flex items-center gap-1 mt-3">
          {comparative.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex-1 text-center p-1 bg-gray-50 rounded text-xs truncate',
                item.isWinner && 'bg-yellow-50 border border-yellow-200'
              )}
            >
              {item.name}
            </div>
          ))}
          {comparative.items.length > 4 && (
            <Badge variant="outline">+{comparative.items.length - 4}</Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span>
            {comparative.countryId} • {comparative.languageId.toUpperCase()}
          </span>
          <span>
            {format(new Date(comparative.updatedAt), 'dd MMM', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleView} aria-label="Aperçu">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEdit} aria-label="Modifier">
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Plus d'actions">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
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
    </div>
  );
});

export default ComparativeCard;
