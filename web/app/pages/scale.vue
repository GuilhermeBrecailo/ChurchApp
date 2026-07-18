<template>
  <div class="pa-4 page-wrapper min-vh-100">
    <div class="scale-page-header mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4">Escalas</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Confira os próximos cultos e eventos
        </p>
      </div>
      <v-btn
        v-if="canCreateChurchSchedule"
        :color="accentColor"
        class="rounded-lg text-none px-4"
        elevation="2"
        @click="isScheduleDialogOpen = true"
      >
        <Plus size="18" class="mr-1" /> Novo
      </v-btn>
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

      <v-card
        v-if="filteredSchedules.length === 0 && !schedulesError"
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
              <div>
                <div class="d-flex align-center ga-2">
                  <Music size="18" />
                  <h3>Louvor</h3>
                </div>
              </div>
            </div>

            <div class="scale-song-list">
              <article
                v-for="(song, songIndex) in selectedDetailSongs"
                :key="song.id"
                class="scale-song-card"
                :class="{ 'scale-song-card-active': activeDetailSong?.id === song.id }"
              >
                <div class="scale-song-row">
                  <div
                    class="scale-song-info"
                    role="button"
                    tabindex="0"
                    @click="openSongFullscreen(song)"
                    @keydown.enter="openSongFullscreen(song)"
                    @keydown.space.prevent="openSongFullscreen(song)"
                  >
                    <div class="scale-song-header">
                      <div class="min-w-0">
                        <p class="scale-song-category mb-1">
                          {{ song.metadata?.songCategory || "Música" }}
                        </p>
                        <h4 class="scale-song-title mb-1">{{ song.title }}</h4>
                        <p class="scale-song-artist mb-0">
                          {{ song.metadata?.artist || "Artista não informado" }}
                        </p>
                      </div>
                    </div>
                    <div class="scale-song-meta">
                      <v-chip v-if="song.metadata?.key" size="small" variant="tonal">
                        Tom {{ song.metadata.key }}
                      </v-chip>
                      <v-chip v-if="song.metadata?.bpm" size="small" variant="tonal">
                        {{ song.metadata.bpm }} BPM
                      </v-chip>
                    </div>
                  </div>

                  <div v-if="selectedDetailEvent?.canManage" class="scale-song-order-btns">
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :disabled="songIndex === 0"
                      aria-label="Mover para cima"
                      @click.stop="moveSong(songIndex, -1)"
                    >
                      <ChevronUp size="16" />
                    </v-btn>
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :disabled="songIndex === selectedDetailSongs.length - 1"
                      aria-label="Mover para baixo"
                      @click.stop="moveSong(songIndex, 1)"
                    >
                      <ChevronDown size="16" />
                    </v-btn>
                  </div>
                </div>
              </article>
            </div>

            <div v-if="activeDetailSong" class="scale-song-reader">
              <div class="scale-song-reader-header">
                <div class="min-w-0">
                  <p class="scale-song-category mb-1">
                    {{ activeDetailSong.metadata?.songCategory || "Louvor" }}
                  </p>
                  <h4 class="scale-song-title mb-0">{{ activeDetailSong.title }}</h4>
                </div>
                <v-tooltip text="Tela cheia" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon
                      variant="tonal"
                      color="purple-darken-3"
                      aria-label="Abrir letra e cifra em tela cheia"
                      @click="openSongFullscreen(activeDetailSong)"
                    >
                      <Maximize2 size="18" />
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>

              <v-tabs
                v-model="songTabs[activeDetailSong.id]"
                color="purple-darken-3"
                density="compact"
              >
                <v-tab value="lyrics" class="text-none">Letra</v-tab>
                <v-tab value="chords" class="text-none">Cifra</v-tab>
              </v-tabs>

              <div class="scale-song-filter-row">
                <v-menu
                  v-model="songFilterOpen"
                  :close-on-content-click="false"
                  location="bottom start"
                >
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      variant="tonal"
                      color="purple-darken-3"
                      size="small"
                      class="text-none"
                      prepend-icon="mdi-tune"
                    >
                      Filtro
                    </v-btn>
                  </template>
                  <v-card min-width="272" rounded="lg" elevation="4">
                    <v-card-text class="pa-4">
                      <template v-if="songTabs[activeDetailSong.id] === 'chords'">
                        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">Instrumento</p>
                        <v-btn-toggle
                          v-model="songInstrumentMode"
                          density="compact"
                          mandatory
                          class="song-instrument-toggle mb-4"
                        >
                          <v-btn value="auto" size="small" class="text-none">Auto</v-btn>
                          <v-btn value="default" size="small" class="text-none">Cordas</v-btn>
                          <v-btn value="keyboard" size="small" class="text-none">Teclado</v-btn>
                        </v-btn-toggle>

                        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">Tom</p>
                        <div class="d-flex align-center ga-2 mb-4">
                          <v-btn
                            variant="tonal"
                            color="grey-darken-1"
                            size="small"
                            class="text-none"
                            @click="transposeSong(activeDetailSong.id, -1)"
                          >
                            -1
                          </v-btn>
                          <v-chip size="small" color="orange-darken-3" variant="tonal">
                            {{ songCurrentKey(activeDetailSong) }}
                          </v-chip>
                          <v-btn
                            variant="tonal"
                            color="grey-darken-1"
                            size="small"
                            class="text-none"
                            @click="transposeSong(activeDetailSong.id, 1)"
                          >
                            +1
                          </v-btn>
                        </div>
                      </template>

                      <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
                        Rolagem automática
                      </p>
                      <span class="text-caption text-grey-darken-1">{{ songScrollSpeedLabel }}</span>
                      <v-slider
                        v-model="songAutoScrollSpeed"
                        min="0"
                        max="80"
                        step="4"
                        density="compact"
                        color="purple-darken-3"
                        hide-details
                        class="mt-1"
                      />
                    </v-card-text>
                  </v-card>
                </v-menu>
              </div>

              <MusicSongTextRenderer
                class="scale-song-text"
                :mode="songTabs[activeDetailSong.id] === 'chords' ? 'chords' : 'lyrics'"
                :text="getSongTabText(activeDetailSong, songTabs[activeDetailSong.id])"
                :auto-scroll="songAutoScrollSpeed > 0"
                :scroll-speed="songAutoScrollSpeed"
              />
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

    <UtilsResponsiveOverlay
      v-model="isSongFullscreenOpen"
      max-width="920"
      fullscreen-desktop
      mobile-class="scale-song-mobile-sheet"
    >
      <v-card v-if="fullscreenSong" class="scale-fullscreen-song" elevation="0">
        <div class="scale-details-handle" />
        <div class="scale-fullscreen-header">
          <div class="min-w-0">
            <h2 class="scale-fullscreen-title mb-0">{{ fullscreenSong.title }}</h2>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            aria-label="Fechar tela cheia"
            @click="closeSongFullscreen"
          >
            <v-icon size="24">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="scale-fullscreen-toolbar">
          <v-tabs v-model="fullscreenSongTab" color="purple-darken-3" density="compact">
            <v-tab value="lyrics" class="text-none">Letra</v-tab>
            <v-tab value="chords" class="text-none">Cifra</v-tab>
          </v-tabs>

          <div class="scale-fullscreen-controls">
            <v-menu
              v-model="songFilterFullscreenOpen"
              :close-on-content-click="false"
              location="bottom end"
            >
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  variant="tonal"
                  color="purple-darken-3"
                  size="small"
                  class="text-none"
                  prepend-icon="mdi-tune"
                >
                  Filtro
                </v-btn>
              </template>
              <v-card min-width="272" rounded="lg" elevation="4">
                <v-card-text class="pa-4">
                  <template v-if="fullscreenSongTab === 'chords'">
                    <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">Instrumento</p>
                    <v-btn-toggle
                      v-model="songInstrumentMode"
                      density="compact"
                      mandatory
                      class="song-instrument-toggle mb-4"
                    >
                      <v-btn value="auto" size="small" class="text-none">Auto</v-btn>
                      <v-btn value="default" size="small" class="text-none">Cordas</v-btn>
                      <v-btn value="keyboard" size="small" class="text-none">Teclado</v-btn>
                    </v-btn-toggle>

                    <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">Tom</p>
                    <div class="d-flex align-center ga-2 mb-4">
                      <v-btn
                        variant="tonal"
                        color="grey-darken-1"
                        size="small"
                        class="text-none"
                        @click="transposeSong(fullscreenSong.id, -1)"
                      >
                        -1
                      </v-btn>
                      <v-chip size="small" color="orange-darken-3" variant="tonal">
                        {{ songCurrentKey(fullscreenSong) }}
                      </v-chip>
                      <v-btn
                        variant="tonal"
                        color="grey-darken-1"
                        size="small"
                        class="text-none"
                        @click="transposeSong(fullscreenSong.id, 1)"
                      >
                        +1
                      </v-btn>
                    </div>
                  </template>

                  <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
                    Rolagem automática
                  </p>
                  <span class="text-caption text-grey-darken-1">{{ songScrollSpeedLabel }}</span>
                  <v-slider
                    v-model="songAutoScrollSpeed"
                    min="0"
                    max="80"
                    step="4"
                    density="compact"
                    color="purple-darken-3"
                    hide-details
                    class="mt-1"
                  />
                </v-card-text>
              </v-card>
            </v-menu>
          </div>
        </div>

        <MusicSongTextRenderer
          class="scale-fullscreen-text"
          :mode="fullscreenSongTab === 'chords' ? 'chords' : 'lyrics'"
          :text="getSongTabText(fullscreenSong, fullscreenSongTab)"
          :auto-scroll="songAutoScrollSpeed > 0"
          :scroll-speed="songAutoScrollSpeed"
        />
      </v-card>
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
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input mb-4"
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
                :disabled="isCreatingSchedule"
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
                :disabled="isCreatingSchedule"
              />
            </div>

            <v-btn
              variant="tonal"
              :color="accentColor"
              size="small"
              class="text-none mb-3"
              :disabled="isCreatingSchedule || !scheduleFormVolunteerUserId"
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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Maximize2,
  Music,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-vue-next";
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
import { usePermissions } from "../../composables/usePermissions";

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
const { can } = usePermissions();
const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgColor = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");
const route = useRoute();

