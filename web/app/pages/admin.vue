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
            <UtilsPageHelpButton title="Admin master" :items="platformAdminHelpItems" />
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

    <div v-if="canAccessChurchAdmin" class="platform-switchbar mb-6">
      <div class="min-w-0">
        <strong>Administração pastoral disponível</strong>
        <span>Veja também a mesma área operacional usada pelos pastores da sua igreja.</span>
      </div>
      <v-btn
        variant="tonal"
        color="indigo-darken-2"
        class="text-none"
        href="#pastoral-admin"
      >
        Abrir minha igreja
      </v-btn>
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

        <div class="church-details-body">
          <v-skeleton-loader
            v-if="isLoadingChurch"
            type="article, list-item-three-line@3"
          />

          <div v-else-if="selectedChurch" class="church-details-content">
            <div class="church-sheet-summary">
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

            <div class="church-detail-grid">
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

            <section class="detail-section">
              <div class="detail-section-heading">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                  Usuários
                </h3>
                <div class="detail-heading-actions">
                  <v-chip size="small" color="indigo-darken-2" variant="tonal">
                    {{ selectedChurch.users.length }}
                  </v-chip>
                  <v-btn
                    v-if="selectedChurch.users.length > churchPreviewLimit"
                    variant="text"
                    color="primary"
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

            <section class="detail-section">
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
                    color="primary"
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

            <section class="detail-section">
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
                    color="primary"
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
  </div>

  <div
    v-if="canAccessChurchAdmin"
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
          <UtilsPageHelpButton title="Administração da igreja" :items="churchAdminHelpItems" />
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
        <v-tab value="geral" class="text-none font-weight-medium admin-tab">Geral</v-tab>
        <v-tab value="membros" class="text-none font-weight-medium admin-tab">Membros</v-tab>
        <v-tab value="ministerios" class="text-none font-weight-medium admin-tab">Ministérios</v-tab>
        <v-tab v-if="isChurchWideManager" value="conteudo" class="text-none font-weight-medium admin-tab">Conteúdo</v-tab>
        <v-tab v-if="isChurchWideManager" value="relatorios" class="text-none font-weight-medium admin-tab">Relatórios</v-tab>
        <v-tab v-if="isChurchWideManager" value="cargos" class="text-none font-weight-medium admin-tab">Cargos</v-tab>
        <v-tab v-if="isChurchWideManager" value="videos" class="text-none font-weight-medium admin-tab">Vídeos</v-tab>
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

    <section v-show="isChurchWideManager && activeAdminTab === 'conteudo'" class="church-admin-section mb-8">
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
            v-if="verseError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ verseError }}
          </v-alert>

          <v-textarea
            v-model="verseForm.text"
            label="Texto"
            variant="outlined"
            color="purple-darken-3"
            auto-grow
            rows="2"
            class="mb-3"
            hide-details="auto"
          />
          <v-text-field
            v-model="verseForm.reference"
            label="Referência"
            variant="outlined"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
          />
          <v-textarea
            v-model="verseForm.commentary"
            label="Comentário"
            variant="outlined"
            color="purple-darken-3"
            auto-grow
            rows="2"
            class="mb-3"
            hide-details="auto"
          />
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
            v-if="announcementError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ announcementError }}
          </v-alert>

          <v-text-field
            v-model="announcementForm.title"
            label="Título"
            variant="outlined"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
          />
          <v-textarea
            v-model="announcementForm.body"
            label="Texto"
            variant="outlined"
            color="purple-darken-3"
            auto-grow
            rows="2"
            class="mb-3"
            hide-details="auto"
          />
          <p class="text-caption font-weight-bold text-grey-darken-2 mb-2">Tipo</p>
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
          v-if="devotionalError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ devotionalError }}
        </v-alert>

        <div class="content-admin-grid">
          <div>
            <v-text-field
              v-model="devotionalForm.title"
              label="Título"
              variant="outlined"
              color="purple-darken-3"
              class="mb-3"
              hide-details="auto"
            />
            <v-textarea
              v-model="devotionalForm.description"
              label="Descrição"
              variant="outlined"
              color="purple-darken-3"
              auto-grow
              rows="2"
              class="mb-3"
              hide-details="auto"
            />
            <div
              v-for="(chapter, index) in devotionalForm.chapters"
              :key="index"
              class="chapter-admin-box mb-3"
            >
              <v-text-field
                v-model="chapter.title"
                :label="`Capítulo ${index + 1}`"
                variant="outlined"
                color="purple-darken-3"
                class="mb-2"
                hide-details="auto"
              />
              <v-text-field
                v-model="chapter.bibleRef"
                label="Referência bíblica"
                variant="outlined"
                color="purple-darken-3"
                class="mb-2"
                hide-details="auto"
              />
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

    <!-- Invite code card -->
    <section v-show="canManageMembersByRole && activeAdminTab === 'geral'" class="church-admin-section mb-6">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Código de Convite</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Compartilhe o link para novos membros entrarem na igreja</p>
        </div>
      </div>

      <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
        <div class="d-flex align-center gap-3 mb-4">
          <v-avatar size="40" :color="avatarBgIndigo">
            <QrCode size="20" :color="accentColor" />
          </v-avatar>
          <div>
            <p class="font-weight-bold mb-0" style="font-size:0.9rem;">Link de convite</p>
            <p class="text-caption text-grey-darken-1 mb-0">Qualquer pessoa com este código pode entrar</p>
          </div>
        </div>

        <div v-if="inviteCodeLoading" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="28" color="indigo-darken-2" />
        </div>

        <template v-else>
          <v-alert
            v-if="inviteCodeError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ inviteCodeError }}
          </v-alert>

          <div class="invite-code-display mb-4">
            <span class="invite-code-text">{{ inviteCodeValue || "—" }}</span>
          </div>

          <div v-if="inviteCodeValue" class="d-flex justify-center mb-4">
            <AdminInviteQrCode :value="inviteJoinUrl" />
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <v-btn
              color="indigo-darken-2"
              variant="flat"
              size="small"
              class="text-none font-weight-bold"
              :prepend-icon="inviteCodeCopied ? undefined : undefined"
              :disabled="!inviteCodeValue"
              @click="handleCopyInviteLink"
            >
              <Link size="15" class="mr-1" />
              {{ inviteCodeCopied ? "Copiado!" : "Copiar link" }}
            </v-btn>
            <v-btn
              color="grey-darken-1"
              variant="tonal"
              size="small"
              class="text-none"
              :loading="inviteCodeRegenerating"
              @click="handleRegenerateCode"
            >
              <RefreshCw size="14" class="mr-1" /> Regenerar
            </v-btn>
          </div>
        </template>
      </v-card>

      <div class="mt-6">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Página Pública</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Vitrine da igreja para visitantes, sem precisar de login</p>
        </div>
      </div>

      <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
        <div class="d-flex align-center gap-3 mb-4">
          <v-avatar size="40" :color="avatarBgIndigo">
            <Globe size="20" :color="churchAccent" />
          </v-avatar>
          <div>
            <p class="font-weight-bold mb-0" style="font-size:0.9rem;">Link público</p>
            <p class="text-caption text-grey-darken-1 mb-0">Compartilhe com visitantes em redes sociais e WhatsApp</p>
          </div>
        </div>

        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
          Foto da igreja
        </p>
        <div class="d-flex align-center flex-wrap ga-3 mb-4">
          <v-avatar size="56" color="grey-lighten-3">
            <img
              v-if="currentChurch?.logo"
              :src="currentChurch.logo"
              alt="Foto da igreja"
            />
            <Church v-else size="26" color="#9CA3AF" />
          </v-avatar>
          <v-btn
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none"
            :loading="isUploadingLogo"
            @click="logoInput?.click()"
          >
            {{ currentChurch?.logo ? "Trocar foto" : "Adicionar foto" }}
          </v-btn>
          <input
            ref="logoInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="d-none"
            @change="onLogoChange"
          />
        </div>
        <v-alert
          v-if="logoUploadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ logoUploadError }}
        </v-alert>

        <v-text-field
          v-model="publicChurchForm.slug"
          label="Slug da página pública"
          placeholder="ex: comunidade-vida"
          prepend-inner-icon="mdi-web"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="mb-3"
          hide-details="auto"
          :disabled="isSavingPublicChurch"
        />

        <div class="footer-fields-grid mb-4">
          <v-text-field
            v-model="publicChurchForm.accentColor"
            label="Cor de destaque"
            type="color"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          >
            <template #prepend-inner>
              <Palette size="18" />
            </template>
          </v-text-field>

          <v-text-field
            v-model="publicChurchForm.textColor"
            label="Cor da letra (opcional)"
            type="color"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          >
            <template #prepend-inner>
              <Palette size="18" />
            </template>
          </v-text-field>
        </div>

        <v-select
          v-model="publicChurchForm.fontFamily"
          :items="FONT_OPTIONS"
          item-title="label"
          item-value="key"
          label="Estilo da letra"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="mb-4"
          hide-details="auto"
          :disabled="isSavingPublicChurch"
        />

        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
          Rodapé da página pública
        </p>
        <p class="text-caption text-grey-darken-1 mb-3">
          Contatos e redes que aparecem no rodapé. Deixe em branco o que não usar.
        </p>
        <div class="footer-fields-grid mb-4">
          <v-text-field
            v-model="publicChurchForm.phone"
            label="Telefone"
            prepend-inner-icon="mdi-phone"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.whatsapp"
            label="WhatsApp"
            prepend-inner-icon="mdi-whatsapp"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.email"
            label="E-mail"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.instagram"
            label="Instagram"
            prepend-inner-icon="mdi-instagram"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.facebook"
            label="Facebook"
            prepend-inner-icon="mdi-facebook"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.youtube"
            label="YouTube"
            prepend-inner-icon="mdi-youtube"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.website"
            label="Site"
            prepend-inner-icon="mdi-web"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
        </div>

        <v-alert
          v-if="publicChurchMessage"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ publicChurchMessage }}
        </v-alert>

        <v-alert
          v-if="publicChurchError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ publicChurchError }}
        </v-alert>

        <div class="d-flex gap-2 flex-wrap">
          <v-btn
            color="purple-darken-3"
            variant="flat"
            size="small"
            class="text-none font-weight-bold"
            :loading="isSavingPublicChurch"
            @click="savePublicChurchSettings"
          >
            <Save size="15" class="mr-1" /> Salvar
          </v-btn>
          <v-btn
            :href="publicLandingUrl"
            target="_blank"
            rel="noopener noreferrer"
            color="grey-darken-1"
            variant="tonal"
            size="small"
            class="text-none"
            :disabled="!publicLandingUrl"
          >
            <ArrowRight size="14" class="mr-1" /> Ver página pública
          </v-btn>
        </div>
      </v-card>

      <div class="section-heading mb-4 mt-6">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Horários de culto</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Aparecem nos "Próximos cultos" da página pública</p>
        </div>
      </div>

      <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
        <div class="d-flex align-center gap-3 mb-4">
          <v-avatar size="40" :color="avatarBgIndigo">
            <Calendar size="20" :color="churchAccent" />
          </v-avatar>
          <div>
            <p class="font-weight-bold mb-0" style="font-size:0.9rem;">
              {{ editingServiceTimeId ? "Editar horário" : "Novo horário" }}
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">Dia da semana, horário e nome do culto</p>
          </div>
        </div>

        <div class="service-time-form mb-4">
          <v-select
            v-model="serviceTimeForm.weekday"
            :items="weekdayOptions"
            item-title="label"
            item-value="value"
            label="Dia"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
          />
          <v-text-field
            v-model="serviceTimeForm.time"
            label="Horário"
            type="time"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
          />
          <v-text-field
            v-model="serviceTimeForm.label"
            label="Nome do culto"
            placeholder="ex: Culto da Família"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
          />
        </div>

        <div class="d-flex gap-2 mb-4">
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            size="small"
            :loading="isSavingServiceTime"
            @click="saveServiceTime"
          >
            {{ editingServiceTimeId ? "Salvar horário" : "Adicionar horário" }}
          </v-btn>
          <v-btn
            v-if="editingServiceTimeId"
            variant="text"
            color="grey-darken-1"
            class="text-none"
            size="small"
            @click="resetServiceTimeForm"
          >
            Cancelar
          </v-btn>
        </div>

        <div v-if="sortedServiceTimes.length" class="service-time-list">
          <div
            v-for="time in sortedServiceTimes"
            :key="time.id"
            class="service-time-row"
            :class="{ inactive: !time.isActive }"
          >
            <span class="service-day">{{ weekdayName(time.weekday) }}</span>
            <strong class="service-hour">{{ time.time }}</strong>
            <span class="service-label">{{ time.label }}</span>
            <div class="service-actions">
              <v-chip v-if="!time.isActive" size="x-small" variant="tonal" color="grey-darken-1">
                Inativo
              </v-chip>
              <v-btn icon variant="text" color="grey-darken-1" size="small" @click="editServiceTime(time)">
                <Pencil size="15" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="removeServiceTime(time.id)"
              >
                <Trash2 size="15" />
              </v-btn>
            </div>
          </div>
        </div>
        <p v-else class="text-caption text-grey-darken-1 mb-0">
          Nenhum horário cadastrado ainda.
        </p>
      </v-card>
      </div>
    </section>

    <AdminReports
      v-if="isChurchWideManager && activeAdminTab === 'relatorios'"
      :departments="departments"
    />

    <AdminHelpVideos v-if="isChurchWideManager && activeAdminTab === 'videos'" />

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
    </section>

    <section v-show="activeAdminTab === 'membros'" class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Membros
        </h2>
        <v-btn
          v-if="canManageMembersByRole"
          color="primary"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isMemberDialogOpen = true"
        >
          <UserPlus size="16" class="mr-2" /> Adicionar
        </v-btn>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="memberSearch"
          label="Buscar membro"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
        <v-select
          v-model="memberTypeFilter"
          label="Tipo"
          :items="memberTypeOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-account-filter-outline"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
        <v-select
          v-model="memberRoleFilter"
          label="Cargo"
          :items="roleFilterOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-shield-account-outline"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
      </div>

      <v-card
        v-if="members.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <UserCheck size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum membro cadastrado ainda
        </p>
      </v-card>

      <v-card
        v-else-if="filteredMembers.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <UserCheck size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum membro encontrado
        </p>
      </v-card>

      <div v-else class="church-list d-flex flex-column ga-3">
        <v-card
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
          role="button"
          tabindex="0"
          :aria-label="`Ver detalhes de ${member.name}`"
          @click="openMemberDetails(member)"
          @keydown.enter="openMemberDetails(member)"
          @keydown.space.prevent="openMemberDetails(member)"
        >
          <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
            <Users size="20" :color="accentColor" />
          </v-avatar>

          <div class="member-copy">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
              {{ member.name }}
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ member.email }}
            </p>
          </div>

          <div class="member-badges">
            <v-chip
              v-if="leaderDepartmentNames(member.id).length"
              size="small"
              color="indigo-darken-2"
              variant="tonal"
            >
              Líder
            </v-chip>
            <v-chip
              v-for="memberRole in member.roles ?? []"
              :key="memberRole.id"
              size="small"
              :color="memberRole.scope === 'MINISTRY' ? 'orange-darken-2' : 'teal-darken-2'"
              variant="tonal"
            >
              {{ memberRole.name }}
            </v-chip>
            <v-chip size="small" color="purple-darken-3" variant="tonal">
              {{ churchMemberRoleLabel(member) }}
            </v-chip>
          </div>
        </v-card>
      </div>

      <v-alert
        v-if="membersError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ membersError }}
      </v-alert>
    </section>

    <section v-show="activeAdminTab === 'ministerios'" class="church-admin-section">
      <div class="section-heading mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Ministérios
        </h2>
        <v-btn
          v-if="canManageDepartments"
          color="purple-darken-3"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isDepartmentDialogOpen = true"
        >
          <Building size="16" class="mr-2" /> Novo
        </v-btn>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="departmentSearch"
          label="Buscar ministério"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
        <v-select
          v-model="departmentTypeFilter"
          label="Tipo"
          :items="departmentFilterOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-shape-outline"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
      </div>

      <v-card
        v-if="departments.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Building size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum ministério cadastrado ainda
        </p>
      </v-card>

      <v-card
        v-else-if="filteredDepartments.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Building size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum ministério encontrado
        </p>
      </v-card>

      <div v-else class="d-flex flex-column ministry-list">
        <div
          v-for="department in filteredDepartments"
          :key="department.id"
          class="ministry-item"
          role="button"
          tabindex="0"
          @click="openChurchDepartmentDetails(department)"
          @keydown.enter="openChurchDepartmentDetails(department)"
          @keydown.space.prevent="openChurchDepartmentDetails(department)"
        >
          <AdminMinisteryCard
            :ministry="{
              name: department.name,
              leader: department.leader.name,
              status: department.isActive ? 'Ativo' : 'Inativo',
              type: department.type,
              typeLabel: departmentTypeLabel(department.type),
            }"
          />
          <div v-if="canManageDepartments" class="ministry-actions">
            <v-btn
              icon
              variant="text"
              color="grey-darken-1"
              size="small"
              @click.stop="openDepartmentEditDialog(department)"
            >
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              @click.stop="handleDeleteDepartment(department)"
            >
              <v-icon size="18">mdi-delete-outline</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <v-alert
        v-if="departmentsError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ departmentsError }}
      </v-alert>
    </section>
    <section v-show="isChurchWideManager && activeAdminTab === 'cargos'" class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Cargos
          </h2>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Crie cargos com permissões específicas e atribua aos membros.
          </p>
        </div>
        <v-btn
          color="purple-darken-3"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="openCreateRole"
        >
          <Shield size="16" class="mr-2" /> Novo cargo
        </v-btn>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="roleSearch"
          label="Buscar cargo"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
        <v-select
          v-model="roleModuleFilter"
          label="Módulo"
          :items="permissionModuleFilterOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-view-module-outline"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
      </div>

      <div v-if="filteredChurchRoles.length" class="d-flex flex-column ministry-list">
        <div
          v-for="role in filteredChurchRoles"
          :key="role.id"
          class="role-item"
        >
          <div class="min-w-0 flex-1">
            <div class="d-flex align-center gap-2 mb-1 flex-wrap">
              <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ role.name }}
              </p>
              <v-chip
                size="x-small"
                :color="role.scope === 'MINISTRY' ? 'orange-darken-2' : 'teal-darken-2'"
                variant="tonal"
              >
                {{ role.scope === "MINISTRY" ? (role.department?.name ?? "Ministério") : "Igreja" }}
              </v-chip>
              <v-chip size="x-small" color="grey" variant="tonal">
                {{ role.userCount ?? 0 }} {{ (role.userCount ?? 0) === 1 ? "membro" : "membros" }}
              </v-chip>
            </div>
            <p v-if="role.description" class="text-caption text-grey-darken-1 mb-1">
              {{ role.description }}
            </p>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <v-chip
                v-for="module in rolePermissionModules(role.permissions)"
                :key="module.key"
                size="x-small"
                color="indigo-darken-2"
                variant="tonal"
              >
                {{ module.label }}
              </v-chip>
              <span
                v-if="!role.permissions.length"
                class="text-caption text-grey-darken-1"
              >
                Sem permissões
              </span>
            </div>
          </div>
          <div class="ministry-actions">
            <v-btn
              icon
              variant="text"
              color="grey-darken-1"
              size="small"
              @click="openEditRole(role)"
            >
              <Pencil size="16" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              @click="pendingDeleteRoleId = role.id"
            >
              <Trash2 size="16" />
            </v-btn>
          </div>
        </div>
      </div>

      <v-card
        v-else-if="churchRoles.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Shield size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum cargo criado ainda
        </p>
      </v-card>

      <v-card
        v-else
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Shield size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum cargo encontrado
        </p>
      </v-card>
    </section>

    <UtilsResponsiveOverlay v-model="isMemberDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="44" class="mr-3">
              <UserPlus size="20" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                Adicionar membro
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Crie o acesso já vinculado a esta igreja.
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeMemberDialog">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateMember">
          <v-text-field
            v-model="memberForm.name"
            label="Nome completo"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
          />

          <v-text-field
            v-model="memberForm.email"
            label="E-mail"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
          />

          <v-text-field
            v-model="memberForm.phone"
            label="Telefone"
            type="tel"
            prepend-inner-icon="mdi-phone-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
          />

          <v-text-field
            v-model="memberForm.password"
            label="Senha temporária"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="
              showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-alert
            v-if="createMemberError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createMemberError }}
          </v-alert>

          <div class="admin-dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingMember"
              @click="closeMemberDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingMember"
              :disabled="isCreatingMember"
            >
              Criar membro
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isDepartmentDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgPurple" size="44" class="mr-3">
              <Building size="20" :color="purpleAccent" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                {{ editingDepartmentId ? "Editar ministério" : "Novo ministério" }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Cadastre um ministério da sua igreja.
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeDepartmentDialog">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateDepartment">
          <v-text-field
            v-model="departmentForm.name"
            label="Nome do ministério"
            prepend-inner-icon="mdi-domain"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingDepartment"
          />

          <v-select
            v-model="departmentForm.type"
            label="Tipo"
            :items="departmentTypes"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-shape-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            :disabled="isCreatingDepartment"
          />

          <v-select
            v-model="departmentForm.leaderId"
            label="Líder"
            :items="leaderOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-star-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            :disabled="isCreatingDepartment"
          />

          <v-alert
            v-if="createDepartmentError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createDepartmentError }}
          </v-alert>

          <div class="admin-dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingDepartment"
              @click="closeDepartmentDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingDepartment"
              :disabled="isCreatingDepartment"
            >
              {{ editingDepartmentId ? "Salvar ministério" : "Criar ministério" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isMemberDetailsOpen" max-width="520">
      <v-card v-if="selectedMember" class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgIndigo" size="48" class="mr-3">
              <Users size="22" :color="accentColor" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedMember.name }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                {{ selectedMember.email }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeMemberDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-info mb-5">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Telefone</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedMember.phone }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p
              v-if="!canAssignSelectedMemberRole"
              class="text-body-2 font-weight-medium text-grey-darken-4 mb-0"
            >
              {{ selectedMember.role === "PASTOR" ? "Pastor" : "Membro" }}
            </p>
            <v-select
              v-else
              v-model="selectedMemberForm.role"
              :items="memberRoleOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              bg-color="white"
              hide-details="auto"
              class="admin-input"
              :disabled="isUpdatingMember"
            />
          </div>
        </div>

        <v-text-field
          v-model="selectedMemberForm.name"
          label="Nome"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="admin-input mb-3"
          hide-details="auto"
          :readonly="!canManageMembersByRole || !canEditSelectedMember"
          :disabled="isUpdatingMember"
        />

        <v-text-field
          v-model="selectedMemberForm.email"
          label="E-mail"
          type="email"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="admin-input mb-3"
          hide-details="auto"
          :readonly="!canManageMembersByRole || !canEditSelectedMember"
          :disabled="isUpdatingMember"
        />

        <v-text-field
          v-model="selectedMemberForm.phone"
          label="Telefone"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="admin-input mb-4"
          hide-details="auto"
          :readonly="!canManageMembersByRole || !canEditSelectedMember"
          :disabled="isUpdatingMember"
        />

        <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
          Cargos
        </p>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <v-chip
            v-for="memberRole in selectedMember?.roles ?? []"
            :key="memberRole.id"
            size="small"
            :color="memberRole.scope === 'MINISTRY' ? 'orange-darken-2' : 'teal-darken-2'"
            variant="tonal"
            :closable="canAssignSelectedMemberRole && !isAssigningRole"
            @click:close="removeRoleFromSelectedMember(memberRole.id)"
          >
            {{ memberRole.name }}
          </v-chip>
          <span
            v-if="!(selectedMember?.roles ?? []).length"
            class="text-caption text-grey-darken-1"
          >
            Nenhum cargo atribuído
          </span>
        </div>
        <div class="d-flex align-center gap-2 mb-4">
          <v-select
            v-model="selectedChurchMemberRoleId"
            label="Adicionar cargo"
            :items="assignableRolesFor(selectedMember)"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-badge-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input"
            hide-details="auto"
            :disabled="!canAssignSelectedMemberRole || isAssigningRole"
          />
          <v-btn
            color="purple-darken-3"
            variant="tonal"
            class="text-none"
            :loading="isAssigningRole"
            :disabled="!canAssignSelectedMemberRole || isAssigningRole || !selectedChurchMemberRoleId"
            @click="addRoleToSelectedMember"
          >
            Adicionar
          </v-btn>
        </div>

        <v-alert
          v-if="selectedMember && leaderDepartmentNames(selectedMember.id).length"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          Lidera: {{ leaderDepartmentNames(selectedMember.id).join(", ") }}
        </v-alert>

        <v-alert
          v-if="permissionError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ permissionError }}
        </v-alert>

        <v-alert
          v-if="selectedMemberRoleLockedReason"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ selectedMemberRoleLockedReason }}
        </v-alert>

        <div class="member-dialog-footer mt-6">
          <v-btn
            v-if="canManageMembersByRole && canEditSelectedMember"
            variant="text"
            color="red-darken-2"
            class="text-none"
            :disabled="isUpdatingMember || isAssigningRole"
            @click="handleDeleteMember"
          >
            Remover
          </v-btn>
          <div class="member-dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isUpdatingMember || isAssigningRole"
              @click="closeMemberDetails"
            >
              Fechar
            </v-btn>
            <v-btn
              v-if="canManageMembersByRole && canEditSelectedMember"
              color="purple-darken-3"
              class="text-none"
              :loading="isUpdatingMember || isAssigningRole"
              :disabled="isUpdatingMember || isAssigningRole"
              @click="handleUpdateMember"
            >
              Salvar
            </v-btn>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isChurchDepartmentDetailsOpen" max-width="520">
      <v-card
        v-if="selectedChurchDepartment"
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
                {{ selectedChurchDepartment.name }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                Líder: {{ selectedChurchDepartment.leader.name }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeChurchDepartmentDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-info">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ departmentTypeLabel(selectedChurchDepartment.type) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Status</p>
            <v-chip
              size="small"
              :color="selectedChurchDepartment.isActive ? 'teal-darken-2' : 'grey'"
              variant="tonal"
            >
              {{ selectedChurchDepartment.isActive ? "Ativo" : "Inativo" }}
            </v-chip>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Membros</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedChurchDepartment.membersCount || 0 }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Escalas</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedChurchDepartment.schedulesCount || 0 }}
            </p>
          </div>
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

    <UtilsResponsiveOverlay v-model="isRoleDialogOpen" max-width="480">
      <v-card class="rounded-xl pa-6" elevation="0">
        <div class="d-flex align-center justify-space-between mb-5">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            {{ editingRoleId ? "Editar cargo" : "Novo cargo" }}
          </h2>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click="isRoleDialogOpen = false"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field
          v-model="roleForm.name"
          label="Nome do cargo"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />

        <v-text-field
          v-model="roleForm.description"
          label="Descrição (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-4"
          hide-details="auto"
        />

        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
          Onde este cargo vale?
        </p>
        <v-btn-toggle
          v-model="roleForm.scope"
          mandatory
          divided
          color="purple-darken-3"
          density="comfortable"
          class="mb-3 role-scope-toggle"
        >
          <v-btn value="MINISTRY" class="text-none flex-1">Um ministério</v-btn>
          <v-btn value="CHURCH" class="text-none flex-1">Igreja toda</v-btn>
        </v-btn-toggle>

        <v-select
          v-if="roleForm.scope === 'MINISTRY'"
          v-model="roleForm.departmentId"
          :items="ministryRoleOptions"
          item-title="label"
          item-value="value"
          label="Ministério"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />

        <v-select
          v-model="selectedRolePreset"
          :items="presetRoleOptions"
          item-title="label"
          item-value="value"
          label="Modelo pronto (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-4"
          hide-details="auto"
          clearable
          @update:model-value="applyRolePreset"
        />

        <div class="role-permission-header mb-3">
          <div>
            <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
              O que este cargo pode fazer
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">
              Marque as ações permitidas. Você ajusta caixa por caixa ou usa "tudo".
            </p>
          </div>
          <v-chip size="small" color="purple-darken-3" variant="tonal">
            {{ roleForm.permissions.length }} selecionadas
          </v-chip>
        </div>
        <div class="permission-module-list mb-4">
          <div
            v-for="module in visibleRoleModules"
            :key="module.key"
            class="permission-module-card"
          >
            <div class="permission-module-title">
              <div>
                <strong>{{ module.label }}</strong>
                <span>{{ module.description }}</span>
              </div>
              <v-btn
                variant="tonal"
                color="indigo-darken-2"
                size="x-small"
                class="text-none"
                @click="toggleModulePermissions(module.key)"
              >
                {{ isModuleFullySelected(module.key) ? "Limpar" : "Tudo" }}
              </v-btn>
            </div>

            <v-checkbox
              v-for="perm in module.permissions"
              :key="perm.key"
              v-model="roleForm.permissions"
              :value="perm.key"
              density="compact"
              color="purple-darken-3"
              hide-details
            >
              <template #label>
                <div class="ml-1">
                  <p class="text-body-2 font-weight-medium mb-0">{{ perm.label }}</p>
                  <p class="text-caption text-grey-darken-1 mb-0">{{ perm.description }}</p>
                </div>
              </template>
            </v-checkbox>
          </div>
        </div>

        <v-alert
          v-if="roleError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ roleError }}
        </v-alert>

        <div class="d-flex justify-end gap-2">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            @click="isRoleDialogOpen = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isSavingRole"
            @click="saveRole"
          >
            {{ editingRoleId ? "Salvar" : "Criar cargo" }}
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isDeleteRoleDialogOpen"
      title="Remover cargo"
      message="O cargo será removido dos membros atribuídos. Esta ação não pode ser desfeita."
      :loading="isDeletingRole"
      @cancel="pendingDeleteRoleId = ''"
      @confirm="confirmDeleteRole"
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
import { computed, onMounted, reactive, ref } from "vue";
import { useDisplay } from "vuetify";
import {
  Users,
  Building,
  Calendar,
  Music,
  UserPlus,
  UserCheck,
  Church,
  ArrowRight,
  BarChart3,
  Pencil,
  Trash2,
  Shield,
  BookMarked,
  Megaphone,
  Heart,
  Link,
  Plus,
  QrCode,
  RefreshCw,
  Clock,
  Globe,
  Palette,
  Save,
  Image as ImageIcon,
} from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { useMembers, type ChurchMember } from "../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../composables/useDepartments";
import {
  useAdmin,
  type AdminChurch,
  type AdminChurchDepartment,
  type AdminChurchDetails,
  type AdminChurchSchedule,
  type AdminChurchUser,
} from "../../composables/useAdmin";
import {
  useChurchRoles,
  type ChurchRole,
} from "../../../composables/useChurchRoles";
import {
  usePermissions,
  PERMISSION_MODULES,
  modulesForScope,
  ROLE_PRESETS,
  type PermissionModuleKey,
  type PermissionScope,
  type AppPermission,
} from "../../../composables/usePermissions";
import { useDailyVerse, type DailyVerse } from "../../composables/useDailyVerse";
import {
  useAnnouncements,
  type Announcement,
} from "../../composables/useAnnouncements";
import {
  useDevotionals,
  type Devotional,
} from "../../composables/useDevotionals";
import { useChurchInvite } from "../../composables/useChurchInvite";
import { useChurch } from "../../composables/useChurch";
import { useServiceTimes, type ServiceTime } from "../../composables/useServiceTimes";
import { usePosts, type ChurchPost } from "../../composables/usePosts";
import { FONT_OPTIONS } from "../../composables/useChurchAppearance";

