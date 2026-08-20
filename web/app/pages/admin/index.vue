<template>
  <div v-if="isPlatformAdmin && canAccessChurchAdmin" class="admin-mode-shell pa-4 pb-0 bg-grey-lighten-4">
    <div class="admin-mode-selector">
      <v-btn-toggle
        v-model="activeAdminMode"
        mandatory
        divided
        class="admin-mode-toggle"
      >
        <v-btn value="master" class="admin-mode-button text-none">
          Admin Master
        </v-btn>
        <v-btn value="church" class="admin-mode-button text-none">
          Administração da Igreja
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>

  <div
    v-if="isPlatformAdmin"
    v-show="!canAccessChurchAdmin || activeAdminMode === 'master'"
    class="platform-admin-page pa-4 min-vh-100 pb-20"
  >
    <div class="platform-hero mb-6">
      <div class="min-w-0">
        <p class="platform-kicker mb-2">Admin master</p>
        <div class="app-help-title-row">
          <h1 class="app-page-title platform-title text-grey-darken-4 mb-2">
            Visão geral da plataforma
          </h1>
          <div class="platform-hero-actions">
            <UtilsPageHelpButton title="Admin master" />
            <div class="platform-hero-mark">
              <Church size="26" :color="accentColor" />
            </div>
          </div>
        </div>
        <p class="platform-subtitle text-body-2 text-grey-darken-1 mb-0">
          Acompanhe igrejas, lideranças, usuários e ministérios em um só lugar.
        </p>
      </div>
    </div>

    <v-alert
      v-if="platformError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ platformError }}
    </v-alert>

    <div class="admin-tabs-bar platform-master-tabs mb-6">
      <v-tabs
        v-model="activePlatformTab"
        density="compact"
        class="admin-tabs platform-tabs"
      >
        <v-tab value="geral" class="text-none font-weight-medium admin-tab">Geral</v-tab>
        <v-tab value="igrejas" class="text-none font-weight-medium admin-tab">Igrejas Cadastradas</v-tab>
        <v-tab value="videos" class="text-none font-weight-medium admin-tab">Vídeos de Ajuda</v-tab>
      </v-tabs>
    </div>

    <section v-show="activePlatformTab === 'geral'" class="platform-tab-panel">
      <MotionStaggerGroup class="stats-grid mb-6">
      <MotionStaggerItem>
        <AdminStatCard
          title="Igrejas"
          :value="adminChurches.length"
          :icon="Church"
          iconColor="#B5472A"
          bgColor="#F7E2D3"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Usuários"
          :value="platformTotals.users"
          :icon="Users"
          iconColor="#14B8A6"
          bgColor="#F0FDFA"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Ministérios"
          :value="platformTotals.departments"
          :icon="Building"
          iconColor="#C2542C"
          bgColor="#F7E2D3"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Ativas"
          :value="platformTotals.activeChurches"
          :icon="UserCheck"
          iconColor="#EAB308"
          bgColor="#FEFCE8"
        />
      </MotionStaggerItem>
    </MotionStaggerGroup>

    <section class="master-panel mb-6">
      <v-card class="master-panel-card pa-4 bg-white elevation-0 border-subtle">
        <div class="master-panel-heading mb-3">
          <BarChart3 size="18" />
          <h2>Saúde da plataforma</h2>
        </div>
        <div class="master-summary-grid">
          <div>
            <strong>{{ platformStatusSummary.active }}</strong>
            <span>ativas</span>
          </div>
          <div>
            <strong>{{ platformStatusSummary.inactive }}</strong>
            <span>inativas</span>
          </div>
          <div>
            <strong>{{ platformStatusSummary.withoutMembers }}</strong>
            <span>sem membros</span>
          </div>
        </div>
      </v-card>

      <v-card class="master-panel-card pa-4 bg-white elevation-0 border-subtle">
        <div class="master-panel-heading mb-3">
          <Users size="18" />
          <h2>Maiores igrejas</h2>
        </div>
        <div v-if="topChurches.length" class="master-ranking">
          <button
            v-for="church in topChurches"
            :key="church.id"
            type="button"
            @click="selectChurch(church.id)"
          >
            <span>{{ church.name }}</span>
            <strong>{{ church.membersCount }}</strong>
          </button>
        </div>
        <p v-else class="text-caption text-grey-darken-1 mb-0">
          Sem dados para exibir.
        </p>
      </v-card>
    </section>
    </section>

    <section v-show="activePlatformTab === 'igrejas'" class="platform-tab-panel platform-directory-tab">
      <section class="platform-directory">
      <div class="directory-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
            Igrejas cadastradas
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Selecione uma igreja para abrir o painel de informações.
          </p>
        </div>
        <v-chip size="small" color="indigo-darken-2" variant="tonal">
          {{ filteredAdminChurches.length }} de {{ adminChurches.length }}
        </v-chip>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="platformSearch"
          label="Buscar igreja"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="indigo-darken-2"
          bg-color="white"
          hide-details
        />
        <v-select
          v-model="platformStatusFilter"
          label="Status"
          :items="platformStatusOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-filter-outline"
          variant="outlined"
          density="compact"
          color="indigo-darken-2"
          bg-color="white"
          hide-details
        />
      </div>

      <v-card
        v-if="isLoadingPlatform"
        class="platform-loading rounded-lg pa-4 elevation-0 bg-white border-subtle"
      >
        <v-skeleton-loader type="list-item-three-line@5" />
      </v-card>

      <v-card
        v-else-if="adminChurches.length === 0"
        class="platform-empty rounded-lg pa-6 elevation-0 bg-white border-subtle"
      >
        <Church size="34" color="#9CA3AF" class="mb-3" />
        <p class="text-body-2 text-grey-darken-1 font-weight-medium mb-0 text-center">
          Nenhuma igreja cadastrada ainda
        </p>
      </v-card>

      <v-card
        v-else-if="filteredAdminChurches.length === 0"
        class="platform-empty rounded-lg pa-6 elevation-0 bg-white border-subtle"
      >
        <Church size="34" color="#9CA3AF" class="mb-3" />
        <p class="text-body-2 text-grey-darken-1 font-weight-medium mb-0 text-center">
          Nenhuma igreja encontrada com os filtros atuais
        </p>
      </v-card>

      <div v-else class="church-directory-grid">
        <button
          v-for="church in filteredAdminChurches"
          :key="church.id"
          type="button"
          class="church-directory-card"
          :class="{ 'church-directory-card-active': selectedChurch?.id === church.id }"
          @click="selectChurch(church.id)"
        >
          <span class="church-card-top">
            <span class="church-avatar">
              <Church size="21" :color="accentColor" />
            </span>
            <span class="church-status-dot" :class="{ 'church-status-dot-muted': !church.isActive }" />
          </span>

          <span class="church-card-copy">
            <span class="church-card-title">
              {{ church.name }}
            </span>
            <span class="church-card-location">
              {{ church.city || "Cidade não informada" }}{{ church.state ? ` - ${church.state}` : "" }}
            </span>
          </span>

          <span class="church-plan-row">
            <v-chip
              size="x-small"
              :color="church.plan === 'FREE' ? 'grey-darken-1' : 'amber-darken-3'"
              variant="flat"
              class="font-weight-bold"
            >
              {{ planLabel(church) }}
            </v-chip>
            <span v-if="churchTrialDaysLeft(church) !== null" class="church-trial-note">
              trial: {{ churchTrialDaysLeft(church) }}d restantes
            </span>
            <span
              class="church-plan-edit"
              role="button"
              tabindex="0"
              aria-label="Editar plano"
              @click.stop="openPlanDialog(church)"
              @keydown.enter.stop="openPlanDialog(church)"
            >
              <Pencil size="13" />
            </span>
          </span>

          <span class="church-metrics">
            <span>
              <strong>{{ church.membersCount }}</strong>
              usuários
            </span>
            <span>
              <strong>{{ church.departmentsCount }}</strong>
              ministérios
            </span>
            <span>
              <strong>{{ church.isActive ? "Ativa" : "Inativa" }}</strong>
              status
            </span>
          </span>

          <span class="church-open-action">
            Ver detalhes
            <ArrowRight size="16" />
          </span>
        </button>
      </div>
    </section>

    <template v-if="false">
      <v-card class="church-details-surface bg-white" elevation="0">
        <div class="church-details-header">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="52" class="mr-3">
              <Church size="24" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedChurch?.name || "Carregando igreja" }}
              </h2>
              <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                {{ selectedChurchAddress }}
              </p>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click="isChurchDetailsOpen = false"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="church-details-body">
          <v-skeleton-loader
            v-if="isLoadingChurch"
            type="article, list-item-three-line@4"
          />

          <div v-else-if="selectedChurch" class="church-details-content">
            <div class="church-detail-grid">
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">Cidade</p>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ selectedChurch.city || "-" }}{{ selectedChurch.state ? ` - ${selectedChurch.state}` : "" }}
                </p>
              </div>
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">Documento</p>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ selectedChurch.document || "-" }}
                </p>
              </div>
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">CEP</p>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ selectedChurch.localZipCode || "-" }}
                </p>
              </div>
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">Status</p>
                <v-chip
                  size="small"
                  :color="selectedChurch.isActive ? 'teal-darken-2' : 'grey'"
                  variant="tonal"
                >
                  {{ selectedChurch.isActive ? "Ativa" : "Inativa" }}
                </v-chip>
              </div>
            </div>

            <div class="church-detail-columns">
              <section class="detail-section">
                <div class="detail-section-heading">
                  <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                    Usuários
                  </h3>
                  <v-chip size="small" color="indigo-darken-2" variant="tonal">
                    {{ selectedChurch.users.length }}
                  </v-chip>
                </div>
                <div class="detail-list">
                  <div
                    v-for="member in selectedChurch.users"
                    :key="member.id"
                    class="admin-row user-row"
                    @click="openAdminUserDetails(member)"
                  >
                    <div class="min-w-0">
                      <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                        {{ member.name }}
                      </p>
                      <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                        {{ member.email }}
                      </p>
                    </div>
                    <v-chip size="small" color="purple-darken-3" variant="tonal">
                      {{ adminUserRoleLabel(member.role) }}
                    </v-chip>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <div class="detail-section-heading">
                  <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                    Ministérios
                  </h3>
                  <v-chip size="small" color="purple-darken-3" variant="tonal">
                    {{ selectedChurch.departments.length }}
                  </v-chip>
                </div>
                <div class="detail-list">
                  <div
                    v-for="department in selectedChurch.departments"
                    :key="department.id"
                    class="admin-row"
                  >
                    <div class="min-w-0">
                      <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                        {{ department.name }}
                      </p>
                      <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                        Líder: {{ department.leader.name }}
                      </p>
                    </div>
                    <div class="text-caption text-grey-darken-1 text-right">
                      {{ department.membersCount }} membros<br />
                      {{ department.schedulesCount }} escalas
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </v-card>
    </template>

    <UtilsResponsiveOverlay
      v-model="isChurchDetailsSheetOpen"
      scrollable
      max-width="920"
      mobile-class="church-details-mobile-sheet"
      @after-leave="closeChurchDetails"
    >
      <v-card class="church-details-sheet bg-white" elevation="0">
        <div class="sheet-handle" />
        <div class="church-details-header">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="44" class="mr-3">
              <Church size="21" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedChurch?.name || "Carregando igreja" }}
              </h2>
              <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                {{ selectedChurchAddress }}
              </p>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click="isChurchDetailsSheetOpen = false"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div v-if="selectedChurch" class="church-sheet-tabs-bar">
          <v-tabs
            v-model="activeChurchSheetTab"
            density="compact"
            color="indigo-darken-2"
            slider-color="indigo-darken-2"
            class="church-sheet-tabs"
            grow
          >
            <v-tab value="geral" class="text-none font-weight-medium">Geral</v-tab>
            <v-tab value="plano" class="text-none font-weight-medium">Plano</v-tab>
            <v-tab value="membros" class="text-none font-weight-medium">Membros</v-tab>
            <v-tab value="ministerios" class="text-none font-weight-medium">Ministérios</v-tab>
            <v-tab value="escalas" class="text-none font-weight-medium">Escalas</v-tab>
          </v-tabs>
        </div>

        <div class="church-details-body">
          <v-skeleton-loader
            v-if="isLoadingChurch"
            type="article, list-item-three-line@3"
          />

          <div v-else-if="selectedChurch" class="church-details-content">
            <div v-show="activeChurchSheetTab === 'geral'" class="church-sheet-summary">
              <div class="sheet-summary-tile">
                <Users size="18" />
                <span>{{ selectedChurch.users.length }}</span>
                <small>usuários</small>
              </div>
              <div class="sheet-summary-tile">
                <Building size="18" />
                <span>{{ selectedChurch.departments.length }}</span>
                <small>ministérios</small>
              </div>
              <div class="sheet-summary-tile">
                <Calendar size="18" />
                <span>{{ selectedChurch.schedules?.length || 0 }}</span>
                <small>escalas</small>
              </div>
              <div class="sheet-summary-tile">
                <UserCheck size="18" />
                <span>{{ selectedChurch.isActive ? "Ativa" : "Inativa" }}</span>
                <small>status</small>
              </div>
            </div>

            <div v-show="activeChurchSheetTab === 'geral'" class="church-detail-grid">
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">Cidade</p>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ selectedChurch.city || "-" }}{{ selectedChurch.state ? ` - ${selectedChurch.state}` : "" }}
                </p>
              </div>
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">Status</p>
                <v-chip
                  size="small"
                  :color="selectedChurch.isActive ? 'teal-darken-2' : 'grey'"
                  variant="tonal"
                >
                  {{ selectedChurch.isActive ? "Ativa" : "Inativa" }}
                </v-chip>
              </div>
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">Documento</p>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ selectedChurch.document || "-" }}
                </p>
              </div>
              <div class="detail-tile">
                <p class="text-caption text-grey-darken-1 mb-1">CEP</p>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ selectedChurch.localZipCode || "-" }}
                </p>
              </div>
            </div>

            <section
              v-if="isCurrentUserSuperAdmin"
              v-show="activeChurchSheetTab === 'geral'"
              class="danger-zone"
            >
              <div class="detail-section-heading">
                <h3 class="text-subtitle-2 font-weight-bold text-red-darken-2 mb-0">
                  Zona de risco
                </h3>
              </div>
              <v-alert
                v-if="deleteChurchError"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                {{ deleteChurchError }}
              </v-alert>
              <div class="danger-zone-row">
                <div>
                  <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                    Excluir igreja
                  </p>
                  <p class="text-caption text-grey-darken-1 mb-0">
                    Apaga a igreja e todos os dados vinculados. Não pode ser desfeito.
                  </p>
                </div>
                <v-btn
                  variant="tonal"
                  color="red-darken-2"
                  size="small"
                  class="text-none font-weight-bold"
                  @click="handleDeleteChurch(selectedChurch)"
                >
                  <Trash2 size="14" class="mr-1" /> Excluir
                </v-btn>
              </div>
            </section>

            <section v-show="activeChurchSheetTab === 'plano'" class="detail-section">
              <div class="detail-section-heading">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                  Plano
                </h3>
              </div>
              <div class="church-sheet-plan-card">
                <div>
                  <p class="text-caption text-grey-darken-1 mb-1">Plano atual</p>
                  <div class="d-flex align-center ga-2">
                    <v-chip
                      size="small"
                      :color="planLabel(selectedChurch) === 'Free' ? 'grey-darken-1' : 'amber-darken-3'"
                      variant="flat"
                      class="font-weight-bold"
                    >
                      {{ planLabel(selectedChurch) }}
                    </v-chip>
                    <span v-if="churchTrialDaysLeft(selectedChurch) !== null" class="text-caption text-grey-darken-1">
                      trial: {{ churchTrialDaysLeft(selectedChurch) }}
                      {{ churchTrialDaysLeft(selectedChurch) === 1 ? "dia restante" : "dias restantes" }}
                    </span>
                  </div>
                </div>
                <v-btn
                  variant="tonal"
                  color="indigo-darken-2"
                  size="small"
                  class="text-none font-weight-bold"
                  @click="openPlanDialog(selectedChurch)"
                >
                  <Pencil size="14" class="mr-1" /> Editar
                </v-btn>
              </div>
            </section>

            <section v-show="activeChurchSheetTab === 'membros'" class="detail-section">
              <div class="detail-section-heading">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                  Membros
                </h3>
                <div class="detail-heading-actions">
                  <v-chip size="small" color="indigo-darken-2" variant="tonal">
                    {{ selectedChurch.users.length }}
                  </v-chip>
                  <v-btn
                    v-if="selectedChurch.users.length > churchPreviewLimit"
                    variant="text"
                    color="indigo-darken-2"
                    size="small"
                    class="text-none"
                    @click="showAllChurchUsers = !showAllChurchUsers"
                  >
                    {{ showAllChurchUsers ? "Mostrar menos" : "Mostrar todos" }}
                  </v-btn>
                </div>
              </div>
              <div class="detail-list">
                <div
                  v-for="member in visibleChurchUsers"
                  :key="member.id"
                  class="admin-row user-row"
                  @click="openAdminUserDetails(member)"
                >
                  <div class="min-w-0">
                    <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                      {{ member.name }}
                    </p>
                    <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                      {{ member.email }}
                    </p>
                  </div>
                  <v-chip size="small" color="purple-darken-3" variant="tonal">
                    {{ adminUserRoleLabel(member.role) }}
                  </v-chip>
                </div>
              </div>
            </section>

            <section v-show="activeChurchSheetTab === 'ministerios'" class="detail-section">
              <div class="detail-section-heading">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                  Ministérios
                </h3>
                <div class="detail-heading-actions">
                  <v-chip size="small" color="purple-darken-3" variant="tonal">
                    {{ selectedChurch.departments.length }}
                  </v-chip>
                  <v-btn
                    v-if="selectedChurch.departments.length > churchPreviewLimit"
                    variant="text"
                    color="indigo-darken-2"
                    size="small"
                    class="text-none"
                    @click="showAllChurchDepartments = !showAllChurchDepartments"
                  >
                    {{ showAllChurchDepartments ? "Mostrar menos" : "Mostrar todos" }}
                  </v-btn>
                </div>
              </div>
              <div class="detail-list">
                <div
                  v-for="department in visibleChurchDepartments"
                  :key="department.id"
                  class="admin-row clickable-row"
                  @click="openAdminDepartmentDetails(department)"
                >
                  <div class="min-w-0">
                    <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                      {{ department.name }}
                    </p>
                    <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                      Líder: {{ department.leader.name }}
                    </p>
                  </div>
                  <div class="text-caption text-grey-darken-1 text-right">
                    {{ department.membersCount }} membros<br />
                    {{ department.schedulesCount }} escalas
                  </div>
                </div>
              </div>
            </section>

            <section v-show="activeChurchSheetTab === 'escalas'" class="detail-section">
              <div class="detail-section-heading">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                  Escalas
                </h3>
                <div class="detail-heading-actions">
                  <v-chip size="small" color="teal-darken-2" variant="tonal">
                    {{ selectedChurch.schedules?.length || 0 }}
                  </v-chip>
                  <v-btn
                    v-if="(selectedChurch.schedules?.length || 0) > churchPreviewLimit"
                    variant="text"
                    color="indigo-darken-2"
                    size="small"
                    class="text-none"
                    @click="showAllChurchSchedules = !showAllChurchSchedules"
                  >
                    {{ showAllChurchSchedules ? "Mostrar menos" : "Mostrar todos" }}
                  </v-btn>
                </div>
              </div>

              <div v-if="visibleChurchSchedules.length" class="detail-list">
                <div
                  v-for="schedule in visibleChurchSchedules"
                  :key="schedule.id"
                  class="admin-row schedule-row clickable-row"
                  @click="openAdminScheduleDetails(schedule)"
                >
                  <div class="min-w-0">
                    <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                      {{ schedule.description }}
                    </p>
                    <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                      {{ schedule.department.name }} · {{ formatDate(schedule.date) }}
                    </p>
                  </div>
                  <div class="text-caption text-grey-darken-1 text-right">
                    {{ schedule.assignmentsCount }} voluntários<br />
                    {{ schedule.mediaItemsCount }} itens
                  </div>
                </div>
              </div>

              <div v-else class="detail-empty">
                Nenhuma escala cadastrada.
              </div>
            </section>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isAdminUserDetailsOpen" max-width="520">
      <v-card
        v-if="selectedAdminUser"
        class="rounded-xl pa-6 bg-white"
        elevation="0"
      >
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="48" class="mr-3">
              <Users size="22" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedAdminUser.name }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                {{ selectedAdminUser.email }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeAdminUserDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-info mb-5">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Igreja</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedChurch?.name || "-" }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Telefone</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedAdminUser.phone || "-" }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ adminUserRoleLabel(selectedAdminUser.role) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Criado em</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ formatDate(selectedAdminUser.createdAt) }}
            </p>
          </div>
        </div>

        <v-divider class="mb-4" />

        <div class="mb-5">
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
            Cargo
          </h3>
          <p class="text-caption text-grey-darken-1 mb-3">
            Um membro pode ter mais de um cargo. As permissões somam.
          </p>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <v-chip
              v-for="memberRole in selectedAdminUser.roles ?? []"
              :key="memberRole.id"
              size="small"
              :color="memberRole.scope === 'MINISTRY' ? 'orange-darken-2' : 'teal-darken-2'"
              variant="tonal"
              :closable="canAssignSelectedAdminUserRole && !isAssigningRole"
              @click:close="removeRoleFromSelected(memberRole.id)"
            >
              {{ memberRole.name }}
            </v-chip>
            <span
              v-if="!(selectedAdminUser.roles ?? []).length"
              class="text-caption text-grey-darken-1"
            >
              Nenhum cargo atribuído
            </span>
          </div>
          <div class="assign-role-row">
            <v-select
              v-model="selectedMemberRoleId"
              :items="assignableRolesFor(selectedAdminUser)"
              item-title="label"
              item-value="value"
              label="Adicionar cargo"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              hide-details
              class="assign-role-select"
              :disabled="!canAssignSelectedAdminUserRole || isAssigningRole"
            />
            <v-btn
              size="small"
              color="purple-darken-3"
              variant="tonal"
              class="text-none"
              :loading="isAssigningRole"
              :disabled="!canAssignSelectedAdminUserRole || isAssigningRole || !selectedMemberRoleId"
              @click="addRoleToSelected"
            >
              Adicionar
            </v-btn>
          </div>
          <v-alert
            v-if="selectedAdminUserRoleLockedReason"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ selectedAdminUserRoleLockedReason }}
          </v-alert>
        </div>

        <v-divider class="mb-4" />

        <div class="mb-5">
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
            Editar usuário
          </h3>
          <p class="text-caption text-grey-darken-1 mb-3">
            Como admin da plataforma, você pode alterar os dados deste usuário em qualquer igreja.
          </p>

          <v-text-field
            v-model="adminUserEditForm.name"
            label="Nome"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
            :disabled="!canEditSelectedAdminUser"
          />
          <v-text-field
            v-model="adminUserEditForm.phone"
            label="Telefone"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
            :disabled="!canEditSelectedAdminUser"
          />
          <v-select
            v-model="adminUserEditForm.role"
            :items="[{ title: 'Membro', value: 'MEMBER' }, { title: 'Pastor', value: 'PASTOR' }]"
            item-title="title"
            item-value="value"
            label="Papel"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
            :disabled="!canEditSelectedAdminUser"
          />

          <v-alert
            v-if="adminUserEditError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ adminUserEditError }}
          </v-alert>

          <v-alert
            v-if="selectedAdminUserEditLockedReason"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ selectedAdminUserEditLockedReason }}
          </v-alert>

          <v-alert
            v-if="adminUserResetPasswordResult"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Senha temporária gerada: <strong>{{ adminUserResetPasswordResult }}</strong>
            — o usuário precisará trocá-la no próximo login.
          </v-alert>

          <div class="d-flex flex-wrap gap-2">
            <v-btn
              color="purple-darken-3"
              variant="tonal"
              class="text-none"
              :loading="isSavingAdminUser"
              :disabled="!canEditSelectedAdminUser"
              @click="handleUpdateAdminUser"
            >
              Salvar alterações
            </v-btn>
            <v-btn
              color="indigo-darken-2"
              variant="tonal"
              class="text-none"
              :loading="isResettingAdminUserPassword"
              :disabled="!canResetSelectedAdminUserPassword"
              @click="handleResetAdminUserPassword"
            >
              Redefinir senha
            </v-btn>
            <v-btn
              color="red-darken-2"
              variant="tonal"
              class="text-none"
              :disabled="!canEditSelectedAdminUser"
              @click="handleRemoveAdminUser"
            >
              Remover da igreja
            </v-btn>
          </div>
        </div>

        <div class="d-flex justify-end">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            @click="closeAdminUserDetails"
          >
            Fechar
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isAdminDepartmentDetailsOpen" max-width="520">
      <v-card
        v-if="selectedAdminDepartment"
        class="rounded-xl pa-6 bg-white"
        elevation="0"
      >
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgPurple" size="48" class="mr-3">
              <Building size="22" :color="purpleAccent" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedAdminDepartment.name }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                Líder: {{ selectedAdminDepartment.leader.name }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeAdminDepartmentDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-info">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ departmentTypeLabel(selectedAdminDepartment.type) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Status</p>
            <v-chip
              size="small"
              :color="selectedAdminDepartment.isActive ? 'teal-darken-2' : 'grey'"
              variant="tonal"
            >
              {{ selectedAdminDepartment.isActive ? "Ativo" : "Inativo" }}
            </v-chip>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Membros</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedAdminDepartment.membersCount }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Escalas</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedAdminDepartment.schedulesCount }}
            </p>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isAdminScheduleDetailsOpen" max-width="520">
      <v-card
        v-if="selectedAdminSchedule"
        class="rounded-xl pa-6 bg-white"
        elevation="0"
      >
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar color="#F0FDFA" size="48" class="mr-3">
              <Calendar size="22" color="#14B8A6" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedAdminSchedule.description }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                {{ selectedAdminSchedule.department.name }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeAdminScheduleDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-info">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Data</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ formatDate(selectedAdminSchedule.date) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Voluntários</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedAdminSchedule.assignmentsCount }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Itens vinculados</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedAdminSchedule.mediaItemsCount }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Ensaio</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedAdminSchedule.rehearsalAt ? formatDate(selectedAdminSchedule.rehearsalAt) : "-" }}
            </p>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    </section>

    <section v-show="activePlatformTab === 'videos'" class="platform-tab-panel platform-help-panel">
      <AdminHelpVideos />
    </section>
  </div>

  <div
    v-if="canAccessChurchAdmin"
    v-show="!isPlatformAdmin || activeAdminMode === 'church'"
    id="pastoral-admin"
    class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20"
  >
    <div class="church-admin-hero mb-6">
      <div class="min-w-0">
        <p v-if="isPlatformAdmin" class="platform-kicker mb-2">Admin pastoral</p>
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">
            Administração da igreja
          </h1>
          <UtilsPageHelpButton title="Administração da igreja" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Gerencie membros, cargos, ministérios e dados operacionais da sua igreja
        </p>
      </div>
    </div>

    <div class="admin-tabs-bar mb-6">
      <v-tabs
        v-model="activeAdminTab"
        density="compact"
        color="indigo-darken-2"
        slider-color="indigo-darken-2"
        class="admin-tabs"
      >
        <v-tab v-if="isChurchWideManager" value="relatorios" class="text-none font-weight-medium admin-tab">Relatórios</v-tab>
      </v-tabs>
    </div>

    <div class="stats-grid church-stats-grid mb-6">
      <AdminStatCard
        title="Membros"
        :value="members.length"
        :icon="Users"
        iconColor="#B5472A"
        bgColor="#F7E2D3"
      />
      <AdminStatCard
        title="Ministérios"
        :value="departments.length"
        :icon="Building"
        iconColor="#C2542C"
        bgColor="#F7E2D3"
      />
      <AdminStatCard
        title="Escalas"
        :value="churchTotals.schedules"
        :icon="Calendar"
        iconColor="#14B8A6"
        bgColor="#F0FDFA"
      />
      <AdminStatCard
        title="Músicas"
        :value="churchTotals.songs"
        :icon="Music"
        iconColor="#EAB308"
        bgColor="#FEFCE8"
      />
    </div>

    <PlanLock
      v-if="isChurchWideManager && activeAdminTab === 'relatorios'"
      feature="REPORTS"
      class="mb-8"
    >
      <AdminReports :departments="departments" />
    </PlanLock>

    <section v-show="isChurchWideManager && activeAdminTab === 'relatorios'" class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Relatório pastoral
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Visão geral de presença, respostas, liderança e atividade dos ministérios.
          </p>
        </div>
      </div>

      <div class="pastoral-report-grid mb-4">
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.confirmationRate }}%</span>
          <small>confirmação nas escalas</small>
        </v-card>
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.attendanceRate }}%</span>
          <small>presença registrada</small>
        </v-card>
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.pendingResponses }}</span>
          <small>respostas pendentes</small>
        </v-card>
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.openTasks }}</span>
          <small>tarefas cadastradas</small>
        </v-card>
      </div>

      <div class="pastoral-report-layout">
        <v-card class="report-panel pa-4 elevation-1 bg-white border-subtle">
          <div class="report-panel-title mb-3">
            <BarChart3 size="18" />
            <h3>Ministérios</h3>
          </div>
          <div class="report-bars">
            <div
              v-for="row in departmentReportRows"
              :key="row.id"
              class="report-row"
            >
              <div class="report-row-top">
                <strong>{{ row.name }}</strong>
                <span>{{ row.confirmationRate }}%</span>
              </div>
              <div class="report-track">
                <span :style="{ width: `${row.confirmationRate}%` }" />
              </div>
              <small>
                {{ row.assignments }} escalados · {{ row.schedules }} escalas · {{ row.tasks }} tarefas
              </small>
            </div>
          </div>
        </v-card>

        <v-card class="report-panel pa-4 elevation-1 bg-white border-subtle">
          <div class="report-panel-title mb-3">
            <UserCheck size="18" />
            <h3>Liderança</h3>
          </div>
          <div class="leadership-summary">
            <div>
              <strong>{{ pastoralLeadership.pastors.length }}</strong>
              <span>pastores</span>
            </div>
            <div>
              <strong>{{ pastoralLeadership.leaders.length }}</strong>
              <span>líderes</span>
            </div>
            <div>
              <strong>{{ pastoralLeadership.managers.length }}</strong>
              <span>gestores</span>
            </div>
          </div>
          <div class="leadership-list mt-4">
            <div
              v-for="leader in pastoralLeadership.leaders"
              :key="leader.id"
              class="leadership-row"
            >
              <span>{{ leader.name }}</span>
              <small>{{ leader.departments.join(", ") }}</small>
            </div>
            <p
              v-if="pastoralLeadership.leaders.length === 0"
              class="text-caption text-grey-darken-1 mb-0"
            >
              Nenhum líder definido nos ministérios.
            </p>
          </div>
        </v-card>
      </div>

      <v-card class="report-panel pa-4 elevation-1 bg-white border-subtle mt-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
          <div class="report-panel-title mb-0">
            <Users size="18" />
            <h3>Público do culto</h3>
          </div>
          <v-btn
            color="purple-darken-3"
            class="rounded-lg text-none px-4"
            size="small"
            elevation="1"
            @click="openAttendanceDialog"
          >
            <Plus size="16" class="mr-2" /> Registrar presença
          </v-btn>
        </div>

        <v-alert v-if="attendanceError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ attendanceError }}
        </v-alert>

        <div v-if="attendanceLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="purple-darken-3" />
        </div>

        <template v-else>
          <div class="attendance-totals mb-4">
            <div>
              <strong>{{ attendanceTotals.visitors }}</strong>
              <span>visitantes (30 dias)</span>
            </div>
            <div>
              <strong>{{ attendanceTotals.members }}</strong>
              <span>membros (30 dias)</span>
            </div>
            <div>
              <strong>{{ attendanceTotals.total }}</strong>
              <span>total</span>
            </div>
          </div>

          <p v-if="attendanceEntries.length === 0" class="text-caption text-grey-darken-1 mb-0">
            Nenhuma presença registrada nos últimos 30 dias.
          </p>
          <div v-else class="attendance-list">
            <div v-for="entry in attendanceEntries" :key="entry.id" class="attendance-row">
              <div>
                <strong>{{ formatAttendanceDate(entry.date) }}</strong>
                <small>{{ entry.serviceTime.label }}</small>
              </div>
              <div class="attendance-counts">
                <span>{{ entry.visitorCount }} visitantes</span>
                <span>{{ entry.memberCount }} membros</span>
              </div>
            </div>
          </div>
        </template>
      </v-card>
    </section>

    <UtilsResponsiveOverlay v-model="isAttendanceDialogOpen" max-width="480">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            Registrar presença
          </h2>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isAttendanceDialogOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-alert
          v-if="sortedServiceTimes.length === 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Nenhum culto cadastrado ainda. Configure um horário de culto na aba "Geral" antes de registrar presença.
        </v-alert>
        <v-select
          v-else
          v-model="attendanceForm.serviceTimeId"
          label="Culto"
          :items="sortedServiceTimes"
          :item-title="ruleServiceTimeLabel"
          item-value="id"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model="attendanceForm.date"
          label="Data do culto"
          type="date"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model.number="attendanceForm.visitorCount"
          label="Visitantes"
          type="number"
          min="0"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model.number="attendanceForm.memberCount"
          label="Membros"
          type="number"
          min="0"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-textarea
          v-model="attendanceForm.notes"
          label="Observação (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
          rows="2"
          auto-grow
        />

        <v-alert v-if="attendanceFormError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ attendanceFormError }}
        </v-alert>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isAttendanceDialogOpen = false">
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            variant="flat"
            class="text-none font-weight-bold"
            :disabled="sortedServiceTimes.length === 0"
            :loading="isSavingAttendance"
            @click="handleSaveAttendance"
          >
            Salvar
          </v-btn>
        </div>
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

    <AdminChurchPlanDialog
      v-model="isPlanDialogOpen"
      :church="planDialogChurch"
      @updated="handlePlanUpdated"
    />
  </div>

  <div v-if="!isPlatformAdmin && !canAccessChurchAdmin" class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
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
import { computed, onMounted, onUnmounted, reactive, watch } from "vue";
import { Building, Calendar, Music, UserCheck, Users, Church, ArrowRight, BarChart3, Pencil, Trash2, Link, Plus, QrCode, RefreshCw, Globe, Palette, Save, Lock } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";
import {
  useAdmin,
  type AdminChurch,
  type AdminChurchDepartment,
  type AdminChurchDetails,
  type AdminChurchSchedule,
  type AdminChurchUser,
} from "../../../composables/useAdmin";
import {
  useChurchRoles,
  type ChurchRole,
} from "../../../composables/useChurchRoles";
import { usePermissions } from "../../../composables/usePermissions";
import { useServiceTimes, type ServiceTime } from "../../../composables/useServiceTimes";
import { useAttendance, type ServiceAttendance } from "../../../composables/useAttendance";
import { PLAN_LABELS, type Plan } from "../../../composables/usePlan";

