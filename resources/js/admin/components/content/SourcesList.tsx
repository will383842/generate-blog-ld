/**
 * Sources List
 * Manage article sources and references
 */

import { useState } from 'react';
import {
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  GripVertical,
  Shield,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { ArticleSource, SourceReliability } from '@/types/article';

export interface SourcesListProps {
  sources: ArticleSource[];
  onChange: (sources: ArticleSource[]) => void;
  maxSources?: number;
  className?: string;
}

const RELIABILITY_CONFIG: Record<
  SourceReliability,
  { label: string; color: string; icon: typeof Shield }
> = {
  high: { label: 'Haute', color: 'bg-green-100 text-green-700', icon: Shield },
  medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  low: { label: 'Basse', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  unknown: { label: 'Inconnue', color: 'bg-gray-100 text-gray-700', icon: HelpCircle },
};

export function SourcesList({
  sources,
  onChange,
  maxSources = 20,
  className,
}: SourcesListProps) {
  const [newSource, setNewSource] = useState({
    title: '',
    url: '',
    reliability: 'medium' as SourceReliability,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addSource = () => {
    if (!newSource.url.trim()) return;

    const source: ArticleSource = {
      id: `source-${Date.now()}`,
      articleId: '',
      title: newSource.title.trim() || extractDomain(newSource.url),
      url: newSource.url.trim(),
      domain: extractDomain(newSource.url),
      reliability: newSource.reliability,
      order: sources.length,
      createdAt: new Date().toISOString(),
    };

    onChange([...sources, source]);
    setNewSource({ title: '', url: '', reliability: 'medium' });
    setIsAdding(false);
  };

  const removeSource = (id: string) => {
    onChange(sources.filter((s) => s.id !== id));
  };

  const updateReliability = (id: string, reliability: SourceReliability) => {
    onChange(
      sources.map((s) => (s.id === id ? { ...s, reliability } : s))
    );
  };

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newSources = [...sources];
    const [removed] = newSources.splice(draggedIndex, 1);
    newSources.splice(targetIndex, 0, removed);
    newSources.forEach((s, i) => (s.order = i));

    onChange(newSources);
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Sources
            <Badge variant="secondary">{sources.length}</Badge>
          </CardTitle>
          {!isAdding && sources.length < maxSources && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {isAdding && (
          <div className="p-3 border rounded-lg bg-gray-50 space-y-3">
            <Input
              placeholder="Titre (optionnel)"
              value={newSource.title}
              onChange={(e) =>
                setNewSource({ ...newSource, title: e.target.value })
              }
            />
            <Input
              placeholder="URL de la source *"
              value={newSource.url}
              onChange={(e) =>
                setNewSource({ ...newSource, url: e.target.value })
              }
            />
            <div className="flex items-center gap-2">
              <Select
                value={newSource.reliability}
                onValueChange={(v) =>
                  setNewSource({
                    ...newSource,
                    reliability: v as SourceReliability,
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Fiabilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Haute fiabilité</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="unknown">Inconnue</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addSource} disabled={!newSource.url}>
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAdding(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Sources list */}
        {sources.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucune source ajoutée
          </p>
        ) : (
          <div className="space-y-2">
            {sources.map((source, index) => {
              const reliabilityConfig = RELIABILITY_CONFIG[source.reliability];
              const ReliabilityIcon = reliabilityConfig.icon;

              return (
                <div
                  key={source.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-2 p-2 border rounded-lg bg-white',
                    draggedIndex === index && 'opacity-50'
                  )}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab hover:bg-gray-100 p-1 rounded">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Source info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {source.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {source.domain || source.url}
                    </p>
                  </div>

                  {/* Reliability */}
                  <Select
                    value={source.reliability}
                    onValueChange={(v) =>
                      updateReliability(source.id, v as SourceReliability)
                    }
                  >
                    <SelectTrigger className="w-auto h-7 px-2">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', reliabilityConfig.color)}
                      >
                        <ReliabilityIcon className="w-3 h-3 mr-1" />
                        {reliabilityConfig.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="unknown">Inconnue</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => window.open(source.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600"
                    onClick={() => removeSource(source.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {sources.length > 0 && (
          <div className="flex gap-4 pt-3 border-t text-xs text-muted-foreground">
            <span>
              {sources.filter((s) => s.reliability === 'high').length} haute fiabilité
            </span>
            <span>
              {sources.filter((s) => s.reliability === 'medium').length} moyenne
            </span>
            <span>
              {sources.filter((s) => s.reliability === 'low' || s.reliability === 'unknown').length} basse/inconnue
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SourcesList;
