<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="ministery-back-row mb-4">
      <v-btn icon variant="text" class="mr-2" @click="router.back()">
        <ArrowLeft size="20" />
      </v-btn>
      <span class="text-body-2 text-grey-darken-1 font-weight-medium">
        Ministérios
      </span>
    </div>

    <v-alert
      v-if="departmentError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ departmentError }}
    </v-alert>

    <template v-if="department">
      <div class="ministery-detail-header mb-5">
        <div class="min-w-0">
          <p class="text-caption text-purple-darken-3 font-weight-bold mb-1">
            {{ departmentTypeLabel(department.type) }}
          </p>
          <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
            {{ department.name }}
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            {{ department.leader.name }}
          </p>
        </div>

        <v-chip
          size="small"
          :color="department.isActive ? 'teal-darken-2' : 'grey-darken-1'"
          variant="tonal"
        >
          {{ department.isActive ? "Ativo" : "Inativo" }}
        </v-chip>
      </div>

      <div class="ministery-detail-summary mb-5">
        <div
          v-for="item in detailSummary"
          :key="item.label"
          class="ministery-detail-summary-item"
        >
          <span>{{ item.value }}</span>
          <small>{{ item.label }}</small>
        </div>
      </div>

      <div class="tabs-row mb-5">
        <v-chip
          v-for="tab in tabs"
          :key="tab.value"
          :variant="activeTab === tab.value ? 'flat' : 'outlined'"
          :color="activeTab === tab.value ? '#A855F7' : 'grey-darken-1'"
          class="tab-chip font-weight-medium cursor-pointer"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" size="16" class="tab-chip-icon" />
          <span class="tab-chip-label">{{ tab.label }}</span>
        </v-chip>
      </div>

      <section v-if="activeTab === 'overview'" class="ministery-card-grid">
        <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
          <p class="text-caption text-grey-darken-1 mb-1">Líder</p>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            {{ department.leader.name }}
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            {{ department.leader.email }}
          </p>
        </v-card>

        <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
          <p class="text-caption text-grey-darken-1 mb-1">Status</p>
          <v-chip
            size="small"
            :color="department.isActive ? 'teal-darken-2' : 'grey-darken-1'"
            variant="tonal"
          >
            {{ department.isActive ? "Ativo" : "Inativo" }}
          </v-chip>
        </v-card>
      </section>

      <section v-if="activeTab === 'schedules'">
        <div class="ministery-section-actions mb-4">
          <v-btn
            v-if="canManageSchedules"
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isScheduleDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova escala
          </v-btn>
        </div>

        <v-card
          v-if="schedules.length === 0 && !schedulesError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <Calendar size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma escala ainda
          </p>
        </v-card>

        <div v-else class="ministery-card-grid">
          <v-card
            v-for="schedule in schedules"
            :key="schedule.id"
            class="ministery-content-card pa-4 elevation-1 bg-white"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ schedule.description }}
                </h3>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ formatScheduleDate(schedule.date) }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                {{ schedule.assignments?.length || 0 }} voluntários
              </v-chip>
            </div>

            <div
              v-if="schedule.mediaItems?.length"
              class="schedule-media-list mt-3"
            >
              <v-chip
                v-for="item in schedule.mediaItems"
                :key="item.id"
                size="small"
                :color="item.mediaItem.category === 'MUSIC' ? 'purple-darken-3' : 'teal-darken-2'"
                variant="tonal"
                class="schedule-media-chip"
                @click="openScheduleMediaItem(item.mediaItem)"
              >
                {{ item.mediaItem.title }}
              </v-chip>
            </div>

            <div
              v-if="schedule.assignments?.length"
              class="schedule-assignment-list mt-3"
            >
              <div
                v-for="assignment in schedule.assignments"
                :key="assignment.id"
                class="schedule-assignment-item"
              >
                <span class="schedule-assignment-name">
                  {{ assignment.user.name }}
                </span>
                <span class="schedule-assignment-role">
                  {{ assignment.role }}
                </span>
              </div>
            </div>

            <div v-if="canManageSchedules" class="ministery-card-actions mt-3">
              <v-btn
                variant="text"
                color="primary"
                class="text-none font-weight-medium"
                size="small"
                @click="openAssignmentsDialog(schedule)"
              >
                <UserPlus size="16" class="mr-2" />
                Adicionar voluntário
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openScheduleEditDialog(schedule)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="handleDeleteSchedule(schedule)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="schedulesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ schedulesError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'tasks'">
        <div class="ministery-section-actions mb-4">
          <v-btn
            v-if="canManageDepartment"
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isTaskDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova tarefa
          </v-btn>
        </div>

        <v-card
          v-if="tasks.length === 0 && !tasksError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <CheckSquare size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma tarefa ainda
          </p>
        </v-card>

        <div v-else class="ministery-card-grid">
          <v-card
            v-for="task in tasks"
            :key="task.id"
            class="ministery-content-card pa-4 elevation-1 bg-white"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ task.title }}
                </h3>
                <p
                  v-if="task.description"
                  class="text-caption text-grey-darken-1 mb-2"
                >
                  {{ task.description }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  Responsável: {{ task.assignee?.name || "Sem responsável" }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                {{ priorityLabel(task.priority) }}
              </v-chip>
            </div>
            <div v-if="canManageDepartment" class="ministery-card-actions mt-3">
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openTaskEditDialog(task)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="handleDeleteTask(task)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="tasksError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ tasksError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'resources'">
        <div class="ministery-section-actions mb-4">
          <v-btn
            v-if="canManageDepartment"
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isResourceDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Novo recurso
          </v-btn>
        </div>

        <v-card
          v-if="resourceMaterials.length === 0 && !resourcesError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <FileText size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhum recurso cadastrado ainda
          </p>
        </v-card>

        <div v-else class="ministery-card-grid">
          <v-card
            v-for="resource in resourceMaterials"
            :key="resource.id"
            class="ministery-content-card pa-4 elevation-1 bg-white"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ resource.title }}
                </h3>
                <a
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-caption text-purple-darken-3"
                >
                  {{ resource.url }}
                </a>
                <p
                  v-if="resource.metadata?.notes"
                  class="text-caption text-grey-darken-1 mt-2 mb-0"
                >
                  {{ resource.metadata.notes }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                {{ resource.category }}
              </v-chip>
            </div>
            <div v-if="canManageDepartment" class="ministery-card-actions mt-3">
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openResourceEditDialog(resource)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="handleDeleteResource(resource)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="resourcesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ resourcesError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'songs'">
        <div class="ministery-section-actions mb-4">
          <v-btn
            v-if="canManageDepartment"
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isSongDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova música
          </v-btn>
        </div>

        <v-card
          v-if="songs.length === 0 && !songsError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <Music size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma música no repertório
          </p>
        </v-card>

        <div v-else class="ministery-card-grid">
          <v-card
            v-for="song in songs"
            :key="song.id"
            class="ministery-content-card pa-4 elevation-1 bg-white song-click-card"
            role="button"
            tabindex="0"
            @click="openSongViewer(song)"
            @keydown.enter="openSongViewer(song)"
            @keydown.space.prevent="openSongViewer(song)"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div class="min-w-0">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1 text-truncate">
                  {{ song.title }}
                </h3>
                <p class="text-caption text-grey-darken-1 mb-1 text-truncate">
                  {{ song.metadata?.artist || "Artista não informado" }}
                </p>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip size="x-small" color="purple-darken-3" variant="tonal">
                    {{ song.metadata?.songCategory || "Louvor" }}
                  </v-chip>
                  <v-chip v-if="song.metadata?.key" size="x-small" variant="tonal">
                    Tom {{ song.metadata.key }}
                  </v-chip>
                  <v-chip v-if="song.metadata?.bpm" size="x-small" variant="tonal">
                    {{ song.metadata.bpm }} BPM
                  </v-chip>
                  <v-chip
                    v-if="song.metadata?.lyrics"
                    size="x-small"
                    color="indigo-darken-2"
                    variant="tonal"
                  >
                    Letra
                  </v-chip>
                  <v-chip
                    v-if="song.metadata?.chords"
                    size="x-small"
                    color="teal-darken-2"
                    variant="tonal"
                  >
                    Cifra
                  </v-chip>
                  <v-chip
                    v-if="song.metadata?.pdf?.url"
                    size="x-small"
                    color="deep-purple-darken-2"
                    variant="tonal"
                  >
                    PDF
                  </v-chip>
                </div>
              </div>
              <v-btn
                v-if="song.url"
                :href="song.url"
                target="_blank"
                rel="noopener noreferrer"
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click.stop
              >
                <ExternalLink size="16" />
              </v-btn>
            </div>

            <p
              v-if="song.metadata?.notes"
              class="text-caption text-grey-darken-1 mt-3 mb-0"
            >
              {{ song.metadata.notes }}
            </p>

            <div v-if="song.metadata?.pdf?.url" class="mt-3">
              <v-btn
                :href="song.metadata.pdf.url"
                target="_blank"
                rel="noopener noreferrer"
                variant="tonal"
                color="purple-darken-3"
                size="small"
                class="text-none"
              >
                <FileText size="16" class="mr-2" /> Abrir PDF
              </v-btn>
            </div>

            <div v-if="canManageDepartment" class="ministery-card-actions mt-3">
              <v-btn
                icon
                variant="text"
                color="purple-darken-3"
                size="small"
                @click.stop="openSongViewer(song)"
              >
                <BookOpen size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click.stop="openSongEditDialog(song)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click.stop="handleDeleteSong(song)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>

            <div
              v-else-if="song.metadata?.lyrics || song.metadata?.chords"
              class="d-flex justify-end mt-3"
            >
              <v-btn
                variant="tonal"
                color="purple-darken-3"
                size="small"
                class="text-none"
                @click.stop="openSongViewer(song)"
              >
                Ver letra e cifra
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="songsError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ songsError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'classes'">
        <div class="ministery-section-actions mb-4">
          <v-btn
            v-if="canManageDepartment"
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isActivityDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova atividade
          </v-btn>
        </div>

        <v-card
          v-if="activityResources.length === 0 && !resourcesError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <BookOpen size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma atividade cadastrada ainda
          </p>
        </v-card>

        <div v-else class="ministery-card-grid">
          <v-card
            v-for="activity in activityResources"
            :key="activity.id"
            class="ministery-content-card pa-4 elevation-1 bg-white"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div class="min-w-0">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ activity.title }}
                </h3>
                <p
                  v-if="activity.metadata?.notes"
                  class="text-caption text-grey-darken-1 mb-0"
                >
                  {{ activity.metadata.notes }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                PDF
              </v-chip>
            </div>

            <div class="ministery-card-actions mt-3">
              <v-btn
                :href="activity.url"
                target="_blank"
                rel="noopener noreferrer"
                variant="tonal"
                color="purple-darken-3"
                size="small"
                class="text-none"
              >
                <FileText size="16" class="mr-2" /> Abrir PDF
              </v-btn>
              <v-btn
                v-if="canManageDepartment"
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="handleDeleteResource(activity)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="resourcesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ resourcesError }}
        </v-alert>
      </section>
    </template>

    <UtilsResponsiveOverlay v-model="isScheduleDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <Calendar size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingScheduleId ? "Editar escala" : "Nova escala" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie uma escala para este ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveSchedule">
          <v-text-field
            v-model="scheduleForm.title"
            label="Título"
            prepend-inner-icon="mdi-calendar-text-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <div class="ministery-field-grid mb-4">
            <v-text-field
              v-model="scheduleForm.date"
              label="Data"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
            <v-text-field
              v-model="scheduleForm.time"
              label="Horário"
              type="time"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
          </div>

          <div class="ministery-field-grid mb-4">
            <v-text-field
              v-model="scheduleForm.rehearsalDate"
              label="Data do ensaio"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
            <v-text-field
              v-model="scheduleForm.rehearsalTime"
              label="Hora do ensaio"
              type="time"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
          </div>

          <v-text-field
            v-model="scheduleForm.rehearsalNotes"
            label="Observações do ensaio"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <v-select
            v-if="songOptions.length"
            v-model="scheduleForm.songIds"
            label="Músicas"
            :items="songOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-music-note-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            multiple
            chips
            closable-chips
            :disabled="isCreatingSchedule"
          />

          <v-select
            v-if="resourceOptions.length"
            v-model="scheduleForm.resourceIds"
            label="Recursos"
            :items="resourceOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-file-document-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            multiple
            chips
            closable-chips
            :disabled="isCreatingSchedule"
          />

          <v-alert
            v-if="createScheduleError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createScheduleError }}
          </v-alert>

          <div class="dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingSchedule"
              @click="closeScheduleDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingSchedule"
              :disabled="isCreatingSchedule"
            >
              {{ editingScheduleId ? "Salvar escala" : "Criar escala" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isResourceDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <FileText size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingResourceId ? "Editar recurso" : "Novo recurso" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Adicione um link, arquivo ou material do ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveResource">
          <v-text-field
            v-model="resourceForm.title"
            label="Título"
            prepend-inner-icon="mdi-file-document-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-text-field
            v-model="resourceForm.url"
            label="Link"
            prepend-inner-icon="mdi-link-variant"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-text-field
            v-model="resourceForm.category"
            label="Categoria"
            prepend-inner-icon="mdi-tag-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-text-field
            v-model="resourceForm.notes"
            label="Observações"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-alert
            v-if="createResourceError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createResourceError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingResource"
              @click="closeResourceDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingResource"
              :disabled="isCreatingResource"
            >
              {{ editingResourceId ? "Salvar recurso" : "Criar recurso" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isSongDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <Music size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingSongId ? "Editar música" : "Nova música" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Organize o repertório do ministério de louvor.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveSong">
          <v-text-field
            v-model="songForm.title"
            label="Título"
            prepend-inner-icon="mdi-music-note-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSong"
          />

          <v-text-field
            v-model="songForm.artist"
            label="Artista"
            prepend-inner-icon="mdi-account-music-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSong"
          />

          <div class="d-flex ga-3 mb-4">
            <v-text-field
              v-model="songForm.key"
              label="Tom"
              placeholder="ex: G, Am"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSong"
            />
            <v-text-field
              v-model="songForm.bpm"
              label="BPM"
              placeholder="ex: 72"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSong"
            />
          </div>

          <v-select
            v-model="songForm.songCategory"
            label="Categoria"
            :items="songCategoryOptions"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSong"
          />

          <v-text-field
            v-model="songForm.url"
            label="Link da cifra"
            prepend-inner-icon="mdi-link-variant"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSong"
          />

          <v-text-field
            v-model="songForm.notes"
            label="Observações"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSong"
          />

          <v-textarea
            v-model="songForm.lyrics"
            label="Letra"
            prepend-inner-icon="mdi-format-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            rows="5"
            auto-grow
            :disabled="isCreatingSong"
          />

          <v-textarea
            v-model="songForm.chords"
            label="Cifra"
            prepend-inner-icon="mdi-guitar-acoustic"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4 chords-input"
            hide-details="auto"
            rows="6"
            auto-grow
            :disabled="isCreatingSong"
          />

          <div v-if="songForm.pdfUrl && !songForm.removePdf" class="pdf-current-card mb-4">
            <div class="min-w-0">
              <p class="text-caption font-weight-bold text-grey-darken-4 mb-0">
                PDF anexado
              </p>
              <a
                :href="songForm.pdfUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-caption text-purple-darken-3"
              >
                {{ songForm.pdfFileName || "Abrir PDF" }}
              </a>
            </div>
            <v-btn
              variant="text"
              color="red-darken-2"
              size="small"
              class="text-none"
              :disabled="isCreatingSong"
              @click="removeSongPdf"
            >
              Remover
            </v-btn>
          </div>

          <v-file-input
            v-model="songPdfFile"
            label="PDF da música"
            accept="application/pdf"
            prepend-inner-icon="mdi-file-pdf-box"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            show-size
            clearable
            :disabled="isCreatingSong"
          />

          <v-alert
            v-if="createSongError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createSongError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingSong"
              @click="closeSongDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingSong"
              :disabled="isCreatingSong"
            >
              {{ editingSongId ? "Salvar música" : "Criar música" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay
      v-model="isSongViewerOpen"
      max-width="760"
      scrollable
      mobile-class="song-viewer-mobile-sheet"
    >
      <v-card v-if="selectedSong" class="rounded-xl bg-white song-viewer" elevation="0">
        <div class="song-viewer-header">
          <div class="min-w-0">
            <p class="text-caption text-purple-darken-3 font-weight-bold mb-1">
              {{ selectedSong.metadata?.songCategory || "Louvor" }}
            </p>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ selectedSong.title }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
              {{ selectedSong.metadata?.artist || "Artista não informado" }}
            </p>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" @click="closeSongViewer">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="song-viewer-body">
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-chip v-if="selectedSong.metadata?.key" size="small" variant="tonal">
              Tom {{ selectedSong.metadata.key }}
            </v-chip>
            <v-chip v-if="selectedSong.metadata?.bpm" size="small" variant="tonal">
              {{ selectedSong.metadata.bpm }} BPM
            </v-chip>
            <v-btn
              v-if="selectedSong.url"
              :href="selectedSong.url"
              target="_blank"
              rel="noopener noreferrer"
              color="purple-darken-3"
              variant="tonal"
              size="small"
              class="text-none"
            >
              Abrir link
            </v-btn>
            <v-btn
              v-if="selectedSong.metadata?.pdf?.url"
              :href="selectedSong.metadata.pdf.url"
              target="_blank"
              rel="noopener noreferrer"
              color="purple-darken-3"
              variant="tonal"
              size="small"
              class="text-none"
            >
              Abrir PDF
            </v-btn>
          </div>

          <v-tabs v-model="songViewerTab" color="purple-darken-3" class="mb-4">
            <v-tab value="lyrics" class="text-none">Letra</v-tab>
            <v-tab value="chords" class="text-none">Cifra</v-tab>
            <v-tab value="notes" class="text-none">Tom</v-tab>
          </v-tabs>

          <pre v-if="songViewerTab === 'lyrics'" class="song-text-block">{{ selectedSong.metadata?.lyrics || "Letra não cadastrada." }}</pre>
          <div v-else-if="songViewerTab === 'chords'" class="personal-chords-panel">
            <div class="personal-chords-heading">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  Minha cifra
                </h3>
                <p class="text-caption text-grey-darken-1 mb-0">
                  Esta versão aparece somente para você.
                </p>
              </div>
              <v-chip v-if="personalSongForm.personalKey" size="small" variant="tonal">
                Meu tom {{ personalSongForm.personalKey }}
              </v-chip>
            </div>

            <v-text-field
              v-model="personalSongForm.personalKey"
              label="Meu tom"
              placeholder="ex: C, Dm, F#"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-3"
              hide-details="auto"
              :disabled="isLoadingSongPreference || isSavingSongPreference"
            />

            <v-textarea
              v-model="personalSongForm.chords"
              label="Minha cifra"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input chords-input mb-3"
              hide-details="auto"
              rows="9"
              auto-grow
              :disabled="isLoadingSongPreference || isSavingSongPreference"
            />

            <div class="personal-chords-actions">
              <div class="d-flex ga-2">
                <v-btn
                  variant="tonal"
                  color="grey-darken-1"
                  size="small"
                  class="text-none"
                  @click="transposePersonalChords(-1)"
                >
                  -1 tom
                </v-btn>
                <v-btn
                  variant="tonal"
                  color="grey-darken-1"
                  size="small"
                  class="text-none"
                  @click="transposePersonalChords(1)"
                >
                  +1 tom
                </v-btn>
              </div>
              <v-btn
                variant="text"
                color="grey-darken-1"
                class="text-none"
                :disabled="isLoadingSongPreference || isSavingSongPreference"
                @click="useOfficialChords"
              >
                Usar cifra da escala
              </v-btn>
              <v-btn
                color="purple-darken-3"
                class="text-none"
                :loading="isSavingSongPreference"
                :disabled="isLoadingSongPreference"
                @click="saveSongPreference"
              >
                Salvar minha cifra
              </v-btn>
            </div>

            <v-alert
              v-if="songPreferenceError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ songPreferenceError }}
            </v-alert>
          </div>
          <pre v-else class="song-text-block">{{ selectedSongToneText }}</pre>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isActivityDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <BookOpen size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Nova atividade
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Salve o material em PDF do ministério infantil.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveActivity">
          <v-text-field
            v-model="activityForm.title"
            label="Título"
            prepend-inner-icon="mdi-book-open-page-variant-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingActivity"
          />

          <v-text-field
            v-model="activityForm.notes"
            label="Observações"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingActivity"
          />

          <v-file-input
            v-model="activityPdfFile"
            label="PDF da atividade"
            accept="application/pdf"
            prepend-inner-icon="mdi-file-pdf-box"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            show-size
            clearable
            :disabled="isCreatingActivity"
          />

          <v-alert
            v-if="createActivityError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createActivityError }}
          </v-alert>

          <div class="dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingActivity"
              @click="closeActivityDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingActivity"
              :disabled="isCreatingActivity"
            >
              Salvar atividade
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isAssignmentsDialogOpen" max-width="560">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <UserPlus size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Voluntários da escala
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ selectedSchedule?.description || "Monte a equipe da escala." }}
            </p>
          </div>
        </div>

        <div class="ministery-field-grid mb-4">
          <v-select
            v-model="assignmentForm.userId"
            label="Voluntário"
            :items="memberOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isSavingAssignments"
          />
          <v-text-field
            v-model="assignmentForm.role"
            label="Função"
            placeholder="ex: Vocal"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isSavingAssignments"
          />
        </div>

        <v-btn
          color="#A855F7"
          variant="tonal"
          class="text-none mb-4"
          :disabled="isSavingAssignments"
          @click="addDraftAssignment"
        >
          <Plus size="18" class="mr-1" /> Adicionar voluntário
        </v-btn>

        <div v-if="draftAssignments.length" class="d-flex flex-column ga-2 mb-4">
          <v-card
            v-for="assignment in draftAssignments"
            :key="assignment.userId"
            class="rounded-lg pa-3 bg-grey-lighten-5"
            elevation="0"
          >
            <div class="d-flex justify-space-between align-center ga-3">
              <div class="min-w-0">
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ assignment.name }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ assignment.role }}
                </p>
                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-chip
                    size="x-small"
                    :color="assignment.viewedAt ? 'indigo-darken-2' : 'grey'"
                    variant="tonal"
                  >
                    {{ assignment.viewedAt ? "Viu" : "Não viu" }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    :color="responseStatusColor(assignment.confirmationStatus)"
                    variant="tonal"
                  >
                    {{ responseStatusLabel(assignment.confirmationStatus) }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    :color="assignment.attendanceStatus === 'PRESENT' ? 'teal-darken-2' : assignment.attendanceStatus === 'ABSENT' ? 'red-darken-2' : 'grey'"
                    variant="tonal"
                  >
                    {{ attendanceStatusLabel(assignment.attendanceStatus) }}
                  </v-chip>
                </div>
              </div>
              <div class="d-flex align-center ga-1">
                <v-btn
                  icon
                  variant="text"
                  color="teal-darken-2"
                  size="small"
                  :disabled="isSavingAssignments"
                  @click="markAttendance(assignment, 'PRESENT')"
                >
                  <v-icon size="18">mdi-check-circle-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  color="red-darken-2"
                  size="small"
                  :disabled="isSavingAssignments"
                  @click="markAttendance(assignment, 'ABSENT')"
                >
                  <v-icon size="18">mdi-close-circle-outline</v-icon>
                </v-btn>
              </div>
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                :disabled="isSavingAssignments"
                @click="removeDraftAssignment(assignment.userId)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-card
          v-else
          class="rounded-lg pa-5 bg-grey-lighten-5 text-center mb-4"
          elevation="0"
        >
          <p class="text-caption text-grey-darken-1 mb-0">
            Nenhum voluntário adicionado nesta escala.
          </p>
        </v-card>

        <v-alert
          v-if="assignmentsError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ assignmentsError }}
        </v-alert>

        <div class="dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isSavingAssignments"
            @click="closeAssignmentsDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isSavingAssignments"
            :disabled="isSavingAssignments"
            @click="saveAssignments"
          >
            Salvar voluntários
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isTaskDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <CheckSquare size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingTaskId ? "Editar tarefa" : "Nova tarefa" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie uma tarefa para este ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveTask">
          <v-text-field
            v-model="taskForm.title"
            label="Título"
            prepend-inner-icon="mdi-checkbox-marked-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingTask"
          />

          <v-text-field
            v-model="taskForm.description"
            label="Descrição"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingTask"
          />

          <v-select
            v-model="taskForm.priority"
            label="Prioridade"
            :items="priorityOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-flag-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingTask"
          />

          <v-select
            v-model="taskForm.assigneeId"
            label="Responsável"
            :items="memberOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            clearable
            :disabled="isCreatingTask"
          />

          <v-alert
            v-if="createTaskError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createTaskError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingTask"
              @click="closeTaskDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingTask"
              :disabled="isCreatingTask"
            >
              {{ editingTaskId ? "Salvar tarefa" : "Criar tarefa" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isDeleteDialogOpen"
      :title="deleteDialogTitle"
      :message="deleteDialogMessage"
      :loading="isConfirmingDelete"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckSquare,
  ExternalLink,
  FileText,
  Info,
  Music,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentSong,
  type DepartmentTask,
} from "../../../composables/useDepartments";
import { useAuth } from "../../../composables/useAuth";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";

const route = useRoute();
const router = useRouter();
const departmentId = String(route.params.id);
const {
  getDepartmentById,
  getDepartmentTasks,
  createDepartmentTask,
  updateDepartmentTask,
  deleteDepartmentTask,
  getDepartmentSchedules,
  createDepartmentSchedule,
  updateChurchSchedule,
  deleteChurchSchedule,
  getDepartmentResources,
  createDepartmentResource,
  updateDepartmentResource,
  deleteDepartmentResource,
  getDepartmentSongs,
  createDepartmentSong,
  updateDepartmentSong,
  deleteDepartmentSong,
  uploadDepartmentPdf,
  getSongPreference,
  updateSongPreference,
  updateScheduleAssignments,
  updateScheduleAssignmentAttendance,
} = useDepartments();
const { getMembers } = useMembers();
const { user } = useAuth();

const department = ref<ChurchDepartment | null>(null);
const tasks = ref<DepartmentTask[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
const resources = ref<DepartmentResource[]>([]);
const songs = ref<DepartmentSong[]>([]);
const members = ref<ChurchMember[]>([]);
const departmentError = ref("");
const tasksError = ref("");
const schedulesError = ref("");
const resourcesError = ref("");
const songsError = ref("");
const createTaskError = ref("");
const createScheduleError = ref("");
const createResourceError = ref("");
const createSongError = ref("");
const createActivityError = ref("");
const songPreferenceError = ref("");
const assignmentsError = ref("");
const activeTab = ref("overview");
const isTaskDialogOpen = ref(false);
const isScheduleDialogOpen = ref(false);
const isResourceDialogOpen = ref(false);
const isSongDialogOpen = ref(false);
const isActivityDialogOpen = ref(false);
const isSongViewerOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isCreatingTask = ref(false);
const isCreatingSchedule = ref(false);
const isCreatingResource = ref(false);
const isCreatingSong = ref(false);
const isCreatingActivity = ref(false);
const isLoadingSongPreference = ref(false);
const isSavingSongPreference = ref(false);
const isSavingAssignments = ref(false);
const isConfirmingDelete = ref(false);
const selectedScheduleId = ref("");
const editingTaskId = ref("");
const editingScheduleId = ref("");
const editingResourceId = ref("");
const editingSongId = ref("");
const selectedSong = ref<DepartmentSong | null>(null);
const songViewerTab = ref("lyrics");
const pendingDelete = ref<{
  kind: "task" | "schedule" | "resource" | "song";
  id: string;
  title: string;
} | null>(null);

const isChurchWideManager = computed(
  () =>
    user.value?.role === "PASTOR" ||
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const canManageDepartment = computed(
  () =>
    isChurchWideManager.value ||
    department.value?.leaderId === user.value?.id,
);
const canManageSchedules = computed(
  () =>
    isChurchWideManager.value ||
    department.value?.leaderId === user.value?.id,
);

const taskForm = reactive({
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
});

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
  rehearsalDate: "",
  rehearsalTime: "",
  rehearsalNotes: "",
  songIds: [] as string[],
  resourceIds: [] as string[],
});

const resourceForm = reactive({
  title: "",
  url: "",
  category: "Geral",
  notes: "",
});

const songForm = reactive({
  title: "",
  artist: "",
  key: "",
  bpm: "",
  songCategory: "Louvor",
  url: "",
  notes: "",
  lyrics: "",
  chords: "",
  pdfUrl: "",
  pdfKey: "",
  pdfFileName: "",
  pdfMimeType: "",
  pdfSize: 0,
  removePdf: false,
});

const activityForm = reactive({
  title: "",
  notes: "",
});

const songPdfFile = ref<File | File[] | null>(null);
const activityPdfFile = ref<File | File[] | null>(null);

const personalSongForm = reactive({
  personalKey: "",
  chords: "",
});

const assignmentForm = reactive({
  userId: "",
  role: "",
});

const draftAssignments = ref<
  {
    assignmentId?: string;
    userId: string;
    name: string;
    role: string;
    viewedAt?: string | null;
    confirmationStatus?: string;
    attendanceStatus?: string;
  }[]
>([]);

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Louvor", value: "MUSIC" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];

const priorityOptions = [
  { label: "Baixa", value: "LOW" },
  { label: "Média", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const songCategoryOptions = ["Louvor", "Adoração", "Hino", "Especial"];

const baseTabs = [
  { label: "Visão geral", value: "overview", icon: Info },
  { label: "Escalas", value: "schedules", icon: Calendar },
  { label: "Tarefas", value: "tasks", icon: CheckSquare },
  { label: "Recursos", value: "resources", icon: FileText },
];

const tabs = computed(() => {
  const items = [...baseTabs];

  if (["WORSHIP", "MUSIC"].includes(department.value?.type || "")) {
    items.push({ label: "Músicas", value: "songs", icon: Music });
  }

  if (department.value?.type === "KIDS") {
    items.push({ label: "Aulas", value: "classes", icon: BookOpen });
  }

  return items;
});

const memberOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const songOptions = computed(() =>
  songs.value.map((song) => ({
    label: song.metadata?.artist ? `${song.title} - ${song.metadata.artist}` : song.title,
    value: song.id,
  })),
);

const resourceMaterials = computed(() =>
  resources.value.filter((resource) => resource.category !== "ACTIVITY"),
);

const resourceOptions = computed(() =>
  resourceMaterials.value.map((resource) => ({
    label: `${resource.title} (${resource.category})`,
    value: resource.id,
  })),
);

const activityResources = computed(() =>
  resources.value.filter((resource) => resource.category === "ACTIVITY"),
);

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

const selectedSongToneText = computed(() => {
  if (!selectedSong.value) return "Tom não cadastrado.";

  const items = [
    selectedSong.value.metadata?.key ? `Tom: ${selectedSong.value.metadata.key}` : "",
    selectedSong.value.metadata?.bpm ? `BPM: ${selectedSong.value.metadata.bpm}` : "",
    selectedSong.value.metadata?.notes || "",
  ].filter(Boolean);

  return items.join("\n") || "Tom não cadastrado.";
});

const detailSummary = computed(() => [
  { label: "escalas", value: schedules.value.length },
  { label: "tarefas", value: tasks.value.length },
  { label: "recursos", value: resources.value.length },
  ...(["WORSHIP", "MUSIC"].includes(department.value?.type || "")
    ? [{ label: "músicas", value: songs.value.length }]
    : []),
]);

const isDeleteDialogOpen = computed({
  get: () => Boolean(pendingDelete.value),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingDelete.value = null;
    }
  },
});

const deleteDialogTitle = computed(() => {
  const labels = {
    task: "Remover tarefa",
    schedule: "Remover escala",
    resource: "Remover recurso",
    song: "Remover música",
  };

  return pendingDelete.value ? labels[pendingDelete.value.kind] : "Confirmar remoção";
});

const deleteDialogMessage = computed(() => {
  if (!pendingDelete.value) return "Essa ação não pode ser desfeita.";

  return `${pendingDelete.value.title} será removido permanentemente.`;
});

const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const priorityLabel = (value: string) =>
  priorityOptions.find((priority) => priority.value === value)?.label || "Média";

const responseStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmou",
    DECLINED: "Não pode",
    MAYBE: "Talvez",
    SWAP_REQUESTED: "Troca",
    PENDING: "Pendente",
  };

  return labels[status || "PENDING"] || "Pendente";
};

const responseStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    CONFIRMED: "teal-darken-2",
    DECLINED: "red-darken-2",
    MAYBE: "amber-darken-3",
    SWAP_REQUESTED: "indigo-darken-2",
    PENDING: "grey",
  };

  return colors[status || "PENDING"] || "grey";
};

