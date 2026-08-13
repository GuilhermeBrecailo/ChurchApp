// Fonte dinamica do @nuxtjs/sitemap (ver web/nuxt.config.ts, sitemap.sources)
// pra incluir a pagina publica de cada igreja ativa (/c/[slug]) no sitemap -
// sem isso o Google nunca descobre essas paginas sozinho, ja que nada mais
// linka pra todas elas de uma vez.
import type { SitemapUrlInput } from "#sitemap/types";

export default defineEventHandler(async (): Promise<SitemapUrlInput[]> => {
  const config = useRuntimeConfig();

  try {
    const response = await $fetch<{ data: { slug: string; updatedAt: string }[] }>(
      "/public/churches/sitemap",
      { baseURL: config.apiInternalBase },
    );

    return response.data.map((church) => ({
      loc: `/c/${church.slug}`,
      lastmod: church.updatedAt,
      changefreq: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Se a API estiver fora do ar no momento da geracao do sitemap, nao
    // derruba o build inteiro - so fica sem as paginas de igreja dessa vez.
    return [];
  }
});
