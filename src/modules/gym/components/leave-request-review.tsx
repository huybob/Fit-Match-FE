"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Paperclip, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { resolveFileUrl } from "@/services/file.service";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  DialogRoot,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { leaveKeys } from "../shift-query-keys";
import type { LeaveStatus, PtLeaveRequest } from "@/types/Shift";

const STATUS_VARIANT: Record<LeaveStatus, "warning" | "success" | "destructive" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "default",
};

const FILTERS: (LeaveStatus | "ALL")[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ALL"];

/**
 * Gym duyệt / từ chối đơn nghỉ của PT.
 *
 * Duyệt là thao tác có HỆ QUẢ TIỀN: buổi tập của khách nằm trong phạm vi đơn sẽ
 * bị gỡ PT và khách được quyền chọn đổi PT hay nhận hoàn phụ phí HLV. Vì vậy
 * hộp thoại duyệt nói rõ điều đó trước khi Gym bấm, thay vì để Gym phát hiện qua
 * khiếu nại của khách.
 */
export function LeaveRequestReview() {
  const t = useTranslations("gymLeave");
  const { toast } = useToast();
  const client = useQueryClient();

  const [status, setStatus] = useState<LeaveStatus | "ALL">("PENDING");
  const [rejecting, setRejecting] = useState<PtLeaveRequest | null>(null);
  const [approving, setApproving] = useState<PtLeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: leaveKeys.gym(status === "ALL" ? undefined : status, 0),
    queryFn: () =>
      shiftService.gymLeaveRequests({ status: status === "ALL" ? undefined : status, page: 0 }),
  });

  const approve = useMutation({
    mutationFn: (id: number) => shiftService.approveLeave(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: leaveKeys.all });
      toast({ type: "success", title: t("approved") });
      setApproving(null);
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      shiftService.rejectLeave(id, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: leaveKeys.all });
      toast({ type: "success", title: t("rejected") });
      setRejecting(null);
      setRejectReason("");
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  if (isLoading) return <LoadingSkeleton />;
  const rows = data?.content ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as LeaveStatus | "ALL")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "ALL" ? t("filterAll") : t(`statuses.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("trainer")}</TableHead>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("scope")}</TableHead>
                <TableHead>{t("reason")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.ptName}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {request.fromDate}
                    {request.toDate !== request.fromDate ? ` → ${request.toDate}` : ""}
                  </TableCell>
                  <TableCell>{t(`types.${request.type}`)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.scope === "SHIFT" && request.shiftNames?.length
                      ? request.shiftNames.join(", ")
                      : request.scope === "TIME_RANGE" && request.startTime && request.endTime
                        ? `${request.startTime.slice(0, 5)}–${request.endTime.slice(0, 5)}`
                        : t(`scopes.${request.scope}`)}
                  </TableCell>
                  <TableCell className="max-w-[16rem]">
                    <p className="truncate" title={request.reason}>
                      {request.reason}
                    </p>
                    {request.attachmentUrl ? (
                      <a
                        href={resolveFileUrl(request.attachmentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Paperclip className="size-3" />
                        {t("attachment")}
                      </a>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={STATUS_VARIANT[request.status]}>
                        {t(`statuses.${request.status}`)}
                      </Badge>
                      {request.rejectReason ? (
                        <p className="text-xs text-destructive">{request.rejectReason}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "PENDING" ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setApproving(request)}>
                          <Check className="mr-1 size-4" />
                          {t("approve")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRejecting(request)}>
                          <X className="mr-1 size-4" />
                          {t("reject")}
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DialogRoot open={approving !== null} onOpenChange={(next) => !next && setApproving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("approveTitle")}</DialogTitle>
            <DialogDescription>{t("approveConsequence")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={approve.isPending}
              onClick={() => approving && approve.mutate(approving.id)}
            >
              {t("approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot open={rejecting !== null} onOpenChange={(next) => !next && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectHint")}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={rejectReason}
            placeholder={t("rejectPlaceholder")}
            onChange={(event) => setRejectReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={reject.isPending || rejectReason.trim().length < 5}
              onClick={() =>
                rejecting && reject.mutate({ id: rejecting.id, reason: rejectReason.trim() })
              }
            >
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </section>
  );
}
