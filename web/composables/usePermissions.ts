import { computed } from "vue";
import { useAuth } from "./useAuth";

export type AppPermission =
  | "MANAGE_MEMBERS"
  | "MANAGE_SCHEDULES"
  | "MANAGE_DEPARTMENTS"
  | "MANAGE_SONGS"
  | "SEND_NOTIFICATIONS";

export const ALL_PERMISSIONS: {
  key: AppPermission;
  label: string;
  description: string;
}[] = [
  {
    key: "MANAGE_MEMBERS",
    label: "Gerenciar membros",
    description: "Adicionar, editar e remover membros da igreja",
  },
  {
    key: "MANAGE_SCHEDULES",
    label: "Gerenciar escalas",
    description: "Criar, editar e excluir escalas e gerenciar voluntários",
  },
  {
    key: "MANAGE_DEPARTMENTS",
    label: "Gerenciar ministérios",
    description: "Criar e editar ministérios e suas configurações",
  },
  {
    key: "MANAGE_SONGS",
    label: "Gerenciar músicas",
    description: "Adicionar, editar e remover músicas e recursos",
  },
  {
    key: "SEND_NOTIFICATIONS",
    label: "Enviar notificações",
    description: "Enviar lembretes e notificações push para membros",
  },
];

export const usePermissions = () => {
  const { user } = useAuth();

  const isPrivileged = computed(
    () =>
      user.value?.is_admin === true ||
      user.value?.role === "PASTOR" ||
      user.value?.role === "ADMIN" ||
      user.value?.role === "SUPER_ADMIN",
  );

  const can = (permission: AppPermission): boolean => {
    if (!user.value) return false;
    if (isPrivileged.value) return true;
    return user.value.permissions?.includes(permission) ?? false;
  };

  const canRef = (permission: AppPermission) => computed(() => can(permission));

  return { can, canRef, isPrivileged };
};
