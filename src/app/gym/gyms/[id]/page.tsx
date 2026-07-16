import { redirect } from "next/navigation";

// Phase 4 (audit B-37): stub cũ — chi nhánh quản lý tại /gym/branches.
export default function LegacyStubRedirect() {
  redirect("/gym/branches");
}
