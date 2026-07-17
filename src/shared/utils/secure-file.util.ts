import { axiosClient } from "@/core/http/axios-client";

/**
 * B-6 (audit 2026-07-17): file KYC (/api/files/documents/**) yêu cầu Bearer —
 * thẻ <a href> thuần bị 401. Tải qua axios (interceptor gắn token) rồi mở blob.
 */
export async function openSecureFile(url: string) {
  const response = await axiosClient.get<Blob>(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(response.data);
  window.open(objectUrl, "_blank", "noopener");
  // Thu hồi sau 1 phút — đủ thời gian tab mới nạp nội dung.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
