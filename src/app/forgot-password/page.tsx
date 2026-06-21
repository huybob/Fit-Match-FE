import Link from "next/link";
import { Info } from "lucide-react";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function ForgotPasswordPage() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-black">Forgot password</h1>
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <Info className="size-6" />
          <p className="mt-3 font-semibold">
            Password recovery is not available because the FitMatch API does not currently expose this endpoint.
          </p>
          <Link className="mt-5 inline-block text-sm font-black underline" href="/login">
            Return to login
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}
