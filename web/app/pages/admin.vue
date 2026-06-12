<template>
  <div v-if="isPlatformAdmin" class="platform-admin-page pa-4 min-vh-100 pb-20">
    <div class="platform-hero mb-6">
      <div class="min-w-0">
        <p class="platform-kicker mb-2">Admin master</p>
        <h1 class="platform-title font-weight-bold text-grey-darken-4 mb-2">
          Visão geral da plataforma
        </h1>
        <p class="platform-subtitle text-body-2 text-grey-darken-1 mb-0">
          Acompanhe igrejas, lideranças, usuários e ministérios em um só lugar.
        </p>
      </div>
      <div class="platform-hero-mark">
        <Church size="26" color="#4F46E5" />
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

    <div class="stats-grid mb-6">
      <AdminStatCard
        title="Igrejas"
        :value="adminChurches.length"
        :icon="Church"
        iconColor="#6366F1"
        bgColor="#EEF2FF"
      />
      <AdminStatCard
        title="Usuários"
        :value="platformTotals.users"
        :icon="Users"
        iconColor="#14B8A6"
        bgColor="#F0FDFA"
      />
      <AdminStatCard
        title="Ministérios"
        :value="platformTotals.departments"
        :icon="Building"
        iconColor="#A855F7"
        bgColor="#FAF5FF"
      />
      <AdminStatCard
        title="Ativas"
        :value="platformTotals.activeChurches"
        :icon="UserCheck"
        iconColor="#EAB308"
        bgColor="#FEFCE8"
      />
    </div>

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
          {{ adminChurches.length }} total
        </v-chip>
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

      <div v-else class="church-directory-grid">
        <button
          v-for="church in adminChurches"
          :key="church.id"
          type="button"
          class="church-directory-card"
          :class="{ 'church-directory-card-active': selectedChurch?.id === church.id }"
          @click="selectChurch(church.id)"
        >
          <span class="church-card-top">
            <span class="church-avatar">
              <Church size="21" color="#4F46E5" />
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
            <v-avatar color="#EEF2FF" size="52" class="mr-3">
              <Church size="24" color="#4F46E5" />
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
            <v-avatar color="#EEF2FF" size="44" class="mr-3">
              <Church size="21" color="#4F46E5" />
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
        <div class="d-flex align-center mb-5">
          <v-avatar color="#EEF2FF" size="48" class="mr-3">
            <Users size="22" color="#6366F1" />
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

        <div class="d-flex align-center justify-space-between ga-4 mb-5">
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
              Gerencia membros
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              Indica se o usuário pode listar e cadastrar membros da igreja.
            </p>
          </div>
          <v-chip
            size="small"
            :color="selectedAdminUser.canManageMembers ? 'teal-darken-2' : 'grey'"
            variant="tonal"
          >
            {{ selectedAdminUser.canManageMembers ? "Sim" : "Não" }}
          </v-chip>
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
            <v-avatar color="#FAF5FF" size="48" class="mr-3">
              <Building size="22" color="#A855F7" />
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

  <div v-else-if="canAccessChurchAdmin" class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="church-admin-hero mb-6">
      <div class="min-w-0">
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
          Administração da igreja
        </h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Gerencie membros, ministérios e dados operacionais da sua igreja
        </p>
      </div>
    </div>

    <div class="stats-grid church-stats-grid mb-8">
      <AdminStatCard
        title="Membros"
        :value="members.length"
        :icon="Users"
        iconColor="#6366F1"
        bgColor="#EEF2FF"
      />
      <AdminStatCard
        title="Ministérios"
        :value="departments.length"
        :icon="Building"
        iconColor="#A855F7"
        bgColor="#FAF5FF"
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

    <section v-if="isChurchWideManager" class="church-admin-section mb-8">
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

    <section class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Membros
        </h2>
        <v-btn
          v-if="canAddMembers"
          color="primary"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isMemberDialogOpen = true"
        >
          <UserPlus size="16" class="mr-2" /> Adicionar
        </v-btn>
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

      <div v-else class="church-list d-flex flex-column ga-3">
        <v-card
          v-for="member in members"
          :key="member.id"
          class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
          @click="openMemberDetails(member)"
        >
          <v-avatar color="#EEF2FF" size="44" class="member-avatar">
            <Users size="20" color="#6366F1" />
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
              v-if="member.canManageMembers"
              size="small"
              color="teal-darken-2"
              variant="tonal"
            >
              Permissão
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

    <section class="church-admin-section">
      <div class="section-heading mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Ministérios
        </h2>
        <v-btn
          v-if="canManageDepartments"
          color="#A855F7"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isDepartmentDialogOpen = true"
        >
          <Building size="16" class="mr-2" /> Novo
        </v-btn>
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

      <div v-else class="d-flex flex-column ministry-list">
        <div
          v-for="department in departments"
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
    <UtilsResponsiveOverlay v-model="isMemberDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#EEF2FF" size="44" class="mr-3">
            <UserPlus size="20" color="#6366F1" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Adicionar membro
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie o acesso já vinculado a esta igreja.
            </p>
          </div>
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
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <Building size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingDepartmentId ? "Editar ministério" : "Novo ministério" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Cadastre um ministério da sua igreja.
            </p>
          </div>
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
        <div class="d-flex align-center mb-5">
          <v-avatar color="#EEF2FF" size="48" class="mr-3">
            <Users size="22" color="#6366F1" />
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

        <div class="member-info mb-5">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Telefone</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedMember.phone }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedMember.role === "PASTOR" ? "Pastor" : "Membro" }}
            </p>
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
          :readonly="!canAddMembers"
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
          :readonly="!canAddMembers"
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
          :readonly="!canAddMembers"
          :disabled="isUpdatingMember"
        />

        <v-select
          v-model="selectedMemberForm.role"
          label="Cargo"
          :items="memberRoleOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-badge-account-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="admin-input mb-4"
          hide-details="auto"
          :readonly="!canEditMemberPermissions"
          :disabled="isUpdatingMember"
        />

        <v-alert
          v-if="selectedMember && leaderDepartmentNames(selectedMember.id).length"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          Lidera: {{ leaderDepartmentNames(selectedMember.id).join(", ") }}
        </v-alert>

        <v-divider class="mb-4" />

        <div class="member-permission-row">
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
              Pode adicionar pessoas
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              Libera acesso para listar e cadastrar membros.
            </p>
          </div>
          <v-switch
            v-model="selectedMemberCanManageMembers"
            color="purple-darken-3"
            inset
            hide-details
            :disabled="!canEditMemberPermissions || isUpdatingPermissions"
            @update:model-value="handleUpdateMemberPermissions"
          />
        </div>

        <v-alert
          v-if="permissionError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ permissionError }}
        </v-alert>

        <div class="member-dialog-footer mt-6">
          <v-btn
            v-if="canAddMembers"
            variant="text"
            color="red-darken-2"
            class="text-none"
            :disabled="isUpdatingMember || isUpdatingPermissions"
            @click="handleDeleteMember"
          >
            Remover
          </v-btn>
          <div class="member-dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isUpdatingMember || isUpdatingPermissions"
              @click="closeMemberDetails"
            >
              Fechar
            </v-btn>
            <v-btn
              v-if="canAddMembers"
              color="purple-darken-3"
              class="text-none"
              :loading="isUpdatingMember"
              :disabled="isUpdatingMember || isUpdatingPermissions"
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
            <v-avatar color="#FAF5FF" size="48" class="mr-3">
              <Building size="22" color="#A855F7" />
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

