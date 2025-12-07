/**
 * Press Release Card Component
 * Grid view card for press release list
 */

import { useState } from 'react';
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
  FileText,
  Download,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { PressRelease, PressStatus, ExportFormat } from '@/types/press';

interface PressReleaseCardProps {
  pressRelease: PressRelease;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onExport: (id: string, format: ExportFormat) => void;
}

const statusConfig: Record<PressStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  pending_review: { label: 'En révision', variant: 'outline' },
  approved: { label: 'Approuvé', variant: 'default' },
  published: { label: 'Publié', variant: 'default' },
  archived: { label: 'Archivé', variant: 'secondary' },
};

export function PressReleaseCard({
  pressRelease,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onExport,
}: PressReleaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const featuredMedia = pressRelease.media?.find((m) => m.isFeatured) || pressRelease.media?.[0];
  const mediaCount = pressRelease.media?.length || 0;
  const translationsCount = pressRelease.translations?.filter((t) => t.status === 'done').length || 0;
  
  const qualityScoreColor = 
    pressRelease.qualityScore >= 80 ? 'text-green-600' :
    pressRelease.qualityScore >= 60 ? 'text-yellow-600' :
    pressRelease.qualityScore >= 40 ? 'text-orange-600' : 'text-red-600';

  const status = statusConfig[pressRelease.status];

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {featuredMedia ? (
          <img
            src={featuredMedia.thumbnailUrl || featuredMedia.url}
            alt={featuredMedia.alt || pressRelease.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button size="sm" variant="secondary" onClick={() => onView(pressRelease.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onEdit(pressRelease.id)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Platform badge */}
        {pressRelease.platformId && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-white/90">
              {pressRelease.platformId}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-2" title={pressRelease.title}>
          {pressRelease.title}
        </h3>

        {/* Excerpt */}
        {pressRelease.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {pressRelease.excerpt}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1" title={`${mediaCount} média(s)`}>
            <Image className="w-3 h-3" />
            <span>{mediaCount}</span>
          </div>
          <div className="flex items-center gap-1" title={`${translationsCount} traduction(s)`}>
            <Languages className="w-3 h-3" />
            <span>{translationsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(pressRelease.createdAt), 'dd MMM', { locale: fr })}</span>
          </div>
        </div>

        {/* Quality Score & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Qualité</span>
            <span className={cn('text-sm font-medium', qualityScoreColor)}>
              {pressRelease.qualityScore}%
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(pressRelease.id)}>
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(pressRelease.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(pressRelease.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {pressRelease.status !== 'published' && (
                <DropdownMenuItem onClick={() => onPublish(pressRelease.id)}>
                  <Globe className="w-4 h-4 mr-2" />
                  Publier
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onExport(pressRelease.id, 'pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(pressRelease.id, 'word')}>
                <Download className="w-4 h-4 mr-2" />
                Export Word
              </DropdownMenuItem>
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
      </CardContent>
    </Card>
  );
}

export default PressReleaseCard;
