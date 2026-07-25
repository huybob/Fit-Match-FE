"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarCheck, Check, Flag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import {
  issueReportService,
  type IssueReport,
  type IssueReportStatus,
} from "@/services/issue-report.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";

const statusLabels: Record<IssueReportStatus, string> = {
  OPEN: "Đang mở",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Bỏ qua",
};
const statusClass: Record<IssueReportStatus, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  DISMISSED: "bg-muted text-muted-foreground",
};
const targetIcons = { GYM: Building2, PT: UserRound, BOOKING: CalendarCheck };
const targetLabels = { GYM: "Phòng gym", PT: "Huấn luyện viên", BOOKING: "Booking" };

function timeText(v?: string) {
  return v
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(v))
    : "";
}

/** UC-070/071: hàng đợi báo cáo vấn đề dịch vụ/hành vi (ADMIN/MODERATOR). */
export default function AdminIssueReportsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"all" | IssueReportStatus>("OPEN");
  const [deciding, setDeciding] = useState<{ report: IssueReport; action: "resolve" | "dismiss" } | null>(null);
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["admin", "issue-reports", status],
    queryFn: () =>
      issueReportService.adminQueue(status === "all" ? {} : { status }),
  });

  const decideMut = useMutation({
    mutationFn: () =>
      deciding!.action === "resolve"
        ? issueReportService.adminResolve(deciding!.report.id!, note.trim() || undefined)
        : issueReportService.adminDismiss(deciding!.report.id!, note.trim() || undefined),
    onSuccess: () => {
      toast({ type: "success", title: deciding?.action === "resolve" ? "Đã xử lý báo cáo" : "Đã bỏ qua báo cáo" });
      qc.invalidateQueries({ queryKey: ["admin", "issue-reports"] });
      setDeciding(null);
      setNote("");
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) }),
  });

  const items = query.data?.content ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Báo cáo vấn đề"
          description="Báo cáo hành vi/chất lượng dịch vụ nhắm tới Gym, PT, Booking (UC-070/071)."
        />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Đang mở</SelectItem>
            <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
            <SelectItem value="DISMISSED">Bỏ qua</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được báo cáo" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Không có báo cáo nào" description="Hàng đợi trống với bộ lọc hiện tại." />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const Icon = targetIcons[r.targetType ?? "GYM"];
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      <Flag className="size-4 text-destructive" />
                      #{r.id} · {targetLabels[r.targetType ?? "GYM"]}
                      <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Icon className="size-3.5" />
                        {r.targetName ?? `#${r.targetId}`}
                      </span>
                      <Badge className={statusClass[r.status ?? "OPEN"]}>
                        {statusLabels[r.status ?? "OPEN"]}
                      </Badge>
                    </p>
                    <p className="mt-1.5 text-sm text-foreground">{r.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bởi <b>{r.reportedBy}</b> · {timeText(r.createdAt)}
                      {r.moderatorNote && <> · Ghi chú xử lý: {r.moderatorNote}</>}
                    </p>
                  </div>
                  {r.status === "OPEN" && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => { setDeciding({ report: r, action: "resolve" }); setNote(""); }}
                      >
                        <Check className="size-3.5" /> Xử lý
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => { setDeciding({ report: r, action: "dismiss" }); setNote(""); }}
                      >
                        <X className="size-3.5" /> Bỏ qua
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={!!deciding}
        title={deciding?.action === "resolve" ? "Xử lý báo cáo" : "Bỏ qua báo cáo"}
        onClose={() => setDeciding(null)}
      >
        <p className="text-sm text-muted-foreground">
          {deciding?.action === "resolve"
            ? "Xác nhận đã có hành động xử lý (cảnh báo, đình chỉ, gỡ nội dung...)."
            : "Xác nhận báo cáo không vi phạm / không đủ căn cứ."}
        </p>
        <Textarea
          className="mt-3"
          rows={3}
          maxLength={500}
          placeholder="Ghi chú xử lý (tùy chọn, tối đa 500 ký tự)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeciding(null)}>Hủy</Button>
          <Button
            disabled={decideMut.isPending}
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => decideMut.mutate()}
          >
            {decideMut.isPending ? "Đang lưu..." : "Xác nhận"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