const attendanceStatusLabel = (status?: string) => {
  if (status === "PRESENT") return "Presente";
  if (status === "ABSENT") return "Faltou";
  return "Presença pendente";
};

const loadDepartment = async () => {
  departmentError.value = "";

  const { data, error } = await getDepartmentById(departmentId);

  if (error || !data) {
    departmentError.value = error || "Ministério não encontrado.";
    return;
  }

  department.value = data;
};

const loadTasks = async () => {
  tasksError.value = "";

  const { data, error } = await getDepartmentTasks(departmentId);

  if (error) {
    tasksError.value = error;
    return;
  }

  tasks.value = data ?? [];
};

const loadSchedules = async () => {
  schedulesError.value = "";

  const { data, error } = await getDepartmentSchedules(departmentId);

  if (error) {
    schedulesError.value = error;
    return;
  }

  schedules.value = data ?? [];
};

const loadResources = async () => {
  resourcesError.value = "";

  const { data, error } = await getDepartmentResources(departmentId);

  if (error) {
    resourcesError.value = error;
    return;
  }

  resources.value = data ?? [];
};

const loadSongs = async () => {
  songsError.value = "";

  const { data, error } = await getDepartmentSongs(departmentId);

  if (error) {
    songsError.value = error;
    return;
  }

  songs.value = data ?? [];
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const resetTaskForm = () => {
  taskForm.title = "";
  taskForm.description = "";
  taskForm.priority = "MEDIUM";
  taskForm.assigneeId = "";
  editingTaskId.value = "";
};

const closeTaskDialog = () => {
  isTaskDialogOpen.value = false;
  createTaskError.value = "";
  resetTaskForm();
};

const resetScheduleForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
  scheduleForm.rehearsalDate = "";
  scheduleForm.rehearsalTime = "";
  scheduleForm.rehearsalNotes = "";
  scheduleForm.songIds = [];
  scheduleForm.resourceIds = [];
  editingScheduleId.value = "";
};

