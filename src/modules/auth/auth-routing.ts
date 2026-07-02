import type { AuthUser } from "@/services/auth.service";

export type UserRole = NonNullable<AuthUser["role"]>;

export function getHomeRouteForRole(role?: AuthUser["role"]) {
  if (role === "ROLE_ADMIN") return "/admin";
  if (role === "ROLE_GYM_OPERATOR") return "/gym";
  if (role === "ROLE_PT") return "/trainer";
  return "/";
}

// Role hierarchy: Customer (lowest) < PT / Gym (middle, siblings) < Admin (highest).
// A higher-ranked role inherits access to pages that a lower-ranked role can open.
// PT and Gym share the same rank, so they cannot access each other's pages.
const ROLE_RANK: Record<UserRole, number> = {
  ROLE_CUSTOMER: 0,
  ROLE_PT: 1,
  ROLE_GYM_OPERATOR: 1,
  ROLE_ADMIN: 2,
};

export function roleSatisfies(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  if (userRole === requiredRole) return true;
  if (userRole === "ROLE_ADMIN") return true; // admin can access everything
  return ROLE_RANK[userRole] > ROLE_RANK[requiredRole];
}
