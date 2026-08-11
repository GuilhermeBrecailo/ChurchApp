<template>
  <div class="pa-4 page-wrapper min-vh-100">
    <div class="scale-page-header mb-5">
      <div class="min-w-0">
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Escalas</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Confira os próximos cultos e eventos
        </p>
      </div>
      <div class="scale-header-actions">
        <v-btn
          v-if="canCreateChurchSchedule"
          :color="accentColor"
          class="rounded-lg text-none px-4"
          elevation="2"
          @click="openNewScheduleDialog"
        >
          <Plus size="18" class="mr-1" /> Novo
        </v-btn>
        <UtilsPageHelpButton title="Escalas" />
      </div>
    </div>

    <div class="filter-strip mb-8">
      <div class="filter-scroll hide-scrollbar">
        <v-chip
          v-for="filter in filters"
          :key="filter"
          :variant="activeFilter === filter ? 'flat' : 'outlined'"
          :color="activeFilter === filter ? accentColor : 'grey-darken-1'"
          class="filter-chip cursor-pointer"
          @click="activeFilter = filter"
        >
          <span class="filter-chip-label">{{ filter }}</span>
        </v-chip>
      </div>
    </div>

    <div v-if="canCreateChurchSchedule" class="leader-summary-grid mb-5">
      <v-card class="leader-summary-card pa-3 elevation-1">
        <Clock class="stat-icon" size="18" :color="accentColor" />
        <p class="text-caption text-grey-darken-1 mb-1 mt-1">Pendentes</p>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ leaderSummary.pending }}
        </h2>
      </v-card>
      <v-card class="leader-summary-card pa-3 elevation-1">
        <EyeOff class="stat-icon" size="18" :color="accentColor" />
        <p class="text-caption text-grey-darken-1 mb-1 mt-1">Não viram</p>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ leaderSummary.notViewed }}
        </h2>
      </v-card>
      <v-card class="leader-summary-card pa-3 elevation-1">
        <Repeat2 class="stat-icon" size="18" :color="accentColor" />
        <p class="text-caption text-grey-darken-1 mb-1 mt-1">Trocas</p>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ leaderSummary.swapRequests }}
        </h2>
      </v-card>
    </div>

    <div>
      <ScaleScheduleSection
        v-for="(section, index) in filteredSchedules"
        :key="index"
        :title="section.category"
        :events="section.events"
        :selected-event-id="focusedScheduleId"
        @open-details="openScheduleDetails"
        @add-volunteer="openAssignmentsDialog"
        @edit="openScheduleEditDialog"
        @delete="handleDeleteSchedule"
        @mark-viewed="handleMarkScheduleViewed"
        @confirm-presence="handleConfirmSchedule"
        @decline-presence="handleDeclineSchedule"
        @request-swap="handleRequestSwap"
      />

      <div v-if="isLoadingSchedules" class="scale-loading">
        <v-skeleton-loader type="card" class="mb-3" />
        <v-skeleton-loader type="card" />
      </div>

      <v-card
        v-else-if="filteredSchedules.length === 0 && !schedulesError"
        class="rounded-xl pa-6 elevation-1 d-flex flex-column align-center justify-center"
      >
        <Calendar size="32" :color="isDark ? '#484f58' : '#9CA3AF'" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhuma escala encontrada
        </p>
      </v-card>

      <v-alert
        v-if="schedulesError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ schedulesError }}
      </v-alert>
    </div>

    <UtilsResponsiveOverlay
      v-model="isScheduleDetailsOpen"
      scrollable
      :scrim="true"
      max-width="980"
      mobile-class="scale-details-mobile-sheet"
    >
      <v-card v-if="selectedDetailEvent" class="scale-details-sheet" elevation="0">
        <div class="scale-details-handle" />

        <div class="scale-details-header">
          <div class="min-w-0">
            <p class="scale-details-kicker mb-1">
              {{ selectedDetailEvent.date }} · {{ selectedDetailEvent.time }}
            </p>
            <h2 class="scale-details-title mb-1">
              {{ selectedDetailEvent.title }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ selectedDetailDepartmentName }}
            </p>
          </div>

          <div class="scale-details-header-actions">
            <v-tooltip v-if="selectedDetailEvent.canManage" text="Voluntários" location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="tonal"
                  color="primary"
                  @click="openAssignmentsFromDetails"
                >
                  <UserPlus size="18" />
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="selectedDetailEvent.canManage" text="Editar" location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="tonal"
                  color="grey-darken-2"
                  @click="openEditFromDetails"
                >
                  <Pencil size="18" />
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="selectedDetailEvent.canManage" text="Apagar" location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="tonal"
                  color="red-darken-2"
                  @click="openDeleteFromDetails"
                >
                  <Trash2 size="18" />
                </v-btn>
              </template>
            </v-tooltip>
            <v-btn icon variant="text" color="grey-darken-1" @click="closeScheduleDetails">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <div class="scale-details-body">
          <div class="scale-details-stats">
            <div class="scale-details-stat">
              <span>{{ selectedDetailEvent.volunteerCount }}</span>
              <small>escalados</small>
            </div>
            <div class="scale-details-stat">
              <span>{{ selectedDetailEvent.confirmedCount }}</span>
              <small>confirmados</small>
            </div>
            <div class="scale-details-stat">
              <span>{{ selectedDetailSongs.length }}</span>
              <small>músicas</small>
            </div>
          </div>

          <section
            v-if="selectedDetailEvent.currentUserAssignment"
            class="scale-details-section"
          >
            <div class="scale-details-section-title">
              <CheckCircle2 size="18" />
              <h3>Sua resposta</h3>
            </div>
            <div class="scale-response-panel">
              <div class="min-w-0">
                <p class="scale-response-status mb-1">
                  {{ assignmentStatusText(selectedDetailEvent) }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ selectedDetailEvent.currentUserAssignment.viewedAt ? "Escala visualizada" : "Ainda não marcada como vista" }}
                </p>
              </div>
              <div class="scale-response-actions">
                <v-btn
                  v-if="!selectedDetailEvent.currentUserAssignment.viewedAt"
                  variant="tonal"
                  color="indigo-darken-2"
                  size="small"
                  class="text-none"
                  @click="handleMarkScheduleViewed(selectedDetailEvent)"
                >
                  <Eye size="16" class="mr-1" /> Vi
                </v-btn>
                <v-btn
                  v-if="selectedDetailEvent.currentUserAssignment.confirmationStatus !== 'CONFIRMED'"
                  color="purple-darken-3"
                  size="small"
                  class="text-none"
                  @click="handleConfirmSchedule(selectedDetailEvent)"
                >
                  Confirmar
                </v-btn>
                <v-btn
                  v-if="selectedDetailEvent.currentUserAssignment.confirmationStatus !== 'DECLINED'"
                  variant="tonal"
                  color="red-darken-2"
                  size="small"
                  class="text-none"
                  @click="handleDeclineSchedule(selectedDetailEvent)"
                >
                  Não posso
                </v-btn>
                <v-btn
                  v-if="selectedDetailEvent.currentUserAssignment.confirmationStatus !== 'SWAP_REQUESTED'"
                  variant="tonal"
                  color="indigo-darken-2"
                  size="small"
                  class="text-none"
                  @click="handleRequestSwap(selectedDetailEvent)"
                >
                  Troca
                </v-btn>
              </div>
            </div>
          </section>

          <section class="scale-details-section">
            <div class="scale-details-section-title">
              <Users size="18" />
              <h3>Equipe</h3>
            </div>

            <div v-if="selectedDetailEvent.volunteers.length" class="scale-details-team">
              <div
                v-for="volunteer in selectedDetailEvent.volunteers"
                :key="`${volunteer.name}-${volunteer.role}`"
                class="scale-details-person"
              >
                <div>
                  <p class="scale-details-person-name mb-0">{{ volunteer.name }}</p>
                  <p class="scale-details-person-role mb-0">{{ volunteer.role }}</p>
                </div>
                <div class="d-flex align-center ga-1">
                  <v-chip
                    size="small"
                    :color="responseStatusColor(volunteer.confirmationStatus)"
                    variant="tonal"
                  >
                    {{ responseStatusLabel(volunteer.confirmationStatus) }}
                  </v-chip>
                  <v-tooltip
                    v-if="selectedDetailEvent.canManage && volunteer.confirmationStatus === 'DECLINED' && volunteer.declineReason"
                    :text="volunteer.declineReason"
                    location="top"
                    max-width="260"
                  >
                    <template #activator="{ props: tooltipProps }">
                      <v-icon
                        v-bind="tooltipProps"
                        icon="mdi-information-outline"
                        size="16"
                        color="grey"
                        style="cursor: pointer"
                      />
                    </template>
                  </v-tooltip>
                </div>
              </div>
            </div>

            <v-card v-else class="scale-details-empty" elevation="0">
              <UserPlus size="20" />
              <span>Nenhum voluntário escalado.</span>
            </v-card>
          </section>

          <section
            v-if="selectedDetailEvent.rehearsalLabel || selectedDetailEvent.rehearsalNotes"
            class="scale-details-section"
          >
            <div class="scale-details-section-title">
              <Clock size="18" />
              <h3>Ensaio</h3>
            </div>
            <div class="scale-details-note">
              <strong v-if="selectedDetailEvent.rehearsalLabel">
                {{ selectedDetailEvent.rehearsalLabel }}
              </strong>
              <span v-if="selectedDetailEvent.rehearsalNotes">
                {{ selectedDetailEvent.rehearsalNotes }}
              </span>
            </div>
          </section>

          <section v-if="selectedDetailSongs.length" class="scale-details-section">
            <div class="scale-details-section-title scale-details-section-title-row">
              <div class="d-flex align-center ga-2">
                <Music size="18" />
                <h3>Louvor</h3>
              </div>
              <v-chip size="small" variant="tonal" color="purple-darken-3">
                {{ selectedDetailSongs.length }} músicas
              </v-chip>
            </div>

            <div class="scale-playlist-actions">
              <v-btn
                color="purple-darken-3"
                class="text-none font-weight-bold"
                @click="openPlaylistSequence(0)"
              >
                <Play size="16" class="mr-1" /> Tocar sequência
              </v-btn>
              <v-btn-toggle
                v-model="playlistMode"
                density="compact"
                mandatory
                class="song-instrument-toggle"
              >
                <v-btn value="lyrics" size="small" class="text-none">Letra</v-btn>
                <v-btn value="chords" size="small" class="text-none">Cifra</v-btn>
              </v-btn-toggle>
            </div>

            <div class="scale-song-list">
              <article
                v-for="(song, songIndex) in selectedDetailSongs"
                :key="song.id"
                class="scale-song-card"
                :class="{
                  'scale-song-card-dragging': draggedSongId === song.id,
                  'scale-song-card-saving': isSavingSongOrder && draggedSongId === song.id,
                }"
                :data-scale-song-id="song.id"
              >
                <div class="scale-song-row">
                  <span class="scale-song-index">{{ songIndex + 1 }}</span>

                  <div
                    class="scale-song-info"
                    role="button"
                    tabindex="0"
                    @click="openPlaylistSequence(songIndex)"
                    @keydown.enter="openPlaylistSequence(songIndex)"
                    @keydown.space.prevent="openPlaylistSequence(songIndex)"
                  >
                    <div class="scale-song-header">
                      <div class="min-w-0">
                        <h4 class="scale-song-title mb-1">{{ song.title }}</h4>
                        <p class="scale-song-artist mb-0">
                          {{ song.metadata?.artist || "Artista não informado" }}
                        </p>
                      </div>
                    </div>
                    <div class="scale-song-meta">
                      <v-chip
                        size="small"
                        variant="tonal"
                        :color="song.metadata?.key ? 'orange-darken-3' : undefined"
                      >
                        {{ song.metadata?.key ? `Tom ${songKeyLabel(song.metadata.key)}` : "Sem tom" }}
                      </v-chip>
                      <v-chip v-if="song.metadata?.bpm" size="small" variant="tonal">
                        {{ song.metadata.bpm }} BPM
                      </v-chip>
                      <v-chip
                        v-if="song.metadata?.chords"
                        size="small"
                        variant="tonal"
                        color="teal-darken-2"
                      >
                        Cifra
                      </v-chip>
                    </div>
                  </div>

                  <div v-if="selectedDetailEvent?.canManage" class="scale-song-order-btns">
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :disabled="songIndex === 0 || isSavingSongOrder"
                      :aria-label="'Subir ' + song.title"
                      @click.stop="moveSong(songIndex, -1)"
                    >
                      <ChevronUp size="18" />
                    </v-btn>
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :disabled="songIndex === selectedDetailSongs.length - 1 || isSavingSongOrder"
                      :aria-label="'Descer ' + song.title"
                      @click.stop="moveSong(songIndex, 1)"
                    >
                      <ChevronDown size="18" />
                    </v-btn>
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      class="scale-song-drag-handle"
                      :class="{ 'scale-song-drag-handle-active': draggedSongId === song.id }"
                      :aria-label="'Arrastar ' + song.title"
                      @pointerdown.stop.prevent="startSongDrag($event, song)"
                    >
                      <GripVertical size="18" />
                    </v-btn>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section v-if="selectedDetailResources.length" class="scale-details-section">
            <div class="scale-details-section-title">
              <FileText size="18" />
              <h3>Recursos</h3>
            </div>
            <div class="scale-resource-list">
              <a
                v-for="resource in selectedDetailResources"
                :key="resource.id"
                :href="resource.url"
                target="_blank"
                rel="noopener noreferrer"
                class="scale-resource-item"
              >
                <span>{{ resource.title }}</span>
                <v-chip size="x-small" color="teal-darken-2" variant="tonal">
                  {{ resource.category }}
                </v-chip>
              </a>
            </div>
          </section>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isSongFullscreenOpen" fullscreen>
      <MusicPlaylistReader
        :songs="selectedDetailSongs"
        :initial-index="playlistIndex"
        :tab="playlistMode"
        :keyboard-assignment="isKeyboardAssignment(selectedDetailEvent)"
        @close="closeSongFullscreen"
        @update:tab="playlistMode = $event"
      />
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isScheduleDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgColor" size="44" class="mr-3">
              <Calendar size="20" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                {{ editingScheduleId ? "Editar escala" : "Nova escala" }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Cadastre uma escala para um ministério.
              </p>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :disabled="isCreatingSchedule"
            @click="closeScheduleDialog"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveSchedule">
          <v-text-field
            v-model="scheduleForm.title"
            label="Título"
            prepend-inner-icon="mdi-calendar-text-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <div class="scale-field-grid mb-4">
            <v-text-field
              v-model="scheduleForm.date"
              label="Data"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              :bg-color="isDark ? 'transparent' : 'white'"
              class="scale-input"
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
              :bg-color="isDark ? 'transparent' : 'white'"
              class="scale-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
          </div>

          <v-select
            v-model="scheduleForm.departmentId"
            label="Ministério"
            :items="departmentOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-group-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <div class="scale-field-grid mb-4">
            <v-text-field
              v-model="scheduleForm.rehearsalDate"
              label="Data do ensaio"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              :bg-color="isDark ? 'transparent' : 'white'"
              class="scale-input"
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
              :bg-color="isDark ? 'transparent' : 'white'"
              class="scale-input"
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
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <div class="playlist-builder mb-4">
            <div class="playlist-builder-header">
              <p class="text-caption font-weight-bold text-grey-darken-1 mb-0">
                Playlist da escala
              </p>
              <v-btn
                variant="tonal"
                :color="accentColor"
                size="small"
                class="text-none"
                :disabled="isCreatingSchedule || !scheduleForm.departmentId"
                @click="openSongPicker"
              >
                <Plus size="16" class="mr-1" /> Adicionar música
              </v-btn>
            </div>

            <p
              v-if="!scheduleForm.departmentId"
              class="text-caption text-grey-darken-1 mb-0"
            >
              Selecione um ministério para montar a playlist.
            </p>
            <p
              v-else-if="!formPlaylistSongs.length"
              class="text-caption text-grey-darken-1 mb-0"
            >
              {{ selectedDepartmentSongs.length ? "Nenhuma música escolhida ainda." : "Este ministério ainda não tem repertório cadastrado." }}
            </p>

            <div v-else class="playlist-builder-list">
              <div
                v-for="(song, songIndex) in formPlaylistSongs"
                :key="song.id"
                class="playlist-builder-row"
              >
                <span class="playlist-builder-index">{{ songIndex + 1 }}</span>
                <div class="min-w-0">
                  <p class="playlist-builder-title mb-0">{{ song.title }}</p>
                  <p class="playlist-builder-artist mb-0">
                    {{ song.metadata?.artist || "Artista não informado" }}
                  </p>
                </div>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="song.metadata?.key ? 'orange-darken-3' : undefined"
                >
                  {{ song.metadata?.key ? songKeyLabel(song.metadata.key) : "Sem tom" }}
                </v-chip>
                <div class="playlist-builder-actions">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    :disabled="songIndex === 0 || isCreatingSchedule"
                    :aria-label="'Subir ' + song.title"
                    @click="moveFormSong(songIndex, -1)"
                  >
                    <ChevronUp size="16" />
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    :disabled="songIndex === formPlaylistSongs.length - 1 || isCreatingSchedule"
                    :aria-label="'Descer ' + song.title"
                    @click="moveFormSong(songIndex, 1)"
                  >
                    <ChevronDown size="16" />
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="red-darken-2"
                    :disabled="isCreatingSchedule"
                    :aria-label="'Remover ' + song.title"
                    @click="toggleFormSong(song.id)"
                  >
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>

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
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input mb-4"
            hide-details="auto"
            multiple
            chips
            closable-chips
            :disabled="isCreatingSchedule"
          />

          <div v-if="memberOptions.length" class="mb-4">
            <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
              Voluntários
            </p>

            <v-alert
              v-if="!scheduleForm.departmentId"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Selecione um ministério para adicionar voluntários.
            </v-alert>

            <div class="scale-field-grid mb-2">
              <v-select
                v-model="scheduleFormVolunteerUserId"
                label="Voluntário"
                :items="memberOptions"
                item-title="label"
                item-value="value"
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                :bg-color="isDark ? 'transparent' : 'white'"
                class="scale-input"
                hide-details="auto"
                :disabled="isCreatingSchedule || !scheduleForm.departmentId"
              />
              <v-combobox
                v-model="scheduleFormVolunteerRole"
                label="Função"
                :items="scheduleFormAssignmentRoleOptions"
                placeholder="ex: Teclado"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                :bg-color="isDark ? 'transparent' : 'white'"
                class="scale-input"
                hide-details="auto"
                :disabled="isCreatingSchedule || !scheduleForm.departmentId"
              />
            </div>

            <v-btn
              variant="tonal"
              :color="accentColor"
              size="small"
              class="text-none mb-3"
              :disabled="isCreatingSchedule || !scheduleForm.departmentId || !scheduleFormVolunteerUserId"
              @click="addFormVolunteer"
            >
              <Plus size="16" class="mr-1" /> Adicionar voluntário
            </v-btn>

            <div v-if="scheduleForm.assignments.length" class="d-flex flex-column gap-2">
              <div
                v-for="volunteer in scheduleForm.assignments"
                :key="volunteer.userId"
                class="schedule-form-volunteer-row"
              >
                <div class="min-w-0">
                  <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                    {{ volunteer.name }}
                  </p>
                  <p class="text-caption text-grey-darken-1 mb-0">{{ volunteer.role }}</p>
                </div>
                <v-btn
                  icon
                  variant="text"
                  color="grey-darken-1"
                  size="small"
                  :disabled="isCreatingSchedule"
                  @click="removeFormVolunteer(volunteer.userId)"
                >
                  <v-icon size="18">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
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
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isSongPickerOpen" max-width="560" scrollable>
      <v-card class="song-picker" elevation="0">
        <div class="song-picker-header">
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Adicionar música
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ formPlaylistSongs.length }} na playlist · {{ selectedDepartmentSongs.length }} no repertório
            </p>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            aria-label="Fechar"
            @click="isSongPickerOpen = false"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field
          v-model="songPickerSearch"
          label="Buscar por título ou artista"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input song-picker-search"
          hide-details
          clearable
        />

        <div class="song-picker-list">
          <p
            v-if="!songPickerResults.length"
            class="text-caption text-grey-darken-1 text-center py-6 mb-0"
          >
            Nenhuma música encontrada.
          </p>

          <button
            v-for="song in songPickerResults"
            :key="song.id"
            type="button"
            class="song-picker-item"
            :class="{ 'song-picker-item-selected': scheduleForm.songIds.includes(song.id) }"
            @click="toggleFormSong(song.id)"
          >
            <div class="song-picker-check">
              <v-icon v-if="scheduleForm.songIds.includes(song.id)" size="18">
                mdi-check
              </v-icon>
              <span v-else class="song-picker-check-empty" />
            </div>

            <div class="min-w-0 text-left">
              <p class="song-picker-title mb-0">{{ song.title }}</p>
              <p class="song-picker-artist mb-1">
                {{ song.metadata?.artist || "Artista não informado" }}
              </p>
              <div class="song-picker-chips">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="song.metadata?.key ? 'orange-darken-3' : undefined"
                >
                  {{ song.metadata?.key ? `Tom ${songKeyLabel(song.metadata.key)}` : "Sem tom" }}
                </v-chip>
                <v-chip v-if="song.metadata?.bpm" size="x-small" variant="tonal">
                  {{ song.metadata.bpm }} BPM
                </v-chip>
                <v-chip
                  v-if="song.metadata?.chords"
                  size="x-small"
                  variant="tonal"
                  color="teal-darken-2"
                >
                  Cifra
                </v-chip>
                <v-chip
                  v-if="song.metadata?.songCategory"
                  size="x-small"
                  variant="tonal"
                  color="purple-darken-3"
                >
                  {{ song.metadata.songCategory }}
                </v-chip>
              </div>
            </div>

            <span
              v-if="playlistPositionOf(song.id)"
              class="song-picker-order"
            >
              {{ playlistPositionOf(song.id) }}º
            </span>
          </button>
        </div>

        <div class="song-picker-footer">
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            block
            @click="isSongPickerOpen = false"
          >
            Concluir
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isAssignmentsDialogOpen" max-width="560">
      <v-card class="rounded-xl pa-6" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgColor" size="44" class="mr-3">
              <UserPlus size="20" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                Voluntários da escala
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                {{ selectedSchedule?.description || "Monte a equipe da escala." }}
              </p>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :disabled="isSavingAssignments"
            @click="closeAssignmentsDialog"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="scale-field-grid mb-4">
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
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
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
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSavingAssignments"
          />
        </div>

        <v-btn
          :color="accentColor"
          variant="tonal"
          class="text-none mb-4"
          :disabled="isSavingAssignments"
          @click="addDraftAssignment"
        >
          <Plus size="18" class="mr-1" /> Adicionar voluntário
        </v-btn>

        <div v-if="draftAssignments.length" class="d-flex flex-column gap-2 mb-4">
          <v-card
            v-for="assignment in draftAssignments"
            :key="assignment.userId"
            class="rounded-lg pa-3 bg-grey-lighten-5"
            elevation="0"
          >
            <div class="d-flex justify-space-between align-center gap-3">
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
                    v-if="assignment.warning"
                    size="x-small"
                    color="amber-darken-3"
                    variant="tonal"
                  >
                    {{ assignment.warning }}
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

    <UtilsConfirmDialog
      v-model="isDeleteScheduleDialogOpen"
      title="Remover escala"
      message="Esta escala e seus voluntários serão removidos."
      :loading="isDeletingSchedule"
      @cancel="closeDeleteScheduleDialog"
      @confirm="confirmDeleteSchedule"
    />

    <v-dialog v-model="declineDialog.open" max-width="440" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pt-5 px-5">
          Por que você não pode ir?
        </v-card-title>
        <v-card-text class="px-5 pb-2">
          <v-textarea
            v-model="declineDialog.reason"
            label="Motivo (opcional)"
            placeholder="Ex: compromisso de trabalho, viagem..."
            rows="3"
            auto-grow
            hide-details
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-4 pt-2 justify-end gap-2">
          <v-btn
            variant="text"
            @click="declineDialog.open = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="red-darken-2"
            variant="tonal"
            @click="confirmDecline"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import { CheckCircle2, ChevronDown, ChevronUp, GripVertical, Clock, Eye, EyeOff, FileText, Music, Pencil, Play, Plus, Repeat2, Trash2, UserPlus, Users } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentSong,
} from "../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../composables/useMembers";

