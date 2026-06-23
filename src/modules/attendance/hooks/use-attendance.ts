"use client";
import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";
import { attendanceKeys } from "../query-keys";
export function useAttendance(scope: "customer" | "pt", page: number) {
  return useQuery({ queryKey: attendanceKeys.list(scope, page), queryFn: () => scope === "customer" ? attendanceService.getMine(page) : attendanceService.getPt(page) });
}
