import { FastifyReply, FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { GetPublicChurchBySlugUseCase } from "../../application/use-cases/PublicChurch/GetPublicChurchBySlugUseCase";
import { ListServiceTimesByChurchUseCase } from "../../application/use-cases/ServiceTime/ListServiceTimesByChurchUseCase";
import { calculateUpcomingServiceOccurrences } from "../../application/Services/ServiceTime/ServiceTimeOccurrences";
import { ServiceTimeRepository } from "../../infrastructure/repositories/ServiceTimeRepository";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { normalizeChurchSlug } from "../utils/churchSlug";

const publicChurchUseCase = new GetPublicChurchBySlugUseCase();
const serviceTimeRepository = new ServiceTimeRepository();
const listServiceTimesUseCase = new ListServiceTimesByChurchUseCase(serviceTimeRepository);

export class PublicChurchAdapters {
  private async getActiveChurch(slugParam?: string) {
    if (!slugParam?.trim()) throw new DomainError("Igreja nao informada");
    const church = await publicChurchUseCase.execute(normalizeChurchSlug(slugParam));
    return church;
  }

  async getChurch(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug?: string };
    const church = await this.getActiveChurch(slug);

    if (!church) return reply.code(404).send({ error: "Igreja nao encontrada", status: 404 });

    const [serviceTimes, publicContent, publicVerses, publicDevotionals, publicPosts] = await Promise.all([
      listServiceTimesUseCase.execute(church.id, true),
      $prismaClient.announcement.findMany({
        where: {
          crunchId: church.id,
          isPublic: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        take: 30,
        select: {
          id: true,
          title: true,
          body: true,
          pinned: true,
          kind: true,
          imageUrl: true,
          videoUrl: true,
          publishedAt: true,
          expiresAt: true,
          author: { select: { id: true, name: true } },
        },
      }),
      $prismaClient.dailyVerse.findMany({
        where: { crunchId: church.id, isPublic: true },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          text: true,
          reference: true,
          commentary: true,
          videoUrl: true,
          imageUrl: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
        },
      }),
      $prismaClient.devotional.findMany({
        where: { crunchId: church.id, isPublic: true },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          imageUrl: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
          chapters: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              content: true,
              bibleRef: true,
              order: true,
            },
          },
        },
      }),
      $prismaClient.post.findMany({
        where: { crunchId: church.id, isPublic: true },
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        take: 30,
        select: {
          id: true,
          title: true,
          body: true,
          imageUrl: true,
          videoUrl: true,
          pinned: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
        },
      }),
    ]);

    const serviceTimeItems = serviceTimes.map((item) => ({
      id: item.id,
      label: item.label,
      weekday: item.weekday,
      time: item.time,
      isActive: item.isActive,
    }));

    const footer = {
      address: {
        road: church.road,
        number: church.number,
        complement: church.complement,
        city: church.city,
        state: church.state,
        zipCode: church.localZipCode,
      },
      contacts: {
        phone: church.phone,
        whatsapp: church.whatsapp,
        email: church.email,
      },
      // So as redes preenchidas - a landing nao mostra icone vazio.
      social: Object.fromEntries(
        Object.entries({
          instagram: church.instagram,
          facebook: church.facebook,
          youtube: church.youtube,
          website: church.website,
        }).filter(([, value]) => Boolean(value)),
      ) as Record<string, string>,
    };

    return {
      church,
      serviceTimes: serviceTimeItems,
      upcomingServices: {
        week: calculateUpcomingServiceOccurrences(serviceTimeItems, { daysAhead: 7 }),
        month: calculateUpcomingServiceOccurrences(serviceTimeItems, { daysAhead: 30 }),
      },
      publicContent,
      publicVerses,
      publicDevotionals,
      publicPosts,
      footer,
    };
  }

  async getServiceTimes(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug?: string };
    const church = await this.getActiveChurch(slug);

    if (!church) return reply.code(404).send({ error: "Igreja nao encontrada", status: 404 });

    const serviceTimes = await listServiceTimesUseCase.execute(church.id, true);
    const items = serviceTimes.map((item) => ({
      id: item.id,
      label: item.label,
      weekday: item.weekday,
      time: item.time,
      isActive: item.isActive,
    }));

    return {
      serviceTimes: items,
      upcomingServices: {
        week: calculateUpcomingServiceOccurrences(items, { daysAhead: 7 }),
        month: calculateUpcomingServiceOccurrences(items, { daysAhead: 30 }),
      },
    };
  }

  async subscribe(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug?: string };
    const church = await this.getActiveChurch(slug);
    if (!church) return reply.code(404).send({ error: "Igreja nao encontrada", status: 404 });

    const body = request.body as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!body.endpoint?.trim()) throw new DomainError("Endpoint da notificacao e obrigatorio");
    if (!body.keys?.p256dh || !body.keys?.auth) throw new DomainError("Chaves da notificacao sao obrigatorias");

    return await $prismaClient.pushSubscription.upsert({
      where: { endpoint: body.endpoint.trim() },
      update: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userId: null,
        crunchId: church.id,
      },
      create: {
        endpoint: body.endpoint.trim(),
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        crunchId: church.id,
      },
      select: { id: true, endpoint: true },
    });
  }

  async unsubscribe(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug?: string };
    const church = await this.getActiveChurch(slug);
    if (!church) return reply.code(404).send({ error: "Igreja nao encontrada", status: 404 });

    const body = request.body as { endpoint?: string };
    if (!body.endpoint?.trim()) throw new DomainError("Endpoint da notificacao e obrigatorio");

    await $prismaClient.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint.trim(), crunchId: church.id, userId: null },
    });

    return { success: true };
  }
}