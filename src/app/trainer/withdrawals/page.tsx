import { redirect } from "next/navigation";

// Phase 4 (audit A-14/B-37): route stub của mô hình PT độc lập cũ — chuyển về trang thật.
// PT không có ví: PT làm việc dưới quyền phòng gym và được gym trả công ngoài nền tảng.
export default function LegacyStubRedirect() {
  redirect("/trainer");
}
