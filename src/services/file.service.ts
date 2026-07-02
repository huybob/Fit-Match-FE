import { api } from "@/services/api";
import { env } from "@/core/config/env";

export interface FileUploadResponse {
  url: string;
}

export type UploadFolder = "avatars" | "documents" | "certifications";

export const fileService = {
  upload: (file: File, folder: UploadFolder = "documents") => {
    const form = new FormData();
    form.append("file", file);
    return api.post<FileUploadResponse, FormData>("/files/upload", form, {
      params: { folder },
    });
  },
};

/**
 * Resolve a stored file URL (which may be absolute or a server-relative path)
 * into a fully-qualified URL usable in <img src> / links.
 */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  const origin = env.apiBaseUrl.startsWith("http")
    ? new URL(env.apiBaseUrl).origin
    : typeof window !== "undefined"
      ? window.location.origin
      : "";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}
