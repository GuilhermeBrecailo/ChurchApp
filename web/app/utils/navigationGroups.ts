import type { ManagementGroupKey, ManagementItem } from "./roleNavigation";

export type ManagementGroup = {
  key: ManagementGroupKey;
  label: string;
  items: ManagementItem[];
};

/** Grupos da aba Gestão, na ordem em que aparecem (hub e barra lateral). */
export const MANAGEMENT_GROUPS: Array<{ key: ManagementGroupKey; label: string }> = [
  { key: "people", label: "Pessoas e cuidado" },
  { key: "ministries", label: "Ministérios e cultos" },
  { key: "communication", label: "Comunicação" },
  { key: "church", label: "Igreja" },
  { key: "platform", label: "Plataforma" },
];

/**
 * Agrupa os itens de Gestão mantendo a ordem de cada item dentro do grupo.
 * Grupos vazios saem.
 */
export function groupManagementItems(items: ManagementItem[]): ManagementGroup[] {
  return MANAGEMENT_GROUPS.map((group) => ({
    ...group,
    items: items.filter((entry) => entry.group === group.key),
  })).filter((group) => group.items.length > 0);
}
