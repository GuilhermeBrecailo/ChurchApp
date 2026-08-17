import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

function getAuthUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

function parseChapterParam(raw?: string) {
  const chapter = Number(raw);
  if (!raw || !Number.isInteger(chapter) || chapter <= 0) {
    throw new DomainError("Capítulo inválido");
  }
  return chapter;
}

// Anotacoes pessoais de leitura biblica: privadas, por usuario, chaveadas
// por livro+capitulo (nao ha checagem de igreja/permissao - e conteudo
// pessoal do proprio usuario autenticado, igual ao progresso de devocional).
export class BibleNoteAdapters {
  async getBibleNote(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const { bookAbbrev, chapter } = request.params as {
      bookAbbrev?: string;
      chapter?: string;
    };

    if (!bookAbbrev) throw new DomainError("Livro não informado");
    const chapterNumber = parseChapterParam(chapter);

    const note = await $prismaClient.userBibleNote.findUnique({
      where: {
        userId_bookAbbrev_chapter: {
          userId,
          bookAbbrev,
          chapter: chapterNumber,
        },
      },
      select: { id: true, content: true, updatedAt: true },
    });

    return note ?? { id: null, content: "", updatedAt: null };
  }

  async upsertBibleNote(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const { bookAbbrev, chapter } = request.params as {
      bookAbbrev?: string;
      chapter?: string;
    };
    const body = request.body as { content?: string };

    if (!bookAbbrev) throw new DomainError("Livro não informado");
    const chapterNumber = parseChapterParam(chapter);
    const content = body.content?.trim() || "";

    if (!content) {
      await $prismaClient.userBibleNote.deleteMany({
        where: { userId, bookAbbrev, chapter: chapterNumber },
      });
      return { id: null, content: "", updatedAt: null };
    }

    const note = await $prismaClient.userBibleNote.upsert({
      where: {
        userId_bookAbbrev_chapter: {
          userId,
          bookAbbrev,
          chapter: chapterNumber,
        },
      },
      create: {
        id: crypto.randomUUID(),
        userId,
        bookAbbrev,
        chapter: chapterNumber,
        content,
      },
      update: { content },
      select: { id: true, content: true, updatedAt: true },
    });

    return note;
  }
}
