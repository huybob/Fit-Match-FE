"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CameraIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { gymService } from "@/services/gym.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn.util";
import { useConfirmPtSession, useGymCalendar } from "../hooks/use-ticket";
import type { GymCalendarDay, GymCalendarEntry } from "@/types/Ticket";

type ViewMode = "week" | "month";

/**
 * Lịch quản lý của gym — READ-ONLY (quyết định #7).
 *
 * Không có accept / reject / assign-pt / reschedule / cancel / no-show. Thao
 * tác duy nhất là xác nhận buổi có PT kèm ảnh (câu 31/33).
 *
 * Xem theo TUẦN hoặc THÁNG. Mỗi lần đổi kỳ là MỘT truy vấn với from/to tương
 * ứng — không tải một trang lớn rồi gom ở client. Khoảng ngày của view tháng có
 * cả ngày đệm đầu/cuối lưới nên tối đa 42 ngày, vẫn dưới trần 92 ngày của BE.
 */
export function GymCalendarPage() {
  const t = useTranslations("gymCalendar");
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [branchId, setBranchId] = useState<number>(0);
  const [detail, setDetail] = useState<GymCalendarEntry | null>(null);

  const { data: branches } = useQuery({
    queryKey: ["gym-branches"],
    queryFn: () => gymService.listOwnBranches(),
  });

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const effectiveBranchId = branchId || branches?.[0]?.id || 0;

  const { data: calendar, isLoading } = useGymCalendar(
    effectiveBranchId,
    toIso(range.from),
    toIso(range.to),
  );

  // `calendar ?? []` tạo mảng mới mỗi lần render nên useMemo bên dưới sẽ chạy
  // lại vô ích — giữ tham chiếu ổn định trước rồi mới tổng hợp.
  const days = useMemo(() => calendar ?? [], [calendar]);
  const stats = useMemo(() => summarise(days), [days]);

  const periodLabel = useMemo(() => {
    if (view === "month") {
      return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    return `${formatShort(range.from)} – ${formatShort(range.to)}`;
  }, [view, anchor, range.from, range.to]);

  function shift(direction: 1 | -1) {
    setAnchor((current) =>
      view === "week"
        ? addDays(current, 7 * direction)
        : new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(effectiveBranchId)}
              onValueChange={(value) => setBranchId(Number(value))}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t("pickBranch")} />
              </SelectTrigger>
              <SelectContent>
                {(branches ?? []).map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chuyển tuần/tháng */}
            <div className="flex items-center rounded-xl border border-border bg-card p-0.5">
              {(["week", "month"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    view === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(mode === "week" ? "viewWeek" : "viewMonth")}
                </button>
              ))}
            </div>

            <Button variant="outline" size="icon" aria-label={t("prev")} onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-44 text-center text-sm font-semibold capitalize">
              {periodLabel}
            </span>
            <Button variant="outline" size="icon" aria-label={t("next")} onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => setAnchor(startOfDay(new Date()))}>
              {t("today")}
            </Button>
          </div>
        </div>

        {!effectiveBranchId ? (
          <EmptyState title={t("noBranch")} description={t("pickBranch")} />
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <StatsRow stats={stats} />
            {view === "week" ? (
              <WeekGrid days={days} onPick={setDetail} />
            ) : (
              <MonthGrid days={days} anchor={anchor} onPick={setDetail} />
            )}
          </>
        )}
      </div>

      <SessionDetailDialog entry={detail} onClose={() => setDetail(null)} />
    </main>
  );
}

// ---------------------------------------------------------------------------

type Stats = { total: number; withPt: number; checkedIn: number; awaitingPt: number };

function summarise(days: GymCalendarDay[]): Stats {
  const all = days.flatMap((d) => d.sessions);
  return {
    total: all.length,
    withPt: all.filter((s) => s.ptName).length,
    checkedIn: all.filter((s) => s.checkedIn).length,
    // Buổi có PT mà gym chưa xác nhận — đây là việc tồn của phòng gym.
    awaitingPt: all.filter((s) => s.ptName && !s.ptConfirmed).length,
  };
}

