"use client";

// Gói 2.C (audit 2026-07-17):
// - B-13/B-14 (DATA LOSS): form thêm amenities + capacity — BE update set vô điều kiện
//   2 field này, payload thiếu chúng là xóa trắng dữ liệu đã có mỗi lần bấm Sửa.
// - B-11 (UC-017): dialog Giờ mở cửa per-branch (BE có sẵn, trước đây không UI nào gọi).

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Ban, MapPin, MapPinOff, Phone, Loader2, Clock, CopyPlus } from "lucide-react";
import { gymService } from "@/services/gym.service";
import { marketplaceService } from "@/services/marketplace.service";
import type { BranchInput, BranchResponse, OperatingHour } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { isVietnamPhone } from "@/shared/utils/phone.util";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { TimePicker } from "@/shared/components/ui/time-picker";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";
import { weekdayKey } from "@/shared/utils/enum-label.util";
import { DataTable } from "@/shared/components/common/data-table";
import {
  PlaceAutocompleteInput,
  type PinnedPlace,
} from "@/shared/components/map/place-autocomplete-input";
import { AddressPinMap } from "@/shared/components/map/address-pin-map";
import { usePinAddress } from "@/shared/components/map/use-pin-address";


/**
 * Chuỗi gửi đi geocode. Ghép ĐÚNG thứ tự BE dùng (`AddressGeocoder`:
 * "địa chỉ, phường, tỉnh/thành, Việt Nam") để hai bên ra cùng một toạ độ; thiếu
 * cấp hành chính thì dễ khớp nhầm đường trùng tên ở tỉnh khác.
 */
function geocodeQueryOf(address: string, ward: string, city: string) {
  return [address.trim(), ward.trim(), city.trim(), "Việt Nam"].filter(Boolean).join(", ");
}

