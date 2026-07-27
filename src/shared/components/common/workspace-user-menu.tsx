"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { AccountMenu } from "@/shared/components/common/account-menu";
import { LocaleSwitch } from "@/shared/components/common/locale-switch";
import { ThemeSwitch } from "@/shared/components/common/theme-switch";
import { useTranslations } from "next-intl";

/**
 * Account dropdown for workspace top bars (gym / trainer).
 * Self-contained: reads the current user and handles logout.
 */
export function WorkspaceUserMenu() {
  const t = useTranslations();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const label = user?.fullName ?? user?.username ?? t("common.menu.accountFallback");

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-1">
      <LocaleSwitch />
      <ThemeSwitch />
      <AccountMenu name={label} avatarUrl={user?.avatarUrl} onLogout={handleLogout} />
    </div>
  );
}
