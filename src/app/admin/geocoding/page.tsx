"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, MapPinOff, AlertTriangle, Hand, Database, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { adminService } from "@/services/admin.service";
import type { GeocodingCoverage } from "@/types/Admin";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";

/** Mỗi lần bấm = tối đa ngần này lượt gọi Google, nên không để admin gõ số tuỳ ý. */
const BACKFILL_LIMIT = 50;

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  hint?: string;
  tone?: "warning";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon className={tone === "warning" ? "size-4 text-warning" : "size-4 text-primary"} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * UC-18 (V59/V60): theo dõi phủ toạ độ.
 *
 * Vấn đề trang này giải: gym thiếu toạ độ KHÔNG bao giờ xuất hiện trong "tìm gym
 * quanh đây" và cũng không báo lỗi ở đâu cả — geocode là fail-soft nên hồ sơ vẫn
 * lưu bình thường. Trước đây chỉ có cách đọc log mới biết.
 */
export default function AdminGeocodingPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "geocoding-coverage"],
    queryFn: adminService.getGeocodingCoverage,
  });

  const backfill = useMutation({
    mutationFn: () => adminService.runGeocodingBackfill(BACKFILL_LIMIT),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin", "geocoding-coverage"] });
      toast({
        type: "success",
        title: t("admin.geocoding.backfillDone", {
          updated: (result.gymsUpdated ?? 0) + (result.branchesUpdated ?? 0),
          remaining: result.remaining ?? 0,
        }),
      });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  const coverage: GeocodingCoverage = data ?? {};
  const gymsTotal = coverage.gymsTotal ?? 0;
  const gymsGeocoded = coverage.gymsGeocoded ?? 0;
  const branchesTotal = coverage.branchesTotal ?? 0;
  const branchesGeocoded = coverage.branchesGeocoded ?? 0;
  const missing = gymsTotal - gymsGeocoded + (branchesTotal - branchesGeocoded);

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("admin.geocoding.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.geocoding.subtitle")}</p>
          </div>
          <Button
            onClick={() => backfill.mutate()}
            disabled={backfill.isPending || missing === 0 || coverage.enabled === false}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {backfill.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("admin.geocoding.runBackfill", { limit: BACKFILL_LIMIT })}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">{toErrorMessage(error)}</p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => refetch()}>
              {t("common.actions.retry")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Không có API key thì mọi con số bên dưới đứng yên vĩnh viễn — nói
                thẳng ra thay vì để admin bấm backfill và tự hỏi vì sao không đổi. */}
            {coverage.enabled === false && (
              <p className="rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-xs font-semibold text-warning">
                {t("admin.geocoding.disabledNotice")}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={MapPin}
                label={t("admin.geocoding.gymsGeocoded")}
                value={`${gymsGeocoded}/${gymsTotal}`}
                hint={t("admin.geocoding.percentCovered", {
                  percent: percent(gymsGeocoded, gymsTotal),
                })}
              />
              <StatCard
                icon={MapPin}
                label={t("admin.geocoding.branchesGeocoded")}
                value={`${branchesGeocoded}/${branchesTotal}`}
                hint={t("admin.geocoding.percentCovered", {
                  percent: percent(branchesGeocoded, branchesTotal),
                })}
              />
              <StatCard
                icon={AlertTriangle}
                tone="warning"
                label={t("admin.geocoding.imprecise")}
                value={String(coverage.gymsImprecise ?? 0)}
                hint={t("admin.geocoding.impreciseHint")}
              />
              <StatCard
                icon={Hand}
                label={t("admin.geocoding.pinned")}
                value={String(coverage.gymsPinned ?? 0)}
                hint={t("admin.geocoding.pinnedHint")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                icon={MapPinOff}
                tone={missing > 0 ? "warning" : undefined}
                label={t("admin.geocoding.missing")}
                value={String(missing)}
                hint={t("admin.geocoding.missingHint")}
              />
              <StatCard
                icon={Database}
                label={t("admin.geocoding.cached")}
                value={String(coverage.cachedQueries ?? 0)}
                hint={t("admin.geocoding.cachedHint")}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
