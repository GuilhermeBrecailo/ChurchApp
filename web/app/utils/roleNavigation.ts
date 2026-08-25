import type { AppPermission } from "../../composables/usePermissions";

export type RoleNavigationIcon =
  | "book"
  | "calendar"
  | "church"
  | "clipboard"
  | "cog"
  | "heart"
  | "home"
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
    label: "Equipe",
    title: "Minha equipe",
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
    label: "Agenda",
    title: "Agenda",
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
};

function hasPermission(user: RoleNavigationUser | null | undefined, permission: AppPermission) {
  if (!user) return false;
  if (isPrivilegedChurchUser(user)) return true;
  if (user.permissions?.includes(permission)) return true;

  return (user.roles ?? []).some((role) => role.permissions.includes(permission));
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

function isLeaderUser(user: RoleNavigationUser | null | undefined) {
  if (!user) return false;
  if (isPrivilegedChurchUser(user)) return false;
  return (
    user.canManageMembers === true ||
    (user.roles ?? []).some((role) => role.permissions.length > 0) ||
    (user.permissions ?? []).length > 0
  );
}

function item(key: keyof typeof navCatalog) {
  return navCatalog[key];
}

export function getBottomNavigationItems(user: RoleNavigationUser | null | undefined) {
  if (user?.is_admin === true && user.hasChurch !== true) {
    return [item("home"), item("platformAdmin"), item("profile")];
  }

  if (user?.hasChurch !== true) {
    return [item("home"), item("profile")];
  }

  if (isPrivilegedChurchUser(user)) {
    return [item("home"), item("pastoral"), item("people"), item("cults"), item("reports")];
  }

  if (isLeaderUser(user)) {
    return [
      item("home"),
      item("team"),
      hasPermission(user, "PASTORAL_CARE_MANAGE") ? item("visits") : item("scale"),
      item("cults"),
      item("profile"),
    ];
  }

  return [item("home"), item("cults"), item("scale"), item("ministries"), item("profile")];
}

export function getQuickAccessItems(user: RoleNavigationUser | null | undefined) {
  if (user?.hasChurch !== true) {
    return [item("profile")];
  }

  if (isPrivilegedChurchUser(user)) {
    return [
      { ...item("pastoral"), label: "Painel" },
      item("visits"),
      item("people"),
      item("reports"),
      item("cults"),
      item("settings"),
    ];
  }

  if (isLeaderUser(user)) {
    return [
      item("team"),
      ...(hasPermission(user, "PASTORAL_CARE_MANAGE") ? [item("visits")] : []),
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

  if (isPrivilegedChurchUser(user)) {
    return [
      { ...item("pastoral"), label: "Painel" },
      item("people"),
      item("cults"),
      item("reports"),
      item("ministries"),
      item("content"),
      item("settings"),
    ];
  }

  if (isLeaderUser(user)) {
    return [
      item("team"),
      ...(hasPermission(user, "PASTORAL_CARE_MANAGE") ? [item("visits")] : []),
      item("scale"),
      item("cults"),
      item("content"),
      item("prayer"),
    ];
  }

  return [item("cults"), item("scale"), item("ministries"), item("content"), item("prayer")];
}

export function isNavigationItemActive(item: RoleNavigationItem, path: string) {
  if (item.route === "/") return path === "/";

  return item.matchPrefixes.some((prefix) => path.startsWith(prefix));
}
