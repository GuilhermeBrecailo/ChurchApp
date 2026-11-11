import { computed, reactive, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { useChurchRoles, type ChurchRole, type MemberRole } from "../useChurchRoles";
import type { ChurchMember } from "../useMembers";

/**
 * Cargos de ministério deste departamento, para o líder delegar aos membros
 * (janela "Pessoas" do ministério).
 *
 * `members` são os membros da igreja já carregados pela página: os cargos de
 * cada um vêm de lá até a primeira alteração, quando passam a vir da resposta
 * da API (memberCargoOverride).
 */
export function useMinistryCargos(
  departmentIdSource: MaybeRefOrGetter<string>,
  members: Ref<ChurchMember[]>,
) {
  const { getRoles, addMemberRole, removeMemberRole } = useChurchRoles();

  const churchRolesList = ref<ChurchRole[]>([]);
  const cargoError = ref("");
  const isAssigningCargo = ref("");
  const selectedCargo = reactive<Record<string, string | null>>({});
  const memberCargoOverride = reactive<Record<string, MemberRole[]>>({});

  const departmentId = computed(() => toValue(departmentIdSource));

  // As alterações guardadas valem só para o ministério aberto.
  watch(departmentId, () => {
    for (const key of Object.keys(memberCargoOverride)) delete memberCargoOverride[key];
    for (const key of Object.keys(selectedCargo)) delete selectedCargo[key];
    cargoError.value = "";
  });

  const ministryRoles = computed(() =>
    churchRolesList.value.filter(
      (role) => role.scope === "MINISTRY" && role.departmentId === departmentId.value,
    ),
  );

  const memberCargos = (memberId: string): MemberRole[] => {
    if (memberCargoOverride[memberId]) return memberCargoOverride[memberId];
    const churchMember = members.value.find((item) => item.id === memberId);
    return (churchMember?.roles ?? []).filter(
      (role) => role.scope === "MINISTRY" && role.departmentId === departmentId.value,
    );
  };

  const assignableCargos = (memberId: string) => {
    const assigned = new Set(memberCargos(memberId).map((role) => role.id));
    return ministryRoles.value
      .filter((role) => !assigned.has(role.id))
      .map((role) => ({ label: role.name, value: role.id }));
  };

  const loadMinistryRoles = async () => {
    const { data } = await getRoles();
    churchRolesList.value = data ?? [];
  };

  const thisMinistryRoles = (roles: MemberRole[]) =>
    roles.filter(
      (role) => role.scope === "MINISTRY" && role.departmentId === departmentId.value,
    );

  const assignCargo = async (memberId: string) => {
    const roleId = selectedCargo[memberId];
    if (!roleId) return;
    cargoError.value = "";
    isAssigningCargo.value = memberId;
    try {
      const { data, error } = await addMemberRole(memberId, roleId);
      if (error || !data) {
        cargoError.value = error || "Não foi possível atribuir o cargo.";
        return;
      }
      memberCargoOverride[memberId] = thisMinistryRoles(data.roles);
      selectedCargo[memberId] = null;
    } finally {
      isAssigningCargo.value = "";
    }
  };

  const removeCargo = async (memberId: string, roleId: string) => {
    cargoError.value = "";
    isAssigningCargo.value = memberId;
    try {
      const { data, error } = await removeMemberRole(memberId, roleId);
      if (error || !data) {
        cargoError.value = error || "Não foi possível remover o cargo.";
        return;
      }
      memberCargoOverride[memberId] = thisMinistryRoles(data.roles);
    } finally {
      isAssigningCargo.value = "";
    }
  };

  return {
    churchRolesList,
    cargoError,
    isAssigningCargo,
    selectedCargo,
    ministryRoles,
    memberCargos,
    assignableCargos,
    loadMinistryRoles,
    assignCargo,
    removeCargo,
  };
}
