import { z } from "zod";

/**
 * Server-side environment. Parsed once, lazily, so that `next build` works
 * without credentials and missing values degrade to development behaviour.
 * Never import this file from a client component.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().default("BoLaGio Atelier <tickets@example.com>"),
  EMAIL_REPLY_TO: z.string().optional(),
  PRIVATE_EVENTS_RECIPIENT: z.string().email().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),

  CRON_SECRET: z.string().min(16).optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),

  PUBLIC_SALES_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  VOUCHERS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  TESTIMONIALS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  HOLD_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    // Surface misconfiguration loudly on the server, but never leak values.
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const hasSupabase = () => Boolean(env().SUPABASE_URL && env().SUPABASE_SERVICE_ROLE_KEY);
export const hasStripe = () => Boolean(env().STRIPE_SECRET_KEY);
export const hasResend = () => Boolean(env().RESEND_API_KEY);
export const isProduction = () => env().NODE_ENV === "production";

/**
 * Payment simulation (no Stripe key) is allowed only when the public site URL
 * is EXPLICITLY set to a localhost address. The schema default (localhost) does
 * not count: an unset variable on a deployed site must never enable it, so a
 * deployed site without a Stripe key can never issue tickets without payment.
 */
export const paymentSimulationAllowed = () => {
  if (hasStripe()) return false;
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (!explicit) return false;
  const isLocal = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return host === "localhost" || host === "127.0.0.1";
    } catch {
      return false;
    }
  };
  // Both the build-time (inlined) and runtime values must be local.
  return isLocal(explicit) && isLocal(env().NEXT_PUBLIC_SITE_URL);
};
