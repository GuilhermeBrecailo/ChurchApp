import type { AppPermission } from "../../composables/usePermissions";

export type RoleNavigationIcon =
  | "book"
  | "calendar"
  | "church"
  | "clipboard"
  | "cog"
  | "heart"
  | "home"
  | "messages"
  | "more"
  | "pastoral"
  | "reports"
  | "scale"
  | "team"
  | "user"
  | "users";

export type RoleNavigationItem = {
  key: string;
  label: string;
  title: string;
  description: string;
  route: string;
  icon: RoleNavigationIcon;
  matchPrefixes: string[];
  iconColor: string;
  bgColor: string;
  iconColorDark: string;
  bgColorDark: string;
};

export type NavPreviewRole = "MEMBRO" | "LIDER" | "PASTOR";

export type RoleNavigationUser = {
  hasChurch?: boolean;
  role?: string;
  is_admin?: boolean;
  isTitularPastor?: boolean;
  canManageMembers?: boolean;
  roles?: Array<{
    scope: string;
    departmentId: string | null;
    permissions: string[];
  }>;
  permissions?: string[];
  // Preview-only: deixa pastor/admin ver a navegacao como outro papel veria,
  // sem alterar permissoes reais - checagens de API continuam no papel real.
  navPreviewRole?: NavPreviewRole | null;
};

const homeItem: RoleNavigationItem = {
  key: "home",
  label: "Início",
  title: "Início",
  description: "Resumo da sua igreja, escalas e conteúdos recentes.",
  route: "/",
  icon: "home",
  matchPrefixes: ["/"],
  iconColor: "#B5472A",
  bgColor: "#F7E2D3",
  iconColorDark: "#f0975a",
  bgColorDark: "rgba(240,151,90,0.16)",
};

