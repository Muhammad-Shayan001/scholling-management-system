import { z } from 'zod';

/**
 * Environment variable schema with Zod validation.
 *
 * This module validates all required environment variables at startup.
 * If any required variable is missing or invalid, the app will fail fast
 * with a clear error message indicating which variable is missing.
 *
 * SECURITY: Never log the actual values of secrets, only the variable names.
 */

const envSchema = z.object({
  // ─────────────────────────────────────────────────────────────────────────────
  // SUPABASE
  // ─────────────────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // ─────────────────────────────────────────────────────────────────────────────
  // APPLICATION
  // ─────────────────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),
  NEXT_PUBLIC_PRODUCT_NAME: z.string().default('School Management Platform'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Karachi'),
  DEFAULT_CURRENCY: z.string().length(3, 'Currency must be 3-letter ISO code').default('PKR'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ─────────────────────────────────────────────────────────────────────────────
  // SUPER ADMIN (for seeding only)
  // ─────────────────────────────────────────────────────────────────────────────
  SUPER_ADMIN_EMAIL: z.string().email('Invalid super admin email').optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(8, 'Super admin password must be at least 8 characters').optional(),

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL PROVIDER
  // ─────────────────────────────────────────────────────────────────────────────
  EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),

  // SMTP (if EMAIL_PROVIDER=smtp)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP port must be a number').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email('Invalid from email').optional(),

  // Resend (if EMAIL_PROVIDER=resend)
  RESEND_API_KEY: z.string().optional(),

  // ─────────────────────────────────────────────────────────────────────────────
  // FIREBASE CLOUD MESSAGING (Push Notifications)
  // ─────────────────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),

  // ─────────────────────────────────────────────────────────────────────────────
  // CRON & SCHEDULED JOBS
  // ─────────────────────────────────────────────────────────────────────────────
  CRON_SECRET: z.string().min(16, 'Cron secret must be at least 16 characters').optional(),

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Payment Gateway (Phase 9)
  // ─────────────────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Error Tracking
  // ─────────────────────────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // ─────────────────────────────────────────────────────────────────────────────
  // DEVELOPMENT
  // ─────────────────────────────────────────────────────────────────────────────
  DEBUG: z.enum(['true', 'false']).default('false'),
}).refine(
  (data) => {
    // If email provider is SMTP, require SMTP credentials
    if (data.EMAIL_PROVIDER === 'smtp') {
      return !!(data.SMTP_HOST && data.SMTP_PORT && data.SMTP_USER && data.SMTP_PASS && data.EMAIL_FROM);
    }
    // If email provider is Resend, require API key
    if (data.EMAIL_PROVIDER === 'resend') {
      return !!data.RESEND_API_KEY;
    }
    return true;
  },
  {
    message: 'Email provider configuration incomplete. ' +
      'For SMTP: provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM. ' +
      'For Resend: provide RESEND_API_KEY.',
    path: ['EMAIL_PROVIDER'],
  }
);

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables.
 *
 * This object is guaranteed to have all required environment variables
 * or the app will crash at startup with a clear error message.
 *
 * @throws {ZodError} If any required environment variable is missing or invalid
 */
let _env: Env | null = null;

function getEnv(): Env {
  if (_env) return _env;

  try {
    _env = envSchema.parse({
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // Application
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_PRODUCT_NAME: process.env.NEXT_PUBLIC_PRODUCT_NAME,
      DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE,
      DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY,
      NODE_ENV: process.env.NODE_ENV,

      // Super Admin
      SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,

      // Email
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      EMAIL_FROM: process.env.EMAIL_FROM,
      RESEND_API_KEY: process.env.RESEND_API_KEY,

      // Firebase
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,

      // Cron
      CRON_SECRET: process.env.CRON_SECRET,

      // Payment (optional)
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

      // Error tracking (optional)
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,

      // Development
      DEBUG: process.env.DEBUG,
    });

    return _env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:\n');

      error.issues.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });

      console.error('\n💡 Tip: Copy .env.example to .env.local and fill in the required values.\n');

      throw new Error('Invalid environment configuration. Check the errors above.');
    }
    throw error;
  }
}

/**
 * Validated environment variables.
 * Access like: env.NEXT_PUBLIC_SUPABASE_URL
 */
export const env = getEnv();

/**
 * Check if the app is running in production.
 */
export const isProd = env.NODE_ENV === 'production';

/**
 * Check if the app is running in development.
 */
export const isDev = env.NODE_ENV === 'development';

/**
 * Check if debug mode is enabled.
 */
export const isDebug = env.DEBUG === 'true';

/**
 * Helper to get Firebase config for client-side use.
 */
export function getFirebaseConfig() {
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Helper to get Firebase Admin config for server-side use.
 *
 * @throws {Error} If FIREBASE_SERVICE_ACCOUNT_JSON is not configured
 */
export function getFirebaseAdminConfig() {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  }

  try {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be valid JSON');
  }
}