const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#818cf8" : "#6366F1");
const purpleAccent = computed(() => isDark.value ? "#c084fc" : "#A855F7");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(129,140,248,0.14)" : "#EEF2FF");
const avatarBgPurple = computed(() => isDark.value ? "rgba(192,132,252,0.13)" : "#FAF5FF");
const {
  getMembers,
  createMember,
  updateMemberPermissions,
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
} = useAdmin();

const members = ref<ChurchMember[]>([]);
const departments = ref<ChurchDepartment[]>([]);
const churchSchedules = ref<DepartmentSchedule[]>([]);
const adminChurches = ref<AdminChurch[]>([]);
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
const isUpdatingPermissions = ref(false);
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
const selectedMemberCanManageMembers = ref(false);
const editingDepartmentId = ref("");
const pendingDeleteDepartment = ref<ChurchDepartment | null>(null);
const pendingDeleteMember = ref<ChurchMember | null>(null);
const isConfirmingDelete = ref(false);
const churchPreviewLimit = 3;
const showAllChurchUsers = ref(false);
const showAllChurchDepartments = ref(false);
const showAllChurchSchedules = ref(false);

const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isChurchWideManager = computed(
  () => user.value?.role === "PASTOR" || isPlatformAdmin.value,
);
const canAddMembers = computed(
  () => isChurchWideManager.value || user.value?.canManageMembers === true,
);
const canAccessChurchAdmin = computed(
  () =>
    user.value?.hasChurch === true &&
    (isChurchWideManager.value || user.value?.canManageMembers === true),
);
const canEditMemberPermissions = computed(
  () =>
    isChurchWideManager.value &&
    selectedMember.value?.id !== user.value?.id,
);
const canManageDepartments = computed(() => isChurchWideManager.value);
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

const isDeleteDialogOpen = computed({
  get: () => Boolean(pendingDeleteDepartment.value || pendingDeleteMember.value),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingDeleteDepartment.value = null;
      pendingDeleteMember.value = null;
    }
  },
});

const deleteDialogTitle = computed(() =>
  pendingDeleteDepartment.value ? "Remover ministério" : "Remover membro",
);

