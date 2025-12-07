/**
 * Validators
 * File 401 - Zod validation schemas and helpers
 */

import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

/**
 * Email validator
 */
export const emailSchema = z
  .string()
  .min(1, 'Email requis')
  .email('Email invalide');

/**
 * URL validator
 */
export const urlSchema = z
  .string()
  .url('URL invalide')
  .or(z.literal(''));

/**
 * Required URL validator
 */
export const requiredUrlSchema = z
  .string()
  .min(1, 'URL requise')
  .url('URL invalide');

/**
 * Slug validator
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug requis')
  .max(100, 'Slug trop long (max 100)')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug invalide (lettres minuscules, chiffres et tirets uniquement)'
  );

/**
 * Password validator
 * - Minimum 8 characters
 * - At least one uppercase
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule requise')
  .regex(/[0-9]/, 'Au moins un chiffre requis');

/**
 * Confirm password schema
 */
export const confirmPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

/**
 * International phone validator
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Numéro de téléphone invalide (format international: +33612345678)'
  )
  .or(z.literal(''));

/**
 * JSON string validator
 */
export const jsonValidSchema = z.string().refine(
  (value) => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'JSON invalide' }
);

/**
 * HTML safe validator (no script tags)
 */
export const htmlSafeSchema = z.string().refine(
  (value) => {
    if (!value) return true;
    return !/<script\b[^>]*>([\s\S]*?)<\/script>/gi.test(value);
  },
  { message: 'Contenu HTML non sécurisé (balises script interdites)' }
);

/**
 * Cron expression validator
 */
export const cronExpressionSchema = z.string().refine(
  (value) => {
    if (!value) return true;
    // Basic cron validation (5 parts)
    const parts = value.split(' ');
    if (parts.length !== 5) return false;
    
    const patterns = [
      /^(\*|([0-5]?\d)([-,]([0-5]?\d))*|(\*\/\d+))$/, // minute
      /^(\*|([01]?\d|2[0-3])([-,]([01]?\d|2[0-3]))*|(\*\/\d+))$/, // hour
      /^(\*|([1-9]|[12]\d|3[01])([-,]([1-9]|[12]\d|3[01]))*|(\*\/\d+))$/, // day
      /^(\*|([1-9]|1[0-2])([-,]([1-9]|1[0-2]))*|(\*\/\d+))$/, // month
      /^(\*|[0-6]([-,][0-6])*|(\*\/\d+))$/, // day of week
    ];
    
    return parts.every((part, i) => patterns[i].test(part));
  },
  { message: 'Expression cron invalide (format: * * * * *)' }
);

/**
 * Date string validator
 */
export const dateStringSchema = z.string().refine(
  (value) => {
    if (!value) return true;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  { message: 'Date invalide' }
);

/**
 * Color hex validator
 */
export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hex invalide');

// ============================================================================
// Entity Schemas
// ============================================================================

/**
 * User schema
 */
export const userSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  email: emailSchema,
  password: passwordSchema.optional(),
  role: z.enum(['admin', 'editor', 'author', 'viewer']),
  avatar: urlSchema.optional(),
  isActive: z.boolean().default(true),
});

export type UserInput = z.infer<typeof userSchema>;

/**
 * Article schema
 */
export const articleSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200, 'Titre trop long'),
  slug: slugSchema,
  content: z.string().min(1, 'Contenu requis'),
  excerpt: z.string().max(500, 'Extrait trop long').optional(),
  metaTitle: z.string().max(70, 'Meta title trop long (max 70)').optional(),
  metaDescription: z.string().max(160, 'Meta description trop longue (max 160)').optional(),
  categoryId: z.number().positive('Catégorie requise'),
  tagIds: z.array(z.number()).optional(),
  featuredImage: urlSchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: dateStringSchema.optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

/**
 * Program schema
 */
export const programSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  description: z.string().max(500, 'Description trop longue').optional(),
  type: z.enum(['country', 'service', 'topic', 'custom']),
  platformId: z.number().positive('Plateforme requise'),
  templateId: z.number().positive('Template requis').optional(),
  variables: z.record(z.unknown()).optional(),
  schedule: cronExpressionSchema.optional(),
  articlesPerRun: z.number().min(1).max(100).default(10),
  totalArticles: z.number().min(1).max(10000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  priority: z.enum(['high', 'default', 'low']).default('default'),
});

