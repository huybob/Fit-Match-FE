import { api } from "@/services/api";

export interface OperationalReport {
  from?: string;
  to?: string;
  scope?: "PLATFORM" | "GYM";
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  grossHeld: number;
  refunded: number;
  releasedNet: number;
  commission: number;
  walletHeld?: number;
  walletPending?: number;
  walletAvailable?: number;
  walletFrozen?: number;
  totalDisputes: number;
  disputesByStatus: Record<string, number>;
}

/** UC-076: báo cáo vận hành & tài chính. */
export const reportService = {
  platform: (from: string, to: string) =>
    api.get<OperationalReport>("/admin/reports/operational", { params: { from, to } }),
  gym: (from: string, to: string) =>
    api.get<OperationalReport>("/gym/reports/operational", { params: { from, to } }),
};