const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const purpleAccent = computed(() => isDark.value ? "#f0975a" : "#C2542C");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");
const avatarBgPurple = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

const platformAdminHelpItems = [
  {
    title: "Como acompanhar igrejas",
    description: "Use os cards e a lista para ver igrejas cadastradas, status e detalhes da plataforma.",
    icon: Church,
  },
  {
    title: "Como abrir detalhes",
    description: "Selecione uma igreja na lista para consultar usuários, ministérios e próximas escalas.",
    icon: Users,
  },
  {
    title: "Como acessar a administração pastoral",
    description: "Use Abrir minha igreja para ir direto para a área operacional da sua igreja.",
    icon: ArrowRight,
  },
];

const churchAdminHelpItems = [
  {
    title: "Como gerenciar membros",
    description: "Na aba Membros você cria usuários, altera dados e acompanha permissões de acesso.",
    icon: Users,
  },
  {
    title: "Como organizar ministérios",
    description: "Na aba Ministérios você cria equipes, define líderes e acompanha a estrutura da igreja.",
    icon: Building,
  },
  {
    title: "Como publicar conteúdo",
    description: "Na aba Conteúdo você publica versículos, avisos, devocionais, posts e horários públicos.",
    icon: BookMarked,
  },
];

const {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} = useMembers();
const {
  getDepartments,
  getChurchSchedules,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = useDepartments();
const {
  getChurches,
  getChurchById,
  updateChurchUserByAdmin,
  resetChurchUserPasswordByAdmin,
  removeChurchUserByAdmin,
} = useAdmin();
const { listVerses, publishVerse, updateVerse, deleteVerse } = useDailyVerse();
const { getInviteCode, regenerateInviteCode } = useChurchInvite();
const { updateOwnChurch, uploadChurchPhoto } = useChurch();
const {
  serviceTimes,
  loadServiceTimes,
  createServiceTime,
  updateServiceTime,
  deleteServiceTime,
} = useServiceTimes();

const inviteCodeValue = ref("");
const inviteCodeLoading = ref(false);
const inviteCodeRegenerating = ref(false);
const inviteCodeCopied = ref(false);
const inviteCodeError = ref("");

const loadInviteCode = async () => {
  if (!canManageMembersByRole.value) return;
  inviteCodeLoading.value = true;
  inviteCodeError.value = "";
  const { data, error } = await getInviteCode();
  if (error) inviteCodeError.value = error;
  inviteCodeValue.value = data?.inviteCode ?? "";
  inviteCodeLoading.value = false;
};

const handleRegenerateCode = async () => {
  inviteCodeRegenerating.value = true;
  inviteCodeError.value = "";
  const { data, error } = await regenerateInviteCode();
  if (error) inviteCodeError.value = error;
  inviteCodeValue.value = data?.inviteCode ?? inviteCodeValue.value;
  inviteCodeRegenerating.value = false;
};

const inviteJoinUrl = computed(() =>
  inviteCodeValue.value
    ? `${window.location.origin}/join?code=${inviteCodeValue.value}`
    : "",
);

const handleCopyInviteLink = () => {
  if (!inviteCodeValue.value) return;
  const url = inviteJoinUrl.value;
  navigator.clipboard.writeText(url).then(() => {
    inviteCodeCopied.value = true;
    setTimeout(() => { inviteCodeCopied.value = false; }, 2000);
  });
};
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = useAnnouncements();
const {
  listDevotionals,
  createDevotional,
  deleteDevotional,
} = useDevotionals();
const {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  uploadImage: uploadPostImage,
} = usePosts();

const posts = ref<ChurchPost[]>([]);
const postImageInput = ref<HTMLInputElement | null>(null);
const editingPostId = ref("");
const isSavingPost = ref(false);
const isUploadingPostImage = ref(false);
const postForm = reactive({
  title: "",
  body: "",
  videoUrl: "",
  imageUrl: "" as string | null,
  imageKey: "" as string | null,
  isPublic: true,
  pinned: false,
});

const members = ref<ChurchMember[]>([]);
const departments = ref<ChurchDepartment[]>([]);
const churchSchedules = ref<DepartmentSchedule[]>([]);
const announcements = ref<Announcement[]>([]);
const devotionals = ref<Devotional[]>([]);
const adminChurches = ref<AdminChurch[]>([]);
const activeAdminTab = ref("geral");
const selectedChurch = ref<AdminChurchDetails | null>(null);
const membersError = ref("");
const departmentsError = ref("");
const platformError = ref("");
const isLoadingPlatform = ref(false);
const isLoadingChurch = ref(false);
const isMemberDialogOpen = ref(false);
const isMemberDetailsOpen = ref(false);
const isAdminUserDetailsOpen = ref(false);
const isAdminDepartmentDetailsOpen = ref(false);
const isAdminScheduleDetailsOpen = ref(false);
const isChurchDepartmentDetailsOpen = ref(false);
const isChurchDetailsOpen = ref(false);
const isChurchDetailsSheetOpen = ref(false);
const isDepartmentDialogOpen = ref(false);
const isCreatingMember = ref(false);
const isUpdatingMember = ref(false);
const isCreatingDepartment = ref(false);
const createMemberError = ref("");
const createDepartmentError = ref("");
const permissionError = ref("");
const showPassword = ref(false);
const selectedMember = ref<ChurchMember | null>(null);
const selectedAdminUser = ref<AdminChurchUser | null>(null);
const selectedAdminDepartment = ref<AdminChurchDepartment | null>(null);
const selectedAdminSchedule = ref<AdminChurchSchedule | null>(null);
const selectedChurchDepartment = ref<ChurchDepartment | null>(null);
const editingDepartmentId = ref("");
const pendingDeleteDepartment = ref<ChurchDepartment | null>(null);
const pendingDeleteMember = ref<ChurchMember | null>(null);
const pendingRemoveAdminUser = ref<AdminChurchUser | null>(null);
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
const showAllChurchUsers = ref(false);
const showAllChurchDepartments = ref(false);
const showAllChurchSchedules = ref(false);
const platformSearch = ref("");
const platformStatusFilter = ref<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
const memberSearch = ref("");
const memberTypeFilter = ref<"ALL" | "PASTOR" | "MEMBER" | "ADMIN">("ALL");
const memberRoleFilter = ref<string | null>("ALL");
const departmentSearch = ref("");
const departmentTypeFilter = ref("ALL");
const roleSearch = ref("");
const roleModuleFilter = ref<PermissionModuleKey | "ALL">("ALL");
const contentError = ref("");
const announcementError = ref("");
const devotionalError = ref("");
const postError = ref("");
const isPublishingVerse = ref(false);
const dailyVerses = ref<DailyVerse[]>([]);
const verseError = ref("");
const isSavingAnnouncement = ref(false);
const isSavingDevotional = ref(false);
const isSavingServiceTime = ref(false);
const isSavingPublicChurch = ref(false);
const editingServiceTimeId = ref("");
const publicChurchMessage = ref("");
const publicChurchError = ref("");

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
const canEditMemberPermissions = computed(
  () =>
    isChurchWideManager.value &&
    selectedMember.value?.id !== user.value?.id,
);
const canManageDepartments = computed(() => isChurchWideManager.value);
const isCurrentUserSuperAdmin = computed(() => user.value?.role === "SUPER_ADMIN");
const isProtectedSuperAdmin = (member?: { role?: string } | null) =>
  member?.role === "SUPER_ADMIN" && !isCurrentUserSuperAdmin.value;
const isTitularMember = (member?: { id?: string } | null) =>
  Boolean(member?.id && user.value?.church?.userMainId === member.id);
const selectedChurchIsCurrentUserChurch = computed(
  () => Boolean(selectedChurch.value?.id && selectedChurch.value.id === user.value?.church?.id),
);
const canEditSelectedMember = computed(
  () =>
    Boolean(selectedMember.value) &&
    selectedMember.value?.id !== user.value?.id &&
    !isTitularMember(selectedMember.value) &&
    !isProtectedSuperAdmin(selectedMember.value),
);
const canAssignSelectedMemberRole = computed(
  () =>
    canEditMemberPermissions.value &&
    canEditSelectedMember.value,
);
const canAssignSelectedAdminUserRole = computed(
  () =>
    isCurrentUserSuperAdmin.value &&
    selectedChurchIsCurrentUserChurch.value &&
    Boolean(selectedAdminUser.value) &&
    selectedAdminUser.value?.id !== user.value?.id &&
    !isProtectedSuperAdmin(selectedAdminUser.value),
);
const selectedMemberRoleLockedReason = computed(() => {
  if (!selectedMember.value) return "";
  if (selectedMember.value.id === user.value?.id) {
    return "Você não pode alterar seu próprio cargo por esta tela.";
  }
  if (isTitularMember(selectedMember.value)) {
    return "O pastor titular não pode ser alterado por este fluxo.";
  }
  if (isProtectedSuperAdmin(selectedMember.value)) {
    return "Usuários super admin só podem ser alterados por outro super admin.";
  }
  return "";
});
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
const leaderOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);
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

const memberTypeOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Pastores", value: "PASTOR" },
  { label: "Membros", value: "MEMBER" },
  { label: "Admins", value: "ADMIN" },
];

const permissionModuleFilterOptions = computed(() => [
  { label: "Todos", value: "ALL" },
  ...PERMISSION_MODULES.map((module) => ({
    label: module.label,
    value: module.key,
  })),
]);

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

const publicLandingUrl = computed(() => {
  const slug = publicChurchForm.slug.trim().toLowerCase();
  if (!slug) return "";
  if (typeof window === "undefined") return `/c/${slug}`;
  return `${window.location.origin}/c/${slug}`;
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

const isDeleteDialogOpen = computed({
  get: () =>
    Boolean(
      pendingDeleteDepartment.value ||
        pendingDeleteMember.value ||
        pendingRemoveAdminUser.value,
    ),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingDeleteDepartment.value = null;
      pendingDeleteMember.value = null;
      pendingRemoveAdminUser.value = null;
    }
  },
});

const deleteDialogTitle = computed(() => {
  if (pendingDeleteDepartment.value) return "Remover ministério";
  if (pendingRemoveAdminUser.value) return "Remover usuário da igreja";
  return "Remover membro";
});

const deleteDialogMessage = computed(() => {
  if (pendingDeleteDepartment.value) {
    return `O ministério ${pendingDeleteDepartment.value.name} será removido com suas escalas, tarefas, recursos e músicas.`;
  }

  if (pendingRemoveAdminUser.value) {
    return `${pendingRemoveAdminUser.value.name} será removido desta igreja.`;
  }

  if (pendingDeleteMember.value) {
    return `O membro ${pendingDeleteMember.value.name} será removido desta igreja.`;
  }

  return "Essa ação não pode ser desfeita.";
});

