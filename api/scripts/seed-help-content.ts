/**
 * Popula/atualiza os tutoriais de ajuda (formato imagem+texto) de cada tela
 * do app, a partir do conteudo real de cada pagina em web/app/pages. Os
 * passos ficam sem imagem (placeholder no front) ate alguem subir o print
 * de cada tela pelo admin (Administração > Vídeos de Ajuda) - so o texto
 * ja fica pronto e correto.
 *
 * Uso: cd api && npx tsx --env-file=.env scripts/seed-help-content.ts
 * Idempotente: roda upsert por pageKey, pode rodar de novo sem duplicar.
 */
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../config/database.ts";

type HelpContentSeed = {
  pageKey: string;
  label: string;
  description: string;
  steps: string[];
};

const HELP_CONTENT: HelpContentSeed[] = [
  {
    pageKey: "/",
    label: "Como usar a tela Início",
    description:
      "Resumo diário da sua igreja: próxima escala, versículo, avisos e atalhos rápidos.",
    steps: [
      "Ao abrir o app, a tela Início mostra sua próxima escala, o versículo do dia e os avisos mais recentes da igreja.",
      "Toque no ícone de Sol/Lua no topo da tela (barra superior) pra trocar entre tema claro e escuro a qualquer momento — funciona em qualquer tela do app.",
      "Toque no sino de notificações no topo da tela pra ver o histórico recente e tocar em \"Ativar notificações\" — assim você recebe avisos de escala e da igreja mesmo com o app fechado.",
      "Use os atalhos de Acesso Rápido pra ir direto pra Escalas, Ministérios, Oração e Conteúdo sem passar pela navegação inferior.",
    ],
  },
  {
    pageKey: "/content",
    label: "Como navegar em Conteúdo",
    description: "Central com Versículo do Dia, Leitura Bíblica, Devocionais e sua Playlist pessoal.",
    steps: [
      "Na navegação inferior, toque em \"Conteúdo\" pra abrir a central de conteúdos da igreja.",
      "Toque em qualquer card — Versículo do Dia, Leitura Bíblica, Devocionais ou Minha Playlist — pra entrar na respectiva tela.",
    ],
  },
  {
    pageKey: "/content/bible",
    label: "Como ler a Bíblia no app",
    description: "Escolha versão, livro e capítulo pra ler direto no app.",
    steps: [
      "Selecione a Versão (NVI, ARC, NVT, entre outras) no primeiro seletor no topo da tela.",
      "Escolha o Livro e o Capítulo nos seletores seguintes — o texto carrega automaticamente ao trocar qualquer um deles.",
      "Se a versão escolhida estiver indisponível no momento, o app mostra a tradução Almeida como alternativa, com um aviso na tela.",
    ],
  },
  {
    pageKey: "/content/verse",
    label: "Como acompanhar o Versículo do Dia",
    description: "Veja o versículo publicado pela liderança e o histórico dos últimos publicados.",
    steps: [
      "O versículo mais recente aparece em destaque no topo, com referência, texto e comentário do pastor (quando houver).",
      "Role a tela pra baixo pra ver o Histórico com os versículos publicados anteriormente.",
      "Se você for pastor ou admin com permissão de comunicação, toque em \"Novo versículo\" pra publicar um novo.",
    ],
  },
  {
    pageKey: "/content/playlist",
    label: "Como usar a Minha Playlist",
    description: "Suas músicas favoritas dos ministérios, cada uma no seu tom pessoal.",
    steps: [
      "Use a busca no topo da tela pra encontrar uma música pelo nome.",
      "Em cada música, escolha o seu tom pessoal no seletor de nota — ele fica salvo pra próxima vez que você abrir a cifra.",
      "Se a lista estiver vazia, toque em \"Ver músicas\" pra abrir o repertório de um ministério e salvar seu tom em cada música de lá.",
    ],
  },
  {
    pageKey: "/content/devotionals",
    label: "Como acompanhar os Devocionais",
    description: "Séries de estudo e reflexão em capítulos, com seu progresso salvo.",
    steps: [
      "Toque em um devocional da lista pra abrir os capítulos dessa série.",
      "A barra de progresso no card mostra o quanto você já avançou na leitura daquela série.",
      "Se você for pastor ou admin com permissão de comunicação, toque em \"Novo devocional\" pra criar uma nova série.",
    ],
  },
  {
    pageKey: "/scale",
    label: "Como usar a tela de Escalas",
    description: "Veja seus próximos compromissos e, se for líder, monte a escala do ministério.",
    steps: [
      "Use os filtros (chips) no topo da tela pra alternar entre as categorias de escala.",
      "Toque em uma escala pra ver os detalhes: data, ensaio, lista de músicas e quem está escalado em cada função.",
      "Dentro da escala você pode confirmar presença, recusar informando o motivo, ou pedir troca com outro membro.",
      "Se você é líder de ministério ou pastor, o resumo no topo mostra Pendentes, Não viram e Trocas — toque em \"Novo\" pra criar uma escala nova (data, ensaio, músicas e tipo de evento).",
    ],
  },
  {
    pageKey: "/ministery",
    label: "Como navegar em Ministérios",
    description: "Equipes da igreja, com repertório, membros e escalas de cada uma.",
    steps: [
      "A aba \"Visão geral\" mostra quantos ministérios existem, quantos estão ativos e quantos são de louvor.",
      "Toque em um ministério da lista pra ver seus detalhes: repertório de músicas, membros e escalas.",
      "Se você tem permissão, toque em \"Novo\" pra cadastrar um ministério.",
    ],
  },
  {
    pageKey: "/cultos",
    label: "Como ver os Próximos cultos",
    description: "Lista dos próximos cultos e eventos com data, ministério responsável e detalhes.",
    steps: [
      "Cada card mostra a data, o ministério responsável, o horário e — quando houver — o horário do ensaio.",
      "Os chips no card indicam quantas pessoas estão escaladas e quantas músicas fazem parte do repertório.",
      "Toque em um culto pra abrir a escala completa daquele evento.",
    ],
  },
  {
    pageKey: "/prayer",
    label: "Como enviar e acompanhar Pedidos de Oração",
    description: "Compartilhe pedidos com a comunidade e acompanhe os que já foram respondidos.",
    steps: [
      "Toque em \"Novo pedido\" pra escrever e enviar seu pedido de oração.",
      "Pedidos passam pela revisão de um pastor ou admin antes de aparecerem pra comunidade.",
      "Pedidos já respondidos aparecem marcados com o selo \"Respondido\".",
      "Se você é pastor ou admin, a aba \"Pendentes\" mostra os pedidos aguardando aprovação, com um contador de quantos faltam revisar.",
    ],
  },
  {
    pageKey: "/user",
    label: "Como editar seu Perfil",
    description: "Seus dados, igreja e ministério vinculados, e troca de senha.",
    steps: [
      "No topo da tela você vê seu nome, e-mail, cargo e a igreja/ministério aos quais está vinculado.",
      "Se o app pedir, defina uma nova senha na seção de segurança antes de continuar usando a conta.",
      "Toque no ícone de ajuda (\"?\") no topo da tela sempre que precisar de orientação sobre essa tela específica.",
    ],
  },
  {
    pageKey: "/settings",
    label: "Como editar os dados da Igreja",
    description: "Nome, endereço, foto e documento da igreja — usados na página pública.",
    steps: [
      "Veja seu plano atual no topo da tela; toque em \"Ver planos\" pra fazer upgrade.",
      "Envie a foto da igreja (PNG, JPG ou WEBP, até 5 MB) — ela aparece na página pública da igreja.",
      "Preencha nome, cidade, estado, endereço, CEP e documento da igreja e toque em \"Salvar alterações\".",
      "Só pastores ou admins conseguem editar esses dados — os demais membros veem os campos bloqueados.",
    ],
  },
  {
    pageKey: "/notifications",
    label: "Como usar o histórico de Notificações",
    description: "Todo aviso, escala e novidade que a igreja te enviou, em um só lugar.",
    steps: [
      "Toque em uma notificação pra marcá-la como lida e ser levado direto pra tela relacionada com ela.",
      "Toque em \"Marcar todas lidas\" pra limpar de uma vez o contador de não lidas.",
      "Pra ativar as notificações push e não perder nenhum aviso, toque no sino no topo do app e depois em \"Ativar notificações\".",
    ],
  },
  {
    pageKey: "/admin",
    label: "Como usar o Painel de Administração",
    description: "Gerencie plano, dados da igreja, membros, ministérios, conteúdo, relatórios e cargos.",
    steps: [
      "A aba \"Plano\" mostra o plano atual da igreja e permite fazer upgrade ou downgrade.",
      "Em \"Membros\", adicione, edite ou promova membros a Pastor/Admin.",
      "Em \"Ministérios\", gerencie os departamentos da igreja; em \"Conteúdo\", publique avisos, versículos e devocionais direto do painel.",
      "Em \"Relatórios\" (recurso do plano Pro) acompanhe as métricas da igreja, e em \"Cargos\" (também Pro) crie permissões personalizadas pra sua equipe.",
    ],
  },
];

async function seedHelpContent() {
  console.log(`Semeando ${HELP_CONTENT.length} tutoriais de ajuda (imagem+texto, sem print ainda)...`);

  for (const entry of HELP_CONTENT) {
    const steps = entry.steps.map((caption, index) => ({
      order: index,
      imageUrl: "",
      imageKey: "",
      caption,
    }));

    await $prismaClient.pageHelpVideo.upsert({
      where: { pageKey: entry.pageKey },
      update: {
        label: entry.label,
        description: entry.description,
        contentType: "STEPS",
        videoUrl: null,
        steps: steps as Prisma.InputJsonValue,
      },
      create: {
        pageKey: entry.pageKey,
        label: entry.label,
        description: entry.description,
        contentType: "STEPS",
        videoUrl: null,
        steps: steps as Prisma.InputJsonValue,
      },
    });

    console.log(`  ✔ ${entry.pageKey} — ${entry.label} (${steps.length} passos)`);
  }

  console.log("Pronto. Cada passo esta com imagem vazia (placeholder no app) - suba os prints reais em Administração > Vídeos de Ajuda.");
}

seedHelpContent()
  .catch((error) => {
    console.error("Falha ao semear tutoriais de ajuda:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await $prismaClient.$disconnect();
  });