const navCatalog: Record<string, RoleNavigationItem> = {
  home: homeItem,
  pastoral: {
    key: "pastoral",
    label: "Pastoral",
    title: "Painel pastoral",
    description: "Alertas, visitas e pessoas que precisam de acompanhamento.",
    route: "/pastoral",
    icon: "pastoral",
    matchPrefixes: ["/pastoral"],
    iconColor: "#7C3AED",
    bgColor: "#F3E8FF",
    iconColorDark: "#c4b5fd",
    bgColorDark: "rgba(196,181,253,0.14)",
  },
  visits: {
    key: "visits",
    label: "Visitas",
    title: "Visitas",
    description: "Minhas visitas pastorais e retornos pendentes.",
    route: "/pastoral/visitas",
    icon: "pastoral",
    matchPrefixes: ["/pastoral/visitas"],
    iconColor: "#7C3AED",
    bgColor: "#F3E8FF",
    iconColorDark: "#c4b5fd",
    bgColorDark: "rgba(196,181,253,0.14)",
  },
  people: {
    key: "people",
    label: "Pessoas",
    title: "Pessoas",
    description: "Membros, visitantes, cargos e acompanhamento pastoral.",
    route: "/admin/pessoas",
    icon: "users",
    matchPrefixes: ["/admin/pessoas"],
    iconColor: "#0F766E",
    bgColor: "#CCFBF1",
    iconColorDark: "#2dd4bf",
    bgColorDark: "rgba(45,212,191,0.12)",
  },
  messages: {
    key: "messages",
    label: "Mensagens",
    title: "Mensagens",
    description: "Mensagens pós-culto, aniversariantes e avisos por WhatsApp.",
    route: "/admin/mensagens",
    icon: "messages",
    matchPrefixes: ["/admin/mensagens"],
    iconColor: "#0891B2",
    bgColor: "#CFFAFE",
    iconColorDark: "#22d3ee",
    bgColorDark: "rgba(34,211,238,0.14)",
  },
  rolesManagement: {
    key: "rolesManagement",
    label: "Cargos",
    title: "Cargos e permissões",
    description: "Crie cargos, defina permissões e delegue acessos com segurança.",
    route: "/admin/pessoas?secao=cargos",
    icon: "clipboard",
    matchPrefixes: ["/admin/pessoas"],
    iconColor: "#6D28D9",
    bgColor: "#EDE9FE",
    iconColorDark: "#c4b5fd",
    bgColorDark: "rgba(196,181,253,0.14)",
  },
  churchAdmin: {
    key: "churchAdmin",
    label: "Administração",
    title: "Administração da igreja",
    description: "Membros, ministérios, cargos e dados operacionais.",
    route: "/admin",
    icon: "cog",
    matchPrefixes: ["/admin"],
    iconColor: "#475569",
    bgColor: "#E2E8F0",
    iconColorDark: "#cbd5e1",
    bgColorDark: "rgba(203,213,225,0.12)",
  },
  cults: {
    key: "cults",
    label: "Cultos",
    title: "Cultos",
    description: "Agenda de cultos, presença e resumo de cada celebração.",
    route: "/cultos",
    icon: "calendar",
    matchPrefixes: ["/cultos"],
    iconColor: "#B5472A",
    bgColor: "#F7E2D3",
    iconColorDark: "#f0975a",
    bgColorDark: "rgba(240,151,90,0.16)",
  },
  reports: {
    key: "reports",
    label: "Relatórios",
    title: "Relatórios",
    description: "Confirmações, presença, visitas e visão da liderança.",
    route: "/admin/relatorios",
    icon: "reports",
    matchPrefixes: ["/admin/relatorios"],
    iconColor: "#B45309",
    bgColor: "#FEF3C7",
    iconColorDark: "#fbbf24",
    bgColorDark: "rgba(251,191,36,0.12)",
  },
  team: {
    key: "team",
    label: "Ministérios",
    title: "Meus ministérios",
    description: "Ministérios, escalas, tarefas e pessoas sob responsabilidade.",
    route: "/ministery",
    icon: "team",
    matchPrefixes: ["/ministery"],
    iconColor: "#7C3AED",
    bgColor: "#F3E8FF",
    iconColorDark: "#c4b5fd",
    bgColorDark: "rgba(196,181,253,0.14)",
  },
  scale: {
    key: "scale",
    label: "Escalas",
    title: "Escalas",
    description: "Suas próximas escalas e compromissos da igreja.",
    route: "/scale",
    icon: "scale",
    matchPrefixes: ["/scale"],
    iconColor: "#2563EB",
    bgColor: "#DBEAFE",
    iconColorDark: "#93c5fd",
    bgColorDark: "rgba(147,197,253,0.14)",
  },
  ministries: {
    key: "ministries",
    label: "Ministérios",
    title: "Ministérios",
    description: "Times, repertórios, escalas e atividades da igreja.",
    route: "/ministery",
    icon: "church",
    matchPrefixes: ["/ministery"],
    iconColor: "#7C3AED",
    bgColor: "#F3E8FF",
    iconColorDark: "#c4b5fd",
    bgColorDark: "rgba(196,181,253,0.14)",
  },
  content: {
    key: "content",
    label: "Conteúdo",
    title: "Conteúdo",
    description: "Devocionais, Bíblia, versículo do dia e publicações.",
    route: "/content",
    icon: "book",
    matchPrefixes: ["/content"],
    iconColor: "#2563EB",
    bgColor: "#DBEAFE",
    iconColorDark: "#93c5fd",
    bgColorDark: "rgba(147,197,253,0.14)",
  },
  prayer: {
    key: "prayer",
    label: "Oração",
    title: "Oração",
    description: "Pedidos de oração e cuidado espiritual da comunidade.",
    route: "/prayer",
    icon: "heart",
    matchPrefixes: ["/prayer"],
    iconColor: "#EF4444",
    bgColor: "#FEF2F2",
    iconColorDark: "#f87171",
    bgColorDark: "rgba(248,113,113,0.13)",
  },
  profile: {
    key: "profile",
    label: "Perfil",
    title: "Meu perfil",
    description: "Dados pessoais, indisponibilidades e preferências.",
    route: "/user",
    icon: "user",
    matchPrefixes: ["/user"],
    iconColor: "#14B8A6",
    bgColor: "#F0FDFA",
    iconColorDark: "#2dd4bf",
    bgColorDark: "rgba(45,212,191,0.12)",
  },
  settings: {
    key: "settings",
    label: "Config.",
    title: "Configurações",
    description: "Igreja, horários, WhatsApp, plano e preferências.",
    route: "/admin/configuracoes",
    icon: "cog",
    matchPrefixes: ["/settings", "/admin/configuracoes"],
    iconColor: "#475569",
    bgColor: "#E2E8F0",
    iconColorDark: "#cbd5e1",
    bgColorDark: "rgba(203,213,225,0.12)",
  },
  platformAdmin: {
    key: "platformAdmin",
    label: "Admin",
    title: "Admin",
    description: "Administração da plataforma.",
    route: "/platform-admin",
    icon: "cog",
    matchPrefixes: ["/platform-admin"],
    iconColor: "#475569",
    bgColor: "#E2E8F0",
    iconColorDark: "#cbd5e1",
    bgColorDark: "rgba(203,213,225,0.12)",
  },
  publications: {
    key: "publications",
    label: "Publicações",
    title: "Publicações",
    description: "Avisos, devocionais, posts e conteúdo da igreja.",
    route: "/admin/publicacoes",
    icon: "book",
    matchPrefixes: ["/admin/publicacoes"],
    iconColor: "#0F766E",
    bgColor: "#CCFBF1",
    iconColorDark: "#5eead4",
    bgColorDark: "rgba(94,234,212,0.12)",
  },
  more: {
    key: "more",
    label: "Mais",
    title: "Mais opções",
    description: "Veja todos os atalhos disponíveis para o seu perfil.",
    route: "",
    icon: "more",
    matchPrefixes: [],
    iconColor: "#64748B",
    bgColor: "#E2E8F0",
    iconColorDark: "#cbd5e1",
    bgColorDark: "rgba(203,213,225,0.12)",
  },
};

