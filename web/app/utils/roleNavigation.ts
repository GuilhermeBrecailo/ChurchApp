/**
 * Navegação do app (barra inferior no celular, lateral no desktop).
 *
 * Regras (docs/redesign/proposta.md §2):
 * - no máximo 5 abas, sem "Mais"; as abas não mudam de lugar entre papéis,
 *   só a 4ª muda (Ministérios para o líder, Gestão para quem administra);
 * - cada destino tem uma única porta de entrada: o que não é aba fica dentro
 *   de uma aba (Igreja ou Gestão), nunca repetido em atalhos;
 * - sem igreja, não há barra (só o admin da plataforma tem Plataforma).
 *
 * Quem pode o quê vem de `resolveChurchAccess` (utils/churchAccess.ts).
 */
import {
  isChurchManager,
  ministryIdsWithPermissions,
  resolveChurchAccess,
  type AccessUser,
} from "./churchAccess";
import { groupManagementItems, type ManagementGroup } from "./navigationGroups";

export type RoleNavigationIcon =
  | "home"
  | "scale"
  | "church"
  | "ministries"
  | "management"
  | "platform"
  | "profile"
  | "people"
  | "care"
  | "prayer"
  | "cults"
  | "communicate"
  | "settings"
  | "reports";

export type PrimaryTabKey =
  | "home"
  | "scale"
  | "church"
  | "ministries"
  | "management"
  | "platform"
  | "profile";

export type RoleNavigationItem = {
  key: string;
  label: string;
  /** Texto mais longo, para leitores de tela e para o desktop. */
  title: string;
  description: string;
  route: string;
  icon: RoleNavigationIcon;
};

export type PrimaryTab = RoleNavigationItem & { key: PrimaryTabKey };

export type ManagementGroupKey = "people" | "ministries" | "communication" | "church" | "platform";

export type ManagementItem = RoleNavigationItem & { group: ManagementGroupKey };

export type NavPreviewRole = "MEMBRO" | "LIDER" | "PASTOR";

export type RoleNavigationUser = AccessUser & {
  // Só para pré-visualizar: o pastor/admin vê a navegação como outro papel
  // veria. A API continua checando o papel real.
  navPreviewRole?: NavPreviewRole | null;
};

export type NavTier = "none" | "member" | "leader" | "manager";

const TABS: Record<PrimaryTabKey, PrimaryTab> = {
  home: {
    key: "home",
    label: "Início",
    title: "Início",
    description: "O que fazer hoje, escalas da semana e avisos.",
    route: "/",
    icon: "home",
  },
  scale: {
    key: "scale",
    label: "Escalas",
    title: "Escalas",
    description: "Suas escalas, as da igreja e os cultos.",
    route: "/scale",
    icon: "scale",
  },
  church: {
    key: "church",
    label: "Igreja",
    title: "Igreja",
    description: "Avisos, conteúdo, oração, ministérios e contatos.",
    route: "/igreja",
    icon: "church",
  },
  ministries: {
    key: "ministries",
    label: "Ministérios",
    title: "Meus ministérios",
    description: "Os ministérios que você lidera.",
    route: "/ministery",
    icon: "ministries",
  },
  management: {
    key: "management",
    label: "Gestão",
    title: "Gestão da igreja",
    description: "Pessoas, cuidado, ministérios, comunicação e configurações.",
    route: "/admin",
    icon: "management",
  },
  platform: {
    key: "platform",
    label: "Plataforma",
    title: "Administração da plataforma",
    description: "Igrejas, planos e usuários do ChurchApp.",
    route: "/platform-admin",
    icon: "platform",
  },
  profile: {
    key: "profile",
    label: "Perfil",
    title: "Meu perfil",
    description: "Seus dados, ministérios, datas e preferências.",
    route: "/user",
    icon: "profile",
  },
};

const MANAGEMENT_ITEMS: Record<string, ManagementItem> = {
  people: {
    key: "people",
    group: "people",
    label: "Pessoas",
    title: "Pessoas",
    description: "Membros, visitantes e pedidos para entrar.",
    route: "/pessoas",
    icon: "people",
  },
  care: {
    key: "care",
    group: "people",
    label: "Cuidado",
    title: "Cuidado pastoral",
    description: "Visitas, retornos de visitantes e quem precisa de atenção.",
    route: "/pessoas/cuidado",
    icon: "care",
  },
  prayerReview: {
    key: "prayerReview",
    group: "people",
    label: "Pedidos de oração",
    title: "Revisar pedidos de oração",
    description: "Aprove os pedidos antes de aparecerem para a igreja.",
    route: "/prayer?aba=pendentes",
    icon: "prayer",
  },
  ministries: {
    key: "ministries",
    group: "ministries",
    label: "Ministérios",
    title: "Ministérios",
    description: "Equipes, líderes, escalas e repertório.",
    route: "/ministery",
    icon: "ministries",
  },
  cults: {
    key: "cults",
    group: "ministries",
    label: "Cultos",
    title: "Cultos",
    description: "Agenda de cultos, presença e público.",
    route: "/cultos",
    icon: "cults",
  },
  communicate: {
    key: "communicate",
    group: "communication",
    label: "Comunicar",
    title: "Comunicar",
    description: "Avisos no app, WhatsApp, versículo e devocionais.",
    route: "/comunicar",
    icon: "communicate",
  },
  churchSettings: {
    key: "churchSettings",
    group: "church",
    label: "Configurações da igreja",
    title: "Configurações da igreja",
    description: "Cadastro, página pública, horários, convite e plano.",
    route: "/configuracoes",
    icon: "settings",
  },
  reports: {
    key: "reports",
    group: "church",
    label: "Relatórios",
    title: "Relatórios",
    description: "Confirmações, presença e visão da liderança.",
    route: "/admin/relatorios",
    icon: "reports",
  },
  platform: {
    key: "platform",
    group: "platform",
    label: "Plataforma",
    title: "Administração da plataforma",
    description: "Igrejas, planos e usuários do ChurchApp.",
    route: "/platform-admin",
    icon: "platform",
  },
};

