"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Heart, User, Shield, Settings, LogOut,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";

const links = [
  { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/profile/bookings", label: "Lịch đặt", icon: Calendar },
  { href: "/profile/favorites", label: "Yêu thích", icon: Heart },
  { href: "/profile", label: "Hồ sơ", icon: User },
  { href: "/change-password", label: "Bảo mật", icon: Shield },
];

export function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-64 shrink-0 bg-primary/10 border border-border rounded-xl p-4 flex flex-col gap-2 h-fit sticky top-6">
      <div className="pb-4">
        <p className="text-2xl font-semibold text-primary leading-tight">
          FitMatch<br />Workspace
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-1">Quản lý hành trình thể hình</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "text-muted-foreground hover:bg-card/60"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 pb-4">
        <Link href="/booking">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg h-9">
            Đặt buổi tập mới
          </Button>
        </Link>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-card/60"
        >
          <Settings className="size-4" />
          Cài đặt
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
