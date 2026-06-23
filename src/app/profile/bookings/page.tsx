"use client";

import { BookingWorkspacePage } from "@/modules/booking/components/booking-pages";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function ProfileBookingsRoute() {
  return <SiteLayout><AuthGuard roles={["ROLE_CUSTOMER"]}><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"><BookingWorkspacePage scope="customer" /></main></AuthGuard></SiteLayout>;
}
