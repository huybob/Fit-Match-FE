import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <AuthGuard roles={["ROLE_CUSTOMER", "ROLE_ADMIN"]}>{children}</AuthGuard>;
}
