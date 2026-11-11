import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasChurchPermission,
  hasMinistryPermission,
  ministryIdsWithPermissions,
  resolveChurchAccess,
  type AccessUser,
} from "../app/utils/churchAccess";

const member = (overrides: Partial<AccessUser> = {}): AccessUser => ({
  hasChurch: true,
  role: "MEMBER",
  is_admin: false,
  roles: [],
  ...overrides,
});

describe("regra única de acesso", () => {
  it("pastor pode tudo na igreja", () => {
    const access = resolveChurchAccess(member({ role: "PASTOR" }));
    assert.equal(access.isChurchManager, true);
    assert.equal(access.canManagePeople, true);
    assert.equal(access.canModeratePrayer, true);
    assert.equal(access.canSendWhatsApp, true);
    assert.equal(access.hasManagementArea, true);
  });

  it("membro comum não tem área de gestão", () => {
    const access = resolveChurchAccess(member());
    assert.equal(access.isChurchManager, false);
    assert.equal(access.hasManagementArea, false);
    assert.equal(access.leadsMinistry, false);
  });

  it("equipe de oração modera pedidos sem virar gestora de pessoas", () => {
    const access = resolveChurchAccess(
      member({ roles: [{ scope: "CHURCH", departmentId: null, permissions: ["PRAYER_MANAGE"] }] }),
    );
    assert.equal(access.canModeratePrayer, true);
    assert.equal(access.canManagePeople, false);
    assert.equal(access.hasManagementArea, true);
  });

  it("cuidado pastoral vê o rol mas não manda WhatsApp", () => {
    const access = resolveChurchAccess(
      member({ roles: [{ scope: "CHURCH", departmentId: null, permissions: ["PASTORAL_CARE_MANAGE"] }] }),
    );
    assert.equal(access.canCare, true);
    assert.equal(access.canSeeRoster, true);
    assert.equal(access.canSendWhatsApp, false);
  });

  it("líder de ministério tem permissão só no ministério dele", () => {
    const user = member({
      roles: [{ scope: "MINISTRY", departmentId: "louvor", permissions: ["SCHEDULE_CREATE"] }],
    });
    assert.equal(hasMinistryPermission(user, "SCHEDULE_CREATE", "louvor"), true);
    assert.equal(hasMinistryPermission(user, "SCHEDULE_CREATE", "midia"), false);
    assert.equal(hasMinistryPermission(user, "SCHEDULE_CREATE"), true);
    assert.equal(hasChurchPermission(user, "SCHEDULE_CREATE"), false);
    assert.equal(resolveChurchAccess(user).leadsMinistry, true);
    assert.equal(resolveChurchAccess(user).hasManagementArea, false);
    assert.deepEqual(ministryIdsWithPermissions(user), ["louvor"]);
  });

  it("antigo canManageMembers continua valendo para pessoas", () => {
    assert.equal(resolveChurchAccess(member({ canManageMembers: true })).canManagePeople, true);
  });

  it("sem usuário, nada liberado", () => {
    const access = resolveChurchAccess(null);
    assert.equal(access.hasChurch, false);
    assert.equal(access.isChurchManager, false);
  });
});