function StatsRow({ stats }: { stats: Stats }) {
  const t = useTranslations("gymCalendar");
  const cards = [
    { key: "total", value: stats.total, icon: CalendarDays },
    { key: "withPt", value: stats.withPt, icon: UserRound },
    { key: "checkedIn", value: stats.checkedIn, icon: CheckCircle2 },
    { key: "awaitingPt", value: stats.awaitingPt, icon: Clock },
  ] as const;
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ key, value, icon: Icon }) => (
        <div key={key} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="size-3.5" />
            <span className="text-[11px] font-semibold">{t(`stat.${key}`)}</span>
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}

function WeekGrid({
  days,
  onPick,
}: {
  days: GymCalendarDay[];
  onPick: (entry: GymCalendarEntry) => void;
}) {
  const t = useTranslations("gymCalendar");
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const date = parseIso(day.date);
        return (
          <div
            key={day.date}
            className={cn(
              "min-h-40 rounded-xl border bg-card p-2.5",
              isToday(date) ? "border-primary ring-1 ring-primary/30" : "border-border",
            )}
          >
            <p className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-bold text-foreground">{weekdayShort(date)}</span>
              <span className="text-[11px] text-muted-foreground">{formatShort(date)}</span>
            </p>
            <div className="space-y-1.5">
              {day.sessions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{t("emptyDay")}</p>
              ) : (
                day.sessions.map((entry) => (
                  <EntryChip key={entry.sessionId} entry={entry} onPick={onPick} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({
  days,
  anchor,
  onPick,
}: {
  days: GymCalendarDay[];
  anchor: Date;
  onPick: (entry: GymCalendarEntry) => void;
}) {
  const t = useTranslations("gymCalendar");
  const month = anchor.getMonth();
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[52rem]">
        <div className="mb-1 grid grid-cols-7 gap-2">
          {days.slice(0, 7).map((day) => (
            <p
              key={`head-${day.date}`}
              className="px-1 text-[11px] font-bold uppercase text-muted-foreground"
            >
              {weekdayShort(parseIso(day.date))}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const date = parseIso(day.date);
            // Ngày đệm của tháng trước/sau vẫn hiện để lưới đủ 7 cột, nhưng làm
            // mờ đi để không đọc nhầm là thuộc tháng đang xem.
            const outside = date.getMonth() !== month;
            return (
              <div
                key={day.date}
                className={cn(
                  "min-h-28 rounded-lg border p-1.5",
                  outside ? "border-border/50 bg-muted/20" : "border-border bg-card",
                  isToday(date) && "border-primary ring-1 ring-primary/30",
                )}
              >
                <p
                  className={cn(
                    "mb-1 text-[11px] font-bold",
                    outside ? "text-muted-foreground/60" : "text-foreground",
                  )}
                >
                  {date.getDate()}
                </p>
                <div className="space-y-1">
                  {day.sessions.slice(0, 3).map((entry) => (
                    <EntryChip key={entry.sessionId} entry={entry} onPick={onPick} compact />
                  ))}
                  {day.sessions.length > 3 && (
                    <p className="px-1 text-[10px] font-semibold text-muted-foreground">
                      {t("moreSessions", { count: day.sessions.length - 3 })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EntryChip({
  entry,
  onPick,
  compact,
}: {
  entry: GymCalendarEntry;
  onPick: (entry: GymCalendarEntry) => void;
  compact?: boolean;
}) {
  const t = useTranslations("gymCalendar");
  return (
    <button
      type="button"
      onClick={() => onPick(entry)}
      className={cn(
        "w-full rounded-md border border-border bg-background px-1.5 py-1 text-left transition hover:border-primary/50 hover:bg-muted",
        entry.ptName && !entry.ptConfirmed && "border-warning/50 bg-warning-muted/30",
      )}
    >
      <span className="flex items-center gap-1">
        {entry.slotStart ? (
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-primary">
            {entry.slotStart.slice(0, 5)}
          </span>
        ) : null}
        <span className="truncate text-[11px] font-semibold">{entry.customerName}</span>
      </span>
      {!compact && (
        <>
          <span className="block truncate text-[10px] text-muted-foreground">
            {entry.ticketKind === "PACKAGE"
              ? t("dayOf", { index: entry.dayIndex, total: entry.dayCount })
              : entry.ticketName}
          </span>
          {entry.ptName ? (
            <span className="block truncate text-[10px] text-muted-foreground">
              {entry.ptName}
            </span>
          ) : null}
          {entry.ptConfirmed ? (
            <Badge variant="outline" className="mt-0.5 text-[9px]">
              {t("confirmed")}
            </Badge>
          ) : null}
        </>
      )}
    </button>
  );
}

/** Dialog chỉ đọc; hành động duy nhất là xác nhận PT có mặt kèm ảnh. */
function SessionDetailDialog({
  entry,
  onClose,
}: {
  entry: GymCalendarEntry | null;
  onClose: () => void;
}) {
  const t = useTranslations("gymCalendar");
  const { toast } = useToast();
  const confirm = useConfirmPtSession();
  const [evidenceUrl, setEvidenceUrl] = useState("");

  if (!entry) return null;

  async function submit() {
    if (!entry) return;
    try {
      await confirm.mutateAsync({ sessionId: entry.sessionId, evidenceUrl });
      toast({ type: "success", title: t("confirmSuccess") });
      setEvidenceUrl("");
      onClose();
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    }
  }

  return (
    <Dialog open onClose={onClose} title={t("detailTitle")}>
      <div className="space-y-3 text-sm">
        <p>
          <span className="text-muted-foreground">{t("customer")}: </span>
          {entry.customerName}
        </p>
        <p>
          <span className="text-muted-foreground">{t("ticket")}: </span>
          {entry.ticketName}
          {entry.ticketKind === "PACKAGE"
            ? ` (${t("dayOf", { index: entry.dayIndex, total: entry.dayCount })})`
            : ""}
        </p>
        {entry.ptName ? (
          <p>
            <span className="text-muted-foreground">{t("pt")}: </span>
            {entry.ptName} · {entry.slotStart?.slice(0, 5)}–{entry.slotEnd?.slice(0, 5)}
          </p>
        ) : (
          <p className="text-muted-foreground">{t("noPt")}</p>
        )}

        {entry.ptName && !entry.ptConfirmed ? (
          <div className="space-y-2 border-t pt-3">
            <label className="text-sm font-medium">{t("evidenceUrl")}</label>
            <Input
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder={t("evidencePlaceholder")}
            />
            <Button disabled={!evidenceUrl || confirm.isPending} onClick={submit}>
              <CameraIcon className="mr-2 size-4" />
              {t("confirmPt")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("confirmHint")}</p>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Ngày tháng — dùng giờ địa phương xuyên suốt.
// ---------------------------------------------------------------------------

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  // weekStartsOn: 1 (thứ Hai) — giữ nguyên quy ước của lịch cũ.
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  return copy;
}

function rangeFor(view: ViewMode, anchor: Date) {
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }
  // Lưới tháng phải bắt đầu từ thứ Hai của tuần chứa ngày 1 và kết thúc ở chủ
  // nhật của tuần chứa ngày cuối — nếu không, các cột sẽ lệch thứ.
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const from = startOfWeek(firstOfMonth);
  const to = addDays(startOfWeek(lastOfMonth), 6);
  return { from, to };
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

/**
 * toISOString() đổi sang UTC nên ở múi giờ dương (VN = UTC+7) ngày bị lùi một
 * ngày — lịch sẽ lệch đúng một cột. Ghép tay từ các thành phần giờ địa phương.
 */
function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIso(value: string) {
  return new Date(`${value}T00:00:00`);
}

function isToday(date: Date) {
  return toIso(date) === toIso(new Date());
}

function formatShort(date: Date) {
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

function weekdayShort(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}
