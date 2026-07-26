"use server";

import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  resolveLocale,
  type Locale,
} from "./config";

/**
 * Ghi locale vào cookie. Sau khi gọi, phía client cần router.refresh() để
 * server render lại với bộ messages mới (URL không đổi).
 */
export async function setLocale(next: Locale) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, resolveLocale(next), {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
