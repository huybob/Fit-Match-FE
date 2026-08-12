"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";
import { ResendVerificationForm } from "@/modules/forms/auth-forms";

function ResendVerificationContent() {
  const params = useSearchParams();
  return <ResendVerificationForm defaultEmail={params.get("email") ?? ""} />;
}

export default function ResendVerificationPage() {
  return (
    <AuthPageShell variant="login">
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ResendVerificationContent />
      </Suspense>
    </AuthPageShell>
  );
}
