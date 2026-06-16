export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return null;
}
