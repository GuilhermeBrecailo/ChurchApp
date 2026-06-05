<template>
  <v-bottom-navigation
    class="bottom-nav elevation-10"
    height="64"
    :bg-color="isDark ? '#182233' : 'white'"
    app
  >
    <v-btn to="/" class="flex-col custom-btn" exact>
      <House class="nav-icon" />
      <span class="nav-label">Início</span>
    </v-btn>

    <v-btn v-if="hasChurch" to="/scale" class="flex-col custom-btn">
      <CalendarDays class="nav-icon" />
      <span class="nav-label">Escalas</span>
    </v-btn>

    <v-btn
      v-if="hasChurch"
      to="/ministery"
      class="flex-col custom-btn"
      :active="$route.path.startsWith('/ministery')"
    >
      <Users class="nav-icon" />
      <span class="nav-label">Ministérios</span>
    </v-btn>
    <v-btn
      to="/user"
      class="flex-col custom-btn"
      :active="$route.path.startsWith('/user')"
    >
      <User class="nav-icon" />
      <span class="nav-label">Usuário</span>
    </v-btn>

    <v-btn v-if="showAdmin" to="/admin" class="flex-col custom-btn">
      <Cog class="nav-icon" />
      <span class="nav-label mt-1">{{ adminLabel }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { House, CalendarDays, User, Users, Cog } from "lucide-vue-next";
import { computed } from "vue";
import { useAuth } from "../../../../composables/useAuth";

const { user } = useAuth();
const { isDark } = useThemeMode();

const hasChurch = computed(() => user.value?.hasChurch === true);
const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const showAdmin = computed(() => hasChurch.value || isPlatformAdmin.value);
const adminLabel = computed(() => "Admin");
</script>

<style scoped>
.bottom-nav {
  width: 100%;
  max-width: 100vw;
  border-top: 1px solid #e5e7eb;
  border-radius: 14px 14px 0 0 !important;
  padding: 4px max(4px, env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom))
    max(4px, env(safe-area-inset-left));
  overflow: hidden;
}

:global(.app-theme-dark) .bottom-nav {
  border-top-color: #2c394d;
}

.nav-label {
  display: block;
  width: 100%;
  margin-top: 3px;
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.05;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.custom-btn {
  flex: 1 1 0;
  min-width: 0 !important;
  max-width: none;
  color: #757575 !important;
  border-radius: 10px !important;
  margin: 0 1px;
  height: 54px !important;
  padding: 4px 2px !important;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

:global(.app-theme-dark) .custom-btn {
  color: #aeb8c7 !important;
}

:global(html.app-theme-dark) :deep(.custom-btn) {
  color: #aeb8c7 !important;
}

.custom-btn :deep(.v-btn__content) {
  display: flex;
  min-width: 0;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.custom-btn.v-btn--active {
  color: #4f46e5 !important;
  background-color: #eef2ff !important;
}

:global(.app-theme-dark) .custom-btn.v-btn--active {
  color: #c4b5fd !important;
  background-color: rgba(99, 102, 241, 0.18) !important;
}

:global(html.app-theme-dark) :deep(.custom-btn.v-btn--active) {
  color: #c4b5fd !important;
  background-color: rgba(99, 102, 241, 0.18) !important;
}

.custom-btn:hover > .v-btn__overlay {
  opacity: 0 !important;
}

@media (max-width: 390px) {
  .bottom-nav {
    height: 60px !important;
    padding-inline: 2px;
  }

  .custom-btn {
    height: 50px !important;
    padding-inline: 1px !important;
  }

  .nav-label {
    font-size: 0.62rem;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 340px) {
  .nav-label {
    font-size: 0.58rem;
  }
}
</style>
