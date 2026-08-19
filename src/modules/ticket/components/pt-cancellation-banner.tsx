"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import { ticketService } from "@/services/ticket.service";
import { Button } from "@/shared/components/ui/button";
import { ptAvailabilityKeys, ptCancellationKeys, sessionKeys } from "../query-keys";

interface PtCancellationBannerProps {
  /** Chỉ hiện cho những buổi đang nằm trên màn hình; bỏ trống = hiện tất cả. */
  sessionIds?: number[];
  /** Mở lại màn chọn PT cho một buổi. */
  onPickReplacement?: (sessionId: string | number) => void;
}

/**
 * Buổi tập mất PT vì đơn nghỉ đã được Gym duyệt (BE §4.1).
 *
 * Buổi VẪN còn trên lịch và vé vẫn dùng được cả ngày — thứ khách mất là huấn
 * luyện viên. Vì vậy đây là banner cảnh báo có hai lối ra, không phải thông báo
 * huỷ: chọn HLV thay thế, hoặc nhận hoàn phụ phí HLV của đúng ngày đó.
 *
 * Nếu khách không chọn gì tới ngày tập, BE tự hoàn — nên banner không chặn thao
 * tác nào khác của khách.
 */
export function PtCancellationBanner({
  sessionIds,
  onPickReplacement,
}: PtCancellationBannerProps) {
  const t = useTranslations("ptCancellation");
  const { toast } = useToast();
  const client = useQueryClient();

  const { data } = useQuery({
    queryKey: ptCancellationKeys.mine(),
    queryFn: () => ticketService.myPtCancellations(),
  });

  const refund = useMutation({
    mutationFn: (sessionId: number) => ticketService.refundPtCancellation(sessionId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ptCancellationKeys.all });
      client.invalidateQueries({ queryKey: sessionKeys.all });
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
      toast({ type: "success", title: t("refunded") });
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  const items = (data ?? []).filter(
    (item) => !sessionIds || sessionIds.includes(item.sessionId),
  );
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const canRefund = (item.estimatedRefund ?? 0) > 0;
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-start gap-3 rounded-md border border-warning/40 bg-warning-muted p-3 text-sm"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">
                {t("headline", {
                  ptName: item.formerPtName ?? "",
                  date: item.sessionDate,
                  time: (item.formerSlotStart ?? "").slice(0, 5),
                })}
              </p>
              <p className="text-muted-foreground">
                {canRefund
                  ? t("choices", { amount: formatCurrency(item.estimatedRefund ?? 0) })
                  : t("choicesNoRefund")}
              </p>
            </div>
            <div className="flex gap-2">
              {onPickReplacement ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPickReplacement(item.sessionId)}
                >
                  {t("pickReplacement")}
                </Button>
              ) : null}
              {canRefund ? (
                <Button
                  size="sm"
                  disabled={refund.isPending}
                  onClick={() => refund.mutate(item.sessionId)}
                >
                  {t("takeRefund")}
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
