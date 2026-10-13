import { api } from "@/services/api";
export type PtScheduleSource = "public" | "self" | "gym";
export type PtSlotStatus = "FREE" | "BUSY" | "HELD" | "LEAVE" | "UNAVAILABLE";
export interface PtSchedule {
  ptId: number;
  branchId?: number | null;
  timezone: string;
  updatedAt: string;
  branches: { id: number; name: string }[];
  days: {
    date: string; status: "LEAVE" | "NO_SCHEDULE" | "WORKING";
    workingHours: { start: string; end: string }[];
    slots: { start: string; end: string; status: PtSlotStatus }[];
  }[];
}
export const ptScheduleService = {
  get: (source: PtScheduleSource, id: number, from: string, to: string, branchId?: number) =>
    api.get<PtSchedule>(source === "public" ? `/marketplace/pts/${id}/schedule` : source === "gym" ? `/gym/pts/${id}/schedule` : "/pt/schedule",
      { params: { from, to, branchId } }),
};
