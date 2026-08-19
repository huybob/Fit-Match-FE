import { E2E } from "./env";

/**
 * Gọi API trực tiếp — dùng cho HAI việc, không phải để thay UI:
 *
 *  1. assert trạng thái sau mỗi bước trên giao diện (rẻ và chắc hơn đọc DOM);
 *  2. những thứ không có giao diện: webhook, và ca đua ở nhóm E cần bắn nhiều
 *     request song song trong cùng một mili giây.
 *
 * Mọi thao tác NGƯỜI DÙNG phải đi qua UI — đó mới là thứ đợt test này kiểm.
 */
const tokens = new Map<string, string>();

export async function token(username: string, password: string): Promise<string> {
  const cached = tokens.get(username);
  if (cached) return cached;

  const response = await fetch(`${E2E.apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`Login that bai cho ${username}: ${response.status} ${await response.text()}`);
  }
  const json = await response.json();
  const accessToken = json?.data?.accessToken;
  if (!accessToken) throw new Error(`Khong lay duoc token cho ${username}`);
  tokens.set(username, accessToken);
  return accessToken;
}

export function forgetToken(username: string): void {
  tokens.delete(username);
}

export interface ApiResult<T> {
  status: number;
  ok: boolean;
  message: string;
  data: T;
}

export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; as?: { username: string; password: string } } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.as) headers.Authorization = `Bearer ${await token(init.as.username, init.as.password)}`;

  const response = await fetch(`${E2E.apiUrl}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const text = await response.text();
  let parsed: { message?: string; data?: T } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { message: text.slice(0, 200) };
  }
  return {
    status: response.status,
    ok: response.ok,
    message: parsed.message ?? "",
    data: parsed.data as T,
  };
}

export const asAdmin = E2E.accounts.admin;
export const asGym = E2E.accounts.gym;
export const asCustomer = E2E.accounts.customer;
export const asPt = { username: E2E.pt.username, password: E2E.pt.password };
