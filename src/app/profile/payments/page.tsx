"use client";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { PaymentsPage } from "@/modules/payment/components/payment-pages";
export default function CustomerPaymentsRoute(){return <SiteLayout><AuthGuard roles={["ROLE_CUSTOMER"]}><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8"><PaymentsPage scope="customer"/></main></AuthGuard></SiteLayout>}
