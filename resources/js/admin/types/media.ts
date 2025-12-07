/**
 * Media Types
 * Types TypeScript pour le module Médias
 */

// Media Source
export type MediaSource = 'upload' | 'unsplash' | 'dalle' | 'url' | 'pexels';

// Media Type
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'archive';

// Media Status
export type MediaStatus = 'processing' | 'ready' | 'error' | 'archived';

// Image Dimensions
export interface MediaDimensions {
  width: number;
  height: number;
}

// Image Focal Point
export interface FocalPoint {
  x: number; // 0-1
  y: number; // 0-1
}

// Media Metadata
export interface MediaMetadata {
  title?: string;
  alt?: string;
  caption?: string;
  description?: string;
  copyright?: string;
  attribution?: string;
  tags?: string[];
  focalPoint?: FocalPoint;
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: number;
    dateTaken?: string;
    location?: string;
  };
}

// Media Variant (different sizes)
export interface MediaVariant {
  key: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

// Media Item
export interface MediaItem {
  id: number;
  uuid: string;
  type: MediaType;
  mimeType: string;
  filename: string;
  originalFilename: string;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  size: number;
  dimensions?: MediaDimensions;
  duration?: number; // For video/audio
  source: MediaSource;
  sourceId?: string; // ID from external source (Unsplash, etc.)
  status: MediaStatus;
  metadata: MediaMetadata;
  variants?: MediaVariant[];
  
  // Usage tracking
  usageCount: number;
  usedIn?: MediaUsage[];
  
  // Permissions
  isPublic: boolean;
  
  // Organization
  folderId?: number;
  folder?: MediaFolder;
  
  // User
  uploadedBy?: number;
  uploadedByName?: string;
  