const {
  getDepartments,
  getChurchSchedules,
  createChurchSchedule,
  updateChurchSchedule,
  deleteChurchSchedule,
  updateScheduleAssignments,
  updateMyScheduleAssignment,
  updateScheduleAssignmentAttendance,
  getDepartmentResources,
  getDepartmentSongs,
  reorderScheduleMediaItems,
} = useDepartments();
const { getMembers } = useMembers();
const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgColor = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");
const route = useRoute();


const activeFilter = ref("Todos");
const departments = ref<ChurchDepartment[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
const isLoadingSchedules = ref(true);
const members = ref<ChurchMember[]>([]);
const resourcesByDepartment = ref<Record<string, DepartmentResource[]>>({});
const songsByDepartment = ref<Record<string, DepartmentSong[]>>({});
const schedulesError = ref("");
const createScheduleError = ref("");
const assignmentsError = ref("");
const isScheduleDialogOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isCreatingSchedule = ref(false);
const isSavingAssignments = ref(false);
const isDeletingSchedule = ref(false);
const selectedScheduleId = ref("");
const focusedScheduleId = ref("");
const editingScheduleId = ref("");
const isPrefillingScheduleForm = ref(false);
const pendingDeleteSchedule = ref<ScheduleEvent | null>(null);
const selectedDetailEvent = ref<ScheduleEvent | null>(null);
const isSongFullscreenOpen = ref(false);
const playlistMode = ref<"lyrics" | "chords">("lyrics");
const playlistIndex = ref(0);
const isSongPickerOpen = ref(false);
const songPickerSearch = ref("");
const draggedSongId = ref("");
const isSavingSongOrder = ref(false);
let songDragPointerId: number | null = null;
let songDragHandle: HTMLElement | null = null;

const declineDialog = reactive({
  open: false,
  event: null as ScheduleEvent | null,
  reason: "",
});

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
  departmentId: "",
  rehearsalDate: "",
  rehearsalTime: "",
  rehearsalNotes: "",
  songIds: [] as string[],
  resourceIds: [] as string[],
  assignments: [] as { userId: string; name: string; role: string }[],
});

