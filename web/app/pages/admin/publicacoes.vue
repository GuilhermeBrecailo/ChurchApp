<template>
  <div
    v-if="canAccessChurchAdmin && isChurchWideManager"
    class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20"
  >
    <div class="publicacoes-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Publicações</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Publicações" />
    </div>

    <section class="church-admin-section">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Conteúdo
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Publique versículos, avisos e devocionais para a igreja.
          </p>
        </div>
      </div>

      <v-alert v-if="contentError" type="error" variant="tonal" density="compact" class="mb-4">
        {{ contentError }}
      </v-alert>

      <div class="content-admin-grid mb-4">
        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
          <div class="d-flex align-center mb-4">
            <BookMarked size="18" :color="churchAccent" class="mr-2" />
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
              Versículo
            </h3>
          </div>

          <v-alert
            v-if="verseSuccess"
            type="success"
            variant="tonal"
            density="compact"
            class="content-feedback-alert mb-3"
          >
            {{ verseSuccess }}
          </v-alert>
          <v-alert
            v-if="verseError"
            type="error"
            variant="tonal"
            density="compact"
            class="content-feedback-alert mb-3"
          >
            {{ verseError }}
          </v-alert>

          <div class="content-form-stack">
            <div class="content-field">
              <div class="content-field-header">
                <label class="content-field-label">Texto <span class="content-required">*</span></label>
                <span class="content-field-hint">Obrigatório</span>
              </div>
              <v-textarea
                v-model="verseForm.text"
                label="Texto"
                variant="outlined"
                color="purple-darken-3"
                auto-grow
                rows="2"
                hide-details="auto"
              />
            </div>
            <div class="content-field">
              <div class="content-field-header">
                <label class="content-field-label">Referência <span class="content-required">*</span></label>
                <span class="content-field-hint">Obrigatório</span>
              </div>
              <v-text-field
                v-model="verseForm.reference"
                label="Referência"
                variant="outlined"
                color="purple-darken-3"
                hide-details="auto"
              />
            </div>
            <div class="content-field">
              <div class="content-field-header">
                <label class="content-field-label">Comentário</label>
                <span class="content-field-hint">Opcional</span>
              </div>
              <v-textarea
                v-model="verseForm.commentary"
                label="Comentário"
                variant="outlined"
                color="purple-darken-3"
                auto-grow
                rows="2"
                hide-details="auto"
              />
            </div>
          </div>
          <AdminMediaAttachmentFields
            v-model:image-url="verseForm.imageUrl"
            v-model:image-key="verseForm.imageKey"
            v-model:video-url="verseForm.videoUrl"
          />
          <v-switch
            v-model="verseForm.isPublic"
            label="Publicar também na página pública da igreja"
            color="purple-darken-3"
            density="comfortable"
            hide-details
            class="mb-4"
          />
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isPublishingVerse"
              @click="saveDailyVerse"
            >
              {{ editingVerseId ? "Salvar versículo" : "Publicar versículo" }}
            </v-btn>
            <v-btn
              v-if="editingVerseId"
              variant="text"
              color="grey-darken-1"
              class="text-none"
              @click="resetVerseForm"
            >
              Cancelar
            </v-btn>
          </div>

          <MotionStaggerGroup class="content-admin-list">
            <MotionStaggerItem
              v-for="verse in dailyVerses"
              :key="verse.id"
              tag="div"
              class="content-admin-row"
            >
              <div class="min-w-0">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="verse.isPublic ? 'teal-darken-2' : 'grey-darken-1'"
                  >
                    {{ verse.isPublic ? "Público" : "Interno" }}
                  </v-chip>
                </div>
                <span>{{ verse.reference }}</span>
              </div>
              <div class="d-flex ga-1">
                <v-btn icon variant="text" color="grey-darken-1" size="small" @click="editVerse(verse)">
                  <Pencil size="16" />
                </v-btn>
                <v-btn icon variant="text" color="red-darken-2" size="small" @click="removeVerse(verse.id)">
                  <Trash2 size="16" />
                </v-btn>
              </div>
            </MotionStaggerItem>
          </MotionStaggerGroup>
          <p v-if="!dailyVerses.length" class="text-caption text-grey-darken-1 mb-0">
            Nenhum versículo publicado ainda.
          </p>
        </v-card>

        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
          <div class="d-flex align-center mb-4">
            <Megaphone size="18" :color="churchAccent" class="mr-2" />
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
              Avisos
            </h3>
          </div>

          <v-alert
            v-if="announcementSuccess"
            type="success"
            variant="tonal"
            density="compact"
            class="content-feedback-alert mb-3"
          >
            {{ announcementSuccess }}
          </v-alert>
          <v-alert
            v-if="announcementError"
            type="error"
            variant="tonal"
            density="compact"
            class="content-feedback-alert mb-3"
          >
            {{ announcementError }}
          </v-alert>

          <div class="content-form-stack">
            <div class="content-field">
              <div class="content-field-header">
                <label class="content-field-label">Título <span class="content-required">*</span></label>
                <span class="content-field-hint">Obrigatório</span>
              </div>
              <v-text-field
                v-model="announcementForm.title"
                label="Título"
                variant="outlined"
                color="purple-darken-3"
                hide-details="auto"
              />
            </div>
            <div class="content-field">
              <div class="content-field-header">
                <label class="content-field-label">Texto <span class="content-required">*</span></label>
                <span class="content-char-count">{{ announcementForm.body.length }} caracteres</span>
              </div>
              <v-textarea
                v-model="announcementForm.body"
                label="Texto"
                variant="outlined"
                color="purple-darken-3"
                auto-grow
                rows="2"
                hide-details="auto"
              />
            </div>
          </div>
          <p class="content-field-label mt-4 mb-2">Tipo <span class="content-required">*</span></p>
          <v-btn-toggle
            v-model="announcementForm.kind"
            color="purple-darken-3"
            variant="outlined"
            density="comfortable"
            mandatory
            class="mb-4 announcement-kind-toggle"
          >
            <v-btn value="ANNOUNCEMENT" class="text-none" size="small">Aviso</v-btn>
            <v-btn value="PASTOR_MESSAGE" class="text-none" size="small">Palavra</v-btn>
            <v-btn value="PRAYER" class="text-none" size="small">Oração</v-btn>
          </v-btn-toggle>
          <div class="content-inline-fields mb-2">
            <v-checkbox
              v-model="announcementForm.pinned"
              label="Fixar"
              color="purple-darken-3"
              hide-details
            />
            <v-text-field
              v-model="announcementForm.expiresAt"
              label="Expira em"
              type="date"
              variant="outlined"
              color="purple-darken-3"
              hide-details="auto"
            />
          </div>
          <AdminMediaAttachmentFields
            v-model:image-url="announcementForm.imageUrl"
            v-model:image-key="announcementForm.imageKey"
            v-model:video-url="announcementForm.videoUrl"
          />
          <v-switch
            v-model="announcementForm.isPublic"
            label="Publicar também na página pública da igreja"
            color="purple-darken-3"
            density="comfortable"
            hide-details
            class="mb-4"
          />
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isSavingAnnouncement"
              @click="saveAnnouncement"
            >
              {{ editingAnnouncementId ? "Salvar aviso" : "Publicar aviso" }}
            </v-btn>
            <v-btn
              v-if="editingAnnouncementId"
              variant="text"
              color="grey-darken-1"
              class="text-none"
              @click="resetAnnouncementForm"
            >
              Cancelar
            </v-btn>
          </div>
          <MotionStaggerGroup class="content-admin-list">
            <MotionStaggerItem
              v-for="announcement in announcements"
              :key="announcement.id"
              tag="div"
              class="content-admin-row"
            >
              <div class="min-w-0">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-chip size="x-small" variant="tonal" color="purple-darken-3">
                    {{ announcementKindLabel(announcement.kind) }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="announcement.isPublic ? 'teal-darken-2' : 'grey-darken-1'"
                  >
                    {{ announcement.isPublic ? "Público" : "Interno" }}
                  </v-chip>
                </div>
                <span>{{ announcement.title }}</span>
              </div>
              <div class="d-flex ga-1">
                <v-btn icon variant="text" color="grey-darken-1" size="small" @click="editAnnouncement(announcement)">
                  <Pencil size="16" />
                </v-btn>
                <v-btn icon variant="text" color="red-darken-2" size="small" @click="removeAnnouncement(announcement.id)">
                  <Trash2 size="16" />
                </v-btn>
              </div>
            </MotionStaggerItem>
          </MotionStaggerGroup>
        </v-card>
      </div>

      <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center">
            <Heart size="18" :color="churchAccent" class="mr-2" />
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
              Devocionais
            </h3>
          </div>
          <v-btn variant="tonal" color="purple-darken-3" size="small" class="text-none" @click="addDevotionalChapter">
            <Plus size="16" class="mr-1" /> Adicionar capítulo
          </v-btn>
        </div>

        <v-alert
          v-if="devotionalSuccess"
          type="success"
          variant="tonal"
          density="compact"
          class="content-feedback-alert mb-3"
        >
          {{ devotionalSuccess }}
        </v-alert>
        <v-alert
          v-if="devotionalError"
          type="error"
          variant="tonal"
          density="compact"
          class="content-feedback-alert mb-3"
        >
          {{ devotionalError }}
        </v-alert>

        <div class="content-admin-grid">
          <div>
            <div class="content-form-stack">
              <div class="content-field">
                <div class="content-field-header">
                  <label class="content-field-label">Título <span class="content-required">*</span></label>
                  <span class="content-field-hint">Obrigatório</span>
                </div>
                <v-text-field
                  v-model="devotionalForm.title"
                  label="Título"
                  variant="outlined"
                  color="purple-darken-3"
                  hide-details="auto"
                />
              </div>
              <div class="content-field">
                <div class="content-field-header">
                  <label class="content-field-label">Descrição</label>
                  <span class="content-field-hint">Opcional</span>
                </div>
                <v-textarea
                  v-model="devotionalForm.description"
                  label="Descrição"
                  variant="outlined"
                  color="purple-darken-3"
                  auto-grow
                  rows="2"
                  hide-details="auto"
                />
              </div>
              <div
                v-for="(chapter, index) in devotionalForm.chapters"
                :key="index"
                class="chapter-admin-box mb-3"
              >
                <div class="content-field">
                  <div class="content-field-header">
                    <label class="content-field-label">Capítulo {{ index + 1 }} <span class="content-required">*</span></label>
                    <span class="content-field-hint">Obrigatório</span>
                  </div>
                  <v-text-field
                    v-model="chapter.title"
                    :label="`Capítulo ${index + 1}`"
                    variant="outlined"
                    color="purple-darken-3"
                    class="mb-2"
                    hide-details="auto"
                  />
                </div>
                <div class="content-field">
                  <div class="content-field-header">
                    <label class="content-field-label">Referência bíblica</label>
                    <span class="content-field-hint">Opcional</span>
                  </div>
                  <v-text-field
                    v-model="chapter.bibleRef"
                    label="Referência bíblica"
                    variant="outlined"
                    color="purple-darken-3"
                    class="mb-2"
                    hide-details="auto"
                  />
                </div>
                <div class="content-field">
                  <div class="content-field-header">
                    <label class="content-field-label">Texto <span class="content-required">*</span></label>
                    <span class="content-field-hint">Obrigatório</span>
                  </div>
                  <v-textarea
                    v-model="chapter.content"
                    label="Texto"
                    variant="outlined"
                    color="purple-darken-3"
                    auto-grow
                    rows="3"
                    hide-details="auto"
                  />
                </div>
              </div>
            </div>
            <AdminMediaAttachmentFields
              v-model:image-url="devotionalForm.imageUrl"
              v-model:image-key="devotionalForm.imageKey"
              v-model:video-url="devotionalForm.videoUrl"
            />
            <v-switch
              v-model="devotionalForm.isPublic"
              label="Publicar também na página pública da igreja"
              color="purple-darken-3"
              density="comfortable"
              hide-details
              class="mb-3"
            />
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                color="purple-darken-3"
                class="text-none font-weight-bold"
                :loading="isSavingDevotional"
                @click="saveDevotional"
              >
                {{ editingDevotionalId ? "Salvar devocional" : "Criar devocional" }}
              </v-btn>
              <v-btn
                v-if="editingDevotionalId"
                variant="text"
                color="grey-darken-1"
                class="text-none"
                @click="resetDevotionalForm"
              >
                Cancelar
              </v-btn>
            </div>
          </div>
          <div class="content-admin-list">
            <div
              v-for="devotional in devotionals"
              :key="devotional.id"
              class="content-admin-row"
            >
              <div class="min-w-0">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="devotional.isPublic ? 'teal-darken-2' : 'grey-darken-1'"
                  >
                    {{ devotional.isPublic ? "Público" : "Interno" }}
                  </v-chip>
                </div>
                <span>{{ devotional.title }}</span>
              </div>
              <div class="d-flex ga-1">
                <v-btn icon variant="text" color="grey-darken-1" size="small" @click="editDevotional(devotional)">
                  <Pencil size="16" />
                </v-btn>
                <v-btn icon variant="text" color="red-darken-2" size="small" @click="removeDevotional(devotional.id)">
                  <Trash2 size="16" />
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle mt-4">
        <div class="d-flex align-center mb-1">
          <ImageIcon size="18" :color="churchAccent" class="mr-2" />
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
            Publicações
          </h3>
        </div>
        <p class="text-caption text-grey-darken-1 mb-4">
          Poste uma foto com título, texto e vídeo na página da igreja.
        </p>

        <v-alert
          v-if="postError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ postError }}
        </v-alert>

        <div class="content-admin-grid">
          <div>
            <v-text-field
              v-model="postForm.title"
              label="Título"
              variant="outlined"
              color="purple-darken-3"
              class="mb-3"
              hide-details="auto"
            />
            <v-textarea
              v-model="postForm.body"
              label="Texto"
              variant="outlined"
              color="purple-darken-3"
              auto-grow
              rows="3"
              class="mb-3"
              hide-details="auto"
            />

            <div class="post-image-field mb-3">
              <img
                v-if="postForm.imageUrl"
                :src="postForm.imageUrl"
                alt="Pré-visualização da foto"
                class="post-image-preview"
              />
              <div class="d-flex align-center flex-wrap ga-2">
                <v-btn
                  variant="tonal"
                  color="purple-darken-3"
                  size="small"
                  class="text-none"
                  :loading="isUploadingPostImage"
                  @click="postImageInput?.click()"
                >
                  <ImageIcon size="16" class="mr-1" />
                  {{ postForm.imageUrl ? "Trocar foto" : "Adicionar foto" }}
                </v-btn>
                <v-btn
                  v-if="postForm.imageUrl"
                  variant="text"
                  color="red-darken-2"
                  size="small"
                  class="text-none"
                  @click="clearPostImage"
                >
                  Remover
                </v-btn>
              </div>
              <input
                ref="postImageInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="d-none"
                @change="onPostImageChange"
              />
            </div>

            <v-text-field
              v-model="postForm.videoUrl"
              label="Link de vídeo (YouTube/Instagram)"
              variant="outlined"
              color="purple-darken-3"
              class="mb-3"
              hide-details="auto"
            />
            <v-switch
              v-model="postForm.isPublic"
              label="Aparecer na página pública da igreja"
              color="purple-darken-3"
              density="comfortable"
              hide-details
              class="mb-2"
            />
            <v-switch
              v-model="postForm.pinned"
              label="Fixar no topo"
              color="purple-darken-3"
              density="comfortable"
              hide-details
              class="mb-4"
            />
            <div class="d-flex ga-2">
              <v-btn
                color="purple-darken-3"
                class="text-none font-weight-bold"
                :loading="isSavingPost"
                @click="savePost"
              >
                {{ editingPostId ? "Salvar publicação" : "Publicar" }}
              </v-btn>
              <v-btn
                v-if="editingPostId"
                variant="text"
                color="grey-darken-1"
                class="text-none"
                @click="resetPostForm"
              >
                Cancelar
              </v-btn>
            </div>
          </div>

          <div class="content-admin-list">
            <div
              v-for="post in posts"
              :key="post.id"
              class="content-admin-row"
            >
              <div class="min-w-0">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="post.isPublic ? 'teal-darken-2' : 'grey-darken-1'"
                  >
                    {{ post.isPublic ? "Público" : "Interno" }}
                  </v-chip>
                  <v-chip v-if="post.pinned" size="x-small" variant="tonal" color="amber-darken-2">
                    Fixado
                  </v-chip>
                </div>
                <span>{{ post.title }}</span>
              </div>
              <div class="d-flex ga-1">
                <v-btn icon variant="text" color="grey-darken-1" size="small" @click="editPost(post)">
                  <Pencil size="16" />
                </v-btn>
                <v-btn icon variant="text" color="red-darken-2" size="small" @click="removePost(post.id)">
                  <Trash2 size="16" />
                </v-btn>
              </div>
            </div>
            <p v-if="!posts.length" class="text-caption text-grey-darken-1 mb-0">
              Nenhuma publicação ainda.
            </p>
          </div>
        </div>
      </v-card>
    </section>
  </div>

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada para pastores, admins ou membros com permissão de gestão.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  BookMarked,
  ChevronLeft,
  Heart,
  Image as ImageIcon,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { usePermissions } from "../../../composables/usePermissions";
import { useDailyVerse, type DailyVerse } from "../../../composables/useDailyVerse";
import {
  useAnnouncements,
  type Announcement,
} from "../../../composables/useAnnouncements";
import {
  useDevotionals,
  type Devotional,
} from "../../../composables/useDevotionals";
import { usePosts, type ChurchPost } from "../../../composables/usePosts";

const router = useRouter();

const { user } = useAuth();
const { can } = usePermissions();

const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isChurchWideManager = computed(
  () => user.value?.role === "PASTOR" || isPlatformAdmin.value,
);
const canManageMembersByRole = computed(
  () =>
    isChurchWideManager.value ||
    user.value?.canManageMembers === true ||
    can("MEMBER_CREATE") ||
    can("MEMBER_EDIT") ||
    can("MEMBER_DELETE"),
);
const canAccessChurchAdmin = computed(
  () =>
    user.value?.hasChurch === true &&
    canManageMembersByRole.value,
);

const currentChurch = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);

