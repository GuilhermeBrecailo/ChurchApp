<template>
  <ChurchSettingsCard
    title="Ver o app como…"
    description="Mude a barra de navegação para conferir o que um membro ou líder vê. Seus acessos de pastor continuam valendo, e você pode voltar quando quiser."
  >
    <ChurchSettingsChoiceList
      :model-value="selected"
      :options="OPTIONS"
      aria-label="Ver o app como"
      :disabled="saving"
      @update:model-value="change"
    />
  </ChurchSettingsCard>
</template>

<script setup lang="ts">
/** Avançado: pré-visualizar a navegação como membro ou líder (salva na hora). */
import { computed, ref } from "vue";

type PreviewRole = "PASTOR" | "LIDER" | "MEMBRO";

const OPTIONS: { value: PreviewRole; label: string; description: string }[] = [
  { value: "PASTOR", label: "Pastor (normal)", description: "Tudo o que você pode usar." },
  { value: "LIDER", label: "Líder de ministério", description: "Início, Escalas, Igreja, Ministérios e Perfil." },
  { value: "MEMBRO", label: "Membro", description: "Início, Escalas, Igreja e Perfil." },
];

const { user, updateNavPreviewRole } = useAuth();
const toast = useAppToast();

const saving = ref(false);
const selected = computed<PreviewRole>(() => (user.value?.navPreviewRole as PreviewRole | null) ?? "PASTOR");

const change = async (value: unknown) => {
  const role = value as PreviewRole;
  if (role === selected.value) return;
  saving.value = true;
  const { error } = await updateNavPreviewRole(role);
  saving.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  toast.success(
    role === "PASTOR" ? "Você voltou a ver o app como pastor" : `Agora você vê o app como ${role === "LIDER" ? "líder" : "membro"}`,
  );
};
</script>

