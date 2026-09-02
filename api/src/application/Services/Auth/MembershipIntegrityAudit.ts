export type MembershipAuditRole = {
  id: string;
  name: string;
  crunchId: string;
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

export type MembershipAuditAssignment = {
  churchRole: MembershipAuditRole | null;
};

export type MembershipAuditMembership = {
  id: string;
  crunchId: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  membershipRoles: MembershipAuditAssignment[];
};

export type MembershipAuditUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  crunchId: string | null;
  memberships: MembershipAuditMembership[];
};

export type MembershipIssueCode =
  | "LEGACY_CHURCH_WITHOUT_MEMBERSHIP"
  | "LEGACY_CHURCH_NOT_ACTIVE"
  | "NO_ACTIVE_PRIMARY"
  | "MULTIPLE_ACTIVE_PRIMARY"
  | "MEMBERSHIP_WITHOUT_ROLE"
  | "ROLE_CHURCH_MISMATCH"
  | "INVALID_ROLE_SCOPE"
  | "MINISTRY_ROLE_WITHOUT_DEPARTMENT";

export function classifyMembershipIntegrity(
  user: MembershipAuditUser,
): MembershipIssueCode[] {
  const issues = new Set<MembershipIssueCode>();
  const activeMemberships = user.memberships.filter(
    (membership) => membership.isActive,
  );
  const activePrimaryMemberships = activeMemberships.filter(
    (membership) => membership.isPrimary,
  );

  if (user.crunchId) {
    const legacyMembership = user.memberships.find(
      (membership) => membership.crunchId === user.crunchId,
    );

    if (!legacyMembership) {
      issues.add("LEGACY_CHURCH_WITHOUT_MEMBERSHIP");
    } else if (!legacyMembership.isActive) {
      issues.add("LEGACY_CHURCH_NOT_ACTIVE");
    }
  }

  if (activeMemberships.length > 0 && activePrimaryMemberships.length === 0) {
    issues.add("NO_ACTIVE_PRIMARY");
  }

  if (activePrimaryMemberships.length > 1) {
    issues.add("MULTIPLE_ACTIVE_PRIMARY");
  }

  for (const membership of user.memberships) {
    if (!membership.role.trim()) {
      issues.add("MEMBERSHIP_WITHOUT_ROLE");
    }

    for (const assignment of membership.membershipRoles) {
      const churchRole = assignment.churchRole;

      if (!churchRole) {
        issues.add("MEMBERSHIP_WITHOUT_ROLE");
        continue;
      }

      if (churchRole.crunchId !== membership.crunchId) {
        issues.add("ROLE_CHURCH_MISMATCH");
      }

      if (churchRole.scope !== "CHURCH" && churchRole.scope !== "MINISTRY") {
        issues.add("INVALID_ROLE_SCOPE");
      }

      if (churchRole.scope === "MINISTRY" && !churchRole.departmentId) {
        issues.add("MINISTRY_ROLE_WITHOUT_DEPARTMENT");
      }
    }
  }

  return [...issues];
}
