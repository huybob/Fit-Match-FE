import { axiosClient } from "@/core/http/axios-client";
import { env } from "@/core/config/env";

/** Origin của API, để phân biệt file do BE phục vụ với object nằm trên bucket. */
function apiOrigin(): string {
  if (env.apiBaseUrl.startsWith("http")) return new URL(env.apiBaseUrl).origin;
  return typeof window !== "undefined" ? window.location.origin : "";
}

/**
 * Mở một file đã lưu (tài liệu KYC, bằng chứng tranh chấp, chứng chỉ).
 *
 * Hai đường, chọn theo nơi file thật sự nằm:
 *
 * - **Do BE phục vụ** (`/api/files/documents/**`): endpoint yêu cầu Bearer nên
 *   thẻ `<a href>` thuần bị 401. Tải qua axios (interceptor gắn token) rồi mở blob.
 * - **Object trên bucket** (URL tuyệt đối tới storage): mở thẳng. KHÔNG được đưa
 *   qua axios: interceptor gắn `Authorization: Bearer <JWT của app>` vào MỌI
 *   request, và GCS đọc header đó như credential Google — object public vẫn trả
 *   401 Invalid Credentials. Chưa kể header lạ làm trình duyệt preflight CORS mà
 *   bucket không khai báo, nên request còn không rời được máy khách.
 */
export async function openSecureFile(url: string) {
  const isAbsolute = /^https?:\/\//i.test(url);
  if (isAbsolute && !url.startsWith(apiOrigin())) {
    window.open(url, "_blank", "noopener");
    return;
  }

  const response = await axiosClient.get<Blob>(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(response.data);
  window.open(objectUrl, "_blank", "noopener");
  // Thu hồi sau 1 phút — đủ thời gian tab mới nạp nội dung.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
