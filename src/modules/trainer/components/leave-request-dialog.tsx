"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { Button } from "@/shared/components/ui/button";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { fileService } from "@/services/file.service";
import { addDays, todayIso } from "@/modules/ticket/calendar-date.util";
import { trainerKeys } from "../query-keys";
import type { LeaveScope, LeaveType } from "@/types/Shift";

const HORIZON_DAYS = 28;
const MIN_REASON = 10;

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Form gửi đơn xin nghỉ. Ba phạm vi khác nhau đổi hẳn phần dưới của form:
 * cả ngày (không nhập gì thêm), theo ca (chọn ca), theo khoảng giờ (nhập giờ).
 *
 * Các ràng buộc nặng — chồng đơn, hạn mức tháng của Gym, số giờ báo trước khi
 * đơn đè lên buổi khách đã đặt — do BE quyết và trả 409; ở đây chỉ chặn những
 * lỗi nhìn vào form là thấy, để không tạo hai nguồn luật lệch nhau.
 */
export function LeaveRequestDialog({ open, onOpenChange }: LeaveRequestDialogProps) {
  const t = useTranslations("ptLeave");
  const tTypes = useTranslations("ptLeave.types");
  const tScopes = useTranslations("ptLeave.scopes");
  const { toast } = useToast();
  const client = useQueryClient();

  // Ngày theo lịch ĐỊA PHƯƠNG (calendar-date.util) — xem chú thích trong util:
  // toISOString() ở UTC+7 lùi một ngày và làm lệch cả min ngày lẫn khoảng hỏi ca.
  const today = useMemo(() => todayIso(), []);
  const horizonEnd = useMemo(() => addDays(today, HORIZON_DAYS - 1), [today]);

  const [type, setType] = useState<LeaveType>("LEAVE");
  const [scope, setScope] = useState<LeaveScope>("FULL_DAY");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [shiftIds, setShiftIds] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  /** Ca để chọn khi scope = SHIFT: lấy từ chính lịch ca của PT, bỏ trùng. */
  const { data: myShifts } = useQuery({
    queryKey: trainerKeys.shifts(today, horizonEnd),
    queryFn: () => shiftService.myShifts(today, horizonEnd),
    enabled: open,
  });

  const shiftOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const shift of myShifts ?? []) {
      map.set(
        shift.shiftId,
        `${shift.shiftName} (${shift.startTime.slice(0, 5)}–${shift.endTime.slice(0, 5)})`,
      );
    }
    return [...map].map(([id, label]) => ({ id, label }));
  }, [myShifts]);

  const submit = useMutation({
    mutationFn: () =>
      shiftService.submitLeave({
        type,
        scope,
        fromDate,
        toDate,
        shiftIds: scope === "SHIFT" ? shiftIds : undefined,
        startTime: scope === "TIME_RANGE" ? startTime : undefined,
        endTime: scope === "TIME_RANGE" ? endTime : undefined,
        reason: reason.trim(),
        attachmentUrl,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trainerKeys.all });
      toast({ type: "success", title: t("submitted") });
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  function reset() {
    setType("LEAVE");
    setScope("FULL_DAY");
    setFromDate(today);
    setToDate(today);
    setShiftIds([]);
    setReason("");
    setAttachmentUrl(undefined);
  }

  async function uploadAttachment(file: File) {
    setUploading(true);
    try {
      const result = await fileService.upload(file, "documents");
      setAttachmentUrl(result.url);
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    } finally {
      setUploading(false);
    }
  }

  const reasonTooShort = reason.trim().length < MIN_REASON;
  const shiftMissing = scope === "SHIFT" && shiftIds.length === 0;
  const rangeInvalid = scope === "TIME_RANGE" && startTime >= endTime;
  const datesInvalid = toDate < fromDate;
  const disabled =
    submit.isPending || uploading || reasonTooShort || shiftMissing || rangeInvalid || datesInvalid;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("needsApproval")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("type")}</Label>
              <Select value={type} onValueChange={(value) => setType(value as LeaveType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAVE">{tTypes("LEAVE")}</SelectItem>
                  <SelectItem value="SICK">{tTypes("SICK")}</SelectItem>
                  <SelectItem value="BUSY">{tTypes("BUSY")}</SelectItem>
                  <SelectItem value="OTHER">{tTypes("OTHER")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("scope")}</Label>
              <Select value={scope} onValueChange={(value) => setScope(value as LeaveScope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_DAY">{tScopes("FULL_DAY")}</SelectItem>
                  <SelectItem value="SHIFT">{tScopes("SHIFT")}</SelectItem>
                  <SelectItem value="TIME_RANGE">{tScopes("TIME_RANGE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leave-from">{t("fromDate")}</Label>
              <Input
                id="leave-from"
                type="date"
                min={today}
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leave-to">{t("toDate")}</Label>
              <Input
                id="leave-to"
                type="date"
                min={fromDate}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>

          {scope === "SHIFT" ? (
            <div className="space-y-1.5">
              <Label>{t("shifts")}</Label>
              {shiftOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noShiftToPick")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {shiftOptions.map((option) => {
                    const selected = shiftIds.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setShiftIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== option.id)
                              : [...prev, option.id],
                          )
                        }
                        className={
                          selected
                            ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium"
                            : "rounded-md border px-3 py-1.5 text-sm hover:border-primary"
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {scope === "TIME_RANGE" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="leave-start">{t("startTime")}</Label>
                <Input
                  id="leave-start"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leave-end">{t("endTime")}</Label>
                <Input
                  id="leave-end"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="leave-reason">{t("reason")}</Label>
            <Textarea
              id="leave-reason"
              rows={3}
              value={reason}
              placeholder={t("reasonPlaceholder")}
              onChange={(event) => setReason(event.target.value)}
            />
            {reasonTooShort ? (
              <p className="text-xs text-muted-foreground">
                {t("reasonMin", { min: MIN_REASON })}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="leave-file">{t("attachment")}</Label>
            <Input
              id="leave-file"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAttachment(file);
              }}
            />
            {attachmentUrl ? (
              <p className="text-xs text-success">{t("attachmentReady")}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button disabled={disabled} onClick={() => submit.mutate()}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
