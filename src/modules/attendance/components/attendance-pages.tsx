"use client";

import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  UserRound,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttendance } from "../hooks/use-attendance";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";

const statusVariant: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  ON_TIME: "success",
  LATE: "warning",
  ABSENT: "destructive",
};

function dateTime(value: string | undefined, language: string) {
  return value
    ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

export function AttendancePage({ scope }: { scope: "customer" | "pt" }) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const query = useAttendance(scope, page);
  const items = query.data?.content ?? [];
  const stats = {
    onTime: items.filter((x) => x.status === "ON_TIME").length,
    late: items.filter((x) => x.status === "LATE").length,
    absent: items.filter((x) => x.status === "ABSENT").length,
  };

  return (
    <div>
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">{t(`attendance.${scope}Title`)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(`attendance.${scope}Description`)}
        </p>
      </section>

      {!!items.length && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Stat
            icon={CheckCircle2}
            label={t("attendance.statuses.ON_TIME")}
            value={stats.onTime}
          />
          <Stat
            icon={Clock3}
            label={t("attendance.statuses.LATE")}
            value={stats.late}
          />
          <Stat
            icon={XCircle}
            label={t("attendance.statuses.ABSENT")}
            value={stats.absent}
          />
        </div>
      )}

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={t("attendance.loadError")}
          description={toErrorMessage(query.error)}
        />
      ) : !items.length ? (
        <EmptyState
          title={t("attendance.empty")}
          description={t("attendance.emptyDescription")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Session #{item.trainingSessionId}
                </p>
                <Badge
                  variant={
                    item.status
                      ? (statusVariant[item.status] ?? "default")
                      : "default"
                  }
                >
                  {item.status
                    ? t(`attendance.statuses.${item.status}`)
                    : "—"}
                </Badge>
              </div>
              <h2 className="mt-2 flex items-center gap-2 text-lg font-black">
                <UserRound className="size-4 text-accent" />
                {item.customerName ?? t("attendance.me")}
              </h2>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <span>
                  {t("attendance.checkIn")}:{" "}
                  {dateTime(item.checkInTime, i18n.language)}
                </span>
                <span>
                  {t("attendance.checkOut")}:{" "}
                  {dateTime(item.checkOutTime, i18n.language)}
                </span>
              </div>
              {item.sessionNotes && (
                <p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
                  {item.sessionNotes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={page === 0}
            onClick={() => setPage((v) => v - 1)}
          >
            {t("common.previous")}
          </Button>
          <Button
            disabled={query.data?.last}
            onClick={() => setPage((v) => v + 1)}
          >
            {t("common.next")}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarCheck2;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Icon className="size-5 text-accent" />
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
