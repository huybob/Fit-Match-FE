"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workoutPlanService, WorkoutPlanRequest, WorkoutPlanStatus } from "@/services/workout-plan.service";
import { workoutPlanKeys } from "../query-keys";
const refresh = (client: ReturnType<typeof useQueryClient>) => () => client.invalidateQueries({ queryKey: workoutPlanKeys.all });
export function useWorkoutPlans(scope: "customer" | "pt", status?: WorkoutPlanStatus) {
  return useQuery({ queryKey: workoutPlanKeys.list(scope, status), queryFn: () => scope === "customer" ? workoutPlanService.getMine(status) : workoutPlanService.getPt(status) });
}
export function useSaveWorkoutPlan() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id?: number; payload: WorkoutPlanRequest }) => id ? workoutPlanService.update(id, payload) : workoutPlanService.create(payload), onSuccess: refresh(client) });
}
export function useWorkoutPlanAction() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, action }: { id: number; action: "complete" | "archive" }) => action === "complete" ? workoutPlanService.complete(id) : workoutPlanService.archive(id), onSuccess: refresh(client) });
}
