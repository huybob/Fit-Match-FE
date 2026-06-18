import { ForgotPasswordForm } from "@/modules/forms/auth-forms";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function ForgotPasswordPage() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-black">Forgot password</h1>
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <ForgotPasswordForm />
        </div>
      </main>
    </SiteLayout>
  );
}