const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const purpleAccent = computed(() => isDark.value ? "#f0975a" : "#C2542C");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");
const avatarBgPurple = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");



const { getMembers } = useMembers();
const { getDepartments, getChurchSchedules } = useDepartments();
const {
  getChurches,
  getChurchById,
  updateChurchUserByAdmin,
  resetChurchUserPasswordByAdmin,
  removeChurchUserByAdmin,
  deleteChurch,
} = useAdmin();
const {
  serviceTimes,
  loadServiceTimes,
} = useServiceTimes();

const members = ref<ChurchMember[]>([]);
const departments = ref<ChurchDepartment[]>([]);
const churchSchedules = ref<DepartmentSchedule[]>([]);
const adminChurches = ref<AdminChurch[]>([]);
const planDialogChurch = ref<AdminChurch | null>(null);
const isPlanDialogOpen = ref(false);

function openPlanDialog(church: AdminChurch) {
  planDialogChurch.value = church;
  isPlanDialogOpen.value = true;
}

function handlePlanUpdated(updated: Partial<AdminChurch> & { id: string }) {
  adminChurches.value = adminChurches.value.map((church) =>
    church.id === updated.id ? { ...church, ...updated } : church,
  );
}

function planLabel(church: AdminChurch): string {
  return PLAN_LABELS[(church.plan as Plan) ?? "FREE"] ?? church.plan;
}

