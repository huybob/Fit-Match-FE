"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookingService,
  BookingListParams,
  CreateBookingRequest,
  RescheduleBookingRequest,
} from "@/services/booking.service";
import { bookingKeys } from "../query-keys";

export type BookingScope = "customer" | "pt" | "gym";

/** Hành động trên một booking — map 1:1 với endpoint BE theo scope. */
export type BookingAction =
  | "checkout"
  | "cancel"
  | "refund"
  | "checkIn"
  | "accept"
  | "reject"
  | "noShow"
  | "complete";

function refresh(client: ReturnType<typeof useQueryClient>) {
  return () => client.invalidateQueries({ queryKey: bookingKeys.all });
}

export function useBookings(scope: BookingScope, params: BookingListParams) {
  return useQuery({
    queryKey: bookingKeys.list(scope, params),
    queryFn: () =>
      scope === "customer"
        ? bookingService.getMine(params)
        : scope === "pt"
          ? bookingService.getPt(params)
          : bookingService.getGym(params),
  });
}

export function useBookingDetail(scope: BookingScope, id: number) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => (scope === "gym" ? bookingService.getGymDetail(id) : bookingService.getDetail(id)),
    enabled: id > 0,
  });
}

/** Đơn thanh toán VietQR của booking (customer, sau checkout) — UC-052. */
export function useBookingPayment(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...bookingKeys.detail(id), "payment"],
    queryFn: () => bookingService.getPayment(id),
    enabled: enabled && id > 0,
    // D-5 (audit 2026-07-17): webhook Casso xác nhận tiền bất đồng bộ — poll 5s khi
    // đơn còn PENDING để dialog QR tự cập nhật PAID thay vì bắt khách reload tay.
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 5_000 : false,
  });
}

export function useCreateBooking() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingRequest) => bookingService.create(payload),
    onSuccess: refresh(c),
  });
}

/** UC-051: gói tập đã mua của khách (dùng để đặt buổi tiếp theo miễn phí). */
export function useMyPackages(enabled = true) {
  return useQuery({
    queryKey: [...bookingKeys.all, "my-packages"],
    queryFn: () => bookingService.myPackages(),
    enabled,
  });
}

export function useRescheduleBooking(scope: BookingScope) {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & RescheduleBookingRequest) =>
      scope === "gym" ? bookingService.gymReschedule(id, payload) : bookingService.reschedule(id, payload),
    onSuccess: refresh(c),
  });
}

export function useBookingAction(scope: BookingScope) {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, message, ptId }: {
      id: number;
      action: BookingAction;
      message?: string;
      ptId?: number;
    }) => {
      switch (action) {
        case "checkout":
          return bookingService.checkout(id);
        case "refund":
          return bookingService.requestRefund(id, message ?? "");
        case "checkIn":
          return scope === "gym"
            ? bookingService.gymCheckIn(id)
            : scope === "pt"
              ? bookingService.ptCheckIn(id)
              : bookingService.checkIn(id);
        case "accept":
          return bookingService.accept(id, ptId);
        case "reject":
          return bookingService.reject(id, message ?? "");
        case "noShow":
          return bookingService.noShow(id);
        case "complete":
          return bookingService.complete(id);
        case "cancel":
        default:
          return scope === "gym"
            ? bookingService.gymCancel(id, message ?? "")
            : bookingService.cancel(id, { reason: message });
      }
    },
    onSuccess: refresh(c),
  });
}
