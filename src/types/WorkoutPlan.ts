import type { PageResponse } from "@/shared/types/api-response.type";

export interface Exercise {
  name?: string;
  sets?: number;
  reps?: number;
  weight?: string;
  durationMin?: number;
  notes?: string;
}

export interface WorkoutPlan {
  id?: number;
  customerId?: number;
  customerName?: string;
  ptProfileId?: number;
  ptName?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  exercises?: Exercise[];
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutPlanRequest {
  customerId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  exercises: Exercise[];
}

export type WorkoutPlanPage = PageResponse<WorkoutPlan>;
export type WorkoutPlanStatus = NonNullable<WorkoutPlan["status"]>;
