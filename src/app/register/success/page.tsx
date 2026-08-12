"use client";

import { CheckCircle, ExternalLink, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";
import { resolveMailProvider } from "@/shared/utils/mail-provider.util";

function RegisterSuccessContent() {
  const t = useTranslations();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const provider = email ? resolveMailProvider(email) : null;

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-success-muted">
          <CheckCircle className="size-8 text-success" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("auth.registerSuccessTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.sentVerifyTo")}{" "}
          {email && <span className="font-medium text-foreground">{email}</span>}
          {email && ". "}
          {t("auth.checkInboxHint")}
        </p>
      </div>

      <div className="space-y-3">
        {/* Mở thẳng hộp thư ở tab mới — tab này vẫn còn để bấm "Đăng nhập" sau khi xác thực. */}
        {provider ? (
          <Button asChild className="w-full" size="lg">
            <a href={provider.inboxUrl} target="_blank" rel="noopener noreferrer">
              <MailCheck className="size-4" />
              {t("auth.openMailbox", { provider: provider.name })}
              <ExternalLink className="size-3.5 opacity-70" />
            </a>
          </Button>
        ) : (
          <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {t("auth.openMailboxHint")}
          </p>
        )}

        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href="/login">{t("auth.loginNow")}</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("auth.noEmailReceived")}{" "}
        <Link
          href={email ? `/resend-verification?email=${encodeURIComponent(email)}` : "/resend-verification"}
          className="font-medium text-primary hover:underline"
        >
          {t("auth.resend")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <AuthPageShell variant="register">
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <RegisterSuccessContent />
      </Suspense>
    </AuthPageShell>
  );
}
