"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Pencil } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import {
  notificationTemplateService,
  type NotificationTemplate,
} from "@/services/notification-template.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";

/** UC-075: quản trị template thông báo — tắt/thiếu template thì hệ thống dùng văn bản mặc định. */
export default function AdminNotificationTemplatesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [enabled, setEnabled] = useState(true);

  const query = useQuery({
    queryKey: ["admin", "notification-templates"],
    queryFn: notificationTemplateService.list,
  });

  const save = useMutation({
    mutationFn: () =>
      notificationTemplateService.update(editing!.code!, {
        title: title.trim(),
        body: body.trim(),
        enabled,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "notification-templates"] });
      setEditing(null);
      toast({ type: "success", title: t("admin.notificationTemplates.savedTitle") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  function openEdit(tpl: NotificationTemplate) {
    setEditing(tpl);
    setTitle(tpl.title ?? "");
    setBody(tpl.body ?? "");
    setEnabled(tpl.enabled ?? true);
  }
  function submit() {
    if (!title.trim() || !body.trim()) {
      toast({ type: "warning", title: t("admin.notificationTemplates.missingFields") });
      return;
    }
    save.mutate();
  }

  const items = query.data ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader
        title={t("admin.notificationTemplates.title")}
        description={t("admin.notificationTemplates.subtitle")}
      />

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("admin.notificationTemplates.loadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("admin.notificationTemplates.emptyTitle")} description={t("admin.notificationTemplates.emptyDescription")} />
      ) : (
        <ul className="space-y-2">
          {items.map((tpl) => (
            <li key={tpl.code} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* BUG-07: phải là <div>, không phải <p> — Badge render ra <div>,
                      mà <div> lồng trong <p> là HTML không hợp lệ nên trình duyệt tự
                      đóng thẻ <p> sớm, gây lệch cây DOM và hydration error. */}
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <BellRing className="size-4 text-primary" />
                    <span className="font-mono text-xs">{tpl.code}</span>
                    <Badge className={tpl.enabled ? "bg-success-muted text-success" : "bg-muted text-muted-foreground"}>
                      {tpl.enabled ? t("admin.notificationTemplates.active") : t("admin.notificationTemplates.inactive")}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{tpl.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{tpl.body}</p>
                  {tpl.placeholders && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {/* BUG-10 (cùng loại): nhãn này trước đây hardcode tiếng Anh,
                          không đổi theo locale. Dùng lại key đã có ở dialog sửa. */}
                      {t("admin.notificationTemplates.placeholders")}{" "}
                      <span className="font-mono">{tpl.placeholders}</span>
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" aria-label={t("common.actions.edit")} onClick={() => openEdit(tpl)}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} title={t("admin.notificationTemplates.editDialogTitle", { code: editing?.code ?? "" })} onClose={() => setEditing(null)}>
        <div className="space-y-4">
          {editing?.placeholders && (
            <p className="text-xs text-muted-foreground">
              {t("admin.notificationTemplates.placeholders")} <span className="font-mono">{editing.placeholders}</span>
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("admin.notificationTemplates.fieldTitle")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("admin.notificationTemplates.fieldBody")}</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            {t("admin.notificationTemplates.useTemplate")}
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>{t("common.actions.cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {save.isPending ? t("common.states.saving") : t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