// Cor da igreja (mesma da pagina publica) para o tratamento editorial das telas
// de cadastro. Cai no terracota padrao quando a igreja nao escolheu uma cor.
const churchAccent = computed(() => currentChurch.value?.accentColor || "#B5472A");

const { listVerses, publishVerse, updateVerse, deleteVerse } = useDailyVerse();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = useAnnouncements();
const {
  listDevotionals,
  getDevotional,
  createDevotional,
  updateDevotional,
  deleteDevotional,
} = useDevotionals();
const {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  uploadImage: uploadPostImage,
} = usePosts();

const contentError = ref("");

const dailyVerses = ref<DailyVerse[]>([]);
const verseError = ref("");
const verseSuccess = ref("");
const editingVerseId = ref("");
const isPublishingVerse = ref(false);
const verseForm = reactive({
  text: "",
  reference: "",
  commentary: "",
  isPublic: false,
  imageUrl: "" as string | null,
  imageKey: "" as string | null,
  videoUrl: "",
});

const announcements = ref<Announcement[]>([]);
const announcementError = ref("");
const announcementSuccess = ref("");
const editingAnnouncementId = ref("");
const isSavingAnnouncement = ref(false);
const announcementForm = reactive({
  title: "",
  body: "",
  pinned: false,
  expiresAt: "",
  isPublic: false,
  kind: "ANNOUNCEMENT" as "ANNOUNCEMENT" | "PASTOR_MESSAGE" | "PRAYER",
  imageUrl: "" as string | null,
  imageKey: "" as string | null,
  videoUrl: "",
});

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 10);
};
const announcementKindLabel = (kind?: Announcement["kind"]) => {
  if (kind === "PASTOR_MESSAGE") return "Palavra";
  if (kind === "PRAYER") return "Oração";
  return "Aviso";
};

