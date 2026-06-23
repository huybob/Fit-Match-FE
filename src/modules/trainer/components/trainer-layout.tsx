"use client";

import {
  Award,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  NotebookTabs,
  ScanLine,
  Handshake,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { RoleWorkspaceShell } from "@/shared/components/common/role-workspace-shell";

export function TrainerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const links = [
    {
      label: t("bookingModule.navigation"),
      href: "/trainer/bookings",
      icon: CalendarCheck2,
    },
    {
      label: t("sessionModule.navigation"),
      href: "/trainer/sessions",
      icon: ClipboardList,
    },
    {
      label: t("workoutPlan.navigation"),
      href: "/trainer/workout-plans",
      icon: NotebookTabs,
    },
    {
      label: t("attendance.navigation"),
      href: "/trainer/attendance",
      icon: ScanLine,
    },
    {
      label: t("trainerModule.profile"),
      href: "/trainer/profile",
      icon: UserRound,
    },
    {
      label: t("trainerModule.services"),
      href: "/trainer/services",
      icon: BriefcaseBusiness,
    },
    {
      label: t("trainerModule.availability"),
      href: "/trainer/availability",
      icon: CalendarDays,
    },
    {
      label: t("trainerModule.certificates"),
      href: "/trainer/certificates",
      icon: Award,
    },
    {
      label: t("trainerModule.partnerships"),
      href: "/trainer/partnerships",
      icon: Handshake,
    },
  ];
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_PT"]}>
        <RoleWorkspaceShell
          title={t("trainerModule.workspace")}
          description={t("trainerModule.workspaceDescription")}
          links={links}
          pathname={pathname}
        >
          {children}
        </RoleWorkspaceShell>
      </AuthGuard>
    </SiteLayout>
  );
}
