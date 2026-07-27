"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { useToast } from "@/lib/toast-provider";
import { cmsService, type CmsContent, type CmsContentRequest, type CmsType } from "@/services/cms.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";

/** Nhãn loại nội dung: BANNER/FAQ/BLOG là tên riêng nên giữ nguyên,
 *  chỉ FEATURED cần dịch (resolve trong component qua t()). */
const TYPE_ORDER: CmsType[] = ["BANNER", "FAQ", "BLOG", "FEATURED"];
const staticTypeLabels: Partial<Record<CmsType, string>> = {
  BANNER: "Banner",
  FAQ: "FAQ",
  BLOG: "Blog",
};

export default function AdminCmsRoute() {
  const t = useTranslations();
  const typeLabel = (type: CmsType) => staticTypeLabels[type] ?? t("admin.cms.typeFeatured");
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "cms"], queryFn: () => cmsService.list() });
  const [editing, setEditing] = useState<CmsContent | null | undefined>();
  const items = query.data ?? [];

  const remove = useMutation({
    mutationFn: (id: number) => cmsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "cms"] }),
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{t("admin.cms.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.cms.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing(null)}><Plus className="size-4" /> {t("admin.cms.create")}</Button>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("common.states.errorTitle")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("admin.cms.emptyTitle")} description={t("admin.cms.emptyDescription")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-black"><FileText className="size-4 text-accent" />{c.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{typeLabel(c.type)}</Badge>
                  <Badge variant={c.published ? "success" : "warning"}>{c.published ? t("admin.cms.published") : t("admin.cms.draft")}</Badge>
                </div>
              </div>
              {c.body && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.body}</p>}
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => setEditing(c)}>{t("common.actions.edit")}</Button>
                <ConfirmDialog
                  label={t("common.actions.delete")}
                  title={t("admin.cms.deleteTitle")}
                  description={t("admin.cms.deleteDescription")}
                  onConfirm={() => remove.mutate(c.id)}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {editing !== undefined && <CmsDialog content={editing} onClose={() => setEditing(undefined)} />}
    </main>
  );
}

function CmsDialog({ content, onClose }: { content: CmsContent | null; onClose: () => void }) {
  const t = useTranslations();
  const typeLabel = (type: CmsType) => staticTypeLabels[type] ?? t("admin.cms.typeFeatured");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<CmsContentRequest>({
    type: content?.type ?? "BANNER",
    title: content?.title ?? "",
    body: content?.body ?? "",
    imageUrl: content?.imageUrl ?? "",
    link: content?.link ?? "",
    sortOrder: content?.sortOrder ?? 0,
    published: content?.published ?? false,
  });
  const set = (patch: Partial<CmsContentRequest>) => setForm((f) => ({ ...f, ...patch }));

  const save = useMutation({
    mutationFn: () => (content ? cmsService.update(content.id, form) : cmsService.create(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cms"] });
      toast({ type: "success", title: content ? t("admin.cms.updated") : t("admin.cms.created") });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={content ? t("admin.cms.editTitle") : t("admin.cms.create")} onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.cms.fieldType")}
          <Select value={form.type} onValueChange={(v) => set({ type: v as CmsType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_ORDER.map((type) => (
                <SelectItem key={type} value={type}>{typeLabel(type)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.cms.fieldTitle")} <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.cms.fieldBody")} <Textarea value={form.body ?? ""} onChange={(e) => set({ body: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.cms.fieldImage")} <Input value={form.imageUrl ?? ""} onChange={(e) => set({ imageUrl: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.cms.fieldLink")} <Input value={form.link ?? ""} onChange={(e) => set({ link: e.target.value })} placeholder="/gyms/123" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
            {t("admin.cms.fieldSort")} <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
          </label>
          <CheckboxField
            className="items-end pb-2"
            checked={!!form.published}
            onCheckedChange={(published) => set({ published })}
            label={t("admin.cms.fieldPublished")}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={save.isPending || !form.title.trim()} onClick={() => save.mutate()}>{t("common.actions.save")}</Button>
        <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
      </div>
    </Dialog>
  );
}