const devotionals = ref<Devotional[]>([]);
const devotionalError = ref("");
const devotionalSuccess = ref("");
const editingDevotionalId = ref("");
const isSavingDevotional = ref(false);
const devotionalForm = reactive({
  title: "",
  description: "",
  isPublic: false,
  imageUrl: "" as string | null,
  imageKey: "" as string | null,
  videoUrl: "",
  chapters: [
    {
      title: "",
      content: "",
      bibleRef: "",
    },
  ],
});

const posts = ref<ChurchPost[]>([]);
const postImageInput = ref<HTMLInputElement | null>(null);
const editingPostId = ref("");
const isSavingPost = ref(false);
const isUploadingPostImage = ref(false);
const postError = ref("");
const postForm = reactive({
  title: "",
  body: "",
  videoUrl: "",
  imageUrl: "" as string | null,
  imageKey: "" as string | null,
  isPublic: true,
  pinned: false,
});

const loadDailyVerses = async () => {
  const { data, error } = await listVerses();
  if (error) {
    verseError.value = error;
    return;
  }
  dailyVerses.value = data?.items ?? [];
};

const resetVerseForm = () => {
  editingVerseId.value = "";
  verseForm.text = "";
  verseForm.reference = "";
  verseForm.commentary = "";
  verseForm.isPublic = false;
  verseForm.imageUrl = "";
  verseForm.imageKey = "";
  verseForm.videoUrl = "";
};