function hasPermission(user: RoleNavigationUser | null | undefined, permission: AppPermission) {
  if (!user) return false;
  if (isPrivilegedChurchUser(user)) return true;
  if (user.permissions?.includes(permission)) return true;

  return (user.roles ?? []).some((role) => role.permissions.includes(permission));
}

function hasAnyPermission(user: RoleNavigationUser | null | undefined, permissions: AppPermission[]) {
  return permissions.some((permission) => hasPermission(user, permission));
}

function isPrivilegedChurchUser(user: RoleNavigationUser | null | undefined) {
  if (!user) return false;
  return (
    user.is_admin === true ||
    user.isTitularPastor === true ||
    user.role === "PASTOR" ||
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN"
  );
}

function hasMinistryAccess(user: RoleNavigationUser | null | undefined) {
  if (!user) return false;
  if (isPrivilegedChurchUser(user)) return true;
  return (user.roles ?? []).some(
    (role) => role.scope === "MINISTRY" && role.permissions.length > 0,
  );
}

function hasMemberManagementAccess(user: RoleNavigationUser | null | undefined) {
  return (
    user?.canManageMembers === true ||
    hasAnyPermission(user, ["MEMBER_CREATE", "MEMBER_EDIT", "MEMBER_DELETE"])
  );
}

function hasContentPublishingAccess(user: RoleNavigationUser | null | undefined) {
  return hasAnyPermission(user, ["CONTENT_PUBLISH", "ANNOUNCEMENT_PUBLISH"]);
}

function isLeaderUser(user: RoleNavigationUser | null | undefined) {
  if (!user) return false;
  if (isPrivilegedChurchUser(user)) return false;
  return (
    user.canManageMembers === true ||
    (user.roles ?? []).some((role) => role.permissions.length > 0) ||
    (user.permissions ?? []).length > 0
  );
}

type NavTier = "privileged" | "leader" | "member";

// So um pastor/admin de verdade pode se colocar num tier menor pra
// pre-visualizar a navegacao - a API continua checando o papel real, isso
// nunca afeta permissao de verdade, so o que aparece no menu.
function resolveNavTier(user: RoleNavigationUser | null | undefined): NavTier {
  const isReallyPrivileged = isPrivilegedChurchUser(user);

  if (isReallyPrivileged && user?.navPreviewRole) {
    if (user.navPreviewRole === "MEMBRO") return "member";
    if (user.navPreviewRole === "LIDER") return "leader";
    return "privileged";
  }

  if (isReallyPrivileged) return "privileged";
  if (isLeaderUser(user)) return "leader";
  return "member";
}

function canSeePastoralCareInPreview(user: RoleNavigationUser | null | undefined, tier: NavTier) {
  if (tier !== "leader") return false;
  // Previewing as lider (sem ser lider de verdade): mostra a variante mais
  // completa (Visitas) em vez de tentar simular uma permissao especifica.
  if (isPrivilegedChurchUser(user) && user?.navPreviewRole === "LIDER") return true;
  return hasPermission(user, "PASTORAL_CARE_MANAGE");
}

function canSeeChurchAdminHub(user: RoleNavigationUser | null | undefined) {
  return user?.hasChurch === true && (isPrivilegedChurchUser(user) || hasMemberManagementAccess(user));
}

function item(key: keyof typeof navCatalog) {
  return navCatalog[key];
}

function compareNavigationTitle(a: RoleNavigationItem, b: RoleNavigationItem) {
  return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
}