const scheduleFormVolunteerUserId = ref("");
const scheduleFormVolunteerRole = ref("");

const assignmentForm = reactive({
  userId: "",
  role: "",
});

const draftAssignments = ref<
  {
    userId: string;
    assignmentId?: string;
    name: string;
    role: string;
    viewedAt?: string | null;
    confirmationStatus?: string;
    attendanceStatus?: string;
    warning?: string;
  }[]
>([]);

const filters = computed(() => [
  "Todos",
  ...departments.value.map((department) => department.name),
]);

const isChurchWideManager = computed(
  () =>
    user.value?.role === "PASTOR" ||
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const manageableDepartments = computed(() => {
  if (isChurchWideManager.value) {
    return departments.value;
  }

  return departments.value.filter(
    (department) =>
      department.canManageSchedule === true ||
      department.leaderId === user.value?.id,
  );
});

const departmentOptions = computed(() =>
  manageableDepartments.value.map((department) => ({
    label: department.name,
    value: department.id,
  })),
);

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

const selectedAssignmentDepartment = computed(() => {
  const schedule = selectedSchedule.value;
  return departments.value.find(
    (department) => department.id === schedule?.departmentId,
  );
});

const assignmentRoleOptions = computed(
  () =>
    departmentRoleOptions[selectedAssignmentDepartment.value?.type || ""] || [
      "Voluntário",
    ],
);

const scheduleFormAssignmentRoleOptions = computed(() => {
  const dept = departments.value.find((d) => d.id === scheduleForm.departmentId);
  return departmentRoleOptions[dept?.type || ""] || ["Voluntário"];
});

const memberOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const selectedDepartmentResources = computed(
  () => resourcesByDepartment.value[scheduleForm.departmentId] || [],
);

const selectedDepartmentSongs = computed(
  () => songsByDepartment.value[scheduleForm.departmentId] || [],
);

// A playlist e ordenada: songIds guarda a ordem escolhida e o backend grava
// esse indice em ScheduleMediaItem.order.
const formPlaylistSongs = computed(() =>
  scheduleForm.songIds
    .map((songId) => selectedDepartmentSongs.value.find((song) => song.id === songId))
    .filter((song): song is DepartmentSong => Boolean(song)),
);

const songPickerResults = computed(() => {
  const term = songPickerSearch.value?.trim().toLocaleLowerCase("pt-BR") || "";

  if (!term) return selectedDepartmentSongs.value;

  return selectedDepartmentSongs.value.filter((song) =>
    `${song.title} ${song.metadata?.artist || ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(term),
  );
});

const playlistPositionOf = (songId: string) => {
  const index = scheduleForm.songIds.indexOf(songId);
  return index < 0 ? 0 : index + 1;
};

const openSongPicker = () => {
  songPickerSearch.value = "";
  isSongPickerOpen.value = true;
};

const toggleFormSong = (songId: string) => {
  const index = scheduleForm.songIds.indexOf(songId);

  if (index < 0) {
    scheduleForm.songIds = [...scheduleForm.songIds, songId];
    return;
  }

  scheduleForm.songIds = scheduleForm.songIds.filter((id) => id !== songId);
};

const moveFormSong = (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= scheduleForm.songIds.length) return;

  const reordered = [...scheduleForm.songIds];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  scheduleForm.songIds = reordered;
};

const resourceOptions = computed(() =>
  selectedDepartmentResources.value.map((resource) => ({
    label: `${resource.title} (${resource.category})`,
    value: resource.id,
  })),
);

const responseStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmou",
    DECLINED: "Não pode",
    MAYBE: "Pendente",
    SWAP_REQUESTED: "Troca",
    PENDING: "Pendente",
  };

  return labels[status || "PENDING"] || "Pendente";
};

const responseStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    CONFIRMED: "teal-darken-2",
    DECLINED: "red-darken-2",
    MAYBE: "grey",
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

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

const leaderSummary = computed(() => {
  const assignments = schedules.value.flatMap((schedule) => schedule.assignments || []);

  return {
    pending: assignments.filter(
      (assignment) =>
        !assignment.confirmationStatus ||
        assignment.confirmationStatus === "PENDING",
    ).length,
    notViewed: assignments.filter((assignment) => !assignment.viewedAt).length,
    swapRequests: assignments.filter(
      (assignment) => assignment.confirmationStatus === "SWAP_REQUESTED",
    ).length,
  };
});

const isDeleteScheduleDialogOpen = computed({
  get: () => Boolean(pendingDeleteSchedule.value),
  set: (value: boolean) => {
    if (!value && !isDeletingSchedule.value) {
      pendingDeleteSchedule.value = null;
    }
  },
});

const isScheduleDetailsOpen = computed({
  get: () => Boolean(selectedDetailEvent.value),
  set: (value: boolean) => {
    if (!value) {
      selectedDetailEvent.value = null;
    }
  },
});

type ScheduleEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  rehearsalLabel?: string;
  rehearsalNotes?: string | null;
  volunteerCount: number;
  viewedCount: number;
  confirmedCount: number;
  volunteers: {
    initials: string;
    name: string;
    role: string;
    confirmationStatus?: string;
    attendanceStatus?: string;
    viewedAt?: string | null;
    declineReason?: string | null;
  }[];
  currentUserAssignment?: {
    id: string;
    role: string;
    viewedAt?: string | null;
    confirmationStatus?: string;
    confirmedAt?: string | null;
  } | null;
  mediaItems: {
    id: string;
    scheduleMediaItemId: string;
    order: number;
    title: string;
    category: string;
    url?: string;
    metadata?: DepartmentSong["metadata"] | DepartmentResource["metadata"];
  }[];
  canManage: boolean;
};

const selectedDetailDepartmentName = computed(() => {
  const event = selectedDetailEvent.value;
  if (!event) return "";

  const schedule = schedules.value.find((item) => item.id === event.id);
  return schedule?.department?.name || "Sem ministério";
});

const selectedDetailSongs = computed(
  () =>
    selectedDetailEvent.value?.mediaItems.filter(
      (item) => item.category === "MUSIC",
    ) || [],
);

const selectedDetailResources = computed(
  () =>
    selectedDetailEvent.value?.mediaItems.filter(
      (item) => item.category !== "MUSIC",
    ) || [],
);

const canCreateChurchSchedule = computed(
  () => manageableDepartments.value.length > 0,
);

const canManageSchedule = (schedule: DepartmentSchedule) =>
  isChurchWideManager.value ||
  departments.value.some(
    (department) =>
      department.id === schedule.departmentId &&
      department.canManageSchedule === true,
  ) ||
  schedule.department?.leaderId === user.value?.id;

const filteredSchedules = computed(() => {
  const visibleSchedules =
    activeFilter.value === "Todos"
      ? schedules.value
      : schedules.value.filter(
          (schedule) => schedule.department?.name === activeFilter.value,
        );

  const groups = visibleSchedules.reduce<Record<string, ScheduleEvent[]>>(
    (acc, schedule) => {
      const category = schedule.department?.name || "Sem ministério";
      acc[category] ||= [];
      acc[category].push(toScheduleEvent(schedule));
      return acc;
    },
    {},
  );

  return Object.entries(groups).map(([category, events]) => ({
    category,
    events,
  }));
});

const toScheduleEvent = (schedule: DepartmentSchedule): ScheduleEvent => {
  const date = new Date(schedule.date);
  const rehearsalDate = schedule.rehearsalAt ? new Date(schedule.rehearsalAt) : null;
  const currentUserAssignment = schedule.assignments?.find(
    (assignment) => assignment.userId === user.value?.id,
  );

  return {
    id: schedule.id,
    title: schedule.description,
    date: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
    }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
    rehearsalLabel:
      rehearsalDate && !Number.isNaN(rehearsalDate.getTime())
        ? new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(rehearsalDate)
        : "",
    rehearsalNotes: schedule.rehearsalNotes,
    volunteerCount: schedule.assignments?.length || 0,
    viewedCount:
      schedule.assignments?.filter((assignment) => Boolean(assignment.viewedAt))
        .length || 0,
    confirmedCount:
      schedule.assignments?.filter(
        (assignment) => assignment.confirmationStatus === "CONFIRMED",
      ).length || 0,
    currentUserAssignment: currentUserAssignment
        ? {
            id: currentUserAssignment.id,
            role: currentUserAssignment.role,
            viewedAt: currentUserAssignment.viewedAt,
            confirmationStatus: currentUserAssignment.confirmationStatus,
            confirmedAt: currentUserAssignment.confirmedAt,
        }
      : null,
    mediaItems:
      schedule.mediaItems?.map((item) => ({
        id: item.mediaItem.id,
        scheduleMediaItemId: item.id,
        order: item.order ?? 0,
        title: item.mediaItem.title,
        category: item.mediaItem.category,
        url: item.mediaItem.url,
        metadata: item.mediaItem.metadata,
      })) || [],
    canManage: canManageSchedule(schedule),
    volunteers:
      schedule.assignments?.map((assignment) => ({
        name: assignment.user.name,
        role: assignment.role,
        confirmationStatus: assignment.confirmationStatus,
        attendanceStatus: assignment.attendanceStatus,
        viewedAt: assignment.viewedAt,
        declineReason: assignment.declineReason,
        initials: assignment.user.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join(""),
      })) || [],
  };
};

const openScheduleDetails = (event: ScheduleEvent) => {
  selectedDetailEvent.value = event;
  playlistIndex.value = 0;
};

const closeScheduleDetails = () => {
  selectedDetailEvent.value = null;
};

const setEventSongOrder = (
  event: ScheduleEvent,
  orderedSongs: ScheduleEvent["mediaItems"],
) => {
  const resources = event.mediaItems.filter((item) => item.category !== "MUSIC");
  event.mediaItems = [...orderedSongs, ...resources];
};

const persistSongOrder = async (
  event: ScheduleEvent,
  songs: ScheduleEvent["mediaItems"],
) => {
  isSavingSongOrder.value = true;
  const items = songs.map((song, i) => ({
    id: song.scheduleMediaItemId,
    order: i,
  }));

  try {
    const { error } = await reorderScheduleMediaItems(event.id, items);
    if (error) await loadSchedules();
  } finally {
    isSavingSongOrder.value = false;
  }
};

const reorderSongsLocally = (fromId: string, toId: string) => {
  const event = selectedDetailEvent.value;
  if (!event || fromId === toId) return null;

  const songs = event.mediaItems.filter((item) => item.category === "MUSIC");
  const fromIndex = songs.findIndex((song) => song.id === fromId);
  const toIndex = songs.findIndex((song) => song.id === toId);
  if (fromIndex < 0 || toIndex < 0) return null;

  const reordered = [...songs];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  setEventSongOrder(event, reordered);
  return reordered;
};

const moveSong = async (index: number, direction: -1 | 1) => {
  const event = selectedDetailEvent.value;
  if (!event) return;

  const songs = event.mediaItems.filter((item) => item.category === "MUSIC");
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= songs.length) return;

  const reordered = [...songs];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  setEventSongOrder(event, reordered);
  await persistSongOrder(event, reordered);
};

const onSongDragMove = (event: PointerEvent) => {
  if (!draggedSongId.value || event.pointerId !== songDragPointerId) return;

  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>("[data-scale-song-id]");
  const targetSongId = target?.dataset.scaleSongId;

  if (!targetSongId || targetSongId === draggedSongId.value) return;
  reorderSongsLocally(draggedSongId.value, targetSongId);
};

const finishSongDrag = async (event?: PointerEvent) => {
  if (event && event.pointerId !== songDragPointerId) return;

  const scheduleEvent = selectedDetailEvent.value;
  const songs = scheduleEvent?.mediaItems.filter((item) => item.category === "MUSIC") || [];

  if (songDragHandle && songDragPointerId !== null) {
    try {
      songDragHandle.releasePointerCapture(songDragPointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }

  window.removeEventListener("pointermove", onSongDragMove);
  window.removeEventListener("pointerup", finishSongDrag);
  window.removeEventListener("pointercancel", finishSongDrag);
  songDragPointerId = null;
  songDragHandle = null;
  draggedSongId.value = "";

  if (scheduleEvent && songs.length) {
    await persistSongOrder(scheduleEvent, songs);
  }
};

const startSongDrag = (
  event: PointerEvent,
  song: ScheduleEvent["mediaItems"][number],
) => {
  if (!selectedDetailEvent.value?.canManage || isSavingSongOrder.value) return;

  draggedSongId.value = song.id;
  songDragPointerId = event.pointerId;
  songDragHandle = event.currentTarget as HTMLElement;
  songDragHandle.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onSongDragMove, { passive: true });
  window.addEventListener("pointerup", finishSongDrag);
  window.addEventListener("pointercancel", finishSongDrag);
};

const addFormVolunteer = () => {
  if (!scheduleFormVolunteerUserId.value) return;
  if (scheduleForm.assignments.some((a) => a.userId === scheduleFormVolunteerUserId.value)) return;

  const member = members.value.find((m) => m.id === scheduleFormVolunteerUserId.value);
  if (!member) return;

  scheduleForm.assignments.push({
    userId: member.id,
    name: member.name,
    role: scheduleFormVolunteerRole.value.trim() || "Voluntário",
  });
  scheduleFormVolunteerUserId.value = "";
  scheduleFormVolunteerRole.value = "";
};

const removeFormVolunteer = (userId: string) => {
  scheduleForm.assignments = scheduleForm.assignments.filter((a) => a.userId !== userId);
};

const assignmentStatusText = (event: ScheduleEvent) =>
  responseStatusLabel(event.currentUserAssignment?.confirmationStatus);

const openAssignmentsFromDetails = () => {
  if (!selectedDetailEvent.value) return;

  const event = selectedDetailEvent.value;
  closeScheduleDetails();
  openAssignmentsDialog(event);
};

const openEditFromDetails = () => {
  if (!selectedDetailEvent.value) return;

  const event = selectedDetailEvent.value;
  closeScheduleDetails();
  void openScheduleEditDialog(event);
};

const openDeleteFromDetails = () => {
  if (!selectedDetailEvent.value) return;

  const event = selectedDetailEvent.value;
  closeScheduleDetails();
  handleDeleteSchedule(event);
};

const isKeyboardAssignment = (event: ScheduleEvent | null) =>
  event?.currentUserAssignment?.role
    ?.toLocaleLowerCase("pt-BR")
    .includes("teclado") || false;

// Sequencia: abre a playlist na ordem definida, no modo escolhido (letra ou
// cifra) e rola continuo pelas musicas seguintes - sem precisar de
// Anterior/Proxima, so scroll (manual ou automatico).
const openPlaylistSequence = (index: number) => {
  const song = selectedDetailSongs.value[index];
  if (!song) return;

  playlistIndex.value = index;
  isSongFullscreenOpen.value = true;
};

const closeSongFullscreen = () => {
  isSongFullscreenOpen.value = false;
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

  const updatedSchedule = schedules.value.find((schedule) => schedule.id === scheduleId);
  if (updatedSchedule && selectedDetailEvent.value?.id === scheduleId) {
    selectedDetailEvent.value = toScheduleEvent(updatedSchedule);
  }
};

const updateMyScheduleResponse = async (
  event: ScheduleEvent,
  action: "VIEWED" | "CONFIRMED" | "DECLINED" | "SWAP_REQUESTED",
  fallbackError: string,
  declineReason?: string,
) => {
  schedulesError.value = "";
  const { data, error } = await updateMyScheduleAssignment(event.id, {
    action,
    ...(action === "DECLINED" ? { declineReason: declineReason || undefined } : {}),
  });

  if (error || !data) {
    schedulesError.value = error || fallbackError;
    return;
  }

  updateLocalAssignment(event.id, data);
};

const handleMarkScheduleViewed = async (event: ScheduleEvent) => {
  await updateMyScheduleResponse(
    event,
    "VIEWED",
    "Não foi possível marcar a escala como vista.",
  );
};

const handleConfirmSchedule = async (event: ScheduleEvent) => {
  await updateMyScheduleResponse(
    event,
    "CONFIRMED",
    "Não foi possível confirmar presença.",
  );
};

const handleDeclineSchedule = (event: ScheduleEvent) => {
  declineDialog.event = event;
  declineDialog.reason = "";
  declineDialog.open = true;
};

const confirmDecline = async () => {
  if (!declineDialog.event) return;
  declineDialog.open = false;
  await updateMyScheduleResponse(
    declineDialog.event,
    "DECLINED",
    "Não foi possível informar ausência.",
    declineDialog.reason,
  );
  declineDialog.event = null;
  declineDialog.reason = "";
};

const handleRequestSwap = async (event: ScheduleEvent) => {
  await updateMyScheduleResponse(
    event,
    "SWAP_REQUESTED",
    "Não foi possível pedir troca.",
  );
};

const loadDepartments = async () => {
  const { data } = await getDepartments();
  departments.value = data ?? [];
};

const loadSchedules = async () => {
  schedulesError.value = "";
  isLoadingSchedules.value = true;
  const { data, error } = await getChurchSchedules();

  if (error) {
    schedulesError.value = error;
    isLoadingSchedules.value = false;
    return;
  }

  schedules.value = data ?? [];
  isLoadingSchedules.value = false;
};

const focusScheduleFromRoute = async () => {
  const scheduleId =
    typeof route.query.schedule === "string" ? route.query.schedule : "";

  if (!scheduleId) {
    focusedScheduleId.value = "";
    return;
  }

  const schedule = schedules.value.find((item) => item.id === scheduleId);
  if (!schedule) return;

  focusedScheduleId.value = schedule.id;

  if (schedule.department?.name) {
    activeFilter.value = schedule.department.name;
  }

  await nextTick();
  document.getElementById(`schedule-${schedule.id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const loadScheduleMediaItems = async (departmentId: string) => {
  if (!departmentId) return;

  const shouldLoadResources = !resourcesByDepartment.value[departmentId];
  const shouldLoadSongs = !songsByDepartment.value[departmentId];

  if (!shouldLoadResources && !shouldLoadSongs) return;

  const [resourcesResponse, songsResponse] = await Promise.all([
    shouldLoadResources
      ? getDepartmentResources(departmentId)
      : Promise.resolve({ data: resourcesByDepartment.value[departmentId] }),
    shouldLoadSongs
      ? getDepartmentSongs(departmentId)
      : Promise.resolve({ data: songsByDepartment.value[departmentId] }),
  ]);

  resourcesByDepartment.value = {
    ...resourcesByDepartment.value,
    [departmentId]: resourcesResponse.data ?? [],
  };
  songsByDepartment.value = {
    ...songsByDepartment.value,
    [departmentId]: songsResponse.data ?? [],
  };
};

const resetScheduleForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
  scheduleForm.departmentId = "";
  scheduleForm.rehearsalDate = "";
  scheduleForm.rehearsalTime = "";
  scheduleForm.rehearsalNotes = "";
  scheduleForm.songIds = [];
  scheduleForm.resourceIds = [];
  scheduleForm.assignments = [];
  scheduleFormVolunteerUserId.value = "";
  scheduleFormVolunteerRole.value = "";
  editingScheduleId.value = "";
};

const closeScheduleDialog = () => {
  isScheduleDialogOpen.value = false;
  createScheduleError.value = "";
  resetScheduleForm();
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

const openNewScheduleDialog = () => {
  resetScheduleForm();
  if (manageableDepartments.value.length === 1) {
    scheduleForm.departmentId = manageableDepartments.value[0].id;
  }
  isScheduleDialogOpen.value = true;
};

const openScheduleEditDialog = async (event: ScheduleEvent) => {
  const schedule = schedules.value.find((item) => item.id === event.id);
  if (!schedule) return;

  isPrefillingScheduleForm.value = true;
  editingScheduleId.value = schedule.id;
  scheduleForm.title = schedule.description;
  scheduleForm.date = toDateInputValue(schedule.date);
  scheduleForm.time = toTimeInputValue(schedule.date);
  scheduleForm.departmentId = schedule.departmentId;
  scheduleForm.rehearsalDate = schedule.rehearsalAt
    ? toDateInputValue(schedule.rehearsalAt)
    : "";
  scheduleForm.rehearsalTime = schedule.rehearsalAt
    ? toTimeInputValue(schedule.rehearsalAt)
    : "";
  scheduleForm.rehearsalNotes = schedule.rehearsalNotes || "";
  await loadScheduleMediaItems(schedule.departmentId);
  scheduleForm.songIds =
    schedule.mediaItems
      ?.filter((item) => item.mediaItem.category === "MUSIC")
      .map((item) => item.mediaItemId) || [];
  scheduleForm.resourceIds =
    schedule.mediaItems
      ?.filter((item) => item.mediaItem.category !== "MUSIC")
      .map((item) => item.mediaItemId) || [];
  scheduleForm.assignments =
    schedule.assignments?.map((a) => ({
      userId: a.userId,
      name: a.user.name,
      role: a.role,
    })) || [];
  scheduleFormVolunteerUserId.value = "";
  scheduleFormVolunteerRole.value = "";
  createScheduleError.value = "";
  isPrefillingScheduleForm.value = false;
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

  if (!scheduleForm.departmentId) {
    createScheduleError.value = "Escolha o ministério da escala.";
    return;
  }

  isCreatingSchedule.value = true;

  try {
    const { data, error } = editingScheduleId.value
      ? await updateChurchSchedule(editingScheduleId.value, {
          title,
          date: scheduleForm.date,
          time: scheduleForm.time || undefined,
          departmentId: scheduleForm.departmentId,
          rehearsalDate: scheduleForm.rehearsalDate || null,
          rehearsalTime: scheduleForm.rehearsalTime || null,
          rehearsalNotes: scheduleForm.rehearsalNotes || null,
          songIds: scheduleForm.songIds,
          resourceIds: scheduleForm.resourceIds,
        })
      : await createChurchSchedule({
          title,
          date: scheduleForm.date,
          time: scheduleForm.time || undefined,
          departmentId: scheduleForm.departmentId,
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

    let finalSchedule = data;

    const isCreating = !editingScheduleId.value;
    const hasAssignments = scheduleForm.assignments.length > 0;

    if (hasAssignments || !isCreating) {
      const { data: scheduleWithAssignments } = await updateScheduleAssignments(data.id, {
        assignments: scheduleForm.assignments.map((a) => ({
          userId: a.userId,
          role: a.role,
        })),
      });
      if (scheduleWithAssignments) {
        finalSchedule = scheduleWithAssignments;
      }
    }

    const nextSchedules = editingScheduleId.value
      ? schedules.value.map((schedule) => (schedule.id === finalSchedule.id ? finalSchedule : schedule))
      : [...schedules.value, finalSchedule];

    schedules.value = nextSchedules.sort(
      (current, next) =>
        new Date(current.date).getTime() - new Date(next.date).getTime(),
    );
    closeScheduleDialog();
  } finally {
    isCreatingSchedule.value = false;
  }
};

const handleDeleteSchedule = (event: ScheduleEvent) => {
  pendingDeleteSchedule.value = event;
};

const closeDeleteScheduleDialog = () => {
  if (!isDeletingSchedule.value) {
    pendingDeleteSchedule.value = null;
  }
};

const confirmDeleteSchedule = async () => {
  if (!pendingDeleteSchedule.value) return;

  schedulesError.value = "";
  isDeletingSchedule.value = true;
  const scheduleId = pendingDeleteSchedule.value.id;

  try {
    const { error } = await deleteChurchSchedule(scheduleId);

    if (error) {
      schedulesError.value = error;
      return;
    }

    schedules.value = schedules.value.filter((schedule) => schedule.id !== scheduleId);
    pendingDeleteSchedule.value = null;
  } finally {
    isDeletingSchedule.value = false;
  }
};

const getSelectedScheduleDate = () => {
  const schedule = selectedSchedule.value;
  if (!schedule) return "";

  return toDateInputValue(schedule.date);
};

const getAssignmentWarning = (userId: string) => {
  const selectedDate = getSelectedScheduleDate();
  if (!selectedDate) return "";

  const member = members.value.find((item) => item.id === userId);

  if (member?.unavailableDates?.includes(selectedDate)) {
    return "Indisponível";
  }

  const hasConflict = schedules.value.some((schedule) => {
    if (schedule.id === selectedScheduleId.value) return false;
    if (toDateInputValue(schedule.date) !== selectedDate) return false;

    return schedule.assignments?.some((assignment) => assignment.userId === userId);
  });

  return hasConflict ? "Conflito" : "";
};

const openAssignmentsDialog = (event: ScheduleEvent) => {
  const schedule = schedules.value.find((item) => item.id === event.id);
  if (!schedule) return;

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
      warning: getAssignmentWarning(assignment.userId),
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
      warning: getAssignmentWarning(member.id),
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

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    loadSchedules();
  }
};

onMounted(async () => {
  await Promise.all([loadDepartments(), loadSchedules(), loadMembers()]);
  await focusScheduleFromRoute();
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("pointermove", onSongDragMove);
  window.removeEventListener("pointerup", finishSongDrag);
  window.removeEventListener("pointercancel", finishSongDrag);
});

watch(
  () => route.query.schedule,
  async () => {
    await focusScheduleFromRoute();
  },
);

watch(
  () => scheduleForm.departmentId,
  async (departmentId, previousDepartmentId) => {
    if (isPrefillingScheduleForm.value) return;

    if (departmentId) {
      await loadScheduleMediaItems(departmentId);
    }

    if (departmentId !== previousDepartmentId) {
      scheduleForm.songIds = [];
      scheduleForm.resourceIds = [];
    }
  },
);

watch(schedules, async () => {
  if (focusedScheduleId.value) return;
  await focusScheduleFromRoute();

  if (selectedDetailEvent.value) {
    const updated = schedules.value.find((s) => s.id === selectedDetailEvent.value!.id);
    if (updated) {
      selectedDetailEvent.value = toScheduleEvent(updated);
    }
  }
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.page-wrapper {
  background: var(--app-color-background);
}

.gap-2 {
  gap: 8px;
}

.scale-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.scale-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.filter-strip {
  position: relative;
  margin-right: -16px;
  margin-left: -16px;
}

.filter-strip::before,
.filter-strip::after {
  position: absolute;
  top: 0;
  bottom: 4px;
  z-index: 1;
  width: 18px;
  pointer-events: none;
  content: "";
}

.filter-strip::before {
  left: 0;
  background: linear-gradient(90deg, #f5f5f5 0%, rgba(245, 245, 245, 0) 100%);
}

.filter-strip::after {
  right: 0;
  background: linear-gradient(270deg, #f5f5f5 0%, rgba(245, 245, 245, 0) 100%);
}

.filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 6px;
  scroll-padding-inline: 16px;
}

.filter-chip {
  flex: 0 0 auto;
  max-width: min(64vw, 220px);
  height: 34px !important;
  padding-inline: 14px !important;
  font-weight: 700;
}

.filter-chip-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.cursor-pointer {
  cursor: pointer;
}

.leader-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.leader-summary-card {
  border: 1px solid #f3f4f6;
  border-radius: 8px !important;
}

.stat-icon {
  display: block;
}

.schedule-form-volunteer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px 12px;
}

.scale-input :deep(.v-field) {
  border-radius: 14px;
}

.scale-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.scale-field-grid {
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

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.scale-details-sheet {
  max-height: min(92vh, 920px);
  overflow: hidden;
  border-radius: 22px 22px 0 0 !important;
  background: #ffffff;
}

.scale-details-handle {
  width: 42px;
  height: 4px;
  margin: 10px auto 2px;
  border-radius: 999px;
  background: #d1d5db;
}

.scale-details-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.scale-details-kicker,
.scale-song-category {
  color: var(--app-color-accent, #B5472A);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.scale-details-title {
  color: #111827;
  font-size: 1.35rem;
  font-weight: 850;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.scale-details-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.scale-details-body {
  display: grid;
  gap: 18px;
  max-height: calc(min(92vh, 920px) - 96px);
  overflow-y: auto;
  padding: 18px 20px 24px;
}

.scale-details-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.scale-details-stat {
  display: grid;
  gap: 4px;
  min-height: 74px;
  align-content: center;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 12px;
}

.scale-details-stat span {
  color: #111827;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.scale-details-stat small {
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 750;
}

.scale-response-panel {
  display: grid;
  gap: 14px;
  border: 1px solid #f2d3bd;
  border-radius: 8px;
  background: var(--app-color-accent-tint, #F7E2D3);
  padding: 14px;
}

.scale-response-status {
  color: #111827;
  font-size: 0.92rem;
  font-weight: 850;
}

.scale-response-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.scale-details-section {
  display: grid;
  gap: 12px;
}

.scale-details-section-title,
.scale-details-section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scale-details-section-title h3 {
  margin: 0;
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 850;
}

.scale-details-team,
.scale-resource-list {
  display: grid;
  gap: 8px;
}

.scale-details-person,
.scale-resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 11px 12px;
  text-decoration: none;
}

.scale-details-person-name,
.scale-resource-item span {
  color: #111827;
  font-size: 0.88rem;
  font-weight: 800;
}

.scale-details-person-role {
  color: var(--app-color-accent);
  font-size: 0.78rem;
  font-weight: 750;
}

.scale-details-empty,
.scale-details-note {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  color: #6b7280;
  padding: 14px;
}

.scale-details-note {
  align-items: flex-start;
  flex-direction: column;
  border-style: solid;
  color: #92400e;
  background: #fffbeb;
  border-color: #fef3c7;
}

.scale-song-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scale-song-card {
  border: 1px solid #f2d3bd;
  border-radius: 8px;
  background: #fdfaf8;
  touch-action: pan-y;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease,
    transform 0.18s ease;
}

.scale-song-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scale-song-info {
  flex: 1;
  min-width: 0;
  padding: 14px;
  cursor: pointer;
  text-align: left;
}

.scale-song-order-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px 4px 0;
  flex-shrink: 0;
}

.scale-song-drag-handle {
  cursor: grab;
  touch-action: none;
}

.scale-song-drag-handle-active {
  cursor: grabbing;
}

.scale-song-card-dragging {
  border-color: var(--app-color-accent, #B5472A);
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.14);
  opacity: 0.9;
  transform: scale(1.01);
  z-index: 1;
}

.scale-song-card-saving {
  opacity: 0.72;
}

.scale-song-card:has(.scale-song-info:hover) {
  border-color: var(--app-color-accent, #B5472A);
  box-shadow: 0 4px 14px rgba(181, 71, 42, 0.1);
}

.scale-song-info:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: -3px;
  border-radius: 8px;
}

.scale-song-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.scale-song-title {
  color: var(--app-color-text) !important;
  font-size: 1rem;
  font-weight: 850;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.scale-song-artist {
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 650;
}

.scale-song-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.scale-song-index {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  margin-left: 10px;
  border-radius: 999px;
  background: var(--app-color-accent-tint, #f7e2d3);
  color: var(--app-color-accent, #b5472a);
  font-size: 0.78rem;
  font-weight: 900;
  flex-shrink: 0;
}

.scale-playlist-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.playlist-builder {
  display: grid;
  gap: 10px;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  padding: 14px;
}

.playlist-builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.playlist-builder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playlist-builder-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--app-color-border);
  border-radius: 10px;
  padding: 10px 12px;
}

.playlist-builder-index {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--app-color-accent-tint, #f7e2d3);
  color: var(--app-color-accent, #b5472a);
  font-size: 0.75rem;
  font-weight: 900;
}

.playlist-builder-title {
  color: var(--app-color-text);
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.playlist-builder-artist {
  color: var(--app-color-text-soft);
  font-size: 0.76rem;
  font-weight: 600;
}

.playlist-builder-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.song-picker {
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 760px);
  border-radius: 16px;
  background: var(--app-color-surface);
  overflow: hidden;
}

.song-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.song-picker-search {
  margin: 0 18px 12px;
}

.song-picker-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 18px 12px;
}

.song-picker-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface);
  padding: 14px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.song-picker-item:hover {
  border-color: var(--app-color-accent, #b5472a);
}

.song-picker-item-selected {
  border-color: var(--app-color-accent, #b5472a);
  background: var(--app-color-accent-tint, #f7e2d3);
}

.song-picker-check {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid var(--app-color-border-strong, #d1d5db);
  color: var(--app-color-accent, #b5472a);
}

.song-picker-item-selected .song-picker-check {
  border-color: var(--app-color-accent, #b5472a);
}

.song-picker-check-empty {
  display: block;
  width: 100%;
  height: 100%;
}

.song-picker-title {
  color: var(--app-color-text);
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.song-picker-artist {
  color: var(--app-color-text-soft);
  font-size: 0.8rem;
  font-weight: 600;
}

.song-picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.song-picker-order {
  color: var(--app-color-accent, #b5472a);
  font-size: 0.82rem;
  font-weight: 900;
}

.song-picker-footer {
  padding: 12px 18px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-color-border);
}

@media (min-width: 560px) {
  .scale-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .scale-page-header {
    align-items: flex-start;
  }

  .scale-header-actions {
    align-items: flex-start;
  }

  .filter-strip {
    margin-right: -12px;
    margin-left: -12px;
  }

  .filter-scroll {
    gap: 6px;
    padding-right: 12px;
    padding-left: 12px;
    scroll-padding-inline: 12px;
  }

  .filter-chip {
    max-width: 58vw;
    height: 32px !important;
    padding-inline: 12px !important;
    font-size: 0.78rem;
  }

  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }

  .leader-summary-grid {
    grid-template-columns: 1fr;
  }

  .scale-song-header {
    grid-template-columns: 1fr;
  }

  .scale-details-header {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .scale-details-header-actions {
    justify-content: flex-start;
  }

  .scale-details-stats {
    grid-template-columns: 1fr;
  }

  .scale-details-person,
  .scale-resource-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .playlist-builder-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .playlist-builder-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
