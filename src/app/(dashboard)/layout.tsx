import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthGuard roles={["ROLE_ADMIN"]}>{children}</AuthGuard>;
}
