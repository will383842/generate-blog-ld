/**
 * Templates Hooks
 * Manage generation templates with variables
 */

import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  Template,
  TemplateFilters,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplatePreviewData,
  TemplatePreviewResult,
} from '@/types/generation';
import type { ContentTypeId } from '@/types/program';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
  listFiltered: (filters: TemplateFilters) => [...templateKeys.list(), filters] as const,
  listByType: (contentType: ContentTypeId) => [...templateKeys.list(), 'type', contentType] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
  preview: (id: string, data: TemplatePreviewData) => [...templateKeys.all, 'preview', id, data] as const,
  defaults: () => [...templateKeys.all, 'defaults'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get list of templates
 */
export function useTemplates(filters: TemplateFilters = {}) {
  return useApiQuery<PaginatedResponse<Template>>(
    templateKeys.listFiltered(filters),
    '/admin/templates',
    { params: filters },
    { staleTime: 60000 }
  );
}

/**
 * Get templates by content type
 */
export function useTemplatesByType(contentType?: ContentTypeId) {
  return useApiQuery<ApiResponse<Template[]>>(
    templateKeys.listByType(contentType!),
    '/admin/templates',
    { params: { contentType } },
    {
      enabled: !!contentType,
      staleTime: 60000,
    }
  );
}

/**
 * Get single template
 */
export function useTemplate(id: string) {
  return useApiQuery<ApiResponse<Template>>(
    templateKeys.detail(id),
    `/admin/templates/${id}`,
    undefined,
    {
      enabled: !!id,
      staleTime: 60000,
    }
  );
}

/**
 * Get default templates by content type
 */
export function useDefaultTemplates() {
  return useApiQuery<ApiResponse<Record<ContentTypeId, Template>>>(
    templateKeys.defaults(),
    '/admin/templates/defaults',
    undefined,
    { staleTime: 60000 }
  );
}

/**
 * Preview template with data
 */
export function usePreviewTemplate(id: string, data: TemplatePreviewData) {
  return useApiQuery<ApiResponse<TemplatePreviewResult>>(
    templateKeys.preview(id, data),
    `/admin/templates/${id}/preview`,
    { params: { data: JSON.stringify(data) } },
    {
      enabled: !!id && Object.keys(data).length > 0,
      staleTime: 0, // Always fresh
    }
  );
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a template
 */
export function useCreateTemplate() {
  const toast = useToast();

  return useApiMutation<ApiResponse<Template>, CreateTemplateInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<Template>>('/admin/templates', input);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template créé');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [templateKeys.all],
    }
  );
}

/**
 * Update a template
 */
export function useUpdateTemplate() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<Template>,
    { id: string; data: UpdateTemplateInput }
  >(
    async ({ id, data: templateData }) => {
      const { data } = await api.put<ApiResponse<Template>>(`/admin/templates/${id}`, templateData);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template mis à jour');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [templateKeys.all],
    }
  );
}

/**
 * Delete a template
 */
export function useDeleteTemplate() {
  const toast = useToast();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/templates/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template supprimé');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [templateKeys.all],
    }
  );
}

/**
 * Set template as default for its content type
 */
export function useSetDefaultTemplate() {
  const toast = useToast();

  return useApiMutation<ApiResponse<Template>, string>(
    async (id) => {
      const { data } = await api.post<ApiResponse<Template>>(`/admin/templates/${id}/set-default`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template défini par défaut');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [templateKeys.all],
    }
  );
}

/**
 * Duplicate a template
 */
export function useDuplicateTemplate() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<Template>,
    { id: string; name: string }
  >(
    async ({ id, name }) => {
      const { data } = await api.post<ApiResponse<Template>>(`/admin/templates/${id}/duplicate`, { name });
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template dupliqué');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [templateKeys.all],
    }
  );
}

/**
 * Import templates from JSON
 */
export function useImportTemplates() {
  const toast = useToast();

  return useApiMutation<ApiResponse<{ count: number }>, File>(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<ApiResponse<{ count: number }>>('/admin/templates/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} templates importés`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [templateKeys.all],
    }
  );
}

/**
 * Export templates to JSON
 */
export function useExportTemplates() {
  const toast = useToast();

  return useApiMutation<Blob, string[] | undefined>(
    async (ids) => {
      const { data } = await api.post<Blob>('/admin/templates/export', { ids }, {
        responseType: 'blob',
      });
      return data;
    },
    {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `templates-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Templates exportés');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get template options for select dropdown
 */
export function useTemplateOptions(contentType?: ContentTypeId) {
  const { data, isLoading } = useTemplates({ contentType, isActive: true });

  const options = (data?.data || []).map((template) => ({
    value: template.id,
    label: template.name,
    isDefault: template.isDefault,
    template,
  }));

  return { options, isLoading };
}

/**
 * Get template by ID from cache
 */
export function useCachedTemplate(id: string) {
  const { data } = useTemplate(id);
  return data?.data;
}

/**
 * Extract variables from template content
 */
export function extractTemplateVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches);
}

/**
 * Render template with data
 */
export function renderTemplate(content: string, data: TemplatePreviewData): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    const value = data[variable];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Available template variables
 */
export const TEMPLATE_VARIABLES = [
  { name: 'platform', label: 'Nom de la plateforme', example: 'SOS-Expat' },
  { name: 'country', label: 'Nom du pays', example: 'France' },
  { name: 'country_code', label: 'Code pays', example: 'FR' },
  { name: 'language', label: 'Langue', example: 'Français' },
  { name: 'language_code', label: 'Code langue', example: 'fr' },
  { name: 'theme', label: 'Thème', example: 'Visa' },
  { name: 'title', label: 'Titre (manuel)', example: 'Comment obtenir un visa' },
  { name: 'date', label: 'Date du jour', example: '2024-01-15' },
  { name: 'year', label: 'Année', example: '2024' },
  { name: 'capital', label: 'Capitale du pays', example: 'Paris' },
];
