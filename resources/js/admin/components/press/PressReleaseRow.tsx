/**
 * Press Release Row Component
 * Table view row for press release list
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Eye,
  Edit,
  Copy,
  Trash2,
  Globe,
  MoreVertical,
  Image,
  Languages,
  ExternalLink,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
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
import type { PressRelease, PressStatus, ExportFormat } from '@/types/press';

interface PressReleaseRowProps {
  pressRelease: PressRelease;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish?: (id: string) => void;
  onExport?: (id: string, format: ExportFormat) => void;
}

const statusConfig: Record<PressStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  pending_review: { label: 'En révision', variant: 'outline' },
  approved: { label: 'Approuvé', variant: 'default' },
  published: { label: 'Publié', variant: 'default' },
  archived: { label: 'Archivé', variant: 'secondary' },
};

const platformColors: Record<string, string> = {
  'sos-expat': 'bg-red-100 text-red-800',
  'ulixai': 'bg-blue-100 text-blue-800',
  'ulysse': 'bg-purple-100 text-purple-800',
};

export function PressReleaseRow({
  pressRelease,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onExport,
}: PressReleaseRowProps) {
  const featuredMedia = pressRelease.media?.find((m) => m.isFeatured) || pressRelease.media?.[0];
  const mediaCount = pressRelease.media?.length || 0;
  const translationsCount = pressRelease.translations?.filter((t) => t.status === 'done').length || 0;
  
  const qualityScoreColor = 
    pressRelease.qualityScore >= 80 ? 'text-green-600 bg-green-50' :
    pressRelease.qualityScore >= 60 ? 'text-yellow-600 bg-yellow-50' :
    pressRelease.qualityScore >= 40 ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50';

  const status = statusConfig[pressRelease.status];
  const platformColor = platformColors[pressRelease.platformId] || 'bg-gray-100 text-gray-800';

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      {/* Checkbox */}
      <td className="p-3 w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(pressRelease.id, checked as boolean)}
        />
      </td>

      {/* Title + Thumbnail */}
      <td className="p-3">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
            {featuredMedia ? (
              <img
                src={featuredMedia.thumbnailUrl || featuredMedia.url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Image className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Title + Excerpt */}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate" title={pressRelease.title}>
              {pressRelease.title}
            </p>
            {pressRelease.excerpt && (
              <p className="text-xs text-muted-foreground truncate" title={pressRelease.excerpt}>
                {pressRelease.excerpt}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Platform */}
      <td className="p-3">
        <Badge className={cn('text-xs', platformColor)}>
          {pressRelease.platformId}
        </Badge>
      </td>

      {/* Status */}
      <td className="p-3">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>

      {/* Media Count */}
      <td className="p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Image className="w-4 h-4" />
                <span className="text-sm">{mediaCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {mediaCount} média{mediaCount > 1 ? 's' : ''} attaché{mediaCount > 1 ? 's' : ''}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>

      {/* Translations Count */}
      <td className="p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Languages className="w-4 h-4" />
                <span className="text-sm">{translationsCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {translationsCount} traduction{translationsCount > 1 ? 's' : ''} complète{translationsCount > 1 ? 's' : ''}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>

      {/* Quality Score */}
      <td className="p-3">
        <span className={cn('text-sm font-medium px-2 py-1 rounded', qualityScoreColor)}>
          {pressRelease.qualityScore}%
        </span>
      </td>

      {/* Date */}
      <td className="p-3">
        <div className="text-sm text-muted-foreground">
          {format(new Date(pressRelease.createdAt), 'dd MMM yyyy', { locale: fr })}
        </div>
        {pressRelease.publishedAt && (
          <div className="text-xs text-green-600">
            Publié {format(new Date(pressRelease.publishedAt), 'dd/MM', { locale: fr })}
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="p-3">
        <div className="flex items-center justify-end gap-1">
          {/* Quick actions */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => onView(pressRelease.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aperçu</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => onEdit(pressRelease.id)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(pressRelease.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              
              {pressRelease.status === 'published' && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/${pressRelease.platformId}/press/${pressRelease.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir en ligne
                  </a>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              
              {pressRelease.status !== 'published' && onPublish && (
                <DropdownMenuItem onClick={() => onPublish(pressRelease.id)}>
                  <Globe className="w-4 h-4 mr-2" />
                  Publier
                </DropdownMenuItem>
              )}
              
              {onExport && (
                <>
                  <DropdownMenuItem onClick={() => onExport(pressRelease.id, 'pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport(pressRelease.id, 'word')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Word
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => onDelete(pressRelease.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export default PressReleaseRow;
