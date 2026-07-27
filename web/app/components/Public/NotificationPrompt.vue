<template>
  <Transition name="public-notification-prompt">
    <aside v-if="visible" class="notification-prompt" aria-live="polite">
      <div class="notification-copy">
        <strong>Quer saber quando tiver culto ou aviso novo?</strong>
        <span>Ative notificacoes desta igreja neste navegador.</span>
      </div>
      <div class="notification-actions">
        <v-btn
          size="small"
          variant="flat"
          class="activate-btn text-none"
          :loading="loading"
          @click="activate"
        >
          <Bell size="15" class="mr-1" />
          Ativar notificacoes
        </v-btn>
        <button type="button" class="dismiss-btn" @click="dismiss">
          Agora nao
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { Bell } from "lucide-vue-next";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  slug: string;
}>();

const {
  loading,
  canShowAnonymousPrompt,
  enableAnonymous,
  dismissAnonymousPrompt,
} = usePushNotifications();

const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const dismiss = () => {
  dismissAnonymousPrompt(props.slug);
  visible.value = false;
};

const activate = async () => {
  await enableAnonymous(props.slug);
  visible.value = false;
};

onMounted(async () => {
  const canShow = await canShowAnonymousPrompt(props.slug);
  if (!canShow) return;

  timer = setTimeout(() => {
    visible.value = true;
  }, 2000);
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.notification-prompt {
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 14px 36px rgba(34, 31, 26, 0.12);
  color: var(--ink);
  display: grid;
  gap: 10px;
  max-width: min(100%, 420px);
  padding: 12px;
}

.notification-copy {
  display: grid;
  gap: 2px;
}

.notification-copy strong {
  font-size: 0.86rem;
  font-weight: 800;
  line-height: 1.25;
}

.notification-copy span {
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.35;
}

.notification-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activate-btn {
  background: var(--church-accent) !important;
  color: #ffffff !important;
  font-weight: 800;
}

.dismiss-btn {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 750;
  padding: 6px 4px;
}

.public-notification-prompt-enter-active,
.public-notification-prompt-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.public-notification-prompt-enter-from,
.public-notification-prompt-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>