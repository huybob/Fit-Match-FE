"use client";

// Dịch vụ kèm vé (V82). Khác trang "Gói tập": ở đây không có số ngày và không
// có chi nhánh — dịch vụ khai ở cấp gym, cộng tiền MỘT LẦN vào vé lúc khách mua.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { ticketService } from "@/services/ticket.service";
import type { CatalogStatus, GymServiceItem } from "@/types/Ticket";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { NumberInput } from "@/shared/components/ui/number-input";
import { Dialog } from "@/shared/components/ui/dialog";
import { ListState } from "@/shared/components/common/list-state";
import {
  CatalogStatusBadge,
  CatalogStatusMenu,
} from "@/modules/gym/components/catalog-controls";

const QUERY_KEY = ["gym-services-catalog"];

export default function GymServicesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymServiceItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [confirmHideId, setConfirmHideId] = useState<number | null>(null);

  const servicesQuery = useQuery({ queryKey: QUERY_KEY, queryFn: ticketService.listServices });
  const services = servicesQuery.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: price ?? 0,
      };
      return editing
        ? ticketService.updateService(editing.id, body)
        : ticketService.createService(body);
    },
    onSuccess: () => {
      invalidate();
      closeForm();
      toast({
        type: "success",
        title: editing ? t("gym.services.updated") : t("gym.services.created"),
      });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CatalogStatus }) =>
      ticketService.setServiceStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: t("gym.services.statusChanged") });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const hideMut = useMutation({
    mutationFn: (id: number) => ticketService.deactivateService(id),
    onSuccess: () => {
      invalidate();
      setConfirmHideId(null);
      toast({ type: "success", title: t("gym.services.hidden") });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice(null);
    setFormOpen(true);
  }

  function openEdit(service: GymServiceItem) {
    setEditing(service);
    setName(service.name);
    setDescription(service.description ?? "");
    setPrice(service.price);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function save() {
    if (!name.trim()) {
      toast({ type: "warning", title: t("gym.services.nameRequired") });
      return;
    }
    if (name.trim().length > 150) {
      toast({ type: "warning", title: t("gym.services.nameTooLong") });
      return;
    }
    if (description.trim().length > 1000) {
      toast({ type: "warning", title: t("gym.services.descTooLong") });
      return;
    }
    if (price == null || price < 0) {
      toast({ type: "warning", title: t("gym.services.priceRequired") });
      return;
    }
    saveMut.mutate();
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.services.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.services.subtitle")}</p>
          </div>
          <Button
            onClick={openCreate}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="size-4" /> {t("gym.services.addNew")}
          </Button>
        </div>

        <ListState
          query={servicesQuery}
          isEmpty={services.length === 0}
          emptyIcon={Sparkles}
          emptyTitle={t("gym.services.title")}
          emptyDescription={t("gym.services.empty")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-card rounded-2xl border border-border shadow-sm flex flex-col p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-5 text-primary" />
                  </div>
                  <CatalogStatusBadge status={service.status} />
                </div>

                <h3 className="text-[15px] font-bold text-foreground">{service.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-3">
                  {service.description || t("gym.catalog.noDescription")}
                </p>

                <p className="mt-3 text-lg font-bold text-foreground tabular-nums">
                  {formatCurrency(service.price)}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("gym.services.oncePerTicket")}</p>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  {service.status !== "ARCHIVED" && (
                    <Button
                      variant="link"
                      size="inline"
                      onClick={() => openEdit(service)}
                      className="flex gap-1.5 text-primary"
                    >
                      <Pencil className="size-3.5" />
                      {t("common.actions.edit")}
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <CatalogStatusMenu
                      status={service.status}
                      pending={statusMut.isPending}
                      onChange={(status) => statusMut.mutate({ id: service.id, status })}
                    />
                    {service.active && service.status !== "ARCHIVED" && (
                      <button
                        onClick={() => setConfirmHideId(service.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                      >
                        <Ban className="size-3.5" /> {t("gym.services.hide")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ListState>
      </div>

      <Dialog
        open={formOpen}
        title={editing ? t("gym.services.editTitle") : t("gym.services.addNew")}
        onClose={closeForm}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.services.nameLabel")} <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              placeholder={t("gym.services.namePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.services.descLabel")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={t("gym.services.descPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.services.priceLabel")} <span className="text-destructive">*</span>
            </label>
            <NumberInput
              value={price}
              onValueChange={setPrice}
              min={0}
              step={10000}
              hideStepper
              suffix="đ"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("gym.services.priceHint")}
            </p>
          </div>

          {editing && (
            <p className="text-[11px] text-muted-foreground">{t("gym.services.editNotice")}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={closeForm}
              className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none"
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={save}
              disabled={saveMut.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
              {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmHideId !== null}
        title={t("gym.services.hideConfirmTitle")}
        onClose={() => setConfirmHideId(null)}
      >
        <p className="text-sm text-muted-foreground">{t("gym.services.hideConfirmBody")}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={() => setConfirmHideId(null)}
            className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none"
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            onClick={() => confirmHideId != null && hideMut.mutate(confirmHideId)}
            disabled={hideMut.isPending}
            className="gap-2 bg-destructive hover:bg-destructive text-destructive-foreground"
          >
            {hideMut.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("common.actions.confirm")}
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
