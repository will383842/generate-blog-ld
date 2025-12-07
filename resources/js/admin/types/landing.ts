/**
 * Landing Pages Types
 * Types TypeScript pour le module Landing Pages
 */

// Section Types
export type LandingSectionType =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'faq'
  | 'custom'
  | 'statistics'
  | 'gallery'
  | 'comparison'
  | 'team'
  | 'partners'
  | 'contact';

// Landing Status
export type LandingStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

// CTA Style
export type CtaStyle = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';

// CTA Configuration
export interface CtaConfig {
  text: string;
  url: string;
  style: CtaStyle;
  tracking?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    custom_params?: Record<string, string>;
  };
  openInNewTab?: boolean;
  icon?: string;
}

// Section Configuration (varies by type)
export interface HeroSectionConfig {
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: boolean;
  overlayColor?: string;
  alignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
  cta?: CtaConfig;
  secondaryCta?: CtaConfig;
}

export interface FeaturesSectionConfig {
  layout?: 'grid' | 'list' | 'alternating';
  columns?: 2 | 3 | 4;
  iconStyle?: 'circle' | 'square' | 'none';
  features: {
    icon?: string;
    title: string;
    description: string;
    link?: string;
  }[];
}

export interface TestimonialsSectionConfig {
  layout?: 'carousel' | 'grid' | 'masonry';
  showRating?: boolean;
  showAvatar?: boolean;
  testimonials: {
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatar?: string;
    rating?: number;
  }[];
}

export interface PricingSectionConfig {
  layout?: 'cards' | 'table';
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly' | 'both';
  highlightedPlan?: string;
  plans: {
    id: string;
    name: string;
    description?: string;
    priceMonthly?: number;
    priceYearly?: number;
    features: string[];
    cta?: CtaConfig;
    highlighted?: boolean;
    badge?: string;
  }[];
}

export interface FaqSectionConfig {
  layout?: 'accordion' | 'grid';
  columns?: 1 | 2;
  items: {
    question: string;
    answer: string;
    category?: string;
  }[];
}

export interface StatisticsSectionConfig {
  layout?: 'row' | 'grid';
  animated?: boolean;
  stats: {
    value: string | number;
    label: string;
    prefix?: string;
    suffix?: string;
    icon?: string;
  }[];
}

export interface GallerySectionConfig {
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: 2 | 3 | 4;
  lightbox?: boolean;
  images: {
    url: string;
    alt?: string;
    caption?: string;
  }[];
}

export interface ComparisonSectionConfig {
  headers: string[];
  rows: {
    feature: string;
    values: (string | boolean)[];
  }[];
  highlightedColumn?: number;
}

export interface TeamSectionConfig {
  layout?: 'grid' | 'carousel';
  columns?: 3 | 4;
  members: {
    name: string;
    role: string;
    avatar?: string;
    bio?: string;
    socialLinks?: {
      platform: string;
      url: string;
    }[];
  }[];
}

export interface PartnersSectionConfig {
  layout?: 'grid' | 'carousel';
  grayscale?: boolean;
  partners: {
    name: string;
    logo: string;
    url?: string;
  }[];
}

export interface ContactSectionConfig {
  layout?: 'form' | 'split';
  fields: {
    name: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    label: string;
    required?: boolean;
    options?: string[];
  }[];
  submitText?: string;
  showInfo?: boolean;
  info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface CustomSectionConfig {
  html?: string;
  css?: string;
  [key: string]: unknown;
}

export type SectionConfig =
  | HeroSectionConfig
  | FeaturesSectionConfig
  | TestimonialsSectionConfig
  | PricingSectionConfig
  | FaqSectionConfig
  | StatisticsSectionConfig
  | GallerySectionConfig
  | ComparisonSectionConfig
  | TeamSectionConfig
  | PartnersSectionConfig
  | ContactSectionConfig
  | CustomSectionConfig;

// Landing Section
export interface LandingSection {
  id: number;
  landingId: number;
  type: LandingSectionType;
  title: string;
  subtitle?: string;
  content?: string;
  config: SectionConfig;
  order: number;
  isVisible: boolean;
  backgroundColor?: string;
  paddingTop?: 'none' | 'small' | 'medium' | 'large';
  paddingBottom?: 'none' | 'small' | 'medium' | 'large';
  createdAt: string;
  updatedAt: string;
}

// Landing Translation
export interface LandingTranslation {
  id: number;
  landingId: number;
  language: string;
  title: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  sections?: Partial<LandingSection>[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  translatedAt?: string;
}

// Landing Page
export interface Landing {
  id: number;
  platform: string;
  country?: string;
  language: string;
  title: string;
  slug: string;
  description?: string;
  status: LandingStatus;
  type: 'service' | 'product' | 'campaign' | 'event' | 'generic';
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  
  // Design
  templateId?: number;
  featuredImage?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  
  // CTAs
  primaryCta?: CtaConfig;
  secondaryCta?: CtaConfig;
  floatingCta?: CtaConfig & { position: 'bottom-left' | 'bottom-right' | 'bottom-center' };
  
