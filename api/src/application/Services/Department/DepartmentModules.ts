export const DEPARTMENT_MODULES = [
  "SCHEDULES",
  "TASKS",
  "RESOURCES",
  "SONGS",
  "CLASSES",
] as const;

export type DepartmentModule = (typeof DEPARTMENT_MODULES)[number];

/**
 * Array vazio significa "ministerio criado antes do campo existir" - a
 * migracao nao fez backfill de proposito, entao a leitura trata vazio como
 * tudo habilitado. Sem isso todo ministerio ja cadastrado perderia as abas.
 */
export function normalizeDepartmentModules(modules?: string[] | null): DepartmentModule[] {
  if (!modules?.length) return [...DEPARTMENT_MODULES];

  return DEPARTMENT_MODULES.filter((module) => modules.includes(module));
}

/**
 * Valida a entrada do cadastro. Devolve undefined quando o campo nao veio no
 * body (update parcial) e lanca quando veio invalido ou vazio.
 */
export function parseDepartmentModules(
  rawModules: unknown,
  onInvalid: (message: string) => never,
): DepartmentModule[] | undefined {
  if (rawModules === undefined) return undefined;

  if (!Array.isArray(rawModules)) {
    onInvalid("Modulos do ministerio invalidos");
  }

  const modules = DEPARTMENT_MODULES.filter((module) =>
    (rawModules as unknown[]).includes(module),
  );

  if (!modules.length) {
    onInvalid("Selecione ao menos um modulo para o ministerio");
  }

  return modules;
}
