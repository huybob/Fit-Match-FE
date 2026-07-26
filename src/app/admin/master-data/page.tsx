"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Loader2, Tag, SlidersHorizontal } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { systemConfigService, type SystemConfig } from "@/services/system-config.service";
import type {
  ServiceCategoryResponse, ServiceCategoryRequest,
} from "@/types/Admin";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";
import { DataTable } from "@/shared/components/common/data-table";

function ServiceCategories() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategoryResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin", "service-categories"],
    queryFn: adminService.listServiceCategories,
  });

  const save = useMutation({
    mutationFn: (payload: ServiceCategoryRequest) =>
      editing?.id != null
        ? adminService.updateServiceCategory(editing.id, payload)
        : adminService.createServiceCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "service-categories"] });
      close();
      toast({ type: "success", title: t("admin.masterData.categorySaved") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  function openCreate() { setEditing(null); setName(""); setDescription(""); setActive(true); setOpen(true); }
  function openEdit(c: ServiceCategoryResponse) { setEditing(c); setName(c.name ?? ""); setDescription(c.description ?? ""); setActive(c.active ?? true); setOpen(true); }
  function close() { setOpen(false); setEditing(null); }
  function submit() {
    if (!name.trim()) { toast({ type: "warning", title: t("admin.masterData.categoryNameRequired") }); return; }
    save.mutate({ name: name.trim(), description: description.trim() || undefined, active });
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Tag className="size-4 text-primary" /> {t("admin.masterData.categoriesTitle")}</h2>
        <Button onClick={openCreate} className="gap-2 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="size-3.5" />{t("common.actions.add")}</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : cats.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">{t("admin.masterData.categoriesEmpty")}</p>
      ) : (
        <DataTable
          rows={cats}
          rowKey={(c) => String(c.id)}
          emptyTitle={t("admin.masterData.emptyCategories")}
          columns={[
            {
              key: "name",
              header: t("common.table.name"),
              cellClassName: "font-semibold text-foreground",
              cell: (c) => c.name,
            },
            {
              key: "description",
              header: t("common.table.description"),
              hideBelow: "sm",
              cellClassName: "text-xs text-muted-foreground",
              cell: (c) => c.description || "—",
            },
            {
              key: "status",
              header: t("common.table.status"),
              cell: (c) => (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    c.active === false
                      ? "bg-muted text-muted-foreground"
                      : "bg-success-muted text-success"
                  }`}
                >
                  {c.active === false ? t("common.states.off") : t("common.states.on")}
                </span>
              ),
            },
            {
              key: "actions",
              header: t("common.actions.edit"),
              align: "right",
              cell: (c) => (
                <IconButton
                  tooltip={t("admin.masterData.editCategory")}
                  onClick={() => openEdit(c)}
                  className="text-primary"
                >
                  <Pencil className="size-3.5" />
                </IconButton>
              ),
            },
          ]}
        />
      )}

      <Dialog open={open} title={editing ? t("admin.masterData.editCategoryTitle") : t("admin.masterData.addCategoryTitle")} onClose={close}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.name")}<span className="text-destructive">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Yoga, Gym, Boxing" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.description")}</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <CheckboxField
            checked={active}
            onCheckedChange={setActive}
            label={t("admin.masterData.activeLabel")}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={close} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">{save.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}


/**
 * UC-078 (V49): tham số hệ thống chỉnh runtime. Khác kho key-value cũ bị gỡ ở E-8/V40
 * (write-only): mỗi key ở đây được BE đọc thật lúc chạy; API chỉ cho update, không tạo key.
 */
function SystemConfigs() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SystemConfig | null>(null);
  const [value, setValue] = useState("");

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin", "system-configs"],
    queryFn: systemConfigService.list,
  });

  const save = useMutation({
    mutationFn: () => systemConfigService.update(editing!.key!, value.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system-configs"] });
      setEditing(null);
      toast({ type: "success", title: t("admin.masterData.configSaved") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="size-4 text-primary" /> {t("admin.masterData.configsTitle")}
        </h2>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : configs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">{t("admin.masterData.configsEmpty")}</p>
      ) : (
        <DataTable
          rows={configs}
          rowKey={(c) => c.key ?? ""}
          emptyTitle={t("admin.masterData.emptyConfigs")}
          columns={[
            {
              key: "key",
              header: t("admin.masterData.colKey"),
              cellClassName: "font-mono text-xs font-semibold text-foreground",
              cell: (c) => c.key,
            },
            {
              key: "value",
              header: t("common.table.value"),
              cellClassName: "font-bold text-foreground",
              cell: (c) => c.value,
            },
            {
              key: "description",
              header: t("common.table.description"),
              hideBelow: "sm",
              cellClassName: "text-xs text-muted-foreground",
              cell: (c) => c.description || "—",
            },
            {
              key: "actions",
              header: t("common.actions.edit"),
              align: "right",
              cell: (c) => (
                <IconButton
                  tooltip={t("admin.masterData.editConfig")}
                  onClick={() => {
                    setEditing(c);
                    setValue(c.value ?? "");
                  }}
                  className="text-primary"
                >
                  <Pencil className="size-3.5" />
                </IconButton>
              ),
            },
          ]}
        />
      )}

      <Dialog open={!!editing} title={t("admin.masterData.updateConfigTitle", { key: editing?.key ?? "" })} onClose={() => setEditing(null)}>
        <div className="space-y-4">
          {editing?.description && <p className="text-xs text-muted-foreground">{editing.description}</p>}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("admin.masterData.valuePositiveInt")}</label>
            <Input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditing(null)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function AdminMasterDataPage() {
  const t = useTranslations();
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.masterData.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("admin.masterData.subtitle")}</p>
      </div>
      <ServiceCategories />
      <SystemConfigs />
    </div>
  );
}
