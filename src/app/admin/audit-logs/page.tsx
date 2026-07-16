"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";

function timeText(v?: string) {
  return v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(v)) : "—";
}

/** UC-077: nhật ký kiểm toán (Admin). Tiêu thụ /api/admin/audit-logs. */
export default function AdminAuditLogsRoute() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [actor, setActor] = useState("");
  const [page, setPage] = useState(0);
  const [applied, setApplied] = useState<{ action?: string; targetType?: string; actor?: string }>({});

  const query = useQuery({
    queryKey: ["admin", "audit-logs", applied, page],
    queryFn: () => adminService.getAuditLogs({ page, size: 20, ...applied }),
  });
  const items = query.data?.content ?? [];

  function apply() {
    setPage(0);
    setApplied({
      action: action.trim() || undefined,
      targetType: targetType.trim() || undefined,
      actor: actor.trim() || undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">Nhật ký kiểm toán</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Theo dõi các hành động nhạy cảm trên hệ thống (UC-077).
        </p>
      </section>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Hành động
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="VD: DISPUTE_RESOLVE" className="w-52" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Đối tượng
          <Input value={targetType} onChange={(e) => setTargetType(e.target.value)} placeholder="VD: Booking" className="w-44" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Người thực hiện
          <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="username" className="w-44" />
        </label>
        <Button onClick={apply}>Lọc</Button>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được nhật ký" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Không có bản ghi" description="Chưa có hành động nào khớp bộ lọc." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Thời gian</th>
                <th className="p-3">Hành động</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Mô tả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">{timeText(l.timestamp)}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-black">
                      <ClipboardList className="size-3" />{l.action}
                    </span>
                  </td>
                  <td className="p-3">{l.targetType}{l.targetId ? ` #${l.targetId}` : ""}</td>
                  <td className="p-3 font-semibold">{l.actor}</td>
                  <td className="p-3 text-muted-foreground">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-5 flex items-center justify-end gap-3">
          <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-bold">{page + 1} / {query.data?.totalPages}</span>
          <Button variant="outline" size="icon-sm" disabled={query.data?.last} onClick={() => setPage((v) => v + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
