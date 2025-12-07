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
  Globe,
  MousePointer,
  Layout,
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
import { Landing, LandingStatus } from '@/types/landing';
import { PLATFORMS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LandingRowProps {
  landing: Landing;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDuplicate: (id: number) => void;
  onPublish: (id: number) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
}

const STATUS_COLORS: Record<LandingStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  review: { bg: 'bg-blue-100', text: 'text-blue-700' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  published: { bg: 'bg-green-100', text: 'text-green-700' },
  archived: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

const TYPE_LABELS: Record<Landing['type'], string> = {
  service: 'Service',
  product: 'Produit',
  campaign: 'Campagne',
  event: 'Événement',
  generic: 'Générique',
};

export const LandingRow: React.FC<LandingRowProps> = ({
  landing,
  selected,
  onSelect,
  onEdit,
  onView,
  onDuplicate,
  onPublish,
  onArchive,
  onDelete,
}) => {
  const { t } = useTranslation(['landing', 'common']);

  const platform = PLATFORMS.find((p) => p.id === landing.platform);
  const statusStyle = STATUS_COLORS[landing.status] || STATUS_COLORS.draft;

  const sectionsCount = landing.sectionsCount || landing.sections?.length || 0;
  const translationsCount = landing.translations?.length || 0;

  const handleEdit = useCallback(() => onEdit(landing.id), [landing.id, onEdit]);
  const handleView = useCallback(() => onView(landing.id), [landing.id, onView]);
  const handleDuplicate = useCallback(() => onDuplicate(landing.id), [landing.id, onDuplicate]);
  const handlePublish = useCallback(() => onPublish(landing.id), [landing.id, onPublish]);
  const handleArchive = useCallback(() => onArchive(landing.id), [landing.id, onArchive]);
  const handleDelete = useCallback(() => onDelete(landing.id), [landing.id, onDelete]);

  return (
    <TableRow className={cn(selected && 'bg-muted/50')}>
      {/* Checkbox */}
      <TableCell className="w-12">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>

      {/* Title & Thumbnail */}
      <TableCell>
        <div className="flex items-center gap-3">
          {landing.featuredImage ? (
            <img
              src={landing.featuredImage}
              alt={landing.title}
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Layout className="h-5 w-5 text-primary/50" />
            </div>
          )}
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleEdit}
              className="font-medium hover:text-primary text-left truncate block max-w-xs"
            >
              {landing.title}
            </button>
            {landing.publicUrl && landing.status === 'published' && (
              <a
                href={landing.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {t('landing:viewOnline')}
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

      {/* Type */}
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABELS[landing.type] || landing.type}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={cn('text-xs', statusStyle.bg, statusStyle.text)}>
          {t(`landing:status.${landing.status}`)}
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
            {t('landing:sections', { count: sectionsCount })}
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
              {t('landing:translations', { count: translationsCount })}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Views */}
      <TableCell className="text-center">
        {landing.viewCount !== undefined && landing.viewCount > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{landing.viewCount.toLocaleString()}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t('landing:views')}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Conversion */}
      <TableCell className="text-center">
        {landing.conversionRate !== undefined && landing.conversionRate > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1">
                <MousePointer className="h-4 w-4 text-muted-foreground" />
                <span
                  className={cn(
                    landing.conversionRate >= 5
                      ? 'text-green-600'
                      : landing.conversionRate >= 2
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                  )}
                >
                  {landing.conversionRate.toFixed(1)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t('landing:conversionRate')}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(landing.updatedAt), 'dd/MM/yyyy', { locale: fr })}
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

              {landing.status !== 'published' && (
                <DropdownMenuItem onClick={handlePublish}>
                  <Send className="h-4 w-4 mr-2" />
                  {t('common:publish')}
                </DropdownMenuItem>
              )}

              {landing.status !== 'archived' && (
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

export default LandingRow;
