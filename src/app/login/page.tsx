"use client";

import { LoginForm } from "@/modules/forms/auth-forms";
import { GuestGuard } from "@/modules/auth/guest-guard";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function LoginPage() {
  return (
    <GuestGuard>
      <AuthPageShell variant="login">
        <LoginForm />
      </AuthPageShell>
    </GuestGuard>
  );
}
