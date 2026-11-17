/** Textos curtos usados nas telas do admin master. */

const DEPARTMENT_TYPES: Record<string, string> = {
  WORSHIP: "Louvor",
  MUSIC: "Louvor",
  KIDS: "Crianças",
  RECEPTION: "Recepção",
  MEDIA: "Mídia",
  INTERCESSION: "Intercessão",
  OTHER: "Outro",
};

export const departmentTypeLabel = (value: string) => DEPARTMENT_TYPES[value] ?? "Outro";

export const adminUserRoleLabel = (role: string) => {
  if (role === "PASTOR") return "Pastor";
  if (role === "SUPER_ADMIN") return "Super admin";
  if (role === "ADMIN") return "Admin";
  return "Membro";
};

/** dd/mm/aaaa; "-" quando vazio ou inválido. */
export const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