const activeFilter = ref("Todos");
const departments = ref<ChurchDepartment[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
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
const activeDetailSongId = ref("");
const isSongFullscreenOpen = ref(false);
const fullscreenSong = ref<ScheduleEvent["mediaItems"][number] | null>(null);
const fullscreenSongTab = ref("lyrics");
const songAutoScrollSpeed = ref(24);
const songInstrumentMode = ref<"auto" | "default" | "keyboard">("auto");
const songTabs = reactive<Record<string, string>>({});
const songTransposeSteps = reactive<Record<string, number>>({});
const songFilterOpen = ref(false);
const songFilterFullscreenOpen = ref(false);

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

  if (!can("MANAGE_SCHEDULES")) {
    return [];
  }

  return departments.value.filter(
    (department) => department.leaderId === user.value?.id,
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

const songOptions = computed(() =>
  selectedDepartmentSongs.value.map((song) => ({
    label: song.metadata?.artist ? `${song.title} - ${song.metadata.artist}` : song.title,
    value: song.id,
  })),
);

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

const defaultSongTab = (song: ScheduleEvent["mediaItems"][number]) =>
  song.metadata?.lyrics ? "lyrics" : song.metadata?.chords ? "chords" : "lyrics";

const activeDetailSong = computed(
  () =>
    selectedDetailSongs.value.find((song) => song.id === activeDetailSongId.value) ||
    null,
);

const songScrollSpeedLabel = computed(() =>
  songAutoScrollSpeed.value > 0
    ? `Velocidade ${Math.round(songAutoScrollSpeed.value)}`
    : "Rolagem pausada",
);

const canCreateChurchSchedule = computed(
  () => manageableDepartments.value.length > 0,
);

const canManageSchedule = (schedule: DepartmentSchedule) =>
  isChurchWideManager.value ||
  (can("MANAGE_SCHEDULES") && schedule.department?.leaderId === user.value?.id);

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
  const songs = event.mediaItems.filter((item) => item.category === "MUSIC");
  activeDetailSongId.value = songs[0]?.id || "";
  songs.forEach((song) => {
    if (!["lyrics", "chords"].includes(songTabs[song.id])) {
      songTabs[song.id] = defaultSongTab(song);
    }
  });
};

const closeScheduleDetails = () => {
  selectedDetailEvent.value = null;
  activeDetailSongId.value = "";
};

const selectDetailSong = (song: ScheduleEvent["mediaItems"][number]) => {
  activeDetailSongId.value = song.id;
  if (!["lyrics", "chords"].includes(songTabs[song.id])) {
    songTabs[song.id] = defaultSongTab(song);
  }
};

const moveSong = async (index: number, direction: -1 | 1) => {
  const event = selectedDetailEvent.value;
  if (!event) return;

  const songs = event.mediaItems.filter((item) => item.category === "MUSIC");
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= songs.length) return;

  const reordered = [...songs];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

  const items = reordered.map((song, i) => ({
    id: song.scheduleMediaItemId,
    order: i,
  }));

  event.mediaItems = [
    ...reordered,
    ...event.mediaItems.filter((item) => item.category !== "MUSIC"),
  ];

  const { error } = await reorderScheduleMediaItems(event.id, items);
  if (error) await loadSchedules();
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

const getSongTabText = (
  song: ScheduleEvent["mediaItems"][number],
  tab = "lyrics",
) => {
  if (tab === "chords") {
    return transposeChords(
      getSongChordsForCurrentRole(song) || "Cifra não cadastrada.",
      songTransposeSteps[song.id] || 0,
    );
  }
  if (tab === "notes") {
    const currentKey = transposeKey(
      song.metadata?.key || "",
      songTransposeSteps[song.id] || 0,
    );
    const items = [
      currentKey ? `Tom: ${currentKey}` : "",
      song.metadata?.bpm ? `BPM: ${song.metadata.bpm}` : "",
      song.metadata?.notes || "",
    ].filter(Boolean);

    return items.join("\n") || "Tom não cadastrado.";
  }

  return song.metadata?.lyrics || "Letra não cadastrada.";
};

const isKeyboardAssignment = (event: ScheduleEvent | null) =>
  event?.currentUserAssignment?.role
    ?.toLocaleLowerCase("pt-BR")
    .includes("teclado") || false;

const getSongChordsForCurrentRole = (song: ScheduleEvent["mediaItems"][number]) => {
  const shouldUseKeyboard =
    songInstrumentMode.value === "keyboard" ||
    (songInstrumentMode.value === "auto" && isKeyboardAssignment(selectedDetailEvent.value));

  if (shouldUseKeyboard && song.metadata?.keyboardChords) {
    return song.metadata.keyboardChords;
  }

  return song.metadata?.chords || "";
};

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const flatToSharp: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};
const transposeKey = (key: string, steps: number) => {
  const match = key.trim().match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match || !steps) return key;

  const normalized = flatToSharp[match[1]] || match[1];
  const index = noteNames.indexOf(normalized);
  if (index === -1) return key;

  return `${noteNames[(index + steps + noteNames.length) % noteNames.length]}${match[2] || ""}`;
};

