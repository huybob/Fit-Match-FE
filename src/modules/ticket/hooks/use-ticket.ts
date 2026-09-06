"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ticketService,
  type ScheduleTicketRequest,
  type TicketListParams,
  type TicketQuoteRequest,
} from "@/services/ticket.service";
import { marketplaceService } from "@/services/marketplace.service";
import { loyaltyKeys } from "@/modules/loyalty/hooks/use-loyalty";
import { disputeKeys } from "@/modules/dispute/hooks/use-dispute";
import {
  gymCalendarKeys,
  ptAvailabilityKeys,
  sessionKeys,
  ticketKeys,
} from "../query-keys";

function invalidateTickets(client: ReturnType<typeof useQueryClient>) {
  return () => {
    client.invalidateQueries({ queryKey: ticketKeys.all });
    client.invalidateQueries({ queryKey: sessionKeys.all });
  };
}

// ---------------------------------------------------------------------------
// Mua vé
// ---------------------------------------------------------------------------

/**
 * Báo giá — chạy lại mỗi lần khách đổi toggle PT / mã voucher / toggle điểm.
 * Dùng `useQuery` chứ không `useMutation` để React Query tự huỷ request cũ khi
 * khách bấm liên tiếp; nếu không, phản hồi đến trễ sẽ ghi đè con số mới hơn.
 */
export function useTicketQuote(payload: TicketQuoteRequest | null) {
  return useQuery({
    queryKey: ticketKeys.quote(payload),
    queryFn: () => ticketService.quote(payload!),
    enabled: Boolean(payload?.branchId && payload?.ticketTypeId),
    staleTime: 0,
  });
}

export function usePurchaseTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: TicketQuoteRequest) => ticketService.purchase(payload),
    onSuccess: () => {
      invalidateTickets(client)();
      // Mua vé bằng điểm là TIÊU điểm ngay lúc tạo vé — số dư cũ còn trong cache
      // sẽ khiến lần mua tiếp theo hiện số điểm không còn nữa.
      client.invalidateQueries({ queryKey: loyaltyKeys.balance });
    },
  });
}

export function useMyTickets(params: TicketListParams = {}) {
  return useQuery({
    queryKey: ticketKeys.myList(params),
    queryFn: () => ticketService.myTickets(params),
  });
}

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketService.detail(id),
    enabled: id > 0,
  });
}

/**
 * Đơn thanh toán của vé. Poll 5s trong lúc còn PENDING rồi tự dừng — khách
 * chuyển khoản xong không phải tự F5 để biết vé đã kích hoạt.
 */
export function useTicketPayment(id: number, enabled = true) {
  return useQuery({
    queryKey: ticketKeys.payment(id),
    queryFn: () => ticketService.payment(id),
    enabled: enabled && id > 0,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 5000 : false,
  });
}

export function useTicketHistory(id: number) {
  return useQuery({
    queryKey: ticketKeys.history(id),
    queryFn: () => ticketService.history(id),
    enabled: id > 0,
  });
}

export function useCancelUnpaidTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ticketService.cancelUnpaid(id),
    onSuccess: invalidateTickets(client),
  });
}

/**
 * Mở tranh chấp cho vé (bỏ sessionId) hoặc cho một buổi tập (truyền sessionId).
 *
 * Nằm ở module ticket chứ không ở module dispute vì BE nhận vé/buổi trong đường
 * dẫn: `POST /tickets/{id}/disputes?sessionId=`. Mở xong phải làm mới CẢ hai
 * phía — vé đổi settlementStatus sang DISPUTED, và danh sách tranh chấp có thêm
 * một dòng (màn "Vé của tôi" dựa vào đó để không mời mở tranh chấp lần hai).
 */
export function useOpenTicketDispute() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      reason,
      sessionId,
    }: {
      ticketId: number;
      reason: string;
      sessionId?: number;
    }) => ticketService.openDispute(ticketId, reason, sessionId),
    onSuccess: () => {
      invalidateTickets(client)();
      client.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Đặt lịch
// ---------------------------------------------------------------------------

export function useScheduleTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ScheduleTicketRequest }) =>
      ticketService.schedule(id, payload),
    onSuccess: () => {
      invalidateTickets(client)();
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
    },
  });
}

/**
 * Chi nhánh còn nhận đặt lịch cho CHÍNH HÔM NAY không — bản sao phía FE của
 * `SessionSchedulingValidator#closedTodayIssue`, dùng để mờ ô "hôm nay" trên
 * lịch thay vì để khách chọn rồi mới nhận lỗi.
 *
 * Ba quy tắc phải khớp BE từng chữ, sai một cái là hai bên nói khác nhau:
 * chi nhánh CHƯA khai giờ thì không suy ra là đóng cửa; đã khai mà thiếu đúng
 * thứ trong tuần đó thì là nghỉ; và đúng giờ đóng cửa cũng đã là muộn.
 *
 * Trong lúc chưa tải xong thì coi như còn đặt được: chặn nhầm một lựa chọn hợp
 * lệ khó chịu hơn nhiều so với để BE từ chối một lựa chọn sai.
 */
