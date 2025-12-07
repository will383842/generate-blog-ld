/**
 * Pillar Row
 * Table row for pillar content list
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Eye,
  Edit,
  MoreVertical,
  Copy,
  Trash2,
  BookOpen,
  Quote,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TableRow, TableCell } from '@/components/ui/Table';
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

export interface PillarRowProps {
  pillar: Pillar;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  pending_review: { label: 'Révision', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approuvé', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Programmé', color: 'bg-purple-100 text-purple-700' },
  published: { label: 'Publié', color: 'bg-green-100 text-green-700' },
  unpublished: { label: 'Dépublié', color: 'bg-orange-100 text-orange-700' },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-500' },
};

const PILLAR_TYPE_LABELS: Record<PillarType, string> = {
  cornerstone: 'Pierre angulaire',
  hub: 'Hub',
  cluster: 'Cluster',
  supporting: 'Support',
};

export function PillarRow({
  pillar,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: PillarRowProps) {
  const platform = PLATFORMS.find((p) => p.id === pillar.platformId);
  const statusConfig = STATUS_CONFIG[pillar.status];

  const formatWordCount = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <TableRow className={cn(isSelected && 'bg-primary/5')}>
      {/* Checkbox */}
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect?.(checked as boolean)}
        />
      </TableCell>

      {/* Title & Type */}
      <TableCell>
        <div>
          <Link
            to={`/content/pillars/${pillar.id}`}
            className="font-medium hover:text-primary line-clamp-1"
          >
            {pillar.title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px]">
              {PILLAR_TYPE_LABELS[pillar.pillarType]}
            </Badge>
            {pillar.themeId && (
              <span className="text-xs text-muted-foreground">{pillar.themeId}</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Platform */}
      <TableCell>
        {platform && (
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: platform.color }}
            />
            <span className="text-sm">{platform.name}</span>
          </div>
        )}
      </TableCell>

      {/* Context */}
      <TableCell>
        <span className="text-sm">
          {pillar.countryId} • {pillar.languageId.toUpperCase()}
        </span>
      </TableCell>

      {/* Word Count */}
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <BookOpen className="w-3 h-3 text-muted-foreground" />
          {formatWordCount(pillar.wordCount)}
        </div>
      </TableCell>

      {/* Sources */}
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <BarChart3 className="w-3 h-3 text-muted-foreground" />
          {pillar.sourcesCount}
        </div>
      </TableCell>

      {/* Citations */}
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Quote className="w-3 h-3 text-muted-foreground" />
          {pillar.citationsCount}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </TableCell>

      {/* Quality */}
      <TableCell>
        <span
          className={cn(
            'text-sm font-medium',
            pillar.qualityScore >= 80 && 'text-green-600',
            pillar.qualityScore >= 60 && pillar.qualityScore < 80 && 'text-yellow-600',
            pillar.qualityScore < 60 && 'text-red-600'
          )}
        >
          {pillar.qualityScore}%
        </span>
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(pillar.updatedAt), 'dd/MM/yy', { locale: fr })}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView?.(pillar.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
      </TableCell>
    </TableRow>
  );
}

export default PillarRow;
