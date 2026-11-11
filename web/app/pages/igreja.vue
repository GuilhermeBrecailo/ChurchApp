<template>
  <div class="pa-4 pb-8 app-operational-page igreja-page">
    <UtilsPageHeader title="Igreja" :subtitle="church?.name || undefined" help-title="Igreja" />

    <div class="igreja-grid">
      <div class="igreja-main">
        <section id="avisos" class="igreja-section">
          <DashboardAnnouncementsSection
            :announcements="announcements"
            :loading="announcementsLoading"
            :limit="showAllAnnouncements ? undefined : ANNOUNCEMENTS_PREVIEW"
            show-count
          />
          <v-btn
            v-if="announcements.length > ANNOUNCEMENTS_PREVIEW"
            variant="text"
            color="primary"
            class="text-none font-weight-bold align-self-start"
            @click="showAllAnnouncements = !showAllAnnouncements"
          >
            {{ showAllAnnouncements ? "Mostrar menos" : `Ver todos os avisos (${announcements.length})` }}
          </v-btn>
        </section>

        <section id="conteudo" class="igreja-section" aria-labelledby="igreja-conteudo">
          <UtilsSectionHeader id="igreja-conteudo" title="Conteúdo" description="Para ler e ouvir durante a semana." />
          <div class="igreja-tiles">
            <NuxtLink v-for="item in contentItems" :key="item.route" :to="item.route" class="igreja-tile app-surface app-interactive-surface">
              <span class="igreja-tile-icon" aria-hidden="true">
                <component :is="item.icon" size="22" />
              </span>
              <span class="igreja-tile-copy">
                <span class="igreja-tile-title">{{ item.title }}</span>
                <span class="igreja-tile-description">{{ item.description }}</span>
              </span>
              <ChevronRight size="18" class="igreja-chevron" aria-hidden="true" />
            </NuxtLink>
          </div>
        </section>

        <section id="oracao" class="igreja-section" aria-labelledby="igreja-oracao">
          <UtilsSectionHeader
            id="igreja-oracao"
            title="Oração"
            description="Compartilhe um pedido e ore pelos irmãos."
            link-label="Ver pedidos"
            link-to="/prayer"
          />
          <div class="igreja-prayer app-surface">
            <span class="igreja-tile-icon" aria-hidden="true">
              <HandHeart size="22" />
            </span>
            <p class="igreja-prayer-copy">
              Seu pedido pode ser anônimo. A liderança revisa antes de ele aparecer para a igreja.
            </p>
            <v-btn
              to="/prayer?novo=1"
              color="primary"
              variant="flat"
              class="text-none font-weight-bold igreja-prayer-btn"
            >
              <Plus size="18" class="mr-1" aria-hidden="true" /> Fazer um pedido
            </v-btn>
          </div>
        </section>
      </div>

      <aside class="igreja-side">
        <section id="ministerios" class="igreja-section" aria-labelledby="igreja-ministerios">
          <UtilsSectionHeader
            id="igreja-ministerios"
            title="Ministérios"
            :count="ministries.length || null"
            :link-label="ministries.length ? 'Ver todos' : undefined"
            link-to="/ministery"
          />
          <div v-if="ministriesLoading" class="app-surface">
            <v-skeleton-loader type="list-item-two-line@2" />
          </div>
          <UtilsEmptyState
            v-else-if="!ministries.length"
            compact
            :icon="UsersRound"
            title="Nenhum ministério ainda"
            description="Os ministérios da igreja (louvor, recepção, mídia…) aparecem aqui."
          />
          <ul v-else class="igreja-list app-surface" role="list">
            <li v-for="ministry in visibleMinistries" :key="ministry.id">
              <NuxtLink :to="`/ministery/${ministry.id}`" class="igreja-list-row">
                <span class="igreja-list-avatar accent-avatar" aria-hidden="true">
                  {{ initials(ministry.name) }}
                </span>
                <span class="igreja-tile-copy">
                  <span class="igreja-tile-title">{{ ministry.name }}</span>
                  <span class="igreja-tile-description">
                    {{ ministry.leader?.name ? `Líder: ${ministry.leader.name}` : "Sem líder definido" }}
                  </span>
                  <span v-if="ministry.isMember" class="igreja-badge">Você participa</span>
                </span>
                <ChevronRight size="18" class="igreja-chevron" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section id="sobre" class="igreja-section" aria-labelledby="igreja-sobre">
          <UtilsSectionHeader id="igreja-sobre" title="Sobre a igreja" />
          <div class="igreja-about app-surface">
            <div v-if="address" class="igreja-about-row">
              <MapPin size="18" aria-hidden="true" />
              <span>{{ address }}</span>
            </div>
            <a
              v-for="contact in contacts"
              :key="contact.key"
              :href="contact.href"
              class="igreja-about-row igreja-about-link"
              target="_blank"
              rel="noopener"
            >
              <component :is="contact.icon" size="18" aria-hidden="true" />
              <span>{{ contact.label }}</span>
            </a>
            <p v-if="!address && !contacts.length" class="igreja-about-empty">
              A igreja ainda não cadastrou endereço e contatos.
            </p>
            <v-btn
              v-if="publicPage"
              :to="publicPage"
              variant="tonal"
              color="primary"
              class="text-none font-weight-bold igreja-public-btn"
            >
              <Globe size="18" class="mr-2" aria-hidden="true" /> Ver página pública da igreja
            </v-btn>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Globe,
  HandHeart,
  Heart,
  Instagram,
  ListMusic,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  UsersRound,
} from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useAnnouncements, type Announcement } from "../../composables/useAnnouncements";
import { useDepartments, type ChurchDepartment } from "../../composables/useDepartments";
import { markAnnouncementsSeen } from "../../composables/useHomeFeed";
import { getInitials } from "../utils/initials";

