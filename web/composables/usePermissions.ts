import { computed } from "vue";
import { useAuth } from "./useAuth";

export type AppPermission =
  | "MANAGE_MEMBERS"
  | "MANAGE_SCHEDULES"
  | "MANAGE_DEPARTMENTS"
  | "MANAGE_SONGS"
  | "SEND_NOTIFICATIONS";

export type PermissionModuleKey =
  | "members"
  | "departments"
  | "schedules"
  | "content"
  | "communication";

export type PermissionDefinition = {
  key: AppPermission;
  label: string;
  description: string;
  module: PermissionModuleKey;
};

export const PERMISSION_MODULES: {
  key: PermissionModuleKey;
  label: string;
  description: string;
  permissions: PermissionDefinition[];
}[] = [
  {
    key: "members",
    label: "Membros",
    description: "Cadastro e manutenção de pessoas da igreja",
    permissions: [
      {
        key: "MANAGE_MEMBERS",
        label: "Gerenciar membros",
        description: "Adicionar, editar e remover membros da igreja",
        module: "members",
      },
    ],
  },
  {
    key: "departments",
    label: "Ministérios",
    description: "Organização, tarefas e recursos do ministério liderado",
    permissions: [
      {
        key: "MANAGE_DEPARTMENTS",
        label: "Gerenciar ministérios",
        description: "Criar tarefas, editar recursos e ajustar dados do ministério",
        module: "departments",
      },
    ],
  },
  {
    key: "schedules",
    label: "Escalas",
    description: "Escalas e voluntários do ministério liderado",
    permissions: [
      {
        key: "MANAGE_SCHEDULES",
        label: "Gerenciar escalas",
        description: "Criar, editar e excluir escalas e gerenciar voluntários",
        module: "schedules",
      },
    ],
  },
  {
    key: "content",
    label: "Músicas",
    description: "Repertório, letras, cifras e PDFs do ministério liderado",
    permissions: [
      {
        key: "MANAGE_SONGS",
        label: "Gerenciar músicas",
        description: "Adicionar, editar e remover músicas",
        module: "content",
      },
    ],
  },
  {
    key: "communication",
    label: "Comunicação",
    description: "Lembretes e avisos do ministério liderado",
    permissions: [
      {
        key: "SEND_NOTIFICATIONS",
        label: "Enviar notificações",
        description: "Enviar lembretes e notificações push para membros escalados",
        module: "communication",
      },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionDefinition[] =
  PERMISSION_MODULES.flatMap((module) => module.permissions);

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
