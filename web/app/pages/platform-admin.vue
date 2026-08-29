<template>
  <div v-if="isPlatformAdmin" class="platform-admin-page pa-4 min-vh-100 pb-20">
    <div class="platform-hero mb-6">
      <div class="min-w-0">
        <p class="platform-kicker mb-2">Admin master</p>
        <div class="app-help-title-row">
          <h1 class="app-page-title platform-title text-grey-darken-4 mb-2">
            Visão geral da plataforma
          </h1>
          <div class="platform-hero-actions">
            <v-btn
              v-if="isPlatformAdmin && canAccessChurchAdmin"
              variant="text"
              color="indigo-darken-2"
              size="small"
              class="text-none dual-role-switch"
              @click="router.push('/admin')"
            >
              Administração da igreja
            </v-btn>
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
        <v-tab value="leads" class="text-none font-weight-medium admin-tab">Leads comerciais</v-tab>
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

    <section v-show="activePlatformTab === 'leads'" class="platform-tab-panel commercial-leads-panel">
      <div class="directory-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
            Leads comerciais
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Acompanhe o relacionamento com igrejas e parceiros sem misturar dados de nenhuma igreja cliente.
          </p>
        </div>
        <div class="d-flex align-center ga-2 flex-wrap">
          <v-btn
            size="small"
            color="indigo-darken-2"
            variant="tonal"
            class="text-none"
            @click="openCommercialLeadForm"
          >
            <v-icon start size="17">mdi-account-plus-outline</v-icon>
            Adicionar lead
          </v-btn>
          <v-chip size="small" color="indigo-darken-2" variant="tonal">
            {{ commercialLeadTotal }} leads
          </v-chip>
        </div>
      </div>

      <div class="admin-filter-bar mb-4 commercial-lead-filters">
        <v-select
          v-model="commercialLeadFunnelFilter"
          label="Funil"
          :items="commercialLeadFunnelOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-filter-outline"
          variant="outlined"
          density="compact"
          color="indigo-darken-2"
          bg-color="white"
          hide-details
          @update:model-value="loadCommercialLeads"
        />
        <v-select
          v-model="commercialLeadStageFilter"
          label="Etapa"
          :items="commercialLeadStageFilterOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-timeline-outline"
          variant="outlined"
          density="compact"
          color="indigo-darken-2"
          bg-color="white"
          hide-details
          @update:model-value="loadCommercialLeads"
        />
        <v-btn
          variant="tonal"
          color="indigo-darken-2"
          class="text-none"
          :loading="isLoadingCommercialLeads"
          @click="loadCommercialLeads"
        >
          Atualizar
        </v-btn>
      </div>

      <v-alert
        v-if="commercialLeadsError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ commercialLeadsError }}
      </v-alert>

      <v-alert
        v-if="commercialLeadNotice"
        type="success"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ commercialLeadNotice }}
      </v-alert>

      <v-card
        v-if="isLoadingCommercialLeads"
        class="rounded-lg pa-4 elevation-0 bg-white border-subtle"
      >
        <v-skeleton-loader type="list-item-three-line@4" />
      </v-card>

      <v-card
        v-else-if="filteredCommercialLeads.length === 0"
        class="platform-empty rounded-lg pa-6 elevation-0 bg-white border-subtle"
      >
        <Users size="34" color="#9CA3AF" class="mb-3" />
        <p class="text-body-2 text-grey-darken-1 font-weight-medium mb-0 text-center">
          Nenhum lead encontrado com os filtros atuais.
        </p>
        <p class="text-caption text-grey-darken-1 mb-0 text-center mt-1">
          Use “Adicionar lead” para incluir um contato público revisado no funil.
        </p>
      </v-card>

      <div v-else class="commercial-lead-list">
        <button
          v-for="lead in filteredCommercialLeads"
          :key="lead.id"
          type="button"
          class="commercial-lead-card"
          @click="selectCommercialLead(lead.id)"
        >
          <span class="commercial-lead-card-top">
            <span class="commercial-lead-avatar">
              <Users size="19" :color="accentColor" />
            </span>
            <span class="commercial-lead-card-copy">
              <strong>{{ commercialLeadName(lead) }}</strong>
            <small>{{ lead.instagramHandle ? `@${lead.instagramHandle}` : "Perfil público não informado" }}</small>
            </span>
            <v-chip size="x-small" :color="commercialLeadStageColor(lead.stage)" variant="tonal">
              {{ commercialLeadStageLabel(lead.stage) }}
            </v-chip>
          </span>
          <span class="commercial-lead-card-meta">
            <span>{{ lead.funnel === "CUSTOMER" ? "Igreja" : "Afiliado" }}</span>
            <span>Score {{ lead.score }}</span>
            <span>{{ lead._count?.events || 0 }} eventos</span>
            <span>{{ formatDate(lead.updatedAt) }}</span>
          </span>
          <span v-if="lead.doNotContact" class="commercial-lead-optout">
            Não contatar
          </span>
        </button>
      </div>
    </section>

    <UtilsResponsiveOverlay v-model="isCommercialLeadFormOpen" max-width="620">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="44" class="mr-3">
              <Users size="20" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                Adicionar lead comercial
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Inclua apenas contatos públicos revisados para acompanhamento.
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeCommercialLeadForm">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="saveCommercialLead">
          <v-select
            v-model="commercialLeadForm.funnel"
            label="Funil"
            :items="commercialLeadFunnelOptions.slice(1)"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-filter-outline"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="admin-input mb-4"
            hide-details="auto"
            :disabled="isCreatingCommercialLead"
          />

          <v-text-field
            v-model="commercialLeadForm.organizationName"
            label="Nome da igreja ou parceiro"
            prepend-inner-icon="mdi-domain"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />

          <v-text-field
            v-model="commercialLeadForm.instagramHandle"
            label="Identificador do perfil"
            hint="Opcional; pode informar com ou sem @."
            persistent-hint
            prepend-inner-icon="mdi-account-circle-outline"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />

          <v-text-field
            v-model="commercialLeadForm.publicProfileUrl"
            label="Link público do perfil ou Google Maps"
            hint="Obrigatório se o identificador do perfil não for informado."
            persistent-hint
            prepend-inner-icon="mdi-link-variant"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />

          <div class="d-flex ga-3">
            <v-text-field
              v-model="commercialLeadForm.city"
              label="Cidade"
              prepend-inner-icon="mdi-map-marker-outline"
              variant="outlined"
              density="comfortable"
              color="indigo-darken-2"
              class="admin-input mb-4"
              hide-details="auto"
              autocomplete="off"
              :disabled="isCreatingCommercialLead"
            />
            <v-text-field
              v-model="commercialLeadForm.state"
              label="UF"
              variant="outlined"
              density="comfortable"
              color="indigo-darken-2"
              class="admin-input mb-4"
              hide-details="auto"
              maxlength="2"
              autocomplete="off"
              :disabled="isCreatingCommercialLead"
            />
          </div>

          <v-text-field
            v-model="commercialLeadForm.website"
            label="Site público"
            prepend-inner-icon="mdi-web"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />

          <v-text-field
            v-model="commercialLeadForm.source"
            label="Fonte"
            hint="Ex.: google_places_reviewed, indicação ou pesquisa manual."
            persistent-hint
            prepend-inner-icon="mdi-source-branch"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />

          <v-alert
            v-if="commercialLeadFormError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ commercialLeadFormError }}
          </v-alert>

          <div class="admin-dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingCommercialLead"
              @click="closeCommercialLeadForm"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="indigo-darken-2"
              class="text-none font-weight-bold"
              :loading="isCreatingCommercialLead"
              :disabled="isCreatingCommercialLead"
            >
              Salvar lead
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isCommercialLeadDetailsOpen" max-width="620">
      <v-card
        v-if="isLoadingCommercialLeadDetails"
        class="rounded-xl pa-6 bg-white"
        elevation="0"
      >
        <v-skeleton-loader type="article, list-item-three-line@3" />
      </v-card>
      <v-card
        v-else-if="selectedCommercialLead"
        class="rounded-xl pa-6 bg-white commercial-lead-details"
        elevation="0"
      >
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="48" class="mr-3">
              <Users size="22" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ commercialLeadName(selectedCommercialLead) }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                {{ selectedCommercialLead.instagramHandle ? `@${selectedCommercialLead.instagramHandle}` : "Lead comercial" }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isCommercialLeadDetailsOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-alert
          v-if="selectedCommercialLead.doNotContact"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          Este lead está marcado para não receber contato. O bloqueio é permanente.
        </v-alert>

        <div class="commercial-lead-detail-grid mb-5">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Funil</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedCommercialLead.funnel === "CUSTOMER" ? "Igrejas" : "Afiliados" }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Score</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedCommercialLead.score }}/100
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Localização</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ commercialLeadLocation(selectedCommercialLead) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Criado em</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ formatDate(selectedCommercialLead.createdAt) }}
            </p>
          </div>
        </div>

        <div class="commercial-lead-links mb-5">
          <a v-if="selectedCommercialLead.publicProfileUrl" :href="selectedCommercialLead.publicProfileUrl" target="_blank" rel="noreferrer">
            Abrir perfil público
          </a>
          <a v-if="selectedCommercialLead.website" :href="selectedCommercialLead.website" target="_blank" rel="noreferrer">
            Abrir site
          </a>
          <a v-if="selectedCommercialLead.signupUrl" :href="selectedCommercialLead.signupUrl" target="_blank" rel="noreferrer">
            Abrir link de cadastro atribuído
          </a>
          <span v-if="!selectedCommercialLead.publicProfileUrl && !selectedCommercialLead.website" class="text-caption text-grey-darken-1">
            Nenhum link disponível.
          </span>
        </div>

        <v-divider class="mb-4" />

        <div class="mb-5">
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">Etapa do relacionamento</h3>
          <p class="text-caption text-grey-darken-1 mb-3">
            Cada alteração é validada pelo funil e fica registrada no histórico.
          </p>
          <div class="d-flex align-center ga-2">
            <v-select
              v-model="selectedCommercialLeadStage"
              :items="commercialLeadStageOptionsForSelected"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              color="indigo-darken-2"
              hide-details
              :disabled="selectedCommercialLead.doNotContact || isSavingCommercialLeadStage"
            />
            <v-btn
              color="indigo-darken-2"
              variant="tonal"
              class="text-none"
              :loading="isSavingCommercialLeadStage"
              :disabled="selectedCommercialLead.doNotContact || selectedCommercialLeadStage === selectedCommercialLead.stage"
              @click="saveCommercialLeadStage"
            >
              Salvar
            </v-btn>
          </div>
          <v-alert v-if="commercialLeadStageError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ commercialLeadStageError }}
          </v-alert>
        </div>

        <div>
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">Histórico</h3>
          <div v-if="selectedCommercialLead.events.length" class="commercial-lead-timeline">
            <div v-for="event in [...selectedCommercialLead.events].reverse()" :key="event.id" class="commercial-lead-event">
              <span class="commercial-lead-event-dot" />
              <div>
                <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
                  {{ commercialLeadEventLabel(event) }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ formatDate(event.createdAt) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-caption text-grey-darken-1 mb-0">Nenhum evento registrado.</p>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <section v-show="activePlatformTab === 'videos'" class="platform-tab-panel platform-help-panel">
      <AdminHelpVideos />
    </section>

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

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada apenas para administradores da plataforma.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { Building, Calendar, UserCheck, Users, Church, ArrowRight, BarChart3, Pencil, Trash2 } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useThemeMode } from "../../composables/useThemeMode";
import {
  useAdmin,
  type AdminChurch,
  type AdminChurchDepartment,
  type AdminChurchDetails,
  type AdminChurchSchedule,
  type AdminChurchUser,
  type CommercialLead,
  type CommercialLeadDetails,
  type CommercialLeadStage,
} from "../../composables/useAdmin";
import {
  useChurchRoles,
  type ChurchRole,
} from "../../composables/useChurchRoles";
import { usePermissions } from "../../composables/usePermissions";
import { PLAN_LABELS, type Plan } from "../../composables/usePlan";

