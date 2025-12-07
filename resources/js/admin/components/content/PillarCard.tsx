/**
 * Pillar Card
 * Grid view card for pillar content
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileText,
  BookOpen,
  Quote,
  BarChart3,
  Layers,
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
import type { Pillar, PillarType } from '@/types/pillar';
import type { ArticleStatus } from '@/types/article';

export interface PillarCardProps {
  pillar: Pillar;
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

const PILLAR_TYPE_CONFIG: Record<PillarType, { label: string; color: string; icon: typeof Layers }> = {
  cornerstone: { label: 'Pierre angulaire', color: 'bg-purple-100 text-purple-700', icon: Layers },
  hub: { label: 'Hub', color: 'bg-blue-100 text-blue-700', icon: Layers },
  cluster: { label: 'Cluster', color: 'bg-green-100 text-green-700', icon: Layers },
  supporting: { label: 'Support', color: 'bg-gray-100 text-gray-700', icon: FileText },
};

export function PillarCard({
  pillar,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: PillarCardProps) {
  const platform = PLATFORMS.find((p) => p.id === pillar.platformId);
  const statusConfig = STATUS_CONFIG[pillar.status];
  const typeConfig = PILLAR_TYPE_CONFIG[pillar.pillarType];

  const formatWordCount = (count: number): string => {
    if (count >= 10000) return `${(count / 1000).toFixed(1)}k`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div
      className={cn(
        'bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header with type badge */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={typeConfig.color}>
              <typeConfig.icon className="w-3 h-3 mr-1" />
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
        <Link to={`/content/pillars/${pillar.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {pillar.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {pillar.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {pillar.excerpt}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <BookOpen className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{formatWordCount(pillar.wordCount)}</p>
            <p className="text-[10px] text-muted-foreground">mots</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <BarChart3 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{pillar.sourcesCount}</p>
            <p className="text-[10px] text-muted-foreground">sources</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <Quote className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{pillar.citationsCount}</p>
            <p className="text-[10px] text-muted-foreground">citations</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span>
            {pillar.countryId} • {pillar.languageId.toUpperCase()}
          </span>
          <span>
            {format(new Date(pillar.updatedAt), 'dd MMM', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onView?.(pillar.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit?.(pillar.id)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(pillar.id)}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(pillar.id)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(pillar.id)}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(pillar.id)}
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
}

export default PillarCard;
