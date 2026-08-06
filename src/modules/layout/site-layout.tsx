"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  UserCircle,
  X,
} from "lucide-react";
import { NotificationBell } from "@/modules/notification/components/notification-bell";
import { appRoutes } from "@/constants/ecommerce.constant";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MotionPage } from "@/shared/components/common/motion-page";
import { LocaleSwitch } from "@/shared/components/common/locale-switch";
import { ThemeSwitch } from "@/shared/components/common/theme-switch";
import { cn } from "@/shared/utils/cn.util";
import { useTranslations } from "next-intl";

/** labelKey = null nghĩa là tên riêng, không dịch. */
const navItems = [
  { labelKey: "site.nav.home", label: null, href: appRoutes.home },
  { labelKey: "site.nav.gyms", label: null, href: appRoutes.gyms },
  { labelKey: "site.nav.trainers", label: null, href: appRoutes.trainers },
  { labelKey: "site.nav.bookings", label: null, href: appRoutes.booking },
  // Bug 13: FAQ/Blog do CMS quản lý đã có trang nhưng không được link ở đâu cả.
  { labelKey: null, label: "Blog", href: appRoutes.blog },
  { labelKey: null, label: "FAQ", href: appRoutes.faq },
] as const;

function useVisibleNavItems() {
  const { user, status } = useAuthStore();
  const canBook = status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
  return canBook
    ? navItems
    : navItems.filter((item) => item.href !== appRoutes.booking);
}

// Role-specific workspace entry shown in the account dropdown.
/** Trả về KEY thay vì chuỗi — helper thường không được gọi hook (rules-of-hooks). */
function workspaceEntryFor(role?: string) {
  if (role === "ROLE_ADMIN") return { href: "/admin", labelKey: "site.workspace.admin" } as const;
  if (role === "ROLE_PT") return { href: "/trainer", labelKey: "site.workspace.pt" } as const;
  if (role === "ROLE_GYM_OPERATOR") return { href: "/gym", labelKey: "site.workspace.gym" } as const;
  return null;
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fit-shell flex min-h-screen flex-col text-foreground">
      <SiteHeader />
      <MotionPage>{children}</MotionPage>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, status, logout } = useAuthStore();
  const workspaceEntry = workspaceEntryFor(user?.role);
  const canUseNotifications = status === "authenticated" && ["ROLE_CUSTOMER", "ROLE_PT", "ROLE_GYM_OPERATOR"].includes(user?.role ?? "");
  const visibleNavItems = useVisibleNavItems();
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-primary">
            FitMatch
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {visibleNavItems.map(({ labelKey, label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative rounded-lg px-1 py-2 text-sm font-semibold transition",
                isActive(href)
                  ? "text-primary after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {labelKey ? t(labelKey) : label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <LocaleSwitch />
          <ThemeSwitch />
          {/* E-6: badge số chưa đọc thật (poll 60s) thay Link tĩnh */}
          {canUseNotifications && <NotificationBell />}

          {status === "idle" || status === "loading" ? (
            <div
              aria-label={t("common.states.processing")}
              className="h-9 w-32 animate-pulse rounded-md bg-muted"
            />
          ) : status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  /* `username` là optional trong AuthUser: khi BE chỉ trả fullName,
                     nút này chỉ còn 2 icon và KHÔNG có tên khả truy cập nào — screen
                     reader đọc thành "button". Dùng đúng chuỗi fallback như
                     AccountMenu/WorkspaceUserMenu/sidebar, kèm aria-label cố định. */
                  aria-label={t("common.menu.account")}
                  className="h-9 bg-primary px-3 text-primary-foreground hover:bg-primary/90"
                >
                  <UserCircle className="size-4" />
                  {user.fullName ?? user.username ?? t("common.menu.accountFallback")}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={appRoutes.profile}>{t("member.nav.profile")}</Link>
                </DropdownMenuItem>
                {workspaceEntry && (
                  <DropdownMenuItem asChild className="text-primary focus:bg-primary/10 focus:text-primary">
                    <Link href={workspaceEntry.href}>{t(workspaceEntry.labelKey)}</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "ROLE_CUSTOMER" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/favorites">{t("site.menu.favoriteTrainers")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/bookings">{t("member.nav.bookings")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/reviews">{t("site.menu.reviews")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/disputes">{t("site.menu.disputes")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/loyalty">{t("site.menu.loyalty")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications">{t("notification.title")}</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => void handleLogout()}>
                  <LogOut className="size-4" />
                  {t("common.menu.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                className="px-3 text-sm font-semibold text-foreground hover:text-foreground"
                href={appRoutes.login}
              >
                {t("auth.login")}
              </Link>
              <Link
                className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                href={appRoutes.register}
              >
                {t("auth.register")}
              </Link>
            </>
          )}
        </div>

        <Button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className="ml-auto size-9 bg-muted/40 p-0 text-muted-foreground shadow-none ring-1 ring-border hover:bg-muted lg:hidden"
          aria-label={t("site.menuButton")}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 lg:hidden">
          <div className="space-y-1">
            {visibleNavItems.map(({ labelKey, label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/40"
              >
                {labelKey ? t(labelKey) : label}
              </Link>
            ))}
            {status === "idle" || status === "loading" ? (
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            ) : status === "authenticated" && user ? (
              <div className="border-t border-border pt-2 mt-2">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {user.username}
                </p>
                <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href={appRoutes.profile} onClick={() => setIsMenuOpen(false)}>
                  {t("member.nav.profile")}
                </Link>
                {workspaceEntryFor(user.role) && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold text-primary" href={workspaceEntryFor(user.role)!.href} onClick={() => setIsMenuOpen(false)}>
                    {t(workspaceEntryFor(user.role)!.labelKey)}
                  </Link>
                )}
                {canUseNotifications && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/notifications">
                    {t("notification.title")}
                  </Link>
                )}
                {user.role === "ROLE_CUSTOMER" && (
                  <>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/favorites">{t("site.menu.favoriteTrainers")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/bookings">{t("member.nav.bookings")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/reviews">{t("site.menu.reviews")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/disputes">{t("site.menu.disputes")}</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/loyalty">{t("site.menu.loyalty")}</Link>
                  </>
                )}
                {/* Khu vực quản lý — tạm ẩn */}
                {/* Đổi mật khẩu — tạm ẩn */}
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-destructive/10"
                  onClick={() => void handleLogout()}
                  type="button"
                >
                  <LogOut className="size-4" />{t("common.menu.logout")}</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Link
                  className="rounded-md px-3 py-2 text-center text-sm font-semibold text-foreground"
                  href={appRoutes.login}
                >
                  {t("auth.login")}
                </Link>
                <Link
                  className="rounded-md bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground"
                  href={appRoutes.register}
                >
                  {t("auth.register")}
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
  const t = useTranslations();
  const visibleNavItems = useVisibleNavItems();

  return (
    <footer className="border-t border-border bg-foreground px-4 py-10 text-background sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black text-white">FitMatch</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("site.footerTagline")}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
          {visibleNavItems.map(({ labelKey, label, href }) => (
            <Link key={href} href={href} className={cn("hover:text-white transition")}>
              {labelKey ? t(labelKey) : label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