const router = useRouter();

const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const purpleAccent = computed(() => isDark.value ? "#f0975a" : "#C2542C");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");
const avatarBgPurple = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

const { can } = usePermissions();
const {
  getChurches,
  getChurchById,
  updateChurchUserByAdmin,
  resetChurchUserPasswordByAdmin,
  removeChurchUserByAdmin,
  deleteChurch,
  getCommercialLeads,
  createCommercialLead,
  getCommercialLeadById,
  updateCommercialLeadStage,
} = useAdmin();
const { getRoles, addMemberRole, removeMemberRole } = useChurchRoles();

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

type PlatformAdminTab = "geral" | "igrejas" | "leads" | "videos";

const activePlatformTab = ref<PlatformAdminTab>("geral");

const selectedChurch = ref<AdminChurchDetails | null>(null);
const platformError = ref("");
const isLoadingPlatform = ref(false);
const isLoadingChurch = ref(false);
const isAdminUserDetailsOpen = ref(false);
const isAdminDepartmentDetailsOpen = ref(false);
const isAdminScheduleDetailsOpen = ref(false);
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
const commercialLeads = ref<CommercialLead[]>([]);
const commercialLeadTotal = ref(0);
const commercialLeadFunnelFilter = ref<"ALL" | "CUSTOMER" | "AFFILIATE">("ALL");
const commercialLeadStageFilter = ref<"ALL" | CommercialLeadStage>("ALL");
const isLoadingCommercialLeads = ref(false);
const commercialLeadsError = ref("");
const commercialLeadNotice = ref("");
const isCommercialLeadFormOpen = ref(false);
const isCreatingCommercialLead = ref(false);
const commercialLeadFormError = ref("");
const commercialLeadForm = reactive({
  funnel: "CUSTOMER" as "CUSTOMER" | "AFFILIATE",
  organizationName: "",
  instagramHandle: "",
  publicProfileUrl: "",
  city: "",
  state: "",
  website: "",
  source: "manual_review",
});
const selectedCommercialLead = ref<CommercialLeadDetails | null>(null);
const isCommercialLeadDetailsOpen = ref(false);
const isLoadingCommercialLeadDetails = ref(false);
const selectedCommercialLeadStage = ref<CommercialLeadStage | null>(null);
const isSavingCommercialLeadStage = ref(false);
const commercialLeadStageError = ref("");

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