const transposeChords = (text: string, steps: number) => {
  if (!steps) return text;

  return text.replace(
    /\b([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add)?([0-9]*)?(\/([A-G](?:#|b)?))?/g,
    (match, root, quality = "", extension = "", slash = "", bass = "") => {
      const nextRoot = transposeKey(root, steps);
      const nextBass = bass ? `/${transposeKey(bass, steps)}` : "";
      return `${nextRoot}${quality || ""}${extension || ""}${nextBass}`;
    },
  );
};

const transposeSong = (songId: string, steps: number) => {
  songTransposeSteps[songId] = (songTransposeSteps[songId] || 0) + steps;
};

const songCurrentKey = (song: ScheduleEvent["mediaItems"][number]) => {
  const currentKey = transposeKey(
    song.metadata?.key || "",
    songTransposeSteps[song.id] || 0,
  );
  return currentKey ? `Tom ${currentKey}` : "Tom não cadastrado";
};

const openSongFullscreen = (song: ScheduleEvent["mediaItems"][number]) => {
  activeDetailSongId.value = song.id;
  fullscreenSong.value = song;
  fullscreenSongTab.value = ["lyrics", "chords"].includes(songTabs[song.id])
    ? songTabs[song.id]
    : defaultSongTab(song);
  isSongFullscreenOpen.value = true;
};

const closeSongFullscreen = () => {
  isSongFullscreenOpen.value = false;
  fullscreenSong.value = null;
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
  const { data, error } = await getChurchSchedules();

  if (error) {
    schedulesError.value = error;
    return;
  }

  schedules.value = data ?? [];
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
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.scale-details-title,
.scale-fullscreen-title {
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
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
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
  flex-direction: column;
  align-items: center;
  padding: 4px 6px 4px 0;
  gap: 0;
  flex-shrink: 0;
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

.scale-song-card-active {
  border-color: var(--app-color-accent, #B5472A);
  background: var(--app-color-accent-tint, #F7E2D3);
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

.scale-song-reader {
  display: grid;
  gap: 12px;
  border: 1px solid #f2d3bd;
  border-radius: 8px;
  background: var(--app-color-surface);
  padding: 14px;
  border-color: var(--app-color-border);
}

.scale-song-reader-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.scale-song-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 2px;
}

.scale-song-text {
  min-height: 220px;
  max-height: 62vh;
  font-size: 1.1rem;
  line-height: 1.88;
  padding: 18px;
}

.scale-fullscreen-text {
  font-size: 1.04rem;
  line-height: 1.82;
  min-height: 360px;
}

.scale-fullscreen-song {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  max-height: 100vh;
  min-height: 100vh;
  background: #0f0d1a;
  overflow: hidden;
}

.scale-fullscreen-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 18px 22px;
  border-bottom: 1px solid #2d2640;
}

/* .scale-fullscreen-song tem fundo escuro fixo (#0f0d1a) em qualquer tema —
   modo apresentação pensado pra tela de palco — então o texto aqui precisa
   ser sempre claro, independente do app estar em light ou dark mode. */
.scale-fullscreen-header h4,
.scale-fullscreen-header p {
  color: #e2e8f0 !important;
}

.scale-fullscreen-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 22px;
  border-bottom: 1px solid #f3f4f6;
  border-color: #2d2640;
}

.scale-fullscreen-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  min-width: 0;
}

.scale-fullscreen-text {
  min-height: 0;
  overflow: auto;
  border: 0;
  border-radius: 0;
  font-size: 1.16rem;
  line-height: 1.92;
  padding: 24px;
}

.scale-song-mobile-sheet :deep(.v-bottom-sheet__content) {
  border-radius: 22px 22px 0 0 !important;
  overflow: hidden;
}

@media (min-width: 560px) {
  .scale-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .scale-song-mobile-sheet .scale-fullscreen-song {
    max-height: 100vh;
    min-height: 100vh;
    border-radius: 22px 22px 0 0 !important;
  }

  .scale-fullscreen-toolbar {
    grid-template-columns: 1fr;
  }

  .scale-fullscreen-controls {
    justify-content: flex-start;
  }

  .scale-page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .scale-page-header .v-btn {
    width: 100%;
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

  .scale-details-header,
  .scale-fullscreen-header {
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

  .scale-fullscreen-text {
    font-size: 1rem;
    padding: 18px;
  }
}
</style>