<template>
  <div class="people-contact">
    <div v-if="options.call || options.whatsApp || options.email" class="people-contact-buttons">
      <v-btn
        v-if="options.call"
        :href="options.call"
        variant="tonal"
        color="primary"
        class="text-none people-contact-btn"
        :aria-label="`Ligar para ${name}`"
      >
        <Phone size="18" class="mr-2" aria-hidden="true" /> Ligar
      </v-btn>
      <v-btn
        v-if="options.whatsApp"
        :href="options.whatsApp"
        target="_blank"
        rel="noopener noreferrer"
        variant="tonal"
        color="success"
        class="text-none people-contact-btn"
        :aria-label="`Abrir WhatsApp de ${name}`"
      >
        <MessageCircle size="18" class="mr-2" aria-hidden="true" /> WhatsApp
      </v-btn>
      <v-btn
        v-if="options.email"
        :href="options.email"
        variant="tonal"
        color="primary"
        class="text-none people-contact-btn"
        :aria-label="`Enviar e-mail para ${name}`"
      >
        <Mail size="18" class="mr-2" aria-hidden="true" /> E-mail
      </v-btn>
    </div>

    <p v-else class="people-contact-empty mb-0">Sem telefone ou e-mail cadastrado.</p>

    <p v-if="options.blockedByConsent" class="people-contact-blocked mb-0">
      <ShieldAlert size="16" aria-hidden="true" />
      <span>Contato digital não autorizado</span>
      <template v-if="canRecordConsent">
        <span aria-hidden="true">·</span>
        <button type="button" class="people-contact-link" @click="emit('record-consent')">
          Registrar autorização
        </button>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Botões de contato da pessoa. Ligar aparece sempre que há telefone;
 * WhatsApp e e-mail só com autorização (consentAllowsDigitalContact).
 */
import { computed } from "vue";
import { Mail, MessageCircle, Phone, ShieldAlert } from "lucide-vue-next";
import { contactOptions, type ConsentPerson } from "../../utils/contactConsent";

const props = withDefaults(
  defineProps<{
    person: ConsentPerson & { name: string; phone?: string | null; email?: string | null };
    canRecordConsent?: boolean;
  }>(),
  { canRecordConsent: false },
);

const emit = defineEmits<{ "record-consent": [] }>();

const name = computed(() => props.person.name);
const options = computed(() => contactOptions(props.person));
</script>

<style scoped>
.people-contact {
  display: grid;
  gap: 10px;
}

.people-contact-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.people-contact-btn {
  min-height: 44px;
}

.people-contact-empty {
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
}

.people-contact-blocked {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.people-contact-link {
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--app-color-accent);
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
</style>
