#!/usr/bin/env node
/**
 * Prints automáticos das telas principais (claro/escuro, celular/desktop).
 *
 * Roda contra um servidor do web já no ar (BASE_URL, padrão
 * http://localhost:3000) que foi iniciado com
 * NUXT_PUBLIC_URL_BACKEND=http://mock.local — todas as chamadas à API são
 * interceptadas aqui e respondidas com um usuário pastor de exemplo e listas
 * vazias, então não precisa de API, banco nem Keycloak.
 *
 * Saída: uma imagem por tela/modo em OUT_DIR (padrão ./screenshots) e um
 * resumo em OUT_DIR/report.md. Termina com erro se alguma tela cair na tela
 * de erro do Nuxt ("Algo deu errado"), tiver rolagem horizontal no celular
 * (conteúdo vazando da tela) ou não carregar.
 *
 * Uso local:
 *   NUXT_PUBLIC_URL_BACKEND=http://mock.local npx nuxt dev --port 3000
 *   npm run screenshots
 * Variáveis: BASE_URL, OUT_DIR, PAGES (lista separada por vírgula),
 * MODES (ex.: "mobile-light,desktop-dark"), CHROMIUM_PATH (binário opcional).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const OUT_DIR = resolve(process.env.OUT_DIR || "screenshots");
const API_ORIGIN = "http://mock.local";

const PAGES = (process.env.PAGES ||
  "/,/scale,/ministery,/ministery/demo,/igreja,/prayer,/notifications,/content/devotionals,/user,/admin,/configuracoes,/comunicar,/pessoas,/login")
  .split(",")
  .map((page) => page.trim())
  .filter(Boolean);

// Telas abertas sem login: capturadas com a sessão recusada (senão o app
// redireciona o usuário logado para o Início).
const PUBLIC_PAGES = new Set(["/login", "/register", "/forgot-password", "/comece"]);

const MODES = (process.env.MODES || "mobile-light,mobile-dark,desktop-light,desktop-dark")
  .split(",")
  .map((mode) => mode.trim())
  .filter(Boolean);

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1366, height: 860 },
};

const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
// Token sem assinatura: o front só decodifica o payload (jwt-decode).
const accessToken = `${base64Url({ alg: "none" })}.${base64Url({
  sub: "user-1",
  email: "pastor@exemplo.com",
  name: "Carlos Mendes",
  role: "PASTOR",
  exp: 4102444800,
})}.sig`;

const church = {
  id: "church-1",
  name: "Igreja Batista Central",
  slug: "ibc",
  city: "Curitiba",
  state: "PR",
  accentColor: "#B5472A",
};

const me = {
  id: "user-1",
  name: "Carlos Mendes",
  email: "pastor@exemplo.com",
  role: "PASTOR",
  hasChurch: true,
  isTitularPastor: true,
  canManageMembers: true,
  church,
  activeChurchId: church.id,
  activeChurch: church,
  memberships: [{ isActive: true, role: "PASTOR", church, roles: [], canManageMembers: true }],
  mustChangePassword: false,
  permissions: [],
};

// Ministério de exemplo para a tela de detalhe (/ministery/demo).
const demoDepartment = {
  id: "demo",
  name: "Louvor",
  type: "WORSHIP",
  isActive: true,
  modules: ["SCHEDULES", "SONGS"],
  leaderId: "user-1",
  canManageSchedule: true,
  canManageSongs: true,
  isMember: true,
  leader: { id: "user-1", name: "Carlos Mendes", email: "pastor@exemplo.com" },
};

function mockResponse(url) {
  if (url.includes("refresh-token")) return { access_token: accessToken };
  if (/\/api\/church\/departments\/[^/?]+$/.test(url)) return demoDepartment;
  if (url.endsWith("/api/me")) return me;
  if (url.includes("/api/notifications/public-key")) return { publicKey: null, configured: false };
  if (/\/api\/notifications(\?|$)/.test(url)) return { notifications: [], unreadCount: 0 };
  return [];
}

const fileNameFor = (mode, page) =>
  `${mode}${page === "/" ? "_inicio" : page.replace(/[/?=&]+/g, "_")}.png`;

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const results = [];

  for (const mode of MODES) {
    const [device, scheme] = mode.split("-");
    const viewport = VIEWPORTS[device];
    if (!viewport || !["light", "dark"].includes(scheme)) {
      throw new Error(`Modo inválido: ${mode}`);
    }

    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      colorScheme: scheme,
      locale: "pt-BR",
    });
    await context.addCookies([{ name: "app-theme", value: scheme, url: BASE_URL }]);
    // Pula o guia de boas-vindas, que cobriria a tela no primeiro acesso.
    await context.addInitScript(() => {
      try {
        localStorage.setItem("onboarding_seen_v1", "1");
      } catch {
        /* sem storage: o guia aparece, o print continua válido */
      }
    });
    for (const page of PAGES) {
      const tab = await context.newPage();
      const loggedOut = PUBLIC_PAGES.has(page);
      await tab.route(`${API_ORIGIN}/**`, (route) => {
        const url = route.request().url();
        const refuseSession = loggedOut && url.includes("refresh-token");
        return route.fulfill({
          status: refuseSession ? 401 : 200,
          contentType: "application/json",
          headers: {
            "access-control-allow-origin": BASE_URL,
            "access-control-allow-credentials": "true",
            "access-control-allow-headers": "*",
          },
          body: JSON.stringify(
            refuseSession
              ? { error: "Sessão expirada", status: 401 }
              : { data: mockResponse(url), status: 200 },
          ),
        });
      });
      const pageErrors = [];
      tab.on("pageerror", (error) => pageErrors.push(error.message.slice(0, 200)));
      const result = { mode, page, file: fileNameFor(mode, page), errors: pageErrors, problems: [] };

      try {
        await tab.goto(`${BASE_URL}${page}`, { waitUntil: "networkidle", timeout: 60_000 });
        await tab.waitForTimeout(1_000);

        // Tela de erro do Nuxt ("Algo deu errado"): um erro de renderização
        // vira essa tela sem disparar "pageerror" no navegador.
        const nuxtError = await tab.evaluate(() => {
          const app = document.querySelector("#__nuxt")?.__vue_app__;
          const error = app?.config.globalProperties.$nuxt?.payload?.error;
          return error ? String(error.message || error.statusMessage || error) : "";
        });
        if (nuxtError) {
          result.problems.push(`tela de erro: ${nuxtError.slice(0, 160)}`);
        }

        const finalPath = new URL(tab.url()).pathname;
        if (finalPath !== page.split("?")[0]) {
          result.problems.push(`redirecionou para ${finalPath}`);
        }

        if (device === "mobile") {
          const overflow = await tab.evaluate(() => {
            const scroller = document.scrollingElement || document.documentElement;
            return scroller.scrollWidth - window.innerWidth;
          });
          if (overflow > 1) {
            result.problems.push(`rolagem horizontal de ${overflow}px no celular`);
          }
        }

        await tab.screenshot({ path: resolve(OUT_DIR, result.file), fullPage: true });
      } catch (error) {
        result.problems.push(`não carregou: ${String(error.message || error).slice(0, 160)}`);
      }

      results.push(result);
      await tab.close();
    }

    await context.close();
  }

  await browser.close();

  const failing = results.filter((result) => result.problems.length > 0);
  const lines = [
    "# Prints das telas",
    "",
    `${results.length} prints em ${MODES.length} modos. ` +
      (failing.length ? `**${failing.length} com problema.**` : "Nenhum problema de layout encontrado."),
    "",
    "| Tela | Modo | Situação |",
    "| --- | --- | --- |",
    ...results.map((result) => {
      const status = result.problems.length
        ? `⚠️ ${result.problems.join("; ")}`
        : result.errors.length
          ? `ok (erro de JS com dados de exemplo: ${result.errors[0]})`
          : "ok";
      return `| \`${result.page}\` | ${result.mode} | ${status.replace(/\|/g, "\\|")} |`;
    }),
    "",
  ];
  writeFileSync(resolve(OUT_DIR, "report.md"), lines.join("\n"));
  console.log(lines.join("\n"));

  if (failing.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
