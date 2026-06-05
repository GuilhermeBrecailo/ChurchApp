<template>
  <div v-if="isPlatformAdmin" class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Plataforma
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Igrejas, usuários e ministérios de todo o sistema
      </p>
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

    <div class="platform-layout">
      <section class="platform-sidebar">
        <v-card class="church-list-panel rounded-xl pa-4 elevation-1 bg-white border-subtle">
          <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
              Igrejas
            </h2>
            <v-chip size="small" color="purple-darken-3" variant="tonal">
              {{ adminChurches.length }} total
            </v-chip>
          </div>

          <v-skeleton-loader
            v-if="isLoadingPlatform"
            type="list-item-three-line@4"
          />

          <div
            v-else-if="adminChurches.length === 0"
            class="d-flex flex-column align-center justify-center py-6"
          >
            <Church size="32" color="#9CA3AF" class="mb-3" />
            <p class="text-caption text-grey-darken-1 font-weight-medium mb-0 text-center">
              Nenhuma igreja cadastrada ainda
            </p>
          </div>

          <div v-else class="church-list-scroll d-flex flex-column ga-3">
            <v-card
              v-for="church in adminChurches"
              :key="church.id"
              class="church-card rounded-xl pa-4 elevation-0 bg-white border-subtle"
              :class="{ 'church-card-active': selectedChurch?.id === church.id }"
              @click="selectChurch(church.id)"
            >
              <div class="d-flex align-center">
                <v-avatar color="#EEF2FF" size="44" class="mr-3">
                  <Church size="21" color="#6366F1" />
                </v-avatar>
                <div class="flex-grow-1 min-w-0">
                  <h3 class="church-card-title text-subtitle-2 font-weight-bold mb-1">
                    {{ church.name }}
                  </h3>
                  <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                    {{ church.city || "Cidade não informada" }} {{ church.state ? `- ${church.state}` : "" }}
                  </p>
                </div>
                <ArrowRight size="18" color="#6B7280" />
              </div>

              <div class="church-metrics mt-3">
                <span>{{ church.membersCount }} usuários</span>
                <span>{{ church.departmentsCount }} ministérios</span>
                <span>{{ church.isActive ? "Ativa" : "Inativa" }}</span>
              </div>
            </v-card>
          </div>
        </v-card>
      </section>

      <section class="platform-details">
        <v-card
          v-if="!selectedChurch && !isLoadingChurch"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle details-empty"
        >
          <Building size="34" color="#9CA3AF" class="mb-3" />
          <p class="text-body-2 text-grey-darken-1 font-weight-medium mb-0 text-center">
            Clique em uma igreja para ver usuários, ministérios e dados gerais.
          </p>
        </v-card>

        <v-card
          v-else-if="isLoadingChurch"
          class="rounded-xl pa-6 elevation-1 bg-white border-subtle"
        >
          <v-skeleton-loader type="article, list-item-three-line@3" />
        </v-card>

        <div v-else-if="selectedChurch" class="d-flex flex-column ga-4">
          <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
            <div class="d-flex align-center mb-4">
              <v-avatar color="#FAF5FF" size="52" class="mr-3">
                <Church size="24" color="#A855F7" />
              </v-avatar>
              <div class="min-w-0">
                <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                  {{ selectedChurch.name }}
                </h2>
                <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                  {{ selectedChurch.road || "Endereço não informado" }}
                  {{ selectedChurch.number ? `, ${selectedChurch.number}` : "" }}
                </p>
              </div>
            </div>

            <div class="church-detail-grid">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1">Cidade</p>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ selectedChurch.city || "-" }} {{ selectedChurch.state ? `- ${selectedChurch.state}` : "" }}
                </p>
              </div>
              <div>
                <p class="text-caption text-grey-darken-1 mb-1">Documento</p>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ selectedChurch.document || "-" }}
                </p>
              </div>
              <div>
                <p class="text-caption text-grey-darken-1 mb-1">CEP</p>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ selectedChurch.localZipCode || "-" }}
                </p>
              </div>
              <div>
                <p class="text-caption text-grey-darken-1 mb-1">Status</p>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ selectedChurch.isActive ? "Ativa" : "Inativa" }}
                </p>
              </div>
            </div>
          </v-card>

          <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">
              Usuários
            </h3>
            <div class="d-flex flex-column ga-2">
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
                  {{ member.role === "PASTOR" ? "Pastor" : ["ADMIN", "SUPER_ADMIN"].includes(member.role) ? "Admin" : "Membro" }}
                </v-chip>
              </div>
            </div>
          </v-card>

          <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">
              Ministérios
            </h3>
            <div class="d-flex flex-column ga-2">
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
                    Lider: {{ department.leader.name }}
                  </p>
                </div>
                <div class="text-caption text-grey-darken-1 text-right">
                  {{ department.membersCount }} membros<br />
                  {{ department.schedulesCount }} escalas
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </section>
    </div>

    <v-dialog v-model="isAdminUserDetailsOpen" max-width="520">
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
    </v-dialog>
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
        class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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
              v-if="member.canManageMembers"
              size="small"
              color="teal-darken-2"
              variant="tonal"
            >
              Permissão
            </v-chip>
            <v-chip size="small" color="purple-darken-3" variant="tonal">
              {{ member.role === "PASTOR" ? "Pastor" : "Membro" }}
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
        class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
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
              @click="openDepartmentEditDialog(department)"
            >
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              @click="handleDeleteDepartment(department)"
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
    <v-dialog v-model="isMemberDialogOpen" max-width="520">
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
    </v-dialog>

    <v-dialog v-model="isDepartmentDialogOpen" max-width="520">
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
    </v-dialog>

    <v-dialog v-model="isMemberDetailsOpen" max-width="520">
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

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada para pastor titular ou membros com permissão de gestão.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  Users,
  Building,
  Calendar,
  Music,
  UserPlus,
  UserCheck,
  Church,
  ArrowRight,
} from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useMembers, type ChurchMember } from "../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
} from "../../composables/useDepartments";
import {
  useAdmin,
  type AdminChurch,
  type AdminChurchDetails,
  type AdminChurchUser,
} from "../../composables/useAdmin";

