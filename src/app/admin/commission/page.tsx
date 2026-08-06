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
import { FieldShell } from "@/modules/forms/form-controls";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";

export default function AdminCommissionPage() {
  const t = useTranslations();
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
      toast({ type: "success", title: t("admin.commission.savedTitle"), description: t("admin.commission.savedDescription") });
    },
    onError: (e) => toast({ type: "error", title: t("admin.commission.saveFailed"), description: toErrorMessage(e) }),
  });

  const pctInvalid = (v: string) => v !== "" && (Number(v) < 0 || Number(v) > 100);
  const invalid =
    !commission || !platformFee || !holdDays ||
    pctInvalid(commission) || pctInvalid(platformFee) ||
    !Number.isInteger(Number(holdDays)) || Number(holdDays) < 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.commission.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.commission.note")}
        </p>
      </div>

      <div className="max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        {query.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : query.isError ? (
          <p className="text-sm text-destructive">{toErrorMessage(query.error)}</p>
        ) : (
          <div className="space-y-5">
            {/* FieldShell nối nhãn với ô nhập (htmlFor/id) — <label> rời như trước
                để lại 3 ô số không có tên khả truy cập. */}
            <div>
              <FieldShell label={`${t("admin.commission.rateLabel")} *`} htmlFor="commission-rate">
                <div className="relative">
                  <Input id="commission-rate" type="number" min={0} max={100} step={0.5} value={commission}
                    onChange={(e) => setCommission(e.target.value)} className="pr-9" />
                  <Percent className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </FieldShell>
              <p className="mt-1 text-[11px] text-muted-foreground">{t("admin.commission.rateHelp")}</p>
              {pctInvalid(commission) && <p className="mt-1 text-xs text-destructive">{t("common.validation.percentRange")}</p>}
            </div>

            <div>
              <FieldShell label={`${t("admin.commission.feeLabel")} *`} htmlFor="commission-fee">
                <div className="relative">
                  <Input id="commission-fee" type="number" min={0} max={100} step={0.5} value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)} className="pr-9" />
                  <Percent className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </FieldShell>
              <p className="mt-1 text-[11px] text-warning">
                {t("admin.commission.feeNote")}
              </p>
              {pctInvalid(platformFee) && <p className="mt-1 text-xs text-destructive">{t("common.validation.percentRange")}</p>}
            </div>

            <div>
              <FieldShell label={`${t("admin.commission.holdLabel")} *`}>
                <Input type="number" min={0} value={holdDays} onChange={(e) => setHoldDays(e.target.value)} />
              </FieldShell>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("admin.commission.holdHelp")}
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => save.mutate()} disabled={invalid || save.isPending}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                {save.isPending && <Loader2 className="size-4 animate-spin" />} {t("admin.commission.submit")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