const memberForm = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
});

const departmentForm = reactive({
  name: "",
  type: "OTHER",
  leaderId: "",
});

const verseForm = reactive({
  text: "",
  reference: "",
  commentary: "",
  isPublic: false,
  imageUrl: "" as string | null,
  imageKey: "" as string | null,
  videoUrl: "",
});

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

const publicChurchForm = reactive({
  slug: "",
  accentColor: "#B5472A",
  textColor: "",
  fontFamily: "EDITORIAL",
  phone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  facebook: "",
  youtube: "",
  website: "",
});

const isUploadingLogo = ref(false);
const logoUploadError = ref("");
const logoInput = ref<HTMLInputElement | null>(null);

const currentChurch = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);

// Cor da igreja (mesma da pagina publica) para o tratamento editorial das telas
// de cadastro. Cai no terracota padrao quando a igreja nao escolheu uma cor.
const churchAccent = computed(() => currentChurch.value?.accentColor || "#B5472A");
const editorialStyle = computed(() => ({ "--church-accent": churchAccent.value }));

const syncPublicChurchForm = () => {
  const church = currentChurch.value;
  publicChurchForm.slug = church?.slug ?? "";
  publicChurchForm.accentColor = church?.accentColor || "#B5472A";
  publicChurchForm.textColor = church?.textColor ?? "";
  publicChurchForm.fontFamily = church?.fontFamily || "EDITORIAL";
  publicChurchForm.phone = church?.phone ?? "";
  publicChurchForm.whatsapp = church?.whatsapp ?? "";
  publicChurchForm.email = church?.email ?? "";
  publicChurchForm.instagram = church?.instagram ?? "";
  publicChurchForm.facebook = church?.facebook ?? "";
  publicChurchForm.youtube = church?.youtube ?? "";
  publicChurchForm.website = church?.website ?? "";
};

