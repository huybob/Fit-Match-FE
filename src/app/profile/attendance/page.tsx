"use client";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { AttendancePage } from "@/modules/attendance/components/attendance-pages";
export default function CustomerAttendanceRoute() { return <SiteLayout><AuthGuard roles={["ROLE_CUSTOMER"]}><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8"><AttendancePage scope="customer"/></main></AuthGuard></SiteLayout>; }
