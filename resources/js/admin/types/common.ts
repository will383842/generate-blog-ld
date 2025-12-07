export interface Platform {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo?: string;
  color: string;
  description?: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
  region: string;
  continent: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface ApiErrorResponse {
  response?: {
    data?: ApiError;
    status?: number;
  };
  message?: string;
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number | string }>;
  disabled?: boolean;
  description?: string;
}

export type Status = 'draft' | 'pending' | 'processing' | 'published' | 'scheduled' | 'failed' | 'paused';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  articlesCount: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface FilterParams {
  search?: string;
  status?: Status;
  platform?: string;
  country?: string;
  language?: string;
  theme?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}