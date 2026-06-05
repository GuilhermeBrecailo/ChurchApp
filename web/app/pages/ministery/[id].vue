<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex align-center mb-4">
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
      <div class="d-flex align-start justify-space-between ga-4 mb-5">
        <div>
          <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
            {{ department.name }}
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-2">
            Líder: {{ department.leader.name }}
          </p>
          <v-chip size="small" color="purple-darken-3" variant="tonal">
            {{ departmentTypeLabel(department.type) }}
          </v-chip>
        </div>
      </div>

      <div class="tabs-row mb-6">
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

      <section v-if="activeTab === 'overview'" class="d-flex flex-column ga-3">
        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
          <p class="text-caption text-grey-darken-1 mb-1">Líder</p>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            {{ department.leader.name }}
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            {{ department.leader.email }}
          </p>
        </v-card>

        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
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
        <div class="d-flex justify-end mb-4">
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

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="schedule in schedules"
            :key="schedule.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
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

            <v-divider class="my-3"></v-divider>
            <div class="d-flex justify-center align-center ga-2">
              <v-btn
                v-if="canManageSchedules"
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
                v-if="canManageSchedules"
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openScheduleEditDialog(schedule)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                v-if="canManageSchedules"
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
        <div class="d-flex justify-end mb-4">
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

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="task in tasks"
            :key="task.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
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
            <div class="d-flex justify-end ga-2 mt-3">
              <v-btn
                v-if="canManageDepartment"
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openTaskEditDialog(task)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                v-if="canManageDepartment"
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
        <div class="d-flex justify-end mb-4">
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
          v-if="resources.length === 0 && !resourcesError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <FileText size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhum recurso cadastrado ainda
          </p>
        </v-card>

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="resource in resources"
            :key="resource.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
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
            <div class="d-flex justify-end ga-2 mt-3">
              <v-btn
                v-if="canManageDepartment"
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openResourceEditDialog(resource)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                v-if="canManageDepartment"
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
        <div class="d-flex justify-end mb-4">
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

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="song in songs"
            :key="song.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
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

            <div v-if="canManageDepartment" class="d-flex justify-end ga-2 mt-3">
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                @click="openSongEditDialog(song)"
              >
                <Pencil size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="handleDeleteSong(song)"
              >
                <Trash2 size="16" />
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
        <div class="text-center py-10 text-grey-darken-1 text-body-2">
          Aulas, materiais e faixas etárias entram aqui
        </div>
      </section>
    </template>

    <v-dialog v-model="isScheduleDialogOpen" max-width="520">
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
    </v-dialog>

    <v-dialog v-model="isResourceDialogOpen" max-width="520">
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
    </v-dialog>

    <v-dialog v-model="isSongDialogOpen" max-width="520">
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
    </v-dialog>

    <v-dialog v-model="isAssignmentsDialogOpen" max-width="560">
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
              <div>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ assignment.name }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ assignment.role }}
                </p>
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
    </v-dialog>

    <v-dialog v-model="isTaskDialogOpen" max-width="520">
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
    </v-dialog>

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
  updateScheduleAssignments,
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
const assignmentsError = ref("");
const activeTab = ref("overview");
const isTaskDialogOpen = ref(false);
const isScheduleDialogOpen = ref(false);
const isResourceDialogOpen = ref(false);
const isSongDialogOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isCreatingTask = ref(false);
const isCreatingSchedule = ref(false);
const isCreatingResource = ref(false);
const isCreatingSong = ref(false);
const isSavingAssignments = ref(false);
const isConfirmingDelete = ref(false);
const selectedScheduleId = ref("");
const editingTaskId = ref("");
const editingScheduleId = ref("");
const editingResourceId = ref("");
const editingSongId = ref("");
const pendingDelete = ref<{
  kind: "task" | "schedule" | "resource" | "song";
  id: string;
  title: string;
} | null>(null);

const canManageDepartment = computed(
  () =>
    user.value?.isTitularPastor === true ||
    department.value?.leaderId === user.value?.id,
);
const canManageSchedules = computed(
  () =>
    user.value?.isTitularPastor === true ||
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
});

const assignmentForm = reactive({
  userId: "",
  role: "",
});

const draftAssignments = ref<
  {
    userId: string;
    name: string;
    role: string;
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

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

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

const resetSongForm = () => {
  songForm.title = "";
  songForm.artist = "";
  songForm.key = "";
  songForm.bpm = "";
  songForm.songCategory = "Louvor";
  songForm.url = "";
  songForm.notes = "";
  editingSongId.value = "";
};

const closeSongDialog = () => {
  isSongDialogOpen.value = false;
  createSongError.value = "";
  resetSongForm();
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
      })
    : await createDepartmentSchedule(departmentId, {
        title,
        date: scheduleForm.date,
        time: scheduleForm.time || undefined,
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

  const payload = {
    title,
    artist: songForm.artist,
    key: songForm.key,
    bpm: songForm.bpm,
    songCategory: songForm.songCategory,
    url: songForm.url,
    notes: songForm.notes,
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
      userId: assignment.userId,
      name: assignment.user.name,
      role: assignment.role,
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