const closeScheduleDialog = () => {
  isScheduleDialogOpen.value = false;
  createScheduleError.value = "";
  resetScheduleForm();
};

const resetResourceForm = () => {
  resourceForm.title = "";
  resourceForm.url = "";
  resourceForm.category = "Geral";
  resourceForm.notes = "";
  editingResourceId.value = "";
};

const closeResourceDialog = () => {
  isResourceDialogOpen.value = false;
  createResourceError.value = "";
  resetResourceForm();
};

const getSelectedFile = (value: File | File[] | null) =>
  Array.isArray(value) ? value[0] || null : value;

const uploadPdfFile = async (
  value: File | File[] | null,
  fallbackError: string,
) => {
  const file = getSelectedFile(value);

  if (!file) {
    return null;
  }

  if (file.type !== "application/pdf") {
    throw new Error("Selecione um arquivo PDF válido.");
  }

  const { data, error } = await uploadDepartmentPdf(departmentId, file);

  if (error || !data) {
    throw new Error(error || fallbackError);
  }

  return data;
};

const resetSongForm = () => {
  songForm.title = "";
  songForm.artist = "";
  songForm.key = "";
  songForm.bpm = "";
  songForm.songCategory = "Louvor";
  songForm.url = "";
  songForm.notes = "";
  songForm.lyrics = "";
  songForm.chords = "";
  songForm.pdfUrl = "";
  songForm.pdfKey = "";
  songForm.pdfFileName = "";
  songForm.pdfMimeType = "";
  songForm.pdfSize = 0;
  songForm.removePdf = false;
  songPdfFile.value = null;
  editingSongId.value = "";
};