function churchTrialDaysLeft(church: AdminChurch): number | null {
  if (!church.trialEndsAt || church.subscriptionStatus !== "TRIALING") return null;
  const diffMs = new Date(church.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

type AdminMode = "master" | "church";
type PlatformAdminTab = "geral" | "igrejas" | "videos";

const activeAdminMode = ref<AdminMode>("master");
const activePlatformTab = ref<PlatformAdminTab>("geral");
const activeAdminTab = ref("relatorios");
const selectedChurch = ref<AdminChurchDetails | null>(null);
const membersError = ref("");
const departmentsError = ref("");
const platformError = ref("");
const isLoadingPlatform = ref(false);
const isLoadingChurch = ref(false);
const isAdminUserDetailsOpen = ref(false);
const isAdminDepartmentDetailsOpen = ref(false);
const isAdminScheduleDetailsOpen = ref(false);
const isChurchDetailsOpen = ref(false);
const isChurchDetailsSheetOpen = ref(false);
const selectedAdminUser = ref<AdminChurchUser | null>(null);
const selectedAdminDepartment = ref<AdminChurchDepartment | null>(null);
const selectedAdminSchedule = ref<AdminChurchSchedule | null>(null);
const pendingRemoveAdminUser = ref<AdminChurchUser | null>(null);
const pendingDeleteChurch = ref<AdminChurch | null>(null);
const deleteChurchError = ref("");
const isConfirmingDelete = ref(false);
const adminUserEditForm = reactive({
  name: "",
  phone: "",
  role: "MEMBER",
});
const isSavingAdminUser = ref(false);
const adminUserEditError = ref("");
const isResettingAdminUserPassword = ref(false);
const adminUserResetPasswordResult = ref("");
const churchPreviewLimit = 3;
const activeChurchSheetTab = ref("geral");
const showAllChurchUsers = ref(false);
const showAllChurchDepartments = ref(false);
const showAllChurchSchedules = ref(false);
const platformSearch = ref("");
const platformStatusFilter = ref<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

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
const isCurrentUserSuperAdmin = computed(() => user.value?.role === "SUPER_ADMIN");
const isProtectedSuperAdmin = (member?: { role?: string } | null) =>
  member?.role === "SUPER_ADMIN" && !isCurrentUserSuperAdmin.value;
const selectedChurchIsCurrentUserChurch = computed(
  () => Boolean(selectedChurch.value?.id && selectedChurch.value.id === user.value?.church?.id),
);
const canAssignSelectedAdminUserRole = computed(
  () =>
    isCurrentUserSuperAdmin.value &&
    selectedChurchIsCurrentUserChurch.value &&
    Boolean(selectedAdminUser.value) &&
    selectedAdminUser.value?.id !== user.value?.id &&
    !isProtectedSuperAdmin(selectedAdminUser.value),
);
const selectedAdminUserRoleLockedReason = computed(() => {
  if (!selectedAdminUser.value) return "";
  if (!isCurrentUserSuperAdmin.value) {
    return "Somente super admins podem alterar cargos por esta visão master.";
  }
  if (!selectedChurchIsCurrentUserChurch.value) {
    return "Nesta visão master, cargos de outras igrejas ficam somente para consulta.";
  }
  if (selectedAdminUser.value.id === user.value?.id) {
    return "Você não pode alterar seu próprio cargo por esta tela.";
  }
  if (isProtectedSuperAdmin(selectedAdminUser.value)) {
    return "Usuários super admin só podem ser alterados por outro super admin.";
  }
  return "";
});
const platformTotals = computed(() => ({
  users: adminChurches.value.reduce(
    (total, church) => total + church.membersCount,
    0,
  ),
  departments: adminChurches.value.reduce(
    (total, church) => total + church.departmentsCount,
    0,
  ),
  activeChurches: adminChurches.value.filter((church) => church.isActive).length,
}));

const normalizeFilterText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const platformStatusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Ativas", value: "ACTIVE" },
  { label: "Inativas", value: "INACTIVE" },
];

const platformStatusSummary = computed(() => ({
  active: adminChurches.value.filter((church) => church.isActive).length,
  inactive: adminChurches.value.filter((church) => !church.isActive).length,
  withoutMembers: adminChurches.value.filter((church) => church.membersCount === 0).length,
}));

const filteredAdminChurches = computed(() => {
  const search = normalizeFilterText(platformSearch.value);

  return adminChurches.value.filter((church) => {
    const matchesStatus =
      platformStatusFilter.value === "ALL" ||
      (platformStatusFilter.value === "ACTIVE" && church.isActive) ||
      (platformStatusFilter.value === "INACTIVE" && !church.isActive);
    const matchesSearch =
      !search ||
      normalizeFilterText(
        `${church.name} ${church.city || ""} ${church.state || ""} ${church.document || ""}`,
      ).includes(search);

    return matchesStatus && matchesSearch;
  });
});

const topChurches = computed(() =>
  [...adminChurches.value]
    .sort((first, second) => second.membersCount - first.membersCount)
    .slice(0, 4),
);

const selectedChurchAddress = computed(() => {
  if (!selectedChurch.value) return "Buscando informações";

  const street = selectedChurch.value.road || "Endereço não informado";
  const number = selectedChurch.value.number
    ? `, ${selectedChurch.value.number}`
    : "";

  return `${street}${number}`;
});

const visibleChurchUsers = computed(() => {
  const users = selectedChurch.value?.users || [];
  return showAllChurchUsers.value ? users : users.slice(0, churchPreviewLimit);
});

const visibleChurchDepartments = computed(() => {
  const departments = selectedChurch.value?.departments || [];
  return showAllChurchDepartments.value
    ? departments
    : departments.slice(0, churchPreviewLimit);
});

const visibleChurchSchedules = computed(() => {
  const schedules = selectedChurch.value?.schedules || [];
  return showAllChurchSchedules.value
    ? schedules
    : schedules.slice(0, churchPreviewLimit);
});

const churchTotals = computed(() => ({
  schedules: departments.value.reduce(
    (total, department) => total + (department.schedulesCount || 0),
    0,
  ),
  songs: departments.value.reduce(
    (total, department) => total + (department.songsCount || 0),
    0,
  ),
}));

const churchAssignments = computed(() =>
  churchSchedules.value.flatMap((schedule) => schedule.assignments || []),
);

const percentage = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const churchReport = computed(() => {
  const assignments = churchAssignments.value;
  const totalAssignments = assignments.length;
  const confirmed = assignments.filter(
    (assignment) => assignment.confirmationStatus === "CONFIRMED",
  ).length;
  const present = assignments.filter(
    (assignment) => assignment.attendanceStatus === "PRESENT",
  ).length;
  const attendanceTracked = assignments.filter(
    (assignment) => assignment.attendanceStatus !== "PENDING",
  ).length;

  return {
    totalAssignments,
    confirmationRate: percentage(confirmed, totalAssignments),
    attendanceRate: percentage(present, attendanceTracked),
    pendingResponses: assignments.filter(
      (assignment) =>
        !assignment.confirmationStatus ||
        assignment.confirmationStatus === "PENDING" ||
        assignment.confirmationStatus === "MAYBE",
    ).length,
    declined: assignments.filter(
      (assignment) => assignment.confirmationStatus === "DECLINED",
    ).length,
    swapRequests: assignments.filter(
      (assignment) => assignment.confirmationStatus === "SWAP_REQUESTED",
    ).length,
    openTasks: departments.value.reduce(
      (total, department) => total + (department.tasksCount || 0),
      0,
    ),
  };
});

const departmentReportRows = computed(() =>
  departments.value
    .map((department) => {
      const schedules = churchSchedules.value.filter(
        (schedule) => schedule.departmentId === department.id,
      );
      const assignments = schedules.flatMap((schedule) => schedule.assignments || []);
      const confirmed = assignments.filter(
        (assignment) => assignment.confirmationStatus === "CONFIRMED",
      ).length;

      return {
        id: department.id,
        name: department.name,
        schedules: schedules.length || department.schedulesCount || 0,
        assignments: assignments.length,
        tasks: department.tasksCount || 0,
        confirmationRate: percentage(confirmed, assignments.length),
      };
    })
    .sort((first, second) => second.confirmationRate - first.confirmationRate),
);

const pastoralLeadership = computed(() => {
  const leaderMap = new Map<string, ChurchMember & { departments: string[] }>();

  departments.value.forEach((department) => {
    const leader = members.value.find((member) => member.id === department.leaderId);
    if (!leader) return;

    const current = leaderMap.get(leader.id) || {
      ...leader,
      departments: [],
    };
    current.departments.push(department.name);
    leaderMap.set(leader.id, current);
  });

  return {
    pastors: members.value.filter((member) => member.role === "PASTOR"),
    leaders: Array.from(leaderMap.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
    managers: members.value.filter((member) => member.canManageMembers),
  };
});

const { listAttendance, saveAttendance } = useAttendance();

const attendanceEntries = ref<ServiceAttendance[]>([]);
const attendanceLoading = ref(false);
const attendanceError = ref("");

const attendanceTotals = computed(() => {
  const visitors = attendanceEntries.value.reduce((sum, entry) => sum + entry.visitorCount, 0);
  const members = attendanceEntries.value.reduce((sum, entry) => sum + entry.memberCount, 0);
  return { visitors, members, total: visitors + members };
});

const loadAttendance = async () => {
  if (!isChurchWideManager.value) return;
  attendanceLoading.value = true;
  attendanceError.value = "";
  const { data, error } = await listAttendance(30);
  if (error) attendanceError.value = error;
  attendanceEntries.value = data ?? [];
  attendanceLoading.value = false;
};

// Data-only (meia-noite UTC) - nao usa toLocaleDateString/Date direto, pois
// isso reinterpreta no fuso local e pode voltar um dia (mesma classe de bug
// ja corrigida antes nas escalas). Recorta o "YYYY-MM-DD" puro da string ISO.
const formatAttendanceDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

const isAttendanceDialogOpen = ref(false);
const isSavingAttendance = ref(false);
const attendanceFormError = ref("");
const attendanceForm = reactive<{
  serviceTimeId: string;
  date: string;
  visitorCount: number | null;
  memberCount: number | null;
  notes: string;
}>({
  serviceTimeId: "",
  date: "",
  visitorCount: null,
  memberCount: null,
  notes: "",
});

const openAttendanceDialog = () => {
  attendanceForm.serviceTimeId = sortedServiceTimes.value[0]?.id ?? "";
  attendanceForm.date = new Date().toISOString().slice(0, 10);
  attendanceForm.visitorCount = null;
  attendanceForm.memberCount = null;
  attendanceForm.notes = "";
  attendanceFormError.value = "";
  isAttendanceDialogOpen.value = true;
};

const handleSaveAttendance = async () => {
  if (!attendanceForm.serviceTimeId || !attendanceForm.date) {
    attendanceFormError.value = "Culto e data são obrigatórios";
    return;
  }
  if (attendanceForm.visitorCount === null || attendanceForm.memberCount === null) {
    attendanceFormError.value = "Informe visitantes e membros (pode ser 0)";
    return;
  }

  isSavingAttendance.value = true;
  attendanceFormError.value = "";

  const { error } = await saveAttendance({
    serviceTimeId: attendanceForm.serviceTimeId,
    date: attendanceForm.date,
    visitorCount: attendanceForm.visitorCount,
    memberCount: attendanceForm.memberCount,
    notes: attendanceForm.notes,
  });

  isSavingAttendance.value = false;

  if (error) {
    attendanceFormError.value = error;
    return;
  }

  isAttendanceDialogOpen.value = false;
  await loadAttendance();
};

const isDeleteDialogOpen = computed({
  get: () =>
    Boolean(
      pendingRemoveAdminUser.value ||
        pendingDeleteChurch.value,
    ),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingRemoveAdminUser.value = null;
      pendingDeleteChurch.value = null;
    }
  },
});

