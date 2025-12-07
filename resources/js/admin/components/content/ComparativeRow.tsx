/**
 * Comparative Row
 * Table row for comparison articles list
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
  List,
  BarChart3,
  Trophy,
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
import type { Comparative, ComparativeType } from '@/types/comparative';
import type { ArticleStatus } from '@/types/article';

export interface ComparativeRowProps {
  comparative: Comparative;
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

const TYPE_LABELS: Record<ComparativeType, string> = {
  product: 'Produits',
  service: 'Services',
  provider: 'Prestataires',
  location: 'Destinations',
  method: 'Méthodes',
  general: 'Général',
};

export function ComparativeRow({
  comparative,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: ComparativeRowProps) {
  const platform = PLATFORMS.find((p) => p.id === comparative.platformId);
  const statusConfig = STATUS_CONFIG[comparative.status];
  const winnerItem = comparative.items.find((i) => i.id === comparative.winnerId);

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
            to={`/content/comparatives/${comparative.id}`}
            className="font-medium hover:text-primary line-clamp-1"
          >
            {comparative.title}
          </Link>
          <Badge variant="outline" className="text-[10px] mt-1">
            {TYPE_LABELS[comparative.comparativeType]}
          </Badge>
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
          {comparative.countryId} • {comparative.languageId.toUpperCase()}
        </span>
      </TableCell>

      {/* Items Count */}
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <List className="w-3 h-3 text-muted-foreground" />
          {comparative.items.length}
        </div>
      </TableCell>

      {/* Criteria Count */}
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <BarChart3 className="w-3 h-3 text-muted-foreground" />
          {comparative.criteria.length}
        </div>
      </TableCell>

      {/* Winner */}
      <TableCell>
        {winnerItem ? (
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-yellow-500" />
            <span className="text-sm truncate max-w-[100px]">{winnerItem.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(comparative.updatedAt), 'dd/MM/yy', { locale: fr })}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView?.(comparative.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(comparative.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(comparative.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(comparative.id)}
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

export default ComparativeRow;