const closeSongDialog = () => {
  isSongDialogOpen.value = false;
  createSongError.value = "";
  resetSongForm();
};

const removeSongPdf = () => {
  songForm.pdfUrl = "";
  songForm.pdfKey = "";
  songForm.pdfFileName = "";
  songForm.pdfMimeType = "";
  songForm.pdfSize = 0;
  songForm.removePdf = true;
  songPdfFile.value = null;
};

const resetActivityForm = () => {
  activityForm.title = "";
  activityForm.notes = "";
  activityPdfFile.value = null;
};

const closeActivityDialog = () => {
  isActivityDialogOpen.value = false;
  createActivityError.value = "";
  resetActivityForm();
};

const openSongViewer = (song: DepartmentSong) => {
  selectedSong.value = song;
  songViewerTab.value = song.metadata?.lyrics
    ? "lyrics"
    : song.metadata?.chords
      ? "chords"
      : "notes";
  isSongViewerOpen.value = true;
  void loadSongPreference(song);
};

const openScheduleMediaItem = (mediaItem: DepartmentResource | DepartmentSong) => {
  if (mediaItem.category !== "MUSIC") return;

  openSongViewer(mediaItem as DepartmentSong);
};

const closeSongViewer = () => {
  isSongViewerOpen.value = false;
  selectedSong.value = null;
  songPreferenceError.value = "";
  personalSongForm.personalKey = "";
  personalSongForm.chords = "";
};

