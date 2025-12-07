import { useState, useCallback, useEffect } from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/useToast';
import type {
  ContentTemplate,
  ContentTemplateVersion,
  TemplateFilters,
  TemplateFormData,
  TemplateUpdateData,
  TemplateDuplicateData,
  TemplateListResponse,
  TemplateDetailResponse,
  TemplateGroupedResponse,
  TemplateStatsResponse,
  TemplateCoverageResponse,
  TemplatePreviewResponse,
  TemplateConstantsResponse,
  TemplateType,
} from '@/types/template';

interface UseContentTemplatesReturn {
  // State
  templates: ContentTemplate[];
  template: ContentTemplate | null;
  versions: ContentTemplateVersion[];
  stats: TemplateStatsResponse['data'] | null;
  constants: TemplateConstantsResponse['data'] | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  
  // Actions
  fetchTemplates: (filters?: TemplateFilters) => Promise<void>;
  fetchTemplate: (id: number) => Promise<ContentTemplate | null>;
  fetchTemplateBySlug: (slug: string) => Promise<ContentTemplate | null>;
  fetchGrouped: () => Promise<TemplateGroupedResponse['data'] | null>;
  fetchStats: () => Promise<void>;
  fetchCoverage: (type: TemplateType) => Promise<TemplateCoverageResponse['data'] | null>;
  fetchConstants: () => Promise<void>;
  fetchVersions: (id: number) => Promise<void>;
  
  createTemplate: (data: TemplateFormData) => Promise<ContentTemplate | null>;
  updateTemplate: (id: number, data: TemplateUpdateData) => Promise<ContentTemplate | null>;
  deleteTemplate: (id: number) => Promise<boolean>;
  duplicateTemplate: (id: number, data?: TemplateDuplicateData) => Promise<ContentTemplate | null>;
  setAsDefault: (id: number) => Promise<boolean>;
  restoreVersion: (id: number, version: number) => Promise<ContentTemplate | null>;
  
  previewPrompt: (id: number, testData?: Record<string, string>) => Promise<TemplatePreviewResponse['data'] | null>;
  exportTemplate: (id: number) => Promise<unknown>;
  importTemplate: (templateData: Record<string, unknown>) => Promise<ContentTemplate | null>;
  clearCache: () => Promise<boolean>;
  
  // Helpers
  resetTemplate: () => void;
  resetError: () => void;
}

