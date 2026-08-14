import { redirect } from "next/navigation";

// Phase 4 (audit A-14/B-37): route stub của mô hình PT độc lập cũ — chuyển về trang thật.
export default function LegacyStubRedirect() {
  // /trainer/bookings chưa từng tồn tại — stub này vốn vẫn cho 404. Các stub PT
  // khác đều về /trainer, giữ cho nhất quán.
  redirect("/trainer");
}
