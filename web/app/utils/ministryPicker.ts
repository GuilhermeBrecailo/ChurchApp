import { normalizeListText } from "./listOrdering";

/**
 * Aviso do seletor "Adicionar pessoas" do ministério quando não sobra nenhuma
 * opção. O seletor só lista quem tem conta no app e ainda não está no
 * ministério; "não há ninguém" pode então querer dizer três coisas bem
 * diferentes, e o aviso precisa dizer qual.
 */

export interface PickerEmptyState {
  kind: "all-added" | "already-in" | "no-account";
  title: string;
  hint?: string;
  /** Mostra o atalho para quem está no cadastro sem conta ("Pessoas > Sem conta"). */
  showInviteLink: boolean;
}

interface MinistryPerson {
  name: string;
  email?: string | null;
}

export function pickerEmptyState(
  search: string,
  inMinistry: MinistryPerson[],
): PickerEmptyState {
  const typed = search.trim();
  const term = normalizeListText(typed);

  if (!term) {
    return {
      kind: "all-added",
      title: "Todas as pessoas com conta já estão neste ministério.",
      hint: "Quem está só no cadastro precisa ser convidado para o app antes de entrar.",
      showInviteLink: true,
    };
  }

  const already = inMinistry.filter((person) =>
    normalizeListText(`${person.name} ${person.email ?? ""}`).includes(term),
  );

  if (already.length === 1) {
    return {
      kind: "already-in",
      title: `${already[0].name} já está neste ministério.`,
      showInviteLink: false,
    };
  }

  if (already.length > 1) {
    return {
      kind: "already-in",
      title: "Essas pessoas já estão neste ministério.",
      showInviteLink: false,
    };
  }

  return {
    kind: "no-account",
    title: `Não achei “${typed}” entre quem tem conta no app.`,
    hint: "Se a pessoa está só no cadastro, convide para o app em Pessoas e depois adicione aqui.",
    showInviteLink: true,
  };
}
