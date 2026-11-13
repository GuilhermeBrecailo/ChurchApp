import type { WorldKey } from "./seed";

export type PersonaKey =
  | "pastor"
  | "lider"
  | "membro"
  | "nova"
  | "semigreja"
  | "pendente";

export interface Persona {
  key: PersonaKey;
  /** Nome curto, usado no botão "Ver como: ..." */
  label: string;
  /** Uma linha explicando o que a persona mostra */
  description: string;
  /** Conjunto de dados. Pastor, Líder, Membro e Pendente dividem a mesma igreja. */
  world: WorldKey;
  userId: string;
}

export const PERSONAS: Persona[] = [
  {
    key: "pastor",
    label: "Pastor",
    description: "Pr. Marcos · igreja configurada, com tudo preenchido",
    world: "esperanca",
    userId: "u-pastor",
  },
  {
    key: "lider",
    label: "Líder",
    description: "Ana Paula · lidera o Louvor (cargo Ministro)",
    world: "esperanca",
    userId: "u-ana",
  },
  {
    key: "membro",
    label: "Membro",
    description: "Lucas · violão no Louvor, escala de domingo pendente",
    world: "esperanca",
    userId: "u-lucas",
  },
  {
    key: "nova",
    label: "Igreja nova",
    description: "Pr. Rafael · igreja recém-criada, nada configurado",
    world: "nova",
    userId: "u-novo",
  },
  {
    key: "semigreja",
    label: "Sem igreja",
    description: "André · acabou de se cadastrar, ainda sem igreja",
    world: "semigreja",
    userId: "u-semigreja",
  },
  {
    key: "pendente",
    label: "Aguardando aprovação",
    description: "Juliana · pediu para entrar, o pastor ainda não aprovou",
    world: "esperanca",
    userId: "u-juliana",
  },
];

export const DEFAULT_PERSONA: PersonaKey = "pastor";

export const findPersona = (key: string | null | undefined): Persona =>
  PERSONAS.find((persona) => persona.key === key) ??
  PERSONAS.find((persona) => persona.key === DEFAULT_PERSONA)!;
