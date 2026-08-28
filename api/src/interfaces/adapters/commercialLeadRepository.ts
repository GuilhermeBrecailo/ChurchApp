import { z } from "zod";

import { $prismaClient } from "../../../config/database";
import {
  canTransitionLead,
  transitionLead,
  type LeadFunnel,
  type LeadStage,
} from "../../domain/commercial/leadPipeline";

const createLeadSchema = z
  .object({
    funnel: z.enum(["CUSTOMER", "AFFILIATE"]),
    instagramHandle: z.string().trim().min(1).optional(),
    instagramUserId: z.string().trim().min(1).optional(),
    organizationName: z.string().trim().min(1).optional(),
    contactName: z.string().trim().min(1).optional(),
    publicProfileUrl: z.string().url().optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    website: z.string().url().optional(),
    phone: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional(),
    score: z.number().int().min(0).max(100).default(0),
  })
  .refine(
    (input) =>
      Boolean(
        input.instagramHandle ||
          input.instagramUserId ||
          input.publicProfileUrl,
      ),
    {
      message:
        "Um lead precisa de instagramHandle, instagramUserId ou publicProfileUrl.",
      path: ["identity"],
    },
  );

export type CreateCommercialLeadInput = z.input<typeof createLeadSchema>;

type PrismaLike = typeof $prismaClient;

export class CommercialLeadNotFoundError extends Error {
  constructor(leadId: string) {
    super(`Lead comercial não encontrado: ${leadId}.`);
    this.name = "CommercialLeadNotFoundError";
  }
}

export class CommercialLeadRepository {
  constructor(private readonly prisma: PrismaLike = $prismaClient) {}

  async findOrCreate(input: CreateCommercialLeadInput) {
    const parsed = createLeadSchema.parse(input);
    const instagramHandle = parsed.instagramHandle?.replace(/^@+/, "").toLowerCase();
    const instagramUserId = parsed.instagramUserId;
    const publicProfileUrl = parsed.publicProfileUrl;

    const existing = await this.prisma.commercialLead.findFirst({
      where: {
        funnel: parsed.funnel,
        OR: [
          ...(instagramHandle ? [{ instagramHandle }] : []),
          ...(instagramUserId ? [{ instagramUserId }] : []),
          ...(publicProfileUrl ? [{ publicProfileUrl }] : []),
        ],
      },
    });

    if (existing) {
      return { lead: existing, created: false };
    }

    const lead = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.commercialLead.create({
        data: {
          funnel: parsed.funnel,
          stage: "DISCOVERED",
          instagramHandle,
          instagramUserId,
          organizationName: parsed.organizationName,
          contactName: parsed.contactName,
          publicProfileUrl,
          city: parsed.city,
          state: parsed.state,
          website: parsed.website,
          phone: parsed.phone,
          source: parsed.source,
          score: parsed.score,
        },
      });

      await transaction.commercialLeadEvent.create({
        data: {
          leadId: created.id,
          type: "DISCOVERED",
          toStage: "DISCOVERED",
        },
      });

      return created;
    });

    return { lead, created: true };
  }

  async transition(leadId: string, to: LeadStage) {
    const lead = await this.prisma.commercialLead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new CommercialLeadNotFoundError(leadId);
    }

    const funnel = lead.funnel as LeadFunnel;
    const from = lead.stage as LeadStage;
    const nextStage = transitionLead(funnel, from, to);

    if (!canTransitionLead(funnel, from, nextStage)) {
      throw new Error("Transição de lead comercial não permitida.");
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.commercialLead.update({
        where: { id: leadId },
        data: {
          stage: nextStage,
          doNotContact: nextStage === "DO_NOT_CONTACT",
        },
      });

      await transaction.commercialLeadEvent.create({
        data: {
          leadId,
          type: nextStage === "DO_NOT_CONTACT" ? "OPTED_OUT" : "STAGE_CHANGED",
          fromStage: from,
          toStage: nextStage,
        },
      });

      return updated;
    });
  }
}
