"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { trainerKeys } from "../query-keys";
import type { LeaveStatus } from "@/types/Shift";

const STATUS_VARIANT: Record<LeaveStatus, "warning" | "success" | "destructive" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "default",
};

/** Đơn nghỉ PT đã gửi. Chỉ đơn còn PENDING mới huỷ được — đơn đã duyệt thì slot đã khoá. */
export function LeaveRequestList() {
  const t = useTranslations("ptLeave");
  const { toast } = useToast();
  const client = useQueryClient();
  const [page] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: trainerKeys.leaveRequests(page),
    queryFn: () => shiftService.myLeaveRequests({ page }),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => shiftService.cancelLeave(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trainerKeys.all });
      toast({ type: "success", title: t("cancelled") });
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  if (isLoading) return null;
  const rows = data?.content ?? [];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t("myRequests")}</h2>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("noRequests")}
        </p>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell className="max-w-[18rem] truncate" title={request.reason}>
                    {request.reason}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={STATUS_VARIANT[request.status]}>
                        {t(`statuses.${request.status}`)}
                      </Badge>
                      {/* Lý do từ chối là thứ PT cần nhất để sắp xếp lại — không giấu trong tooltip. */}
                      {request.status === "REJECTED" && request.rejectReason ? (
                        <p className="text-xs text-destructive">{request.rejectReason}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "PENDING" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(request.id)}
                      >
                        {t("cancelRequest")}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </section>
  );
}
