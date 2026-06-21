import { ChangePasswordForm } from "@/modules/forms/auth-forms";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function ChangePasswordPage() {
  return (
    <SiteLayout>
      <AuthGuard>
        <main className="mx-auto max-w-md px-4 py-12">
          <h1 className="text-3xl font-black">Change password</h1>
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <ChangePasswordForm />
          </div>
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
