/**
 * Sobe os screenshots reais de cada tela (capturados em
 * api/uploads/help-content/<pasta>/*.png) via POST /api/help-videos/upload-image
 * e atualiza os 14 PageHelpVideo (formato STEPS) com os imageUrl/imageKey
 * reais retornados, substituindo os passos-so-texto do seed-help-content.ts.
 *
 * Pre-requisitos: API rodando (KEYCLOAK_REALM configurado), usuario ADMIN da
 * plataforma existente (rode create-platform-admin.ts se nao existir), e os
 * PNGs ja capturados nas pastas abaixo.
 *
 * Uso: cd api && npx tsx --env-file=.env scripts/upload-help-images.ts
 * Idempotente: reenviar as imagens e re-upsertar por pageKey nao duplica nada.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const API_BASE = process.env.URL_BACKEND || `http://localhost:${process.env.API_PORT || 8010}`;
const KEYCLOAK_BASE = process.env.KEYCLOAK_BASE_URL_HOST || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "appchurch";
const KEYCLOAK_CLIENT_ID = process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID || "appchurch-web";
const ADMIN_EMAIL = process.env.HELP_SEED_ADMIN_EMAIL || "admin@appquadrangular.com";
const ADMIN_PASSWORD = process.env.HELP_SEED_ADMIN_PASSWORD || "admin1234";

const UPLOADS_DIR = path.resolve(import.meta.dirname, "../uploads/help-content");

type StepSeed = { file: string; caption: string };

type PageSeed = {
  pageKey: string;
  folder: string;
  label: string;
  description: string;
  steps: StepSeed[];
};

const PAGES: PageSeed[] = [
  {
    pageKey: "/",
    folder: "home",
    label: "Como usar a tela Início",
    description: "Resumo diário da sua igreja: próxima escala, versículo, avisos e atalhos rápidos.",
    steps: [
      { file: "01-overview.png", caption: "Ao entrar, você vê um resumo do dia: sua próxima escala, o versículo e os atalhos mais usados — tudo em um só lugar." },
      { file: "02-theme-toggle.png", caption: "No topo da tela, toque no ícone de sol/lua pra trocar entre tema claro e escuro na hora. Funciona em qualquer tela do app." },
      { file: "03-notifications.png", caption: "Toque no sino pra ver os avisos recentes e, se ainda não tiver ativado, toque em \"Ativar notificações\" — assim você recebe escalas e avisos novos mesmo com o app fechado." },
    ],
  },
  {
    pageKey: "/content",
    folder: "content",
    label: "Como navegar em Conteúdo",
    description: "Central com Versículo do Dia, Leitura Bíblica, Devocionais e sua Playlist pessoal.",
    steps: [
      { file: "01-overview.png", caption: "Toque em \"Conteúdo\" na barra de baixo pra abrir a central de conteúdos da igreja." },
      { file: "01-overview.png", caption: "Toque em qualquer card — Versículo do Dia, Leitura Bíblica, Devocionais ou Minha Playlist — pra entrar direto naquela tela." },
    ],
  },
  {
    pageKey: "/content/bible",
    folder: "bible",
    label: "Como ler a Bíblia no app",
    description: "Escolha versão, livro e capítulo pra ler direto no app.",
    steps: [
      { file: "01-overview.png", caption: "Escolha a Versão no primeiro seletor — NVI, ARC, NVT e outras traduções estão disponíveis." },
      { file: "01-overview.png", caption: "Escolha o Livro e o Capítulo nos seletores seguintes; o texto aparece na hora, sem precisar apertar em mais nada." },
    ],
  },
  {
    pageKey: "/content/verse",
    folder: "verse",
    label: "Como acompanhar o Versículo do Dia",
    description: "Veja o versículo publicado pela liderança e o histórico dos últimos publicados.",
    steps: [
      { file: "01-overview.png", caption: "O versículo mais recente fica em destaque no topo, com a referência bíblica e a data da publicação." },
      { file: "01-overview.png", caption: "Role a tela pra baixo pra ver o Histórico com os versículos publicados em dias anteriores." },
    ],
  },
  {
    pageKey: "/content/playlist",
    folder: "playlist",
    label: "Como usar a Minha Playlist",
    description: "Suas músicas favoritas dos ministérios, cada uma no seu tom pessoal.",
    steps: [
      { file: "01-overview.png", caption: "Use a busca no topo pra encontrar rapidinho uma música pelo nome." },
      { file: "01-overview.png", caption: "Se a lista estiver vazia, toque em \"Ver músicas\" pra abrir o repertório de um ministério e salvar seu tom pessoal em cada uma." },
    ],
  },
  {
    pageKey: "/content/devotionals",
    folder: "devotionals",
    label: "Como acompanhar os Devocionais",
    description: "Séries de estudo e reflexão em capítulos, com seu progresso salvo.",
    steps: [
      { file: "01-overview.png", caption: "Toque em um devocional da lista pra abrir os capítulos daquela série de estudo." },
      { file: "01-overview.png", caption: "A barrinha colorida no card mostra quanto você já avançou na leitura daquele devocional." },
    ],
  },
  {
    pageKey: "/scale",
    folder: "scale",
    label: "Como usar a tela de Escalas",
    description: "Veja seus próximos compromissos e, se for líder, monte a escala do ministério.",
    steps: [
      { file: "01-overview.png", caption: "A tela de Escalas mostra seus próximos compromissos agrupados por ministério; use os filtros no topo pra ver só uma categoria." },
      { file: "01-overview.png", caption: "Se você é líder ou pastor, o resumo mostra quantas escalas estão pendentes, quantas ninguém viu ainda e quantos pedidos de troca existem." },
      { file: "02-detail.png", caption: "Toque em uma escala pra ver os detalhes: quantos confirmaram presença, as músicas do repertório e a equipe escalada em cada função." },
    ],
  },
  {
    pageKey: "/ministery",
    folder: "ministery",
    label: "Como navegar em Ministérios",
    description: "Equipes da igreja, com repertório, membros e escalas de cada uma.",
    steps: [
      { file: "01-overview.png", caption: "A tela de Ministérios lista todas as equipes da igreja, com um resumo de quantas existem e quantas estão ativas." },
      { file: "01-overview.png", caption: "Toque em um ministério pra ver o repertório de músicas, os membros e as escalas daquela equipe." },
    ],
  },
  {
    pageKey: "/cultos",
    folder: "cultos",
    label: "Como ver os Próximos cultos",
    description: "Lista dos próximos cultos e eventos com data, ministério responsável e detalhes.",
    steps: [
      { file: "01-overview.png", caption: "Cada card mostra a data, o ministério responsável e o horário do culto." },
      { file: "01-overview.png", caption: "Toque em um card pra abrir a escala completa daquele culto, com músicas e equipe escalada." },
    ],
  },
  {
    pageKey: "/prayer",
    folder: "prayer",
    label: "Como enviar e acompanhar Pedidos de Oração",
    description: "Compartilhe pedidos com a comunidade e acompanhe os que já foram respondidos.",
    steps: [
      { file: "01-overview.png", caption: "Toque em \"Novo pedido\" pra compartilhar um pedido de oração com a comunidade da igreja." },
      { file: "01-overview.png", caption: "Pedidos já respondidos ganham o selo \"Respondido\", como nos exemplos da lista." },
      { file: "02-pending.png", caption: "Se você é pastor ou admin, a aba \"Pendentes\" mostra os pedidos aguardando aprovação antes de aparecerem pra todo mundo." },
    ],
  },
  {
    pageKey: "/user",
    folder: "user",
    label: "Como editar seu Perfil",
    description: "Seus dados, igreja e ministério vinculados, e troca de senha.",
    steps: [
      { file: "01-overview.png", caption: "No topo do seu perfil você vê seu nome, e-mail, cargo e a igreja/ministério aos quais está vinculado." },
      { file: "01-overview.png", caption: "Toque no ícone de ajuda (\"?\") no topo sempre que precisar de orientação sobre essa tela." },
    ],
  },
  {
    pageKey: "/settings",
    folder: "settings",
    label: "Como editar os dados da Igreja",
    description: "Nome, endereço, foto e documento da igreja — usados na página pública.",
    steps: [
      { file: "01-overview.png", caption: "Em Configurações você edita nome, cidade, endereço e a foto da igreja — esses dados aparecem na página pública." },
      { file: "01-overview.png", caption: "Só pastores ou admins conseguem editar; os demais membros veem os campos bloqueados." },
    ],
  },
  {
    pageKey: "/notifications",
    folder: "notifications",
    label: "Como usar o histórico de Notificações",
    description: "Todo aviso, escala e novidade que a igreja te enviou, em um só lugar.",
    steps: [
      { file: "01-overview.png", caption: "Aqui fica o histórico completo de avisos, escalas e novidades que a igreja já te enviou." },
      { file: "01-overview.png", caption: "Toque em uma notificação pra marcá-la como lida e ser levado direto pra tela relacionada com ela." },
    ],
  },
  {
    pageKey: "/admin",
    folder: "admin",
    label: "Como usar o Painel de Administração",
    description: "Gerencie plano, dados da igreja, membros, ministérios, conteúdo, relatórios e cargos.",
    steps: [
      { file: "01-overview.png", caption: "A aba Geral mostra um resumo rápido da igreja: quantos membros, ministérios, escalas e músicas já foram cadastrados." },
      { file: "01-overview.png", caption: "Use as abas Membros, Ministérios, Conteúdo, Relatórios e Cargos pra gerenciar cada área da igreja a partir daqui." },
    ],
  },
];

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      grant_type: "password",
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao autenticar admin no Keycloak: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

async function uploadImage(token: string, pageKey: string, filePath: string) {
  const buffer = readFileSync(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: "image/png" }), path.basename(filePath));

  const res = await fetch(
    `${API_BASE}/api/help-videos/upload-image?pageKey=${encodeURIComponent(pageKey)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
  );
  const body = (await res.json()) as { data?: { url: string; key: string }; error?: string };
  if (!res.ok || body.error || !body.data) {
    throw new Error(`Falha ao subir imagem ${filePath}: ${body.error || res.status}`);
  }
  return body.data;
}

async function saveHelpEntry(
  token: string,
  entry: { pageKey: string; label: string; description: string; steps: { order: number; imageUrl: string; imageKey: string; caption: string }[] },
) {
  const res = await fetch(`${API_BASE}/api/help-videos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...entry, contentType: "STEPS" }),
  });
  const body = (await res.json()) as { error?: string };
  if (!res.ok || body.error) {
    throw new Error(`Falha ao salvar tutorial de ${entry.pageKey}: ${body.error || res.status}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE} | Keycloak: ${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}`);
  const token = await getAdminToken();
  console.log("Autenticado como admin da plataforma.");

  for (const page of PAGES) {
    console.log(`\n${page.pageKey} — ${page.label}`);
    const steps = [];
    let order = 0;
    for (const step of page.steps) {
      const filePath = path.join(UPLOADS_DIR, page.folder, step.file);
      const uploaded = await uploadImage(token, page.pageKey, filePath);
      console.log(`  ✔ imagem enviada: ${step.file} -> ${uploaded.key}`);
      steps.push({ order: order++, imageUrl: uploaded.url, imageKey: uploaded.key, caption: step.caption });
    }

    await saveHelpEntry(token, {
      pageKey: page.pageKey,
      label: page.label,
      description: page.description,
      steps,
    });
    console.log(`  ✔ tutorial salvo (${steps.length} passos, imagens reais)`);
  }

  console.log("\nPronto — os 14 tutoriais agora têm screenshots reais.");
}

main().catch((error) => {
  console.error("\nFalha ao subir imagens dos tutoriais:", error);
  process.exitCode = 1;
});
