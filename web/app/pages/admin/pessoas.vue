<template>
  <div
    v-if="canAccessChurchAdmin"
    class="church-admin-page app-operational-page pa-4 min-vh-100 pb-20"
  >
    <div class="pessoas-header app-page-header">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Pessoas</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Pessoas" />
    </div>

    <v-alert
      v-if="departmentsError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ departmentsError }}
    </v-alert>

    <div class="pessoas-subtabs app-surface-muted pa-1 mb-5">
      <v-btn
        v-for="tab in pessoasSubTabs"
        :key="tab.value"
        :color="activeSection === tab.value ? 'purple-darken-3' : 'grey-darken-2'"
        :variant="activeSection === tab.value ? 'flat' : 'text'"
        class="text-none pessoas-subtab"
        size="small"
        @click="selectPessoasSection(tab.value)"
      >
        {{ tab.label }}
      </v-btn>
    </div>

    <section v-show="activeSection === 'membros'" class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Membros
        </h2>
        <v-btn
          v-if="canManageMembersByRole"
          color="purple-darken-3"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isMemberDialogOpen = true"
        >
          <UserPlus size="16" class="mr-2" /> Adicionar
        </v-btn>
      </div>

      <v-alert
        v-if="pendingMembersError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ pendingMembersError }}
      </v-alert>

      <v-card
        v-if="canManageMembersByRole && pendingMembers.length"
        class="pending-members-card app-surface mb-5"
      >
        <div class="pending-members-heading">
          <Clock size="16" color="#B45309" />
          <h3 class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
            Pendentes de aprovação ({{ pendingMembers.length }})
          </h3>
        </div>

        <div
          v-for="pending in pendingMembers"
          :key="pending.membershipId"
          class="pending-member-row"
        >
          <div class="min-w-0">
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
              {{ pending.name }}
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ pending.email }} · {{ pending.phone }}
            </p>
          </div>
          <div class="pending-member-actions">
            <v-btn
              icon
              variant="tonal"
              color="green-darken-2"
              size="small"
              :loading="pendingActionId === pending.membershipId"
              :disabled="Boolean(pendingActionId) && pendingActionId !== pending.membershipId"
              :aria-label="`Aprovar ${pending.name}`"
              @click="handleApproveMember(pending.membershipId)"
            >
              <CheckCircle2 size="16" />
            </v-btn>
            <v-btn
              icon
              variant="tonal"
              color="red-darken-2"
              size="small"
              :loading="pendingActionId === pending.membershipId"
              :disabled="Boolean(pendingActionId) && pendingActionId !== pending.membershipId"
              :aria-label="`Recusar ${pending.name}`"
              @click="handleRejectMember(pending.membershipId)"
            >
              <X size="16" />
            </v-btn>
          </div>
        </div>
      </v-card>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="memberSearch"
          label="Buscar membro"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
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
          hide-details
        />
      </div>

      <v-card
        v-if="members.length === 0"
        class="app-surface pa-6 d-flex flex-column align-center justify-center"
      >
        <UserCheck size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum membro cadastrado ainda
        </p>
      </v-card>

      <v-card
        v-else-if="filteredMembers.length === 0"
        class="app-surface pa-6 d-flex flex-column align-center justify-center"
      >
        <UserCheck size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum membro encontrado
        </p>
      </v-card>

      <div v-else class="church-list pessoas-list">
        <v-card
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-card app-surface app-interactive-surface pa-3"
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

    <section v-show="isChurchWideManager && activeSection === 'cargos'" class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Cargos
          </h2>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Crie cargos com permissões específicas e atribua aos membros.
          </p>
        </div>
        <PlanLock feature="CUSTOM_ROLES">
          <v-btn
            color="purple-darken-3"
            class="rounded-lg text-none px-4"
            size="small"
            elevation="1"
            @click="openCreateRole"
          >
            <Shield size="16" class="mr-2" /> Novo cargo
          </v-btn>
        </PlanLock>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="roleSearch"
          label="Buscar cargo"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
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
          hide-details
        />
      </div>

      <div v-if="filteredChurchRoles.length" class="role-list app-surface pa-2">
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
          <PlanLock feature="CUSTOM_ROLES" class="ministry-actions">
            <div class="d-flex">
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
          </PlanLock>
        </div>
      </div>

      <v-card
        v-else-if="churchRoles.length === 0"
        class="app-surface pa-6 d-flex flex-column align-center justify-center"
      >
        <Shield size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum cargo criado ainda
        </p>
      </v-card>

      <v-card
        v-else
        class="app-surface pa-6 d-flex flex-column align-center justify-center"
      >
        <Shield size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum cargo encontrado
        </p>
      </v-card>
    </section>

    <section v-show="isChurchWideManager && activeSection === 'rol'" class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Rol de membros
          </h2>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Visitante, membro ou desligado - só você vê e mexe nisso. Uso interno pra saber pra quem mandar cada mensagem.
          </p>
        </div>
        <v-btn
          color="purple-darken-3"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="openCreateRosterDialog"
        >
          <UserPlus size="16" class="mr-2" /> Adicionar pessoa
        </v-btn>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="rosterSearch"
          label="Buscar por nome, e-mail ou telefone"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          hide-details
        />
        <v-select
          v-model="rosterStatusFilter"
          label="Situação"
          :items="rosterStatusFilterOptions"
          item-title="title"
          item-value="value"
          prepend-inner-icon="mdi-filter-outline"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          hide-details
        />
      </div>

      <v-alert
        v-if="rosterError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ rosterError }}
      </v-alert>

      <div v-if="rosterLoading" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate size="28" color="purple-darken-3" />
      </div>

      <v-card
        v-else-if="filteredRosterMembers.length === 0"
        class="app-surface pa-6 d-flex flex-column align-center justify-center"
      >
        <Users size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Ninguém encontrado com esse filtro
        </p>
      </v-card>

      <div v-else class="church-list pessoas-list">
        <v-card
          v-for="member in filteredRosterMembers"
          :key="member.id"
          class="member-card app-surface app-interactive-surface pa-3"
          role="button"
          tabindex="0"
          :aria-label="`Ver detalhes de ${member.name}`"
          @click="openEditRosterDialog(member)"
          @keydown.enter="openEditRosterDialog(member)"
          @keydown.space.prevent="openEditRosterDialog(member)"
        >
          <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
            <Users size="20" :color="accentColor" />
          </v-avatar>

          <div class="member-copy">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
              {{ member.name }}
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ [member.email, member.phone].filter(Boolean).join(" · ") || "Sem contato cadastrado" }}
            </p>
          </div>

          <div class="member-badges">
            <v-chip v-if="member.userId" size="small" color="indigo-darken-2" variant="tonal">
              Tem login
            </v-chip>
            <v-chip
              v-if="whatsappCheckResults[member.id] !== undefined"
              size="small"
              :color="whatsappCheckResults[member.id] ? 'teal-darken-2' : 'red-darken-2'"
              variant="tonal"
            >
              {{ whatsappCheckResults[member.id] ? "WhatsApp válido" : "Não é WhatsApp" }}
            </v-chip>
            <v-chip size="small" :color="rosterStatusColor(member.status)" variant="tonal">
              {{ rosterStatusLabel(member.status) }}
            </v-chip>
          </div>
        </v-card>
      </div>
    </section>

    <UtilsResponsiveOverlay v-model="isRosterDialogOpen" max-width="480">
      <v-card class="app-surface pa-5" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            {{ editingRosterId ? "Editar pessoa" : "Adicionar ao rol" }}
          </h2>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isRosterDialogOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field
          v-model="rosterForm.name"
          label="Nome"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model="rosterForm.email"
          label="E-mail (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model="rosterForm.phone"
          label="Telefone (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model="rosterForm.birthDate"
          label="Data de nascimento (opcional)"
          type="date"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-textarea
          v-model="rosterForm.notes"
          label="Observações (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
          rows="2"
          auto-grow
        />

        <div v-if="rosterEditingMember && rosterEditingMember.phone" class="roster-status-actions mb-4">
          <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">WhatsApp</p>
          <div class="d-flex flex-wrap align-center gap-2">
            <v-btn
              variant="tonal"
              color="teal-darken-2"
              size="small"
              class="text-none"
              :loading="whatsappCheckLoadingId === rosterEditingMember.id"
              @click="handleCheckRosterWhatsApp(rosterEditingMember)"
            >
              Verificar WhatsApp
            </v-btn>
            <v-chip
              v-if="whatsappCheckResults[rosterEditingMember.id] !== undefined"
              size="small"
              :color="whatsappCheckResults[rosterEditingMember.id] ? 'teal-darken-2' : 'red-darken-2'"
              variant="tonal"
            >
              {{ whatsappCheckResults[rosterEditingMember.id] ? "Número válido no WhatsApp" : "Número não é WhatsApp" }}
            </v-chip>
          </div>
        </div>

        <div v-if="rosterEditingMember" class="roster-status-actions mb-4">
          <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">Situação</p>
          <div class="d-flex flex-wrap gap-2">
            <v-btn
              v-if="rosterEditingMember.status === 'VISITOR'"
              variant="tonal"
              color="teal-darken-2"
              size="small"
              class="text-none"
              :loading="rosterActionLoadingId === rosterEditingMember.id"
              @click="handlePromoteRoster(rosterEditingMember)"
            >
              Tornar membro
            </v-btn>

            <v-btn
              v-if="rosterEditingMember.status !== 'FORMER'"
              variant="tonal"
              color="grey-darken-1"
              size="small"
              class="text-none"
              :loading="rosterActionLoadingId === rosterEditingMember.id"
              @click="handleMarkRosterAsLeft(rosterEditingMember)"
            >
              Desligar
            </v-btn>

            <v-btn
              v-else
              variant="tonal"
              color="teal-darken-2"
              size="small"
              class="text-none"
              :loading="rosterActionLoadingId === rosterEditingMember.id"
              @click="handleRestoreRoster(rosterEditingMember)"
            >
              Restaurar
            </v-btn>

            <v-btn
              v-if="!rosterEditingMember.userId"
              variant="text"
              color="red-darken-2"
              size="small"
              class="text-none"
              @click="handleDeleteRoster(rosterEditingMember)"
            >
              Excluir pessoa
            </v-btn>
          </div>
        </div>

        <v-alert
          v-if="rosterFormError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ rosterFormError }}
        </v-alert>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isRosterDialogOpen = false">
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            variant="flat"
            class="text-none font-weight-bold"
            :loading="isSavingRoster"
            @click="handleSaveRoster"
          >
            Salvar
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isMemberDialogOpen" max-width="520">
      <v-card class="app-surface pa-5" elevation="0">
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

    <UtilsResponsiveOverlay v-model="isMemberDetailsOpen" max-width="520">
      <v-card v-if="selectedMember" class="app-surface pa-5" elevation="0">
        <div class="responsive-dialog-header mb-4">
          <div class="d-flex align-center min-w-0">
            <v-avatar
              :color="avatarBgIndigo"
              size="48"
              class="mr-3 member-detail-avatar"
              :style="{ borderColor: accentColor }"
            >
              <span class="member-detail-avatar-initials" :style="{ color: accentColor }">
                {{ selectedMemberInitials }}
              </span>
            </v-avatar>
            <div class="min-w-0">
              <div class="d-flex align-center ga-2 flex-wrap">
                <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                  {{ selectedMember.name }}
                </h2>
                <v-chip size="x-small" variant="tonal" color="purple-darken-3" class="text-none font-weight-bold">
                  {{ selectedMember.role === "PASTOR" ? "Pastor" : "Membro" }}
                </v-chip>
              </div>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                {{ selectedMember.email }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeMemberDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-dialog-rule mb-4" />

        <div class="member-info mb-5 pa-3 rounded-lg bg-grey-lighten-5">
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
          class="admin-input mb-4"
          hide-details="auto"
          :readonly="!canManageMembersByRole || !canEditSelectedMember"
          :disabled="isUpdatingMember"
        />

        <div class="member-dialog-rule mb-4" />

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

    <UtilsResponsiveOverlay v-model="isRoleDialogOpen" max-width="480">
      <v-card class="role-dialog-card app-surface pa-5" elevation="0">
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

        <div v-if="presetRoleOptions.length" class="role-preset-panel mb-4">
          <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
            Modelos rápidos
          </p>
          <div class="role-preset-actions">
            <v-btn
              v-for="preset in presetRoleOptions"
              :key="preset.value"
              :variant="selectedRolePreset === preset.value ? 'flat' : 'tonal'"
              :color="selectedRolePreset === preset.value ? 'purple-darken-3' : 'grey-darken-2'"
              size="small"
              class="text-none role-preset-button"
              @click="chooseRolePreset(preset.value)"
            >
              {{ preset.label }}
            </v-btn>
          </div>
        </div>

        <div class="role-permission-header mb-3">
          <div>
            <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
              Permissões
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ roleForm.permissions.length }} de {{ totalVisiblePermissions }} ativas
            </p>
          </div>
          <div class="role-permission-actions">
            <button
              type="button"
              class="role-permission-action-link"
              @click="selectAllVisiblePermissions"
            >
              Marcar todas
            </button>
            <span class="role-permission-action-divider">·</span>
            <button
              type="button"
              class="role-permission-action-link"
              @click="clearAllVisiblePermissions"
            >
              Limpar
            </button>
          </div>
        </div>
        <div class="permission-module-list mb-4">
          <div
            v-for="module in visibleRoleModules"
            :key="module.key"
            class="permission-module-card"
            :class="{ 'permission-module-card--full': countModuleSelected(module) === module.permissions.length }"
          >
            <button
              type="button"
              class="permission-module-title"
              @click="toggleModuleExpanded(module.key)"
            >
              <div class="permission-module-icon">
                <component :is="moduleIcon(module.key)" size="15" />
              </div>
              <div class="permission-module-title-text">
                <strong>{{ module.label }}</strong>
                <span>{{ module.description }}</span>
              </div>
              <div class="permission-module-meta">
                <v-chip
                  size="x-small"
                  color="purple-darken-3"
                  :variant="countModuleSelected(module) === 0 ? 'outlined' : countModuleSelected(module) === module.permissions.length ? 'flat' : 'tonal'"
                >
                  {{ countModuleSelected(module) }}/{{ module.permissions.length }}
                </v-chip>
                <ChevronDown
                  size="16"
                  class="permission-module-chevron"
                  :class="{ 'permission-module-chevron--open': isModuleExpanded(module.key) }"
                />
              </div>
            </button>

            <Transition name="permission-body">
              <div v-show="isModuleExpanded(module.key)" class="permission-module-body">
                <div
                  v-for="perm in module.permissions"
                  :key="perm.key"
                  class="permission-row"
                >
                  <div class="permission-row-text">
                    <p class="text-body-2 font-weight-medium mb-0">{{ perm.label }}</p>
                    <p class="text-caption text-grey-darken-1 mb-0">{{ perm.description }}</p>
                  </div>
                  <v-switch
                    v-model="roleForm.permissions"
                    :value="perm.key"
                    color="purple-darken-3"
                    density="compact"
                    hide-details
                    class="permission-row-switch"
                  />
                </div>
              </div>
            </Transition>
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

    <UtilsConfirmDialog
      v-model="isDeleteDialogOpen"
      :title="deleteDialogTitle"
      :message="deleteDialogMessage"
      :loading="isConfirmingDelete"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </div>

  <div v-else class="pa-4 app-operational-page min-vh-100 pb-20">
    <v-card
      class="app-surface pa-6 d-flex flex-column align-center justify-center permission-empty"
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  UserPlus,
  UserCheck,
  Users,
  Clock,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Shield,
  ChevronDown,
  ChevronLeft,
  Music,
  Calendar,
  Bell,
  Settings2,
  BookMarked,
  Church,
  HandHeart,
  Megaphone,
} from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { useMembers, type ChurchMember, type PendingMember } from "../../../composables/useMembers";
import { useDepartments, type ChurchDepartment } from "../../../composables/useDepartments";
import {
  useChurchRoles,
  type ChurchRole,
  type MemberRole,
} from "../../../composables/useChurchRoles";
import {
  usePermissions,
  PERMISSION_MODULES,
  modulesForScope,
  ROLE_PRESETS,
  type PermissionModule,
  type PermissionModuleKey,
  type PermissionScope,
  type AppPermission,
} from "../../../composables/usePermissions";
import { useRoster, type RosterMember, type RosterStatus } from "../../../composables/useRoster";