const serviceTimeForm = reactive({
  label: "",
  weekday: 0,
  time: "",
  isActive: true,
});

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

const selectedMemberForm = reactive({
  name: "",
  email: "",
  phone: "",
  role: "MEMBER",
});

const memberRoleOptions = [
  { label: "Membro", value: "MEMBER" },
  { label: "Pastor", value: "PASTOR" },
];

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

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Louvor", value: "MUSIC" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];
const departmentFilterOptions = computed(() => [
  { label: "Todos", value: "ALL" },
  ...departmentTypes,
]);
const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const leaderDepartmentNames = (memberId: string) =>
  departments.value
    .filter((department) => department.leaderId === memberId)
    .map((department) => department.name);

const churchMemberRoleLabel = (member: ChurchMember) => {
  if (member.role === "PASTOR") return "Pastor";
  if (["ADMIN", "SUPER_ADMIN"].includes(member.role)) return "Admin";
  if (leaderDepartmentNames(member.id).length) return "Líder";
  return "Membro";
};

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

const normalizedMemberForm = computed(() => ({
  name: memberForm.name.trim(),
  email: memberForm.email.trim().toLowerCase(),
  phone: memberForm.phone.trim(),
  password: memberForm.password,
}));

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

const loadAnnouncements = async () => {
  const { data } = await getAnnouncements();
  announcements.value = data ?? [];
};

