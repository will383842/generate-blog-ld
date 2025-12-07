/**
 * SEO Hooks
 * File 312 - TanStack Query hooks for SEO features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  SeoDashboardData,
  SchemaMarkup,
  SchemaTemplate,
  Redirect,
  RedirectStats,
  InternalLink,
  LinkOpportunity,
  MaillageStats,
  TechnicalSeoData,
  CrawlIssue,
  SchemaType,
  RedirectType,
} from '@/types/seo';

const API_BASE = '/admin/seo';

// ============================================
// Query Keys
// ============================================

export const seoKeys = {
  all: ['seo'] as const,
  dashboard: () => [...seoKeys.all, 'dashboard'] as const,
  schema: () => [...seoKeys.all, 'schema'] as const,
  schemaTemplates: () => [...seoKeys.schema(), 'templates'] as const,
  schemaForArticle: (articleId: number) => [...seoKeys.schema(), 'article', articleId] as const,
  redirects: () => [...seoKeys.all, 'redirects'] as const,
  redirectsList: (filters?: Record<string, unknown>) => [...seoKeys.redirects(), 'list', filters] as const,
  redirectStats: () => [...seoKeys.redirects(), 'stats'] as const,
  maillage: () => [...seoKeys.all, 'maillage'] as const,
  maillageLinks: (filters?: Record<string, unknown>) => [...seoKeys.maillage(), 'links', filters] as const,
  maillageStats: () => [...seoKeys.maillage(), 'stats'] as const,
  maillageOpportunities: () => [...seoKeys.maillage(), 'opportunities'] as const,
  technical: () => [...seoKeys.all, 'technical'] as const,
  technicalData: () => [...seoKeys.technical(), 'data'] as const,
  technicalIssues: (filters?: Record<string, unknown>) => [...seoKeys.technical(), 'issues', filters] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchDashboard(): Promise<SeoDashboardData> {
  const { data } = await api.get<SeoDashboardData>(`${API_BASE}/dashboard`);
  return data;
}

async function fetchSchemaTemplates(): Promise<SchemaTemplate[]> {
  const { data } = await api.get<SchemaTemplate[]>(`${API_BASE}/schema/templates`);
  return data;
}

async function fetchSchemaForArticle(articleId: number): Promise<SchemaMarkup | null> {
  const { data } = await api.get<SchemaMarkup | null>(`${API_BASE}/schema/article/${articleId}`);
  return data;
}

async function generateSchema(articleId: number, type: SchemaType): Promise<SchemaMarkup> {
  const { data } = await api.post<SchemaMarkup>(`${API_BASE}/schema/generate`, { article_id: articleId, type });
  return data;
}

async function saveSchema(articleId: number, schemaData: Record<string, unknown>): Promise<SchemaMarkup> {
  const { data } = await api.put<SchemaMarkup>(`${API_BASE}/schema/article/${articleId}`, schemaData);
  return data;
}

async function validateSchema(schemaData: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  const { data } = await api.post<{ isValid: boolean; errors: string[]; warnings: string[] }>(`${API_BASE}/schema/validate`, schemaData);
  return data;
}

async function fetchRedirects(filters?: Record<string, unknown>): Promise<{ data: Redirect[]; total: number }> {
  const { data } = await api.get<{ data: Redirect[]; total: number }>(`${API_BASE}/redirects`, { params: filters });
  return data;
}

async function fetchRedirectStats(): Promise<RedirectStats> {
  const { data } = await api.get<RedirectStats>(`${API_BASE}/redirects/stats`);
  return data;
}

async function createRedirect(redirectData: { from: string; to: string; type: RedirectType }): Promise<Redirect> {
  const { data } = await api.post<Redirect>(`${API_BASE}/redirects`, redirectData);
  return data;
}

async function updateRedirect(id: number, redirectData: Partial<Redirect>): Promise<Redirect> {
  const { data } = await api.put<Redirect>(`${API_BASE}/redirects/${id}`, redirectData);
  return data;
}

async function deleteRedirect(id: number): Promise<void> {
  await api.delete(`${API_BASE}/redirects/${id}`);
}

async function importRedirects(file: File): Promise<{ imported: number; errors: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ imported: number; errors: string[] }>(`${API_BASE}/redirects/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

async function testRedirect(from: string): Promise<{ status: number; destination: string; chain: string[] }> {
  const { data } = await api.post<{ status: number; destination: string; chain: string[] }>(`${API_BASE}/redirects/test`, { from });
  return data;
}

async function fetchMaillageLinks(filters?: Record<string, unknown>): Promise<{ data: InternalLink[]; total: number }> {
  const { data } = await api.get<{ data: InternalLink[]; total: number }>(`${API_BASE}/maillage/links`, { params: filters });
  return data;
}

async function fetchMaillageStats(): Promise<MaillageStats> {
  const { data } = await api.get<MaillageStats>(`${API_BASE}/maillage/stats`);
  return data;
}

async function fetchLinkOpportunities(): Promise<LinkOpportunity[]> {
  const { data } = await api.get<LinkOpportunity[]>(`${API_BASE}/maillage/opportunities`);
  return data;
}

async function addInternalLink(linkData: {
  fromArticleId: number;
  toArticleId: number;
  anchorText: string;
  position?: string;
}): Promise<InternalLink> {
  const { data } = await api.post<InternalLink>(`${API_BASE}/maillage/links`, linkData);
  return data;
}

async function deleteInternalLink(id: number): Promise<void> {
  await api.delete(`${API_BASE}/maillage/links/${id}`);
}

async function fetchTechnicalData(): Promise<TechnicalSeoData> {
  const { data } = await api.get<TechnicalSeoData>(`${API_BASE}/technical`);
  return data;
}

async function fetchTechnicalIssues(filters?: Record<string, unknown>): Promise<{ data: CrawlIssue[]; total: number }> {
  const { data } = await api.get<{ data: CrawlIssue[]; total: number }>(`${API_BASE}/technical/issues`, { params: filters });
  return data;
}

async function markIssueFixed(id: string): Promise<void> {
  await api.post(`${API_BASE}/technical/issues/${id}/fix`);
}

// ============================================
// Query Hooks - Dashboard
// ============================================

export function useSeoDashboard() {
  return useQuery({
    queryKey: seoKeys.dashboard(),
    queryFn: fetchDashboard,
    staleTime: 60000,
  });
}

// ============================================
// Query Hooks - Schema
// ============================================

export function useSchemaTemplates() {
  return useQuery({
    queryKey: seoKeys.schemaTemplates(),
    queryFn: fetchSchemaTemplates,
    staleTime: 300000,
  });
}

export function useSchemaForArticle(articleId: number) {
  return useQuery({
    queryKey: seoKeys.schemaForArticle(articleId),
    queryFn: () => fetchSchemaForArticle(articleId),
    enabled: articleId > 0,
  });
}

export function useGenerateSchema() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ articleId, type }: { articleId: number; type: SchemaType }) =>
      generateSchema(articleId, type),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.schemaForArticle(articleId) });
      toast({ title: 'Schema généré' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de générer le schema', variant: 'destructive' });
    },
  });
}

export function useSaveSchema() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ articleId, data }: { articleId: number; data: Record<string, unknown> }) =>
      saveSchema(articleId, data),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.schemaForArticle(articleId) });
      toast({ title: 'Schema sauvegardé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le schema', variant: 'destructive' });
    },
  });
}

export function useValidateSchema() {
  return useMutation({
    mutationFn: validateSchema,
  });
}

// ============================================
// Query Hooks - Redirects
// ============================================

export function useRedirects(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: seoKeys.redirectsList(filters),
    queryFn: () => fetchRedirects(filters),
  });
}

export function useRedirectStats() {
  return useQuery({
    queryKey: seoKeys.redirectStats(),
    queryFn: fetchRedirectStats,
    staleTime: 60000,
  });
}

export function useCreateRedirect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createRedirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
      toast({ title: 'Redirection créée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer la redirection', variant: 'destructive' });
    },
  });
}

export function useUpdateRedirect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Redirect>) =>
      updateRedirect(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
      toast({ title: 'Redirection mise à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la redirection', variant: 'destructive' });
    },
  });
}

export function useDeleteRedirect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteRedirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
      toast({ title: 'Redirection supprimée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la redirection', variant: 'destructive' });
    },
  });
}

export function useImportRedirects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: importRedirects,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
      toast({
        title: 'Import terminé',
        description: `${result.imported} redirections importées`,
      });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'importer les redirections', variant: 'destructive' });
    },
  });
}

export function useTestRedirect() {
  return useMutation({
    mutationFn: testRedirect,
  });
}

// ============================================
// Query Hooks - Maillage
// ============================================

export function useMaillageLinks(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: seoKeys.maillageLinks(filters),
    queryFn: () => fetchMaillageLinks(filters),
  });
}

export function useMaillageStats() {
  return useQuery({
    queryKey: seoKeys.maillageStats(),
    queryFn: fetchMaillageStats,
    staleTime: 60000,
  });
}

export function useLinkOpportunities() {
  return useQuery({
    queryKey: seoKeys.maillageOpportunities(),
    queryFn: fetchLinkOpportunities,
    staleTime: 300000,
  });
}

export function useAddInternalLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: addInternalLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.maillage() });
      toast({ title: 'Lien interne ajouté' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter le lien', variant: 'destructive' });
    },
  });
}

export function useDeleteInternalLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteInternalLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.maillage() });
      toast({ title: 'Lien supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le lien', variant: 'destructive' });
    },
  });
}

// ============================================
// Query Hooks - Technical
// ============================================

export function useTechnicalSeoData() {
  return useQuery({
    queryKey: seoKeys.technicalData(),
    queryFn: fetchTechnicalData,
    staleTime: 300000,
  });
}

export function useTechnicalIssues(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: seoKeys.technicalIssues(filters),
    queryFn: () => fetchTechnicalIssues(filters),
  });
}

export function useMarkIssueFixed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markIssueFixed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.technical() });
      toast({ title: 'Issue marquée comme résolue' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de marquer l\'issue', variant: 'destructive' });
    },
  });
}
