import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";

loadEnv({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export type HolyricsConfig = {
  baseUrl: URL;
  token: string;
};

export function getHolyricsConfig(): HolyricsConfig {
  const rawBaseUrl = process.env.HOLYRICS_BASE_URL?.trim();
  const token = process.env.HOLYRICS_TOKEN?.trim();

  if (!rawBaseUrl || !token) {
    throw new Error(
      "Configure HOLYRICS_BASE_URL e HOLYRICS_TOKEN no arquivo tools/holyrics-mcp/.env. Veja o README do MCP.",
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new Error("HOLYRICS_BASE_URL precisa ser uma URL válida do API Server local.");
  }

  if (baseUrl.protocol !== "http:" || baseUrl.username || baseUrl.password) {
    throw new Error("Use a URL HTTP local do Holyrics, sem usuário ou senha embutidos.");
  }

  baseUrl.pathname = baseUrl.pathname.replace(/\/$/, "");
  baseUrl.search = "";
  baseUrl.hash = "";

  return { baseUrl, token };
}