const commercialLeadFunnelOptions = [
  { label: "Todos os funis", value: "ALL" },
  { label: "Igrejas", value: "CUSTOMER" },
  { label: "Afiliados", value: "AFFILIATE" },
];

const commercialLeadStageLabels: Record<CommercialLeadStage, string> = {
  DISCOVERED: "Descoberto",
  QUALIFIED: "Qualificado",
  FIRST_CONTACT_PENDING: "Contato pendente",
  FIRST_CONTACT_SENT: "Primeiro contato enviado",
  AWAITING_REPLY: "Aguardando resposta",
  CONVERSATION_ACTIVE: "Conversa ativa",
  INTERESTED: "Interessado",
  WHATSAPP_PENDING: "WhatsApp pendente",
  SIGNED_UP: "Cadastrado",
  ACTIVATED: "Ativado",
  IN_GROUP: "No grupo",
  ACTIVE: "Ativo",
  NOT_INTERESTED: "Sem interesse",
  DO_NOT_CONTACT: "Não contatar",
  PAUSED: "Pausado",
};

const commercialLeadStageFilterOptions = [
  { label: "Todas as etapas", value: "ALL" },
  ...Object.entries(commercialLeadStageLabels).map(([value, label]) => ({ label, value })),
];

const commercialLeadTransitions: Record<CommercialLeadStage, CommercialLeadStage[]> = {
  DISCOVERED: ["QUALIFIED", "PAUSED"],
  QUALIFIED: ["FIRST_CONTACT_PENDING", "PAUSED"],
  FIRST_CONTACT_PENDING: ["FIRST_CONTACT_SENT", "PAUSED"],
  FIRST_CONTACT_SENT: ["AWAITING_REPLY", "PAUSED"],
  AWAITING_REPLY: ["CONVERSATION_ACTIVE", "NOT_INTERESTED", "PAUSED"],
  CONVERSATION_ACTIVE: ["INTERESTED", "NOT_INTERESTED", "PAUSED"],
  INTERESTED: ["WHATSAPP_PENDING", "IN_GROUP", "NOT_INTERESTED", "PAUSED"],
  WHATSAPP_PENDING: ["SIGNED_UP", "NOT_INTERESTED", "PAUSED"],
  SIGNED_UP: ["ACTIVATED", "PAUSED"],
  ACTIVATED: ["PAUSED"],
  IN_GROUP: ["ACTIVE", "NOT_INTERESTED", "PAUSED"],
  ACTIVE: ["PAUSED"],
  NOT_INTERESTED: [],
  DO_NOT_CONTACT: [],
  PAUSED: ["DISCOVERED"],
};

