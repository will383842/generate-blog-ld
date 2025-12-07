import { 
  FileText, 
  Landmark, 
  GitCompare, 
  Plane, 
  Newspaper, 
  BookOpen,
  FileQuestion
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// PLATFORMS
// ═══════════════════════════════════════════════════════════════

export const PLATFORMS = [
  {
    id: 'sos-expat',
    name: 'SOS-Expat',
    slug: 'sos-expat',
    domain: 'sos-expat.com',
    url: 'https://sos-expat.com',
    logo: '/logos/sos-expat.svg',
    color: '#3B82F6',
    description: 'Assistance juridique urgente pour expatriés'
  },
  {
    id: 'ulixai',
    name: 'Ulixai',
    slug: 'ulixai',
    domain: 'ulixai.com',
    url: 'https://ulixai.com',
    logo: '/logos/ulixai.svg',
    color: '#8B5CF6',
    description: 'Marketplace de services pour expatriés'
  },
  {
    id: 'ulysse',
    name: 'Ulysse.AI',
    slug: 'ulysse',
    domain: 'ulysse.ai',
    url: 'https://ulysse.ai',
    logo: '/logos/ulysse.svg',
    color: '#10B981',
    description: 'Assistant IA pour expatriés'
  }
] as const;

export type PlatformId = typeof PLATFORMS[number]['id'];

// ═══════════════════════════════════════════════════════════════
// LANGUAGES (9 langues)
// ═══════════════════════════════════════════════════════════════

export const LANGUAGES = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', isDefault: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', isDefault: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr', isDefault: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', isDefault: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr', isDefault: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr', isDefault: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr', isDefault: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', isDefault: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr', isDefault: false }
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

export const DEFAULT_LANGUAGE = LANGUAGES.find(l => l.isDefault)?.code || 'fr';

export const RTL_LANGUAGES: LanguageCode[] = LANGUAGES.filter(l => l.dir === 'rtl').map(l => l.code);

// ═══════════════════════════════════════════════════════════════
// CONTENT TYPES
// ═══════════════════════════════════════════════════════════════

export const CONTENT_TYPES = [
  {
    id: 'article',
    name: 'Article',
    labelKey: 'generation.types.article.name',
    descriptionKey: 'generation.types.article.description',
    icon: FileText,
    wordCountMin: 800,
    wordCountMax: 1500,
    costMultiplier: 1.0,
    color: '#3B82F6'
  },
  {
    id: 'pillar',
    name: 'Article Pilier',
    labelKey: 'generation.types.pillar.name',
    descriptionKey: 'generation.types.pillar.description',
    icon: Landmark,
    wordCountMin: 2500,
    wordCountMax: 5000,
    costMultiplier: 2.5,
    color: '#8B5CF6'
  },
  {
    id: 'comparative',
    name: 'Comparatif',
    labelKey: 'generation.types.comparative.name',
    descriptionKey: 'generation.types.comparative.description',
    icon: GitCompare,
    wordCountMin: 1200,
    wordCountMax: 2500,
    costMultiplier: 1.8,
    color: '#F59E0B'
  },
  {
    id: 'landing',
    name: 'Landing Page',
    labelKey: 'generation.types.landing.name',
    descriptionKey: 'generation.types.landing.description',
    icon: Plane,
    wordCountMin: 500,
    wordCountMax: 1000,
    costMultiplier: 1.2,
    color: '#10B981'
  },
  {
    id: 'press_release',
    name: 'Communiqué de Presse',
    labelKey: 'generation.types.pressRelease.name',
    descriptionKey: 'generation.types.pressRelease.description',
    icon: Newspaper,
    wordCountMin: 400,
    wordCountMax: 800,
    costMultiplier: 1.0,
    color: '#EF4444'
  },
  {
    id: 'press_dossier',
    name: 'Dossier de Presse',
    labelKey: 'generation.types.pressDossier.name',
    descriptionKey: 'generation.types.pressDossier.description',
    icon: BookOpen,
    wordCountMin: 3000,
    wordCountMax: 6000,
    costMultiplier: 3.0,
    color: '#EC4899'
  },
  {
    id: 'faq',
    name: 'FAQ',
    labelKey: 'generation.types.faq.name',
    descriptionKey: 'generation.types.faq.description',
    icon: FileQuestion,
    wordCountMin: 1000,
    wordCountMax: 2000,
    costMultiplier: 1.3,
    color: '#06B6D4'
  },
  {
    id: 'guide',
    name: 'Guide',
    labelKey: 'generation.types.guide.name',
    descriptionKey: 'generation.types.guide.description',
    icon: BookOpen,
    wordCountMin: 1500,
    wordCountMax: 3000,
    costMultiplier: 1.5,
    color: '#6366F1'
  },
  {
    id: 'glossary',
    name: 'Glossaire',
    labelKey: 'generation.types.glossary.name',
    descriptionKey: 'generation.types.glossary.description',
    icon: FileText,
    wordCountMin: 500,
    wordCountMax: 1500,
    costMultiplier: 0.8,
    color: '#84CC16'
  },
  {
    id: 'news',
    name: 'Actualité',
    labelKey: 'generation.types.news.name',
    descriptionKey: 'generation.types.news.description',
    icon: Newspaper,
    wordCountMin: 400,
    wordCountMax: 1000,
    costMultiplier: 0.9,
    color: '#F97316'
  },
  {
    id: 'review',
    name: 'Avis / Test',
    labelKey: 'generation.types.review.name',
    descriptionKey: 'generation.types.review.description',
    icon: FileText,
    wordCountMin: 1000,
    wordCountMax: 2000,
    costMultiplier: 1.4,
    color: '#14B8A6'
  },
  {
    id: 'comparison',
    name: 'Comparaison',
    labelKey: 'generation.types.comparison.name',
    descriptionKey: 'generation.types.comparison.description',
    icon: GitCompare,
    wordCountMin: 1500,
    wordCountMax: 2500,
    costMultiplier: 1.6,
    color: '#A855F7'
  }
] as const;

export type ContentTypeId = typeof CONTENT_TYPES[number]['id'];

// ═══════════════════════════════════════════════════════════════
// STATUSES
// ═══════════════════════════════════════════════════════════════

export const STATUSES = {
  draft: {
    id: 'draft',
    labelKey: 'common.states.draft',
    color: '#94A3B8',
    bgColor: '#F1F5F9'
  },
  pending: {
    id: 'pending',
    labelKey: 'common.states.pending',
    color: '#F59E0B',
    bgColor: '#FEF3C7'
  },
  processing: {
    id: 'processing',
    labelKey: 'common.states.running',
    color: '#3B82F6',
    bgColor: '#DBEAFE'
  },
  published: {
    id: 'published',
    labelKey: 'common.states.published',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
  scheduled: {
    id: 'scheduled',
    labelKey: 'common.states.scheduled',
    color: '#8B5CF6',
    bgColor: '#EDE9FE'
  },
  failed: {
    id: 'failed',
    labelKey: 'common.states.failed',
    color: '#EF4444',
    bgColor: '#FEE2E2'
  },
  paused: {
    id: 'paused',
    labelKey: 'common.states.paused',
    color: '#6B7280',
    bgColor: '#F3F4F6'
  }
} as const;

export type StatusId = keyof typeof STATUSES;

// ═══════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export const API_ENDPOINTS = {
  auth: {
    login: '/admin/login',
    logout: '/admin/logout',
    refresh: '/admin/refresh',
    me: '/admin/me',
    forgotPassword: '/admin/forgot-password',
    resetPassword: '/admin/reset-password'
  },
  programs: {
    list: '/programs',
    create: '/programs',
    get: (id: string) => `/programs/${id}`,
    update: (id: string) => `/programs/${id}`,
    delete: (id: string) => `/programs/${id}`,
    duplicate: (id: string) => `/programs/${id}/duplicate`,
    execute: (id: string) => `/programs/${id}/execute`,
    pause: (id: string) => `/programs/${id}/pause`,
    resume: (id: string) => `/programs/${id}/resume`
  },
  generation: {
    start: '/generation/start',
    bulk: '/generation/bulk',
    queue: '/generation/queue',
    history: '/generation/history',
    cancel: (id: string) => `/generation/${id}/cancel`,
    retry: (id: string) => `/generation/${id}/retry`,
    status: (id: string) => `/generation/${id}/status`
  },
  content: {
    articles: {
      list: '/content/articles',
      create: '/content/articles',
      get: (id: string) => `/content/articles/${id}`,
      update: (id: string) => `/content/articles/${id}`,
      delete: (id: string) => `/content/articles/${id}`,
      publish: (id: string) => `/content/articles/${id}/publish`,
      unpublish: (id: string) => `/content/articles/${id}/unpublish`
    },
    pillars: {
      list: '/content/pillars',
      create: '/content/pillars',
      get: (id: string) => `/content/pillars/${id}`,
      update: (id: string) => `/content/pillars/${id}`,
      delete: (id: string) => `/content/pillars/${id}`
    },
    comparatives: {
      list: '/content/comparatives',
      create: '/content/comparatives',
      get: (id: string) => `/content/comparatives/${id}`,
      update: (id: string) => `/content/comparatives/${id}`,
      delete: (id: string) => `/content/comparatives/${id}`
    },
    landings: {
      list: '/content/landings',
      create: '/content/landings',
      get: (id: string) => `/content/landings/${id}`,
      update: (id: string) => `/content/landings/${id}`,
      delete: (id: string) => `/content/landings/${id}`
    }
  },
  press: {
    releases: {
      list: '/press/releases',
      create: '/press/releases',
      get: (id: string) => `/press/releases/${id}`,
      update: (id: string) => `/press/releases/${id}`,
      delete: (id: string) => `/press/releases/${id}`
    },
    dossiers: {
      list: '/press/dossiers',
      create: '/press/dossiers',
      get: (id: string) => `/press/dossiers/${id}`,
      update: (id: string) => `/press/dossiers/${id}`,
      delete: (id: string) => `/press/dossiers/${id}`
    }
  },
  coverage: {
    global: '/coverage',
    byCountry: '/coverage/countries',
    byLanguage: '/coverage/languages',
    gaps: '/coverage/gaps',
    objectives: '/coverage/objectives'
  },
  quality: {
    scores: '/quality/scores',
    golden: '/quality/golden',
    feedback: '/quality/feedback',
    validate: (id: string) => `/quality/validate/${id}`
  },
  research: {
    search: '/research/search',
    factcheck: '/research/factcheck',
    mining: '/research/mining',
    sources: '/research/sources'
  },
  ai: {
    models: '/ai/models',
    costs: '/ai/costs',
    performance: '/ai/performance',
    prompts: '/ai/prompts'
  },
  seo: {
    schema: '/seo/schema',
    technical: '/seo/technical',
    links: '/seo/links',
    redirects: '/seo/redirects',
    indexing: '/seo/indexing'
  },
  analytics: {
    traffic: '/analytics/traffic',
    conversions: '/analytics/conversions',
    top: '/analytics/top-performers',
    reports: '/analytics/reports'
  },
  media: {
    list: '/media',
    upload: '/media/upload',
    delete: (id: string) => `/media/${id}`,
    unsplash: '/media/unsplash/search',
    dalle: '/media/dalle/generate'
  },
  publishing: {
    platforms: '/publishing/platforms',
    endpoints: '/publishing/endpoints',
    queue: '/publishing/queue',
    webhooks: '/publishing/webhooks',
    logs: '/publishing/logs'
  },
  settings: {
    general: '/settings/general',
    publication: '/settings/publication',
    images: '/settings/images',
    apiKeys: '/settings/api-keys',
    knowledge: '/settings/knowledge',
    brand: '/settings/brand'
  },
  admin: {
    users: '/admin/users',
    roles: '/admin/roles',
    system: '/admin/system',
    errors: '/admin/errors',
    backups: '/admin/backups',
    search: '/admin/search'
  },
  countries: '/countries',
  themes: '/themes',
  notifications: '/notifications'
} as const;

// ═══════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════

export const COLORS = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A'
  },
  success: { light: '#D1FAE5', main: '#10B981', dark: '#059669' },
  warning: { light: '#FEF3C7', main: '#F59E0B', dark: '#D97706' },
  error: { light: '#FEE2E2', main: '#EF4444', dark: '#DC2626' },
  info: { light: '#DBEAFE', main: '#3B82F6', dark: '#2563EB' },
  chart: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1']
} as const;

