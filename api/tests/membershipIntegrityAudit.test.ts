import {
  classifyMembershipIntegrity,
  MembershipAuditUser,
} from "../src/application/Services/Auth/MembershipIntegrityAudit";

const churchA = "church-a";
const churchB = "church-b";

function role(
  crunchId: string,
  overrides: Partial<NonNullable<MembershipAuditUser["memberships"][number]["membershipRoles"][number]["churchRole"]>> = {},
) {
  return {
    id: "role-1",
    name: "Membro",
    crunchId,
    scope: "CHURCH",
    departmentId: null,
    permissions: [],
    ...overrides,
  };
}

function membership(
  crunchId: string,
  overrides: Partial<MembershipAuditUser["memberships"][number]> = {},
) {
  return {
    id: `membership-${crunchId}`,
    crunchId,
    role: "MEMBER",
    isActive: true,
    isPrimary: true,
    membershipRoles: [{ churchRole: role(crunchId) }],
    ...overrides,
  };
}

function user(overrides: Partial<MembershipAuditUser> = {}): MembershipAuditUser {
  return {
    id: "user-1",
    name: "Jean",
    email: "jean@example.com",
    role: "MEMBER",
    crunchId: churchA,
    memberships: [membership(churchA)],
    ...overrides,
  };
}

describe("classifyMembershipIntegrity", () => {
  it("accepts a user whose legacy church and active primary membership match", () => {
    expect(classifyMembershipIntegrity(user())).toEqual([]);
  });

  it("detects a legacy church without its membership row", () => {
    expect(
      classifyMembershipIntegrity(
        user({ memberships: [] }),
      ),
    ).toContain("LEGACY_CHURCH_WITHOUT_MEMBERSHIP");
  });

  it("detects an active user without a primary membership", () => {
    expect(
      classifyMembershipIntegrity(
        user({
          memberships: [
            membership(churchA, { isPrimary: false }),
          ],
        }),
      ),
    ).toContain("NO_ACTIVE_PRIMARY");
  });

  it("detects multiple active primary memberships", () => {
    expect(
      classifyMembershipIntegrity(
        user({
          memberships: [membership(churchA), membership(churchB)],
        }),
      ),
    ).toContain("MULTIPLE_ACTIVE_PRIMARY");
  });

  it("detects a role assigned from another church", () => {
    expect(
      classifyMembershipIntegrity(
        user({
          memberships: [
            membership(churchA, {
              membershipRoles: [{ churchRole: role(churchB) }],
            }),
          ],
        }),
      ),
    ).toContain("ROLE_CHURCH_MISMATCH");
  });

  it("detects a ministry role without a department", () => {
    expect(
      classifyMembershipIntegrity(
        user({
          memberships: [
            membership(churchA, {
              membershipRoles: [
                {
                  churchRole: role(churchA, {
                    scope: "MINISTRY",
                    departmentId: null,
                  }),
                },
              ],
            }),
          ],
        }),
      ),
    ).toContain("MINISTRY_ROLE_WITHOUT_DEPARTMENT");
  });
});
