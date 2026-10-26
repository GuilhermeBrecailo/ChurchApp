import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { holyricsRequest } from "./holyricsClient.js";

const server = new McpServer({
  name: "churchapp-holyrics",
  version: "0.1.0",
});

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado ao consultar o Holyrics.";
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

server.registerTool(
  "holyrics_status",
  {
    title: "Verificar conexão e permissões do Holyrics",
    description: "Consulta a versão da API e as permissões concedidas ao token. Não altera o Holyrics.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async () => {
    try {
      return jsonResult(await holyricsRequest("GetTokenInfo"));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "holyrics_current_schedule",
  {
    title: "Consultar programação atual do Holyrics",
    description: "Lê o culto/programação selecionado, músicas e mídias associadas. Não altera a programação.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async () => {
    try {
      return jsonResult(await holyricsRequest("GetCurrentSchedule"));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "holyrics_current_presentation",
  {
    title: "Consultar o que está sendo projetado",
    description: "Lê o item e o slide atualmente projetados. Não envia comandos ao telão.",
    inputSchema: {
      includeSlides: z.boolean().default(false).describe("Se true, inclui o conteúdo dos slides da apresentação atual."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ includeSlides }) => {
    try {
      return jsonResult(await holyricsRequest("GetCurrentPresentation", { include_slides: includeSlides }));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "holyrics_search_songs",
  {
    title: "Buscar músicas cadastradas no Holyrics",
    description: "Pesquisa títulos/artistas na biblioteca e retorna apenas metadados, sem letras completas.",
    inputSchema: {
      query: z.string().trim().min(1).max(120).describe("Trecho do título ou nome do artista."),
      limit: z.number().int().min(1).max(50).default(20).describe("Máximo de resultados retornados."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ query, limit }) => {
    try {
      const songs = await holyricsRequest<unknown[]>("SearchLyrics", {
        text: query,
        title: true,
        artist: true,
        note: false,
        lyrics: false,
        fields: "id,title,artist,author,key,bpm,groups",
      });
      return jsonResult(Array.isArray(songs) ? songs.slice(0, limit) : songs);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "holyrics_search_media",
  {
    title: "Buscar mídias no Holyrics",
    description: "Busca nomes de áudios, vídeos ou imagens na biblioteca do Holyrics, sem carregar arquivos ou miniaturas.",
    inputSchema: {
      kind: z.enum(["audio", "video", "image"]).describe("Tipo de mídia para pesquisar."),
      query: z.string().trim().max(120).default("").describe("Texto para filtrar pelo nome; vazio lista os itens da pasta padrão."),
      folder: z.string().trim().max(240).optional().describe("Subpasta opcional da biblioteca."),
      limit: z.number().int().min(1).max(100).default(30).describe("Máximo de resultados retornados."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ kind, query, folder, limit }) => {
    try {
      const action = { audio: "GetAudios", video: "GetVideos", image: "GetImages" }[kind];
      const files = await holyricsRequest<unknown[]>(action, {
        ...(query ? { filter: query } : {}),
        ...(folder ? { folder } : {}),
        include_metadata: false,
        include_thumbnail: false,
      });
      return jsonResult(Array.isArray(files) ? files.slice(0, limit) : files);
    } catch (error) {
      return errorResult(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
