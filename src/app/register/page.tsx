"use client";

import { RegisterForm } from "@/modules/forms/auth-forms";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function RegisterPage() {
  return (
    <AuthPageShell variant="register">
      <RegisterForm />
    </AuthPageShell>
  );
}
