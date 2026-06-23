import type { WorkoutPlanStatus } from "@/services/workout-plan.service";
export const workoutPlanKeys = {
  all: ["workout-plans"] as const,
  list: (scope: "customer" | "pt", status?: WorkoutPlanStatus) => [...workoutPlanKeys.all, scope, status] as const,
};
