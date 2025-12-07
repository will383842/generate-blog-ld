import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Send,
  Archive,
  Trash2,
  ExternalLink,
  Layers,
  Image,
  Globe,
} from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/Table';
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
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { PressDossier, PressStatus } from '@/types/press';
import { PLATFORMS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DossierRowProps {
  dossier: PressDossier;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDuplicate: (id: number) => void;
  onPublish: (id: number) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
}

const STATUS_COLORS: Record<PressStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  pending_review: { bg: 'bg-blue-100', text: 'text-blue-700' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  published: { bg: 'bg-green-100', text: 'text-green-700' },
  archived: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

export const DossierRow: React.FC<DossierRowProps> = ({
  dossier,
  selected,
  onSelect,
  onEdit,
  onView,
  onDuplicate,
  onPublish,
  onArchive,
  onDelete,
}) => {
  const { t } = useTranslation(['press', 'common']);

  const platform = PLATFORMS.find((p) => p.id === dossier.platformId);
  const statusStyle = STATUS_COLORS[dossier.status] || STATUS_COLORS.draft;

  const sectionsCount = dossier.sections?.length || 0;
  const mediaCount = dossier.sections?.reduce((acc, s) => acc + (s.media?.length || 0), 0) || 0;
  const translationsCount = dossier.translations?.length || 0;
  const featuredMedia = dossier.sections?.[0]?.media?.[0];

  const numericId = Number(dossier.id);
  const handleEdit = useCallback(() => onEdit(numericId), [numericId, onEdit]);
  const handleView = useCallback(() => onView(numericId), [numericId, onView]);
  const handleDuplicate = useCallback(() => onDuplicate(numericId), [numericId, onDuplicate]);
  const handlePublish = useCallback(() => onPublish(numericId), [numericId, onPublish]);
  const handleArchive = useCallback(() => onArchive(numericId), [numericId, onArchive]);
  const handleDelete = useCallback(() => onDelete(numericId), [numericId, onDelete]);

  return (
    <TableRow className={cn(selected && 'bg-muted/50')}>
      {/* Checkbox */}
      <TableCell className="w-12">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>

      {/* Title & Thumbnail */}
      <TableCell>
        <div className="flex items-center gap-3">
          {featuredMedia?.url ? (
            <img
              src={featuredMedia.url}
              alt={featuredMedia.alt || dossier.title}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <Layers className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleEdit}
              className="font-medium hover:text-primary text-left truncate block max-w-xs"
            >
              {dossier.title}
            </button>
            {dossier.status === 'published' && dossier.slug && (
              <a
                href={`/press/dossiers/${dossier.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {t('press:dossier.viewOnline')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </TableCell>

      {/* Platform */}
      <TableCell>
        {platform ? (
          <Badge variant="outline">{platform.name}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={cn('text-xs', statusStyle.bg, statusStyle.text)}>
          {t(`press:status.${dossier.status}`)}
        </Badge>
      </TableCell>

      {/* Sections */}
      <TableCell className="text-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>{sectionsCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {t('press:dossier.sections', { count: sectionsCount })}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Media */}
      <TableCell className="text-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-1">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span>{mediaCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {t('press:dossier.media', { count: mediaCount })}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Translations */}
      <TableCell className="text-center">
        {translationsCount > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{translationsCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {t('press:dossier.translations', { count: translationsCount })}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(dossier.updatedAt), 'dd/MM/yyyy', { locale: fr })}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleView}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common:preview')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common:edit')}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                {t('common:preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common:edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                {t('common:duplicate')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {dossier.status !== 'published' && (
                <DropdownMenuItem onClick={handlePublish}>
                  <Send className="h-4 w-4 mr-2" />
                  {t('common:publish')}
                </DropdownMenuItem>
              )}

              {dossier.status !== 'archived' && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  {t('common:archive')}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common:delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default DossierRow;
