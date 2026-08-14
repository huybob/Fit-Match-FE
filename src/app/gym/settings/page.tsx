"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2, Building2, Eye, ScrollText } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { GymPolicy, UpdateGymProfileInput } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { isVietnamPhone } from "@/shared/utils/phone.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { EmptyState } from "@/shared/components/common/empty-state";
import { FieldShell } from "@/modules/forms/form-controls";
import {
  PlaceAutocompleteInput,
  type PinnedPlace,
} from "@/shared/components/map/place-autocomplete-input";
import { AddressPinMap } from "@/shared/components/map/address-pin-map";
import { usePinAddress } from "@/shared/components/map/use-pin-address";
import { useTranslations } from "next-intl";

/** UC-017 (B-11): chính sách đặt lịch/hủy/no-show/nội quy — BE có sẵn, trước đây FE = 0. */
function PoliciesSection() {
  const t = useTranslations();
  const { toast } = useToast();
  const [policy, setPolicy] = useState<GymPolicy>({});

  const query = useQuery({ queryKey: ["gym-policies"], queryFn: gymService.getPolicies });

  useEffect(() => {
    if (query.data) setPolicy(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      gymService.updatePolicies({
        bookingPolicy: policy.bookingPolicy?.trim() || undefined,
        cancellationPolicy: policy.cancellationPolicy?.trim() || undefined,
        noShowPolicy: policy.noShowPolicy?.trim() || undefined,
        houseRules: policy.houseRules?.trim() || undefined,
      }),
    onSuccess: () => toast({ type: "success", title: t("gym.settings.policySaved") }),
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  const fields: Array<{ key: keyof GymPolicy; label: string; placeholder: string }> = [
    { key: "bookingPolicy", label: t("gym.settings.bookingPolicy"), placeholder: t("gym.settings.bookingPolicyHint") },
    { key: "cancellationPolicy", label: t("gym.settings.cancelPolicy"), placeholder: t("gym.settings.cancelPolicyHint") },
    { key: "noShowPolicy", label: t("gym.settings.noShowPolicy"), placeholder: t("gym.settings.noShowPolicyHint") },
    { key: "houseRules", label: t("gym.settings.houseRules"), placeholder: t("gym.settings.houseRulesHint") },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
        <ScrollText className="size-4 text-primary" /> {t("gym.settings.policiesTitle")}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        {t("gym.settings.policiesHint")}
      </p>
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          {fields.map(({ key, label, placeholder }) => (
            <FieldShell key={key} label={label}>
              <Textarea
                value={(policy[key] as string) ?? ""}
                onChange={(e) => setPolicy((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={2}
                maxLength={2000}
                placeholder={placeholder}
              />
            </FieldShell>
          ))}
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.settings.savePolicies")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymSettingsPage() {
  const t = useTranslations();
  const { toast } = useToast();

  const [gymName, setGymName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [ward, setWard] = useState("");
  const [phone, setPhone] = useState("");
  const [visible, setVisible] = useState(true);
  // UC-18 (V55): toạ độ trụ sở. Trước đây trang này gọi PlaceAutocompleteInput
  // nhưng vứt bỏ lat/lng của gợi ý, nên trụ sở luôn phải nhờ BE đoán lại từ chuỗi
  // chữ — ghim từ gợi ý địa chỉ chính xác hơn hẳn.
  const [coords, setCoords] = useState<PinnedPlace | null>(null);
  const { resolving: pinResolving, resolve: resolvePinAddress } = usePinAddress();

  const statusQuery = useQuery({
    queryKey: ["gym-verification-status"],
    queryFn: gymService.getVerificationStatus
  });
  const status = statusQuery.data;
  const isLoading = statusQuery.isLoading;

  useEffect(() => {
    if (!status) return;
    setGymName(status.gymName ?? "");
    setDescription(status.description ?? "");
    setAddress(status.address ?? "");
    setCity(status.city ?? "");
    setWard(status.district ?? "");
    setPhone(status.phone ?? "");
    // Nạp lại toạ độ đang lưu và gửi nguyên vẹn khi lưu: BE hiểu đó là "operator
    // đã ghim" nên không geocode lại địa chỉ không đổi (đỡ một lượt gọi dịch vụ geocoding)
    // và không đánh mất vị trí đã chỉnh tay.
    setCoords(
      status.latitude != null && status.longitude != null
        ? { lat: status.latitude, lng: status.longitude, pinnedByUser: status.coordinatesPinned }
        : null,
    );
    // B-9/A-12: init toggle từ trạng thái thật trên server — trước đây hardcode true
    // khiến operator bật/tắt "mù" (tưởng đang public khi đang ẩn).
    setVisible(status.active ?? false);
  }, [status]);

  /**
   * Operator bấm/kéo ghim trên bản đồ (UC-18, V66). Toạ độ vào state NGAY rồi mới
   * tra ngược ra chữ: ghim phải nhảy theo con trỏ tức thì, chữ điền sau cũng được.
   */
  async function pinAt(position: { lat: number; lng: number }) {
    // KHÔNG spread `prev`: place_id của gợi ý cũ tả một địa điểm khác với chỗ ghim
    // vừa dời tới. Bỏ trống thì BE hiểu là "không có thông tin mới".
    setCoords({ lat: position.lat, lng: position.lng, pinnedByUser: true });
    const found = await resolvePinAddress(position.lat, position.lng);
    if (!found) return;
    if (found.formattedAddress) {
      setAddress(found.formattedAddress);
      // Cột formatted_address phải mô tả CHÍNH chỗ ghim, nếu không nó còn giữ mô
      // tả của địa điểm trước khi ghim bị kéo đi.
      setCoords((prev) => (prev ? { ...prev, formattedAddress: found.formattedAddress } : prev));
    }
    if (found.city) setCity(found.city);
    if (found.ward) setWard(found.ward);
  }

  const saveProfile = useMutation({
    mutationFn: (payload: UpdateGymProfileInput) => gymService.updateProfile(payload),
    onSuccess: () => toast({ type: "success", title: t("gym.settings.profileUpdated") }),
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });

  const saveVisibility = useMutation({
    mutationFn: (v: boolean) => gymService.setVisibility(v),
    onSuccess: (_d, v) => toast({ type: "success", title: v ? t("gym.settings.shownOnMarketplace") : t("gym.settings.hiddenFromMarketplace") }),
    onError: (e, v) => {
      // Đảo lại toggle khi BE từ chối (vd chưa APPROVED, chưa có branch active).
      setVisible(!v);
      toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) });
    },
  });

  const notApproved = !!status && status.verificationStatus !== "APPROVED";

  function submit() {
    if (!gymName.trim()) { toast({ type: "warning", title: t("gym.settings.nameRequired") }); return; }
    // Không bắt buộc, nhưng đã điền thì phải gọi được — chặn tại chỗ thay vì
    // để BE trả 400 sau một vòng gọi mạng.
    if (phone.trim() && !isVietnamPhone(phone)) {
      toast({ type: "warning", title: t("common.validation.phone") }); return;
    }
    saveProfile.mutate({
      gymName: gymName.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      // V66: cột `district` nay mang phường/xã — VN bỏ cấp huyện từ đợt sắp xếp
      // đơn vị hành chính 2025. Giữ tên field để không phải đổi cùng lúc cả bộ
      // lọc marketplace, tìm kiếm vé và màn so sánh gym.
      district: ward.trim() || undefined,
      phone: phone.trim() || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
      placeId: coords?.placeId,
      // V65: nhan nguon cua placeId — thieu no thi BE coi la "khong ro nguon"
      // va job lam moi toa do se bo qua ban ghi.
      placeProvider: coords?.placeProvider,
      formattedAddress: coords?.formattedAddress,
      coordinatesPinned: coords?.pinnedByUser
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t("gym.settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("gym.settings.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : statusQuery.isError ? (
          /* Không có nhánh này thì hồ sơ tải lỗi vẫn render ra form TRỐNG với nút
             "Lưu hồ sơ" bật sẵn — operator gõ lại một phần rồi lưu là ghi đè
             description/address/phone thật trên server bằng chuỗi rỗng. */
          <EmptyState
            icon={AlertCircle}
            title={t("common.states.errorTitle")}
            description={toErrorMessage(statusQuery.error)}
            action={
              <Button type="button" variant="outline" onClick={() => statusQuery.refetch()}>
                {t("common.actions.retry")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4"><Building2 className="size-4 text-primary" /> {t("gym.settings.profileTitle")}</h2>
              {/* FieldShell thay cho <label> rời: nhãn được nối thật với ô nhập
                  (htmlFor/id), nếu không trình đọc màn hình đọc các ô này là
                  "edit text" không tên và bấm vào nhãn không focus vào ô. */}
              <div className="space-y-4">
                <FieldShell label={`${t("gym.settings.nameLabel")} *`}>
                  <Input value={gymName} onChange={e => setGymName(e.target.value)} />
                </FieldShell>
                <FieldShell label={t("common.table.description")}>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </FieldShell>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    {/* Sheet2#1 + Sheet3: địa chỉ gõ tay hay sai chuẩn nên admin
                        phải bắt xác minh lại. Dùng chung ô gợi ý địa chỉ
                        như /gym/branches để ra địa chỉ chuẩn ngay từ đầu; không
                        có gợi ý nào thì ô này vẫn gõ tay được bình thường. */}
                    <FieldShell label={t("common.table.address")} htmlFor="gym-address">
                      <PlaceAutocompleteInput
                        value={address}
                        onValueChange={(value) => {
                          setAddress(value);
                          // Sửa lại chữ sau khi đã chọn gợi ý -> toạ độ cũ không còn
                          // khớp; bỏ đi để BE geocode lại đúng chuỗi được lưu.
                          setCoords(null);
                        }}
                        onPlacePicked={(place) => {
                          // Lưu địa chỉ ĐẦY ĐỦ chứ không phải tên địa điểm: cột
                          // address là thứ admin soát và BE geocode lại về sau.
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
                        onError={(message) => toast({ type: "error", title: message })}
                      />
                    </FieldShell>
                    {/* UC-18 (V60): nhìn thấy ghim rơi ở đâu mới biết dịch vụ geocoding đặt sai. */}
                    <AddressPinMap
                      className="mt-2"
                      value={coords ? { lat: coords.lat, lng: coords.lng } : null}
                      onChange={(position) => void pinAt(position)}
                    />
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      {pinResolving ? (
                        <>
                          <Loader2 className="size-3.5 shrink-0 animate-spin" />
                          {t("gym.branches.pinAddressResolving")}
                        </>
                      ) : coords ? (
                        t(coords.pinnedByUser
                            ? "gym.branches.coordsAdjusted"
                            : "gym.branches.coordsPinned", {
                            lat: coords.lat.toFixed(5),
                            lng: coords.lng.toFixed(5),
                          })
                      ) : (
                        t("gym.branches.coordsAuto")
                      )}
                    </p>
                    {/* Bug S2-01: admin yêu cầu xác minh lại địa chỉ — hiện ngay cạnh ô
                        cần sửa, kèm lý do. Cờ tự gỡ sau khi lưu địa chỉ mới. */}
                    {status?.addressVerified === false && (
                      <p className="mt-1.5 rounded-lg border border-warning/30 bg-warning-muted px-2.5 py-2 text-[11px] font-semibold text-warning">
                        {t("gym.settings.addressRecheckNotice")}
                        {status.addressReviewNote ? ` — ${status.addressReviewNote}` : ""}
                      </p>
                    )}
                  </div>
                  {/* UC-18 (V66): CHỈ ĐỌC. Hai ô này là nhãn hành chính của đúng
                      cái ghim trên bản đồ nên phải do vị trí quyết định — gõ tay
                      được là mở đường cho hồ sơ ghim ở phường này mà gắn nhãn
                      phường khác. Muốn sửa thì sửa ghim. */}
                  <div className="space-y-4">
                    <FieldShell label={t("common.table.city")}>
                      <Input value={city} readOnly disabled />
                    </FieldShell>
                    <FieldShell label={t("common.table.ward")}>
                      <Input value={ward} readOnly disabled />
                    </FieldShell>
                    <p className="text-[11px] text-muted-foreground">
                      {t("gym.branches.locationAutoFilled")}
                    </p>
                  </div>
                </div>
                <FieldShell label={t("common.table.phone")}>
                  <Input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                  {phone.trim() && !isVietnamPhone(phone) && (
                    <p className="mt-1.5 text-[11px] font-semibold text-destructive">
                      {t("common.validation.phone")}
                    </p>
                  )}
                </FieldShell>
                <div className="flex justify-end">
                  {/* pinResolving cũng chặn Lưu: bấm giữa lúc đang tra ngược sẽ gửi
                      đi địa chỉ CŨ, rồi kết quả về sau ghi đè lên form. */}
                  <Button onClick={submit} disabled={saveProfile.isPending || pinResolving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {saveProfile.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.settings.saveProfile")}
                  </Button>
                </div>
              </div>
            </div>

            <PoliciesSection />

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4"><Eye className="size-4 text-primary" /> {t("gym.settings.visibilityTitle")}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("gym.settings.visibilityHint")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notApproved
                      ? t("gym.settings.visibilityLocked")
                      : t("gym.settings.visibilityOn")}
                  </p>
                </div>
                <Switch
                  /* Switch là <button role="switch"> không có chữ bên trong —
                     thiếu aria-label thì screen reader chỉ đọc "switch". */
                  aria-label={t("gym.settings.visibilityTitle")}
                  checked={visible}
                  disabled={saveVisibility.isPending || notApproved}
                  onCheckedChange={(v) => { setVisible(v); saveVisibility.mutate(v); }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
