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
  FileText,
  Layers,
  Image,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { PressDossier, PressStatus } from '@/types/press';
import { PLATFORMS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DossierCardProps {
  dossier: PressDossier;
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

export const DossierCard: React.FC<DossierCardProps> = ({
  dossier,
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
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {platform && (
              <Badge variant="outline" className="text-xs">
                {platform.name}
              </Badge>
            )}
            <Badge className={cn('text-xs', statusStyle.bg, statusStyle.text)}>
              {t(`press:status.${dossier.status}`)}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
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
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {/* Featured Image */}
        {featuredMedia?.url ? (
          <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
            <img
              src={featuredMedia.url}
              alt={featuredMedia.alt || dossier.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleView}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-3">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Title */}
        <h3
          className="font-semibold line-clamp-2 mb-2 cursor-pointer hover:text-primary"
          onClick={handleEdit}
        >
          {dossier.title}
        </h3>

        {/* Description */}
        {dossier.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {dossier.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>{sectionsCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {t('press:dossier.sections', { count: sectionsCount })}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                <span>{mediaCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {t('press:dossier.media', { count: mediaCount })}
            </TooltipContent>
          </Tooltip>

          {translationsCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>{translationsCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {t('press:dossier.translations', { count: translationsCount })}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(dossier.updatedAt), 'dd MMM yyyy', { locale: fr })}
        </span>

        {dossier.status === 'published' && dossier.slug && (
          <a
            href={`/press/dossiers/${dossier.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {t('press:dossier.viewOnline')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
};

export default DossierCard;