const loadDevotionals = async () => {
  const { data } = await listDevotionals();
  devotionals.value = data ?? [];
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

const loadChurchAdminData = async () => {
  syncPublicChurchForm();
  await Promise.all([
    loadMembers(),
    loadDepartments(),
    loadChurchSchedules(),
    loadRoles(),
    loadAnnouncements(),
    loadDevotionals(),
    loadPosts(),
    loadServiceTimes(),
    loadDailyVerses(),
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

const openChurchDepartmentDetails = (department: ChurchDepartment) => {
  selectedChurchDepartment.value = department;
  isChurchDepartmentDetailsOpen.value = true;
};

const closeChurchDepartmentDetails = () => {
  isChurchDepartmentDetailsOpen.value = false;
  selectedChurchDepartment.value = null;
};

const resetMemberForm = () => {
  memberForm.name = "";
  memberForm.email = "";
  memberForm.phone = "";
  memberForm.password = "";
  showPassword.value = false;
};

const resetDepartmentForm = () => {
  departmentForm.name = "";
  departmentForm.type = "OTHER";
  departmentForm.leaderId = "";
  editingDepartmentId.value = "";
};

const closeMemberDialog = () => {
  isMemberDialogOpen.value = false;
  createMemberError.value = "";
  resetMemberForm();
};

const closeDepartmentDialog = () => {
  isDepartmentDialogOpen.value = false;
  createDepartmentError.value = "";
  resetDepartmentForm();
};

const openMemberDetails = (member: ChurchMember) => {
  selectedMember.value = member;
  selectedMemberForm.name = member.name;
  selectedMemberForm.email = member.email;
  selectedMemberForm.phone = member.phone || "";
  selectedMemberForm.role = member.role === "PASTOR" ? "PASTOR" : "MEMBER";
  selectedChurchMemberRoleId.value = null;
  permissionError.value = "";
  isMemberDetailsOpen.value = true;
};

const closeMemberDetails = () => {
  isMemberDetailsOpen.value = false;
  selectedMember.value = null;
  permissionError.value = "";
  selectedMemberForm.name = "";
  selectedMemberForm.email = "";
  selectedMemberForm.phone = "";
  selectedMemberForm.role = "MEMBER";
  selectedChurchMemberRoleId.value = null;
};

const handleCreateMember = async () => {
  createMemberError.value = "";
  const form = normalizedMemberForm.value;

  if (!form.name || !form.email || !form.phone || !form.password) {
    createMemberError.value = "Preencha todos os campos.";
    return;
  }

  if (form.password.length < 6) {
    createMemberError.value = "A senha temporária deve ter pelo menos 6 caracteres.";
    return;
  }

  isCreatingMember.value = true;

  try {
    const { data, error } = await createMember(form);

    if (error || !data) {
      createMemberError.value = error || "Não foi possível criar o membro.";
      return;
    }

    members.value = [data, ...members.value];
    closeMemberDialog();
  } finally {
    isCreatingMember.value = false;
  }
};

const handleCreateDepartment = async () => {
  createDepartmentError.value = "";
  const name = departmentForm.name.trim();

  if (!name || !departmentForm.leaderId) {
    createDepartmentError.value = "Informe o nome e o líder do ministério.";
    return;
  }

  isCreatingDepartment.value = true;

  try {
    const { data, error } = editingDepartmentId.value
      ? await updateDepartment(editingDepartmentId.value, {
          name,
          type: departmentForm.type,
          leaderId: departmentForm.leaderId,
        })
      : await createDepartment({
          name,
          type: departmentForm.type,
          leaderId: departmentForm.leaderId,
        });

    if (error || !data) {
      createDepartmentError.value = error || "Não foi possível criar o ministério.";
      return;
    }

    const nextDepartments = editingDepartmentId.value
      ? departments.value.map((department) =>
          department.id === data.id ? data : department,
        )
      : [...departments.value, data];

    departments.value = nextDepartments.sort((first, second) =>
      first.name.localeCompare(second.name),
    );
    closeDepartmentDialog();
  } finally {
    isCreatingDepartment.value = false;
  }
};

const openDepartmentEditDialog = (department: ChurchDepartment) => {
  editingDepartmentId.value = department.id;
  departmentForm.name = department.name;
  departmentForm.type = department.type;
  departmentForm.leaderId = department.leaderId;
  createDepartmentError.value = "";
  isDepartmentDialogOpen.value = true;
};

const handleDeleteDepartment = (department: ChurchDepartment) => {
  pendingDeleteDepartment.value = department;
};

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) {
    pendingDeleteDepartment.value = null;
    pendingDeleteMember.value = null;
    pendingRemoveAdminUser.value = null;
  }
};

const confirmDelete = async () => {
  if (pendingDeleteDepartment.value) {
    await confirmDeleteDepartment();
    return;
  }

  if (pendingRemoveAdminUser.value) {
    await confirmRemoveAdminUser();
    return;
  }

  if (pendingDeleteMember.value) {
    await confirmDeleteMember();
  }
};

const confirmDeleteDepartment = async () => {
  if (!pendingDeleteDepartment.value) return;

  departmentsError.value = "";
  isConfirmingDelete.value = true;
  const departmentId = pendingDeleteDepartment.value.id;

  try {
    const { error } = await deleteDepartment(departmentId);

    if (error) {
      departmentsError.value = error;
      return;
    }

    departments.value = departments.value.filter((item) => item.id !== departmentId);
    churchSchedules.value = churchSchedules.value.filter(
      (schedule) => schedule.departmentId !== departmentId,
    );
    pendingDeleteDepartment.value = null;
  } finally {
    isConfirmingDelete.value = false;
  }
};

const handleUpdateMember = async () => {
  if (!selectedMember.value) return;

  permissionError.value = "";

  if (!canEditSelectedMember.value) {
    permissionError.value =
      selectedMemberRoleLockedReason.value || "Sem permissão para editar este membro.";
    return;
  }

  const name = selectedMemberForm.name.trim();
  const email = selectedMemberForm.email.trim().toLowerCase();

  if (!name || !email) {
    permissionError.value = "Informe nome e email.";
    return;
  }

  isUpdatingMember.value = true;

  try {
    const { data, error } = await updateMember(selectedMember.value.id, {
      name,
      email,
      phone: selectedMemberForm.phone.trim(),
      ...(canAssignSelectedMemberRole.value ? { role: selectedMemberForm.role } : {}),
    });

    if (error || !data) {
      permissionError.value = error || "Não foi possível salvar o membro.";
      return;
    }

    // Cargos (ChurchRole, ex: lider de ministerio) sao gerenciados a parte
    // (chips add/remove), entao preservamos os cargos atuais do membro ao
    // salvar nome/email/telefone/tipo (PASTOR/MEMBER).
    const nextMember: ChurchMember = {
      ...data,
      roles: selectedMember.value.roles ?? data.roles ?? [],
    };

    selectedMember.value = nextMember;
    members.value = members.value.map((member) =>
      member.id === nextMember.id ? nextMember : member,
    );
  } finally {
    isUpdatingMember.value = false;
  }
};

const handleDeleteMember = () => {
  if (!selectedMember.value) return;
  if (!canEditSelectedMember.value) {
    permissionError.value =
      selectedMemberRoleLockedReason.value || "Sem permissão para remover este membro.";
    return;
  }

  pendingDeleteMember.value = selectedMember.value;
};

const confirmDeleteMember = async () => {
  if (!pendingDeleteMember.value) return;

  permissionError.value = "";
  isConfirmingDelete.value = true;

  const memberId = pendingDeleteMember.value.id;

  try {
    const { error } = await deleteMember(memberId);

    if (error) {
      permissionError.value = error;
      return;
    }

    members.value = members.value.filter(
      (member) => member.id !== memberId,
    );
    pendingDeleteMember.value = null;
    closeMemberDetails();
  } finally {
    isConfirmingDelete.value = false;
  }
};

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

  if (!verseForm.text.trim() || !verseForm.reference.trim()) {
    verseError.value = "Informe o texto e a referência do versículo.";
    return;
  }

  isPublishingVerse.value = true;
  try {
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
  } finally {
    isPublishingVerse.value = false;
  }
};

const removeVerse = async (id: string) => {
  verseError.value = "";
  const { error } = await deleteVerse(id);
  if (error) {
    verseError.value = error;
    return;
  }
  dailyVerses.value = dailyVerses.value.filter((verse) => verse.id !== id);
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

  if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
    announcementError.value = "Informe o título e o texto do aviso.";
    return;
  }

  isSavingAnnouncement.value = true;
  try {
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
  } finally {
    isSavingAnnouncement.value = false;
  }
};

