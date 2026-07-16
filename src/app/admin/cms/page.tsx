"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import { cmsService, type CmsContent, type CmsContentRequest, type CmsType } from "@/services/cms.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";

const typeLabels: Record<CmsType, string> = {
  BANNER: "Banner",
  FAQ: "FAQ",
  BLOG: "Blog",
  FEATURED: "Nổi bật",
};

export default function AdminCmsRoute() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "cms"], queryFn: () => cmsService.list() });
  const [editing, setEditing] = useState<CmsContent | null | undefined>();
  const items = query.data ?? [];

  const remove = useMutation({
    mutationFn: (id: number) => cmsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "cms"] }),
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">Nội dung CMS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Banner, FAQ, blog và chiến dịch nổi bật hiển thị trên trang chủ (UC-074).</p>
        </div>
        <Button onClick={() => setEditing(null)}><Plus className="size-4" /> Tạo nội dung</Button>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có nội dung" description="Tạo banner hoặc mục nổi bật đầu tiên." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-black"><FileText className="size-4 text-accent" />{c.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{typeLabels[c.type]}</Badge>
                  <Badge variant={c.published ? "success" : "warning"}>{c.published ? "Hiển thị" : "Nháp"}</Badge>
                </div>
              </div>
              {c.body && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.body}</p>}
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => setEditing(c)}>Sửa</Button>
                <Button variant="destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="size-4" /></Button>
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
      toast({ type: "success", title: content ? "Đã cập nhật" : "Đã tạo nội dung" });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={content ? "Sửa nội dung" : "Tạo nội dung"} onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Loại
          <Select value={form.type} onValueChange={(v) => set({ type: v as CmsType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(typeLabels) as CmsType[]).map((t) => (
                <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Tiêu đề <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Nội dung <Textarea value={form.body ?? ""} onChange={(e) => set({ body: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Ảnh (URL) <Input value={form.imageUrl ?? ""} onChange={(e) => set({ imageUrl: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Liên kết <Input value={form.link ?? ""} onChange={(e) => set({ link: e.target.value })} placeholder="/gyms/123" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
            Thứ tự <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm font-bold">
            <input type="checkbox" checked={!!form.published} onChange={(e) => set({ published: e.target.checked })} />
            Hiển thị công khai
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={save.isPending || !form.title.trim()} onClick={() => save.mutate()}>Lưu</Button>
        <Button variant="outline" onClick={onClose}>Hủy</Button>
      </div>
    </Dialog>
  );
}