export function useContentTemplates(): UseContentTemplatesReturn {
  const { success: showSuccess, error: showError } = useToast();
  
  // State
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [template, setTemplate] = useState<ContentTemplate | null>(null);
  const [versions, setVersions] = useState<ContentTemplateVersion[]>([]);
  const [stats, setStats] = useState<TemplateStatsResponse['data'] | null>(null);
  const [constants, setConstants] = useState<TemplateConstantsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchTemplates = useCallback(async (filters?: TemplateFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await api.get<TemplateListResponse>(
        `/admin/content-templates?${params.toString()}`
      );
      
      if (response.data.success) {
        setTemplates(response.data.data);
        setPagination({
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          perPage: response.data.meta.per_page,
          total: response.data.meta.total,
        });
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors du chargement des templates';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchTemplate = useCallback(async (id: number): Promise<ContentTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<TemplateDetailResponse>(`/admin/content-templates/${id}`);
      
      if (response.data.success) {
        setTemplate(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors du chargement du template';
      setError(message);
      showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchTemplateBySlug = useCallback(async (slug: string): Promise<ContentTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<TemplateDetailResponse>(`/admin/content-templates/slug/${slug}`);
      
      if (response.data.success) {
        setTemplate(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Template non trouvé';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGrouped = useCallback(async (): Promise<TemplateGroupedResponse['data'] | null> => {
    setLoading(true);
    
    try {
      const response = await api.get<TemplateGroupedResponse>('/admin/content-templates/grouped');
      return response.data.success ? response.data.data : null;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<TemplateStatsResponse>('/admin/content-templates/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur stats templates:', err);
    }
  }, []);

  const fetchCoverage = useCallback(async (type: TemplateType): Promise<TemplateCoverageResponse['data'] | null> => {
    try {
      const response = await api.get<TemplateCoverageResponse>(`/admin/content-templates/coverage/${type}`);
      return response.data.success ? response.data.data : null;
    } catch (err) {
      return null;
    }
  }, []);

  const fetchConstants = useCallback(async () => {
    try {
      const response = await api.get<TemplateConstantsResponse>('/admin/content-templates/constants');
      if (response.data.success) {
        setConstants(response.data.data);
      }
    } catch (err) {
      console.error('Erreur constants:', err);
    }
  }, []);

  const fetchVersions = useCallback(async (id: number) => {
    try {
      const response = await api.get<{ success: boolean; data: ContentTemplateVersion[] }>(
        `/admin/content-templates/${id}/versions`
      );
      if (response.data.success) {
        setVersions(response.data.data);
      }
    } catch (err) {
      console.error('Erreur versions:', err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const createTemplate = useCallback(async (data: TemplateFormData): Promise<ContentTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post<{ success: boolean; data: ContentTemplate; message: string }>(
        '/admin/content-templates',
        data
      );
      
      if (response.data.success) {
        showSuccess(response.data.message || 'Template créé avec succès');
        return response.data.data;
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la création';
      setError(message);
      showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateTemplate = useCallback(async (id: number, data: TemplateUpdateData): Promise<ContentTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put<{ success: boolean; data: ContentTemplate; message: string }>(
        `/admin/content-templates/${id}`,
        data
      );
      
      if (response.data.success) {
        setTemplate(response.data.data);
        showSuccess(response.data.message || 'Template mis à jour');
        return response.data.data;
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(message);
      showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const deleteTemplate = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/admin/content-templates/${id}`
      );
      
      if (response.data.success) {
        showSuccess(response.data.message || 'Template supprimé');
        setTemplates(prev => prev.filter(t => t.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la suppression';
      showError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const duplicateTemplate = useCallback(async (id: number, data?: TemplateDuplicateData): Promise<ContentTemplate | null> => {
    setLoading(true);
    
    try {
      const response = await api.post<{ success: boolean; data: ContentTemplate; message: string }>(
        `/admin/content-templates/${id}/duplicate`,
        data || {}
      );
      
      if (response.data.success) {
        showSuccess(response.data.message || 'Template dupliqué');
        return response.data.data;
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la duplication';
      showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const setAsDefault = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/admin/content-templates/${id}/set-default`
      );
      
      if (response.data.success) {
        showSuccess('Template défini par défaut');
        return true;
      }
      return false;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      showError(message);
      return false;
    }
  }, [showSuccess, showError]);

  const restoreVersion = useCallback(async (id: number, version: number): Promise<ContentTemplate | null> => {
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: ContentTemplate; message: string }>(
        `/admin/content-templates/${id}/restore/${version}`
      );

      if (response.data.success) {
        setTemplate(response.data.data);
        showSuccess(response.data.message || `Version ${version} restaurée`);
        return response.data.data;
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la restauration';
      showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // ═══════════════════════════════════════════════════════════════════════════
  // OTHER OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const previewPrompt = useCallback(async (
    id: number,
    testData?: Record<string, string>
  ): Promise<TemplatePreviewResponse['data'] | null> => {
    try {
      const response = await api.post<TemplatePreviewResponse>(
        `/admin/content-templates/${id}/preview`,
        { test_data: testData || {} }
      );
      return response.data.success ? response.data.data : null;
    } catch (err) {
      return null;
    }
  }, []);

  const exportTemplate = useCallback(async (id: number): Promise<unknown> => {
    try {
      const response = await api.get<{ success: boolean; data: unknown }>(
        `/admin/content-templates/${id}/export`
      );
      return response.data.success ? response.data.data : null;
    } catch (err) {
      showError('Erreur lors de l\'export');
      return null;
    }
  }, [showError]);

  const importTemplate = useCallback(async (templateData: Record<string, unknown>): Promise<ContentTemplate | null> => {
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: ContentTemplate; message: string }>(
        '/admin/content-templates/import',
        { template: templateData }
      );

      if (response.data.success) {
        showSuccess(response.data.message || 'Template importé');
        return response.data.data;
      }
      return null;
    } catch (err) {
      showError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de l\'import');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        '/admin/content-templates/clear-cache'
      );
      
      if (response.data.success) {
        showSuccess('Cache vidé');
        return true;
      }
      return false;
    } catch (err) {
      showError('Erreur lors du vidage du cache');
      return false;
    }
  }, [showSuccess, showError]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const resetTemplate = useCallback(() => {
    setTemplate(null);
    setVersions([]);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Load constants on mount
  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

  return {
    // State
    templates,
    template,
    versions,
    stats,
    constants,
    loading,
    error,
    pagination,
    
    // Actions
    fetchTemplates,
    fetchTemplate,
    fetchTemplateBySlug,
    fetchGrouped,
    fetchStats,
    fetchCoverage,
    fetchConstants,
    fetchVersions,
    
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setAsDefault,
    restoreVersion,
    
    previewPrompt,
    exportTemplate,
    importTemplate,
    clearCache,
    
    // Helpers
    resetTemplate,
    resetError,
  };
}

export default useContentTemplates;