/** UC-017: editor giờ mở cửa 7 ngày (dayOfWeek 1-7 khớp BE). */
function OperatingHoursDialog({ branch, onClose }: { branch: BranchResponse; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const [rows, setRows] = useState<OperatingHour[]>(
    Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, closed: true })),
  );

  const query = useQuery({
    queryKey: ["gym-branches", branch.id, "hours"],
    queryFn: () => gymService.getOperatingHours(branch.id!),
    enabled: branch.id != null,
  });

  useEffect(() => {
    if (!query.data) return;
    setRows(
      Array.from({ length: 7 }, (_, i) => {
        const day = i + 1;
        const existing = query.data.find((h) => h.dayOfWeek === day);
        return existing
          ? { dayOfWeek: day, openTime: existing.openTime?.slice(0, 5), closeTime: existing.closeTime?.slice(0, 5), closed: existing.closed ?? false }
          : { dayOfWeek: day, closed: true };
      }),
    );
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      gymService.updateOperatingHours(
        branch.id!,
        rows.map((r) =>
          r.closed
            ? { dayOfWeek: r.dayOfWeek, closed: true }
            : { dayOfWeek: r.dayOfWeek, openTime: r.openTime, closeTime: r.closeTime, closed: false },
        ),
      ),
    onSuccess: () => {
      toast({ type: "success", title: t("gym.branches.hoursSaved") });
      onClose();
    },
    // BE chặn thu hẹp lịch đè booking tương lai (409) — hiện nguyên văn lý do.
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const invalid = rows.some((r) => !r.closed && (!r.openTime || !r.closeTime || r.openTime >= r.closeTime));

  function patchRow(day: number, patch: Partial<OperatingHour>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  }

  /**
   * Bug S2-15: set từng giờ cho từng ngày quá bất tiện — hầu hết phòng gym mở cùng
   * khung giờ cả tuần. Copy khung giờ của một ngày sang 6 ngày còn lại (và mở cửa
   * luôn các ngày đó); ngày nào khác biệt thì sửa lại sau.
   */
  function copyToOtherDays(day: number) {
    const source = rows.find((r) => r.dayOfWeek === day);
    if (!source || source.closed) return;
    setRows((prev) =>
      prev.map((r) =>
        r.dayOfWeek === day
          ? r
          : { ...r, closed: false, openTime: source.openTime, closeTime: source.closeTime },
      ),
    );
    toast({ type: "success", title: t("common.datetime.copiedToOtherDays") });
  }

  return (
    <Dialog open title={t("gym.branches.hoursDialogTitle", { name: branch.name ?? "" })} onClose={onClose}>
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.dayOfWeek} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-semibold text-foreground">{t(weekdayKey(r.dayOfWeek))}</span>
              <CheckboxField
                checked={!r.closed}
                onCheckedChange={(open) => patchRow(r.dayOfWeek, { closed: !open })}
                label={t("gym.branches.open")}
                labelClassName="text-xs font-medium text-muted-foreground"
              />
              {!r.closed && (
                <>
                  <TimePicker value={r.openTime ?? ""} className="h-8 w-28 text-xs"
                    onChange={(v) => patchRow(r.dayOfWeek, { openTime: v ?? "" })} />
                  <span className="text-xs text-muted-foreground">→</span>
                  <TimePicker value={r.closeTime ?? ""} className="h-8 w-28 text-xs"
                    onChange={(v) => patchRow(r.dayOfWeek, { closeTime: v ?? "" })} />
                  {/* Bug S2-15: đặt 1 ngày rồi nhân ra cả tuần. */}
                  <IconButton
                    tooltip={t("common.datetime.copyToOtherDays")}
                    disabled={!r.openTime || !r.closeTime}
                    onClick={() => copyToOtherDays(r.dayOfWeek)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <CopyPlus className="size-4" />
                  </IconButton>
                </>
              )}
            </div>
          ))}
          {invalid && <p className="text-xs text-destructive">{t("gym.branches.hoursInvalid")}</p>}
          <div className="flex justify-end gap-2 pt-3">
            <Button onClick={onClose} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={() => save.mutate()} disabled={invalid || save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.branches.saveHours")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default function GymBranchesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchResponse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  /**
   * V66: PHƯỜNG/XÃ. Việt Nam bỏ cấp huyện từ đợt sắp xếp đơn vị hành chính 2025 —
   * dưới tỉnh/thành là thẳng phường/xã.
   *
   * Đi lên server ở field `district` của payload: cột DB vẫn tên cũ để không phải
   * đổi cùng lúc cả bộ lọc marketplace, tìm kiếm vé và màn so sánh gym.
   */
  const [ward, setWard] = useState("");
  const [phone, setPhone] = useState("");
  const [amenities, setAmenities] = useState("");
  const [capacity, setCapacity] = useState("");
  // UC-18 (V55): địa điểm chọn từ gợi ý địa chỉ / ghim tay. Không được để null khi
  // lưu — xem `save()`.
  const [coords, setCoords] = useState<PinnedPlace | null>(null);
  /** Đang tự tra toạ độ cho địa chỉ gõ tay ngay trước khi lưu. */
  const [resolving, setResolving] = useState(false);
  // Tra ngược địa chỉ tại chỗ vừa thả ghim.
  const { resolving: pinResolving, resolve: resolvePinAddress } = usePinAddress();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [hoursBranch, setHoursBranch] = useState<BranchResponse | null>(null);

  const branchesQuery = useQuery({
    queryKey: ["gym-branches"],
    queryFn: gymService.listOwnBranches
  });
  const branches = branchesQuery.data ?? [];

  const saveMut = useMutation({
    mutationFn: (payload: BranchInput) =>
      editing?.id != null
        ? gymService.editBranch(editing.id, payload)
        : gymService.addBranch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-branches"] });
      closeForm();
      toast({ type: "success", title: editing ? t("gym.branches.updated") : t("gym.branches.added") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => gymService.deactivateBranch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-branches"] });
      setConfirmId(null);
      toast({ type: "success", title: t("gym.branches.disabled") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null); setName(""); setAddress(""); setCity(""); setWard(""); setPhone("");
    setAmenities(""); setCapacity(""); setCoords(null); setFormOpen(true);
  }
  function openEdit(b: BranchResponse) {
    setEditing(b); setName(b.name ?? ""); setAddress(b.address ?? ""); setCity(b.city ?? "");
    setWard(b.district ?? ""); setPhone(b.phone ?? "");
    // B-13: pre-fill amenities/capacity — thiếu chúng trong payload update là mất dữ liệu.
    setAmenities(b.amenities ?? ""); setCapacity(b.capacity != null ? String(b.capacity) : "");
    // Giữ lại toạ độ đã có: gửi lên nguyên vẹn thì BE không geocode lại một địa
    // chỉ không đổi (đỡ tốn quota) và không đánh mất vị trí đã chỉnh thủ công.
    // Giữ cả cờ ghim tay: thiếu nó thì mỗi lần sửa số điện thoại là toạ độ chủ gym
    // đã kéo bị hạ cấp về "máy đoán" và job làm mới sẽ kéo đi chỗ khác.
    setCoords(b.latitude != null && b.longitude != null
      ? { lat: b.latitude, lng: b.longitude, pinnedByUser: b.coordinatesPinned }
      : null);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }
  /**
   * Operator bấm/kéo ghim trên bản đồ (UC-18, V66).
   *
   * Ghim tay thắng mọi nguồn khác — kể cả khi ô địa chỉ đang trống: đây là đường
   * lưu duy nhất cho những địa chỉ không dịch vụ nào tra ra (hẻm nhỏ, khu mới
   * chưa lên bản đồ). Toạ độ vào state NGAY, không chờ mạng: ghim phải nhảy theo
   * con trỏ tức thì, còn chữ thì điền sau cũng được.
   */
  async function pinAt(position: { lat: number; lng: number }) {
    setCoords({
      lat: position.lat,
      lng: position.lng,
      // Kéo tay = toạ độ của con người, chính xác hơn máy đoán. Cờ này giữ job làm
      // mới định kỳ không kéo ghim về lại chỗ dịch vụ geocoding nói.
      pinnedByUser: true,
      // KHÔNG mang theo place_id của gợi ý cũ: ghim đã dời sang điểm khác nên id đó
      // tả nhầm chỗ. Bỏ trống thì BE hiểu là "không có thông tin mới" và giữ nguyên
      // giá trị đang lưu.
    });

    const found = await resolvePinAddress(position.lat, position.lng);
    if (!found) return;
    if (found.formattedAddress) {
      setAddress(found.formattedAddress);
      // Ghi lại luôn vào coords: cột formatted_address phải mô tả chính chỗ ghim,
      // nếu không nó còn giữ mô tả của địa điểm trước khi ghim bị kéo đi.
      setCoords((prev) => (prev ? { ...prev, formattedAddress: found.formattedAddress } : prev));
    }
    if (found.city) setCity(found.city);
    if (found.ward) setWard(found.ward);
  }

  /**
   * Tra toạ độ cho địa chỉ gõ tay. Người dùng chọn gợi ý hoặc kéo ghim thì đã có
   * sẵn toạ độ, không gọi lại làm gì.
   */
  async function resolveCoords(): Promise<PinnedPlace | null> {
    if (coords) return coords;
    setResolving(true);
    try {
      const result = await marketplaceService.geocodeAddress(geocodeQueryOf(address, ward, city));
      if (result.latitude == null || result.longitude == null) return null;
      const resolved: PinnedPlace = {
        lat: result.latitude,
        lng: result.longitude,
        placeId: result.placeId,
        placeProvider: result.placeProvider,
        formattedAddress: result.formattedAddress,
      };
      // Ghi vào state để ghim hiện lên bản đồ — người dùng thấy máy đặt ở đâu
      // trước khi bấm Lưu lần nữa, thay vì tin vào một toạ độ vô hình.
      setCoords(resolved);
      return resolved;
    } catch {
      return null;
    } finally {
      setResolving(false);
    }
  }

  async function save() {
    if (!name.trim()) { toast({ type: "warning", title: t("gym.branches.nameRequired") }); return; }
    // UC-18: chi nhánh không có địa chỉ thì không thể geocode, và không geocode
    // được thì nó vô hình với "tìm gym quanh đây" — chặn ngay từ form.
    if (!address.trim()) { toast({ type: "warning", title: t("gym.branches.addressRequired") }); return; }
    // UC-016: chi nhánh là nơi khách tới tập, và là nơi phát sinh mọi việc cần gọi
    // trực tiếp. Không có số thì CSKH phải lần ngược lên số tổng của gym.
    if (!phone.trim()) { toast({ type: "warning", title: t("gym.branches.phoneRequired") }); return; }
    if (!isVietnamPhone(phone)) { toast({ type: "warning", title: t("gym.branches.phoneInvalid") }); return; }
    if (capacity && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) {
      toast({ type: "warning", title: t("gym.branches.capacityInvalid") }); return;
    }

    /**
     * Toạ độ là điều kiện BẮT BUỘC để lưu. Trước đây thiếu toạ độ vẫn lưu được và
     * BE geocode "best effort": dịch vụ lỗi/hết quota thì chi nhánh nằm im trong DB
     * với lat/lng NULL, không bao giờ hiện ra ở tìm theo bán kính mà chẳng ai được
     * báo. Nay tra ngay tại đây, hỏng thì nói thẳng và giữ người dùng lại ở form.
     */
    const pinned = await resolveCoords();
    if (!pinned) {
      toast({
        type: "error",
        title: t("gym.branches.geoRequired"),
        description: t("gym.branches.geoRequiredHint"),
      });
      return;
    }

    saveMut.mutate({
      name: name.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      // Cột `district` nay mang phường/xã — xem chú thích ở state `ward`.
      district: ward.trim() || undefined,
      phone: phone.trim(),
      amenities: amenities.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      latitude: pinned.lat,
      longitude: pinned.lng,
      placeId: pinned.placeId,
      // V65: nhan nguon cua placeId — thieu no thi BE coi la "khong ro nguon"
      // va job lam moi toa do se bo qua ban ghi.
      placeProvider: pinned.placeProvider,
      formattedAddress: pinned.formattedAddress,
      coordinatesPinned: pinned.pinnedByUser,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.branches.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.branches.subtitle")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" /> {t("gym.branches.add")}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">{t("gym.branches.listTitle")}</h2>
          {/* DataTable đã tự lo loading / lỗi / rỗng. Bọc thêm hai nhánh viết tay
              như trước sẽ nuốt mất nhánh LỖI: API hỏng cũng ra "chưa có chi nhánh". */}
            <DataTable
              minWidth="35rem"
              rows={branches}
              rowKey={(b) => String(b.id)}
              loading={branchesQuery.isLoading}
              error={branchesQuery.isError}
              errorDescription={branchesQuery.error ? toErrorMessage(branchesQuery.error) : undefined}
              onRetry={() => branchesQuery.refetch()}
              emptyTitle={t("gym.branches.empty")}
              columns={[
                {
                  key: "name",
                  header: t("gym.branches.nameCol"),
                  cell: (b) => (
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="size-4 text-primary" />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground">{b.name}</span>
                    </div>
                  ),
                },
                {
                  key: "address",
                  header: t("common.table.address"),
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (b) => (
                    <>
                      <p>{[b.address, b.city].filter(Boolean).join(", ") || "—"}</p>
                      {/* Bản ghi cũ lưu trước khi form bắt buộc toạ độ: nói rõ hậu quả
                          (không hiện ở "tìm quanh đây") thay vì để nó im lặng biến mất. */}
                      {(b.latitude == null || b.longitude == null) && (
                        <Badge variant="warning" className="mt-1 normal-case" title={t("gym.branches.noCoordsHint")}>
                          <MapPinOff className="size-3" /> {t("gym.branches.noCoords")}
                        </Badge>
                      )}
                      {b.amenities && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {t("gym.branches.amenitiesLabel")} {b.amenities}
                        </p>
                      )}
                      {b.capacity != null && (
                        <p className="text-[11px] text-muted-foreground/80">
                          {t("gym.branches.capacityLabel")} {b.capacity} {t("gym.branches.capacityUnit")}
                        </p>
                      )}
                    </>
                  ),
                },
                {
                  key: "contact",
                  header: t("gym.branches.contact"),
                  hideBelow: "sm",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (b) =>
                    b.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground" /> {b.phone}
                      </span>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "status",
                  header: t("common.table.status"),
                  cell: (b) => (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        b.active === false
                          ? "bg-muted text-muted-foreground"
                          : "bg-success-muted text-success"
                      }`}
                    >
                      {b.active === false ? t("common.states.stopped") : t("common.states.active")}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: t("common.table.actions"),
                  align: "right",
                  cell: (b) => (
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="link" size="inline"
 onClick={() => setHoursBranch(b)}
 className="flex gap-1 text-primary"
>
                        <Clock className="size-3.5" /> {t("gym.branches.hoursTitle")}
                      </Button>
                      <Button variant="link" size="inline"
 onClick={() => openEdit(b)}
 className="flex gap-1 text-primary"
>
                        <Pencil className="size-3.5" />
                        {t("common.actions.edit")}
                      </Button>
                      {b.active !== false && (
                        <button
                          onClick={() => b.id != null && setConfirmId(b.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
                        >
                          <Ban className="size-3.5" /> {t("common.states.stopped")}
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
        </div>
      </div>

      <Dialog open={formOpen} title={editing ? t("gym.branches.editTitle") : t("gym.branches.add")} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.branches.nameCol")} <span className="text-destructive">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("gym.branches.namePlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("common.table.address")} <span className="text-destructive">*</span>
            </label>
            {/* UC-18 (V55): ba đường đều hợp lệ — chọn gợi ý, gõ tay rồi để form tự
                tra khi bấm Lưu, hoặc tự bấm/kéo ghim trên bản đồ. Chỉ có một luật:
                lưu xong phải có toạ độ, nếu không chi nhánh vô hình với "tìm quanh đây". */}
            <PlaceAutocompleteInput
              value={address}
              onValueChange={(value) => {
                setAddress(value);
                setCoords((prev) => {
                  // Ghim do CHÍNH NGƯỜI DÙNG đặt thì giữ lại: họ đã chỉ đúng cửa ra
                  // vào rồi mới sửa lại chữ cho gọn — xoá đi là bắt làm lại từ đầu.
                  // Nhưng bỏ metadata của gợi ý cũ: place_id đó tả một địa điểm khác
                  // với chuỗi địa chỉ vừa gõ.
                  if (!prev?.pinnedByUser) return null;
                  return { lat: prev.lat, lng: prev.lng, pinnedByUser: true };
                });
              }}
              onPlacePicked={(place) => {
                // Lưu địa chỉ ĐẦY ĐỦ chứ không phải tên địa điểm: chọn gợi ý
                // "California Fitness" trước đây ghi đúng chữ đó vào cột address.
                setAddress(place.formattedAddress);
                setCoords({
                  lat: place.lat,
                  lng: place.lng,
                  placeId: place.placeId,
                  placeProvider: place.placeProvider,
                  formattedAddress: place.formattedAddress,
                });
                if (place.ward) setWard(place.ward);
                if (place.city) setCity(place.city);
              }}
              onError={(message) => toast({ type: "warning", title: message })}
              placeholder={t("gym.branches.addressPlaceholder")}
            />
            {/* UC-18 (V60): thấy ghim rơi ở đâu thì mới biết dịch vụ geocoding đặt sai —
                trước đây chủ gym lưu xong mới phát hiện khách bị dẫn nhầm chỗ. */}
            <AddressPinMap
              className="mt-2"
              value={coords ? { lat: coords.lat, lng: coords.lng } : null}
              onChange={(position) => void pinAt(position)}
            />
            {/* Trạng thái toạ độ là điều kiện lưu, không phải ghi chú phụ — thiếu
                thì tô cảnh báo để người dùng biết trước khi bấm Lưu. */}
            <p className={`mt-1.5 flex items-center gap-1 text-[11px] ${coords ? "text-muted-foreground" : "font-semibold text-warning"}`}>
              {pinResolving ? (
                <>
                  <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  {t("gym.branches.pinAddressResolving")}
                </>
              ) : coords ? (
                t(coords.pinnedByUser ? "gym.branches.coordsAdjusted" : "gym.branches.coordsPinned",
                  { lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5) })
              ) : (
                <>
                  <MapPinOff className="size-3.5 shrink-0" />
                  {t("gym.branches.coordsAuto")}
                </>
              )}
            </p>
          </div>
          {/* UC-18 (V66): CHỈ ĐỌC. Hai ô này là nhãn hành chính của đúng cái ghim
              trên bản đồ, nên chúng phải do vị trí quyết định — gõ tay được là mở
              đường cho chi nhánh ghim ở phường này nhưng gắn nhãn phường khác, và
              nó sẽ không bao giờ ra đúng bộ lọc nào. Muốn sửa thì sửa ghim. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.city")}</label>
              <Input value={city} readOnly disabled placeholder={t("gym.branches.cityPlaceholder")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.ward")}</label>
              <Input value={ward} readOnly disabled placeholder={t("gym.branches.wardPlaceholder")} />
            </div>
            <p className="col-span-2 -mt-2 text-[11px] text-muted-foreground">
              {t("gym.branches.locationAutoFilled")}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {t("common.table.phone")} <span className="text-destructive">*</span>
            </label>
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901 234 567"
            />
            {/* Báo sai ngay tại ô, không đợi bấm Lưu — nhưng chỉ khi đã gõ được một
                đoạn, nếu không ô vừa chạm vào đã đỏ. */}
            {phone.trim() && !isVietnamPhone(phone) && (
              <p className="mt-1.5 text-[11px] font-semibold text-destructive">
                {t("gym.branches.phoneInvalid")}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.branches.amenitiesInput")}</label>
            <Input value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="Vd: Parking,Sauna,Pool" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.branches.capacityInput")}</label>
            <Input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} placeholder={t("gym.branches.capacityPlaceholder")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            {/* pinResolving cũng chặn Lưu: bấm Lưu giữa lúc đang tra ngược sẽ gửi đi
                địa chỉ CŨ, rồi kết quả về sau ghi vào một form đã đóng. */}
            <Button onClick={() => void save()} disabled={saveMut.isPending || resolving || pinResolving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {(saveMut.isPending || resolving) && <Loader2 className="size-4 animate-spin" />}
              {resolving ? t("gym.branches.geoResolving") : t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>

      {hoursBranch && <OperatingHoursDialog branch={hoursBranch} onClose={() => setHoursBranch(null)} />}

      <Dialog open={confirmId !== null} title={t("gym.branches.disableConfirmTitle")} onClose={() => setConfirmId(null)}>
        <p className="text-sm text-muted-foreground">{t("gym.branches.disableConfirmBody")}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setConfirmId(null)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
          <Button onClick={() => confirmId != null && deactivateMut.mutate(confirmId)} disabled={deactivateMut.isPending} className="gap-2 bg-destructive hover:bg-destructive text-destructive-foreground">
            {deactivateMut.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.confirm")}
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
