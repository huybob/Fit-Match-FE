"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { Booking, BookingStatus } from "@/services/booking.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplace.service";
import { useBookingAction, useBookings, useCreateBooking } from "../hooks/use-booking";
import { createBookingSchema } from "../schemas";

type Scope = "customer" | "pt" | "gym";
type BookingAction = "submit" | "confirm" | "checkIn" | "complete" | "noShow" | "cancel";
const statuses: BookingStatus[] = ["DRAFT", "PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];

const scopeTitles: Record<string, string> = {
  customerTitle: "Đặt lịch của tôi",
  ptTitle: "Lịch đặt của khách",
  gymTitle: "Lịch đặt tại phòng gym",
  customerDescription: "Xem và quản lý các lịch đặt của bạn.",
  ptDescription: "Xem và quản lý các lịch đặt từ khách hàng.",
  gymDescription: "Xem và quản lý các lịch đặt tại phòng gym.",
};

const bookingStatusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING: "Đang chờ",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã check-in",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
};

const actionSuccessLabels: Record<string, string> = {
  submit: "Đã gửi yêu cầu đặt lịch",
  confirm: "Đã xác nhận lịch đặt",
  checkIn: "Đã check-in",
  complete: "Đã hoàn thành buổi tập",
  noShow: "Đã đánh dấu vắng mặt",
  cancel: "Đã hủy lịch đặt",
};

function dateText(value: string | undefined, language: string) {
  return value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)) : "—";
}
function timeText(value?: string | { hour?: number; minute?: number }) {
  if (typeof value === "string") return value.slice(0, 5);
  return value ? `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}` : "—";
}
function money(value: number | undefined, language: string) {
  return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value ?? 0);
}
function statusVariant(status?: BookingStatus): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED" || status === "NO_SHOW") return "destructive";
  if (status === "CONFIRMED" || status === "CHECKED_IN") return "info";
  if (status === "PENDING") return "warning";
  return "default";
}

