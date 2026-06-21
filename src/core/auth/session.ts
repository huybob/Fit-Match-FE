"use client";

import { useAuthStore } from "@/modules/auth/auth.store";
import type { AuthUser } from "@/services/auth.service";

export type SessionUser = AuthUser;

export function getCurrentUser(): SessionUser | null {
  return useAuthStore.getState().user;
}
