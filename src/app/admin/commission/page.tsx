"use client";

// E-2 (audit 2026-07-17, UC-072): trước đây BE AdminCommissionController hoàn chỉnh nhưng
// KHÔNG có trang FE — admin chỉ chỉnh commission/hold-days bằng gọi API tay.
// Lưu ý: commission áp cho booking mới theo snapshot lúc settle (V34) — không hồi tố.

import { useEffect, useState } from "react";
import { Loader2, Percent } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type CommissionConfig } from "@/services/admin.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";

export default function AdminCommissionPage() {
  const { toast } = useToast();
  const client = useQueryClient();
  const [commission, setCommission] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [holdDays, setHoldDays] = useState("");

  const query = useQuery({
    queryKey: ["admin", "commission-config"],
    queryFn: adminService.getCommissionConfig,
  });

  useEffect(() => {
    if (!query.data) return;
    setCommission(String(query.data.commissionPercent ?? ""));
    setPlatformFee(String(query.data.platformFeePercent ?? ""));
    setHoldDays(String(query.data.settlementHoldDays ?? ""));
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      adminService.updateCommissionConfig({
        commissionPercent: Number(commission),
        platformFeePercent: Number(platformFee),
        settlementHoldDays: Number(holdDays),
      } as CommissionConfig),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "commission-config"] });
      toast({ type: "success", title: "Đã lưu cấu hình", description: "Áp dụng cho booking chốt settlement từ giờ trở đi (không hồi tố)." });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  const pctInvalid = (v: string) => v !== "" && (Number(v) < 0 || Number(v) > 100);
  const invalid =
    !commission || !platformFee || !holdDays ||
    pctInvalid(commission) || pctInvalid(platformFee) ||
    !Number.isInteger(Number(holdDays)) || Number(holdDays) < 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Hoa hồng & quy tắc nền tảng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          UC-072 — mỗi lần lưu tạo bản ghi cấu hình mới (giữ lịch sử, ghi audit); commission
          được snapshot vào booking lúc chốt settlement nên không ảnh hưởng booking cũ.
        </p>
      </div>

      <div className="max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        {query.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : query.isError ? (
          <p className="text-sm text-red-500">{toErrorMessage(query.error)}</p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Hoa hồng nền tảng (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input type="number" min={0} max={100} step={0.5} value={commission}
                  onChange={(e) => setCommission(e.target.value)} className="pr-9" />
                <Percent className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Trừ vào tiền giải ngân cho gym khi release (UC-059).</p>
              {pctInvalid(commission) && <p className="mt-1 text-xs text-red-500">Phải trong khoảng 0–100.</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Phí nền tảng (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input type="number" min={0} max={100} step={0.5} value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)} className="pr-9" />
                <Percent className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="mt-1 text-[11px] text-amber-700">
                Lưu ý: hiện chưa có công thức nào tiêu thụ phí này (C-8 — quyết định nghiệp vụ ở Phase 3).
              </p>
              {pctInvalid(platformFee) && <p className="mt-1 text-xs text-red-500">Phải trong khoảng 0–100.</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Thời gian giữ tiền sau hoàn tất (ngày) <span className="text-red-500">*</span>
              </label>
              <Input type="number" min={0} value={holdDays} onChange={(e) => setHoldDays(e.target.value)} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Buổi tập hoàn tất → tiền chờ đủ số ngày này (cửa sổ khiếu nại) rồi mới giải ngân cho gym.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => save.mutate()} disabled={invalid || save.isPending}
                className="gap-2 bg-primary hover:bg-primary/90 text-white">
                {save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu cấu hình
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
