import { getHolyricsConfig } from "./config.js";

type HolyricsResponse<T> = {
  status?: string;
  data?: T;
  error?: unknown;
};

export async function holyricsRequest<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { baseUrl, token } = getHolyricsConfig();
  const endpoint = new URL(`${baseUrl.toString().replace(/\/$/, "")}/api/${action}`);
  endpoint.searchParams.set("token", token);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error(
      "Não consegui acessar o API Server do Holyrics. Confira se o Holyrics está aberto, se o servidor local está ativado e se a porta está correta.",
    );
  }

  if (!response.ok) {
    throw new Error(`O API Server do Holyrics respondeu com HTTP ${response.status}.`);
  }

  let result: HolyricsResponse<T>;
  try {
    result = (await response.json()) as HolyricsResponse<T>;
  } catch {
    throw new Error("O API Server do Holyrics retornou uma resposta que não é JSON válido.");
  }

  if (result.status !== "ok") {
    const error = typeof result.error === "string" ? result.error : "A API recusou a consulta.";
    throw new Error(`Holyrics: ${error}`);
  }

  return result.data as T;
}
