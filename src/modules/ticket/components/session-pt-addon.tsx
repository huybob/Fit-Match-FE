"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ptAddonService } from "@/services/session-pt-addon.service";
import type { Ticket, TrainingSession } from "@/types/Ticket";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import { DayComposer } from "./day-composer";
import type { PtGridSelection } from "./pt-availability-grid";
import { todayIso } from "../calendar-date.util";
import { ptAvailabilityKeys, sessionKeys, ticketKeys } from "../query-keys";
import { useSetSessionPt } from "../hooks/use-ticket";

export function SessionPtAddon({ session, ticket }: { session: TrainingSession; ticket: Ticket }) {
  const eligible = ticket.status === "ACTIVE" && session.status === "SCHEDULED" && session.sessionDate > todayIso();
  const client = useQueryClient();
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<PtGridSelection | null>(null);
  const [seconds, setSeconds] = useState(0);
  const key = useRef("");
  const applied = useRef(0);
  const setPt = useSetSessionPt();
  const refresh = () => {
    client.invalidateQueries({ queryKey: ["pt-addons", session.id] });
    client.invalidateQueries({ queryKey: ticketKeys.all });
    client.invalidateQueries({ queryKey: sessionKeys.all });
    client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
  };
  const query = useQuery({
    queryKey: ["pt-addons", session.id], queryFn: () => ptAddonService.list(session.id),
    enabled: eligible && !ticket.withPt,
    refetchInterval: q => q.state.data?.some(a => a.status === "PENDING_PAYMENT") ? 5000 : false,
  });
  const current = query.data?.find(a => a.status === "PENDING_PAYMENT");
  const latestApplied = query.data?.find(a => a.status === "APPLIED");
  useEffect(() => {
    if (latestApplied && latestApplied.id !== applied.current) {
      applied.current = latestApplied.id;
      client.invalidateQueries({ queryKey: sessionKeys.all });
      client.invalidateQueries({ queryKey: ticketKeys.all });
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
    }
  }, [latestApplied, client]);
  useEffect(() => {
    if (!current) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(`${current.holdExpiresAt}+07:00`).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [current]);
  const selection = picked ? { ptId: picked.ptProfileId, slotStart: picked.startTime } : null;
  const quote = useQuery({
    queryKey: ["pt-addon-quote", session.id, selection],
    queryFn: () => ptAddonService.quote(session.id, selection!),
    enabled: Boolean(selection) && !session.ptAddonPaid,
    staleTime: 0,
  });
  const create = useMutation({
    mutationFn: () => ptAddonService.create(session.id, { ...selection!, expectedAmount: quote.data!.amount }, key.current),
    onSuccess: () => { setPicked(null); refresh(); },
    onError: () => client.invalidateQueries({ queryKey: ptAvailabilityKeys.all }),
  });
  const cancel = useMutation({ mutationFn: () => ptAddonService.cancel(current!.id), onSuccess: refresh });
  if (!eligible || ticket.withPt) return null;
  const error = query.error || quote.error || create.error || cancel.error || setPt.error;
  return <section className="space-y-3 rounded-xl border border-border p-3">
    <p className="font-semibold">{session.ptAddonPaid ? "Đổi PT / khung giờ" : "Bổ sung PT cho buổi tập"}</p>
    {query.isLoading ? <p role="status" className="text-sm text-muted-foreground">Đang kiểm tra yêu cầu PT…</p> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{toErrorMessage(error)}</p> : null}
    {current ? <div className="space-y-2">
      <p className="text-sm">{seconds > 0 ? `Giữ chỗ còn ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "Đã hết thời gian giữ PT. Hãy đóng yêu cầu và chọn lại."}</p>
      <p>{formatCurrency(current.amount)} · Nội dung chuyển khoản: {current.paymentOrder?.refCode}</p>
      {seconds > 0 && current.paymentOrder?.status === "PENDING" && current.paymentOrder.qrContent ?
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.paymentOrder.qrContent} alt="Mã QR thanh toán PT bổ sung" className="mx-auto w-48 rounded-xl bg-white p-2" /> : null}
      <p className="text-xs text-muted-foreground">PT chỉ được gán khi thanh toán thành công. Buổi tập ban đầu vẫn giữ nguyên.</p>
      <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Đóng yêu cầu PT</Button>
    </div> : <>
      <Button variant="outline" size="sm" disabled={query.isLoading || query.isError} onClick={() => setPicking(true)}>Chọn PT và giờ tập</Button>
      {picked ? <div className="space-y-2">
        <p className="text-sm">{picked.ptName} · {picked.startTime.slice(0, 5)}–{picked.endTime.slice(0, 5)}</p>
        {!session.ptAddonPaid ? <p className="text-sm">{quote.isLoading ? "Đang báo giá…" : quote.data ? `Phụ phí buổi này: ${formatCurrency(quote.data.amount)}` : ""}</p> : null}
        <Button size="sm" disabled={create.isPending || setPt.isPending || (!session.ptAddonPaid && !quote.data)} onClick={() => {
          if (session.ptAddonPaid) setPt.mutate({ sessionId: session.id, ...selection! }, { onSuccess: () => { setPicked(null); refresh(); } });
          else create.mutate();
        }}>{session.ptAddonPaid ? "Xác nhận đổi PT" : "Giữ PT và thanh toán"}</Button>
      </div> : null}
      <p className="text-xs text-muted-foreground">Bổ sung trước 00:00 ngày tập (giờ Việt Nam). Chỉ trả phí PT cho buổi này.</p>
    </>}
    {picking ? <DayComposer branchId={ticket.gymBranchId} date={session.sessionDate} dayIndex={session.dayIndex}
      requiredMinutes={ticket.minutesPerDay} selected={picked} onSelect={value => {
        key.current = crypto.randomUUID(); setPicked(value); setPicking(false);
      }} onClear={() => setPicked(null)} onClose={() => setPicking(false)} /> : null}
  </section>;
}
