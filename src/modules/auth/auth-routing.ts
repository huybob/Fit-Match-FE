import type { AuthUser } from "@/services/auth.service";

export type UserRole = NonNullable<AuthUser["role"]>;

// A-15 (audit 2026-07-17): mỗi role về đúng workspace sau login (UC-003).
// MODERATOR/FINANCE_ADMIN về thẳng trang nghiệp vụ vì /admin (tổng quan = báo cáo
// vận hành) yêu cầu quyền ADMIN|FINANCE_ADMIN — moderator vào sẽ bị BE trả 403.
export function getHomeRouteForRole(role?: AuthUser["role"]) {
  switch (role) {
    case "ROLE_ADMIN":
      return "/admin";
    case "ROLE_MODERATOR":
      return "/admin/disputes";
    case "ROLE_FINANCE_ADMIN":
      return "/admin/withdrawals";
    case "ROLE_GYM_OPERATOR":
      return "/gym";
    case "ROLE_PT":
      return "/trainer";
    default:
      return "/";
  }
}

// Role hierarchy: Customer (lowest) < PT / Gym / Moderator / Finance (middle, siblings)
// < Admin (highest). A higher-ranked role inherits access to pages that a lower-ranked
// role can open; siblings cannot access each other's pages.
// D-1/E-7 (audit 2026-07-17): bổ sung MODERATOR + FINANCE_ADMIN — trước đây 2 role này
// không có trong bảng rank nên bị chặn khỏi mọi trang có guard (undefined > n = false).
const ROLE_RANK: Record<UserRole, number> = {
  ROLE_CUSTOMER: 0,
  ROLE_PT: 1,
  ROLE_GYM_OPERATOR: 1,
  ROLE_MODERATOR: 1,
  ROLE_FINANCE_ADMIN: 1,
  ROLE_ADMIN: 2,
};

export function roleSatisfies(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  if (userRole === requiredRole) return true;
  if (userRole === "ROLE_ADMIN") return true; // admin can access everything
  return (ROLE_RANK[userRole] ?? -1) > (ROLE_RANK[requiredRole] ?? Number.MAX_SAFE_INTEGER);
}