export function useBranchBookingWindow(gymProfileId?: number, gymBranchId?: number) {
  const { data } = useQuery({
    queryKey: ["gym-branches", gymProfileId],
    queryFn: () => marketplaceService.getGymBranches(gymProfileId!),
    enabled: Boolean(gymProfileId),
    // Giờ mở cửa gần như không đổi trong một phiên đặt lịch.
    staleTime: 5 * 60 * 1000,
  });

  const hours = data?.find((branch) => branch.id === gymBranchId)?.operatingHours;
  if (!hours?.length) {
    return { bookableToday: true, closeTime: undefined as string | undefined };
  }

  const now = new Date();
  // JS: 0 = Chủ nhật; BE dùng ISO-8601: 1 = Thứ hai ... 7 = Chủ nhật.
  const isoDay = now.getDay() === 0 ? 7 : now.getDay();
  const today = hours.find((hour) => hour.dayOfWeek === isoDay);
  if (!today || today.closed) {
    return { bookableToday: false, closeTime: undefined };
  }
  if (!today.closeTime) {
    return { bookableToday: true, closeTime: undefined };
  }
  const nowTime = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  return {
    bookableToday: nowTime < today.closeTime,
    closeTime: today.closeTime.slice(0, 5),
  };
}

/** Lịch của khách trong khoảng ngày — dùng cho cảnh báo trùng ngày (câu 29). */
export function useMySessions(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.mine(from, to),
    queryFn: () => ticketService.mySessions(from, to),
    enabled: enabled && Boolean(from && to),
  });
}

export function useUpdateSessionDate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, date }: { sessionId: number; date: string }) =>
      ticketService.updateSessionDate(sessionId, date),
    onSuccess: invalidateTickets(client),
  });
}

export function useSetSessionPt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      ptId,
      slotStart,
    }: {
      sessionId: number;
      ptId: number;
      slotStart: string;
    }) => ticketService.setSessionPt(sessionId, ptId, slotStart),
    onSuccess: () => {
      invalidateTickets(client)();
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
    },
  });
}

export function useRemoveSessionPt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => ticketService.removeSessionPt(sessionId),
    onSuccess: () => {
      invalidateTickets(client)();
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
    },
  });
}

/**
 * V94: báo giá huỷ một buổi. `staleTime: 0` vì con số phụ thuộc vào ĐỒNG HỒ —
 * mốc 24h/12h trôi qua trong lúc hộp thoại đang mở thì số cũ trong cache sẽ hứa
 * với khách một khoản mà server không trả.
 */
export function useCancelSessionQuote(sessionId: number, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.cancelQuote(sessionId),
    queryFn: () => ticketService.cancelSessionQuote(sessionId),
    enabled: enabled && sessionId > 0,
    staleTime: 0,
  });
}

export function useCancelSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: number; reason?: string }) =>
      ticketService.cancelSession(sessionId, reason),
    onSuccess: () => {
      invalidateTickets(client)();
      // Khung giờ của PT vừa được trả lại -> lưới chọn PT phải thấy nó trống.
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
      // Tiền hoàn về ví: số dư cũ trong cache là một con số sai ngay lập tức.
      // ["wallet"] là tiền tố của cả walletKeys.wallet(owner) lẫn .transactions.
      client.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useCheckInSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => ticketService.checkIn(sessionId),
    onSuccess: invalidateTickets(client),
  });
}

// ---------------------------------------------------------------------------
// Tìm PT — hai chiều
// ---------------------------------------------------------------------------

/** Chọn PT trước (ptId) hoặc xem lưới gộp toàn chi nhánh (bỏ ptId). */
export function usePtSlotGrid(
  branchId: number,
  from: string,
  to: string,
  ptId?: number,
  enabled = true,
  minutes?: number,
) {
  return useQuery({
    queryKey: ptAvailabilityKeys.grid(branchId, from, to, ptId, minutes),
    queryFn: () => ticketService.ptSlotGrid(branchId, from, to, ptId, minutes),
    enabled: enabled && branchId > 0 && Boolean(from && to),
  });
}

/** Chọn giờ trước: PT nào của chi nhánh còn trống đúng khung đó. */
export function usePtSlotSearch(
  branchId: number,
  date: string,
  startTime: string,
  enabled = true,
  minutes?: number,
) {
  return useQuery({
    queryKey: ptAvailabilityKeys.search(branchId, date, startTime, minutes),
    queryFn: () => ticketService.searchPtSlots(branchId, date, startTime, minutes),
    enabled: enabled && branchId > 0 && Boolean(date && startTime),
  });
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export function useBranchTicketTypes(branchId: number) {
  return useQuery({
    queryKey: ticketKeys.branchTypes(branchId),
    queryFn: () => ticketService.listBranchTicketTypes(branchId),
    enabled: branchId > 0,
  });
}

/** V82: dịch vụ kèm vé bán tại chi nhánh — bước "chọn dịch vụ" của popup mua vé. */
export function useBranchServices(branchId: number) {
  return useQuery({
    queryKey: ticketKeys.branchServices(branchId),
    queryFn: () => ticketService.listBranchServices(branchId),
    enabled: branchId > 0,
  });
}

// ---------------------------------------------------------------------------
// Gym
// ---------------------------------------------------------------------------

/**
 * Lịch của gym cho ĐÚNG khoảng đang xem. Đây là chỗ sửa bẫy cũ: trước đây FE
 * tải một trang 200 booking rồi tự gom ở client, giờ mỗi lần bấm mũi tên là
 * một truy vấn mới với from/to tương ứng.
 */
export function useGymCalendar(branchId: number, from: string, to: string) {
  return useQuery({
    queryKey: gymCalendarKeys.range(branchId, from, to),
    queryFn: () => ticketService.gymCalendar(branchId, from, to),
    enabled: branchId > 0 && Boolean(from && to),
  });
}

export function useConfirmPtSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, evidenceUrl }: { sessionId: number; evidenceUrl: string }) =>
      ticketService.confirmPtSession(sessionId, evidenceUrl),
    onSuccess: () => client.invalidateQueries({ queryKey: gymCalendarKeys.all }),
  });
}