export function getBottomNavigationItems(user: RoleNavigationUser | null | undefined) {
  if (user?.is_admin === true && user.hasChurch !== true) {
    return [item("home"), item("platformAdmin"), item("more")];
  }

  if (user?.hasChurch !== true) {
    return [item("home"), item("more")];
  }

  const tier = resolveNavTier(user);

  if (tier === "privileged") {
    return [item("home"), item("pastoral"), item("cults"), item("reports"), item("more")];
  }

  if (tier === "leader") {
    if (isPrivilegedChurchUser(user) && user?.navPreviewRole === "LIDER") {
      return [item("home"), item("team"), item("visits"), item("cults"), item("more")];
    }

    if (hasMemberManagementAccess(user)) {
      return [item("home"), item("people"), item("cults"), item("scale"), item("more")];
    }

    if (hasContentPublishingAccess(user) && !hasMinistryAccess(user) && !canSeePastoralCareInPreview(user, tier)) {
      return [item("home"), item("content"), item("cults"), item("scale"), item("more")];
    }

    return [
      item("home"),
      item("team"),
      canSeePastoralCareInPreview(user, tier) ? item("visits") : item("scale"),
      item("cults"),
      item("more"),
    ];
  }

  return [item("home"), item("cults"), item("scale"), item("ministries"), item("more")];
}

export function getQuickAccessItems(user: RoleNavigationUser | null | undefined) {
  if (user?.hasChurch !== true) {
    return [item("profile")];
  }

  const tier = resolveNavTier(user);

  if (tier === "privileged") {
    return [
      { ...item("pastoral"), label: "Painel" },
      item("visits"),
      item("people"),
      item("messages"),
      item("reports"),
      item("cults"),
      item("prayer"),
      item("settings"),
    ];
  }

  if (tier === "leader") {
    return [
      item("team"),
      ...(canSeePastoralCareInPreview(user, tier) ? [item("visits")] : []),
      item("scale"),
      item("cults"),
      item("prayer"),
      item("profile"),
    ];
  }

  return [item("cults"), item("scale"), item("ministries"), item("content"), item("prayer"), item("profile")];
}

export function getChurchHubItems(user: RoleNavigationUser | null | undefined) {
  if (user?.hasChurch !== true) {
    return [];
  }

  const tier = resolveNavTier(user);

  if (tier === "privileged") {
    return [
      { ...item("pastoral"), label: "Painel" },
      item("people"),
      item("messages"),
      item("cults"),
      item("reports"),
      item("ministries"),
      item("content"),
      item("settings"),
    ];
  }

  if (tier === "leader") {
    return [
      item("team"),
      ...(canSeePastoralCareInPreview(user, tier) ? [item("visits")] : []),
      item("scale"),
      item("cults"),
      item("content"),
      item("prayer"),
    ];
  }

  return [item("cults"), item("scale"), item("ministries"), item("content"), item("prayer")];
}

// Lista completa (deduplicada) de tudo que o usuario tem acesso, pro card
// "Mais" do acesso rapido - une bottom nav + quick access + hub em vez de
// manter uma quarta lista manual que fica desatualizada.
export function getAllNavigationItems(user: RoleNavigationUser | null | undefined) {
  const hasChurch = user?.hasChurch === true;
  const isPrivileged = isPrivilegedChurchUser(user);
  const merged = [
    homeItem,
    ...getBottomNavigationItems(user),
    ...getQuickAccessItems(user),
    ...getChurchHubItems(user),
    ...(canSeeChurchAdminHub(user) ? [item("churchAdmin"), item("settings")] : []),
    ...(hasChurch && isPrivileged ? [item("rolesManagement"), item("publications")] : []),
    ...(hasChurch && hasAnyPermission(user, ["PASTORAL_CARE_MANAGE"]) ? [item("pastoral"), item("visits")] : []),
    ...(hasChurch && hasContentPublishingAccess(user) ? [item("content")] : []),
    item("profile"),
    ...(user?.is_admin === true ? [item("platformAdmin")] : []),
  ];

  const seen = new Set<string>();
  return merged.filter((entry) => {
    if (entry.key === "more") return false;
    if (seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
}

export function getMoreNavigationItems(user: RoleNavigationUser | null | undefined) {
  const bottomKeys = new Set(
    getBottomNavigationItems(user)
      .filter((entry) => entry.key !== "more")
      .map((entry) => entry.key),
  );

  return getAllNavigationItems(user)
    .filter((entry) => !bottomKeys.has(entry.key))
    .sort(compareNavigationTitle);
}

export function isNavigationItemActive(item: RoleNavigationItem, path: string) {
  if (item.route === "/") return path === "/";
  if (item.key === "churchAdmin") return path === "/admin";

  return item.matchPrefixes.some((prefix) => path.startsWith(prefix));
}
