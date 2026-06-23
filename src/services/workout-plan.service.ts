import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";

type S = components["schemas"];
export type WorkoutPlan = S["WorkoutPlanResponse"];
export type WorkoutPlanRequest = S["WorkoutPlanRequest"];
export type WorkoutPlanStatus = NonNullable<WorkoutPlan["status"]>;

async function list(path: string, status?: WorkoutPlanStatus) {
  const response = await axiosClient.get<S["ApiResponsePagedResponseWorkoutPlanResponse"]>(path, { params: { page: 0, size: 20, status } });
  return unwrapApiData(response.data);
}
async function action(path: string) {
  const response = await axiosClient.put<S["ApiResponseWorkoutPlanResponse"]>(path);
  return unwrapApiData(response.data);
}
export const workoutPlanService = {
  getMine: (status?: WorkoutPlanStatus) => list("/training/workout-plans/me", status),
  getPt: (status?: WorkoutPlanStatus) => list("/training/workout-plans/pt", status),
  async create(payload: WorkoutPlanRequest) {
    const response = await axiosClient.post<S["ApiResponseWorkoutPlanResponse"]>("/training/workout-plans", payload);
    return unwrapApiData(response.data);
  },
  async update(id: number, payload: WorkoutPlanRequest) {
    const response = await axiosClient.put<S["ApiResponseWorkoutPlanResponse"]>(`/training/workout-plans/${id}`, payload);
    return unwrapApiData(response.data);
  },
  complete: (id: number) => action(`/training/workout-plans/${id}/complete`),
  archive: (id: number) => action(`/training/workout-plans/${id}/archive`),
};
