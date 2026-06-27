import { api } from "@/services/api";
import type {
  WorkoutPlan,
  WorkoutPlanPage,
  WorkoutPlanRequest,
  WorkoutPlanStatus,
} from "@/types/WorkoutPlan";

export type {
  WorkoutPlan,
  WorkoutPlanPage,
  WorkoutPlanRequest,
  WorkoutPlanStatus,
} from "@/types/WorkoutPlan";

async function list(path: string, status?: WorkoutPlanStatus) {
  return api.get<WorkoutPlanPage>(path, {
    params: { page: 0, size: 20, status },
  });
}
async function action(path: string) {
  return api.put<WorkoutPlan>(path);
}
export const workoutPlanService = {
  getMine: (status?: WorkoutPlanStatus) =>
    list("/training/workout-plans/me", status),
  getPt: (status?: WorkoutPlanStatus) =>
    list("/training/workout-plans/pt", status),
  async create(payload: WorkoutPlanRequest) {
    return api.post<WorkoutPlan, WorkoutPlanRequest>(
      "/training/workout-plans",
      payload,
    );
  },
  async update(id: number, payload: WorkoutPlanRequest) {
    return api.put<WorkoutPlan, WorkoutPlanRequest>(
      `/training/workout-plans/${id}`,
      payload,
    );
  },
  complete: (id: number) => action(`/training/workout-plans/${id}/complete`),
  archive: (id: number) => action(`/training/workout-plans/${id}/archive`),
};
