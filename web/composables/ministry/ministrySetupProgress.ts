/**
 * "Conferi o modelo de escala" não existe na API: fica guardado neste
 * aparelho, só para o checklist do líder parar de pedir. Se o armazenamento
 * do navegador não estiver disponível, o passo simplesmente continua aberto.
 */
const key = (departmentId: string) => `ministry-template-reviewed:${departmentId}`;

export function isMinistryTemplateReviewed(departmentId: string): boolean {
  if (!import.meta.client) return false;
  try {
    return localStorage.getItem(key(departmentId)) === "1";
  } catch {
    return false;
  }
}

export function markMinistryTemplateReviewed(departmentId: string) {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(key(departmentId), "1");
  } catch {
    /* sem armazenamento: o checklist continua mostrando o passo */
  }
}
