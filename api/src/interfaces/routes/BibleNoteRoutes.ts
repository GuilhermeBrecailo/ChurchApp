import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { BibleNoteAdapters } from "../adapters/bibleNoteAdapters";

export async function BibleNoteRoutes(app: FastifyInstance) {
  const adapters = new BibleNoteAdapters();

  app.get(
    "/api/bible/notes/:bookAbbrev/:chapter",
    controllerHandler(adapters.getBibleNote.bind(adapters)),
  );

  app.put(
    "/api/bible/notes/:bookAbbrev/:chapter",
    controllerHandler(adapters.upsertBibleNote.bind(adapters)),
  );
}