const deleteDialogMessage = computed(() => {
  if (pendingDeleteDepartment.value) {
    return `O ministério ${pendingDeleteDepartment.value.name} será removido com suas escalas, tarefas, recursos e músicas.`;
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

const selectedMemberForm = reactive({
  name: "",
  email: "",
  phone: "",
  role: "MEMBER",
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
const memberRoleOptions = [
  { label: "Membro", value: "MEMBER" },
  { label: "Pastor", value: "PASTOR" },
];
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
  if (["ADMIN", "SUPER_ADMIN"].includes(role)) return "Admin";
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
  isAdminUserDetailsOpen.value = true;
};

const closeAdminUserDetails = () => {
  isAdminUserDetailsOpen.value = false;
  selectedAdminUser.value = null;
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
  selectedMemberCanManageMembers.value = member.canManageMembers;
  selectedMemberForm.name = member.name;
  selectedMemberForm.email = member.email;
  selectedMemberForm.phone = member.phone || "";
  selectedMemberForm.role = member.role || "MEMBER";
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
  }
};

const confirmDelete = async () => {
  if (pendingDeleteDepartment.value) {
    await confirmDeleteDepartment();
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
      ...(canEditMemberPermissions.value ? { role: selectedMemberForm.role } : {}),
    });

    if (error || !data) {
      permissionError.value = error || "Não foi possível salvar o membro.";
      return;
    }

    selectedMember.value = data;
    selectedMemberCanManageMembers.value = data.canManageMembers;
    members.value = members.value.map((member) =>
      member.id === data.id ? data : member,
    );
  } finally {
    isUpdatingMember.value = false;
  }
};

const handleDeleteMember = () => {
  if (!selectedMember.value) return;

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

const handleUpdateMemberPermissions = async (value: boolean | null) => {
  if (!selectedMember.value) return;

  if (!canEditMemberPermissions.value) {
    selectedMemberCanManageMembers.value = selectedMember.value.canManageMembers;
    return;
  }

  permissionError.value = "";
  isUpdatingPermissions.value = true;

  try {
    const { data, error } = await updateMemberPermissions(selectedMember.value.id, {
      canManageMembers: value === true,
    });

    if (error || !data) {
      permissionError.value = error || "Não foi possível atualizar as permissões.";
      selectedMemberCanManageMembers.value = selectedMember.value.canManageMembers;
      return;
    }

    selectedMember.value = data;
    selectedMemberCanManageMembers.value = data.canManageMembers;
    members.value = members.value.map((member) =>
      member.id === data.id ? data : member,
    );
  } finally {
    isUpdatingPermissions.value = false;
  }
};

onMounted(async () => {
  if (isPlatformAdmin.value) {
    await loadPlatformChurches();
    return;
  }

  if (!canAccessChurchAdmin.value) {
    return;
  }

  await Promise.all([loadMembers(), loadDepartments(), loadChurchSchedules()]);
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
    linear-gradient(180deg, #eef2ff 0, rgba(238, 242, 255, 0) 260px),
    #f9fafb;
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
  color: #4f46e5;
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

.platform-hero-mark {
  width: 54px;
  height: 54px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.platform-directory {
  min-width: 0;
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
  background: #ffffff;
  color: #111827;
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
}

.church-directory-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 14px 36px rgba(31, 41, 55, 0.08);
  transform: translateY(-1px);
}

.church-directory-card:active {
  transform: scale(0.99);
}

.church-directory-card-active {
  border-color: #6366f1;
  box-shadow: 0 14px 32px rgba(99, 102, 241, 0.14);
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
  background: #eef2ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 700;
  min-height: 46px;
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  padding: 5px 6px;
}

.church-metrics strong {
  color: #111827;
  font-size: 0.875rem;
}

.church-open-action {
  color: #4f46e5;
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
  color: #4f46e5;
}

.sheet-summary-tile span {
  grid-area: value;
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-summary-tile small {
  grid-area: label;
  color: #6b7280;
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
  color: #6d28d9;
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
  background: #a855f7;
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

.ministry-item:focus-visible,
.clickable-row:focus-visible {
  outline: 3px solid rgba(168, 85, 247, 0.28);
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
:global(.app-theme-dark) .platform-admin-page {
  background: var(--app-color-background);
}

:global(.app-theme-dark) .platform-kicker {
  color: var(--app-color-accent);
}

:global(.app-theme-dark) .platform-hero-mark {
  background: var(--app-color-surface-soft);
  border-color: var(--app-color-border);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
}

:global(.app-theme-dark) .church-directory-card {
  background: var(--app-color-surface);
  border-color: var(--app-color-border);
  color: var(--app-color-text);
}

:global(.app-theme-dark) .church-directory-card:hover {
  border-color: var(--app-color-accent);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
}

:global(.app-theme-dark) .church-directory-card-active {
  border-color: var(--app-color-accent);
  box-shadow: 0 14px 32px rgba(99, 102, 241, 0.2);
}

:global(.app-theme-dark) .church-avatar {
  background: rgba(129, 140, 248, 0.14);
  color: var(--app-color-accent);
}

:global(.app-theme-dark) .church-metrics span {
  background: var(--app-color-surface-soft);
  border-color: var(--app-color-border);
  color: var(--app-color-text-muted);
}

:global(.app-theme-dark) .church-details-surface,
:global(.app-theme-dark) .church-details-sheet {
  background: var(--app-color-surface) !important;
}

:global(.app-theme-dark) .leadership-summary {
  background: var(--app-color-surface-soft);
  border-color: var(--app-color-border);
}

:global(.app-theme-dark) .leadership-row {
  border-color: var(--app-color-border);
}
</style>
