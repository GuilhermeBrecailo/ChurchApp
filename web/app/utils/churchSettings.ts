/**
 * Configurações da igreja: uma lista agrupada (estilo Ajustes do celular)
 * em que cada linha mostra a situação atual e abre /configuracoes/[secao].
 *
 * Antes eram três telas com nomes trocados ("Configurações" em /settings,
 * "Configurações" com abas Geral/Integrações em /admin/configuracoes e
 * "Planos" em /plans), duas delas com envio da foto da igreja.
 */
import type { ChurchAccess } from "./churchAccess";

export type SettingsSectionSlug =
  | "cadastro"
  | "pagina-publica"
  | "horarios"
  | "convite"
  | "whatsapp"
  | "holyrics"
  | "plano"
  | "avancado";

export type SettingsIcon =
  | "church"
  | "globe"
  | "clock"
  | "qr"
  | "whatsapp"
  | "monitor"
  | "crown"
  | "eye";

export type SettingsSection = {
  slug: SettingsSectionSlug;
  title: string;
  /** Subtítulo da tela da seção. */
  description: string;
  icon: SettingsIcon;
};

export type SettingsGroup = { title: string; sections: SettingsSection[] };

export const SETTINGS_SECTIONS: Record<SettingsSectionSlug, SettingsSection> = {
  cadastro: {
    slug: "cadastro",
    title: "Dados e logo",
    description: "Nome, endereço, documento e a foto da igreja",
    icon: "church",
  },
  "pagina-publica": {
    slug: "pagina-publica",
    title: "Página pública",
    description: "Cores, letra, contatos e o endereço que você compartilha",
    icon: "globe",
  },
  horarios: {
    slug: "horarios",
    title: "Cultos fixos da semana",
    description: "Aparecem na página pública e nas mensagens pós-culto",
    icon: "clock",
  },
  convite: {
    slug: "convite",
    title: "Convite para entrar",
    description: "Código, QR e link para novos membros pedirem para entrar",
    icon: "qr",
  },
  whatsapp: {
    slug: "whatsapp",
    title: "WhatsApp",
    description: "O número da igreja que envia os comunicados",
    icon: "whatsapp",
  },
  holyrics: {
    slug: "holyrics",
    title: "Holyrics",
    description: "Envie as músicas da escala para o telão",
    icon: "monitor",
  },
  plano: {
    slug: "plano",
    title: "Plano",
    description: "Sua assinatura e o que cada plano libera",
    icon: "crown",
  },
  avancado: {
    slug: "avancado",
    title: "Ver o app como membro ou líder",
    description: "Confira o que cada pessoa vê, sem perder seus acessos",
    icon: "eye",
  },
};

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "Sua igreja",
    sections: [SETTINGS_SECTIONS.cadastro, SETTINGS_SECTIONS["pagina-publica"], SETTINGS_SECTIONS.horarios],
  },
  { title: "Pessoas", sections: [SETTINGS_SECTIONS.convite] },
  { title: "Integrações", sections: [SETTINGS_SECTIONS.whatsapp, SETTINGS_SECTIONS.holyrics] },
  { title: "Assinatura", sections: [SETTINGS_SECTIONS.plano] },
  { title: "Avançado", sections: [SETTINGS_SECTIONS.avancado] },
];

export function isSettingsSectionSlug(value: unknown): value is SettingsSectionSlug {
  return typeof value === "string" && value in SETTINGS_SECTIONS;
}

type SettingsAccess = Pick<ChurchAccess, "canEditChurchSettings" | "canManagePeople">;

/**
 * Pastor/admin vê tudo. Quem só cuida de pessoas (cargo MEMBER_*) continua
 * podendo abrir o convite, como já acontecia na aba "Geral".
 */
export function canOpenSettingsSection(access: SettingsAccess, slug: SettingsSectionSlug) {
  if (access.canEditChurchSettings) return true;
  return slug === "convite" && access.canManagePeople;
}

export function visibleSettingsGroups(access: SettingsAccess): SettingsGroup[] {
  return SETTINGS_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.filter((section) => canOpenSettingsSection(access, section.slug)),
  })).filter((group) => group.sections.length > 0);
}

/** Links antigos (/admin/configuracoes?secao=…) para as seções novas. */
const LEGACY_SECTIONS: Record<string, SettingsSectionSlug> = {
  geral: "convite",
  publica: "pagina-publica",
  horarios: "horarios",
  whatsapp: "whatsapp",
  integracoes: "holyrics",
  plano: "plano",
};

export function legacySettingsRoute(secao: unknown) {
  const value = Array.isArray(secao) ? secao[0] : secao;
  const slug = typeof value === "string" ? LEGACY_SECTIONS[value] : undefined;
  return slug ? `/configuracoes/${slug}` : "/configuracoes";
}

// ── Linhas de situação ("Conectado · (11) 9…", "3 cultos por semana") ──

export function serviceTimesStatus(count: number) {
  if (count <= 0) return "Nenhum culto fixo cadastrado";
  return count === 1 ? "1 culto por semana" : `${count} cultos por semana`;
}

/** "11987654321" → "(11) 98765-4321". Sem DDD reconhecível, devolve como veio. */
export function formatBrazilianPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone ?? "";
}

export function whatsappStatus(connected: boolean | null, phone?: string | null) {
  if (connected === null) return "Verificando…";
  if (!connected) return "Não conectado";
  const formatted = formatBrazilianPhone(phone);
  return formatted ? `Conectado · ${formatted}` : "Conectado";
}

export function connectionStatus(connected: boolean | null) {
  if (connected === null) return "Verificando…";
  return connected ? "Conectado" : "Não conectado";
}

export function planStatus(options: {
  planLabel: string;
  isOnTrial: boolean;
  trialDaysLeft: number | null;
  isPastDue: boolean;
}) {
  if (options.isPastDue) return `${options.planLabel} · pagamento pendente`;
  if (options.isOnTrial && options.trialDaysLeft !== null) {
    const days = options.trialDaysLeft === 1 ? "1 dia" : `${options.trialDaysLeft} dias`;
    return `${options.planLabel} · teste grátis, faltam ${days}`;
  }
  return options.planLabel;
}

export const NAV_PREVIEW_LABELS: Record<string, string> = {
  PASTOR: "Pastor",
  LIDER: "Líder",
  MEMBRO: "Membro",
};

export function navPreviewStatus(role: string | null | undefined) {
  if (!role || role === "PASTOR") return "Você vê o app como pastor";
  return `Vendo o app como ${NAV_PREVIEW_LABELS[role]?.toLowerCase() ?? "membro"}`;
}

export function churchAddressStatus(church: {
  name?: string | null;
  city?: string | null;
  state?: string | null;
} | null | undefined) {
  const place = [church?.city, church?.state].filter(Boolean).join(" - ");
  if (!church?.name) return "Complete os dados da igreja";
  return place ? `${church.name} · ${place}` : `${church.name} · endereço não informado`;
}

export function publicPageStatus(slug: string | null | undefined) {
  return slug ? `/c/${slug}` : "Escolha o endereço da página";
}
