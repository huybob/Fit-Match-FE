"use client";

// Chuyển từ modules/user/components/ sang đây khi xoá module `user` (cụm starter
// template chết: gọi GET /users — endpoint BE không có — và trùng chức năng với
// /admin/users). Đây là thành phần LAYOUT của khu vực thành viên, không thuộc
// một module nghiệp vụ nào.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Heart, User, Shield, Bell, LogOut, TrendingUp, Wallet, CreditCard,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";

const links = [
  { href: "/", navKey: "dashboard", icon: LayoutDashboard },
  { href: "/profile/tickets", navKey: "tickets", icon: Calendar },
  // Trang /profile/reviews có từ lâu nhưng không có mục nào trong menu — khách
  // chỉ tới được bằng link trong thông báo hoặc nút "Đã đánh giá" trên thẻ vé,
  // tức là coi như không có. Đúng lỗi đã sửa cho /gym/reviews ở đợt rà trước.
  { href: "/profile/reviews", navKey: "reviews", icon: Star },
  { href: "/profile/measurements", navKey: "progress", icon: TrendingUp },
  { href: "/profile/favorites", navKey: "favorites", icon: Heart },
  // V61: tiền hoàn từ refund/tranh chấp về ví thay vì chờ chuyển khoản tay.
  { href: "/profile/wallet", navKey: "wallet", icon: Wallet },
  { href: "/profile/bank-accounts", navKey: "bankAccounts", icon: CreditCard },
  { href: "/profile", navKey: "profile", icon: User },
  { href: "/change-password", navKey: "security", icon: Shield },
] as const;

export function ProfileSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-full shrink-0 bg-primary/10 border border-border rounded-xl p-4 flex flex-col gap-2 h-fit lg:sticky lg:top-6 lg:w-64">
      <div className="pb-4">
        <p className="text-2xl font-semibold text-primary leading-tight">
          FitMatch<br />Workspace
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{t("member.sidebar.tagline")}</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map(({ href, navKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card/60"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {t(`member.nav.${navKey}`)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 pb-4">
        {/* /booking đã bị gỡ — mua vé bắt đầu từ trang phòng gym. */}
        <Link href="/gyms">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg h-9">
            {t("member.sidebar.newBooking")}
          </Button>
        </Link>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-1">
        {/* Sửa link chết /settings (route không tồn tại) → trang thông báo thật */}
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-card/60"
        >
          <Bell className="size-4" />
          {t("member.sidebar.notifications")}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
        >
          <LogOut className="size-4" />{t("common.menu.logout")}</button>
      </div>
    </aside>
  );
}
