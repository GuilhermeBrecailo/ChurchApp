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

export type CommercialLeadListFilters = {
  funnel?: LeadFunnel;
  stage?: LeadStage;
  includeDoNotContact?: boolean;
  limit?: number;
};

const signupTokenSchema = z.string().uuid();

type PrismaLike = typeof $prismaClient;

export class CommercialLeadNotFoundError extends Error {
  constructor(leadId: string) {
    super(`Lead comercial não encontrado: ${leadId}.`);
    this.name = "CommercialLeadNotFoundError";
  }
}

export class CommercialLeadRepository {
  constructor(private readonly prisma: PrismaLike = $prismaClient) {}

  async list(filters: CommercialLeadListFilters = {}) {
    const where = {
      ...(filters.funnel ? { funnel: filters.funnel } : {}),
      ...(filters.stage ? { stage: filters.stage } : {}),
      ...(filters.includeDoNotContact ? {} : { doNotContact: false }),
    };
    const take = Math.min(Math.max(filters.limit ?? 100, 1), 250);

    const [items, total] = await Promise.all([
      this.prisma.commercialLead.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take,
        select: {
          id: true,
          funnel: true,
          stage: true,
          instagramHandle: true,
          instagramUserId: true,
          organizationName: true,
          contactName: true,
          publicProfileUrl: true,
          city: true,
          state: true,
          website: true,
          phone: true,
          source: true,
          score: true,
          doNotContact: true,
          firstContactAt: true,
          lastContactAt: true,
          nextActionAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { events: true } },
        },
      }),
      this.prisma.commercialLead.count({ where }),
    ]);

    return { items, total };
  }

  async findByIdWithEvents(leadId: string) {
    return this.prisma.commercialLead.findUnique({
      where: { id: leadId },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
  }

  async markStageBySignupToken(token: string, to: LeadStage) {
    const signupToken = signupTokenSchema.parse(token);
    const lead = await this.prisma.commercialLead.findUnique({
      where: { signupToken },
      select: { id: true, funnel: true, stage: true, doNotContact: true },
    });

    if (!lead || lead.doNotContact || lead.stage === "DO_NOT_CONTACT") {
      return null;
    }

    if (lead.stage === to) {
      return lead;
    }

    const canRecordSignup = lead.funnel === "CUSTOMER" && to === "SIGNED_UP";
    const canRecordActivation =
      lead.funnel === "CUSTOMER" && to === "ACTIVATED" && lead.stage === "SIGNED_UP";

    if (!canRecordSignup && !canRecordActivation) {
      return null;
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.commercialLead.update({
        where: { id: lead.id },
        data: { stage: to, doNotContact: false },
      });

      await transaction.commercialLeadEvent.create({
        data: {
          leadId: lead.id,
          type: "STAGE_CHANGED",
          fromStage: lead.stage,
          toStage: to,
        },
      });

      return updated;
    });
  }

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