const resetServiceTimeForm = () => {
  editingServiceTimeId.value = "";
  serviceTimeForm.label = "";
  serviceTimeForm.weekday = 0;
  serviceTimeForm.time = "";
  serviceTimeForm.isActive = true;
};

const editServiceTime = (time: ServiceTime) => {
  editingServiceTimeId.value = time.id;
  serviceTimeForm.label = time.label;
  serviceTimeForm.weekday = time.weekday;
  serviceTimeForm.time = time.time;
  serviceTimeForm.isActive = time.isActive;
};

const saveServiceTime = async () => {
  contentError.value = "";

  if (!serviceTimeForm.label.trim() || serviceTimeForm.weekday === null || !serviceTimeForm.time) {
    contentError.value = "Informe rotulo, dia e horario do culto.";
    return;
  }

  isSavingServiceTime.value = true;

  try {
    const payload = {
      label: serviceTimeForm.label.trim(),
      weekday: Number(serviceTimeForm.weekday),
      time: serviceTimeForm.time,
      isActive: serviceTimeForm.isActive,
    };

    const { data, error } = editingServiceTimeId.value
      ? await updateServiceTime(editingServiceTimeId.value, payload)
      : await createServiceTime(payload);

    if (error || !data) {
      contentError.value = error || "Nao foi possivel salvar o horario.";
      return;
    }

    serviceTimes.value = editingServiceTimeId.value
      ? serviceTimes.value.map((item) => (item.id === data.id ? data : item))
      : [...serviceTimes.value, data];
    resetServiceTimeForm();
  } finally {
    isSavingServiceTime.value = false;
  }
};

const removeServiceTime = async (id: string) => {
  contentError.value = "";
  const { error } = await deleteServiceTime(id);

  if (error) {
    contentError.value = error || "Nao foi possivel excluir o horario.";
    return;
  }

  serviceTimes.value = serviceTimes.value.filter((item) => item.id !== id);
  if (editingServiceTimeId.value === id) resetServiceTimeForm();
};

const onLogoChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  logoUploadError.value = "";
  isUploadingLogo.value = true;
  try {
    const { data, error } = await uploadChurchPhoto(file);
    if (error || !data) {
      logoUploadError.value = error || "Não foi possível enviar a foto.";
      return;
    }
    if (user.value) {
      const activeChurch = user.value.activeChurch ?? user.value.church;
      const church = user.value.church ?? user.value.activeChurch;
      user.value = {
        ...user.value,
        activeChurch: activeChurch ? { ...activeChurch, logo: data.url } : activeChurch,
        church: church ? { ...church, logo: data.url } : church,
      };
    }
  } finally {
    isUploadingLogo.value = false;
    if (logoInput.value) logoInput.value.value = "";
  }
};

const savePublicChurchSettings = async () => {
  publicChurchError.value = "";
  publicChurchMessage.value = "";

  if (!publicChurchForm.slug.trim()) {
    publicChurchError.value = "Informe o slug publico da igreja.";
    return;
  }

  isSavingPublicChurch.value = true;

  try {
    const { data, error } = await updateOwnChurch({
      slug: publicChurchForm.slug.trim().toLowerCase(),
      accentColor: publicChurchForm.accentColor || null,
      textColor: publicChurchForm.textColor.trim() || null,
      fontFamily: publicChurchForm.fontFamily || null,
      phone: publicChurchForm.phone.trim() || null,
      whatsapp: publicChurchForm.whatsapp.trim() || null,
      email: publicChurchForm.email.trim() || null,
      instagram: publicChurchForm.instagram.trim() || null,
      facebook: publicChurchForm.facebook.trim() || null,
      youtube: publicChurchForm.youtube.trim() || null,
      website: publicChurchForm.website.trim() || null,
    });

    if (error) {
      publicChurchError.value = error;
      return;
    }

    publicChurchMessage.value = "Landing publica atualizada.";
    if (data && user.value) {
      const activeChurch = user.value.activeChurch ?? user.value.church ?? data;
      const church = user.value.church ?? user.value.activeChurch ?? data;
      user.value = {
        ...user.value,
        activeChurch: {
          ...activeChurch,
          ...data,
        },
        church: {
          ...church,
          ...data,
        },
      };
    }
    syncPublicChurchForm();
  } finally {
    isSavingPublicChurch.value = false;
  }
};
const removeAnnouncement = async (id: string) => {
  announcementError.value = "";
  const { error } = await deleteAnnouncement(id);
  if (error) {
    announcementError.value = error;
    return;
  }
  announcements.value = announcements.value.filter((announcement) => announcement.id !== id);
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
  } finally {
    isSavingDevotional.value = false;
  }
};

const removeDevotional = async (id: string) => {
  devotionalError.value = "";
  const { error } = await deleteDevotional(id);
  if (error) {
    devotionalError.value = error;
    return;
  }
  devotionals.value = devotionals.value.filter((devotional) => devotional.id !== id);
};

// ── Cargos (RBAC) ──────────────────────────────────────────────
const { can } = usePermissions();
const { getRoles, createRole, updateRole, deleteRole, addMemberRole, removeMemberRole } =
  useChurchRoles();

const churchRoles = ref<ChurchRole[]>([]);
const isRoleDialogOpen = ref(false);
const editingRoleId = ref("");
const roleForm = reactive({
  name: "",
  description: "",
  scope: "MINISTRY" as PermissionScope,
  departmentId: null as string | null,
  permissions: [] as AppPermission[],
});
const selectedRolePreset = ref<string | null>(null);
const isSavingRole = ref(false);
const roleError = ref("");
const isDeletingRole = ref(false);
const pendingDeleteRoleId = ref("");
const isAssigningRole = ref(false);
const selectedMemberRoleId = ref<string | null>(null);
const selectedChurchMemberRoleId = ref<string | null>(null);

const isDeleteRoleDialogOpen = computed({
  get: () => Boolean(pendingDeleteRoleId.value),
  set: (v: boolean) => { if (!v) pendingDeleteRoleId.value = ""; },
});

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

const visibleRoleModules = computed(() => modulesForScope(roleForm.scope));

const ministryRoleOptions = computed(() =>
  departments.value.map((department) => ({
    label: department.name,
    value: department.id,
  })),
);

const presetRoleOptions = computed(() =>
  ROLE_PRESETS.filter((preset) => preset.scope === roleForm.scope).map(
    (preset) => ({ label: preset.label, value: preset.key }),
  ),
);

const applyRolePreset = (presetKey: string | null) => {
  if (!presetKey) return;
  const preset = ROLE_PRESETS.find((item) => item.key === presetKey);
  if (!preset) return;
  roleForm.permissions = [...preset.permissions];
};

const isModuleFullySelected = (moduleKey: PermissionModuleKey) => {
  const module = PERMISSION_MODULES.find((item) => item.key === moduleKey);
  if (!module) return false;
  return module.permissions.every((perm) =>
    roleForm.permissions.includes(perm.key),
  );
};

const toggleModulePermissions = (moduleKey: PermissionModuleKey) => {
  const module = PERMISSION_MODULES.find((item) => item.key === moduleKey);
  if (!module) return;
  const keys = module.permissions.map((perm) => perm.key);
  if (isModuleFullySelected(moduleKey)) {
    roleForm.permissions = roleForm.permissions.filter(
      (perm) => !keys.includes(perm),
    );
  } else {
    roleForm.permissions = [
      ...new Set([...roleForm.permissions, ...keys]),
    ];
  }
};

const roleFilterOptions = computed(() => [
  { label: "Todos", value: "ALL" },
  { label: "Sem cargo", value: null },
  ...churchRoles.value.map((role) => ({ label: role.name, value: role.id })),
]);