  // Timestamps
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Media Usage Reference
export interface MediaUsage {
  id: number;
  mediaId: number;
  entityType: 'article' | 'landing' | 'press_release' | 'dossier' | 'provider' | 'user';
  entityId: number;
  entityTitle: string;
  field: string;
  usedAt: string;
}

// Media Folder
export interface MediaFolder {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  parent?: MediaFolder;
  children?: MediaFolder[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// Media Filters
export interface MediaFilters {
  search?: string;
  type?: MediaType;
  source?: MediaSource;
  status?: MediaStatus;
  folderId?: number | 'root';
  tags?: string[];
  mimeTypes?: string[];
  minSize?: number;
  maxSize?: number;
  minWidth?: number;
  maxWidth?: number;
  dateFrom?: string;
  dateTo?: string;
  uploadedBy?: number;
  unused?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'filename' | 'size' | 'usage_count';
  sortOrder?: 'asc' | 'desc';
}

// Media Stats
export interface MediaStats {
  total: number;
  totalSize: number;
  byType: {
    type: MediaType;
    count: number;
    size: number;
  }[];
  bySource: {
    source: MediaSource;
    count: number;
  }[];
  unused: number;
  uploadedThisMonth: number;
}

// ============================================================================
// Unsplash Types
// ============================================================================

export interface UnsplashUser {
  id: string;
  username: string;
  name: string;
  profileUrl: string;
  profileImage?: string;
}

export interface UnsplashPhotoUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface UnsplashPhoto {
  id: string;
  slug: string;
  description?: string;
  altDescription?: string;
  urls: UnsplashPhotoUrls;
  width: number;
  height: number;
  color: string;
  blurHash?: string;
  user: UnsplashUser;
  downloadUrl: string;
  likes: number;
  createdAt: string;
  tags?: string[];
}

export interface UnsplashSearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  color?: string;
  orderBy?: 'relevant' | 'latest';
}

export interface UnsplashSearchResult {
  total: number;
  totalPages: number;
  results: UnsplashPhoto[];
}

// ============================================================================
// DALL-E Types
// ============================================================================

export type DalleStyle = 'natural' | 'vivid';
export type DalleQuality = 'standard' | 'hd';
export type DalleSize = '1024x1024' | '1792x1024' | '1024x1792';

export interface DalleGenerationParams {
  prompt: string;
  style?: DalleStyle;
  quality?: DalleQuality;
  size?: DalleSize;
  n?: number; // Number of images (1-4)
}

export interface DalleImage {
  id: string;
  prompt: string;
  revisedPrompt?: string;
  url: string;
  style: DalleStyle;
  quality: DalleQuality;
  size: DalleSize;
  createdAt: string;
}

export interface DalleGenerationResult {
  images: DalleImage[];
  creditsUsed: number;
  creditsRemaining: number;
}

export interface DalleHistory {
  id: number;
  prompt: string;
  style: DalleStyle;
  quality: DalleQuality;
  size: DalleSize;
  imagesCount: number;
  images: DalleImage[];
  creditsUsed: number;
  createdAt: string;
}

// Style Presets for DALL-E
export interface DalleStylePreset {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  thumbnail?: string;
  category: 'photography' | 'illustration' | 'art' | '3d' | 'abstract';
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: MediaItem;
  metadata?: Partial<MediaMetadata>;
}

export interface UploadOptions {
  folderId?: number;
  isPublic?: boolean;
  metadata?: Partial<MediaMetadata>;
  generateVariants?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface UploadProgress {
  fileId: string;
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'pdf' | 'word' | 'html' | 'zip' | 'csv' | 'json' | 'xlsx';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ExportEntityType = 'article' | 'landing' | 'press_release' | 'dossier' | 'media' | 'report';

export interface ExportOptions {
  format: ExportFormat;
  includeMedia?: boolean;
  includeMetadata?: boolean;
  includeTranslations?: boolean;
  language?: string;
  quality?: 'draft' | 'standard' | 'high';
  paperSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  customOptions?: Record<string, unknown>;
}

export interface ExportRequest {
  id: number;
  entityType: ExportEntityType;
  entityId: number;
  entityTitle: string;
  format: ExportFormat;
  options: ExportOptions;
  status: ExportStatus;
  progress: number;
  fileUrl?: string;
  filename?: string;
  fileSize?: number;
  error?: string;
  requestedBy: number;
  requestedByName?: string;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface ExportQueueItem extends ExportRequest {
  position?: number;
  estimatedTime?: number;
}

export interface ExportStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalThisMonth: number;
  avgProcessingTime: number;
}

// ============================================================================
// API Input Types
// ============================================================================

export interface CreateFolderInput {
  name: string;
  parentId?: number;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: number;
}

export interface UpdateMediaInput {
  filename?: string;
  folderId?: number;
  isPublic?: boolean;
  metadata?: Partial<MediaMetadata>;
}

export interface BulkMediaAction {
  action: 'delete' | 'move' | 'archive' | 'update_metadata';
  mediaIds: number[];
  folderId?: number; // For move
  metadata?: Partial<MediaMetadata>; // For update_metadata
}

export interface RequestExportInput {
  entityType: ExportEntityType;
  entityId: number;
  format: ExportFormat;
  options?: Omit<ExportOptions, 'format'>;
}

// ============================================================================
// Validation
// ============================================================================

export interface MediaValidation {
  maxFileSize: number; // bytes
  allowedTypes: string[];
  maxDimensions?: MediaDimensions;
  minDimensions?: MediaDimensions;
}

export const DEFAULT_MEDIA_VALIDATION: MediaValidation = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  maxDimensions: { width: 8000, height: 8000 },
  minDimensions: { width: 100, height: 100 },
};

// ============================================================================
// Helper Types
// ============================================================================

export interface MediaSelectionResult {
  media: MediaItem;
  variant?: string;
}

export interface MediaPickerOptions {
  multiple?: boolean;
  maxSelection?: number;
  allowedTypes?: MediaType[];
  allowedSources?: MediaSource[];
  showUpload?: boolean;
  showUnsplash?: boolean;
  showDalle?: boolean;
}
