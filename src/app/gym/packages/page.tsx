"use client";

// Trang catalog vé của Gym (UC-020 / câu 6, 20). Thay cho cặp trang "Dịch vụ" +
// "Gói tập" của mô hình booking cũ: catalog giờ chỉ còn ticket-types, mỗi loại vé
// là DAY (1 ngày) hoặc PACKAGE (n ngày) và được bán tại một số chi nhánh.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CalendarDays, Loader2, Package, Pencil, Plus, Store } from "lucide-react";
import { useTranslations } from "next-intl";

import { ticketService } from "@/services/ticket.service";
import { gymService } from "@/services/gym.service";
import type { CatalogStatus, TicketKind, TicketType } from "@/types/Ticket";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { NumberInput } from "@/shared/components/ui/number-input";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { Dialog } from "@/shared/components/ui/dialog";
import { ListState } from "@/shared/components/common/list-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  CatalogStatusBadge,
  CatalogStatusMenu,
} from "@/modules/gym/components/catalog-controls";

const QUERY_KEY = ["gym-ticket-types"];

/** Vé ARCHIVED là trạng thái cuối: BE trả 409 cho mọi thao tác sửa/đổi trạng thái. */
const isArchived = (type: TicketType) => type.status === "ARCHIVED";

export default function GymPackagesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<TicketKind>("PACKAGE");
  const [dayCount, setDayCount] = useState<number | null>(10);
  /*
   * V93: độ dài mỗi buổi (phút). null = không ràng buộc — khách đặt được mọi ca
   * của gym, độ dài do ca quyết như trước. Có số thì lúc xếp lịch chỉ chọn được
   * ca dài đúng ngần này, nên gym phải khai ca khớp thì mới bán được.
   */
  const [minutesPerDay, setMinutesPerDay] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [ptSurcharge, setPtSurcharge] = useState<number | null>(null);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [confirmHideId, setConfirmHideId] = useState<number | null>(null);

  const typesQuery = useQuery({ queryKey: QUERY_KEY, queryFn: ticketService.listTicketTypes });
  const types = typesQuery.data ?? [];

  const { data: branches = [] } = useQuery({
    queryKey: ["gym-branches"],
    queryFn: gymService.listOwnBranches,
  });

  // BE từ chối chi nhánh đã ngừng hoạt động, nên không đưa vào danh sách chọn.
  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.active !== false && b.id != null)
        .map((b) => ({ value: String(b.id), label: b.name ?? `#${b.id}` })),
    [branches],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        kind,
        // Vé DAY luôn 1 ngày — BE tự chuẩn hoá, gửi kèm cho rõ ý định.
        dayCount: kind === "DAY" ? 1 : (dayCount ?? undefined),
        minutesPerDay: minutesPerDay ?? undefined,
        price: price ?? 0,
        ptSurchargePerDay: ptSurcharge ?? undefined,
        branchIds: branchIds.map(Number),
      };
      return editing
        ? ticketService.updateTicketType(editing.id, body)
        : ticketService.createTicketType(body);
    },
    onSuccess: () => {
      invalidate();
      closeForm();
      toast({
        type: "success",
        title: editing ? t("gym.packages.updated") : t("gym.packages.created"),
      });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CatalogStatus }) =>
      ticketService.setTicketTypeStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: t("gym.packages.statusChanged") });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const hideMut = useMutation({
    mutationFn: (id: number) => ticketService.deactivateTicketType(id),
    onSuccess: () => {
      invalidate();
      setConfirmHideId(null);
      toast({ type: "success", title: t("gym.packages.hidden") });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setKind("PACKAGE");
    setDayCount(10);
    setMinutesPerDay(null);
    setPrice(null);
    setPtSurcharge(null);
    // Mặc định bán ở mọi chi nhánh đang hoạt động: vé không gắn chi nhánh nào thì
    // không ai mua được, và đó là lỗi dễ mắc nhất khi tạo nhanh.
    setBranchIds(branchOptions.map((o) => o.value));
    setFormOpen(true);
  }

  function openEdit(type: TicketType) {
    setEditing(type);
    setName(type.name);
    setDescription(type.description ?? "");
    setKind(type.kind);
    setDayCount(type.dayCount);
    setMinutesPerDay(type.minutesPerDay ?? null);
    setPrice(type.price);
    setPtSurcharge(type.ptSurchargePerDay ?? null);
    setBranchIds(type.branches.map((b) => String(b.id)));
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  const effectiveDays = kind === "DAY" ? 1 : (dayCount ?? 0);
  const previewWithPt = (price ?? 0) + (ptSurcharge ?? 0) * effectiveDays;

  /** Kiểm tra trước khi gửi, khớp ràng buộc của TicketTypeRequest + service BE. */
  function validate(): string | null {
    if (!name.trim()) return t("gym.packages.nameRequired");
    if (name.trim().length > 150) return t("gym.packages.nameTooLong");
    if (description.trim().length > 1000) return t("gym.packages.descTooLong");
    if (price == null || price < 0) return t("gym.packages.priceRequired");
    if (ptSurcharge != null && ptSurcharge < 0) return t("gym.packages.surchargeInvalid");
    if (kind === "PACKAGE" && (dayCount == null || dayCount < 2))
      return t("gym.packages.dayCountInvalid");
    if (minutesPerDay != null && (minutesPerDay < 15 || minutesPerDay > 480))
      return t("gym.packages.minutesInvalid");
    if (branchIds.length === 0) return t("gym.packages.branchRequired");
    return null;
  }

  function save() {
    const error = validate();
    if (error) {
      toast({ type: "warning", title: error });
      return;
    }
    saveMut.mutate();
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.packages.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.packages.subtitle")}</p>
          </div>
          <Button
            onClick={openCreate}
            disabled={branchOptions.length === 0}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="size-4" /> {t("gym.packages.addNew")}
          </Button>
        </div>

        {/* Không có chi nhánh nào thì nút tạo vô nghĩa — nói thẳng lý do thay vì
            để người dùng bấm rồi nhận lỗi validate. */}
        {branchOptions.length === 0 && (
          <div className="mb-5 rounded-xl border border-warning/30 bg-warning-muted/40 px-4 py-3 text-sm text-warning">
            {t("gym.packages.noBranchWarning")}
          </div>
        )}

        <ListState
          query={typesQuery}
          isEmpty={types.length === 0}
          emptyIcon={Package}
          emptyTitle={t("gym.packages.title")}
          emptyDescription={t("gym.packages.empty")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {types.map((type) => (
              <div
                key={type.id}
                className="bg-card rounded-2xl border border-border shadow-sm flex flex-col p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                    {type.kind === "DAY" ? (
                      <>
                        <CalendarDays className="size-3" /> {t("gym.packages.kindDay")}
                      </>
                    ) : (
                      <>
                        <Package className="size-3" />{" "}
                        {t("gym.packages.kindPackage", { days: type.dayCount })}
                      </>
                    )}
                  </span>
                  <CatalogStatusBadge status={type.status} />
                </div>

                <h3 className="text-[15px] font-bold text-foreground">{type.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {type.description || t("gym.catalog.noDescription")}
                </p>

                <div className="mt-3 space-y-1">
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {formatCurrency(type.price)}
                  </p>
                  {/* priceWithPt do BE tính sẵn (price + phụ phí × số ngày) — không nhân lại ở FE. */}
                  {type.ptSurchargePerDay ? (
                    <p className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {t("gym.packages.withPtPrice", {
                        price: formatCurrency(type.priceWithPt),
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("gym.packages.noPtOption")}</p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {type.branches.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      <Store className="size-3" /> {b.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  {!isArchived(type) && (
                    <Button
                      variant="link"
                      size="inline"
                      onClick={() => openEdit(type)}
                      className="flex gap-1.5 text-primary"
                    >
                      <Pencil className="size-3.5" />
                      {t("common.actions.edit")}
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <CatalogStatusMenu
                      status={type.status}
                      pending={statusMut.isPending}
                      onChange={(status) => statusMut.mutate({ id: type.id, status })}
                    />
                    {type.active && !isArchived(type) && (
                      <button
                        onClick={() => setConfirmHideId(type.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                      >
                        <Ban className="size-3.5" /> {t("gym.packages.hide")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ListState>
      </div>

      {/* Tạo / sửa loại vé */}
      <Dialog
        open={formOpen}
        title={editing ? t("gym.packages.editTitle") : t("gym.packages.addNew")}
        onClose={closeForm}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.packages.nameLabel")} <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              placeholder={t("gym.packages.namePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.packages.descLabel")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={t("gym.packages.descPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {t("gym.packages.kindLabel")} <span className="text-destructive">*</span>
              </label>
              <Select
                value={kind}
                onValueChange={(v) => {
                  const next = v as TicketKind;
                  setKind(next);
                  // Chuyển từ vé ngày sang vé gói mà giữ dayCount = 1 thì lưu sẽ
                  // hỏng ở BE — đưa về mức hợp lệ ngay thay vì để người dùng đoán.
                  if (next === "PACKAGE" && (dayCount == null || dayCount < 2)) setDayCount(10);
                }}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY">{t("gym.packages.kindDay")}</SelectItem>
                  <SelectItem value="PACKAGE">{t("gym.packages.kindPackageLabel")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {t("gym.packages.dayCountLabel")}
              </label>
              {/* Vé DAY cố định 1 ngày nên ô này khoá lại thay vì biến mất — bố cục
                  không nhảy khi đổi qua lại giữa hai loại. */}
              <NumberInput
                value={kind === "DAY" ? 1 : dayCount}
                onValueChange={setDayCount}
                min={2}
                disabled={kind === "DAY"}
                suffix={t("gym.packages.daysSuffix")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.packages.minutesPerDayLabel")}
            </label>
            <NumberInput
              value={minutesPerDay}
              onValueChange={setMinutesPerDay}
              min={15}
              max={480}
              step={15}
              suffix={t("gym.packages.minutesSuffix")}
            />
            {/* Nói thẳng ràng buộc: bỏ trống thì bán được với mọi ca, điền số thì
                khách chỉ đặt được ca dài đúng ngần đó — gym khai ca 60 phút mà bán
                gói 90 phút thì không ai đặt được buổi nào. */}
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {t("gym.packages.minutesPerDayHint")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {t("gym.packages.priceLabel")} <span className="text-destructive">*</span>
              </label>
              <NumberInput
                value={price}
                onValueChange={setPrice}
                min={0}
                step={50000}
                hideStepper
                suffix="đ"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {t("gym.packages.surchargeLabel")}
              </label>
              <NumberInput
                value={ptSurcharge}
                onValueChange={setPtSurcharge}
                min={0}
                step={50000}
                hideStepper
                suffix="đ"
              />
            </div>
          </div>

          {/* Phụ phí PT tính theo NGÀY, nên tổng tiền vé kèm PT không hiển nhiên —
              cho xem trước đúng công thức BE dùng để chốt giá. */}
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("gym.packages.previewPlain")}</span>
              <span className="font-bold tabular-nums">{formatCurrency(price ?? 0)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("gym.packages.previewWithPt", { days: effectiveDays })}
              </span>
              <span className="font-bold tabular-nums">{formatCurrency(previewWithPt)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("gym.packages.branchesLabel")} <span className="text-destructive">*</span>
            </label>
            <MultiSelect
              options={branchOptions}
              value={branchIds}
              onValueChange={setBranchIds}
              placeholder={t("gym.packages.branchesPlaceholder")}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("gym.packages.branchesHint")}
            </p>
          </div>

          {editing && (
            <p className="text-[11px] text-muted-foreground">{t("gym.packages.editNotice")}</p>
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

      {/* Xác nhận ẩn khỏi catalog */}
      <Dialog
        open={confirmHideId !== null}
        title={t("gym.packages.hideConfirmTitle")}
        onClose={() => setConfirmHideId(null)}
      >
        <p className="text-sm text-muted-foreground">{t("gym.packages.hideConfirmBody")}</p>
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
