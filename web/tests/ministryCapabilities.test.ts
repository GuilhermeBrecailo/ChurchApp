import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMinistryCapabilities } from "../app/utils/ministryCapabilities";

const department = { id: "louvor", leaderId: "lider-1" };
const member = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  role: "MEMBRO",
  is_admin: false,
  roles: [],
  ...overrides,
});

describe("o que a pessoa pode fazer num ministério", () => {
  it("pastor pode tudo, inclusive trocar líder e excluir", () => {
    const caps = resolveMinistryCapabilities(member({ role: "PASTOR" }), department);
    assert.deepEqual(caps, {
      isLeader: false,
      canManage: true,
      canManagePeople: true,
      canGiveCargo: true,
      canManageSchedules: true,
      canManageSongs: true,
      canNotify: true,
      canChangeLeader: true,
      canDelete: true,
      hasAnyManagement: true,
    });
  });

  it("líder titular gerencia o próprio ministério, mas não troca líder nem exclui", () => {
    const caps = resolveMinistryCapabilities(member({ id: "lider-1" }), department);
    assert.equal(caps.isLeader, true);
    assert.equal(caps.canManage, true);
    assert.equal(caps.canManagePeople, true);
    assert.equal(caps.canGiveCargo, true);
    assert.equal(caps.canNotify, true);
    assert.equal(caps.canManageSchedules, true);
    assert.equal(caps.canChangeLeader, false);
    assert.equal(caps.canDelete, false);
  });

  it("membro comum só vê", () => {
    const caps = resolveMinistryCapabilities(member(), {
      ...department,
      canManageSchedule: false,
      canManageSongs: false,
    });
    assert.equal(caps.hasAnyManagement, false);
    assert.equal(caps.canManage, false);
    assert.equal(caps.canManagePeople, false);
  });

  it("cargo de escalas neste ministério: monta escala, mas não configura nem dá cargo", () => {
    const user = member({
      roles: [{ scope: "MINISTRY", departmentId: "louvor", permissions: ["SCHEDULE_CREATE"] }],
    });
    const caps = resolveMinistryCapabilities(user, department);
    assert.equal(caps.canManageSchedules, true);
    assert.equal(caps.canManage, false);
    assert.equal(caps.canGiveCargo, false);
    assert.equal(caps.hasAnyManagement, true);
  });

  it("cargo de outro ministério não vale aqui", () => {
    const user = member({
      roles: [{ scope: "MINISTRY", departmentId: "infantil", permissions: ["MINISTRY_MANAGE", "MINISTRY_MEMBER_MANAGE"] }],
    });
    const caps = resolveMinistryCapabilities(user, department);
    assert.equal(caps.canManage, false);
    assert.equal(caps.canManagePeople, false);
  });

  it("confia no canManageSchedule/canManageSongs calculado pela API", () => {
    const caps = resolveMinistryCapabilities(member(), {
      ...department,
      canManageSchedule: true,
      canManageSongs: true,
    });
    assert.equal(caps.canManageSchedules, true);
    assert.equal(caps.canManageSongs, true);
  });

  it("sem usuário ou ministério, nada", () => {
    assert.equal(resolveMinistryCapabilities(null, department).hasAnyManagement, false);
    assert.equal(resolveMinistryCapabilities(member({ role: "PASTOR" }), null).canManage, false);
  });
});