const filteredMembers = computed(() => {
  const search = normalizeFilterText(memberSearch.value);

  return members.value.filter((member) => {
    const matchesSearch =
      !search ||
      normalizeFilterText(`${member.name} ${member.email} ${member.phone || ""}`)
        .includes(search);
    const matchesType =
      memberTypeFilter.value === "ALL" ||
      (memberTypeFilter.value === "ADMIN" &&
        ["ADMIN", "SUPER_ADMIN"].includes(member.role)) ||
      member.role === memberTypeFilter.value;
    const matchesRole =
      memberRoleFilter.value === "ALL" ||
      (member.roles ?? []).some((role) => role.id === memberRoleFilter.value);

    return matchesSearch && matchesType && matchesRole;
  });
});

const filteredDepartments = computed(() => {
  const search = normalizeFilterText(departmentSearch.value);

  return departments.value.filter((department) => {
    const matchesSearch =
      !search ||
      normalizeFilterText(`${department.name} ${department.leader.name}`)
        .includes(search);
    const matchesType =
      departmentTypeFilter.value === "ALL" ||
      department.type === departmentTypeFilter.value;

    return matchesSearch && matchesType;
  });
});

const rolePermissionModules = (permissions: string[]) =>
  PERMISSION_MODULES.filter((module) =>
    module.permissions.some((permission) => permissions.includes(permission.key)),
  );

const filteredChurchRoles = computed(() => {
  const search = normalizeFilterText(roleSearch.value);

  return churchRoles.value.filter((role) => {
    const matchesSearch =
      !search ||
      normalizeFilterText(`${role.name} ${role.description || ""}`).includes(search);
    const matchesModule =
      roleModuleFilter.value === "ALL" ||
      rolePermissionModules(role.permissions).some(
        (module) => module.key === roleModuleFilter.value,
      );

    return matchesSearch && matchesModule;
  });
});

const loadRoles = async () => {
  const { data } = await getRoles();
  churchRoles.value = data ?? [];
};

const openCreateRole = () => {
  editingRoleId.value = "";
  roleForm.name = "";
  roleForm.description = "";
  roleForm.scope = "MINISTRY";
  roleForm.departmentId = departments.value[0]?.id ?? null;
  roleForm.permissions = [];
  selectedRolePreset.value = null;
  roleError.value = "";
  isRoleDialogOpen.value = true;
};

const openEditRole = (role: ChurchRole) => {
  editingRoleId.value = role.id;
  roleForm.name = role.name;
  roleForm.description = role.description ?? "";
  roleForm.scope = role.scope;
  roleForm.departmentId = role.departmentId;
  roleForm.permissions = [...role.permissions];
  selectedRolePreset.value = null;
  roleError.value = "";
  isRoleDialogOpen.value = true;
};

const saveRole = async () => {
  roleError.value = "";
  if (!roleForm.name.trim()) {
    roleError.value = "Nome do cargo é obrigatório.";
    return;
  }
  if (roleForm.scope === "MINISTRY" && !roleForm.departmentId) {
    roleError.value = "Escolha o ministério deste cargo.";
    return;
  }

  isSavingRole.value = true;
  try {
    const payload = {
      name: roleForm.name.trim(),
      description: roleForm.description.trim() || undefined,
      scope: roleForm.scope,
      departmentId: roleForm.scope === "MINISTRY" ? roleForm.departmentId : null,
      permissions: roleForm.permissions,
    };

    if (editingRoleId.value) {
      const { data, error } = await updateRole(editingRoleId.value, payload);
      if (error || !data) { roleError.value = error || "Erro ao salvar cargo."; return; }
      await loadRoles();
    } else {
      const { data, error } = await createRole(payload);
      if (error || !data) { roleError.value = error || "Erro ao criar cargo."; return; }
      await loadRoles();
    }

    isRoleDialogOpen.value = false;
  } finally {
    isSavingRole.value = false;
  }
};

const confirmDeleteRole = async () => {
  if (!pendingDeleteRoleId.value) return;
  isDeletingRole.value = true;
  try {
    const { error } = await deleteRole(pendingDeleteRoleId.value);
    if (error) { roleError.value = error; return; }
    churchRoles.value = churchRoles.value.filter(
      (r) => r.id !== pendingDeleteRoleId.value,
    );
    pendingDeleteRoleId.value = "";
  } finally {
    isDeletingRole.value = false;
  }
};

// Espelha a nova lista de cargos do membro em todos os locais de estado.
const applyMemberRoles = (memberId: string, roles: MemberRole[]) => {
  members.value = members.value.map((m) =>
    m.id === memberId ? { ...m, roles } : m,
  );
  if (selectedMember.value?.id === memberId) {
    selectedMember.value = { ...selectedMember.value, roles };
  }
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

const addRoleToSelectedMember = async () => {
  if (!selectedMember.value || !selectedChurchMemberRoleId.value) return;
  if (!canAssignSelectedMemberRole.value) return;
  const roleId = selectedChurchMemberRoleId.value;
  selectedChurchMemberRoleId.value = null;
  await addMemberRoleById(selectedMember.value.id, roleId);
};

const removeRoleFromSelectedMember = async (roleId: string) => {
  if (!selectedMember.value) return;
  await removeMemberRoleById(selectedMember.value.id, roleId);
};

onMounted(async () => {
  syncPublicChurchForm();
  await Promise.all([
    isPlatformAdmin.value ? loadPlatformChurches() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadChurchAdminData() : Promise.resolve(),
    loadInviteCode(),
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

.invite-code-card {
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border);
}

.invite-code-display {
  background: var(--app-color-background);
  border: 2px dashed var(--app-color-border);
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
}

.invite-code-text {
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: var(--app-color-text);
  font-variant-numeric: tabular-nums;
  font-family: monospace;
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

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading .v-btn {
  flex: 0 0 auto;
}

.admin-input :deep(.v-field) {
  border-radius: 14px;
}

.admin-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
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

.member-card:active {
  transform: scale(0.99);
}

.ministry-list {
  gap: 10px;
}

.ministry-item {
  min-width: 0;
  cursor: pointer;
}

.role-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.role-item:last-child {
  border-bottom: none;
}

.role-permission-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.content-admin-grid {
  display: grid;
  /* auto-fit + minmax faz o grid decidir sozinho quantas colunas cabem,
     em vez de depender de um breakpoint fixo que pode nao bater com a
     largura real do container (padding, app frame, etc). */
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.footer-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
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

.post-image-preview {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 8px;
}

/* v-btn-toggle nao estica os filhos por padrao; sem isto os dois botoes de
   alcance do cargo ficam desalinhados/apertados em telas de celular. */
.role-scope-toggle {
  display: flex !important;
  width: 100%;
}

.role-scope-toggle :deep(.v-btn) {
  flex: 1 1 0;
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

/* Horários de culto */
.service-time-form {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(120px, 0.8fr) minmax(110px, 0.6fr) minmax(0, 1.4fr);
}

.service-time-list {
  display: grid;
  gap: 6px;
}

.service-time-row {
  align-items: center;
  border: 1px solid var(--e-line, #E4DFD5);
  border-radius: 10px;
  display: grid;
  gap: 12px;
  grid-template-columns: 92px 60px minmax(0, 1fr) auto;
  padding: 10px 12px;
}

.service-time-row.inactive {
  opacity: 0.55;
}

.service-day {
  color: var(--church-accent);
  font-size: 0.82rem;
  font-weight: 700;
}

.service-hour {
  font-family: "IBM Plex Mono", monospace;
  font-size: 1rem;
  font-weight: 700;
}

.service-label {
  color: var(--e-ink-soft, #6B655C);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-actions {
  align-items: center;
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .service-time-form {
    grid-template-columns: 1fr;
  }

  .service-time-row {
    grid-template-columns: 68px 54px minmax(0, 1fr);
  }

  .service-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

.content-inline-fields {
  display: grid;
  grid-template-columns: minmax(120px, auto) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
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

.permission-module-list {
  display: grid;
  gap: 10px;
}

.permission-module-card {
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f9fafb;
  padding: 12px;
}

.permission-module-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.permission-module-title strong,
.permission-module-title span {
  display: block;
}

.permission-module-title strong {
  color: var(--app-color-text, #111827);
  font-size: 0.86rem;
  font-weight: 850;
}

.permission-module-title span {
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.74rem;
  font-weight: 650;
}

.ministry-item:focus-visible,
.clickable-row:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.ministry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: -6px 4px 14px 0;
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

.admin-dialog-actions,
.member-dialog-actions,
.member-dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-dialog-actions {
  justify-content: flex-end;
}

.member-dialog-footer {
  justify-content: space-between;
}

.member-dialog-actions {
  justify-content: flex-end;
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

  .content-admin-grid,
  .content-inline-fields,
  .footer-fields-grid {
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

  .ministry-actions {
    justify-content: flex-start;
    margin: -4px 0 16px 8px;
  }

  .admin-dialog-actions,
  .member-dialog-actions,
  .member-dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-dialog-actions .v-btn,
  .member-dialog-actions .v-btn,
  .member-dialog-footer .v-btn {
    width: 100%;
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
