import { computed, ref, toValue, type MaybeRefOrGetter } from "vue";
import { useDepartments, type DepartmentMember } from "../useDepartments";
import { useMembers, type ChurchMember } from "../useMembers";
import { useMinistryCargos } from "./useMinistryCargos";
import { compareListText } from "../../app/utils/listOrdering";

export interface AddPeopleResult {
  added: DepartmentMember[];
  failed: { id: string; name: string; error: string }[];
}

/**
 * Pessoas de um ministério: quem está nele, quem da igreja dá para
 * adicionar (várias de uma vez), tirar alguém e dar/tirar cargo.
 *
 * A lista da igreja (GET /church/members) só abre para quem cuida do
 * cadastro de membros; para os demais `churchMembersError` explica e a
 * janela mostra só quem já está no ministério.
 */
export function useMinistryPeople(departmentIdSource: MaybeRefOrGetter<string>) {
  const { getDepartmentMembers, addDepartmentMember, removeDepartmentMember } = useDepartments();
  const { getMembers } = useMembers();

  const departmentId = computed(() => toValue(departmentIdSource));
  const people = ref<DepartmentMember[]>([]);
  const churchMembers = ref<ChurchMember[]>([]);
  const isLoading = ref(false);
  const loadError = ref("");
  const churchMembersError = ref("");
  const isAdding = ref(false);
  const removingId = ref("");

  const cargos = useMinistryCargos(departmentId, churchMembers);

  const sortByName = (list: DepartmentMember[]) =>
    [...list].sort((first, second) => compareListText(first.name, second.name));

  const availableToAdd = computed(() => {
    const inMinistry = new Set(people.value.map((person) => person.id));
    return churchMembers.value
      .filter((member) => !inMinistry.has(member.id))
      .sort((first, second) => compareListText(first.name, second.name));
  });

  const load = async (options: { withCargos?: boolean } = {}) => {
    const id = departmentId.value;
    if (!id) return;
    isLoading.value = true;
    loadError.value = "";
    churchMembersError.value = "";

    try {
      const [peopleResponse, membersResponse] = await Promise.all([
        getDepartmentMembers(id),
        getMembers(),
        options.withCargos ? cargos.loadMinistryRoles() : Promise.resolve(),
      ]);
      if (id !== departmentId.value) return;

      if (peopleResponse.error) loadError.value = peopleResponse.error;
      people.value = sortByName(peopleResponse.data ?? []);

      if (membersResponse.error) {
        churchMembersError.value =
          "A lista da igreja só aparece para quem cuida do cadastro de membros. Peça ao pastor para adicionar pessoas aqui.";
      }
      churchMembers.value = membersResponse.data ?? [];
    } finally {
      isLoading.value = false;
    }
  };

  /** Adiciona várias pessoas; as que falharem voltam com o motivo. */
  const addPeople = async (userIds: string[]): Promise<AddPeopleResult> => {
    const id = departmentId.value;
    const result: AddPeopleResult = { added: [], failed: [] };
    if (!id || !userIds.length) return result;
    isAdding.value = true;

    try {
      for (const userId of userIds) {
        const name =
          churchMembers.value.find((member) => member.id === userId)?.name ?? "Uma pessoa";
        const { data, error } = await addDepartmentMember(id, userId);
        if (error || !data) {
          result.failed.push({ id: userId, name, error: error || "Não foi possível adicionar." });
          continue;
        }
        result.added.push({ ...data, name: data.name || name });
      }
      if (result.added.length) people.value = sortByName([...people.value, ...result.added]);
      return result;
    } finally {
      isAdding.value = false;
    }
  };

  const removePerson = async (person: DepartmentMember): Promise<string | null> => {
    const id = departmentId.value;
    removingId.value = person.id;
    try {
      const { error } = await removeDepartmentMember(id, person.id);
      if (error) return error;
      people.value = people.value.filter((item) => item.id !== person.id);
      return null;
    } finally {
      removingId.value = "";
    }
  };

  /** Dá um cargo em um passo (sem "escolher e depois atribuir"). */
  const giveCargo = async (memberId: string, roleId: string) => {
    cargos.selectedCargo[memberId] = roleId;
    await cargos.assignCargo(memberId);
    return cargos.cargoError.value || null;
  };

  const takeCargo = async (memberId: string, roleId: string) => {
    await cargos.removeCargo(memberId, roleId);
    return cargos.cargoError.value || null;
  };

  return {
    departmentId,
    people,
    churchMembers,
    availableToAdd,
    isLoading,
    loadError,
    churchMembersError,
    isAdding,
    removingId,
    ministryRoles: cargos.ministryRoles,
    memberCargos: cargos.memberCargos,
    assignableCargos: cargos.assignableCargos,
    isAssigningCargo: cargos.isAssigningCargo,
    load,
    addPeople,
    removePerson,
    giveCargo,
    takeCargo,
  };
}
