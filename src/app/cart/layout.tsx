import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
export default function CartLayout({ children }: { children: ReactNode }) { return <AuthGuard roles={["ROLE_CUSTOMER"]}>{children}</AuthGuard>; }