const editVerse = (verse: DailyVerse) => {
  verseError.value = "";
  verseSuccess.value = "";
  editingVerseId.value = verse.id;
  verseForm.text = verse.text;
  verseForm.reference = verse.reference;
  verseForm.commentary = verse.commentary ?? "";
  verseForm.isPublic = verse.isPublic === true;
  verseForm.imageUrl = verse.imageUrl ?? "";
  verseForm.imageKey = verse.imageKey ?? "";
  verseForm.videoUrl = verse.videoUrl ?? "";
};

const saveDailyVerse = async () => {
  verseError.value = "";
  verseSuccess.value = "";

  if (!verseForm.text.trim() || !verseForm.reference.trim()) {
    verseError.value = "Informe o texto e a referência do versículo.";
    return;
  }

  isPublishingVerse.value = true;
  try {
    const wasEditingVerse = Boolean(editingVerseId.value);
    const payload = {
      text: verseForm.text.trim(),
      reference: verseForm.reference.trim(),
      commentary: verseForm.commentary.trim() || null,
      isPublic: verseForm.isPublic,
      imageUrl: verseForm.imageUrl || null,
      imageKey: verseForm.imageKey || null,
      videoUrl: verseForm.videoUrl.trim() || null,
    };

    const { data, error } = editingVerseId.value
      ? await updateVerse(editingVerseId.value, payload)
      : await publishVerse(payload);

    if (error || !data) {
      verseError.value = error || "Não foi possível salvar o versículo.";
      return;
    }

    dailyVerses.value = editingVerseId.value
      ? dailyVerses.value.map((verse) => (verse.id === data.id ? data : verse))
      : [data, ...dailyVerses.value];
    resetVerseForm();
    verseSuccess.value = wasEditingVerse ? "Versículo atualizado!" : "Versículo publicado!";
  } catch (error) {
    verseError.value = error instanceof Error ? error.message : "Não foi possível salvar o versículo.";
  } finally {
    isPublishingVerse.value = false;
  }
};

