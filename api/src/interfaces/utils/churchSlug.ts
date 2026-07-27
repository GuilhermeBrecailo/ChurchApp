import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "login",
  "register",
  "public",
  "status",
  "uploads",
]);

export function slugifyChurchName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "igreja";
}

export function normalizeChurchSlug(value: string) {
  return slugifyChurchName(value);
}

export function assertValidChurchSlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new DomainError("Slug deve conter apenas letras minusculas, numeros e hifen");
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new DomainError("Slug reservado para uso interno");
  }
}

export async function ensureUniqueChurchSlug(base: string, exceptChurchId?: string) {
  const normalized = normalizeChurchSlug(base);
  assertValidChurchSlug(normalized);

  let candidate = normalized;
  let suffix = 2;

  while (true) {
    const existing = await $prismaClient.crunch.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === exceptChurchId) {
      return candidate;
    }

    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
}

export async function assertChurchSlugAvailable(slug: string, exceptChurchId: string) {
  const normalized = normalizeChurchSlug(slug);
  assertValidChurchSlug(normalized);

  const existing = await $prismaClient.crunch.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });

  if (existing && existing.id !== exceptChurchId) {
    throw new DomainError("Endereco publico ja esta em uso");
  }

  return normalized;
}