const router = useRouter();
const route = useRoute();

const { user } = useAuth();
const { isDark } = useThemeMode();
const { can } = usePermissions();

const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

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

type PessoasSection = "membros" | "cargos" | "rol";
const pessoasSubTabs = computed(() => {
  const tabs: { value: PessoasSection; label: string }[] = [
    { value: "membros", label: "Membros" },
  ];
  if (isChurchWideManager.value) {
    tabs.push({ value: "cargos", label: "Cargos" }, { value: "rol", label: "Rol" });
  }
  return tabs;
});
const activeSection = ref<PessoasSection>("membros");

const normalizePessoasSection = (section: unknown): PessoasSection => {
  const value = Array.isArray(section) ? section[0] : section;
  if (value === "cargos" || value === "rol" || value === "membros") return value;
  return "membros";
};

const selectPessoasSection = (section: PessoasSection) => {
  activeSection.value = section;
  router.replace({
    query: {
      ...route.query,
      secao: section === "membros" ? undefined : section,
    },
  });
};

watch(
  [() => route.query.secao, pessoasSubTabs],
  ([section]) => {
    const nextSection = normalizePessoasSection(section);
    const allowedSections = new Set(pessoasSubTabs.value.map((tab) => tab.value));
    activeSection.value = allowedSections.has(nextSection) ? nextSection : "membros";
  },
  { immediate: true },
);