const removeVerse = async (id: string) => {
  verseError.value = "";
  verseSuccess.value = "";
  const { error } = await deleteVerse(id);
  if (error) {
    verseError.value = error;
    return;
  }
  dailyVerses.value = dailyVerses.value.filter((verse) => verse.id !== id);
};

const loadAnnouncements = async () => {
  const { data } = await getAnnouncements();
  announcements.value = data ?? [];
};

const resetAnnouncementForm = () => {
  editingAnnouncementId.value = "";
  announcementForm.title = "";
  announcementForm.body = "";
  announcementForm.pinned = false;
  announcementForm.expiresAt = "";
  announcementForm.isPublic = false;
  announcementForm.kind = "ANNOUNCEMENT";
  announcementForm.imageUrl = "";
  announcementForm.imageKey = "";
  announcementForm.videoUrl = "";
};

const editAnnouncement = (announcement: Announcement) => {
  announcementError.value = "";
  announcementSuccess.value = "";
  editingAnnouncementId.value = announcement.id;
  announcementForm.title = announcement.title;
  announcementForm.body = announcement.body;
  announcementForm.pinned = announcement.pinned;
  announcementForm.expiresAt = toDateInputValue(announcement.expiresAt);
  announcementForm.isPublic = announcement.isPublic === true;
  announcementForm.kind = announcement.kind ?? "ANNOUNCEMENT";
  announcementForm.imageUrl = announcement.imageUrl ?? "";
  announcementForm.imageKey = announcement.imageKey ?? "";
  announcementForm.videoUrl = announcement.videoUrl ?? "";
};