export type ProgramInput = z.infer<typeof programSchema>;

/**
 * Platform schema
 */
export const platformSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  type: z.enum(['wordpress', 'custom_api', 'webhook', 'ftp', 'other']),
  baseUrl: requiredUrlSchema,
  authType: z.enum(['none', 'api_key', 'bearer', 'basic', 'oauth2']),
  authConfig: z.record(z.unknown()).optional(),
  defaultHeaders: z.record(z.string()).optional(),
  fieldMapping: z
    .array(
      z.object({
        sourceField: z.string(),
        targetPath: z.string(),
        transform: z.enum(['none', 'json_encode', 'html_strip', 'truncate', 'custom']).optional(),
      })
    )
    .optional(),
  isActive: z.boolean().default(true),
});

export type PlatformInput = z.infer<typeof platformSchema>;

/**
 * Webhook schema
 */
export const webhookSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  url: requiredUrlSchema,
  events: z
    .array(
      z.enum([
        'article.created',
        'article.published',
        'article.updated',
        'article.deleted',
        'publication.queued',
        'publication.published',
        'publication.failed',
      ])
    )
    .min(1, 'Au moins un événement requis'),
  secret: z.string().min(16, 'Secret trop court (min 16)').max(64, 'Secret trop long'),
  headers: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type WebhookInput = z.infer<typeof webhookSchema>;

/**
 * Automation settings schema
 */
export const automationSettingsSchema = z.object({
  autoTranslate: z.boolean().default(false),
  autoGenerateImage: z.boolean().default(false),
  autoPublish: z.boolean().default(false),
  autoIndex: z.boolean().default(false),
  minQualityScore: z.number().min(0).max(100).default(70),
  articlesPerDay: z.number().min(1).max(500).default(50),
  maxPerHour: z.number().min(1).max(60).default(10),
  minIntervalMinutes: z.number().min(1).max(60).default(5),
  activeHours: z.array(z.number().min(0).max(23)).default([]),
  activeDays: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  indexingProviders: z.object({
    google: z.boolean().default(true),
    bing: z.boolean().default(false),
    indexNow: z.boolean().default(true),
  }),
});

export type AutomationSettingsInput = z.infer<typeof automationSettingsSchema>;

/**
 * Publication queue filter schema
 */
export const publicationQueueFilterSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'publishing', 'published', 'failed', 'cancelled']).optional(),
  platformId: z.number().optional(),
  priority: z.enum(['high', 'default', 'low']).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  search: z.string().optional(),
  per_page: z.number().min(1).max(100).default(20),
  page: z.number().min(1).default(1),
});

export type PublicationQueueFilter = z.infer<typeof publicationQueueFilterSchema>;

/**
 * Indexing queue filter schema
 */
export const indexingQueueFilterSchema = z.object({
  status: z.enum(['pending', 'processing', 'indexed', 'failed']).optional(),
  provider: z.enum(['google', 'bing', 'indexNow']).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  search: z.string().optional(),
  per_page: z.number().min(1).max(100).default(20),
  page: z.number().min(1).default(1),
});

export type IndexingQueueFilter = z.infer<typeof indexingQueueFilterSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate data against schema and return errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });

  return { success: false, errors };
}

/**
 * Get first error message from Zod error
 */
export function getFirstError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Erreur de validation';
}

/**
 * Create a partial schema (all fields optional)
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  return schema.partial();
}

/**
 * Create a pick schema (select specific fields)
 */
export function createPickSchema<T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
): z.ZodObject<Pick<T, K>> {
  return schema.pick(
    keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as { [P in K]: true })
  );
}

// ============================================================================
// Export all schemas
// ============================================================================

export const schemas = {
  email: emailSchema,
  url: urlSchema,
  requiredUrl: requiredUrlSchema,
  slug: slugSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  phone: phoneSchema,
  jsonValid: jsonValidSchema,
  htmlSafe: htmlSafeSchema,
  cronExpression: cronExpressionSchema,
  dateString: dateStringSchema,
  hexColor: hexColorSchema,
  user: userSchema,
  article: articleSchema,
  program: programSchema,
  platform: platformSchema,
  webhook: webhookSchema,
  automationSettings: automationSettingsSchema,
  publicationQueueFilter: publicationQueueFilterSchema,
  indexingQueueFilter: indexingQueueFilterSchema,
};

export default schemas;
