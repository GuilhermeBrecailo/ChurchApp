import { defineNuxtPlugin, useRuntimeConfig } from "#app";

// Modo demonstração (NUXT_PUBLIC_DEMO=1): o app roda sem backend. Toda
// chamada para URL_BACKEND é respondida pela API falsa em web/demo/ (estado no
// localStorage do aparelho) e as APIs externas da Bíblia ganham capítulos
// offline. Fora do modo demo este plugin não faz nada e o código da demo nem
// é baixado (import dinâmico).
export default defineNuxtPlugin({
  name: "demo-mode",
  enforce: "pre",
  async setup() {
    const config = useRuntimeConfig();
    if (!config.public.DEMO) return;

    const [{ handleDemoRequest }, { demoBibleResponse }] = await Promise.all([
      import("../../demo/server"),
      import("../../demo/bible"),
    ]);

    const backend = String(config.public.URL_BACKEND || "").replace(/\/+$/, "");
    const originalFetch = globalThis.fetch.bind(globalThis);
    // Um respiro curto deixa os estados de "carregando" aparecerem como no app real.
    const latency = () => new Promise((resolve) => setTimeout(resolve, 60 + Math.random() * 120));

    const jsonResponse = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });

    const headersToRecord = (headers: HeadersInit | undefined) => {
      const record: Record<string, string> = {};
      if (!headers) return record;
      new Headers(headers).forEach((value, key) => {
        record[key] = value;
      });
      return record;
    };

    const demoFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

      if (backend && url.startsWith(backend)) {
        const request = input instanceof Request ? input : null;
        const method = (init?.method || request?.method || "GET").toUpperCase();
        let body: unknown = init?.body;
        if (body === undefined && request && method !== "GET" && method !== "HEAD") {
          body = await request.clone().text();
        }
        await latency();
        const response = await handleDemoRequest({
          method,
          url: url.slice(backend.length) || "/",
          body,
          headers: headersToRecord(init?.headers ?? request?.headers),
        });
        if (response.raw) {
          return new Response(response.raw.body as BodyInit, {
            status: response.status,
            headers: { "content-type": response.raw.contentType },
          });
        }
        return jsonResponse(response.status, response.body);
      }

      const bible = demoBibleResponse(url);
      if (bible) {
        await latency();
        return jsonResponse(200, bible);
      }

      return originalFetch(input, init);
    };

    globalThis.fetch = demoFetch as typeof fetch;
  },
});
