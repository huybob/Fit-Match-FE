"use client";

import { CheckCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import type { NotificationItem } from "@/services/notification.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/use-notification";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/use-formatters";

/* Nhãn nhóm thông báo ở notification.category.* */


export function NotificationInbox() {
  const t = useTranslations();
  const [page, setPage] = useState(0);
  const query = useNotifications(page);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const { toast } = useToast();
  const items = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const hasUnread = items.some((n) => !n.read);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{t("notification.inboxTitle")}</h2>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={async () => {
              try {
                await markAll.mutateAsync();
              } catch (e) {
                toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) });
              }
            }}
          >
            <CheckCheck className="size-4" /> {t("notification.markAllRead")}
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("notification.loadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("notification.empty")} description={t("notification.emptyHint")} />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((n) => (
              <NotificationRow key={n.id} item={n} onOpen={() => !n.read && markRead.mutate(n.id)} />
            ))}
          </ul>
          {/* E-20: phân trang — trước đây chỉ xem được 20 thông báo mới nhất */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
                {t("common.actions.previous")}
              </Button>
              <span className="text-sm font-bold">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((v) => v + 1)}>
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NotificationRow({ item, onOpen }: { item: NotificationItem; onOpen: () => void }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const inner = (
    <div
      className={cn(
        "rounded-2xl border p-4 transition",
        item.read ? "border-border bg-card" : "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
          {t(`notification.category.${item.category}`)}
        </span>
        <span className="text-xs text-muted-foreground">{fmt.dateTimeShort(item.createdAt)}</span>
      </div>
      <p className="mt-2 font-bold">{item.title}</p>
      {item.body && <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>}
    </div>
  );

  if (item.link) {
    return (
      <li>
        <Link href={item.link} onClick={onOpen} className="block">
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        className="block w-full rounded-xl text-left transition-colors hover:bg-muted/40"
        onClick={onOpen}
      >
        {inner}
      </button>
    </li>
  );
}