const deleteDialogTitle = computed(() => {
  if (pendingRemoveAdminUser.value) return "Remover usuário da igreja";
  if (pendingDeleteChurch.value) return "Excluir igreja";
  return "Remover membro";
});

const deleteDialogMessage = computed(() => {
  if (pendingRemoveAdminUser.value) {
    return `${pendingRemoveAdminUser.value.name} será removido desta igreja.`;
  }

  if (pendingDeleteChurch.value) {
    return `A igreja ${pendingDeleteChurch.value.name} será excluída permanentemente, junto com todos os membros, ministérios, escalas, avisos e devocionais. Essa ação não pode ser desfeita.`;
  }

  return "Essa ação não pode ser desfeita.";
});

const announcementKindOptions = [
  { label: "Aviso", value: "ANNOUNCEMENT" },
  { label: "Palavra do Pastor", value: "PASTOR_MESSAGE" },
  { label: "Oracao", value: "PRAYER" },
];

const weekdayOptions = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terca", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sabado", value: 6 },
];

const weekdayName = (weekday: number) =>
  weekdayOptions.find((day) => day.value === weekday)?.label ?? "-";

const sortedServiceTimes = computed(() =>
  [...serviceTimes.value].sort(
    (a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time),
  ),
);

const ruleServiceTimeLabel = (item: ServiceTime | string) => {
  if (!item || typeof item !== "object") return "";
  return `${weekdayName(item.weekday)} · ${item.time} · ${item.label}`;
};

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Louvor", value: "MUSIC" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];
const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const adminUserRoleLabel = (role: string) => {
  if (role === "PASTOR") return "Pastor";
  if (role === "SUPER_ADMIN") return "Super admin";
  if (role === "ADMIN") return "Admin";
  return "Membro";
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const loadMembers = async () => {
  membersError.value = "";

  const { data, error } = await getMembers();

  if (error) {
    membersError.value = error;
    return;
  }

  members.value = data ?? [];
};

const loadDepartments = async () => {
  departmentsError.value = "";

  const { data, error } = await getDepartments();

  if (error) {
    departmentsError.value = error;
    return;
  }

  departments.value = data ?? [];
};

const loadChurchSchedules = async () => {
  const { data } = await getChurchSchedules();
  churchSchedules.value = data ?? [];
};

const loadChurchAdminData = async () => {
  await Promise.all([
    loadMembers(),
    loadDepartments(),
    loadChurchSchedules(),
    loadRoles(),
    loadServiceTimes(),
  ]);
};

const loadPlatformChurches = async () => {
  platformError.value = "";
  isLoadingPlatform.value = true;

  try {
    const { data, error } = await getChurches();

    if (error) {
      platformError.value = error;
      adminChurches.value = [];
      return;
    }

    adminChurches.value = data ?? [];
  } finally {
    isLoadingPlatform.value = false;
  }
};

const selectChurch = async (id: string) => {
  platformError.value = "";
  isLoadingChurch.value = true;
  closeAdminUserDetails();
  selectedChurch.value = null;
  activeChurchSheetTab.value = "geral";
  showAllChurchUsers.value = false;
  showAllChurchDepartments.value = false;
  showAllChurchSchedules.value = false;
  isChurchDetailsOpen.value = false;
  isChurchDetailsSheetOpen.value = true;

  try {
    const { data, error } = await getChurchById(id);

    if (error || !data) {
      platformError.value = error || "Não foi possível carregar a igreja.";
      isChurchDetailsOpen.value = false;
      isChurchDetailsSheetOpen.value = false;
      return;
    }

    selectedChurch.value = data;
  } finally {
    isLoadingChurch.value = false;
  }
};

const closeChurchDetails = () => {
  if (isChurchDetailsOpen.value || isChurchDetailsSheetOpen.value) return;

  selectedChurch.value = null;
  isLoadingChurch.value = false;
  closeAdminUserDetails();
};

const openAdminUserDetails = (member: AdminChurchUser) => {
  selectedAdminUser.value = member;
  selectedMemberRoleId.value = null;
  adminUserEditForm.name = member.name;
  adminUserEditForm.phone = member.phone || "";
  adminUserEditForm.role = member.role === "PASTOR" ? "PASTOR" : "MEMBER";
  adminUserEditError.value = "";
  adminUserResetPasswordResult.value = "";
  isAdminUserDetailsOpen.value = true;
};

const closeAdminUserDetails = () => {
  isAdminUserDetailsOpen.value = false;
  selectedAdminUser.value = null;
  selectedMemberRoleId.value = null;
  adminUserEditError.value = "";
  adminUserResetPasswordResult.value = "";
};

const isSelectedAdminUserTitularPastor = computed(
  () =>
    Boolean(selectedAdminUser.value) &&
    selectedAdminUser.value?.id === selectedChurch.value?.userMainId,
);

const canEditSelectedAdminUser = computed(
  () =>
    Boolean(selectedAdminUser.value) &&
    selectedAdminUser.value?.id !== user.value?.id &&
    !isSelectedAdminUserTitularPastor.value &&
    !isProtectedSuperAdmin(selectedAdminUser.value),
);

// Redefinir senha nao muda cargo/igreja nem remove ninguem, entao e seguro
// permitir mesmo para o pastor titular (ex.: pastor perdeu o acesso e pediu
// para o admin da plataforma resetar). Edicao de dados e remocao continuam
// bloqueadas para o titular.
const canResetSelectedAdminUserPassword = computed(
  () =>
    Boolean(selectedAdminUser.value) &&
    selectedAdminUser.value?.id !== user.value?.id &&
    !isProtectedSuperAdmin(selectedAdminUser.value),
);

const selectedAdminUserEditLockedReason = computed(() => {
  if (!selectedAdminUser.value) return "";
  if (selectedAdminUser.value.id === user.value?.id) {
    return "Você não pode editar sua própria conta por esta tela.";
  }
  if (isSelectedAdminUserTitularPastor.value) {
    return "O pastor titular não pode ter dados editados nem ser removido por este fluxo — apenas a senha pode ser redefinida.";
  }
  if (isProtectedSuperAdmin(selectedAdminUser.value)) {
    return "Usuários super admin só podem ser alterados por outro super admin.";
  }
  return "";
});

const handleUpdateAdminUser = async () => {
  if (!selectedAdminUser.value || !selectedChurch.value) return;

  adminUserEditError.value = "";

  if (!adminUserEditForm.name.trim()) {
    adminUserEditError.value = "Informe o nome do usuário.";
    return;
  }

  isSavingAdminUser.value = true;

  try {
    const { data, error } = await updateChurchUserByAdmin(
      selectedChurch.value.id,
      selectedAdminUser.value.id,
      {
        name: adminUserEditForm.name.trim(),
        phone: adminUserEditForm.phone.trim() || null,
        role: adminUserEditForm.role,
      },
    );

    if (error || !data) {
      adminUserEditError.value = error || "Não foi possível salvar as alterações.";
      return;
    }

    selectedAdminUser.value = { ...selectedAdminUser.value, ...data };
    selectedChurch.value = {
      ...selectedChurch.value,
      users: selectedChurch.value.users.map((item) =>
        item.id === data.id ? { ...item, ...data } : item,
      ),
    };
  } finally {
    isSavingAdminUser.value = false;
  }
};

const handleResetAdminUserPassword = async () => {
  if (!selectedAdminUser.value || !selectedChurch.value) return;

  adminUserEditError.value = "";
  adminUserResetPasswordResult.value = "";
  isResettingAdminUserPassword.value = true;

  try {
    const { data, error } = await resetChurchUserPasswordByAdmin(
      selectedChurch.value.id,
      selectedAdminUser.value.id,
    );

    if (error || !data) {
      adminUserEditError.value = error || "Não foi possível redefinir a senha.";
      return;
    }

    adminUserResetPasswordResult.value = data.temporaryPassword;
  } finally {
    isResettingAdminUserPassword.value = false;
  }
};

const handleRemoveAdminUser = () => {
  if (!selectedAdminUser.value) return;
  pendingRemoveAdminUser.value = selectedAdminUser.value;
};

const confirmRemoveAdminUser = async () => {
  if (!pendingRemoveAdminUser.value || !selectedChurch.value) return;

  isConfirmingDelete.value = true;
  const removedId = pendingRemoveAdminUser.value.id;
  const churchId = selectedChurch.value.id;

  try {
    const { error } = await removeChurchUserByAdmin(churchId, removedId);

    if (error) {
      adminUserEditError.value = error;
      return;
    }

    selectedChurch.value = {
      ...selectedChurch.value,
      users: selectedChurch.value.users.filter((item) => item.id !== removedId),
    };
    pendingRemoveAdminUser.value = null;
    closeAdminUserDetails();
  } finally {
    isConfirmingDelete.value = false;
  }
};

const openAdminDepartmentDetails = (department: AdminChurchDepartment) => {
  selectedAdminDepartment.value = department;
  isAdminDepartmentDetailsOpen.value = true;
};

const closeAdminDepartmentDetails = () => {
  isAdminDepartmentDetailsOpen.value = false;
  selectedAdminDepartment.value = null;
};

const openAdminScheduleDetails = (schedule: AdminChurchSchedule) => {
  selectedAdminSchedule.value = schedule;
  isAdminScheduleDetailsOpen.value = true;
};

const closeAdminScheduleDetails = () => {
  isAdminScheduleDetailsOpen.value = false;
  selectedAdminSchedule.value = null;
};

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) {
    pendingRemoveAdminUser.value = null;
    pendingDeleteChurch.value = null;
  }
};

