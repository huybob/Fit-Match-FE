"use client";

import { RegisterForm } from "@/modules/forms/auth-forms";
import { GuestGuard } from "@/modules/auth/guest-guard";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function RegisterPage() {
  return (
    <GuestGuard>
      <AuthPageShell variant="register">
        <RegisterForm />
      </AuthPageShell>
    </GuestGuard>
  );
}