const { user } = useAuth();
const {
  getMembers,
  createMember,
  updateMemberPermissions,
  updateMember,
  deleteMember,
} = useMembers();
const {
  getDepartments,
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
const selectedMemberCanManageMembers = ref(false);
const editingDepartmentId = ref("");
const pendingDeleteDepartment = ref<ChurchDepartment | null>(null);
const pendingDeleteMember = ref<ChurchMember | null>(null);
const isConfirmingDelete = ref(false);

const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const canAddMembers = computed(
  () => user.value?.isTitularPastor === true || user.value?.canManageMembers === true,
);
const canAccessChurchAdmin = computed(
  () =>
    user.value?.hasChurch === true &&
    (user.value?.isTitularPastor === true ||
      user.value?.canManageMembers === true),
);
const canEditMemberPermissions = computed(
  () =>
    user.value?.isTitularPastor === true &&
    selectedMember.value?.id !== user.value?.id,
);
const canManageDepartments = computed(() => user.value?.isTitularPastor === true);
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

const loadPlatformChurches = async () => {
  platformError.value = "";
  isLoadingPlatform.value = true;

  const { data, error } = await getChurches();

  isLoadingPlatform.value = false;

  if (error) {
    platformError.value = error;
    adminChurches.value = [];
    return;
  }

  adminChurches.value = data ?? [];

  if (!selectedChurch.value && adminChurches.value[0]) {
    await selectChurch(adminChurches.value[0].id);
  }
};

const selectChurch = async (id: string) => {
  platformError.value = "";
  isLoadingChurch.value = true;
  closeAdminUserDetails();

  const { data, error } = await getChurchById(id);

  isLoadingChurch.value = false;

  if (error || !data) {
    platformError.value = error || "Não foi possível carregar a igreja.";
    return;
  }

  selectedChurch.value = data;
};

const openAdminUserDetails = (member: AdminChurchUser) => {
  selectedAdminUser.value = member;
  isAdminUserDetailsOpen.value = true;
};

const closeAdminUserDetails = () => {
  isAdminUserDetailsOpen.value = false;
  selectedAdminUser.value = null;
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

  const { data, error } = await createMember(form);

  isCreatingMember.value = false;

  if (error || !data) {
    createMemberError.value = error || "Não foi possível criar o membro.";
    return;
  }

  members.value = [data, ...members.value];
  closeMemberDialog();
};

const handleCreateDepartment = async () => {
  createDepartmentError.value = "";
  const name = departmentForm.name.trim();

  if (!name || !departmentForm.leaderId) {
    createDepartmentError.value = "Informe o nome e o líder do ministério.";
    return;
  }

  isCreatingDepartment.value = true;

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

  isCreatingDepartment.value = false;

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
  const { error } = await deleteDepartment(departmentId);
  isConfirmingDelete.value = false;

  if (error) {
    departmentsError.value = error;
    return;
  }

  departments.value = departments.value.filter((item) => item.id !== departmentId);
  pendingDeleteDepartment.value = null;
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

  const { data, error } = await updateMember(selectedMember.value.id, {
    name,
    email,
    phone: selectedMemberForm.phone.trim(),
  });

  isUpdatingMember.value = false;

  if (error || !data) {
    permissionError.value = error || "Não foi possível salvar o membro.";
    return;
  }

  selectedMember.value = data;
  selectedMemberCanManageMembers.value = data.canManageMembers;
  members.value = members.value.map((member) =>
    member.id === data.id ? data : member,
  );
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
  const { error } = await deleteMember(memberId);

  isConfirmingDelete.value = false;

  if (error) {
    permissionError.value = error;
    return;
  }

  members.value = members.value.filter(
    (member) => member.id !== memberId,
  );
  pendingDeleteMember.value = null;
  closeMemberDetails();
};

const handleUpdateMemberPermissions = async (value: boolean | null) => {
  if (!selectedMember.value) return;

  if (!canEditMemberPermissions.value) {
    selectedMemberCanManageMembers.value = selectedMember.value.canManageMembers;
    return;
  }

  permissionError.value = "";
  isUpdatingPermissions.value = true;

  const { data, error } = await updateMemberPermissions(selectedMember.value.id, {
    canManageMembers: value === true,
  });

  isUpdatingPermissions.value = false;

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
};

onMounted(async () => {
  if (isPlatformAdmin.value) {
    await loadPlatformChurches();
    return;
  }

  if (!canAccessChurchAdmin.value) {
    return;
  }

  await Promise.all([loadMembers(), loadDepartments()]);
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

/* Cria o grid de 2 colunas para os quadros de cima */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.platform-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.platform-sidebar,
.platform-details {
  min-height: 0;
}

.church-list-panel {
  display: flex;
  flex-direction: column;
  max-height: 560px;
  overflow: hidden;
}

.church-list-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.platform-details {
  max-height: 640px;
  overflow-y: auto;
  padding-right: 4px;
}

.church-card {
  cursor: pointer;
  flex: 0 0 auto;
  color: #111827;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.church-card-title {
  color: #111827;
  display: block;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
}

.church-card:active {
  transform: scale(0.99);
}

.church-card-active {
  border-color: #a855f7;
  box-shadow: 0 10px 26px rgba(168, 85, 247, 0.12) !important;
}

.church-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.church-metrics span {
  border-radius: 10px;
  background: #f9fafb;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 600;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4px 6px;
}

.church-detail-grid {
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
  border-radius: 12px;
  padding: 10px 12px;
}

.user-row {
  cursor: pointer;
}

.details-empty {
  min-height: 280px;
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
}

@media (min-width: 900px) {
  .church-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .platform-layout {
    grid-template-columns: minmax(320px, 0.85fr) minmax(0, 1.35fr);
    align-items: start;
    max-height: calc(100vh - 236px);
    min-height: 520px;
  }

  .church-list-panel,
  .platform-details {
    height: calc(100vh - 236px);
    max-height: none;
  }
}

@media (max-width: 520px) {
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
</style>