const confirmDelete = async () => {
  if (pendingRemoveAdminUser.value) {
    await confirmRemoveAdminUser();
    return;
  }

  if (pendingDeleteChurch.value) {
    await confirmDeleteChurchAction();
  }
};

const handleDeleteChurch = (church: AdminChurch) => {
  deleteChurchError.value = "";
  pendingDeleteChurch.value = church;
};

const confirmDeleteChurchAction = async () => {
  if (!pendingDeleteChurch.value) return;

  deleteChurchError.value = "";
  isConfirmingDelete.value = true;
  const churchId = pendingDeleteChurch.value.id;

  try {
    const { error } = await deleteChurch(churchId);

    if (error) {
      deleteChurchError.value = error;
      return;
    }

    adminChurches.value = adminChurches.value.filter((church) => church.id !== churchId);
    if (selectedChurch.value?.id === churchId) {
      isChurchDetailsSheetOpen.value = false;
      selectedChurch.value = null;
    }
    pendingDeleteChurch.value = null;
  } finally {
    isConfirmingDelete.value = false;
  }
};

// ── Cargos (RBAC) ──────────────────────────────────────────────
const { can } = usePermissions();
const { getRoles, addMemberRole, removeMemberRole } = useChurchRoles();

const churchRoles = ref<ChurchRole[]>([]);
const isAssigningRole = ref(false);
const selectedMemberRoleId = ref<string | null>(null);

