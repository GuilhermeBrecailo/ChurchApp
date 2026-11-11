<template>
  <div />
</template>

<script setup lang="ts">
/**
 * Endereço antigo. As Configurações agora ficam em /configuracoes; os links
 * com ?secao= (ex.: o "Conectar WhatsApp" de mensagens antigas e
 * notificações) caem direto na seção nova.
 */
import { legacySettingsRoute } from "../../utils/churchSettings";

definePageMeta({
  middleware: [(to) => navigateTo(legacySettingsRoute(to.query.secao), { replace: true, redirectCode: 301 })],
});
</script>
