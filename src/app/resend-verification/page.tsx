"use client";

import { AuthPageShell } from "@/shared/components/common/auth-page-shell";
import { ResendVerificationForm } from "@/modules/forms/auth-forms";

export default function ResendVerificationPage() {
  return (
    <AuthPageShell variant="login">
      <ResendVerificationForm />
    </AuthPageShell>
  );
}
