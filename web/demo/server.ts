// "API" falsa da demonstração. Recebe método + caminho (o mesmo que o front
// manda para a API real) e devolve o envelope do controllerHandler:
//   sucesso       -> HTTP 200 { data, status: 200 }
//   DemoError     -> HTTP 200 { error, status: 409 }   (igual DomainError)
//   DemoForbidden -> HTTP 403 { error, status: 403 }
//   sem handler   -> HTTP 200 { data: [], status: 200 } + console.warn
//
// Os handlers ficam em demo/handlers/<area>.ts; veja demo/README.md.

import { registerAllHandlers } from "./handlers";
import {
  buildContext,
  DemoError,
  DemoForbidden,
  type DemoHandler,
  type DemoRawResponse,
  type DemoRouter,
} from "./lib";
import { getPersona, saveDb } from "./store";

export { DemoError, DemoForbidden, defineHandlers, rawResponse } from "./lib";
export type { DemoContext, DemoHandler, DemoRouter } from "./lib";

interface Route {
  method: string;
  pattern: string;
  regex: RegExp;
  keys: string[];
  staticSegments: number;
  handler: DemoHandler;
}

const routes: Route[] = [];

function compile(method: string, pattern: string, handler: DemoHandler): Route {
  const keys: string[] = [];
  const segments = pattern.split("/").filter(Boolean);
  const regex = new RegExp(
    `^/${segments
      .map((segment) => {
        if (segment.startsWith(":")) {
          keys.push(segment.slice(1));
          return "([^/]+)";
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/")}/?$`,
  );
  return {
    method,
    pattern,
    regex,
    keys,
    staticSegments: segments.filter((segment) => !segment.startsWith(":")).length,
    handler,
  };
}

export const router: DemoRouter = {
  get: (path, handler) => void routes.push(compile("GET", path, handler)),
  post: (path, handler) => void routes.push(compile("POST", path, handler)),
  put: (path, handler) => void routes.push(compile("PUT", path, handler)),
  patch: (path, handler) => void routes.push(compile("PATCH", path, handler)),
  delete: (path, handler) => void routes.push(compile("DELETE", path, handler)),
};

let registered = false;
function ensureRoutes() {
  if (registered) return;
  registered = true;
  registerAllHandlers(router);
}

export function findRoute(method: string, path: string) {
  ensureRoutes();
  let best: { route: Route; params: Record<string, string> } | null = null;
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = route.regex.exec(path);
    if (!match) continue;
    if (best && best.route.staticSegments >= route.staticSegments) continue;
    const params: Record<string, string> = {};
    route.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1] ?? "");
    });
    best = { route, params };
  }
  return best;
}

export interface DemoRequest {
  method?: string;
  /** URL completa ou só o caminho ("/api/me?x=1") */
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface DemoResponse {
  status: number;
  /** Envelope JSON, ou o corpo cru quando `raw` vem preenchido */
  body: unknown;
  raw?: DemoRawResponse;
}

const parseBody = (body: unknown) => {
  if (typeof body !== "string") return body ?? {};
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export async function handleDemoRequest(request: DemoRequest): Promise<DemoResponse> {
  const method = (request.method || "GET").toUpperCase();
  const url = new URL(request.url, "https://demo.churchapp.local");
  const path = url.pathname.replace(/\/{2,}/g, "/");
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const found = findRoute(method, path);
  if (!found) {
    console.warn("[demo] sem handler", method, path);
    return { status: 200, body: { data: [], status: 200 } };
  }

  const persona = getPersona();
  const ctx = buildContext({
    method,
    path,
    params: found.params,
    query,
    body: parseBody(request.body),
    headers: request.headers ?? {},
    persona,
  });

  try {
    const data = await found.route.handler(ctx);
    if (method !== "GET") saveDb(persona.world);
    if (data && typeof data === "object" && (data as DemoRawResponse).__demoRaw) {
      const raw = data as DemoRawResponse;
      return { status: raw.status ?? 200, body: raw.body, raw };
    }
    return { status: 200, body: { data: data ?? null, status: 200 } };
  } catch (error) {
    if (error instanceof DemoError) {
      return { status: 200, body: { error: error.message, status: 409 } };
    }
    if (error instanceof DemoForbidden) {
      return { status: 403, body: { error: error.message, status: 403 } };
    }
    console.error("[demo] erro no handler", method, path, error);
    return { status: 500, body: { error: "Erro interno (demo)", status: 500 } };
  }
}

/** Lista as rotas registradas (útil para depurar e para os testes). */
export function listDemoRoutes() {
  ensureRoutes();
  return routes.map((route) => `${route.method} ${route.pattern}`);
}
