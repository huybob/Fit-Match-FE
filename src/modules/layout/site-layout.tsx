"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
  UserCircle,
  X,
} from "lucide-react";
import { appRoutes } from "@/constants/ecommerce.constant";
import { useLocale } from "@/lib/i18n-provider";
import { useThemeMode } from "@/lib/theme-provider";
import { useAuthStore } from "@/modules/auth/auth.store";
import { getHomeRouteForRole } from "@/modules/auth/auth-routing";
import { useUnreadCount } from "@/modules/notification/hooks/use-notification";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { MotionPage } from "@/shared/components/common/motion-page";
import { cn } from "@/shared/utils/cn.util";

const navItems = [
  ["common.home", appRoutes.home],
  ["common.gyms", appRoutes.gyms],
  ["common.packages", appRoutes.packages],
  ["common.trainers", appRoutes.trainers],
  ["common.booking", appRoutes.booking],
] as const;

function useVisibleNavItems() {
  const { user, status } = useAuthStore();
  const canBook = status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
  return canBook
    ? navItems
    : navItems.filter(([, href]) => href !== appRoutes.booking);
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fit-shell flex min-h-screen flex-col text-gray-900 dark:text-[#f5f5ed]">
      <SiteHeader />
      <MotionPage>{children}</MotionPage>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const { locale, changeLanguage } = useLocale();
  const { theme, toggleTheme } = useThemeMode();
  const { user, status, logout } = useAuthStore();
  const canUseNotifications = status === "authenticated" && ["ROLE_CUSTOMER", "ROLE_PT", "ROLE_GYM_OPERATOR"].includes(user?.role ?? "");
  const canUseCustomerCommerce = status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
  const unread = useUnreadCount(canUseNotifications);
  const visibleNavItems = useVisibleNavItems();
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    await logout();
    setIsUserOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#080a07]/95">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-[#2563EB]">
            FitMatch
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {visibleNavItems.map(([key, href]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative rounded-lg px-1 py-2 text-sm font-semibold transition",
                isActive(href)
                  ? "text-[#2563EB] after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#2563EB]"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Select
            value={locale}
            onValueChange={(v) => changeLanguage(v as "vi" | "en")}
          >
            <SelectTrigger className="h-9 w-20 rounded-md border-gray-200 bg-white text-sm font-bold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">VI</SelectItem>
              <SelectItem value="en">EN</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            onClick={toggleTheme}
            className="size-9 bg-gray-50 p-0 text-gray-600 shadow-none ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:ring-white/10"
            aria-label={t("common.theme")}
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          {canUseCustomerCommerce && (
            <Link
              href={appRoutes.cart}
              className="inline-flex size-9 items-center justify-center rounded-md bg-gray-50 text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:ring-white/10"
            >
              <ShoppingCart className="size-4" />
            </Link>
          )}
          {canUseNotifications && (
            <Link
              aria-label={t("notification.title")}
              href="/notifications"
              className="relative inline-flex size-9 items-center justify-center rounded-md bg-gray-50 text-gray-600 ring-1 ring-gray-200 dark:bg-white/10 dark:text-white dark:ring-white/10"
            >
              <Bell className="size-4" />
              {!!unread.data?.unread && (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#2563EB] px-1 text-[10px] font-black text-white">
                  {unread.data.unread}
                </span>
              )}
            </Link>
          )}

          {status === "idle" || status === "loading" ? (
            <div
              aria-label={t("common.loading")}
              className="h-9 w-32 animate-pulse rounded-md bg-gray-100 dark:bg-white/10"
            />
          ) : status === "authenticated" && user ? (
            <div className="relative">
              <Button
                type="button"
                onClick={() => setIsUserOpen((value) => !value)}
                className="h-9 bg-[#2563EB] px-3 text-white hover:bg-[#1D4ED8]"
              >
                <UserCircle className="size-4" />
                {user.username}
                <ChevronDown className="size-4" />
              </Button>
              {isUserOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#121610]">
                  {user.role === "ROLE_CUSTOMER" && (
                    <Link
                      className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10"
                      href={appRoutes.profile}
                    >
                      {t("common.profile")}
                    </Link>
                  )}
                  {user.role === "ROLE_CUSTOMER" && (
                    <>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/bookings">
                        {t("bookingModule.navigation")}
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/sessions">
                        {t("sessionModule.navigation")}
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/workout-plans">
                        {t("workoutPlan.navigation")}
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/attendance">
                        {t("attendance.navigation")}
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/measurements">
                        {t("measurement.navigation")}
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/payments">
                        {t("payment.navigation")}
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10" href="/profile/reviews">{t("review.navigation")}</Link>
                    </>
                  )}
                  {getHomeRouteForRole(user.role) !== appRoutes.profile && (
                    <Link
                      className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10"
                      href={getHomeRouteForRole(user.role)}
                    >
                      {t("common.workspace")}
                    </Link>
                  )}
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10"
                    href="/change-password"
                  >
                    {t("profile.changePassword")}
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => void handleLogout()}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                className="px-3 text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                href={appRoutes.login}
              >
                {t("common.login")}
              </Link>
              <Link
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
                href={appRoutes.register}
              >
                {t("common.register")}
              </Link>
            </>
          )}
        </div>

        <Button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className="ml-auto size-9 bg-gray-50 p-0 text-gray-600 shadow-none ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:ring-white/10 lg:hidden"
          aria-label={t("common.menu")}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#080a07] lg:hidden">
          <div className="space-y-1">
            {visibleNavItems.map(([key, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {t(key)}
              </Link>
            ))}
            {status === "idle" || status === "loading" ? (
              <div className="h-10 animate-pulse rounded-md bg-gray-100 dark:bg-white/10" />
            ) : status === "authenticated" && user ? (
              <div className="border-t border-gray-200 pt-2 mt-2 dark:border-white/10">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-400">
                  {user.username}
                </p>
                {user.role === "ROLE_CUSTOMER" && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href={appRoutes.profile}>
                    {t("common.profile")}
                  </Link>
                )}
                {canUseNotifications && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/notifications">
                    {t("notification.title")}
                  </Link>
                )}
                {user.role === "ROLE_CUSTOMER" && (
                  <>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/bookings">{t("bookingModule.navigation")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/sessions">{t("sessionModule.navigation")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/workout-plans">{t("workoutPlan.navigation")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/attendance">{t("attendance.navigation")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/measurements">{t("measurement.navigation")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/payments">{t("payment.navigation")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/reviews">{t("review.navigation")}</Link>
                  </>
                )}
                {getHomeRouteForRole(user.role) !== appRoutes.profile && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href={getHomeRouteForRole(user.role)}>
                    {t("common.workspace")}
                  </Link>
                )}
                <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/change-password">
                  {t("profile.changePassword")}
                </Link>
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => void handleLogout()}
                  type="button"
                >
                  <LogOut className="size-4" />
                  {t("common.logout")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-3 dark:border-white/10">
                <Link
                  className="rounded-md px-3 py-2 text-center text-sm font-semibold text-gray-700"
                  href={appRoutes.login}
                >
                  {t("common.login")}
                </Link>
                <Link
                  className="rounded-md bg-[#2563EB] px-3 py-2 text-center text-sm font-bold text-white"
                  href={appRoutes.register}
                >
                  {t("common.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const { t } = useTranslation();
  const visibleNavItems = useVisibleNavItems();

  return (
    <footer className="border-t border-gray-200 bg-gray-900 px-4 py-10 text-white dark:border-white/10 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black text-white">{t("common.brand")}</p>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            {t("common.footerDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-400">
          {visibleNavItems.map(([key, href]) => (
            <Link key={href} href={href} className={cn("hover:text-white transition")}>
              {t(key)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
