"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Dumbbell,
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
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";

const navItems = [
  ["common.home", appRoutes.home],
  ["common.packages", appRoutes.packages],
  ["common.trainers", appRoutes.trainers],
  ["common.booking", appRoutes.booking],
  ["common.admin", appRoutes.admin],
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteHeader />
      {children}
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

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-emerald-500 text-zinc-950">
            <Dumbbell className="size-5" />
          </span>
          <span className="text-lg font-black tracking-tight">{t("common.brand")}</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {navItems.map(([key, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <select
            value={locale}
            onChange={(event) => changeLanguage(event.target.value as "vi" | "en")}
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label={t("common.language")}
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>

          <Button
            type="button"
            onClick={toggleTheme}
            className="size-10 bg-white p-0 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
            aria-label={t("common.theme")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Link
            href={appRoutes.cart}
            className="inline-flex size-10 items-center justify-center rounded-md bg-white text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
          >
            <ShoppingCart className="size-4" />
          </Link>

          <div className="relative">
            <Button
              type="button"
              onClick={() => setIsUserOpen((value) => !value)}
              className="h-10 bg-zinc-950 px-3 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <UserCircle className="size-4" />
              Demo User
              <ChevronDown className="size-4" />
            </Button>
            {isUserOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800" href={appRoutes.profile}>
                  {t("common.profile")}
                </Link>
                <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800" href="/profile/bookings">
                  {t("booking.history")}
                </Link>
                <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800" href={appRoutes.login}>
                  {t("common.login")}
                </Link>
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className="ml-auto size-10 bg-white p-0 text-zinc-800 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 lg:hidden"
          aria-label="Menu"
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          <div className="space-y-2">
            {navItems.map(([key, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-zinc-200 bg-white px-4 py-10 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black">{t("common.brand")}</p>
          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Gym ecommerce UI for packages, PT booking, checkout and member profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-zinc-500">
          {navItems.map(([key, href]) => (
            <Link key={href} href={href} className={cn("hover:text-zinc-950 dark:hover:text-white")}>
              {t(key)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
