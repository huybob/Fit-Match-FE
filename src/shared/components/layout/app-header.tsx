import Link from "next/link";
import { APP_NAME } from "@/shared/constants/app.constant";
import { ROUTES } from "@/shared/constants/route.constant";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href={ROUTES.home} className="font-semibold">
          {APP_NAME}
        </Link>
        <Link href={ROUTES.users} className="text-sm text-slate-600">
          Users
        </Link>
      </nav>
    </header>
  );
}
