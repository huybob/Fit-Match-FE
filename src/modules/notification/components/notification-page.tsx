"use client";

import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
} from "../hooks/use-notification";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";

export function NotificationPage() {
  const [page, setPage] = useState(0);
  const query = useNotifications(page);
  const read = useReadNotification();
  const all = useReadAllNotifications();
  const items = query.data?.content ?? [];

  const date = (v?: string) =>
    v
      ? new Intl.DateTimeFormat(
          "vi-VN",
          { dateStyle: "medium", timeStyle: "short" },
        ).format(new Date(v))
      : "—";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{"Thông báo"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {"Xem tất cả thông báo của bạn"}
          </p>
        </div>
        <Button
          disabled={all.isPending || !items.some((x) => !x.read)}
          onClick={() => all.mutate()}
        >
          <CheckCheck className="size-4" />
          {"Đánh dấu tất cả đã đọc"}
        </Button>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={"Không thể tải thông báo"}
          description={toErrorMessage(query.error)}
        />
      ) : !items.length ? (
        <EmptyState
          title={"Không có thông báo"}
          description={"Bạn chưa có thông báo nào."}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!item.read && item.id) read.mutate(item.id);
              }}
              className={cn(
                "flex w-full gap-4 rounded-2xl border p-5 text-left transition",
                item.read
                  ? "border-border bg-card"
                  : "border-primary/40 bg-primary/5",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-primary">
                <Bell className="size-4" />
              </span>
              <span className="min-w-0">
                <strong className="block">{item.title}</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {item.body}
                </span>
                <span className="mt-2 block text-xs font-bold text-muted-foreground">
                  {date(item.createdAt)}
                </span>
              </span>
              {!item.read && (
                <span className="ml-auto mt-2 size-2 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={page === 0}
            onClick={() => setPage((v) => v - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            disabled={query.data?.last}
            onClick={() => setPage((v) => v + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