const normalizeFilterText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// ── Ministérios (so o necessario pro seletor de "Ministério" do cargo e
// pro badge de "Líder" na lista de membros - a aba Ministérios em si
// continua em admin/index.vue) ──────────────────────────────
const { getDepartments } = useDepartments();
const departments = ref<ChurchDepartment[]>([]);
const departmentsError = ref("");

const loadDepartments = async () => {
  departmentsError.value = "";
  const { data, error } = await getDepartments();
  if (error) {
    departmentsError.value = error;
    return;
  }
  departments.value = data ?? [];
};

// ── Membros ──────────────────────────────────────────────
const {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getPendingMembers,
  approveMember,
  rejectMember,
} = useMembers();

const members = ref<ChurchMember[]>([]);
const pendingMembers = ref<PendingMember[]>([]);
const pendingMembersError = ref("");
const pendingActionId = ref<string | null>(null);
const membersError = ref("");
const memberSearch = ref("");
const memberTypeFilter = ref<"ALL" | "PASTOR" | "MEMBER" | "ADMIN">("ALL");
const memberRoleFilter = ref<string | null>("ALL");
const showPassword = ref(false);
const createMemberError = ref("");
const isCreatingMember = ref(false);
const isUpdatingMember = ref(false);
const isMemberDialogOpen = ref(false);
const isMemberDetailsOpen = ref(false);
const permissionError = ref("");
const selectedMember = ref<ChurchMember | null>(null);
const selectedMemberInitials = computed(() => {
  const parts = selectedMember.value?.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
});
const pendingDeleteMember = ref<ChurchMember | null>(null);
const isConfirmingDelete = ref(false);
const selectedChurchMemberRoleId = ref<string | null>(null);

