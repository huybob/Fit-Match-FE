"use client";
import { Building2, Handshake } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { RoleWorkspaceShell } from "@/shared/components/common/role-workspace-shell";

export function GymLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { t } = useTranslation();
  const links = [
    { label: t("gymModule.myGyms"), href: "/gym/gyms", icon: Building2 },
    {
      label: t("gymModule.partnerships"),
      href: "/gym/partnerships",
      icon: Handshake,
    },
  ];
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
        <RoleWorkspaceShell
          title={t("gymModule.workspace")}
          description={t("gymModule.workspaceDescription")}
          links={links}
          pathname={path}
        >
          {children}
        </RoleWorkspaceShell>
      </AuthGuard>
    </SiteLayout>
  );
}
