// Níveis da Organização (Crunch)
export enum CrunchType {
  DENOMINACAO = "DENOMINACAO", // Ex: Conselho Nacional/Estadual
  REGIONAL = "REGIONAL", // Ex: Região 661
  SEDE = "SEDE", // Ex: 1ª IEQ Apucarana (Sede da região)
  LOCAL = "LOCAL", // Ex: IEQ Califórnia ou congregações de bairro
}

// Níveis de Autoridade (Usuário)
export enum UserRole {
  LIDER_GERAL = "LIDER_GERAL", // Comanda a Denominação
  SUPERINTENDENTE = "SUPERINTENDENTE", // Comanda a Região
  PASTOR_TITULAR = "PASTOR_TITULAR", // Comanda uma Sede ou Local
  LIDER_DEPTO = "LIDER_DEPTO", // Líder de Louvor, Jovens, etc.
  MEMBRO = "MEMBRO",
}