const saveAnnouncement = async () => {
  announcementError.value = "";
  announcementSuccess.value = "";

  if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
    announcementError.value = "Informe o título e o texto do aviso.";
    return;
  }

  isSavingAnnouncement.value = true;
  try {
    const wasEditingAnnouncement = Boolean(editingAnnouncementId.value);
    const payload = {
      title: announcementForm.title.trim(),
      body: announcementForm.body.trim(),
      pinned: announcementForm.pinned,
      expiresAt: announcementForm.expiresAt || null,
      isPublic: announcementForm.isPublic,
      kind: announcementForm.kind,
      imageUrl: announcementForm.imageUrl || null,
      imageKey: announcementForm.imageKey || null,
      videoUrl: announcementForm.videoUrl.trim() || null,
    };

    const { data, error } = editingAnnouncementId.value
      ? await updateAnnouncement(editingAnnouncementId.value, payload)
      : await createAnnouncement(payload);

    if (error || !data) {
      announcementError.value = error || "Não foi possível salvar o aviso.";
      return;
    }

    announcements.value = editingAnnouncementId.value
      ? announcements.value.map((announcement) =>
          announcement.id === data.id ? data : announcement,
        )
      : [data, ...announcements.value];
    resetAnnouncementForm();
    announcementSuccess.value = wasEditingAnnouncement ? "Aviso atualizado!" : "Aviso publicado!";
  } catch (error) {
    announcementError.value = error instanceof Error ? error.message : "Não foi possível salvar o aviso.";
  } finally {
    isSavingAnnouncement.value = false;
  }
};

