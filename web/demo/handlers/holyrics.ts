// Holyrics (projeção): na demo fica desconectado. Conectar "funciona" para a
// tela mudar de estado, mas a busca/sincronização devolvem vazio.

import { DemoError, defineHandlers } from "../lib";

const FEATURES = [
  { id: "playlist", label: "Enviar repertório", description: "Envia as músicas da escala para a lista do Holyrics", actions: ["AddLyricsToPlaylist"], impact: "playlist" },
  { id: "current", label: "Ver o que está no telão", description: "Mostra a música e o slide atuais", actions: ["GetCurrentPresentation"], impact: "read" },
  { id: "media", label: "Buscar mídias", description: "Procura vídeos, áudios e imagens do Holyrics", actions: ["GetMediaPlaylist"], impact: "read" },
];

export default defineHandlers((r) => {
  r.get("/api/church/holyrics/status", (ctx) => ({ connected: ctx.db.meta.holyricsConnected }));

  r.get("/api/church/holyrics/capabilities", (ctx) => ({
    version: ctx.db.meta.holyricsConnected ? "2.24.0 (demo)" : null,
    features: FEATURES.map((feature) => ({ ...feature, available: ctx.db.meta.holyricsConnected, implemented: true })),
  }));

  r.get("/api/church/holyrics/current-schedule", () => null);
  r.get("/api/church/holyrics/current-presentation", () => null);
  r.get("/api/church/holyrics/media", () => []);

  r.post("/api/church/holyrics/connect", (ctx) => {
    if (!ctx.body?.apiKey || !ctx.body?.token) throw new DemoError("Informe a chave e o token do Holyrics");
    ctx.db.meta.holyricsConnected = true;
    return { connected: true };
  });

  r.post("/api/church/holyrics/disconnect", (ctx) => {
    ctx.db.meta.holyricsConnected = false;
    return { success: true };
  });

  r.post("/api/church/holyrics/schedules/:id/sync", (ctx) => {
    if (!ctx.db.meta.holyricsConnected) throw new DemoError("Conecte o Holyrics antes de sincronizar");
    const items = ctx.db.scheduleMedia.filter((item) => item.scheduleId === ctx.params.id);
    return {
      target: "current_playlist",
      added: items.flatMap((item) => {
        const media = ctx.db.mediaItems.find((entry) => entry.id === item.mediaItemId && entry.category === "MUSIC");
        return media
          ? [{ mediaItemId: media.id, title: media.title, artist: String((media.metadata as Record<string, unknown>)?.artist ?? ""), holyricsId: `hl-${media.id}` }]
          : [];
      }),
      notFound: [],
    };
  });
});
