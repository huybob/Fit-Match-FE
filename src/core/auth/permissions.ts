import { SessionUser } from "./session";

export function hasPermission(user: SessionUser | null, roles: SessionUser["role"][]) {
  return Boolean(user?.role && roles.includes(user.role));
}