const removeAnnouncement = async (id: string) => {
  announcementError.value = "";
  announcementSuccess.value = "";
  const { error } = await deleteAnnouncement(id);
  if (error) {
    announcementError.value = error;
    return;
  }
  announcements.value = announcements.value.filter((announcement) => announcement.id !== id);
};

const loadDevotionals = async () => {
  const { data } = await listDevotionals();
  devotionals.value = data ?? [];
};

const addDevotionalChapter = () => {
  devotionalForm.chapters.push({
    title: "",
    content: "",
    bibleRef: "",
  });
};

const resetDevotionalForm = () => {
  editingDevotionalId.value = "";
  devotionalForm.title = "";
  devotionalForm.description = "";
  devotionalForm.isPublic = false;
  devotionalForm.imageUrl = "";
  devotionalForm.imageKey = "";
  devotionalForm.videoUrl = "";
  devotionalForm.chapters = [{ title: "", content: "", bibleRef: "" }];
};

const editDevotional = async (devotional: Devotional) => {
  devotionalError.value = "";
  devotionalSuccess.value = "";
  const fullDevotional = devotional.chapters?.length
    ? devotional
    : (await getDevotional(devotional.id)).data;

  if (!fullDevotional) {
    devotionalError.value = "Não foi possível carregar o devocional.";
    return;
  }

  editingDevotionalId.value = fullDevotional.id;
  devotionalForm.title = fullDevotional.title;
  devotionalForm.description = fullDevotional.description ?? "";
  devotionalForm.isPublic = fullDevotional.isPublic === true;
  devotionalForm.imageUrl = fullDevotional.imageUrl ?? "";
  devotionalForm.imageKey = fullDevotional.imageKey ?? "";
  devotionalForm.videoUrl = fullDevotional.videoUrl ?? "";
  devotionalForm.chapters = fullDevotional.chapters?.length
    ? fullDevotional.chapters.map((chapter) => ({
        title: chapter.title,
        content: chapter.content,
        bibleRef: chapter.bibleRef ?? "",
      }))
    : [{ title: "", content: "", bibleRef: "" }];
};

const saveDevotional = async () => {
  devotionalError.value = "";
  devotionalSuccess.value = "";
  const chapters = devotionalForm.chapters
    .map((chapter) => ({
      title: chapter.title.trim(),
      content: chapter.content.trim(),
      bibleRef: chapter.bibleRef.trim() || null,
    }))
    .filter((chapter) => chapter.title && chapter.content);

  if (!devotionalForm.title.trim() || chapters.length === 0) {
    devotionalError.value = "Informe o título e ao menos um capítulo.";
    return;
  }

  isSavingDevotional.value = true;
  try {
    const wasEditingDevotional = Boolean(editingDevotionalId.value);
    const payload = {
      title: devotionalForm.title.trim(),
      description: devotionalForm.description.trim() || null,
      isPublic: devotionalForm.isPublic,
      imageUrl: devotionalForm.imageUrl || null,
      imageKey: devotionalForm.imageKey || null,
      videoUrl: devotionalForm.videoUrl.trim() || null,
      chapters,
    };

    const { data, error } = editingDevotionalId.value
      ? await updateDevotional(editingDevotionalId.value, payload)
      : await createDevotional(payload);

    if (error || !data) {
      devotionalError.value = error || "Não foi possível salvar o devocional.";
      return;
    }

    devotionals.value = editingDevotionalId.value
      ? devotionals.value.map((devotional) =>
          devotional.id === data.id ? data : devotional,
        )
      : [data, ...devotionals.value];
    resetDevotionalForm();
    devotionalSuccess.value = wasEditingDevotional ? "Devocional atualizado!" : "Devocional publicado!";
  } catch (error) {
    devotionalError.value = error instanceof Error ? error.message : "Não foi possível salvar o devocional.";
  } finally {
    isSavingDevotional.value = false;
  }
};

const removeDevotional = async (id: string) => {
  devotionalError.value = "";
  devotionalSuccess.value = "";
  const { error } = await deleteDevotional(id);
  if (error) {
    devotionalError.value = error;
    return;
  }
  devotionals.value = devotionals.value.filter((devotional) => devotional.id !== id);
};

