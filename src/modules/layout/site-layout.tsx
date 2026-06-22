"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Dumbbell,
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
import { Button } from "@/shared/components/ui/button";
import { MotionPage } from "@/shared/components/common/motion-page";
import { cn } from "@/shared/utils/cn.util";

const navItems = [
  ["common.home", appRoutes.home],
  ["common.gyms", appRoutes.gyms],
  ["common.packages", appRoutes.packages],
  ["common.trainers", appRoutes.trainers],
  ["common.booking", appRoutes.booking],
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fit-shell min-h-screen text-[#10130f] dark:text-[#f5f5ed]">
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
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    await logout();
    setIsUserOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#dedfce]/80 bg-[#f7f7ef]/88 shadow-[0_6px_24px_rgba(16,19,15,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080a07]/88">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#a3ff12] text-[#10130f] shadow-lg shadow-lime-500/20">
            <Dumbbell className="size-5" />
          </span>
          <span className="text-lg font-black tracking-tight">
            {t("common.brand")}
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {navItems.map(([key, href]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative rounded-lg px-1 py-2 text-sm font-bold transition hover:text-[#10130f] dark:hover:text-white",
                isActive(href)
                  ? "text-[#10130f] after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#ff6b22] dark:text-white"
                  : "text-[#505647] dark:text-[#c9ccb8]",
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <select
            value={locale}
            onChange={(event) =>
              changeLanguage(event.target.value as "vi" | "en")
            }
            className="h-10 rounded-md border border-[#dedfce] bg-white/80 px-3 text-sm font-bold text-[#10130f] outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
            aria-label={t("common.language")}
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>

          <Button
            type="button"
            onClick={toggleTheme}
            className="size-10 bg-white/80 p-0 text-[#10130f] shadow-none ring-1 ring-[#dedfce] hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10"
            aria-label={t("common.theme")}
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <Link
            href={appRoutes.cart}
            className="inline-flex size-10 items-center justify-center rounded-md bg-white/80 text-[#10130f] ring-1 ring-[#dedfce] transition hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10"
          >
            <ShoppingCart className="size-4" />
          </Link>

          {status === "idle" || status === "loading" ? (
            <div
              aria-label={t("common.loading")}
              className="h-10 w-32 animate-pulse rounded-md bg-[#dedfce] dark:bg-white/10"
            />
          ) : status === "authenticated" && user ? (
            <div className="relative">
              <Button
                type="button"
                onClick={() => setIsUserOpen((value) => !value)}
                className="h-10 bg-[#ff6b22] px-3 text-white hover:bg-[#ff7f3f] dark:bg-[#ff6b22] dark:text-white"
              >
                <UserCircle className="size-4" />
                {user.username}
                <ChevronDown className="size-4" />
              </Button>
              {isUserOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-lg border border-[#dedfce] bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#121610]">
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#f1f2e8] dark:hover:bg-white/10"
                    href={appRoutes.profile}
                  >
                    {t("common.profile")}
                  </Link>
                  {getHomeRouteForRole(user.role) !== appRoutes.profile && (
                    <Link
                      className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#f1f2e8] dark:hover:bg-white/10"
                      href={getHomeRouteForRole(user.role)}
                    >
                      {t("common.workspace")}
                    </Link>
                  )}
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#f1f2e8] dark:hover:bg-white/10"
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
              <Link className="px-3 text-sm font-bold" href={appRoutes.login}>
                {t("common.login")}
              </Link>
              <Link
                className="rounded-md bg-[#ff6b22] px-4 py-2 text-sm font-bold text-white"
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
          className="ml-auto size-10 bg-white/80 p-0 text-[#10130f] shadow-none ring-1 ring-[#dedfce] hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10 lg:hidden"
          aria-label={t("common.menu")}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-[#dedfce] bg-[#f7f7ef] px-4 py-4 dark:border-white/10 dark:bg-[#080a07] lg:hidden">
          <div className="space-y-2">
            {navItems.map(([key, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#f1f2e8] dark:hover:bg-white/10"
              >
                {t(key)}
              </Link>
            ))}
            {status === "idle" || status === "loading" ? (
              <div className="h-10 animate-pulse rounded-md bg-[#dedfce] dark:bg-white/10" />
            ) : status === "authenticated" && user ? (
              <div className="border-t border-[#dedfce] pt-2 dark:border-white/10">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wide text-[#858a78]">
                  {user.username}
                </p>
                <Link
                  className="block rounded-md px-3 py-2 text-sm font-semibold"
                  href={appRoutes.profile}
                >
                  {t("common.profile")}
                </Link>
                {getHomeRouteForRole(user.role) !== appRoutes.profile && (
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-semibold"
                    href={getHomeRouteForRole(user.role)}
                  >
                    {t("common.workspace")}
                  </Link>
                )}
                <Link
                  className="block rounded-md px-3 py-2 text-sm font-semibold"
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
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-[#dedfce] pt-3 dark:border-white/10">
                <Link
                  className="rounded-md px-3 py-2 text-center text-sm font-semibold"
                  href={appRoutes.login}
                >
                  {t("common.login")}
                </Link>
                <Link
                  className="rounded-md bg-[#ff6b22] px-3 py-2 text-center text-sm font-bold text-white"
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

  return (
    <footer className="border-t border-[#dedfce] bg-[#10130f] px-4 py-10 text-white dark:border-white/10 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black">{t("common.brand")}</p>
          <p className="mt-2 max-w-md text-sm text-[#c9ccb8]">
            {t("common.footerDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#c9ccb8]">
          {navItems.map(([key, href]) => (
            <Link key={href} href={href} className={cn("hover:text-[#a3ff12]")}>
              {t(key)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