const loadSongPreference = async (song: DepartmentSong) => {
  songPreferenceError.value = "";
  isLoadingSongPreference.value = true;
  personalSongForm.personalKey = "";
  personalSongForm.chords = song.metadata?.chords || "";

  const { data, error } = await getSongPreference(song.id);

  isLoadingSongPreference.value = false;

  if (error) {
    songPreferenceError.value = error;
    return;
  }

  personalSongForm.personalKey = data?.personalKey || "";
  personalSongForm.chords = data?.chords || song.metadata?.chords || "";
};

const useOfficialChords = () => {
  personalSongForm.personalKey = selectedSong.value?.metadata?.key || "";
  personalSongForm.chords = selectedSong.value?.metadata?.chords || "";
};

const saveSongPreference = async () => {
  if (!selectedSong.value) return;

  songPreferenceError.value = "";
  isSavingSongPreference.value = true;

  const { data, error } = await updateSongPreference(selectedSong.value.id, {
    personalKey: personalSongForm.personalKey,
    chords: personalSongForm.chords,
  });

  isSavingSongPreference.value = false;

  if (error || !data) {
    songPreferenceError.value = error || "Não foi possível salvar sua cifra.";
    return;
  }

  personalSongForm.personalKey = data.personalKey || "";
  personalSongForm.chords = data.chords || "";
};

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const flatToSharp: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