const loadPosts = async () => {
  const { data } = await listPosts();
  posts.value = data ?? [];
};

const resetPostForm = () => {
  editingPostId.value = "";
  postForm.title = "";
  postForm.body = "";
  postForm.videoUrl = "";
  postForm.imageUrl = "";
  postForm.imageKey = "";
  postForm.isPublic = true;
  postForm.pinned = false;
  if (postImageInput.value) postImageInput.value.value = "";
};

const onPostImageChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  postError.value = "";
  isUploadingPostImage.value = true;
  try {
    const { data, error } = await uploadPostImage(file);
    if (error || !data) {
      postError.value = error || "Não foi possível enviar a imagem.";
      return;
    }
    postForm.imageUrl = data.url;
    postForm.imageKey = data.key;
  } finally {
    isUploadingPostImage.value = false;
  }
};

const clearPostImage = () => {
  postForm.imageUrl = "";
  postForm.imageKey = "";
  if (postImageInput.value) postImageInput.value.value = "";
};

const editPost = (post: ChurchPost) => {
  editingPostId.value = post.id;
  postForm.title = post.title;
  postForm.body = post.body ?? "";
  postForm.videoUrl = post.videoUrl ?? "";
  postForm.imageUrl = post.imageUrl ?? "";
  postForm.imageKey = post.imageKey ?? "";
  postForm.isPublic = post.isPublic;
  postForm.pinned = post.pinned;
};

const savePost = async () => {
  postError.value = "";
  if (!postForm.title.trim()) {
    postError.value = "Título da publicação é obrigatório.";
    return;
  }
  isSavingPost.value = true;
  try {
    const payload = {
      title: postForm.title.trim(),
      body: postForm.body.trim() || null,
      videoUrl: postForm.videoUrl.trim() || null,
      imageUrl: postForm.imageUrl || null,
      imageKey: postForm.imageKey || null,
      isPublic: postForm.isPublic,
      pinned: postForm.pinned,
    };
    if (editingPostId.value) {
      const { data, error } = await updatePost(editingPostId.value, payload);
      if (error || !data) { postError.value = error || "Erro ao salvar publicação."; return; }
      posts.value = posts.value.map((item) => (item.id === data.id ? data : item));
    } else {
      const { data, error } = await createPost(payload);
      if (error || !data) { postError.value = error || "Erro ao publicar."; return; }
      posts.value = [data, ...posts.value];
    }
    resetPostForm();
  } finally {
    isSavingPost.value = false;
  }
};

const removePost = async (id: string) => {
  postError.value = "";
  const { error } = await deletePost(id);
  if (error) { postError.value = error; return; }
  posts.value = posts.value.filter((item) => item.id !== id);
  if (editingPostId.value === id) resetPostForm();
};

onMounted(async () => {
  await Promise.all([
    canAccessChurchAdmin.value ? loadDailyVerses() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadAnnouncements() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadDevotionals() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadPosts() : Promise.resolve(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}
.border-subtle {
  border: 1px solid #f3f4f6;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.publicacoes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

.church-admin-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading .v-btn {
  flex: 0 0 auto;
}

.permission-empty {
  min-height: 320px;
}

.content-admin-grid {
  display: grid;
  /* auto-fit + minmax faz o grid decidir sozinho quantas colunas cabem,
     em vez de depender de um breakpoint fixo que pode nao bater com a
     largura real do container (padding, app frame, etc). */
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.content-form-stack {
  display: grid;
  gap: 14px;
  margin-bottom: 12px;
}

.content-field {
  min-width: 0;
}

.content-field-header {
  align-items: baseline;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 6px;
}

.content-field-label {
  color: var(--e-ink, #374151);
  display: inline-block;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.2;
}

.content-required {
  color: var(--church-accent, #B5472A);
}

.content-field-hint,
.content-char-count {
  color: var(--e-ink-soft, #6B655C);
  flex: 0 0 auto;
  font-size: 0.72rem;
  font-weight: 700;
}

.content-feedback-alert {
  border-radius: 10px;
}

.post-image-preview {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 8px;
}

.content-inline-fields {
  display: grid;
  grid-template-columns: minmax(120px, auto) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.content-admin-list {
  display: grid;
  gap: 8px;
}

.content-admin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 8px 10px;
}

.content-admin-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
}

.chapter-admin-box {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 12px;
}

@media (max-width: 520px) {
  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .content-admin-grid,
  .content-inline-fields {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .v-btn {
    width: 100%;
  }
}
</style>