// ═══════════════════════════════════════════════════════════════
// LIMITS
// ═══════════════════════════════════════════════════════════════

export const LIMITS = {
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    maxPageSize: 100
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 20,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  content: {
    titleMaxLength: 200,
    slugMaxLength: 250,
    excerptMaxLength: 500,
    metaTitleMaxLength: 60,
    metaDescriptionMaxLength: 160
  },
  generation: {
    maxBatchSize: 100,
    maxQueueSize: 500,
    maxConcurrent: 10
  },
  search: {
    minQueryLength: 2,
    maxQueryLength: 200,
    maxResults: 50
  },
  rateLimit: {
    requestsPerMinute: 60,
    generationsPerHour: 100
  }
} as const;

// ═══════════════════════════════════════════════════════════════
// CONTINENTS
// ═══════════════════════════════════════════════════════════════

export const CONTINENTS = [
  { id: 'europe', name: 'Europe', code: 'EU' },
  { id: 'asia', name: 'Asie', code: 'AS' },
  { id: 'north_america', name: 'Amérique du Nord', code: 'NA' },
  { id: 'south_america', name: 'Amérique du Sud', code: 'SA' },
  { id: 'africa', name: 'Afrique', code: 'AF' },
  { id: 'oceania', name: 'Océanie', code: 'OC' },
  { id: 'middle_east', name: 'Moyen-Orient', code: 'ME' }
] as const;

export type ContinentId = typeof CONTINENTS[number]['id'];

// ═══════════════════════════════════════════════════════════════
// AI MODELS
// ═══════════════════════════════════════════════════════════════

export const AI_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', costPer1kTokens: 0.03 },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', costPer1kTokens: 0.01 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', costPer1kTokens: 0.0015 },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', costPer1kTokens: 0.015 },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', costPer1kTokens: 0.003 },
  { id: 'perplexity', name: 'Perplexity', provider: 'perplexity', costPer1kTokens: 0.002 }
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];