import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

const businessConfigSchema = z.object({
  owner: z.object({
    name: z.string().trim().min(1),
    role: z.string().trim().min(1),
  }),
  company: z.object({
    name: z.string().trim().min(1),
    website: z.string().url(),
    instagramHandle: z.string().trim().min(1),
    whatsappUrl: z.string().url(),
    product: z.string().trim().min(1),
  }),
  offer: z.object({
    pitch: z.string().trim().min(1),
    howItWorks: z.string().trim().min(1),
    freeTrialMonths: z.number().int().min(0),
    freePlanAvailable: z.boolean(),
    proPlan: z.object({
      name: z.string().trim().min(1),
      price: z.number().positive(),
      currency: z.string().length(3),
    }),
  }),
  verifiedClaims: z.array(z.string().trim().min(1)),
  unverifiedClaims: z.array(z.string().trim().min(1)),
  idealCustomerProfile: z.object({
    segments: z.array(z.string().trim().min(1)),
    keywords: z.array(z.string().trim().min(1)),
    geography: z.array(z.string().trim().min(1)),
  }),
  affiliates: z.object({
    groupUrl: z.string().url().nullable(),
    topics: z.array(z.string().trim().min(1)),
  }),
});

export type BusinessConfig = z.infer<typeof businessConfigSchema>;

export class BusinessConfigValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BusinessConfigValidationError";
  }
}

function resolveDefaultBusinessConfigPath(): string {
  if (process.env.BUSINESS_CONFIG_PATH) {
    return resolve(process.env.BUSINESS_CONFIG_PATH);
  }

  const candidates = [
    resolve(process.cwd(), "config/business.json"),
    resolve(process.cwd(), "api/config/business.json"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export function loadBusinessConfig(
  filePath = resolveDefaultBusinessConfigPath(),
): BusinessConfig {
  let raw: string;

  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    throw new BusinessConfigValidationError(
      `Não foi possível ler a configuração comercial em ${filePath}.`,
      { cause: error },
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new BusinessConfigValidationError(
      `A configuração comercial em ${filePath} não contém um JSON válido.`,
      { cause: error },
    );
  }

  const result = businessConfigSchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new BusinessConfigValidationError(
      `A configuração comercial em ${filePath} é inválida: ${details}`,
      { cause: result.error },
    );
  }

  return result.data;
}

let cachedBusinessConfig: BusinessConfig | undefined;

export function getBusinessConfig(): BusinessConfig {
  cachedBusinessConfig ??= loadBusinessConfig();
  return cachedBusinessConfig;
}
