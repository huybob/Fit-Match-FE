"use client";

import { Bell, Mail, Megaphone, CalendarCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../hooks/use-notification";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { UpdateNotificationPreferenceRequest } from "@/types/Notification";
import { cn } from "@/shared/utils/cn.util";

const PREFS: {
  key: keyof UpdateNotificationPreferenceRequest;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    key: "emailEnabled",
    label: "Email thông báo",
    desc: "Nhận thông báo qua địa chỉ email đã đăng ký",
    icon: Mail,
  },
  {
    key: "pushEnabled",
    label: "Push notification",
    desc: "Nhận thông báo đẩy trên trình duyệt hoặc thiết bị di động",
    icon: Bell,
  },
  {
    key: "bookingReminders",
    label: "Nhắc nhở đặt lịch",
    desc: "Nhận nhắc nhở trước các buổi tập đã đặt lịch",
    icon: CalendarCheck,
  },
  {
    key: "marketingEnabled",
    label: "Thông báo marketing",
    desc: "Nhận các ưu đãi, khuyến mãi và tin tức từ FitMatch",
    icon: Megaphone,
  },
];

export function NotificationPage() {
  const { toast } = useToast();
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const [values, setValues] = useState<UpdateNotificationPreferenceRequest>({});

  useEffect(() => {
    if (query.data) setValues(query.data);
  }, [query.data]);

  function toggle(key: keyof UpdateNotificationPreferenceRequest) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    try {
      await update.mutateAsync(values);
      toast({ type: "success", title: "Đã lưu cài đặt thông báo" });
    } catch (error) {
      toast({ type: "error", title: "Lỗi", description: toErrorMessage(error) });
    }
  }

  const isDirty =
    query.data &&
    PREFS.some(({ key }) => values[key] !== query.data?.[key]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6">
        <div className="mb-1 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">Cài đặt thông báo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tuỳ chỉnh cách FitMatch gửi thông báo đến bạn
        </p>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title="Không thể tải cài đặt"
          description={toErrorMessage(query.error)}
        />
      ) : (
        <div className="space-y-3">
          {PREFS.map(({ key, label, desc, icon: Icon }) => {
            const enabled = !!values[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition",
                  enabled
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full transition",
                    enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <strong className="block text-sm font-semibold">{label}</strong>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
                </span>
                {/* Toggle */}
                <span
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                    enabled ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform",
                      enabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </span>
              </button>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={!isDirty || update.isPending}
              className="gap-2"
            >
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
