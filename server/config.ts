import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  DATABASE_URL_DEV: z.string().optional(),

  SESSION_SECRET: z.string().optional(),
  AUTHORIZED_PROFESSOR_EMAILS: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_BASE_URL: z.string().optional(),

  REPLIT_DEV_DOMAIN: z.string().optional(),
  REPLIT_CONNECTORS_HOSTNAME: z.string().optional(),
  REPL_IDENTITY: z.string().optional(),
  WEB_REPL_RENEWAL: z.string().optional(),

  SIM_ENGINE_V2: z.enum(["true", "false"]).optional().default("false"),
});

export type AppEnv = z.infer<typeof envSchema>;

function requireInProduction(env: AppEnv) {
  const isProduction = env.NODE_ENV === "production";
  if (!isProduction) return;

  const missing: string[] = [];
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 16) missing.push("SESSION_SECRET (>=16 chars)");
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (missing.length) throw new Error(`Variáveis ausentes/inválidas em produção: ${missing.join(", ")}`);
}

export function getEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Falha ao interpretar variáveis de ambiente: ${issues}`);
  }
  const env = parsed.data;
  requireInProduction(env);
  return env;
}

// Endereço "de" único para todos os e-mails automáticos do sistema (pedido
// do professor, 2026-09). Antes havia dois remetentes diferentes: um fixo
// em server/services/email.ts (noreply@simulamarketing.com.br) e outro
// vindo dinamicamente da configuração do conector Resend no Replit, em
// server/email-service.ts — o que podia divergir sem ninguém perceber.
// Import este valor nos dois lugares em vez de repetir a string.
export const SYSTEM_FROM_EMAIL = "simula@simulamarketing.com.br";

export function getAuthorizedProfessorEmails(env: AppEnv): string[] {
  const raw = env.AUTHORIZED_PROFESSOR_EMAILS?.trim();
  if (!raw) return [];
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}
