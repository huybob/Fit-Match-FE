"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  ShoppingCart,
  UserCircle,
  X,
} from "lucide-react";
import { appRoutes } from "@/constants/ecommerce.constant";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import { MotionPage } from "@/shared/components/common/motion-page";
import { cn } from "@/shared/utils/cn.util";

const navItems = [
  ["Trang chủ", appRoutes.home],
  ["Phòng gym", appRoutes.gyms],
  ["Gói tập", appRoutes.packages],
  ["Huấn luyện viên", appRoutes.trainers],
  ["Đặt lịch", appRoutes.booking],
] as const;

function useVisibleNavItems() {
  const { user, status } = useAuthStore();
  const canBook = status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
  return canBook
    ? navItems
    : navItems.filter(([, href]) => href !== appRoutes.booking);
}

// Role-specific workspace entry shown in the account dropdown.
function workspaceEntryFor(role?: string) {
  if (role === "ROLE_ADMIN") return { href: "/admin", label: "Trang quản trị" };
  if (role === "ROLE_PT") return { href: "/trainer", label: "Khu vực huấn luyện viên" };
  if (role === "ROLE_GYM_OPERATOR") return { href: "/gym", label: "Khu vực phòng gym" };
  return null;
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fit-shell flex min-h-screen flex-col text-gray-900">
      <SiteHeader />
      <MotionPage>{children}</MotionPage>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const { user, status, logout } = useAuthStore();
  const canUseNotifications = status === "authenticated" && ["ROLE_CUSTOMER", "ROLE_PT", "ROLE_GYM_OPERATOR"].includes(user?.role ?? "");
  const canUseCustomerCommerce = status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
  const visibleNavItems = useVisibleNavItems();
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    await logout();
    setIsUserOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-[#2563EB]">
            FitMatch
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {visibleNavItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative rounded-lg px-1 py-2 text-sm font-semibold transition",
                isActive(href)
                  ? "text-[#2563EB] after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#2563EB]"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          {canUseCustomerCommerce && (
            <Link
              href={appRoutes.cart}
              className="inline-flex size-9 items-center justify-center rounded-md bg-gray-50 text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100"
            >
              <ShoppingCart className="size-4" />
            </Link>
          )}
          {canUseNotifications && (
            <Link
              aria-label="Thông báo"
              href="/notifications"
              className="relative inline-flex size-9 items-center justify-center rounded-md bg-gray-50 text-gray-600 ring-1 ring-gray-200"
            >
              <Bell className="size-4" />
            </Link>
          )}

          {status === "idle" || status === "loading" ? (
            <div
              aria-label="Đang xử lý..."
              className="h-9 w-32 animate-pulse rounded-md bg-gray-100"
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
                <div className="absolute right-0 top-11 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    href={appRoutes.profile}
                    onClick={() => setIsUserOpen(false)}
                  >
                    Hồ sơ
                  </Link>
                  {workspaceEntryFor(user.role) && (
                    <Link
                      className="block rounded-md px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
                      href={workspaceEntryFor(user.role)!.href}
                      onClick={() => setIsUserOpen(false)}
                    >
                      {workspaceEntryFor(user.role)!.label}
                    </Link>
                  )}
                  {user.role === "ROLE_CUSTOMER" && (
                    <>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/favorites">
                        PT yêu thích
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/bookings">
                        Lịch đặt
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/sessions">
                        Buổi tập
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/workout-plans">
                        Giáo án
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/attendance">
                        Điểm danh
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/measurements">
                        Chỉ số cơ thể
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/payments">
                        Thanh toán
                      </Link>
                      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile/reviews">Đánh giá</Link>
                    </>
                  )}
                  {/* Khu vực quản lý — tạm ẩn */}
                  {/* Đổi mật khẩu — tạm ẩn */}
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => void handleLogout()}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                className="px-3 text-sm font-semibold text-gray-700 hover:text-gray-900"
                href={appRoutes.login}
              >
                Đăng nhập
              </Link>
              <Link
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
                href={appRoutes.register}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        <Button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className="ml-auto size-9 bg-gray-50 p-0 text-gray-600 shadow-none ring-1 ring-gray-200 hover:bg-gray-100 lg:hidden"
          aria-label="Trình đơn"
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 lg:hidden">
          <div className="space-y-1">
            {visibleNavItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {label}
              </Link>
            ))}
            {status === "idle" || status === "loading" ? (
              <div className="h-10 animate-pulse rounded-md bg-gray-100" />
            ) : status === "authenticated" && user ? (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-400">
                  {user.username}
                </p>
                <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href={appRoutes.profile} onClick={() => setIsMenuOpen(false)}>
                  Hồ sơ
                </Link>
                {workspaceEntryFor(user.role) && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold text-[#2563EB]" href={workspaceEntryFor(user.role)!.href} onClick={() => setIsMenuOpen(false)}>
                    {workspaceEntryFor(user.role)!.label}
                  </Link>
                )}
                {canUseNotifications && (
                  <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/notifications">
                    Thông báo
                  </Link>
                )}
                {user.role === "ROLE_CUSTOMER" && (
                  <>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/favorites">PT yêu thích</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/bookings">Lịch đặt</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/sessions">Buổi tập</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/workout-plans">Giáo án</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/attendance">Điểm danh</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/measurements">Chỉ số cơ thể</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/payments">Thanh toán</Link>
                    <Link className="block rounded-md px-3 py-2 text-sm font-semibold" href="/profile/reviews">Đánh giá</Link>
                  </>
                )}
                {/* Khu vực quản lý — tạm ẩn */}
                {/* Đổi mật khẩu — tạm ẩn */}
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => void handleLogout()}
                  type="button"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-3">
                <Link
                  className="rounded-md px-3 py-2 text-center text-sm font-semibold text-gray-700"
                  href={appRoutes.login}
                >
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-md bg-[#2563EB] px-3 py-2 text-center text-sm font-bold text-white"
                  href={appRoutes.register}
                >
                  Đăng ký
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
  const visibleNavItems = useVisibleNavItems();

  return (
    <footer className="border-t border-gray-200 bg-gray-900 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black text-white">FitMatch</p>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            Khám phá phòng gym, đặt lịch huấn luyện viên và quản lý hành trình luyện tập tại một nơi.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-400">
          {visibleNavItems.map(([label, href]) => (
            <Link key={href} href={href} className={cn("hover:text-white transition")}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
