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

/** UC-075: quản trị template thông báo — tắt/thiếu template thì hệ thống dùng văn bản mặc định. */
export default function AdminNotificationTemplatesPage() {
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
      toast({ type: "success", title: "Đã lưu template" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  function openEdit(t: NotificationTemplate) {
    setEditing(t);
    setTitle(t.title ?? "");
    setBody(t.body ?? "");
    setEnabled(t.enabled ?? true);
  }
  function submit() {
    if (!title.trim() || !body.trim()) {
      toast({ type: "warning", title: "Nhập tiêu đề và nội dung" });
      return;
    }
    save.mutate();
  }

  const items = query.data ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <PageHeader
        title="Template thông báo"
        description="Nội dung thông báo theo sự kiện (UC-075). Placeholder dạng {key} được thay lúc gửi; tắt template thì dùng văn bản mặc định của hệ thống."
      />

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được template" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có template" description="Template được seed bằng migration." />
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <li key={t.code} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    <BellRing className="size-4 text-primary" />
                    <span className="font-mono text-xs">{t.code}</span>
                    <Badge className={t.enabled ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                      {t.enabled ? "Đang dùng" : "Tắt (dùng mặc định)"}
                    </Badge>
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.body}</p>
                  {t.placeholders && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Placeholder: <span className="font-mono">{t.placeholders}</span>
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" aria-label="Sửa" onClick={() => openEdit(t)}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} title={`Sửa template ${editing?.code ?? ""}`} onClose={() => setEditing(null)}>
        <div className="space-y-4">
          {editing?.placeholders && (
            <p className="text-xs text-muted-foreground">
              Placeholder khả dụng: <span className="font-mono">{editing.placeholders}</span>
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tiêu đề</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nội dung</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            Sử dụng template này (tắt = dùng văn bản mặc định)
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={submit} disabled={save.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {save.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