// Cargos que o membro ainda nao tem, para o seletor de atribuicao.
const assignableRolesFor = (member?: { roles?: { id: string }[] } | null) => {
  const assignedIds = new Set((member?.roles ?? []).map((role) => role.id));
  return churchRoles.value
    .filter((role) => !assignedIds.has(role.id))
    .map((role) => ({
      label:
        role.scope === "MINISTRY"
          ? `${role.name} · ${role.department?.name ?? "Ministério"}`
          : `${role.name} · Igreja`,
      value: role.id,
    }));
};

const loadRoles = async () => {
  const { data } = await getRoles();
  churchRoles.value = data ?? [];
};

// Espelha a nova lista de cargos do membro em todos os locais de estado.
const applyMemberRoles = (memberId: string, roles: MemberRole[]) => {
  members.value = members.value.map((m) =>
    m.id === memberId ? { ...m, roles } : m,
  );
  if (selectedAdminUser.value?.id === memberId) {
    selectedAdminUser.value = { ...selectedAdminUser.value, roles };
  }
  if (selectedChurch.value) {
    selectedChurch.value = {
      ...selectedChurch.value,
      users: selectedChurch.value.users.map((u) =>
        u.id === memberId ? { ...u, roles } : u,
      ),
    };
  }
};

const addMemberRoleById = async (memberId: string, roleId: string) => {
  isAssigningRole.value = true;
  try {
    const { data, error } = await addMemberRole(memberId, roleId);
    if (error || !data) return;
    applyMemberRoles(memberId, data.roles);
  } finally {
    isAssigningRole.value = false;
  }
};

