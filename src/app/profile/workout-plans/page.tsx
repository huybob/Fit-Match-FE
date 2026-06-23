"use client";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { WorkoutPlansPage } from "@/modules/workout-plan/components/workout-plan-pages";
export default function CustomerWorkoutPlansRoute() { return <SiteLayout><AuthGuard roles={["ROLE_CUSTOMER"]}><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8"><WorkoutPlansPage scope="customer" /></main></AuthGuard></SiteLayout>; }
