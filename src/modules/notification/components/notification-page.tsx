"use client";

import { Megaphone, Loader2 } from "lucide-react";
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
import { NotificationInbox } from "./notification-inbox";
import { useTranslations } from "next-intl";

// E-14 (audit 2026-07-17): gỡ 3 toggle email/push/nhắc nhở — BE lưu nhưng KHÔNG BAO GIỜ
// đọc khi gửi (chưa có kênh email/push cho notification, chưa có reminder scheduler)
// → toggle vô hiệu đánh lừa người dùng. Thêm lại khi kênh tương ứng tồn tại (Phase 5).
const PREFS: {
  key: keyof UpdateNotificationPreferenceRequest;
  labelKey: "notification.pref.marketingEnabled";
  descKey: "notification.pref.marketingEnabledDesc";
  icon: React.ElementType;
}[] = [
  {
    key: "marketingEnabled",
    labelKey: "notification.pref.marketingEnabled",
    descKey: "notification.pref.marketingEnabledDesc",
    icon: Megaphone,
  },
];

export function NotificationPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const [tab, setTab] = useState<"inbox" | "settings">("inbox");
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
      toast({ type: "success", title: t("notification.settingsSaved") });
    } catch (error) {
      toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(error) });
    }
  }

  const isDirty =
    query.data &&
    PREFS.some(({ key }) => values[key] !== query.data?.[key]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6">
        <div className="mb-1 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">{t("notification.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("notification.subtitle")}
        </p>
      </section>

      <div className="mb-5 inline-flex rounded-2xl border border-border bg-card p-1">
        {(["inbox", "settings"] as const).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={cn(
              "cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition",
              tab === tabKey
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabKey === "inbox" ? t("notification.tabInbox") : t("notification.tabSettings")}
          </button>
        ))}
      </div>

      {tab === "inbox" ? (
        <NotificationInbox />
      ) : query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={t("notification.settingsLoadError")}
          description={toErrorMessage(query.error)}
        />
      ) : (
        <div className="space-y-3">
          {PREFS.map(({ key, labelKey, descKey, icon: Icon }) => {
            const enabled = !!values[key];
            return (
              <button
                key={key}
                type="button"
                // Nút hoạt động như công tắc bật/tắt -> aria-pressed để screen reader
                // đọc đúng trạng thái thay vì chỉ đọc nhãn.
                aria-pressed={enabled}
                onClick={() => toggle(key)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition",
                  enabled
                    ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-card hover:border-ring/50 hover:bg-muted/40",
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
                  <strong className="block text-sm font-semibold">{t(labelKey)}</strong>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t(descKey)}</span>
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
                      "pointer-events-none inline-block size-5 rounded-full bg-card shadow-md transition-transform",
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
              {t("common.actions.saveChanges")}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