/** Lidera algum ministério (cargo de ministério com permissão). */
function leadsAnyMinistry(user: RoleNavigationUser | null | undefined) {
  return resolveChurchAccess(user).leadsMinistry || ministryIdsWithPermissions(user).length > 0;
}

/**
 * Nível de navegação. Só um pastor/admin de verdade pode se colocar num nível
 * menor para pré-visualizar o app (nunca muda permissão real).
 */
export function resolveNavTier(user: RoleNavigationUser | null | undefined): NavTier {
  if (user?.hasChurch !== true) return "none";

  if (isChurchManager(user) && user.navPreviewRole) {
    if (user.navPreviewRole === "MEMBRO") return "member";
    if (user.navPreviewRole === "LIDER") return "leader";
    return "manager";
  }

  if (resolveChurchAccess(user).hasManagementArea) return "manager";
  if (leadsAnyMinistry(user)) return "leader";
  return "member";
}

/** Rótulo do aviso "Vendo como …" quando a pré-visualização está ligada. */
export function getNavPreviewLabel(user: RoleNavigationUser | null | undefined) {
  if (!isChurchManager(user) || !user?.navPreviewRole || user.hasChurch !== true) return null;
  if (user.navPreviewRole === "MEMBRO") return "Membro";
  if (user.navPreviewRole === "LIDER") return "Líder";
  return null;
}

export function getPrimaryTabs(user: RoleNavigationUser | null | undefined): PrimaryTab[] {
  const tier = resolveNavTier(user);

  if (tier === "none") {
    return user?.is_admin === true ? [TABS.home, TABS.platform, TABS.profile] : [];
  }

  const fourth: PrimaryTab[] =
    tier === "manager" ? [TABS.management] : tier === "leader" ? [TABS.ministries] : [];

  return [TABS.home, TABS.scale, TABS.church, ...fourth, TABS.profile];
}

/**
 * Itens da aba Gestão, agrupados. Cada item só aparece se a pessoa pode
 * usá-lo de verdade (acesso real, não o da pré-visualização).
 */
export function getManagementItems(user: RoleNavigationUser | null | undefined): ManagementGroup[] {
  if (user?.hasChurch !== true) return [];
  const access = resolveChurchAccess(user);

  const allowed: ManagementItem[] = [
    access.canSeeRoster && MANAGEMENT_ITEMS.people,
    access.canCare && MANAGEMENT_ITEMS.care,
    access.canModeratePrayer && MANAGEMENT_ITEMS.prayerReview,
    (access.isChurchManager || access.canCreateMinistry || access.leadsMinistry) &&
      MANAGEMENT_ITEMS.ministries,
    (access.canManageCults || access.canManageAttendance) && MANAGEMENT_ITEMS.cults,
    (access.canPublish || access.canSendWhatsApp) && MANAGEMENT_ITEMS.communicate,
    access.canEditChurchSettings && MANAGEMENT_ITEMS.churchSettings,
    access.canSeeReports && MANAGEMENT_ITEMS.reports,
    user.is_admin === true && MANAGEMENT_ITEMS.platform,
  ].filter((entry): entry is ManagementItem => Boolean(entry));

  return groupManagementItems(allowed);
}

/**
 * Dono de cada rota: qual aba fica acesa. A ordem dos donos é a preferência
 * quando a pessoa tem mais de uma das abas candidatas (ex.: /ministery é da
 * aba Ministérios para o líder, da Gestão para quem administra e da Igreja
 * para o membro).
 */
const ROUTE_OWNERS: Array<{ prefix: string; owners: PrimaryTabKey[] }> = [
  { prefix: "/", owners: ["home"] },
  { prefix: "/notifications", owners: ["home"] },
  { prefix: "/scale", owners: ["scale"] },
  { prefix: "/cultos", owners: ["scale"] },
  { prefix: "/igreja", owners: ["church"] },
  { prefix: "/content", owners: ["church"] },
  { prefix: "/prayer", owners: ["church"] },
  { prefix: "/ministery", owners: ["ministries", "management", "church"] },
  { prefix: "/admin", owners: ["management"] },
  { prefix: "/pessoas", owners: ["management"] },
  { prefix: "/pastoral", owners: ["management"] },
  { prefix: "/comunicar", owners: ["management"] },
  { prefix: "/configuracoes", owners: ["management"] },
  { prefix: "/settings", owners: ["management"] },
  { prefix: "/plans", owners: ["management"] },
  { prefix: "/platform-admin", owners: ["platform", "management"] },
  { prefix: "/user", owners: ["profile"] },
  { prefix: "/perfil", owners: ["profile"] },
];

const matchesPrefix = (path: string, prefix: string) =>
  prefix === "/" ? path === "/" : path === prefix || path.startsWith(`${prefix}/`);

export function getOwnerTab(
  user: RoleNavigationUser | null | undefined,
  fullPath: string,
): PrimaryTabKey | null {
  const path = (fullPath.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  const tabs = new Set(getPrimaryTabs(user).map((tab) => tab.key));

  const rule = ROUTE_OWNERS.filter((entry) => matchesPrefix(path, entry.prefix)).sort(
    (first, second) => second.prefix.length - first.prefix.length,
  )[0];

  return rule?.owners.find((owner) => tabs.has(owner)) ?? null;
}
