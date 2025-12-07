import { useState, useMemo } from 'react';
import { Search, X, Check, ChevronDown, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { useThemesByPlatform, type Theme } from '@/hooks/useThemes';
import type { PlatformId } from '@/utils/constants';

export interface ThemeSelectionStepProps {
  selectedThemes: string[];
  onChange: (themes: string[]) => void;
  platformId: PlatformId;
  errors?: string[];
  className?: string;
}

export function ThemeSelectionStep({
  selectedThemes,
  onChange,
  platformId,
  errors,
  className,
}: ThemeSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: themesData, isLoading } = useThemesByPlatform(platformId);
  const themes = themesData?.data || [];

  // Group themes by parent (root themes as categories)
  const themesByCategory = useMemo(() => {
    const rootThemes = themes.filter((t) => !t.parentId);
    const groups: Record<string, { root: Theme; children: Theme[] }> = {};

    rootThemes.forEach((root) => {
      groups[root.id] = {
        root,
        children: themes.filter((t) => t.parentId === root.id),
      };
    });

    return groups;
  }, [themes]);

  // Filter by search
  const filteredThemes = useMemo(() => {
    if (!searchQuery) return themes;
    const query = searchQuery.toLowerCase();
    return themes.filter((t) =>
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }, [themes, searchQuery]);

  const toggleTheme = (themeId: string) => {
    if (selectedThemes.includes(themeId)) {
      onChange(selectedThemes.filter((t) => t !== themeId));
    } else {
      onChange([...selectedThemes, themeId]);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const group = themesByCategory[categoryId];
    if (!group) return;

    const categoryThemeIds = [group.root.id, ...group.children.map((c) => c.id)];
    const allSelected = categoryThemeIds.every((id) => selectedThemes.includes(id));

    if (allSelected) {
      onChange(selectedThemes.filter((t) => !categoryThemeIds.includes(t)));
    } else {
      const newSelection = new Set([...selectedThemes, ...categoryThemeIds]);
      onChange(Array.from(newSelection));
    }
  };

  const selectAll = () => {
    onChange(themes.map((t) => t.id));
  };

  const selectNone = () => {
    onChange([]);
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Expand all categories with matching themes on search
  useMemo(() => {
    if (searchQuery) {
      const matchingCategoryIds = new Set<string>();
      filteredThemes.forEach((theme) => {
        if (theme.parentId) {
          matchingCategoryIds.add(theme.parentId);
        }
      });
      setExpandedCategories(matchingCategoryIds);
    }
  }, [searchQuery, filteredThemes]);

  const hasError = errors && errors.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Thèmes de contenu
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez les thèmes à couvrir dans la génération
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Tout sélectionner
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Tout désélectionner
          </Button>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.join('. ')}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un thème..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Chargement des thèmes...
        </div>
      )}

      {/* No results */}
      {!isLoading && filteredThemes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun thème trouvé</p>
          {searchQuery && (
            <p className="text-sm mt-1">
              Essayez avec d'autres termes de recherche
            </p>
          )}
        </div>
      )}

      {/* Themes list */}
      {!isLoading && filteredThemes.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {Object.entries(themesByCategory).map(([categoryId, group]) => {
            // Filter children based on search
            const visibleChildren = searchQuery
              ? group.children.filter((c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : group.children;

            // Skip category if no matches
            if (
              searchQuery &&
              !group.root.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
              visibleChildren.length === 0
            ) {
              return null;
            }

            const allThemeIds = [group.root.id, ...group.children.map((c) => c.id)];
            const selectedCount = allThemeIds.filter((id) =>
              selectedThemes.includes(id)
            ).length;
            const allSelected = selectedCount === allThemeIds.length;
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <Collapsible
                key={categoryId}
                open={expandedCategories.has(categoryId) || group.children.length === 0}
                onOpenChange={() => toggleCategoryExpand(categoryId)}
              >
                <div className="border rounded-lg overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allSelected}
                        // @ts-ignore
                        indeterminate={someSelected}
                        onCheckedChange={() => toggleCategory(categoryId)}
                      />
                      <div>
                        <span className="font-medium text-gray-900">
                          {group.root.name}
                        </span>
                        {group.root.description && (
                          <p className="text-xs text-muted-foreground">
                            {group.root.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedCount}/{allThemeIds.length}
                      </Badge>
                      {group.children.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 transition-transform',
                                expandedCategories.has(categoryId) && 'rotate-180'
                              )}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                  </div>

                  {/* Children themes */}
                  {group.children.length > 0 && (
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-white">
                        {(searchQuery ? visibleChildren : group.children).map((theme) => {
                          const isSelected = selectedThemes.includes(theme.id);
                          return (
                            <button
                              key={theme.id}
                              onClick={() => toggleTheme(theme.id)}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-primary/10 border-2 border-primary'
                                  : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                              )}
                            >
                              <span className="flex-1 truncate">{theme.name}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedThemes.length} thème{selectedThemes.length !== 1 ? 's' : ''} sélectionné{selectedThemes.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              sur {themes.length} thèmes disponibles
            </p>
          </div>

          {/* Selected themes preview */}
          {selectedThemes.length > 0 && selectedThemes.length <= 10 && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
              {selectedThemes.slice(0, 10).map((themeId) => {
                const theme = themes.find((t) => t.id === themeId);
                if (!theme) return null;
                return (
                  <Badge
                    key={themeId}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-gray-200"
                    onClick={() => toggleTheme(themeId)}
                  >
                    {theme.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThemeSelectionStep;
