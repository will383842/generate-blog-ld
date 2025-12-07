import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Send,
  Archive,
  Trash2,
  Layers,
  Globe,
  ExternalLink,
  BarChart3,
  MousePointer,
  Layout,
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
import { Landing, LandingStatus } from '@/types/landing';
import { PLATFORMS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LandingCardProps {
  landing: Landing;
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

export const LandingCard: React.FC<LandingCardProps> = memo(({
  landing,
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
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {platform && (
              <Badge variant="outline" className="text-xs">
                {platform.name}
              </Badge>
            )}
            <Badge className={cn('text-xs', statusStyle.bg, statusStyle.text)}>
              {t(`landing:status.${landing.status}`)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {TYPE_LABELS[landing.type] || landing.type}
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
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {/* Featured Image / Preview */}
        {landing.featuredImage ? (
          <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
            <img
              src={landing.featuredImage}
              alt={landing.title}
              loading="lazy"
              decoding="async"
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
          <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3">
            <Layout className="h-12 w-12 text-primary/30" />
          </div>
        )}

        {/* Title */}
        <h3
          className="font-semibold line-clamp-2 mb-2 cursor-pointer hover:text-primary"
          onClick={handleEdit}
        >
          {landing.title}
        </h3>

        {/* Description */}
        {landing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {landing.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>{sectionsCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {t('landing:sections', { count: sectionsCount })}
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
                {t('landing:translations', { count: translationsCount })}
              </TooltipContent>
            </Tooltip>
          )}

          {landing.viewCount !== undefined && landing.viewCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{landing.viewCount.toLocaleString()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {t('landing:views')}
              </TooltipContent>
            </Tooltip>
          )}

          {landing.conversionRate !== undefined && landing.conversionRate > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <MousePointer className="h-4 w-4" />
                  <span>{landing.conversionRate.toFixed(1)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {t('landing:conversionRate')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Quality Scores */}
        {(landing.qualityScore || landing.seoScore) && (
          <div className="flex items-center gap-2 mt-3">
            {landing.qualityScore !== undefined && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  landing.qualityScore >= 80
                    ? 'bg-green-100 text-green-700'
                    : landing.qualityScore >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                {landing.qualityScore}%
              </Badge>
            )}
            {landing.seoScore !== undefined && (
              <Badge variant="secondary" className="text-xs">
                SEO: {landing.seoScore}%
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(landing.updatedAt), 'dd MMM yyyy', { locale: fr })}
        </span>

        {landing.publicUrl && landing.status === 'published' && (
          <a
            href={landing.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {t('landing:viewOnline')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
});

export default LandingCard;
