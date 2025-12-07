import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Star,
  Download,
  Upload,
  RefreshCw,
  Globe,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useContentTemplates } from '@/hooks/useContentTemplates';
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  LANGUAGES,
  LANGUAGE_FLAGS,
  type ContentTemplate,
  type TemplateFilters,
  type TemplateCategory,
  type TemplateType,
  type LanguageCode,
} from '@/types/template';

const TemplatesIndex: React.FC = () => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  
  const {
    templates,
    loading,
    pagination,
    fetchTemplates,
    deleteTemplate,
    duplicateTemplate,
    setAsDefault,
    exportTemplate,
    clearCache,
  } = useContentTemplates();

  // Filters state
  const [filters, setFilters] = useState<TemplateFilters>({
    category: undefined,
    type: undefined,
    language_code: undefined,
    is_active: undefined,
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    per_page: 20,
    page: 1,
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ContentTemplate | null>(null);

  // Load templates on mount and filter change
  useEffect(() => {
    fetchTemplates(filters);
  }, [fetchTemplates, filters]);

  // Available types based on selected category
  const availableTypes = useMemo(() => {
    if (!filters.category) {
      return { ...TEMPLATE_TYPES.content, ...TEMPLATE_TYPES.press };
    }
    return TEMPLATE_TYPES[filters.category];
  }, [filters.category]);

  // Handlers
  const handleFilterChange = (key: keyof TemplateFilters, value: TemplateFilters[keyof TemplateFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 on filter change
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTemplates(filters);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteTemplate(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchTemplates(filters);
    }
  };

  const handleDuplicate = async (template: ContentTemplate) => {
    const result = await duplicateTemplate(template.id);
    if (result) {
      navigate(`/settings/templates/${result.id}`);
    }
  };

  const handleExport = async (template: ContentTemplate) => {
    const data = await exportTemplate(template.id);
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${template.slug}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSetDefault = async (template: ContentTemplate) => {
    await setAsDefault(template.id);
    fetchTemplates(filters);
  };

  const handleClearCache = async () => {
    await clearCache();
  };

  // Columns for DataTable
  const columns: Column<ContentTemplate>[] = [
    {
      key: 'name',
      header: 'Template',
      cell: (template) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {template.name}
              {template.is_default && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {template.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (template) => (
        <div>
          <Badge variant={template.category === 'content' ? 'default' : 'secondary'}>
            {TEMPLATE_CATEGORIES[template.category]}
          </Badge>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {TEMPLATE_TYPES[template.category]?.[template.type] || template.type}
          </div>
        </div>
      ),
    },
    {
      key: 'language',
      header: 'Langue',
      cell: (template) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{LANGUAGE_FLAGS[template.language_code]}</span>
          <span>{LANGUAGES[template.language_code]}</span>
        </div>
      ),
    },
    {
      key: 'config',
      header: 'Configuration',
      cell: (template) => (
        <div className="text-sm space-y-1">
          <div className="text-gray-600 dark:text-gray-300">
            {template.word_count_target ? `${template.word_count_target} mots` : '-'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {template.faq_count > 0 ? `${template.faq_count} FAQ` : 'Sans FAQ'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {template.model}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (template) => (
        <div className="flex items-center gap-2">
          {template.is_active ? (
            <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3" />
              Actif
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Inactif
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Utilisation',
      cell: (template) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {template.usage_count.toLocaleString()}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            v{template.version}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (template) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/settings/templates/${template.id}`)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(template)}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </DropdownMenuItem>
            {!template.is_default && (
              <DropdownMenuItem onClick={() => handleSetDefault(template)}>
                <Star className="w-4 h-4 mr-2" />
                Définir par défaut
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setDeleteConfirm(template)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Templates de Contenu"
        description="Gérez les templates de génération pour tous les types de contenu"
      />
      
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleClearCache}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Vider le cache
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/settings/templates/import')}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Importer
        </Button>
        <Button
          onClick={() => navigate('/settings/templates/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par nom, slug..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              >
                <option value="">Toutes catégories</option>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>

              <Select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              >
                <option value="">Tous types</option>
                {Object.entries(availableTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>

              <Select
                value={filters.language_code || ''}
                onChange={(e) => handleFilterChange('language_code', e.target.value || undefined)}
              >
                <option value="">Toutes langues</option>
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {LANGUAGE_FLAGS[code as LanguageCode]} {name}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.is_active === undefined ? '' : String(filters.is_active)}
                onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">Tous statuts</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </Select>

              <Select
                value={`${filters.sort_by}-${filters.sort_order}`}
                onChange={(e) => {
                  const [sort_by, sort_order] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sort_by: sort_by as 'name' | 'usage_count' | 'updated_at', sort_order: sort_order as 'asc' | 'desc' }));
                }}
              >
                <option value="name-asc">Nom A-Z</option>
                <option value="name-desc">Nom Z-A</option>
                <option value="usage_count-desc">Plus utilisés</option>
                <option value="updated_at-desc">Récemment modifiés</option>
              </Select>
            </div>
          )}
        </form>
      </Card>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {pagination.total}
          </div>
          <div className="text-sm text-gray-500">Total templates</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {templates.filter(t => t.category === 'content').length}
          </div>
          <div className="text-sm text-gray-500">Contenu en ligne</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {templates.filter(t => t.category === 'press').length}
          </div>
          <div className="text-sm text-gray-500">Presse (PDF)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {templates.filter(t => t.is_default).length}
          </div>
          <div className="text-sm text-gray-500">Par défaut</div>
        </Card>
      </div>

      {/* Templates table */}
      <Card>
        {templates.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={templates}
              keyExtractor={(t) => t.id}
              loading={loading}
              onRowClick={(template) => navigate(`/settings/templates/${template.id}`)}
            />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.lastPage}
                onPageChange={(page) => handleFilterChange('page', page)}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="Aucun template"
            description="Créez votre premier template de contenu"
            action={
              <Button onClick={() => navigate('/settings/templates/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un template
              </Button>
            }
          />
        )}
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer le template"
        description={`Êtes-vous sûr de vouloir supprimer le template "${deleteConfirm?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="destructive"
      />
    </div>
  );
};

export default TemplatesIndex;
