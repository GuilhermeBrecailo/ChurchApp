/**
 * Checklist "Configure sua igreja" do Início (proposta §4). Cada passo conta
 * como feito a partir de dados reais da igreja e abre a tela de verdade, não
 * um tutorial. Os dados vêm de composables/useChurchSetupStatus.ts.
 */

export type SetupStepKey =
  | "church"
  | "service-times"
  | "ministry"
  | "invite"
  | "schedule"
  | "public-page";

export type SetupCounts = {
  serviceTimes: number;
  departments: number;
  /** Membros com acesso ativo, incluindo o próprio pastor. */
  activeMembers: number;
  /** Pedidos de entrada esperando aprovação. */
  pendingMembers: number;
  schedules: number;
  hasLogo: boolean;
  hasWelcomeMessage: boolean;
};

export type SetupStepAction =
  | { kind: "sheet"; sheet: "service-times" | "invite" }
  | { kind: "link"; to: string };

export type SetupStep = {
  key: SetupStepKey;
  title: string;
  /** Uma frase sobre por que o passo importa (mostrada no passo aberto). */
  description: string;
  done: boolean;
  /** Bloqueado até outro passo ficar pronto (ex.: escala precisa de ministério). */
  locked: boolean;
  lockedHint?: string;
  actionLabel?: string;
  action?: SetupStepAction;
  secondaryLabel?: string;
  secondaryAction?: SetupStepAction;
};

export const EMPTY_SETUP_COUNTS: SetupCounts = {
  serviceTimes: 0,
  departments: 0,
  activeMembers: 1,
  pendingMembers: 0,
  schedules: 0,
  hasLogo: false,
  hasWelcomeMessage: false,
};

export function buildSetupSteps(
  counts: SetupCounts,
  options: { slug?: string | null } = {},
): SetupStep[] {
  const hasMinistry = counts.departments >= 1;
  const publicPagePath = options.slug ? `/c/${options.slug}` : "";

  return [
    {
      key: "church",
      title: "Igreja criada",
      description: "Sua igreja já está no ChurchApp.",
      done: true,
      locked: false,
    },
    {
      key: "service-times",
      title: "Horários de culto",
      description: "Eles aparecem na página da igreja e ajudam a montar as escalas.",
      done: counts.serviceTimes >= 1,
      locked: false,
      actionLabel: "Adicionar horários",
      action: { kind: "sheet", sheet: "service-times" },
    },
    {
      key: "ministry",
      title: "Primeiro ministério",
      description: "Louvor, recepção, infantil… Cada ministério tem sua equipe e suas escalas.",
      done: hasMinistry,
      locked: false,
      actionLabel: "Criar ministério",
      action: { kind: "link", to: "/ministery?criar=1" },
    },
    {
      key: "invite",
      title: "Convidar pessoas",
      description: "Mande o link da igreja no WhatsApp. Quem entrar pelo link espera sua aprovação.",
      done: counts.activeMembers >= 2 || counts.pendingMembers >= 1,
      locked: false,
      actionLabel: "Convidar pessoas",
      action: { kind: "sheet", sheet: "invite" },
    },
    {
      key: "schedule",
      title: "Primeira escala",
      description: "Diga quem serve em cada culto. A equipe recebe o aviso e confirma pelo app.",
      done: counts.schedules >= 1,
      locked: !hasMinistry,
      lockedHint: "Crie um ministério primeiro.",
      actionLabel: "Montar escala",
      action: { kind: "link", to: "/scale?nova=1" },
    },
    {
      key: "public-page",
      title: "Página da igreja",
      description: "Coloque o logo e uma mensagem de boas-vindas e compartilhe com quem visita.",
      done: counts.hasLogo || counts.hasWelcomeMessage,
      locked: false,
      actionLabel: "Personalizar página",
      action: { kind: "link", to: "/configuracoes/pagina-publica" },
      ...(publicPagePath
        ? {
            secondaryLabel: "Ver página",
            secondaryAction: { kind: "link", to: publicPagePath } as SetupStepAction,
          }
        : {}),
    },
  ];
}

export type SetupSummary = {
  done: number;
  total: number;
  allDone: boolean;
  /** Único passo aberto: o primeiro pendente que já pode ser feito. */
  nextKey: SetupStepKey | null;
  label: string;
};

export function summarizeSetup(steps: SetupStep[]): SetupSummary {
  const done = steps.filter((step) => step.done).length;
  const total = steps.length;
  const next = steps.find((step) => !step.done && !step.locked) ?? null;

  return {
    done,
    total,
    allDone: done === total,
    nextKey: next?.key ?? null,
    label: `Configure sua igreja · ${done} de ${total}`,
  };
}

export type ChecklistStorage = {
  /** A pessoa tocou em "Ocultar". */
  hidden: boolean;
  /** "Tudo pronto! 🎉" já apareceu uma vez. */
  celebrated: boolean;
  /** O checklist já apareceu com algo por fazer neste aparelho. */
  seenIncomplete: boolean;
};

export type ChecklistVisibility = "hidden" | "checklist" | "celebration";

/**
 * - ocultado → some;
 * - incompleto → checklist;
 * - completo → "Tudo pronto! 🎉" uma vez, só para quem viu o checklist
 *   incompleto (igreja antiga já completa não ganha card nenhum).
 */
export function resolveChecklistVisibility(
  summary: Pick<SetupSummary, "allDone">,
  storage: ChecklistStorage,
): ChecklistVisibility {
  if (storage.hidden) return "hidden";
  if (!summary.allDone) return "checklist";
  if (storage.seenIncomplete && !storage.celebrated) return "celebration";
  return "hidden";
}

export const checklistStorageKeys = (churchId: string) => ({
  hidden: `churchapp:setup-checklist:hidden:${churchId}`,
  celebrated: `churchapp:setup-checklist:celebrated:${churchId}`,
  seenIncomplete: `churchapp:setup-checklist:seen:${churchId}`,
});

/* -------------------------------------------------------------------------
 * Horários de culto sugeridos na janelinha do passo 1.
 * ---------------------------------------------------------------------- */

export type ServiceTimeDraft = {
  label: string;
  weekday: number;
  time: string;
};

export const SERVICE_TIME_PRESETS: (ServiceTimeDraft & { chip: string })[] = [
  { chip: "Domingo 10h", label: "Culto da manhã", weekday: 0, time: "10:00" },
  { chip: "Domingo 19h", label: "Culto da noite", weekday: 0, time: "19:00" },
  { chip: "Quarta 19h30", label: "Culto de quarta", weekday: 3, time: "19:30" },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, title: "Domingo" },
  { value: 1, title: "Segunda" },
  { value: 2, title: "Terça" },
  { value: 3, title: "Quarta" },
  { value: 4, title: "Quinta" },
  { value: 5, title: "Sexta" },
  { value: 6, title: "Sábado" },
];

export function validateServiceTimeDraft(draft: ServiceTimeDraft): string {
  if (!draft.label.trim()) return "Dê um nome ao culto.";
  if (!Number.isInteger(draft.weekday) || draft.weekday < 0 || draft.weekday > 6) {
    return "Escolha o dia da semana.";
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) return "Confira o horário (ex.: 19:30).";
  return "";
}

/** Mesmo dia e hora de um horário que já existe. */
export function isDuplicateServiceTime(
  draft: ServiceTimeDraft,
  existing: { weekday: number; time: string; isActive?: boolean }[],
): boolean {
  return existing.some(
    (item) => item.isActive !== false && item.weekday === draft.weekday && item.time === draft.time,
  );
}