  // Sections
  sections: LandingSection[];
  sectionsCount?: number;
  
  // Translations
  translations?: LandingTranslation[];
  
  // Analytics
  viewCount?: number;
  conversionRate?: number;
  bounceRate?: number;
  avgTimeOnPage?: number;
  
  // URLs
  publicUrl?: string;
  previewUrl?: string;
  
  // Timestamps
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Quality
  qualityScore?: number;
  seoScore?: number;
  performanceScore?: number;
}

// Landing Filters
export interface LandingFilters {
  search?: string;
  platform?: string;
  country?: string;
  language?: string;
  status?: LandingStatus;
  type?: Landing['type'];
  dateFrom?: string;
  dateTo?: string;
  hasTranslations?: boolean;
  minSections?: number;
  sortBy?: 'title' | 'created_at' | 'updated_at' | 'published_at' | 'view_count';
  sortOrder?: 'asc' | 'desc';
}

// Landing Stats
export interface LandingStats {
  total: number;
  published: number;
  drafts: number;
  publishedThisMonth: number;
  avgSections: number;
  avgConversionRate: number;
  totalViews: number;
  byPlatform: {
    platform: string;
    count: number;
  }[];
  byType: {
    type: string;
    count: number;
  }[];
}

// Section Template
export interface SectionTemplate {
  id: number;
  type: LandingSectionType;
  name: string;
  description?: string;
  thumbnail?: string;
  defaultConfig: SectionConfig;
  category?: string;
  isPremium?: boolean;
}

// Landing Template
export interface LandingTemplate {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  sections: Partial<LandingSection>[];
  defaultCta?: CtaConfig;
  colors?: {
    primary: string;
    secondary: string;
  };
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

// API Inputs
export interface CreateLandingInput {
  title: string;
  platform: string;
  country?: string;
  language?: string;
  type?: Landing['type'];
  templateId?: number;
  description?: string;
}

export interface UpdateLandingInput {
  title?: string;
  slug?: string;
  description?: string;
  status?: LandingStatus;
  type?: Landing['type'];
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  featuredImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  primaryCta?: CtaConfig;
  secondaryCta?: CtaConfig;
  floatingCta?: Landing['floatingCta'];
}

export interface CreateSectionInput {
  type: LandingSectionType;
  title: string;
  subtitle?: string;
  content?: string;
  config?: SectionConfig;
  order?: number;
  backgroundColor?: string;
}

export interface UpdateSectionInput {
  title?: string;
  subtitle?: string;
  content?: string;
  config?: SectionConfig;
  isVisible?: boolean;
  backgroundColor?: string;
  paddingTop?: LandingSection['paddingTop'];
  paddingBottom?: LandingSection['paddingBottom'];
}

// Performance Data
export interface LandingPerformance {
  landingId: number;
  period: string;
  views: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgTimeOnPage: number;
  conversions: number;
  conversionRate: number;
  clickThroughRate: number;
  topReferrers: {
    source: string;
    visits: number;
  }[];
  deviceBreakdown: {
    device: string;
    percentage: number;
  }[];
}

// Export Result
export interface LandingExportResult {
  url: string;
  filename: string;
  size: number;
  format: 'html' | 'pdf';
  expiresAt?: string;
}
