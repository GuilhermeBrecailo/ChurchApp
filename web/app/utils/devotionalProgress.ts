/**
 * Progresso de leitura de um devocional. Antes a barra ficava fixa em 50%
 * para qualquer devocional começado.
 *
 * A API guarda só o último capítulo aberto (`progresses[0].lastChapterId`);
 * com a lista de capítulos dá para saber em qual a pessoa está.
 */
export type DevotionalProgressInput = {
  chapters?: Array<{ id: string; order: number }> | null;
  _count?: { chapters: number } | null;
  progresses?: Array<{ lastChapterId: string }> | null;
};

export type DevotionalProgress = {
  started: boolean;
  /** Capítulo atual (1…total), quando dá para saber. */
  current: number | null;
  total: number;
  /** 0–100, ou null quando começou mas não sabemos onde parou. */
  percent: number | null;
  label: string;
};

export function devotionalProgress(devotional: DevotionalProgressInput): DevotionalProgress {
  const chapters = [...(devotional.chapters ?? [])].sort((first, second) => first.order - second.order);
  const total = chapters.length || devotional._count?.chapters || 0;
  const lastChapterId = devotional.progresses?.[0]?.lastChapterId;

  if (!lastChapterId || total === 0) {
    return { started: false, current: null, total, percent: 0, label: "Não iniciado" };
  }

  const index = chapters.findIndex((chapter) => chapter.id === lastChapterId);
  if (index < 0) {
    return { started: true, current: null, total, percent: null, label: "Em andamento" };
  }

  const current = index + 1;
  return {
    started: true,
    current,
    total,
    percent: Math.round((current / total) * 100),
    label: current === total ? "Último capítulo" : `Capítulo ${current} de ${total}`,
  };
}
