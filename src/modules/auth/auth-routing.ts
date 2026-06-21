import type { AuthUser } from "@/services/auth.service";

export type UserRole = NonNullable<AuthUser["role"]>;

export function getHomeRouteForRole(role?: AuthUser["role"]) {
  if (role === "ROLE_ADMIN") return "/admin";
  if (role === "ROLE_GYM_OPERATOR") return "/schedule";
  if (role === "ROLE_PT") return "/trainer/profile";
  return "/profile";
}