const canEditMemberPermissions = computed(
  () =>
    isChurchWideManager.value &&
    selectedMember.value?.id !== user.value?.id,
);
const isCurrentUserSuperAdmin = computed(() => user.value?.role === "SUPER_ADMIN");
const isProtectedSuperAdmin = (member?: { role?: string } | null) =>
  member?.role === "SUPER_ADMIN" && !isCurrentUserSuperAdmin.value;
const isTitularMember = (member?: { id?: string } | null) =>
  Boolean(member?.id && user.value?.church?.userMainId === member.id);
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

const memberTypeOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Pastores", value: "PASTOR" },
  { label: "Membros", value: "MEMBER" },
  { label: "Admins", value: "ADMIN" },
];

const memberForm = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
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

const loadPendingMembers = async () => {
  pendingMembersError.value = "";

  const { data, error } = await getPendingMembers();

  if (error) {
    pendingMembersError.value = error;
    return;
  }

  pendingMembers.value = data ?? [];
};

const handleApproveMember = async (membershipId: string) => {
  pendingActionId.value = membershipId;
  pendingMembersError.value = "";

  const { error } = await approveMember(membershipId);
  pendingActionId.value = null;

  if (error) {
    pendingMembersError.value = error;
    return;
  }

  pendingMembers.value = pendingMembers.value.filter(
    (member) => member.membershipId !== membershipId,
  );
  await loadMembers();
};

