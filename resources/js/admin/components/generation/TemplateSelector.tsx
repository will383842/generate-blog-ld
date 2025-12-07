/**
 * Template Selector
 * Dropdown for selecting generation templates
 */

import { useState, useMemo } from 'react';
import { FileText, Star, Info, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useTemplates } from '@/hooks/useTemplates';
import type { ContentTypeId } from '@/types/program';
import type { Template } from '@/types/generation';

export interface TemplateSelectorProps {
  contentType: ContentTypeId;
  selected: string | null;
  onChange: (templateId: string | null) => void;
  className?: string;
}

export function TemplateSelector({
  contentType,
  selected,
  onChange,
  className,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data: templatesData, isLoading } = useTemplates({ contentType });
  const templates = templatesData?.data || [];

  const selectedTemplate = templates.find((t) => t.id === selected);
  const defaultTemplate = templates.find((t) => t.isDefault);

  // Auto-select default if none selected
  useMemo(() => {
    if (!selected && defaultTemplate) {
      onChange(defaultTemplate.id);
    }
  }, [selected, defaultTemplate, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white',
              'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {selectedTemplate ? (
                <span>{selectedTemplate.name}</span>
              ) : (
                <span className="text-muted-foreground">
                  Sélectionnez un template...
                </span>
              )}
              {selectedTemplate?.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Défaut
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )} />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Chargement...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Aucun template disponible
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 cursor-pointer',
                    'hover:bg-gray-50 border-b last:border-0',
                    selected === template.id && 'bg-primary/5'
                  )}
                  onClick={() => {
                    onChange(template.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {template.variables.slice(0, 3).map((v) => (
                        <Badge key={v.name} variant="outline" className="text-[10px]">
                          {`{{${v.name}}}`}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                        className="p-1.5 rounded hover:bg-gray-200"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Aperçu</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">{previewTemplate.name}</h3>
            {previewTemplate.description && (
              <p className="text-muted-foreground text-sm mb-4">
                {previewTemplate.description}
              </p>
            )}
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {previewTemplate.content}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Variables:</p>
              <div className="flex flex-wrap gap-2">
                {previewTemplate.variables.map((v) => (
                  <Badge key={v.name} variant="secondary">
                    {`{{${v.name}}}`} - {v.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateSelector;
