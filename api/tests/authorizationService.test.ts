import {
  hasPermission,
  isPrivilegedRole,
  AuthUser,
} from "../src/application/Services/Auth/AuthorizationService";

const LOUVOR = "dept-louvor";
const INFANTIL = "dept-infantil";

function member(roles: AuthUser["roles"] = []): AuthUser {
  return { role: "MEMBER", roles };
}

describe("isPrivilegedRole", () => {
  it("treats pastor/admin/super and platform admin as privileged", () => {
    expect(isPrivilegedRole({ role: "PASTOR" })).toBe(true);
    expect(isPrivilegedRole({ role: "ADMIN" })).toBe(true);
    expect(isPrivilegedRole({ role: "SUPER_ADMIN" })).toBe(true);
    expect(isPrivilegedRole({ role: "MEMBER", isPlatformAdmin: true })).toBe(true);
    expect(isPrivilegedRole({ role: "MEMBER" })).toBe(false);
  });
});

describe("hasPermission", () => {
  it("lets a member with a ministry role create songs in that ministry (the bug)", () => {
    const user = member([
      { scope: "MINISTRY", departmentId: LOUVOR, permissions: ["SONG_CREATE"] },
    ]);
    expect(hasPermission(user, "SONG_CREATE", { departmentId: LOUVOR })).toBe(true);
  });

  it("keeps the ministry role scoped to its own ministry", () => {
    const user = member([
      { scope: "MINISTRY", departmentId: LOUVOR, permissions: ["SONG_CREATE"] },
    ]);
    expect(hasPermission(user, "SONG_CREATE", { departmentId: INFANTIL })).toBe(false);
  });

  it("grants a privileged role every action without a role", () => {
    const pastor: AuthUser = { role: "PASTOR", roles: [] };
    expect(hasPermission(pastor, "SONG_DELETE", { departmentId: LOUVOR })).toBe(true);
    expect(hasPermission(pastor, "MEMBER_DELETE")).toBe(true);
  });

  it("gives the department leader full access to their ministry", () => {
    const leader = member();
    expect(
      hasPermission(leader, "SCHEDULE_DELETE", {
        departmentId: LOUVOR,
        isDepartmentLeader: true,
      }),
    ).toBe(true);
  });

  it("does not let a leader manage a different ministry", () => {
    const leader = member();
    expect(
      hasPermission(leader, "SCHEDULE_DELETE", {
        departmentId: INFANTIL,
        isDepartmentLeader: false,
      }),
    ).toBe(false);
  });

  it("respects action granularity (edit does not imply delete)", () => {
    const user = member([
      { scope: "MINISTRY", departmentId: LOUVOR, permissions: ["SONG_EDIT"] },
    ]);
    expect(hasPermission(user, "SONG_EDIT", { departmentId: LOUVOR })).toBe(true);
    expect(hasPermission(user, "SONG_DELETE", { departmentId: LOUVOR })).toBe(false);
    expect(hasPermission(user, "SONG_CREATE", { departmentId: LOUVOR })).toBe(false);
  });

  it("sums permissions across multiple roles", () => {
    const user = member([
      { scope: "MINISTRY", departmentId: LOUVOR, permissions: ["SONG_CREATE"] },
      { scope: "MINISTRY", departmentId: LOUVOR, permissions: ["SONG_DELETE"] },
    ]);
    expect(hasPermission(user, "SONG_CREATE", { departmentId: LOUVOR })).toBe(true);
    expect(hasPermission(user, "SONG_DELETE", { departmentId: LOUVOR })).toBe(true);
  });

  it("grants church permissions from a church role regardless of department", () => {
    const user = member([
      { scope: "CHURCH", departmentId: null, permissions: ["MEMBER_EDIT"] },
    ]);
    expect(hasPermission(user, "MEMBER_EDIT")).toBe(true);
  });

  it("does not let a ministry role grant church permissions", () => {
    const user = member([
      { scope: "MINISTRY", departmentId: LOUVOR, permissions: ["MEMBER_EDIT"] },
    ]);
    expect(hasPermission(user, "MEMBER_EDIT")).toBe(false);
  });

  it("rejects a plain member with no applicable role", () => {
    expect(hasPermission(member(), "SONG_CREATE", { departmentId: LOUVOR })).toBe(false);
    expect(hasPermission(member(), "CONTENT_PUBLISH")).toBe(false);
  });
});