const handleRejectMember = async (membershipId: string) => {
  pendingActionId.value = membershipId;
  pendingMembersError.value = "";

  const { error } = await rejectMember(membershipId);
  pendingActionId.value = null;

  if (error) {
    pendingMembersError.value = error;
    return;
  }

  pendingMembers.value = pendingMembers.value.filter(
    (member) => member.membershipId !== membershipId,
  );
};

const resetMemberForm = () => {
  memberForm.name = "";
  memberForm.email = "";
  memberForm.phone = "";
  memberForm.password = "";
  showPassword.value = false;
};

const closeMemberDialog = () => {
  isMemberDialogOpen.value = false;
  createMemberError.value = "";
  resetMemberForm();
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

// Dialogo generico de exclusao, mesmo padrao do isDeleteDialogOpen em
// admin/index.vue - so que aqui so existe o caso "membro" (departamento/
// admin user/igreja sao do modo Plataforma, que fica em index.vue).
const isDeleteDialogOpen = computed({
  get: () => Boolean(pendingDeleteMember.value),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingDeleteMember.value = null;
    }
  },
});

const deleteDialogTitle = computed(() => "Remover membro");

const deleteDialogMessage = computed(() => {
  if (pendingDeleteMember.value) {
    return `O membro ${pendingDeleteMember.value.name} será removido desta igreja.`;
  }
  return "Essa ação não pode ser desfeita.";
});

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) {
    pendingDeleteMember.value = null;
  }
};