const removeMemberRoleById = async (memberId: string, roleId: string) => {
  isAssigningRole.value = true;
  try {
    const { data, error } = await removeMemberRole(memberId, roleId);
    if (error || !data) return;
    applyMemberRoles(memberId, data.roles);
  } finally {
    isAssigningRole.value = false;
  }
};

const addRoleToSelected = async () => {
  if (!selectedAdminUser.value || !selectedMemberRoleId.value) return;
  if (!canAssignSelectedAdminUserRole.value) return;
  const roleId = selectedMemberRoleId.value;
  selectedMemberRoleId.value = null;
  await addMemberRoleById(selectedAdminUser.value.id, roleId);
};

const removeRoleFromSelected = async (roleId: string) => {
  if (!selectedAdminUser.value) return;
  await removeMemberRoleById(selectedAdminUser.value.id, roleId);
};

onMounted(async () => {
  await Promise.all([
    isPlatformAdmin.value ? loadPlatformChurches() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadChurchAdminData() : Promise.resolve(),
    loadAttendance(),
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.platform-admin-page {
  background:
    var(--app-color-background);
  max-width: 1180px;
  margin: 0 auto;
}

.admin-mode-shell {
  --church-accent: #B5472A;
}

.admin-mode-selector {
  display: flex;
  justify-content: center;
}

.admin-mode-toggle {
  width: min(100%, 560px);
  border: 1px solid rgba(181, 71, 42, 0.22);
  border-radius: 12px;
  background: #ffffff;
  padding: 4px;
}

.admin-mode-button {
  flex: 1 1 0;
  min-height: 44px;
  border-radius: 8px !important;
  color: #6B655C;
  font-weight: 800;
  letter-spacing: 0;
}

.admin-mode-button.v-btn--active {
  background: var(--church-accent, #B5472A) !important;
  color: #ffffff !important;
}

.platform-tabs :deep(.v-tab.v-tab--selected) {
  color: var(--church-accent, #B5472A) !important;
}

.platform-tabs :deep(.v-tabs-slider) {
  background: var(--church-accent, #B5472A) !important;
}

.platform-tab-panel {
  min-width: 0;
}

.platform-help-panel {
  display: grid;
  gap: 16px;
}

.platform-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.platform-kicker {
  color: var(--app-color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.platform-title {
  font-size: 1.75rem;
  line-height: 1.12;
}

.platform-subtitle {
  max-width: 620px;
}

.platform-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.platform-hero-mark {
  width: 54px;
  height: 54px;
  border: 1px solid var(--app-color-accent-tint, #F7E2D3);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: var(--app-color-border);
}

.platform-directory {
  min-width: 0;
}

.master-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.master-panel-card {
  border-radius: 8px !important;
  min-width: 0;
}

.master-panel-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-color-accent, #B5472A);
}

.master-panel-heading h2 {
  color: var(--app-color-text, #111827);
  font-size: 0.94rem;
  font-weight: 850;
  margin: 0;
}

.master-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.master-summary-grid div {
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  display: grid;
  gap: 4px;
  min-height: 64px;
  align-content: center;
  padding: 10px;
  border-color: var(--app-color-border);
}

.master-summary-grid strong {
  color: var(--app-color-text, #111827);
  font-size: 1.18rem;
  font-weight: 900;
  line-height: 1;
}

.master-summary-grid span {
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.72rem;
  font-weight: 750;
}

.master-ranking {
  display: grid;
  gap: 8px;
}

.master-ranking button {
  appearance: none;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  min-height: 42px;
  padding: 9px 10px;
  text-align: left;
  border-color: var(--app-color-border);
}

.master-ranking span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
  font-weight: 800;
}

.master-ranking strong {
  color: var(--app-color-accent, #B5472A);
  font-size: 0.82rem;
  font-weight: 900;
}

.admin-filter-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.directory-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.platform-loading,
.platform-empty {
  border-radius: 8px !important;
}

.platform-empty {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.church-directory-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.church-directory-card {
  appearance: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  min-height: 188px;
  padding: 16px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
  border-color: var(--app-color-border);
}

.church-directory-card:hover {
  border-color: var(--app-color-accent);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.church-directory-card:active {
  transform: scale(0.99);
}

.church-directory-card-active {
  border-color: var(--app-color-accent);
  box-shadow: 0 14px 32px rgba(240, 151, 90, 0.2);
}

.church-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.church-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(240, 151, 90, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-color-accent);
}

.church-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #14b8a6;
  box-shadow: 0 0 0 4px #ccfbf1;
}

.church-status-dot-muted {
  background: #9ca3af;
  box-shadow: 0 0 0 4px #f3f4f6;
}

.church-card-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.church-card-title {
  color: #111827;
  display: block;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.church-card-location {
  color: #6b7280;
  display: block;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.church-plan-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 4px;
}

.church-trial-note {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--app-color-text-muted);
}

.church-plan-edit {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: var(--app-color-text-muted);
  cursor: pointer;
}

.church-plan-edit:hover,
.church-plan-edit:focus-visible {
  background: var(--app-color-surface-soft);
  color: var(--app-color-text);
}

.church-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.church-metrics span {
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  min-height: 46px;
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  padding: 5px 6px;
  border-color: var(--app-color-border);
}

.church-metrics strong {
  color: var(--app-color-text);
  font-size: 0.875rem;
}

.church-open-action {
  color: var(--app-color-accent, #B5472A);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  font-weight: 800;
}

.church-details-surface,
.church-details-sheet {
  border-radius: 8px !important;
  overflow: hidden;
  background: var(--app-color-surface) !important;
}

.church-details-sheet {
  width: min(1040px, 100vw);
  max-height: 88vh;
  margin: 0 auto;
  border-radius: 8px 8px 0 0 !important;
}

.sheet-handle {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: #d1d5db;
  margin: 10px auto 2px;
}

.church-details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
}

.church-sheet-tabs-bar {
  padding: 0 18px 12px;
  border-bottom: 1px solid #eef2f7;
}

.church-sheet-tabs {
  min-height: 38px !important;
}

.church-sheet-plan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #f9fafb;
  padding: 14px 16px;
}

.danger-zone {
  margin-top: 20px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  padding: 14px 16px;
}

.danger-zone-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.church-details-body {
  max-height: min(680px, 78vh);
  overflow-y: auto;
  padding: 18px;
}

.church-details-content {
  display: grid;
  gap: 16px;
}

.church-sheet-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.sheet-summary-tile {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "icon value"
    "icon label";
  align-items: center;
  column-gap: 9px;
  min-height: 68px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f9fafb;
  padding: 12px;
}

.sheet-summary-tile svg {
  grid-area: icon;
  color: var(--app-color-accent, #B5472A);
}

.sheet-summary-tile span {
  grid-area: value;
  color: var(--app-color-text, #111827);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-summary-tile small {
  grid-area: label;
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.75rem;
  font-weight: 700;
}

.church-detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.detail-tile {
  min-width: 0;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f9fafb;
  padding: 12px;
}

.detail-tile p {
  overflow-wrap: anywhere;
}

.church-detail-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.detail-section {
  min-width: 0;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}

.detail-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.detail-heading-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.detail-list {
  display: grid;
  gap: 8px;
}

.schedule-row {
  align-items: start;
}

.detail-empty {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 14px;
  text-align: center;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.church-admin-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.church-admin-section {
  min-width: 0;
}

.admin-tabs-bar {
  background: var(--app-color-surface);
  border-radius: 14px;
  border: 1px solid var(--app-color-border, #e5e7eb);
  padding: 4px;
  overflow: hidden;
  border-color: var(--app-color-border);
}

.admin-tabs {
  min-height: 40px !important;
}

.admin-tab {
  font-size: 0.82rem !important;
  min-height: 36px !important;
  min-width: 0 !important;
  padding: 0 14px !important;
  border-radius: 10px;
  letter-spacing: 0;
}

.pastoral-report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.report-kpi-card {
  display: grid;
  gap: 6px;
  border-radius: 8px !important;
}

.report-kpi-card span {
  color: #111827;
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1;
}

.report-kpi-card small {
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 750;
}

.pastoral-report-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.report-panel {
  border-radius: 8px !important;
}

.report-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-color-accent);
}

.report-panel-title h3 {
  margin: 0;
  color: #1f2937;
  font-size: 0.92rem;
  font-weight: 850;
}

.report-bars,
.leadership-list {
  display: grid;
  gap: 12px;
}

.report-row {
  display: grid;
  gap: 7px;
}

.report-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #374151;
  font-size: 0.82rem;
}

.report-row-top strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f3f4f6;
}

.report-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--app-color-accent, #B5472A);
}

.report-row small,
.leadership-row small {
  color: #6b7280;
  font-size: 0.74rem;
  font-weight: 650;
}

.leadership-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  background: var(--app-color-surface-soft);
  border-color: var(--app-color-border);
}

.leadership-summary div {
  display: grid;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px;
}

.leadership-summary strong {
  color: #111827;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.leadership-summary span {
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 750;
}

.leadership-row {
  display: grid;
  gap: 3px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.leadership-row span {
  color: #111827;
  font-size: 0.84rem;
  font-weight: 800;
}

.attendance-totals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.attendance-totals div {
  display: grid;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px;
  border-color: var(--app-color-border);
}

.attendance-totals strong {
  color: #111827;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.attendance-totals span {
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 750;
}

.attendance-list {
  display: grid;
  gap: 8px;
}

.attendance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.attendance-row strong {
  display: block;
  color: #111827;
  font-size: 0.84rem;
  font-weight: 800;
}

.attendance-row small {
  color: #6b7280;
  font-size: 0.74rem;
  font-weight: 700;
}

.attendance-counts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.attendance-counts span {
  color: #374151;
  font-size: 0.76rem;
  font-weight: 700;
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

.member-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.member-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.member-avatar {
  align-self: start;
}

.member-copy {
  min-width: 0;
}

.member-copy h3,
.member-copy p {
  overflow-wrap: anywhere;
}

.member-badges {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.message-template-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.member-card:active {
  transform: scale(0.99);
}


/* Linha de select + botão de atribuir cargo: quebra para 2 linhas em telas
   estreitas em vez de forçar o select a ficar espremido ou vazar da tela. */
.assign-role-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assign-role-select {
  flex: 1 1 200px;
  min-width: 0;
}

/* --- Tratamento editorial das telas de cadastro (mesma cara da landing) --- */
.editorial-surface {
  --e-paper: #FBF8F3;
  --e-ink: #221F1A;
  --e-ink-soft: #6B655C;
  --e-line: #E4DFD5;
  --e-card: #FFFFFF;
  background: var(--e-paper);
  border: 1px solid var(--e-line);
  border-radius: 20px;
  color: var(--e-ink);
  padding: 26px;
}

:global(.v-theme--dark) .editorial-surface {
  --e-paper: #17140F;
  --e-ink: #F3EFE6;
  --e-ink-soft: #B9B0A2;
  --e-line: #2C2820;
  --e-card: #201C16;
}

.editorial-surface :deep(.section-heading h2),
.editorial-surface :deep(h2.text-subtitle-1) {
  color: var(--e-ink);
  font-family: "Fraunces", serif;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 650;
  letter-spacing: 0;
}

.editorial-surface :deep(h3.text-subtitle-2) {
  color: var(--e-ink);
  font-family: "Fraunces", serif;
  font-size: 1.25rem;
  font-weight: 650;
  letter-spacing: 0;
}

.editorial-surface :deep(.text-grey-darken-4) {
  color: var(--e-ink) !important;
}

.editorial-surface :deep(.text-caption),
.editorial-surface :deep(.text-grey-darken-1) {
  color: var(--e-ink-soft) !important;
}

/* Cards viram "papel" com borda fina e o realce da cor da igreja */
.editorial-surface :deep(.v-card.bg-white),
.editorial-surface :deep(.v-card.invite-code-card) {
  background: var(--e-card) !important;
  border: 1px solid var(--e-line) !important;
  border-left: 3px solid var(--church-accent) !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}

/* Botoes, campos e realces adotam a cor da igreja no lugar do roxo */
.editorial-surface :deep(.bg-purple-darken-3) {
  background-color: var(--church-accent) !important;
  border-color: var(--church-accent) !important;
}

.editorial-surface :deep(.text-purple-darken-3) {
  color: var(--church-accent) !important;
  caret-color: var(--church-accent) !important;
}

.editorial-surface :deep(.content-admin-row) {
  border-color: var(--e-line) !important;
}

.public-church-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 180px);
  gap: 12px;
}

.public-url-preview {
  border: 1px dashed var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-background);
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 750;
  overflow-wrap: anywhere;
  padding: 12px;
}
.clickable-row:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.member-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.admin-row {
  min-height: 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 10px 12px;
}

.user-row,
.clickable-row {
  cursor: pointer;
}

.permission-empty {
  min-height: 320px;
}

.member-permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (min-width: 520px) {
  .member-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .church-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .church-sheet-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .church-directory-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .church-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .master-panel {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }

  .admin-filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pastoral-report-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pastoral-report-layout {
    grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  }

  .church-directory-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .church-detail-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .church-details-sheet {
    max-height: 82vh;
  }
}

@media (max-width: 520px) {
  .public-church-grid {
    grid-template-columns: 1fr;
  }

  .platform-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .platform-hero {
    align-items: start;
  }

  .platform-title {
    font-size: 1.45rem;
  }

  .platform-hero-mark {
    width: 46px;
    height: 46px;
  }

  .directory-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .church-details-header,
  .church-details-body {
    padding-right: 14px;
    padding-left: 14px;
  }

  .detail-section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-heading-actions {
    justify-content: flex-start;
  }

  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .v-btn {
    width: 100%;
  }

  .member-card {
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: start;
    padding: 14px !important;
  }

  .member-avatar {
    width: 40px !important;
    height: 40px !important;
  }

  .member-badges {
    grid-column: 2;
    justify-content: flex-start;
    margin-top: 2px;
  }

  .member-badges :deep(.v-chip) {
    max-width: 100%;
  }

  .member-permission-row {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Dark mode ── */
</style>
