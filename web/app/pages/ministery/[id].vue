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

      <section v-if="activeTab === 'leader'" class="leader-panel">
        <div class="leader-panel-heading mb-4">
          <div>
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
              Painel do líder
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              Pendências, lembretes e relatórios deste ministério.
            </p>
          </div>
          <v-btn
            color="purple-darken-3"
            class="text-none rounded-lg"
            @click="activeTab = 'schedules'"
          >
            <Calendar size="17" class="mr-2" /> Escalas
          </v-btn>
        </div>

        <v-alert
          v-if="leaderMessage"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ leaderMessage }}
        </v-alert>

        <v-alert
          v-if="leaderError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ leaderError }}
        </v-alert>

        <div class="leader-metric-grid mb-4">
          <v-card
            v-for="metric in leaderMetrics"
            :key="metric.label"
            class="leader-metric-card pa-4 elevation-1 bg-white"
          >
            <div class="leader-metric-icon" :class="metric.className">
              <component :is="metric.icon" size="18" />
            </div>
            <span>{{ metric.value }}</span>
            <small>{{ metric.label }}</small>
          </v-card>
        </div>

        <div class="leader-panel-grid mb-4">
          <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
            <div class="leader-card-title mb-3">
              <AlertTriangle size="18" color="#B45309" />
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                Pendências
              </h3>
            </div>

            <div v-if="leaderPendingItems.length" class="leader-list">
              <div
                v-for="item in leaderPendingItems"
                :key="item.label"
                class="leader-list-row"
              >
                <div class="min-w-0">
                  <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                    {{ item.label }}
                  </p>
                  <p class="text-caption text-grey-darken-1 mb-0">
                    {{ item.description }}
                  </p>
                </div>
                <v-chip size="small" :color="item.color" variant="tonal">
                  {{ item.value }}
                </v-chip>
              </div>
            </div>
            <p v-else class="text-caption text-grey-darken-1 mb-0">
              Nenhuma pendência crítica no momento.
            </p>
          </v-card>

          <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
            <div class="leader-card-title mb-3">
              <BarChart3 size="18" color="#4F46E5" />
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                Relatório rápido
              </h3>
            </div>

            <div class="report-bars">
              <div
                v-for="item in reportRows"
                :key="item.label"
                class="report-row"
              >
                <div class="report-row-top">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}%</strong>
                </div>
                <div class="report-track">
                  <span :style="{ width: `${item.value}%` }" />
                </div>
              </div>
            </div>
          </v-card>
        </div>

        <v-card class="ministery-content-card pa-4 elevation-1 bg-white mb-4">
          <div class="leader-card-title mb-3">
            <BellRing size="18" color="#9333EA" />
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
              Lembretes de escala
            </h3>
          </div>

          <div v-if="upcomingLeaderSchedules.length" class="leader-list">
            <div
              v-for="schedule in upcomingLeaderSchedules"
              :key="schedule.id"
              class="leader-schedule-row"
            >
              <div class="min-w-0">
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ schedule.description }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ formatScheduleDate(schedule.date) }}
                  <span v-if="schedule.rehearsalAt">
                    · Ensaio {{ formatScheduleDate(schedule.rehearsalAt) }}
                  </span>
                </p>
                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-chip size="x-small" color="indigo-darken-2" variant="tonal">
                    {{ schedule.assignments?.length || 0 }} escalados
                  </v-chip>
                  <v-chip size="x-small" color="teal-darken-2" variant="tonal">
                    {{ confirmedAssignments(schedule) }} confirmados
                  </v-chip>
                  <v-chip size="x-small" color="amber-darken-3" variant="tonal">
                    {{ notViewedAssignments(schedule) }} não viram
                  </v-chip>
                </div>
              </div>

              <v-btn
                v-if="canSendNotifications"
                variant="tonal"
                color="purple-darken-3"
                class="text-none leader-reminder-btn"
                :loading="isSendingReminderId === schedule.id"
                :disabled="Boolean(isSendingReminderId) || !(schedule.assignments?.length)"
                @click="sendReminder(schedule)"
              >
                <Send size="16" class="mr-2" /> Lembrar
              </v-btn>
            </div>
          </div>
          <p v-else class="text-caption text-grey-darken-1 mb-0">
            Nenhuma escala futura para acompanhar.
          </p>
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
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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
            v-if="canManageSongs"
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isTaskDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova tarefa
          </v-btn>
        </div>

        <v-card
          v-if="tasks.length === 0 && !tasksError"
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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
            <div v-if="canManageSongs" class="ministery-card-actions mt-3">
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
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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
              <div class="song-title-block min-w-0">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 text-truncate">
                  {{ song.title }}
                </h3>
                <p class="text-caption text-grey-darken-1 text-truncate">
                  {{ song.metadata?.artist || "Artista não informado" }}
                </p>
                <div class="song-chip-row d-flex flex-wrap ga-2">
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
              <div class="song-card-icon-actions">
                <v-btn
                  v-if="song.metadata?.lyrics || song.metadata?.chords"
                  icon
                  variant="text"
                  color="purple-darken-3"
                  size="small"
                  aria-label="Abrir letra e cifra em tela cheia"
                  @click.stop="openSongViewer(song)"
                >
                  <Maximize2 size="16" />
                </v-btn>
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
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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

          <v-combobox
            v-model="resourceForm.category"
            label="Categoria"
            :items="resourceCategoryOptions"
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

          <v-textarea
            v-model="songForm.keyboardChords"
            label="Cifra para teclado"
            prepend-inner-icon="mdi-piano"
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
      max-width="920"
      fullscreen-desktop
      mobile-class="song-viewer-mobile-sheet"
    >
      <v-card v-if="selectedSong" class="rounded-xl bg-white song-viewer" elevation="0">
        <div class="song-viewer-header">
          <div class="min-w-0">
            <h2 class="song-viewer-title mb-0">
              {{ selectedSong.title }}
            </h2>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            aria-label="Fechar tela cheia"
            @click="closeSongViewer"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="song-viewer-toolbar">
          <v-tabs v-model="songViewerTab" color="purple-darken-3" density="compact">
            <v-tab value="lyrics" class="text-none">Letra</v-tab>
            <v-tab value="chords" class="text-none">Cifra</v-tab>
            <v-tab value="notes" class="text-none">Tom</v-tab>
          </v-tabs>

          <div class="song-viewer-controls">
            <v-btn-toggle
              v-if="songViewerTab === 'chords'"
              v-model="songViewerInstrument"
              density="compact"
              mandatory
              class="song-instrument-toggle"
            >
              <v-btn value="default" size="small" class="text-none">
                Violão/Guitarra
              </v-btn>
              <v-btn value="keyboard" size="small" class="text-none">
                Teclado
              </v-btn>
            </v-btn-toggle>

            <div
              v-if="songViewerTab === 'chords'"
              class="song-viewer-key-controls"
            >
              <v-btn
                variant="tonal"
                color="grey-darken-1"
                size="small"
                class="text-none"
                @click="transposePersonalChords(-1)"
              >
                -1 tom
              </v-btn>
              <v-chip size="small" color="orange-darken-3" variant="tonal">
                {{ songViewerCurrentKey }}
              </v-chip>
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

            <div class="song-autoscroll-controls">
              <v-icon size="18">mdi-speedometer</v-icon>
              <span>{{ songViewerScrollSpeedLabel }}</span>
              <v-slider
                v-model="songViewerAutoScrollSpeed"
                min="0"
                max="80"
                step="4"
                density="compact"
                color="purple-darken-3"
                hide-details
              />
            </div>
          </div>
        </div>

        <div class="song-viewer-body">
          <MusicSongTextRenderer
            v-if="songViewerTab === 'lyrics'"
            class="song-viewer-text"
            mode="lyrics"
            :text="selectedSong.metadata?.lyrics"
            empty-text="Letra não cadastrada."
            :auto-scroll="songViewerAutoScrollSpeed > 0"
            :scroll-speed="songViewerAutoScrollSpeed"
          />
          <div v-else-if="songViewerTab === 'chords'" class="personal-chords-panel">
            <MusicSongTextRenderer
              class="song-viewer-text"
              mode="chords"
              :text="selectedSongChordsText"
              empty-text="Cifra não cadastrada."
              :auto-scroll="songViewerAutoScrollSpeed > 0"
              :scroll-speed="songViewerAutoScrollSpeed"
            />

            <details class="personal-chords-editor">
              <summary>{{ personalChordsSummary }}</summary>

              <v-text-field
                v-model="personalSongForm.personalKey"
                label="Meu tom"
                placeholder="ex: C, Dm, F#"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                bg-color="white"
                class="ministery-input mb-3 mt-3"
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
            </details>
          </div>
          <MusicSongTextRenderer
            v-else
            class="song-viewer-text"
            mode="lyrics"
            :text="selectedSongToneText"
            :auto-scroll="songViewerAutoScrollSpeed > 0"
            :scroll-speed="songViewerAutoScrollSpeed"
          />
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
          <v-combobox
            v-model="assignmentForm.role"
            label="Função"
            :items="assignmentRoleOptions"
            placeholder="ex: Teclado"
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
                  <v-chip
                    v-if="unavailableMemberIds.has(assignment.userId)"
                    size="x-small"
                    color="red-darken-3"
                    variant="tonal"
                  >
                    <AlertTriangle size="11" class="mr-1" /> Indisponível
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
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BellRing,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Maximize2,
  Music,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
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
import { usePermissions } from "../../../composables/usePermissions";

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
  sendScheduleReminder,
  updateScheduleAssignmentAttendance,
} = useDepartments();
const { getMembers } = useMembers();
const { user } = useAuth();
const { can } = usePermissions();

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
const leaderError = ref("");
const leaderMessage = ref("");
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
const isSendingReminderId = ref("");
const isConfirmingDelete = ref(false);
const selectedScheduleId = ref("");
const editingTaskId = ref("");
const editingScheduleId = ref("");
const editingResourceId = ref("");
const editingSongId = ref("");
const selectedSong = ref<DepartmentSong | null>(null);
const songViewerTab = ref("lyrics");
const songViewerAutoScrollSpeed = ref(24);
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
const isDepartmentLeader = computed(
  () => department.value?.leaderId === user.value?.id,
);
const canManageDepartment = computed(
  () =>
    isChurchWideManager.value ||
    (isDepartmentLeader.value && can("MANAGE_DEPARTMENTS")),
);
const canManageSchedules = computed(
  () =>
    isChurchWideManager.value ||
    (isDepartmentLeader.value && can("MANAGE_SCHEDULES")),
);
const canManageSongs = computed(
  () =>
    isChurchWideManager.value ||
    (isDepartmentLeader.value && can("MANAGE_SONGS")),
);
const canSendNotifications = computed(
  () =>
    isChurchWideManager.value ||
    (isDepartmentLeader.value && can("SEND_NOTIFICATIONS")),
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
  keyboardChords: "",
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
const songViewerInstrument = ref<"default" | "keyboard">("default");

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
  { label: "Sonoplastia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];

const priorityOptions = [
  { label: "Baixa", value: "LOW" },
  { label: "Média", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const songCategoryOptions = ["Louvor", "Adoração", "Hino", "Especial"];
const departmentRoleOptions: Record<string, string[]> = {
  WORSHIP: [
    "Ministro",
    "Cantor(a)",
    "Guitarra",
    "Baixo",
    "Violão",
    "Bateria",
    "Cajon",
    "Teclado",
  ],
  MUSIC: [
    "Ministro",
    "Cantor(a)",
    "Guitarra",
    "Baixo",
    "Violão",
    "Bateria",
    "Cajon",
    "Teclado",
  ],
  MEDIA: ["Mídia", "Mesa de som", "Luzes"],
};

const baseTabs = [
  { label: "Visão geral", value: "overview", icon: Info },
  { label: "Escalas", value: "schedules", icon: Calendar },
  { label: "Tarefas", value: "tasks", icon: CheckSquare },
  { label: "Recursos", value: "resources", icon: FileText },
];

const tabs = computed(() => {
  const items = [...baseTabs];

  if (canManageDepartment.value) {
    items.splice(1, 0, { label: "Líder", value: "leader", icon: BarChart3 });
  }

  if (["WORSHIP", "MUSIC", "MEDIA"].includes(department.value?.type || "")) {
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

const resourceCategoryOptions = computed(() =>
  department.value?.type === "MEDIA"
    ? ["Mídia", "Mesa de som", "Luzes", "Geral"]
    : ["Geral", "Link", "PDF", "Material"],
);

const resourceOptions = computed(() =>
  resourceMaterials.value.map((resource) => ({
    label: `${resource.title} (${resource.category})`,
    value: resource.id,
  })),
);

const assignmentRoleOptions = computed(
  () => departmentRoleOptions[department.value?.type || ""] || ["Voluntário"],
);

const activityResources = computed(() =>
  resources.value.filter((resource) => resource.category === "ACTIVITY"),
);

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

const unavailableMemberIds = computed(() => {
  if (!selectedSchedule.value?.date) return new Set<string>();
  const scheduleDay = selectedSchedule.value.date.slice(0, 10);
  return new Set(
    members.value
      .filter((m) => m.unavailableDates?.includes(scheduleDay))
      .map((m) => m.id),
  );
});

const allAssignments = computed(() =>
  schedules.value.flatMap((schedule) =>
    (schedule.assignments || []).map((assignment) => ({
      ...assignment,
      scheduleId: schedule.id,
      scheduleDate: schedule.date,
    })),
  ),
);

const upcomingLeaderSchedules = computed(() => {
  const now = Date.now();

  return schedules.value
    .filter((schedule) => new Date(schedule.date).getTime() >= now)
    .sort(
      (current, next) =>
        new Date(current.date).getTime() - new Date(next.date).getTime(),
    )
    .slice(0, 5);
});

const pendingResponseCount = computed(
  () =>
    allAssignments.value.filter(
      (assignment) =>
        !assignment.confirmationStatus ||
        assignment.confirmationStatus === "PENDING",
    ).length,
);

const notViewedCount = computed(
  () => allAssignments.value.filter((assignment) => !assignment.viewedAt).length,
);

const swapRequestCount = computed(
  () =>
    allAssignments.value.filter(
      (assignment) => assignment.confirmationStatus === "SWAP_REQUESTED",
    ).length,
);

const attendanceAssignments = computed(() =>
  allAssignments.value.filter(
    (assignment) =>
      assignment.attendanceStatus === "PRESENT" ||
      assignment.attendanceStatus === "ABSENT",
  ),
);

const percent = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const leaderMetrics = computed(() => [
  {
    label: "pendentes",
    value: pendingResponseCount.value,
    icon: Clock,
    className: "leader-metric-amber",
  },
  {
    label: "não viram",
    value: notViewedCount.value,
    icon: AlertTriangle,
    className: "leader-metric-red",
  },
  {
    label: "trocas",
    value: swapRequestCount.value,
    icon: Users,
    className: "leader-metric-indigo",
  },
  {
    label: "presença",
    value: `${attendanceRate.value}%`,
    icon: BarChart3,
    className: "leader-metric-teal",
  },
]);

const schedulesWithoutVolunteers = computed(
  () =>
    upcomingLeaderSchedules.value.filter(
      (schedule) => (schedule.assignments?.length || 0) === 0,
    ).length,
);

const openTaskCount = computed(
  () => tasks.value.filter((task) => task.status !== "DONE").length,
);

const leaderPendingItems = computed(() =>
  [
    {
      label: "Respostas pendentes",
      description: "Voluntários ainda não confirmaram a escala.",
      value: pendingResponseCount.value,
      color: "amber-darken-3",
    },
    {
      label: "Escalas não visualizadas",
      description: "Pessoas que ainda não abriram a convocação.",
      value: notViewedCount.value,
      color: "indigo-darken-2",
    },
    {
      label: "Pedidos de troca",
      description: "Respostas que pedem substituição ou alinhamento.",
      value: swapRequestCount.value,
      color: "purple-darken-3",
    },
    {
      label: "Escalas sem equipe",
      description: "Próximas escalas ainda sem voluntários.",
      value: schedulesWithoutVolunteers.value,
      color: "red-darken-2",
    },
    {
      label: "Tarefas abertas",
      description: "Atividades do ministério ainda em andamento.",
      value: openTaskCount.value,
      color: "teal-darken-2",
    },
  ].filter((item) => item.value > 0),
);

const confirmedRate = computed(() =>
  percent(
    allAssignments.value.filter(
      (assignment) => assignment.confirmationStatus === "CONFIRMED",
    ).length,
    allAssignments.value.length,
  ),
);

const viewedRate = computed(() =>
  percent(
    allAssignments.value.filter((assignment) => Boolean(assignment.viewedAt)).length,
    allAssignments.value.length,
  ),
);

const attendanceRate = computed(() =>
  percent(
    attendanceAssignments.value.filter(
      (assignment) => assignment.attendanceStatus === "PRESENT",
    ).length,
    attendanceAssignments.value.length,
  ),
);

const reportRows = computed(() => [
  { label: "Confirmação", value: confirmedRate.value },
  { label: "Visualização", value: viewedRate.value },
  { label: "Presença registrada", value: attendanceRate.value },
]);

const selectedSongToneText = computed(() => {
  if (!selectedSong.value) return "Tom não cadastrado.";

  const items = [
    selectedSong.value.metadata?.key ? `Tom: ${selectedSong.value.metadata.key}` : "",
    selectedSong.value.metadata?.bpm ? `BPM: ${selectedSong.value.metadata.bpm}` : "",
    selectedSong.value.metadata?.keyboardChords
      ? "Teclado: cifra própria cadastrada para esta música."
      : "Teclado: usando a cifra principal.",
    selectedSong.value.metadata?.notes || "",
  ].filter(Boolean);

  return items.join("\n") || "Tom não cadastrado.";
});

const songViewerCurrentKey = computed(() => {
  const key = personalSongForm.personalKey || selectedSong.value?.metadata?.key || "";
  return key ? `Tom ${key}` : "Tom não cadastrado";
});

const selectedSongChordsText = computed(() => {
  if (!selectedSong.value) return "";

  if (songViewerInstrument.value === "keyboard") {
    return (
      selectedSong.value.metadata?.keyboardChords ||
      personalSongForm.chords ||
      selectedSong.value.metadata?.chords ||
      ""
    );
  }

  return personalSongForm.chords || selectedSong.value.metadata?.chords || "";
});

const personalChordsSummary = computed(() =>
  songViewerInstrument.value === "keyboard"
    ? "Editar minha cifra de teclado"
    : "Editar minha cifra",
);

const songViewerScrollSpeedLabel = computed(() =>
  songViewerAutoScrollSpeed.value > 0
    ? `Velocidade ${Math.round(songViewerAutoScrollSpeed.value)}`
    : "Rolagem pausada",
);

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

const confirmedAssignments = (schedule: DepartmentSchedule) =>
  schedule.assignments?.filter(
    (assignment) => assignment.confirmationStatus === "CONFIRMED",
  ).length || 0;

const notViewedAssignments = (schedule: DepartmentSchedule) =>
  schedule.assignments?.filter((assignment) => !assignment.viewedAt).length || 0;

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
  songForm.keyboardChords = "";
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
  songViewerInstrument.value = "default";
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
  songViewerInstrument.value = "default";
};

const loadSongPreference = async (song: DepartmentSong) => {
  songPreferenceError.value = "";
  isLoadingSongPreference.value = true;
  personalSongForm.personalKey = "";
  personalSongForm.chords = song.metadata?.chords || "";

  try {
    const { data, error } = await getSongPreference(song.id);

    if (error) {
      songPreferenceError.value = error;
      return;
    }

    personalSongForm.personalKey = data?.personalKey || "";
    personalSongForm.chords = data?.chords || song.metadata?.chords || "";
  } finally {
    isLoadingSongPreference.value = false;
  }
};

const useOfficialChords = () => {
  personalSongForm.personalKey = selectedSong.value?.metadata?.key || "";
  personalSongForm.chords =
    songViewerInstrument.value === "keyboard"
      ? selectedSong.value?.metadata?.keyboardChords ||
        selectedSong.value?.metadata?.chords ||
        ""
      : selectedSong.value?.metadata?.chords || "";
};

const saveSongPreference = async () => {
  if (!selectedSong.value) return;

  songPreferenceError.value = "";
  isSavingSongPreference.value = true;

  try {
    const { data, error } = await updateSongPreference(selectedSong.value.id, {
      personalKey: personalSongForm.personalKey,
      chords: personalSongForm.chords,
    });

    if (error || !data) {
      songPreferenceError.value = error || "Não foi possível salvar sua cifra.";
      return;
    }

    personalSongForm.personalKey = data.personalKey || "";
    personalSongForm.chords = data.chords || "";
  } finally {
    isSavingSongPreference.value = false;
  }
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

  try {
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

    if (error || !data) {
      createTaskError.value = error || "Não foi possível criar a tarefa.";
      return;
    }

    tasks.value = editingTaskId.value
      ? tasks.value.map((task) => (task.id === data.id ? data : task))
      : [data, ...tasks.value];
    closeTaskDialog();
  } finally {
    isCreatingTask.value = false;
  }
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

  try {
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
  } finally {
    isCreatingSchedule.value = false;
  }
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

  try {
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
  } finally {
    isCreatingResource.value = false;
  }
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
  songForm.keyboardChords = song.metadata?.keyboardChords || "";
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
      keyboardChords: songForm.keyboardChords,
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
  } catch (error: any) {
    createSongError.value = error?.message || "Não foi possível salvar a música.";
  } finally {
    isCreatingSong.value = false;
  }
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

  try {
    const uploadedPdf = await uploadPdfFile(
      activityPdfFile.value,
      "Não foi possível enviar o PDF da atividade.",
    );

    if (!uploadedPdf) {
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

    if (error || !data) {
      createActivityError.value = error || "Não foi possível salvar a atividade.";
      return;
    }

    resources.value = [...resources.value, data].sort((current, next) =>
      current.title.localeCompare(next.title),
    );
    closeActivityDialog();
  } catch (error: any) {
    createActivityError.value = error?.message || "Não foi possível salvar a atividade.";
  } finally {
    isCreatingActivity.value = false;
  }
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

  try {
    if (target.kind === "task") {
      tasksError.value = "";
      const { error } = await deleteDepartmentTask(departmentId, target.id);

      if (error) {
        tasksError.value = error;
        return;
      }

      tasks.value = tasks.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "schedule") {
      schedulesError.value = "";
      const { error } = await deleteChurchSchedule(target.id);

      if (error) {
        schedulesError.value = error;
        return;
      }

      schedules.value = schedules.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "resource") {
      resourcesError.value = "";
      const { error } = await deleteDepartmentResource(departmentId, target.id);

      if (error) {
        resourcesError.value = error;
        return;
      }

      resources.value = resources.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "song") {
      songsError.value = "";
      const { error } = await deleteDepartmentSong(departmentId, target.id);

      if (error) {
        songsError.value = error;
        return;
      }

      songs.value = songs.value.filter((item) => item.id !== target.id);
    }

    pendingDelete.value = null;
  } finally {
    isConfirmingDelete.value = false;
  }
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

  try {
    const { data, error } = await updateScheduleAssignments(
      selectedScheduleId.value,
      {
        assignments: draftAssignments.value.map((assignment) => ({
          userId: assignment.userId,
          role: assignment.role,
        })),
      },
    );

    if (error || !data) {
      assignmentsError.value = error || "Não foi possível salvar os voluntários.";
      return;
    }

    schedules.value = schedules.value.map((schedule) =>
      schedule.id === data.id ? data : schedule,
    );
    closeAssignmentsDialog();
  } finally {
    isSavingAssignments.value = false;
  }
};

const sendReminder = async (schedule: DepartmentSchedule) => {
  leaderError.value = "";
  leaderMessage.value = "";
  isSendingReminderId.value = schedule.id;

  try {
    const { data, error } = await sendScheduleReminder(schedule.id);

    if (error || !data) {
      leaderError.value = error || "Não foi possível enviar o lembrete.";
      return;
    }

    leaderMessage.value = `Lembrete enviado para ${data.notifiedCount} voluntário(s).`;
  } finally {
    isSendingReminderId.value = "";
  }
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
.leader-panel-heading,
.leader-card-title,
.leader-list-row,
.leader-schedule-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.leader-panel-heading {
  justify-content: space-between;
}
.leader-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.leader-metric-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
  display: grid;
  gap: 7px;
  min-height: 118px;
}
.leader-metric-card span {
  color: #111827;
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1;
}
.leader-metric-card small {
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 800;
}
.leader-metric-icon {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}
.leader-metric-amber {
  background: #fffbeb;
  color: #b45309;
}
.leader-metric-red {
  background: #fef2f2;
  color: #b91c1c;
}
.leader-metric-indigo {
  background: #eef2ff;
  color: #4f46e5;
}
.leader-metric-teal {
  background: #f0fdfa;
  color: #0f766e;
}
.leader-panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 12px;
}
.leader-list {
  display: grid;
  gap: 10px;
}
.leader-list-row,
.leader-schedule-row {
  justify-content: space-between;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 11px 12px;
}
.leader-schedule-row {
  align-items: flex-start;
}
.leader-reminder-btn {
  flex: 0 0 auto;
}
.report-bars {
  display: grid;
  gap: 14px;
}
.report-row {
  display: grid;
  gap: 7px;
}
.report-row-top {
  align-items: center;
  color: #4b5563;
  display: flex;
  font-size: 0.78rem;
  font-weight: 800;
  justify-content: space-between;
}
.report-row-top strong {
  color: #111827;
}
.report-track {
  background: #f3f4f6;
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}
.report-track span {
  background: #4f46e5;
  border-radius: inherit;
  display: block;
  height: 100%;
  min-width: 4px;
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
.song-title-block {
  display: grid;
  gap: 2px;
}
.song-title-block h3,
.song-title-block p {
  line-height: 1.25;
  margin-bottom: 0;
}
.song-chip-row {
  margin-top: 6px;
}
.song-card-icon-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 2px;
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
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  max-height: 100vh;
  min-height: 100vh;
  overflow: hidden;
}
.song-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
}
.song-viewer-title {
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.song-viewer-toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.song-viewer-controls,
.song-viewer-key-controls,
.song-autoscroll-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.song-viewer-controls {
  justify-content: flex-end;
  min-width: 0;
}
.song-autoscroll-controls {
  min-height: 34px;
  color: #4b5563;
  font-size: 0.82rem;
  font-weight: 800;
}
.song-autoscroll-controls :deep(.v-slider) {
  flex: 1 1 160px;
  min-width: 140px;
  max-width: 260px;
}
.song-viewer-body {
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
}
.song-viewer-text {
  min-height: 0;
  max-height: calc(100vh - 190px);
  font-size: 1.12rem;
  line-height: 1.9;
}
.personal-chords-panel {
  display: grid;
  gap: 12px;
}
.personal-chords-editor {
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}
.personal-chords-editor summary {
  color: #6d28d9;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 800;
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
    max-height: none;
  }

  .song-viewer-toolbar {
    grid-template-columns: 1fr;
  }

  .song-viewer-controls {
    justify-content: flex-start;
  }

  .song-viewer-text {
    max-height: calc(100vh - 220px);
  }

  .ministery-detail-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .ministery-detail-summary,
  .ministery-card-grid,
  .leader-metric-grid,
  .leader-panel-grid {
    grid-template-columns: 1fr;
  }

  .ministery-section-actions .v-btn,
  .leader-panel-heading .v-btn,
  .leader-reminder-btn {
    width: 100%;
  }

  .leader-panel-heading,
  .leader-schedule-row {
    align-items: stretch;
    flex-direction: column;
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