const confirmDelete = async () => {
  if (pendingDeleteMember.value) {
    await confirmDeleteMember();
  }
};

// ── Cargos (RBAC) ──────────────────────────────────────────────
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
const roleSearch = ref("");
const roleModuleFilter = ref<PermissionModuleKey | "ALL">("ALL");

const isDeleteRoleDialogOpen = computed({
  get: () => Boolean(pendingDeleteRoleId.value),
  set: (v: boolean) => { if (!v) pendingDeleteRoleId.value = ""; },
});

const permissionModuleFilterOptions = computed(() => [
  { label: "Todos", value: "ALL" },
  ...PERMISSION_MODULES.map((module) => ({
    label: module.label,
    value: module.key,
  })),
]);

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

const chooseRolePreset = (presetKey: string) => {
  selectedRolePreset.value = presetKey;
  applyRolePreset(presetKey);
};

const countModuleSelected = (module: PermissionModule) =>
  module.permissions.filter((perm) => roleForm.permissions.includes(perm.key)).length;

// Icone por modulo so pra escaneabilidade na lista de cargos - nao faz
// parte do modelo de dados (usePermissions.ts), e so apresentacao.
const moduleIconMap = {
  songs: Music,
  schedules: Calendar,
  ministryMembers: UserPlus,
  ministryNotify: Bell,
  ministry: Settings2,
  members: UserCheck,
  cults: Church,
  pastoralCare: HandHeart,
  content: BookMarked,
  announcements: Megaphone,
} as const;

const moduleIcon = (key: PermissionModuleKey) => moduleIconMap[key];

const totalVisiblePermissions = computed(() =>
  visibleRoleModules.value.reduce((total, module) => total + module.permissions.length, 0),
);

const selectAllVisiblePermissions = () => {
  const visibleKeys = visibleRoleModules.value.flatMap((module) =>
    module.permissions.map((perm) => perm.key),
  );
  roleForm.permissions = [...new Set([...roleForm.permissions, ...visibleKeys])];
};

const clearAllVisiblePermissions = () => {
  const visibleKeys = new Set(
    visibleRoleModules.value.flatMap((module) => module.permissions.map((perm) => perm.key)),
  );
  roleForm.permissions = roleForm.permissions.filter((perm) => !visibleKeys.has(perm));
};

// Colapsavel por modulo - comeca tudo aberto pra nao esconder nada na
// primeira visita; guarda estado por module.key, nao por indice.
const expandedPermissionModules = reactive<Record<string, boolean>>({});

const isModuleExpanded = (moduleKey: PermissionModuleKey) =>
  expandedPermissionModules[moduleKey] !== false;