const ANNOUNCEMENTS_PREVIEW = 3;
const MINISTRIES_PREVIEW = 8;

const { user } = useAuth();
const { getAnnouncements } = useAnnouncements();
const { getDepartments } = useDepartments();

const church = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);

const announcements = ref<Announcement[]>([]);
const announcementsLoading = ref(true);
const showAllAnnouncements = ref(false);
const ministries = ref<ChurchDepartment[]>([]);
const ministriesLoading = ref(true);

const visibleMinistries = computed(() => ministries.value.slice(0, MINISTRIES_PREVIEW));
const initials = (name: string) => getInitials(name);

const contentItems = [
  { title: "Versículo do dia", description: "A palavra que a liderança escolheu para hoje.", icon: BookMarked, route: "/content/verse" },
  { title: "Bíblia", description: "Leia em várias versões e guarde suas anotações.", icon: BookOpen, route: "/content/bible" },
  { title: "Devocionais", description: "Séries de estudo para ler capítulo a capítulo.", icon: Heart, route: "/content/devotionals" },
  { title: "Minha playlist", description: "As músicas do ministério no seu tom.", icon: ListMusic, route: "/content/playlist" },
];

const address = computed(() => {
  const value = church.value;
  if (!value) return "";
  const street = [value.road, value.number].filter(Boolean).join(", ");
  const city = [value.city, value.state].filter(Boolean).join(" - ");
  return [street, city].filter(Boolean).join(" · ");
});

const digits = (value?: string | null) => String(value ?? "").replace(/\D/g, "");