const transposeNote = (note: string, steps: number) => {
  const normalized = flatToSharp[note] || note;
  const index = noteNames.indexOf(normalized);

  if (index === -1) return note;

  return noteNames[(index + steps + noteNames.length) % noteNames.length];
};

const transposePersonalChords = (steps: number) => {
  const chordRegex = /\b([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add)?([0-9]*)?(\/([A-G](?:#|b)?))?/g;

  personalSongForm.chords = personalSongForm.chords.replace(
    chordRegex,
    (match, root, quality = "", extension = "", slash = "", bass = "") => {
      const nextRoot = transposeNote(root, steps);
      const nextBass = bass ? `/${transposeNote(bass, steps)}` : "";
      return `${nextRoot}${quality || ""}${extension || ""}${nextBass}`;
    },
  );

  if (personalSongForm.personalKey) {
    personalSongForm.personalKey = transposeNote(personalSongForm.personalKey, steps);
  }
};

const openTaskEditDialog = (task: DepartmentTask) => {
  editingTaskId.value = task.id;
  taskForm.title = task.title;
  taskForm.description = task.description || "";
  taskForm.priority = task.priority;
  taskForm.assigneeId = task.assigneeId || "";
  createTaskError.value = "";
  isTaskDialogOpen.value = true;
};

const handleSaveTask = async () => {
  createTaskError.value = "";
  const title = taskForm.title.trim();

  if (!title) {
    createTaskError.value = "Informe o título da tarefa.";
    return;
  }

  isCreatingTask.value = true;

  const { data, error } = editingTaskId.value
    ? await updateDepartmentTask(departmentId, editingTaskId.value, {
        title,
        description: taskForm.description,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || null,
      })
    : await createDepartmentTask(departmentId, {
        title,
        description: taskForm.description,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || undefined,
      });

  isCreatingTask.value = false;

  if (error || !data) {
    createTaskError.value = error || "Não foi possível criar a tarefa.";
    return;
  }

  tasks.value = editingTaskId.value
    ? tasks.value.map((task) => (task.id === data.id ? data : task))
    : [data, ...tasks.value];
  closeTaskDialog();
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

const openScheduleEditDialog = (schedule: DepartmentSchedule) => {
  editingScheduleId.value = schedule.id;
  scheduleForm.title = schedule.description;
  scheduleForm.date = toDateInputValue(schedule.date);
  scheduleForm.time = toTimeInputValue(schedule.date);
  scheduleForm.rehearsalDate = schedule.rehearsalAt
    ? toDateInputValue(schedule.rehearsalAt)
    : "";
  scheduleForm.rehearsalTime = schedule.rehearsalAt
    ? toTimeInputValue(schedule.rehearsalAt)
    : "";
  scheduleForm.rehearsalNotes = schedule.rehearsalNotes || "";
  scheduleForm.songIds =
    schedule.mediaItems
      ?.filter((item) => item.mediaItem.category === "MUSIC")
      .map((item) => item.mediaItemId) || [];
  scheduleForm.resourceIds =
    schedule.mediaItems
      ?.filter((item) => item.mediaItem.category !== "MUSIC")
      .map((item) => item.mediaItemId) || [];
  createScheduleError.value = "";
  isScheduleDialogOpen.value = true;
};

const handleSaveSchedule = async () => {
  createScheduleError.value = "";
  const title = scheduleForm.title.trim();

  if (!title) {
    createScheduleError.value = "Informe o título da escala.";
    return;
  }

  if (!scheduleForm.date) {
    createScheduleError.value = "Informe a data da escala.";
    return;
  }

  isCreatingSchedule.value = true;

  const { data, error } = editingScheduleId.value
    ? await updateChurchSchedule(editingScheduleId.value, {
        title,
        date: scheduleForm.date,
        time: scheduleForm.time || undefined,
        rehearsalDate: scheduleForm.rehearsalDate || null,
        rehearsalTime: scheduleForm.rehearsalTime || null,
        rehearsalNotes: scheduleForm.rehearsalNotes || null,
        songIds: scheduleForm.songIds,
        resourceIds: scheduleForm.resourceIds,
      })
    : await createDepartmentSchedule(departmentId, {
        title,
        date: scheduleForm.date,
        time: scheduleForm.time || undefined,
        rehearsalDate: scheduleForm.rehearsalDate || null,
        rehearsalTime: scheduleForm.rehearsalTime || null,
        rehearsalNotes: scheduleForm.rehearsalNotes || null,
        songIds: scheduleForm.songIds,
        resourceIds: scheduleForm.resourceIds,
      });

  isCreatingSchedule.value = false;

  if (error || !data) {
    createScheduleError.value = error || "Não foi possível criar a escala.";
    return;
  }

  const nextSchedules = editingScheduleId.value
    ? schedules.value.map((schedule) => (schedule.id === data.id ? data : schedule))
    : [...schedules.value, data];

  schedules.value = nextSchedules.sort(
    (current, next) =>
      new Date(current.date).getTime() - new Date(next.date).getTime(),
  );
  closeScheduleDialog();
};

const openResourceEditDialog = (resource: DepartmentResource) => {
  editingResourceId.value = resource.id;
  resourceForm.title = resource.title;
  resourceForm.url = resource.url;
  resourceForm.category = resource.category;
  resourceForm.notes = resource.metadata?.notes || "";
  createResourceError.value = "";
  isResourceDialogOpen.value = true;
};

const handleSaveResource = async () => {
  createResourceError.value = "";
  const title = resourceForm.title.trim();
  const url = resourceForm.url.trim();

  if (!title) {
    createResourceError.value = "Informe o título do recurso.";
    return;
  }

  if (!url) {
    createResourceError.value = "Informe o link do recurso.";
    return;
  }

  isCreatingResource.value = true;

  const { data, error } = editingResourceId.value
    ? await updateDepartmentResource(departmentId, editingResourceId.value, {
        title,
        url,
        category: resourceForm.category,
        notes: resourceForm.notes,
      })
    : await createDepartmentResource(departmentId, {
        title,
        url,
        category: resourceForm.category,
        notes: resourceForm.notes,
      });

  isCreatingResource.value = false;

  if (error || !data) {
    createResourceError.value = error || "Não foi possível criar o recurso.";
    return;
  }

  const nextResources = editingResourceId.value
    ? resources.value.map((resource) => (resource.id === data.id ? data : resource))
    : [...resources.value, data];

  resources.value = nextResources.sort((current, next) =>
    current.title.localeCompare(next.title),
  );
  closeResourceDialog();
};

const openSongEditDialog = (song: DepartmentSong) => {
  editingSongId.value = song.id;
  songForm.title = song.title;
  songForm.artist = song.metadata?.artist || "";
  songForm.key = song.metadata?.key || "";
  songForm.bpm = song.metadata?.bpm || "";
  songForm.songCategory = song.metadata?.songCategory || "Louvor";
  songForm.url = song.url || "";
  songForm.notes = song.metadata?.notes || "";
  songForm.lyrics = song.metadata?.lyrics || "";
  songForm.chords = song.metadata?.chords || "";
  songForm.pdfUrl = song.metadata?.pdf?.url || "";
  songForm.pdfKey = song.metadata?.pdf?.key || "";
  songForm.pdfFileName = song.metadata?.pdf?.fileName || "";
  songForm.pdfMimeType = song.metadata?.pdf?.mimeType || "";
  songForm.pdfSize = song.metadata?.pdf?.size || 0;
  songForm.removePdf = false;
  songPdfFile.value = null;
  createSongError.value = "";
  isSongDialogOpen.value = true;
};

const handleSaveSong = async () => {
  createSongError.value = "";
  const title = songForm.title.trim();

  if (!title) {
    createSongError.value = "Informe o título da música.";
    return;
  }

  isCreatingSong.value = true;

  try {
    const uploadedPdf = await uploadPdfFile(
      songPdfFile.value,
      "Não foi possível enviar o PDF da música.",
    );

    if (uploadedPdf) {
      songForm.pdfUrl = uploadedPdf.url;
      songForm.pdfKey = uploadedPdf.key;
      songForm.pdfFileName = uploadedPdf.fileName;
      songForm.pdfMimeType = uploadedPdf.mimeType;
      songForm.pdfSize = uploadedPdf.size;
      songForm.removePdf = false;
    }
  } catch (error: any) {
    isCreatingSong.value = false;
    createSongError.value = error?.message || "Não foi possível enviar o PDF.";
    return;
  }

  const payload = {
    title,
    artist: songForm.artist,
    key: songForm.key,
    bpm: songForm.bpm,
    songCategory: songForm.songCategory,
    url: songForm.url,
    notes: songForm.notes,
    lyrics: songForm.lyrics,
    chords: songForm.chords,
    ...(songForm.pdfUrl
      ? {
          pdfUrl: songForm.pdfUrl,
          pdfKey: songForm.pdfKey,
          pdfFileName: songForm.pdfFileName,
          pdfMimeType: songForm.pdfMimeType,
          pdfSize: songForm.pdfSize,
        }
      : {}),
    ...(songForm.removePdf ? { removePdf: true } : {}),
  };

  const { data, error } = editingSongId.value
    ? await updateDepartmentSong(departmentId, editingSongId.value, payload)
    : await createDepartmentSong(departmentId, payload);

  isCreatingSong.value = false;

  if (error || !data) {
    createSongError.value = error || "Não foi possível salvar a música.";
    return;
  }

  const nextSongs = editingSongId.value
    ? songs.value.map((song) => (song.id === data.id ? data : song))
    : [...songs.value, data];

  songs.value = nextSongs.sort((current, next) =>
    current.title.localeCompare(next.title),
  );
  closeSongDialog();
};

const handleSaveActivity = async () => {
  createActivityError.value = "";
  const title = activityForm.title.trim();

  if (!title) {
    createActivityError.value = "Informe o título da atividade.";
    return;
  }

  if (!getSelectedFile(activityPdfFile.value)) {
    createActivityError.value = "Selecione o PDF da atividade.";
    return;
  }

  isCreatingActivity.value = true;

  let uploadedPdf;
  try {
    uploadedPdf = await uploadPdfFile(
      activityPdfFile.value,
      "Não foi possível enviar o PDF da atividade.",
    );
  } catch (error: any) {
    isCreatingActivity.value = false;
    createActivityError.value = error?.message || "Não foi possível enviar o PDF.";
    return;
  }

  if (!uploadedPdf) {
    isCreatingActivity.value = false;
    createActivityError.value = "Selecione o PDF da atividade.";
    return;
  }

  const { data, error } = await createDepartmentResource(departmentId, {
    title,
    url: uploadedPdf.url,
    category: "ACTIVITY",
    notes: activityForm.notes,
    pdfUrl: uploadedPdf.url,
    pdfKey: uploadedPdf.key,
    pdfFileName: uploadedPdf.fileName,
    pdfMimeType: uploadedPdf.mimeType,
    pdfSize: uploadedPdf.size,
  });

  isCreatingActivity.value = false;

  if (error || !data) {
    createActivityError.value = error || "Não foi possível salvar a atividade.";
    return;
  }

  resources.value = [...resources.value, data].sort((current, next) =>
    current.title.localeCompare(next.title),
  );
  closeActivityDialog();
};

const handleDeleteTask = (task: DepartmentTask) => {
  pendingDelete.value = {
    kind: "task",
    id: task.id,
    title: task.title,
  };
};

const handleDeleteSchedule = (schedule: DepartmentSchedule) => {
  pendingDelete.value = {
    kind: "schedule",
    id: schedule.id,
    title: schedule.description,
  };
};

const handleDeleteResource = (resource: DepartmentResource) => {
  pendingDelete.value = {
    kind: "resource",
    id: resource.id,
    title: resource.title,
  };
};

const handleDeleteSong = (song: DepartmentSong) => {
  pendingDelete.value = {
    kind: "song",
    id: song.id,
    title: song.title,
  };
};

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) {
    pendingDelete.value = null;
  }
};

const confirmDelete = async () => {
  if (!pendingDelete.value) return;

  const target = pendingDelete.value;
  isConfirmingDelete.value = true;

  if (target.kind === "task") {
    tasksError.value = "";
    const { error } = await deleteDepartmentTask(departmentId, target.id);
    isConfirmingDelete.value = false;

    if (error) {
      tasksError.value = error;
      return;
    }

    tasks.value = tasks.value.filter((item) => item.id !== target.id);
  }

  if (target.kind === "schedule") {
    schedulesError.value = "";
    const { error } = await deleteChurchSchedule(target.id);
    isConfirmingDelete.value = false;

    if (error) {
      schedulesError.value = error;
      return;
    }

    schedules.value = schedules.value.filter((item) => item.id !== target.id);
  }

  if (target.kind === "resource") {
    resourcesError.value = "";
    const { error } = await deleteDepartmentResource(departmentId, target.id);
    isConfirmingDelete.value = false;

    if (error) {
      resourcesError.value = error;
      return;
    }

    resources.value = resources.value.filter((item) => item.id !== target.id);
  }

  if (target.kind === "song") {
    songsError.value = "";
    const { error } = await deleteDepartmentSong(departmentId, target.id);
    isConfirmingDelete.value = false;

    if (error) {
      songsError.value = error;
      return;
    }

    songs.value = songs.value.filter((item) => item.id !== target.id);
  }

  pendingDelete.value = null;
};

const openAssignmentsDialog = (schedule: DepartmentSchedule) => {
  selectedScheduleId.value = schedule.id;
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";
  draftAssignments.value =
    schedule.assignments?.map((assignment) => ({
      assignmentId: assignment.id,
      userId: assignment.userId,
      name: assignment.user.name,
      role: assignment.role,
      viewedAt: assignment.viewedAt,
      confirmationStatus: assignment.confirmationStatus,
      attendanceStatus: assignment.attendanceStatus,
    })) || [];
  isAssignmentsDialogOpen.value = true;
};

const closeAssignmentsDialog = () => {
  isAssignmentsDialogOpen.value = false;
  selectedScheduleId.value = "";
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";
  draftAssignments.value = [];
};

const addDraftAssignment = () => {
  assignmentsError.value = "";

  if (!assignmentForm.userId) {
    assignmentsError.value = "Escolha um voluntário.";
    return;
  }

  if (draftAssignments.value.some((item) => item.userId === assignmentForm.userId)) {
    assignmentsError.value = "Esse voluntário já está nesta escala.";
    return;
  }

  const member = members.value.find((item) => item.id === assignmentForm.userId);
  if (!member) return;

  draftAssignments.value = [
    ...draftAssignments.value,
    {
      userId: member.id,
      name: member.name,
      role: assignmentForm.role.trim() || "Voluntário",
      viewedAt: null,
      confirmationStatus: "PENDING",
      attendanceStatus: "PENDING",
    },
  ];
  assignmentForm.userId = "";
  assignmentForm.role = "";
};

const removeDraftAssignment = (userId: string) => {
  draftAssignments.value = draftAssignments.value.filter(
    (assignment) => assignment.userId !== userId,
  );
};

const updateLocalAssignment = (
  scheduleId: string,
  assignment: NonNullable<DepartmentSchedule["assignments"]>[number],
) => {
  schedules.value = schedules.value.map((schedule) => {
    if (schedule.id !== scheduleId) return schedule;

    return {
      ...schedule,
      assignments: schedule.assignments?.map((item) =>
        item.id === assignment.id ? assignment : item,
      ),
    };
  });
};

const markAttendance = async (
  assignment: {
    assignmentId?: string;
    userId: string;
  },
  attendanceStatus: "PRESENT" | "ABSENT",
) => {
  if (!selectedScheduleId.value || !assignment.assignmentId) {
    assignmentsError.value = "Salve os voluntários antes de marcar presença.";
    return;
  }

  assignmentsError.value = "";
  const { data, error } = await updateScheduleAssignmentAttendance(
    selectedScheduleId.value,
    assignment.assignmentId,
    { attendanceStatus },
  );

  if (error || !data) {
    assignmentsError.value = error || "Não foi possível marcar presença.";
    return;
  }

  updateLocalAssignment(selectedScheduleId.value, data);
  draftAssignments.value = draftAssignments.value.map((item) =>
    item.assignmentId === data.id
      ? {
          ...item,
          attendanceStatus: data.attendanceStatus,
        }
      : item,
  );
};

const saveAssignments = async () => {
  assignmentsError.value = "";

  if (!selectedScheduleId.value) {
    assignmentsError.value = "Escala não encontrada.";
    return;
  }

  isSavingAssignments.value = true;

  const { data, error } = await updateScheduleAssignments(
    selectedScheduleId.value,
    {
      assignments: draftAssignments.value.map((assignment) => ({
        userId: assignment.userId,
        role: assignment.role,
      })),
    },
  );

  isSavingAssignments.value = false;

  if (error || !data) {
    assignmentsError.value = error || "Não foi possível salvar os voluntários.";
    return;
  }

  schedules.value = schedules.value.map((schedule) =>
    schedule.id === data.id ? data : schedule,
  );
  closeAssignmentsDialog();
};

const formatScheduleDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

onMounted(async () => {
  await Promise.all([
    loadDepartment(),
    loadTasks(),
    loadSchedules(),
    loadResources(),
    loadSongs(),
    loadMembers(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.cursor-pointer {
  cursor: pointer;
}
.border-subtle {
  border: 1px solid #f3f4f6;
}
.ministery-back-row,
.ministery-detail-header,
.ministery-section-actions,
.ministery-card-actions {
  display: flex;
  align-items: center;
}
.ministery-back-row {
  gap: 2px;
}
.ministery-detail-header {
  justify-content: space-between;
  gap: 16px;
}
.ministery-detail-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.ministery-detail-summary-item {
  display: grid;
  min-height: 68px;
  align-content: center;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}
.ministery-detail-summary-item span {
  color: #111827;
  font-size: 1.16rem;
  font-weight: 900;
  line-height: 1;
}
.ministery-detail-summary-item small {
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 750;
}
.ministery-section-actions {
  justify-content: flex-end;
}
.ministery-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.ministery-content-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
}
.ministery-card-actions {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}
.pdf-current-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #ede9fe;
  border-radius: 8px;
  background: #faf5ff;
  padding: 11px 12px;
}
.schedule-media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.schedule-media-chip {
  cursor: pointer;
}
.song-click-card {
  cursor: pointer;
}
.song-click-card:focus-visible {
  outline: 3px solid rgba(168, 85, 247, 0.28);
  outline-offset: 2px;
}
.schedule-assignment-list {
  display: grid;
  gap: 8px;
}
.schedule-assignment-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
}
.schedule-assignment-name,
.schedule-assignment-role {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.schedule-assignment-name {
  color: #1f2937;
  font-size: 0.82rem;
  font-weight: 700;
}
.schedule-assignment-role {
  color: #6d28d9;
  font-size: 0.78rem;
  font-weight: 800;
}
.chords-input :deep(textarea),
.song-chords-block {
  font-family: "Courier New", monospace;
}
.song-viewer {
  overflow: hidden;
}
.song-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
}
.song-viewer-body {
  max-height: min(680px, 75vh);
  overflow-y: auto;
  padding: 20px;
}
.song-text-block {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  color: #1f2937;
  font-family: inherit;
  font-size: 0.92rem;
  line-height: 1.65;
  margin: 0;
  min-height: 180px;
  overflow-x: auto;
  padding: 16px;
  white-space: pre-wrap;
}
.personal-chords-panel {
  display: grid;
  gap: 12px;
}
.personal-chords-heading,
.personal-chords-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tabs-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 6px;
  margin-right: -16px;
  margin-left: -16px;
  padding-right: 16px;
  padding-left: 16px;
  scroll-padding-inline: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs-row::-webkit-scrollbar {
  display: none;
}
.tab-chip {
  flex: 0 0 auto;
  max-width: min(62vw, 190px);
  height: 34px !important;
  padding-inline: 14px !important;
}
.tab-chip :deep(.v-chip__content) {
  min-width: 0;
  max-width: 100%;
}
.tab-chip-icon {
  flex: 0 0 auto;
  margin-right: 8px;
}
.tab-chip-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ministery-input :deep(.v-field) {
  border-radius: 14px;
}
.ministery-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.ministery-field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.dialog-actions .v-btn {
  min-width: 112px;
}
@media (min-width: 560px) {
  .ministery-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .song-viewer-mobile-sheet .song-viewer {
    min-height: 100vh;
  }

  .song-viewer-mobile-sheet .song-viewer-body {
    max-height: calc(100vh - 112px);
  }

  .ministery-detail-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .ministery-detail-summary,
  .ministery-card-grid {
    grid-template-columns: 1fr;
  }

  .ministery-section-actions .v-btn {
    width: 100%;
  }

  .tabs-row {
    gap: 6px;
    margin-right: -12px;
    margin-left: -12px;
    padding-right: 12px;
    padding-left: 12px;
    scroll-padding-inline: 12px;
  }

  .tab-chip {
    max-width: 56vw;
    height: 32px !important;
    padding-inline: 12px !important;
    font-size: 0.78rem;
  }

  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
