import { SessionUser } from "./session";

export function hasPermission(user: SessionUser | null, permission: string) {
  return Boolean(user?.roles.includes(permission));
}