const toggleModuleExpanded = (moduleKey: PermissionModuleKey) => {
  expandedPermissionModules[moduleKey] = !isModuleExpanded(moduleKey);
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
// (Versao trimmed desta pagina: so members/selectedMember existem aqui -
// selectedAdminUser/selectedChurch sao do modo Plataforma, que fica em
// admin/index.vue.)
const applyMemberRoles = (memberId: string, roles: MemberRole[]) => {
  members.value = members.value.map((m) =>
    m.id === memberId ? { ...m, roles } : m,
  );
  if (selectedMember.value?.id === memberId) {
    selectedMember.value = { ...selectedMember.value, roles };
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

// ── Rol (roster) ──────────────────────────────────────────────
const {
  listRosterMembers,
  createRosterMember,
  updateRosterMember,
  promoteRosterMember,
  markRosterMemberAsLeft,
  restoreRosterMember,
  deleteRosterMember,
  checkRosterMemberWhatsApp,
} = useRoster();

const rosterMembers = ref<RosterMember[]>([]);
const rosterLoading = ref(false);
const rosterError = ref("");
const rosterSearch = ref("");
const rosterStatusFilter = ref<RosterStatus | "ALL" | "ACTIVE">("ACTIVE");
const rosterStatusFilterOptions = [
  { title: "Ativos (visitantes + membros)", value: "ACTIVE" },
  { title: "Visitantes", value: "VISITOR" },
  { title: "Membros", value: "MEMBER" },
  { title: "Desligados", value: "FORMER" },
  { title: "Todos", value: "ALL" },
];

const isRosterDialogOpen = ref(false);
const editingRosterId = ref("");
const isSavingRoster = ref(false);
const rosterFormError = ref("");
const rosterForm = reactive({
  name: "",
  email: "",
  phone: "",
  birthDate: "",
  notes: "",
});
const rosterActionLoadingId = ref("");
// Resultado do "Verificar WhatsApp" por pessoa (id -> existe ou nao no
// WhatsApp) - so em memoria, some ao recarregar a lista, ja que o numero
// pode mudar de status a qualquer momento e nao faz sentido persistir.
const whatsappCheckResults = reactive<Record<string, boolean>>({});
const whatsappCheckLoadingId = ref("");

const loadRoster = async () => {
  if (!isChurchWideManager.value) return;
  rosterLoading.value = true;
  rosterError.value = "";
  const filter = rosterStatusFilter.value === "ACTIVE" ? undefined : rosterStatusFilter.value;
  const { data, error } = await listRosterMembers(filter as never);
  if (error) rosterError.value = error;
  rosterMembers.value = data ?? [];
  rosterLoading.value = false;
};

watch(rosterStatusFilter, loadRoster);

const filteredRosterMembers = computed(() => {
  const term = rosterSearch.value.trim().toLowerCase();
  if (!term) return rosterMembers.value;
  return rosterMembers.value.filter(
    (member) =>
      member.name.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term) ||
      member.phone?.toLowerCase().includes(term),
  );
});

const rosterStatusLabel = (status: RosterStatus) =>
  status === "VISITOR" ? "Visitante" : status === "MEMBER" ? "Membro" : "Desligado";

const rosterStatusColor = (status: RosterStatus) =>
  status === "VISITOR" ? "amber-darken-3" : status === "MEMBER" ? "teal-darken-2" : "grey-darken-1";

const resetRosterForm = () => {
  rosterForm.name = "";
  rosterForm.email = "";
  rosterForm.phone = "55";
  rosterForm.birthDate = "";
  rosterForm.notes = "";
  rosterFormError.value = "";
};

const openCreateRosterDialog = () => {
  editingRosterId.value = "";
  resetRosterForm();
  isRosterDialogOpen.value = true;
};

const openEditRosterDialog = (member: RosterMember) => {
  editingRosterId.value = member.id;
  rosterForm.name = member.name;
  rosterForm.email = member.email || "";
  rosterForm.phone = member.phone || "";
  rosterForm.birthDate = member.birthDate ? member.birthDate.slice(0, 10) : "";
  rosterForm.notes = member.notes || "";
  rosterFormError.value = "";
  isRosterDialogOpen.value = true;
};

const handleSaveRoster = async () => {
  if (!rosterForm.name.trim()) {
    rosterFormError.value = "Nome é obrigatório";
    return;
  }

  isSavingRoster.value = true;
  rosterFormError.value = "";

  const payload = {
    name: rosterForm.name,
    email: rosterForm.email,
    phone: rosterForm.phone,
    birthDate: rosterForm.birthDate,
    notes: rosterForm.notes,
  };

  const { error } = editingRosterId.value
    ? await updateRosterMember(editingRosterId.value, payload)
    : await createRosterMember(payload);

  isSavingRoster.value = false;

  if (error) {
    rosterFormError.value = error;
    return;
  }

  isRosterDialogOpen.value = false;
  await loadRoster();
};

const rosterEditingMember = computed(() =>
  rosterMembers.value.find((member) => member.id === editingRosterId.value) || null,
);

const handlePromoteRoster = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await promoteRosterMember(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

const handleMarkRosterAsLeft = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await markRosterMemberAsLeft(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

const handleRestoreRoster = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await restoreRosterMember(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

const handleCheckRosterWhatsApp = async (member: RosterMember) => {
  whatsappCheckLoadingId.value = member.id;
  rosterFormError.value = "";
  const { data, error } = await checkRosterMemberWhatsApp(member.id);
  whatsappCheckLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  whatsappCheckResults[member.id] = data?.exists ?? false;
};

const handleDeleteRoster = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await deleteRosterMember(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

onMounted(async () => {
  await Promise.all([
    canAccessChurchAdmin.value ? loadMembers() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadPendingMembers() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadDepartments() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadRoles() : Promise.resolve(),
    loadRoster(),
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
  border: 1px solid var(--app-color-border-subtle);
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.pessoas-header {
  margin-bottom: 16px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

.church-admin-section {
  min-width: 0;
}

.pessoas-subtabs {
  display: inline-flex;
  gap: 2px;
  max-width: 100%;
  overflow-x: auto;
}

.pessoas-subtab {
  flex: 0 0 auto;
  min-width: 86px;
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

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.permission-empty {
  min-height: 320px;
}

.admin-filter-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 12px;
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
}

.admin-input :deep(.v-field) {
  border-radius: 14px;
}

.admin-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.pending-members-card {
  overflow: hidden;
}

.pending-members-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: var(--app-color-warning-tint);
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.pending-member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.pending-member-row:last-child {
  border-bottom: none;
}

.pending-member-actions {
  display: flex;
  gap: 6px;
  flex: 0 0 auto;
}

.member-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.member-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.pessoas-list {
  display: grid;
  gap: 8px;
}

.member-avatar {
  align-self: start;
  width: 36px !important;
  height: 36px !important;
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

.role-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  border-bottom: 1px solid var(--app-color-border-subtle);
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

.role-permission-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 2px;
}

.role-permission-action-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--app-color-accent);
  cursor: pointer;
}

.role-permission-action-link:hover {
  text-decoration: underline;
}

.role-permission-action-divider {
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.78rem;
}

/* v-btn-toggle nao estica os filhos por padrao; sem isto os dois botoes de
   alcance do cargo ficam desalinhados/apertados em telas de celular.
   O min-height e necessario porque, nesse layout, o grupo e os botoes
   colapsam pra altura 0 (o --v-btn-height existe mas nao e aplicado),
   deixando "Um ministerio"/"Igreja toda" no DOM só que invisíveis. */
.role-scope-toggle {
  display: flex !important;
  width: 100%;
  min-height: 40px;
}

.role-scope-toggle :deep(.v-btn) {
  flex: 1 1 0;
  min-height: 40px;
}

.role-dialog-card {
  max-height: min(760px, calc(100vh - 32px));
  overflow-y: auto;
}

.role-preset-panel {
  padding: 12px;
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
}

.role-preset-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-preset-button {
  flex: 1 1 auto;
}

.permission-module-list {
  display: grid;
  gap: 10px;
}

.permission-module-card {
  border: 1px solid var(--app-color-border);
  border-radius: 10px;
  background: var(--app-color-surface-soft);
  padding: 13px 14px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.permission-module-card--full {
  background: var(--app-color-accent-tint);
  border-color: var(--app-color-accent-muted);
}

.permission-module-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.permission-module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-top: 1px;
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.permission-module-card--full .permission-module-icon {
  background: var(--app-color-surface);
}

.permission-module-title-text {
  flex: 1 1 auto;
  min-width: 0;
}

.permission-module-title-text strong,
.permission-module-title-text span {
  display: block;
}

.permission-module-title-text strong {
  color: var(--app-color-text, #111827);
  font-size: 0.86rem;
  font-weight: 850;
  transition: color 0.15s ease;
}

.permission-module-title:hover .permission-module-title-text strong {
  color: var(--app-color-accent);
}

.permission-module-title-text span {
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.74rem;
  font-weight: 650;
}

.permission-module-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding-top: 2px;
}

.permission-module-chevron {
  color: var(--app-color-text-muted, #6b7280);
  transition: transform 0.15s ease;
}

.permission-module-chevron--open {
  transform: rotate(180deg);
}

.permission-module-body {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  padding-top: 10px;
  padding-left: 38px;
  border-top: 1px solid var(--app-color-border);
}

.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--app-color-border);
}

.permission-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.permission-row-text {
  min-width: 0;
}

.permission-row-switch {
  flex-shrink: 0;
}

.permission-body-enter-active,
.permission-body-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.permission-body-enter-from,
.permission-body-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .permission-body-enter-active,
  .permission-body-leave-active,
  .permission-module-chevron,
  .permission-module-card,
  .permission-module-title-text strong {
    transition: none !important;
  }
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

.member-detail-avatar {
  border: 2px solid;
}

.member-detail-avatar-initials {
  font-size: 15px;
  font-weight: 800;
}

.member-dialog-rule {
  height: 2px;
  background: var(--app-color-border-subtle);
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

@media (min-width: 520px) {
  .member-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .admin-filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: start;
  }

  .member-avatar {
    width: 36px !important;
    height: 36px !important;
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
}
</style>
