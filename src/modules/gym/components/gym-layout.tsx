"use client";
import { Building2, CalendarCheck2, Handshake, Star } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { RoleWorkspaceShell } from "@/shared/components/common/role-workspace-shell";

export function GymLayout({ children }: { children: ReactNode }) {
  const path = usePathname();

  if (path === "/gym" || path === "/gym/verification") {
    return <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>{children}</AuthGuard>;
  }

  const links = [
    {
      label: "Lịch đặt",
      href: "/gym/bookings",
      icon: CalendarCheck2,
    },
    { label: "Phòng gym của tôi", href: "/gym/gyms", icon: Building2 },
    { label: "Đánh giá", href: "/gym/reviews", icon: Star },
    {
      label: "Hợp tác",
      href: "/gym/partnerships",
      icon: Handshake,
    },
  ];
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
        <RoleWorkspaceShell
          title="Khu vực quản lý phòng gym"
          description="Quản lý phòng gym, lịch đặt, đánh giá và các đối tác của bạn."
          links={links}
          pathname={path}
        >
          {children}
        </RoleWorkspaceShell>
      </AuthGuard>
    </SiteLayout>
  );
}