const contacts = computed(() => {
  const value = church.value;
  if (!value) return [];
  const list: Array<{ key: string; label: string; href: string; icon: unknown }> = [];
  if (value.whatsapp) {
    const number = digits(value.whatsapp);
    list.push({
      key: "whatsapp",
      label: `WhatsApp ${value.whatsapp}`,
      href: `https://wa.me/${number.startsWith("55") ? number : `55${number}`}`,
      icon: MessageCircle,
    });
  }
  if (value.phone) list.push({ key: "phone", label: value.phone, href: `tel:${digits(value.phone)}`, icon: Phone });
  if (value.email) list.push({ key: "email", label: value.email, href: `mailto:${value.email}`, icon: Mail });
  if (value.instagram) {
    const handle = value.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    list.push({ key: "instagram", label: `@${handle}`, href: `https://instagram.com/${handle}`, icon: Instagram });
  }
  if (value.website) {
    const href = /^https?:\/\//.test(value.website) ? value.website : `https://${value.website}`;
    list.push({ key: "website", label: value.website.replace(/^https?:\/\//, ""), href, icon: Globe });
  }
  return list;
});

const publicPage = computed(() => (church.value?.slug ? `/c/${church.value.slug}` : null));

onMounted(async () => {
  await Promise.all([
    getAnnouncements().then(({ data }) => {
      announcements.value = data ?? [];
      announcementsLoading.value = false;
      // Quem abriu a aba Igreja já viu os avisos: some o "Aviso novo" do Início.
      markAnnouncementsSeen(announcements.value.map((announcement) => announcement.id));
    }),
    getDepartments().then(({ data }) => {
      ministries.value = (data ?? [])
        .filter((ministry) => ministry.isActive !== false)
        .sort(
          (first, second) =>
            Number(Boolean(second.isMember)) - Number(Boolean(first.isMember)) ||
            first.name.localeCompare(second.name, "pt-BR"),
        );
      ministriesLoading.value = false;
    }),
  ]);
});
</script>

<style scoped>
.igreja-page {
  max-width: 1180px;
  margin: 0 auto;
}

.igreja-grid {
  display: grid;
  gap: 28px;
}

.igreja-main,
.igreja-side {
  display: grid;
  align-content: start;
  gap: 28px;
  min-width: 0;
}

.igreja-section {
  display: grid;
  gap: 10px;
  min-width: 0;
  scroll-margin-top: 80px;
}

.igreja-tiles {
  display: grid;
  gap: 10px;
}

.igreja-tile,
.igreja-list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 14px;
  color: var(--app-color-text);
  text-decoration: none;
}

.igreja-tile:focus-visible,
.igreja-list-row:focus-visible,
.igreja-about-link:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.igreja-tile-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.igreja-tile-copy {
  display: grid;
  flex: 1 1 auto;
  gap: 2px;
  min-width: 0;
}

.igreja-tile-title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.igreja-tile-description {
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.35;
}

.igreja-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}

.igreja-prayer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px 14px;
  padding: 16px;
}

.igreja-prayer-copy {
  margin: 0;
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.45;
}

.igreja-prayer-btn {
  grid-column: 1 / -1;
  min-height: 48px;
}

.igreja-list {
  display: grid;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  overflow: hidden;
}

.igreja-list li + li {
  border-top: 1px solid var(--app-color-border-subtle);
}

.igreja-list-row {
  min-height: 60px;
  transition: background-color 0.16s ease;
}

.igreja-list-row:hover {
  background: var(--app-color-surface-soft);
}

.igreja-list-avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
}

.igreja-badge {
  justify-self: start;
  margin-top: 3px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

.igreja-about {
  display: grid;
  gap: 4px;
  padding: 10px 14px 14px;
}

.igreja-about-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: var(--app-color-text);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

.igreja-about-row svg {
  flex: 0 0 auto;
  color: var(--app-color-accent);
}

.igreja-about-link {
  border-radius: 8px;
  text-decoration: none;
}

.igreja-about-link:hover {
  color: var(--app-color-accent);
}

.igreja-about-empty {
  margin: 6px 0;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.igreja-public-btn {
  margin-top: 8px;
  min-height: 48px;
}

@media (min-width: 720px) {
  .igreja-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .igreja-grid {
    grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.9fr);
    align-items: start;
  }
}
</style>
