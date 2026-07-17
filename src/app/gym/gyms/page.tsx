import { redirect } from "next/navigation";

// Phase 4 (audit A-14/B-37): route stub của mô hình PT độc lập cũ — chuyển về trang thật.
export default function LegacyStubRedirect() {
  redirect("/gym/branches");
}
