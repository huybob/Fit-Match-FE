"use client";

import { LoginForm } from "@/modules/forms/auth-forms";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function LoginPage() {
  return (
    <AuthPageShell variant="login">
      <LoginForm />
    </AuthPageShell>
  );
}
