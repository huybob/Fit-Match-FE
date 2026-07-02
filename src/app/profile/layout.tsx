import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  // Profile editing is available to every authenticated role (Customer, PT, Gym, Admin).
  return <AuthGuard>{children}</AuthGuard>;
}
