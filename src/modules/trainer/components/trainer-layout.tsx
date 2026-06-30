"use client";

import {
  Award,
  Banknote,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  NotebookTabs,
  Ruler,
  ScanLine,
  WalletCards,
  Star,
  Handshake,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { RoleWorkspaceShell } from "@/shared/components/common/role-workspace-shell";

export function TrainerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/trainer" || pathname === "/trainer/verification") {
    return <AuthGuard roles={["ROLE_PT"]}>{children}</AuthGuard>;
  }

  const links = [
    {
      label: "Lịch đặt",
      href: "/trainer/bookings",
      icon: CalendarCheck2,
    },
    {
      label: "Buổi tập",
      href: "/trainer/sessions",
      icon: ClipboardList,
    },
    {
      label: "Giáo án",
      href: "/trainer/workout-plans",
      icon: NotebookTabs,
    },
    {
      label: "Điểm danh",
      href: "/trainer/attendance",
      icon: ScanLine,
    },
    {
      label: "Chỉ số cơ thể",
      href: "/trainer/measurements",
      icon: Ruler,
    },
    {
      label: "Thanh toán",
      href: "/trainer/payments",
      icon: WalletCards,
    },
    {
      label: "Rút tiền",
      href: "/trainer/withdrawals",
      icon: Banknote,
    },
    { label: "Đánh giá", href: "/trainer/reviews", icon: Star },
    {
      label: "Hồ sơ PT",
      href: "/trainer/profile",
      icon: UserRound,
    },
    {
      label: "Dịch vụ",
      href: "/trainer/services",
      icon: BriefcaseBusiness,
    },
    {
      label: "Lịch rảnh",
      href: "/trainer/availability",
      icon: CalendarDays,
    },
    {
      label: "Chứng chỉ",
      href: "/trainer/certificates",
      icon: Award,
    },
    {
      label: "Hợp tác",
      href: "/trainer/partnerships",
      icon: Handshake,
    },
  ];
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_PT"]}>
        <RoleWorkspaceShell
          title="Khu vực huấn luyện viên"
          description="Quản lý lịch đặt, buổi tập, giáo án và các hoạt động huấn luyện của bạn."
          links={links}
          pathname={pathname}
        >
          {children}
        </RoleWorkspaceShell>
      </AuthGuard>
    </SiteLayout>
  );
}