const filteredCommercialLeads = computed(() => commercialLeads.value);

const commercialLeadStageOptionsForSelected = computed(() => {
  const lead = selectedCommercialLead.value;
  if (!lead) return [];

  const stages = [
    lead.stage,
    ...(commercialLeadTransitions[lead.stage] || []),
    ...(lead.stage === "DO_NOT_CONTACT" ? [] : ["DO_NOT_CONTACT" as CommercialLeadStage]),
  ];

  return [...new Set(stages)].map((value) => ({
    label: commercialLeadStageLabels[value],
    value,
  }));
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

const commercialLeadStageLabel = (stage: CommercialLeadStage) =>
  commercialLeadStageLabels[stage] || stage;

const commercialLeadStageColor = (stage: CommercialLeadStage) => {
  if (stage === "DO_NOT_CONTACT" || stage === "NOT_INTERESTED") return "red-darken-2";
  if (stage === "ACTIVATED" || stage === "ACTIVE") return "teal-darken-2";
  if (stage === "PAUSED") return "grey-darken-1";
  if (stage === "INTERESTED" || stage === "WHATSAPP_PENDING") return "amber-darken-3";
  return "indigo-darken-2";
};

const commercialLeadName = (lead: CommercialLead) =>
  lead.organizationName || lead.contactName || lead.instagramHandle || "Lead sem nome";

const commercialLeadLocation = (lead: CommercialLead) => {
  const location = [lead.city, lead.state].filter(Boolean).join(" - ");
  return location || "Não informada";
};

const commercialLeadEventLabel = (event: { type: string; fromStage?: CommercialLeadStage | null; toStage?: CommercialLeadStage | null }) => {
  if (event.type === "DISCOVERED") return "Lead descoberto";
  if (event.type === "OPTED_OUT") return "Contato bloqueado pelo lead";
  if (event.fromStage && event.toStage) {
    return `${commercialLeadStageLabel(event.fromStage)} → ${commercialLeadStageLabel(event.toStage)}`;
  }
  return event.type;
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

const resetCommercialLeadForm = () => {
  commercialLeadForm.funnel = "CUSTOMER";
  commercialLeadForm.organizationName = "";
  commercialLeadForm.instagramHandle = "";
  commercialLeadForm.publicProfileUrl = "";
  commercialLeadForm.city = "";
  commercialLeadForm.state = "";
  commercialLeadForm.website = "";
  commercialLeadForm.source = "manual_review";
};

const openCommercialLeadForm = () => {
  commercialLeadFormError.value = "";
  commercialLeadNotice.value = "";
  resetCommercialLeadForm();
  isCommercialLeadFormOpen.value = true;
};

const closeCommercialLeadForm = () => {
  if (isCreatingCommercialLead.value) return;
  isCommercialLeadFormOpen.value = false;
};

const saveCommercialLead = async () => {
  commercialLeadFormError.value = "";
  commercialLeadNotice.value = "";
  isCreatingCommercialLead.value = true;

  try {
    const { data, error } = await createCommercialLead({
      funnel: commercialLeadForm.funnel,
      organizationName: commercialLeadForm.organizationName || undefined,
      instagramHandle: commercialLeadForm.instagramHandle || undefined,
      publicProfileUrl: commercialLeadForm.publicProfileUrl || undefined,
      city: commercialLeadForm.city || undefined,
      state: commercialLeadForm.state || undefined,
      website: commercialLeadForm.website || undefined,
      source: commercialLeadForm.source || undefined,
    });

    if (error || !data?.lead) {
      commercialLeadFormError.value = error || "Não foi possível salvar o lead.";
      return;
    }

    isCommercialLeadFormOpen.value = false;
    commercialLeadNotice.value = data.created
      ? "Lead adicionado ao funil comercial."
      : "Esse lead já estava cadastrado; abrimos o registro existente.";
    resetCommercialLeadForm();
    await loadCommercialLeads();
    await selectCommercialLead(data.lead.id);
  } finally {
    isCreatingCommercialLead.value = false;
  }
};

const loadCommercialLeads = async () => {
  commercialLeadsError.value = "";
  isLoadingCommercialLeads.value = true;

  try {
    const { data, error } = await getCommercialLeads({
      funnel:
        commercialLeadFunnelFilter.value === "ALL"
          ? undefined
          : commercialLeadFunnelFilter.value,
      stage:
        commercialLeadStageFilter.value === "ALL"
          ? undefined
          : commercialLeadStageFilter.value,
      includeDoNotContact: true,
      limit: 250,
    });

    if (error) {
      commercialLeadsError.value = error;
      commercialLeads.value = [];
      commercialLeadTotal.value = 0;
      return;
    }

    commercialLeads.value = data?.items ?? [];
    commercialLeadTotal.value = data?.total ?? commercialLeads.value.length;
  } finally {
    isLoadingCommercialLeads.value = false;
  }
};

const selectCommercialLead = async (id: string) => {
  commercialLeadsError.value = "";
  commercialLeadStageError.value = "";
  selectedCommercialLead.value = null;
  selectedCommercialLeadStage.value = null;
  isLoadingCommercialLeadDetails.value = true;
  isCommercialLeadDetailsOpen.value = true;

  try {
    const { data, error } = await getCommercialLeadById(id);
    if (error || !data) {
      commercialLeadsError.value = error || "Não foi possível carregar o lead.";
      isCommercialLeadDetailsOpen.value = false;
      return;
    }

    selectedCommercialLead.value = data;
    selectedCommercialLeadStage.value = data.stage;
  } finally {
    isLoadingCommercialLeadDetails.value = false;
  }
};

const saveCommercialLeadStage = async () => {
  if (!selectedCommercialLead.value || !selectedCommercialLeadStage.value) return;
  if (selectedCommercialLeadStage.value === selectedCommercialLead.value.stage) return;

  commercialLeadStageError.value = "";
  isSavingCommercialLeadStage.value = true;

  try {
    const { data, error } = await updateCommercialLeadStage(
      selectedCommercialLead.value.id,
      selectedCommercialLeadStage.value,
    );

    if (error || !data) {
      commercialLeadStageError.value = error || "Não foi possível atualizar a etapa.";
      selectedCommercialLeadStage.value = selectedCommercialLead.value.stage;
      return;
    }

    selectedCommercialLead.value = {
      ...selectedCommercialLead.value,
      ...data,
    };
    commercialLeads.value = commercialLeads.value.map((lead) =>
      lead.id === data.id ? { ...lead, ...data } : lead,
    );
  } finally {
    isSavingCommercialLeadStage.value = false;
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
  isChurchDetailsSheetOpen.value = true;

  try {
    const { data, error } = await getChurchById(id);

    if (error || !data) {
      platformError.value = error || "Não foi possível carregar a igreja.";
      isChurchDetailsSheetOpen.value = false;
      return;
    }

    selectedChurch.value = data;
  } finally {
    isLoadingChurch.value = false;
  }
};

const closeChurchDetails = () => {
  if (isChurchDetailsSheetOpen.value) return;

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

// Espelha a nova lista de cargos do membro nos locais de estado deste componente.
const applyMemberRoles = (memberId: string, roles: MemberRole[]) => {
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
  if (isPlatformAdmin.value) {
    await Promise.all([loadPlatformChurches(), loadRoles(), loadCommercialLeads()]);
  }
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

.dual-role-switch {
  flex-shrink: 0;
}

.platform-admin-page {
  background:
    var(--app-color-background);
  max-width: 1180px;
  margin: 0 auto;
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

.commercial-leads-panel {
  min-width: 0;
}

.commercial-lead-list {
  display: grid;
  gap: 10px;
}

.commercial-lead-card {
  appearance: none;
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  gap: 10px;
  padding: 14px;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.commercial-lead-card:hover {
  border-color: var(--app-color-accent);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.commercial-lead-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.28);
  outline-offset: 2px;
}

.commercial-lead-card-top,
.commercial-lead-card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.commercial-lead-card-top {
  justify-content: space-between;
}

.commercial-lead-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(240, 151, 90, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.commercial-lead-card-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.commercial-lead-card-copy strong,
.commercial-lead-card-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commercial-lead-card-copy strong {
  color: var(--app-color-text);
  font-size: 0.9rem;
}

.commercial-lead-card-copy small,
.commercial-lead-card-meta,
.commercial-lead-optout {
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.75rem;
}

.commercial-lead-card-meta {
  flex-wrap: wrap;
  justify-content: flex-start;
  padding-left: 52px;
}

.commercial-lead-card-meta span + span::before {
  content: "·";
  margin-right: 10px;
}

.commercial-lead-optout {
  color: #b91c1c;
  font-weight: 700;
  padding-left: 52px;
}

.commercial-lead-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.commercial-lead-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.commercial-lead-links a {
  color: var(--app-color-accent);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
}

.commercial-lead-links a:hover {
  text-decoration: underline;
}

.commercial-lead-timeline {
  display: grid;
  gap: 12px;
  border-left: 2px solid var(--app-color-border, #e5e7eb);
  margin-left: 5px;
  padding-left: 16px;
}

.commercial-lead-message-list {
  display: grid;
  gap: 10px;
}

.commercial-lead-message {
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  background: var(--app-color-surface-soft, #fafafa);
  padding: 12px 14px;
}

.commercial-lead-event {
  position: relative;
}

.commercial-lead-event-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--app-color-accent);
  left: -22px;
  top: 5px;
  box-shadow: 0 0 0 3px var(--app-color-surface);
}

.user-row,
.clickable-row {
  cursor: pointer;
}

.permission-empty {
  min-height: 320px;
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

  .commercial-lead-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .master-panel {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }

  .admin-filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .church-directory-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .church-details-sheet {
    max-height: 82vh;
  }
}

@media (max-width: 520px) {
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
}

@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
