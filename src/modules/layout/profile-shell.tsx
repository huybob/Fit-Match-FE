"use client";

// Khung chung của khu vực thành viên (/profile/*, /change-password): nền xám,
// ProfileSidebar bên trái, nội dung bên phải. Trước đây mỗi trang tự chép lại
// đúng ba dòng div này, nên /profile/wallet và /profile/bank-accounts — hai
// trang thêm sau — bị quên sidebar và hiển thị trần giữa màn hình.

import * as React from "react";
import { ProfileSidebar } from "./profile-sidebar";
import { cn } from "@/shared/utils/cn.util";

export function ProfileShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 xl:px-20">
        <ProfileSidebar />

        <main className={cn("flex-1 min-w-0 flex flex-col gap-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Header của một trang trong khu vực thành viên — cùng kiểu thẻ với "Hồ sơ" và
 * "Bảo mật" (bg-card, rounded-2xl, tiêu đề 2xl), khác hẳn PageHeader màu mè của
 * workspace admin/gym.
 */
export function ProfileSectionHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
