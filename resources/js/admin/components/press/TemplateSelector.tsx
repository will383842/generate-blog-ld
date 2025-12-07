import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Search, FileText, Check, Eye, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  isFavorite?: boolean;
  isDefault?: boolean;
  variables?: string[];
}

export interface TemplateSelectorProps {
  templates: Template[];
  selectedId?: string;
  onSelect: (template: Template) => void;
  onPreview?: (template: Template) => void;
  onToggleFavorite?: (templateId: string) => void;
  categories?: string[];
  showSearch?: boolean;
  showCategories?: boolean;
  className?: string;
}

export function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  onPreview,
  onToggleFavorite,
  categories,
  showSearch = true,
  showCategories = true,
  className,
}: TemplateSelectorProps) {
  const { t } = useTranslation('press');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Derive categories from templates if not provided
  const derivedCategories = categories || [
    ...new Set(templates.map((t) => t.category)),
  ];

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !activeCategory || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category if not filtering
  const groupedTemplates = !activeCategory
    ? derivedCategories.reduce((acc, category) => {
        acc[category] = filteredTemplates.filter(
          (t) => t.category === category
        );
        return acc;
      }, {} as Record<string, Template[]>)
    : { [activeCategory]: filteredTemplates };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    onPreview?.(template);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('templates.search')}
              className="pl-9"
            />
          </div>
        )}
        {showCategories && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
            >
              {t('templates.all')}
            </Button>
            {derivedCategories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Templates grid */}
      {Object.entries(groupedTemplates).map(
        ([category, categoryTemplates]) =>
          categoryTemplates.length > 0 && (
            <div key={category} className="space-y-3">
              {!activeCategory && (
                <h3 className="font-semibold text-lg">{category}</h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedId === template.id &&
                        'ring-2 ring-primary'
                    )}
                    onClick={() => onSelect(template)}
                  >
                    {/* Thumbnail */}
                    {template.thumbnail && (
                      <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{template.name}</span>
                          </CardTitle>
                          {template.description && (
                            <CardDescription className="line-clamp-2 mt-1">
                              {template.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {selectedId === template.id && (
                            <div className="p-1 bg-primary rounded-full">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((v) => (
                              <Badge
                                key={v}
                                variant="outline"
                                className="text-xs"
                              >
                                {v}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          {onToggleFavorite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(template.id);
                              }}
                            >
                              <Star
                                className={cn(
                                  'h-4 w-4',
                                  template.isFavorite &&
                                    'fill-yellow-400 text-yellow-400'
                                )}
                              />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(template);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
      )}

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('templates.noResults')}</p>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate?.thumbnail && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={previewTemplate.thumbnail}
                alt={previewTemplate.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
            >
              {t('actions.close')}
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  onSelect(previewTemplate);
                  setPreviewTemplate(null);
                }
              }}
            >
              {t('templates.use')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateSelector;
