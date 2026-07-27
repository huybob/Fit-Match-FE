// F-27 (audit 2026-07-17): trang 404 tiếng Việt thay trang mặc định của Next.

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-black text-primary">404</p>
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("notFound.title")}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {t("notFound.body")}
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("errorPage.home")}
      </Link>
    </div>
  );
}
