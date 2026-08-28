import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";

type UnknownRecord = Record<string, unknown>;

export type InstagramWebhookEvent = {
  eventId: string;
  instagramUserId: string;
  senderId?: string;
  eventType: "MESSAGE" | "COMMENT" | "OTHER";
  messageText?: string;
  occurredAt?: Date;
  metadata: { field?: string };
};

type InstagramWebhookPrisma = {
  instagramWebhookEvent: {
    findUnique: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  };
  commercialLead: {
    findFirst: (args: unknown) => Promise<{
      id: string;
      funnel: string;
      stage: string;
      doNotContact: boolean;
    } | null>;
    create: (args: unknown) => Promise<{ id: string }>;
    update: (args: unknown) => Promise<unknown>;
  };
  commercialLeadEvent: {
    create: (args: unknown) => Promise<unknown>;
  };
  $transaction: <T>(callback: (transaction: InstagramWebhookPrisma) => Promise<T>) => Promise<T>;
};

const defaultPrisma = $prismaClient as unknown as InstagramWebhookPrisma;

export function normalizeInstagramWebhookPayload(payload: unknown): InstagramWebhookEvent[] {
  const root = asRecord(payload);
  if (root?.object !== "instagram" || !Array.isArray(root.entry)) {
    return [];
  }

  const events: InstagramWebhookEvent[] = [];
  for (const rawEntry of root.entry) {
    const entry = asRecord(rawEntry);
    const instagramUserId = asString(entry?.id);
    if (!instagramUserId) continue;

    const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
    for (const rawMessage of messaging) {
      const message = asRecord(rawMessage);
      const senderId = asString(asRecord(message?.sender)?.id);
      if (!senderId) continue;

      const messageBody = asRecord(message?.message);
      const messageId = asString(messageBody?.mid);
      const timestamp = asDate(message?.timestamp);
      events.push({
        eventId: messageId
          ? `message:${instagramUserId}:${messageId}`
          : fallbackEventId(instagramUserId, rawMessage),
        instagramUserId,
        senderId,
        eventType: "MESSAGE",
        messageText: limitText(asString(messageBody?.text)),
        occurredAt: timestamp,
        metadata: {},
      });
    }

    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const rawChange of changes) {
      const change = asRecord(rawChange);
      const field = asString(change?.field);
      const value = asRecord(change?.value);
      if (!value) continue;

      const senderId = asString(asRecord(value.from)?.id);
      const valueId = asString(value.id);
      events.push({
        eventId: valueId
          ? `${field || "change"}:${instagramUserId}:${valueId}`
          : fallbackEventId(instagramUserId, rawChange),
        instagramUserId,
        senderId,
        eventType: field === "comments" ? "COMMENT" : "OTHER",
        messageText: limitText(asString(value.text)),
        occurredAt: asDate(value.timestamp),
        metadata: field ? { field } : {},
      });
    }
  }

  return events;
}

export type InstagramWebhookProcessResult = {
  eventCount: number;
  stored: number;
  duplicates: number;
  leadsUpdated: number;
};

export class InstagramWebhookService {
  constructor(private readonly prisma: InstagramWebhookPrisma = defaultPrisma) {}

  async process(payload: unknown): Promise<InstagramWebhookProcessResult> {
    const events = normalizeInstagramWebhookPayload(payload);
    let stored = 0;
    let duplicates = 0;
    let leadsUpdated = 0;

    for (const event of events) {
      const result = await this.storeEvent(event);
      if (result.duplicate) {
        duplicates += 1;
      } else {
        stored += 1;
        leadsUpdated += result.leadUpdated ? 1 : 0;
      }
    }

    return { eventCount: events.length, stored, duplicates, leadsUpdated };
  }

  private async storeEvent(event: InstagramWebhookEvent) {
    const existing = await this.prisma.instagramWebhookEvent.findUnique({
      where: { eventId: event.eventId },
      select: { id: true },
    });
    if (existing) return { duplicate: true, leadUpdated: false };

    try {
      return await this.prisma.$transaction(async (transaction) => {
        let leadId: string | undefined;
        let leadUpdated = false;

        if (event.eventType === "MESSAGE" && event.senderId) {
          const lead = await transaction.commercialLead.findFirst({
            where: {
              funnel: "CUSTOMER",
              instagramUserId: event.senderId,
            },
            select: {
              id: true,
              funnel: true,
              stage: true,
              doNotContact: true,
            },
          });

          if (!lead) {
            const createdLead = await transaction.commercialLead.create({
              data: {
                funnel: "CUSTOMER",
                stage: "CONVERSATION_ACTIVE",
                instagramUserId: event.senderId,
                source: "instagram_webhook",
                ...(event.occurredAt
                  ? {
                      firstContactAt: event.occurredAt,
                      lastContactAt: event.occurredAt,
                    }
                  : {}),
              },
            });
            leadId = createdLead.id;
            leadUpdated = true;
            await transaction.commercialLeadEvent.create({
              data: {
                leadId,
                type: "INBOUND_MESSAGE",
                toStage: "CONVERSATION_ACTIVE",
                channel: "INSTAGRAM",
                metadata: { eventId: event.eventId },
              },
            });
          } else {
            leadId = lead.id;
            const contactableStages = new Set([
              "DISCOVERED",
              "QUALIFIED",
              "FIRST_CONTACT_PENDING",
              "FIRST_CONTACT_SENT",
              "AWAITING_REPLY",
            ]);
            const nextStage =
              !lead.doNotContact && contactableStages.has(lead.stage)
                ? "CONVERSATION_ACTIVE"
                : lead.stage;

            await transaction.commercialLead.update({
              where: { id: lead.id },
              data: {
                ...(nextStage !== lead.stage ? { stage: nextStage } : {}),
                ...(lead.doNotContact || !event.occurredAt
                  ? {}
                  : { lastContactAt: event.occurredAt }),
              },
            });

            if (nextStage !== lead.stage) {
              leadUpdated = true;
              await transaction.commercialLeadEvent.create({
                data: {
                  leadId: lead.id,
                  type: "STAGE_CHANGED",
                  fromStage: lead.stage,
                  toStage: nextStage,
                  channel: "INSTAGRAM",
                  metadata: { eventId: event.eventId, reason: "INBOUND_MESSAGE" },
                },
              });
            }
          }
        }

        await transaction.instagramWebhookEvent.create({
          data: {
            eventId: event.eventId,
            instagramUserId: event.instagramUserId,
            senderId: event.senderId,
            eventType: event.eventType,
            messageText: event.messageText,
            occurredAt: event.occurredAt,
            leadId,
            metadata: event.metadata,
          },
        });

        return { duplicate: false, leadUpdated };
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return { duplicate: true, leadUpdated: false };
      }
      throw error;
    }
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asDate(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const timestamp = value < 10_000_000_000 ? value * 1000 : value;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function limitText(value: string | undefined) {
  return value?.slice(0, 5_000);
}

function fallbackEventId(instagramUserId: string, value: unknown) {
  return `payload:${instagramUserId}:${crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  );
}