export function BookingWorkspacePage({ scope }: { scope: Scope }) {
  const language = "vi";
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);
  const query = useBookings(scope, { status: status || undefined, date: scope === "customer" ? undefined : date || undefined, page, size: 10 });
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:p-7">
        <div className="absolute -right-10 -top-16 size-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
            <h1 className="text-3xl font-black tracking-tight">{scopeTitles[`${scope}Title`] ?? "Đặt lịch"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{scopeTitles[`${scope}Description`] ?? ""}</p>
          </div>
          {scope === "customer" && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />Tạo lịch đặt
            </Button>
          )}
        </div>
      </section>

      <section className="mb-5 grid gap-3 rounded-2xl border border-border bg-card/80 p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Trạng thái</span>
          <Select value={status} onValueChange={(v) => { setStatus(v as BookingStatus | ""); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả trạng thái</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{bookingStatusLabels[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {scope !== "customer" && (
          <div className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Ngày tập</span>
            <DatePicker value={date} onChange={(v) => { setDate(v); setPage(0); }} />
          </div>
        )}
      </section>

      {query.isLoading ? <LoadingSkeleton /> : query.isError ? (
        <EmptyState title="Không thể tải dữ liệu" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có lịch đặt" description="Bạn chưa có lịch đặt nào. Hãy tạo lịch đặt mới để bắt đầu." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((booking) => (
            <button
              type="button"
              key={booking.id}
              onClick={() => setSelected(booking)}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">#{booking.id}</p>
                  <h2 className="mt-1 text-lg font-black group-hover:text-accent">{booking.ptServiceName ?? "Dịch vụ không tên"}</h2>
                </div>
                <Badge variant={statusVariant(booking.status)}>
                  {booking.status ? (bookingStatusLabels[booking.status] ?? booking.status) : "—"}
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent" />{dateText(booking.bookingDate, language)} · {timeText(booking.startTime)}</span>
                <span className="flex items-center gap-2"><UserRound className="size-4 text-primary" />{scope === "customer" ? booking.ptName : booking.customerName}</span>
                <span className="flex items-center gap-2"><MapPin className="size-4 text-blue-500" />{booking.branchName ?? booking.gymName}</span>
                <strong className="text-foreground">{money(booking.price, language)}</strong>
              </div>
            </button>
          ))}
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-bold">{page + 1} / {query.data?.totalPages}</span>
          <Button variant="outline" size="icon-sm" disabled={query.data?.last} onClick={() => setPage((v) => v + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <BookingDetailDialog booking={selected} scope={scope} onClose={() => setSelected(null)} />
      <CreateBookingDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function BookingDetailDialog({ booking, scope, onClose }: { booking: Booking | null; scope: Scope; onClose: () => void }) {
  const language = "vi";
  const { toast } = useToast();
  const action = useBookingAction();
  const [confirming, setConfirming] = useState<{ action: BookingAction; message?: string } | null>(null);
  if (!booking) return null;

  const bookingId = booking.id;
  const actions: Array<{ action: BookingAction; label: string; message?: string }> = [];
  if (scope === "customer" && booking.status === "DRAFT") actions.push({ action: "submit", label: "Gửi yêu cầu" });
  if (scope === "customer" && ["DRAFT", "PENDING", "CONFIRMED"].includes(booking.status ?? "")) actions.push({ action: "cancel", label: "Hủy lịch" });
  if ((scope === "pt" || scope === "gym") && booking.status === "PENDING") actions.push({ action: "confirm", label: "Xác nhận" });
  if (scope === "pt" && booking.status === "CONFIRMED") {
    actions.push({ action: "checkIn", label: "Check-in" });
    actions.push({ action: "noShow", label: "Vắng mặt" });
    actions.push({ action: "cancel", label: "Hủy lịch" });
  }
  if (scope === "pt" && booking.status === "CHECKED_IN") actions.push({ action: "complete", label: "Hoàn thành" });

  async function run() {
    if (!confirming || !bookingId) return;
    try {
      await action.mutateAsync({ id: bookingId, action: confirming.action, message: confirming.message });
      toast({ type: "success", title: actionSuccessLabels[confirming.action] ?? "Thao tác thành công" });
      setConfirming(null);
      onClose();
    } catch (error) {
      toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(error) });
    }
  }

  return (
    <Dialog open title="Chi tiết lịch đặt" onClose={onClose}>
      <div className="rounded-2xl bg-muted/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">{booking.ptServiceName}</h3>
          <Badge variant={statusVariant(booking.status)}>
            {booking.status ? (bookingStatusLabels[booking.status] ?? booking.status) : "—"}
          </Badge>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Khách hàng" value={booking.customerName} />
          <Info label="Huấn luyện viên" value={booking.ptName} />
          <Info label="Địa điểm" value={[booking.gymName, booking.branchName].filter(Boolean).join(" · ")} />
          <Info label="Lịch tập" value={`${dateText(booking.bookingDate, language)} · ${timeText(booking.startTime)}–${timeText(booking.endTime)}`} />
          <Info label="Thời lượng" value={`${booking.durationMinutes ?? 0} phút`} />
          <Info label="Giá" value={money(booking.price, language)} />
        </dl>
        {booking.notes && (
          <p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm">{booking.notes}</p>
        )}
      </div>

      {!!actions.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((item) => (
            <Button
              key={item.action}
              variant={item.action === "cancel" || item.action === "noShow" ? "destructive" : "default"}
              onClick={() => setConfirming(item)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}

      {confirming && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-black">Bạn có chắc muốn thực hiện thao tác này?</p>
          {["cancel", "confirm"].includes(confirming.action) && (
            <Textarea
              className="mt-3"
              maxLength={500}
              placeholder="Ghi chú (không bắt buộc)"
              value={confirming.message ?? ""}
              onChange={(e) => setConfirming({ ...confirming, message: e.target.value })}
            />
          )}
          <div className="mt-3 flex gap-2">
            <Button disabled={action.isPending} onClick={() => void run()}>Xác nhận</Button>
            <Button variant="outline" onClick={() => setConfirming(null)}>Hủy</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-bold text-foreground">{value || "—"}</dd>
    </div>
  );
}

function CreateBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const create = useCreateBooking();
  const pts = useQuery({
    queryKey: ["marketplace", "pts", "booking"],
    queryFn: () => marketplaceService.searchPts({ size: 100 }),
    enabled: open,
  });
  const form = useForm<z.infer<typeof createBookingSchema>>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: { ptId: 0, bookingDate: new Date().toISOString().slice(0, 10), startTime: "08:00", endTime: "09:00", note: "" },
  });

  return (
    <Dialog open={open} title="Tạo lịch đặt" onClose={onClose}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await create.mutateAsync({
              ptId: values.ptId,
              startAt: `${values.bookingDate}T${values.startTime}:00`,
              endAt: `${values.bookingDate}T${values.endTime}:00`,
              note: values.note || undefined,
            });
            toast({ type: "success", title: "Đã tạo lịch đặt (nháp)", description: "Phòng gym sẽ xác nhận lịch của bạn." });
            form.reset();
            onClose();
          } catch (error) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(error) });
          }
        })}
      >
        <div className="sm:col-span-2">
          <FieldShell label="Huấn luyện viên" error={form.formState.errors.ptId}>
            <Controller
              control={form.control}
              name="ptId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                  disabled={!pts.data?.content?.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={pts.isFetching ? "Đang tải..." : "Chọn huấn luyện viên"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pts.data?.content?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.displayName}{p.specialization ? ` · ${p.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FieldShell>
        </div>

        <FieldShell label="Ngày tập" error={form.formState.errors.bookingDate}>
          <Controller
            control={form.control}
            name="bookingDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>
        <FieldShell label="Giờ bắt đầu" error={form.formState.errors.startTime}>
          <Input type="time" {...form.register("startTime")} />
        </FieldShell>
        <FieldShell label="Giờ kết thúc" error={form.formState.errors.endTime}>
          <Input type="time" {...form.register("endTime")} />
        </FieldShell>

        <div className="sm:col-span-2">
          <FieldShell label="Ghi chú" error={form.formState.errors.note}>
            <Textarea {...form.register("note")} placeholder="Mục tiêu, yêu cầu đặc biệt..." />
          </FieldShell>
        </div>

        <Button className="sm:col-span-2" disabled={create.isPending}>
          <CalendarCheck2 className="size-4" />
          {create.isPending ? "Đang xử lý..." : "Tạo lịch đặt"}
        </Button>
      </form>
    </Dialog>
  );
}
