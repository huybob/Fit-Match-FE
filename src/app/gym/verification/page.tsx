"use client";

// Gói 2.B (audit 2026-07-17):
// - B-5: xử lý đủ REQUIRES_INFO/SUSPENDED — luồng "yêu cầu bổ sung -> nộp lại" hoạt động.
// - B-10: hiển thị reviewNote (ghi chú admin khi request-info/suspend).
// - B-4 (UC-012): quản lý tài liệu lẻ khi hồ sơ PENDING/REQUIRES_INFO/REJECTED
//   (BE cho phép sửa tài liệu ở các trạng thái này; trước đây input bị disable oan).
// - B-34: gỡ bảng chi nhánh mock, taxCode/businessCode/legalRep (nhập nhưng không gửi),
//   nút "Lưu bản nháp" trùng handler submit.
// - B-35: banner SUSPENDED + khóa submit.

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, GitBranch, ShieldCheck,
  CheckCircle2, Clock, AlertCircle, Circle,
  Trash2, Loader2,
} from "lucide-react";
import { gymService } from "@/services/gym.service";
import type {
  SubmitGymRegistrationRequest,
  GymDocumentDto,
  GymVerificationStatus,
} from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { getErrorStatus, toErrorMessage } from "@/shared/utils/error.util";
import { FileUpload } from "@/shared/components/common/file-upload";
import {
  PlaceAutocompleteInput,
  type PinnedPlace,
} from "@/shared/components/map/place-autocomplete-input";
import { AddressPinMap } from "@/shared/components/map/address-pin-map";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";

/* Chỉ giữ khoá i18n ở module scope — nhãn resolve trong component vì t() cần hook. */
const STATUS_STEP_KEYS = [
  "gym.verification.stepBusiness",
  "gym.verification.stepDocs",
  "gym.verification.stepPending",
] as const;

const DOC_TYPES = [
  { type: "BUSINESS_LICENSE", labelKey: "gym.verification.docLicense" },
  { type: "TAX_CERT", labelKey: "gym.verification.docTax" },
  { type: "SUPPLEMENT", labelKey: "gym.verification.docExtra" },
] as const;

const DOC_TYPE_KEY: Record<string, (typeof DOC_TYPES)[number]["labelKey"]> =
  Object.fromEntries(DOC_TYPES.map((d) => [d.type, d.labelKey]));

function statusStepIndex(s?: GymVerificationStatus) {
  if (!s || s === "NOT_SUBMITTED") return 0;
  if (s === "PENDING" || s === "REQUIRES_INFO" || s === "REJECTED") return 2;
  return 3; // APPROVED / SUSPENDED — hồ sơ đã qua vòng duyệt
}

/** Quản lý tài liệu lẻ (UC-012) — dùng khi hồ sơ đã tồn tại và BE còn cho sửa. */
function DocumentManager() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newType, setNewType] = useState<string>(DOC_TYPES[2].type);
  const [newUrl, setNewUrl] = useState("");

  const docs = useQuery({ queryKey: ["gym-documents"], queryFn: gymService.listDocuments });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["gym-documents"] });
    qc.invalidateQueries({ queryKey: ["gym-verification-status"] });
  };

  const add = useMutation({
    mutationFn: () => gymService.addDocument({ documentType: newType, fileUrl: newUrl }),
    onSuccess: () => {
      invalidate();
      setNewUrl("");
      toast({ type: "success", title: t("gym.verification.docAdded") });
    },
    onError: (e) => toast({ type: "error", title: t("gym.ptOps.addFailed"), description: toErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => gymService.deleteDocument(id),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: t("gym.verification.docDeleted") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <div className="px-6 py-5 space-y-4">
      {docs.isLoading ? (
        <div className="h-16 bg-muted rounded-xl animate-pulse" />
      ) : docs.isError ? (
        <p className="text-xs text-destructive">{toErrorMessage(docs.error)}</p>
      ) : (docs.data ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("gym.verification.noDocs")}</p>
      ) : (
        <ul className="space-y-2">
          {(docs.data ?? []).map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">
                  {DOC_TYPE_KEY[doc.documentType] ? t(DOC_TYPE_KEY[doc.documentType]) : doc.documentType}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{doc.fileUrl}</p>
              </div>
              <IconButton
                tooltip={t("gym.verification.deleteDoc")}
                onClick={() => doc.id && remove.mutate(doc.id)}
                disabled={remove.isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">{t("gym.verification.addDocTitle")}</p>
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((d) => (
              <SelectItem key={d.type} value={d.type}>{t(d.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FileUpload value={newUrl} onChange={setNewUrl} folder="documents" label={t("gym.verification.uploadDoc")} />
        <Button
          onClick={() => add.mutate()}
          disabled={!newUrl.trim() || add.isPending}
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
        >
          {add.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.verification.addDoc")}
        </Button>
      </div>
    </div>
  );
}

export default function GymVerificationPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [gymName, setGymName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  // UC-18 (V55) / bug S2-01: gym mới trước đây gõ địa chỉ bằng <Input> thường nên
  // sinh ra hồ sơ phi chuẩn ngay từ lúc đăng ký — đúng nguyên nhân Admin phải bắt
  // xác minh lại địa chỉ. Chọn từ gợi ý địa chỉ là có sẵn toạ độ chuẩn.
  const [coords, setCoords] = useState<PinnedPlace | null>(null);
  const [documents, setDocuments] = useState<GymDocumentDto[]>(
    DOC_TYPES.map((d) => ({ documentType: d.type, fileUrl: "" })),
  );

  const { data: status, isError: statusError, error: statusErrorObj } = useQuery({
    queryKey: ["gym-verification-status"],
    queryFn: gymService.getVerificationStatus,
  });

  useEffect(() => {
    if (!status) return;
    if (status.gymName) setGymName(status.gymName);
    if (status.description) setDescription(status.description);
    if (status.address) setAddress(status.address);
    if (status.city) setCity(status.city);
    if (status.district) setDistrict(status.district);
    if (status.phone) setPhone(status.phone);
    if (status.latitude != null && status.longitude != null) {
      setCoords({
        lat: status.latitude,
        lng: status.longitude,
        pinnedByUser: status.coordinatesPinned,
      });
    }
    if (status.documents?.length) setDocuments(status.documents);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.verificationStatus]);

  // BUG-08: BE trả 404 khi user chưa có hồ sơ gym — đó là trạng thái onboarding
  // hợp lệ, không phải sự cố cần báo lỗi.
  const isMissingProfile = statusError && getErrorStatus(statusErrorObj) === 404;
  const verificationStatus = status?.verificationStatus;
  const isPending = verificationStatus === "PENDING";
  const isApproved = verificationStatus === "APPROVED";
  const isRejected = verificationStatus === "REJECTED";
  const isRequiresInfo = verificationStatus === "REQUIRES_INFO";
  const isSuspended = verificationStatus === "SUSPENDED";
  // B-5: REJECTED và REQUIRES_INFO đều đi qua PUT /gym/registration/resubmit (BE cho phép cả hai).
  const isResubmit = isRejected || isRequiresInfo;
  const formLocked = isPending || isApproved || isSuspended;
  const hasProfile = !!verificationStatus && verificationStatus !== "NOT_SUBMITTED";
  const canManageDocs = isPending || isRequiresInfo || isRejected;

  const submitMut = useMutation({
    mutationFn: (payload: SubmitGymRegistrationRequest) =>
      isResubmit
        ? gymService.resubmitRegistration(payload)
        : gymService.submitRegistration(payload),
    onSuccess: () => {
      toast({
        type: "success",
        title: isResubmit ? t("gym.verification.resubmitted") : t("gym.verification.submitted"),
      });
      qc.invalidateQueries({ queryKey: ["gym-verification-status"] });
      qc.invalidateQueries({ queryKey: ["gym-documents"] });
    },
    onError: (e) => toast({ type: "error", title: t("gym.verification.submitFailed"), description: toErrorMessage(e) }),
  });

  function updateDoc(index: number, value: string) {
    setDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, fileUrl: value } : d)));
  }

  function handleSubmit() {
    if (!gymName.trim()) {
      toast({ type: "warning", title: t("gym.verification.nameRequired") });
      return;
    }
    const validDocs = documents.filter((d) => d.fileUrl.trim());
    if (validDocs.length === 0) {
      toast({ type: "warning", title: t("gym.verification.docRequired") });
      return;
    }
    submitMut.mutate({
      gymName: gymName.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      district: district.trim() || undefined,
      phone: phone.trim() || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
      placeId: coords?.placeId,
      // V65: nhan nguon cua placeId — thieu no thi BE coi la "khong ro nguon"
      // va job lam moi toa do se bo qua ban ghi.
      placeProvider: coords?.placeProvider,
      formattedAddress: coords?.formattedAddress,
      coordinatesPinned: coords?.pinnedByUser,
      documents: validDocs.map(({ documentType, fileUrl }) => ({ documentType, fileUrl })),
    });
  }

  const stepIdx = statusStepIndex(verificationStatus);
  const docFilled = documents.filter((d) => d.fileUrl.trim()).length;
  const profilePct = gymName ? 100 : 0;
  const docPct = Math.round((docFilled / Math.max(documents.length, 1)) * 100);

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("gym.verification.title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("gym.verification.subtitle")}</p>
            </div>
            <Button
              size="sm"
              className="px-5"
              onClick={handleSubmit}
              disabled={submitMut.isPending || formLocked}
            >
              {submitMut.isPending ? t("common.states.submitting") : isResubmit ? t("gym.verification.resubmit") : t("gym.verification.submit")}
            </Button>
          </div>

          {/* BUG-08: 404 ở đây KHÔNG phải sự cố — nghĩa là operator chưa nộp hồ sơ,
              đúng trạng thái mà chính trang này sinh ra để xử lý. Trước đây nó bị
              coi là lỗi và đổ nguyên văn text nội bộ của BE
              ("Gym profile for user not found with id: operator") ra giao diện. */}
          {statusError && !isMissingProfile && (
            <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{t("gym.verification.statusLoadError")}</p>
            </div>
          )}

          {/* Progress stepper */}
          <div className="bg-card rounded-2xl border border-border px-6 py-5 mb-6 shadow-sm">
            <div className="flex items-center">
              {STATUS_STEP_KEYS.map((stepKey, i) => {
                const done = i < stepIdx;
                const current = i === stepIdx || (stepIdx === 0 && i === 0);
                return (
                  <div key={stepKey} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`size-9 rounded-full flex items-center justify-center border-2 ${
                        done ? "bg-primary border-primary"
                          : current ? "bg-card border-primary"
                          : "bg-card border-border"
                      }`}>
                        {done ? (
                          <CheckCircle2 className="size-5 text-primary-foreground" />
                        ) : current ? (
                          <div className="size-3 rounded-full bg-primary" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold text-center max-w-[100px] leading-tight ${
                        done || current ? "text-primary" : "text-muted-foreground"
                      }`}>{t(stepKey)}</span>
                    </div>
                    {i < STATUS_STEP_KEYS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {isRejected && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{t("gym.verification.rejectedTitle")}</p>
                  {status?.rejectionReason && (
                    <p className="text-xs text-destructive mt-0.5">{status.rejectionReason}</p>
                  )}
                  <p className="text-xs text-destructive mt-1">{t("gym.verification.rejectedBody")}</p>
                </div>
              </div>
            )}
            {isRequiresInfo && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-warning-muted border border-warning/30">
                <AlertCircle className="size-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-warning">{t("gym.verification.needInfoTitle")}</p>
                  {status?.reviewNote && (
                    <p className="text-xs text-warning mt-0.5">{t("gym.verification.adminNote")} {status.reviewNote}</p>
                  )}
                  <p className="text-xs text-warning mt-1">{t("gym.verification.needInfoBody")}</p>
                </div>
              </div>
            )}
            {isPending && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-warning-muted border border-warning/30">
                <Clock className="size-4 text-warning shrink-0" />
                <p className="text-sm text-warning font-medium">{t("gym.verification.pendingBody")}</p>
              </div>
            )}
            {isApproved && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-success-muted border border-success/30">
                <CheckCircle2 className="size-4 text-success shrink-0" />
                <p className="text-sm text-success font-medium">{t("gym.verification.approvedBody")}</p>
              </div>
            )}
            {isSuspended && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{t("gym.verification.suspendedTitle")}</p>
                  {status?.reviewNote && (
                    <p className="text-xs text-destructive mt-0.5">{t("gym.verification.reasonLabel")} {status.reviewNote}</p>
                  )}
                  <p className="text-xs text-destructive mt-1">{t("gym.verification.suspendedBody")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left: Form sections */}
            <div className="space-y-5 lg:col-span-2">
              {/* Section 1: Business info */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                  <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-3.5 text-primary" />
                  </div>
                  <h2 className="text-[15px] font-bold text-foreground">{t("gym.verification.stepBusiness")}</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {t("gym.verification.brandNameLabel")} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="FitMatch Premium Gym"
                      disabled={formLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.description")}</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("gym.verification.bioPlaceholder")}
                      disabled={formLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.address")}</label>
                    {/* UC-18 (V55): chọn từ gợi ý địa chỉ để hồ sơ có toạ độ chuẩn
                        ngay từ lúc đăng ký và xuất hiện đúng chỗ khi khách tìm
                        "gym quanh đây". Không có gợi ý nào thì ô này vẫn gõ tay
                        được bình thường, BE sẽ tự geocode chuỗi địa chỉ khi lưu. */}
                    <PlaceAutocompleteInput
                      value={address}
                      onValueChange={(value) => {
                        setAddress(value);
                        // Sửa chữ sau khi đã chọn gợi ý -> toạ độ cũ không còn khớp.
                        setCoords(null);
                      }}
                      onPlacePicked={(place) => {
                        setAddress(place.formattedAddress);
                        setCoords({
                          lat: place.lat,
                          lng: place.lng,
                          placeId: place.placeId,
                          placeProvider: place.placeProvider,
                          formattedAddress: place.formattedAddress,
                        });
                        if (place.district) setDistrict(place.district);
                        if (place.city) setCity(place.city);
                      }}
                      onError={(message) => toast({ type: "warning", title: message })}
                      placeholder={t("gym.branches.addressPlaceholder")}
                      disabled={formLocked}
                    />
                    {/* UC-18 (V60): hồ sơ khoá (PENDING/APPROVED) chỉ xem, không kéo được. */}
                    <AddressPinMap
                      className="mt-2"
                      disabled={formLocked}
                      value={coords ? { lat: coords.lat, lng: coords.lng } : null}
                      onChange={(position) =>
                        setCoords((prev) => ({
                          ...prev,
                          lat: position.lat,
                          lng: position.lng,
                          pinnedByUser: true,
                        }))
                      }
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {coords
                        ? t(coords.pinnedByUser
                            ? "gym.branches.coordsAdjusted"
                            : "gym.branches.coordsPinned", {
                            lat: coords.lat.toFixed(5),
                            lng: coords.lng.toFixed(5),
                          })
                        : t("gym.branches.coordsAuto")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.city")}</label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t("gym.branches.cityPlaceholder")}
                        disabled={formLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.district")}</label>
                      <Input
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder={t("gym.branches.districtPlaceholder")}
                        disabled={formLocked}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.phone")}</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901 234 567"
                      disabled={formLocked}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Legal documents — upload khi tạo mới / nộp lại */}
              {!hasProfile || isResubmit ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                    <div className="size-6 rounded bg-info-muted flex items-center justify-center">
                      <ShieldCheck className="size-3.5 text-info" />
                    </div>
                    <h2 className="text-[15px] font-bold text-foreground">{t("gym.verification.stepDocs")}</h2>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">
                        {t("gym.verification.licenceLabel")} <span className="text-destructive">*</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-xl p-6 ${
                        documents[0]?.fileUrl ? "border-primary/40 bg-primary/10" : "border-border bg-muted/40"
                      }`}>
                        <div className="flex flex-col items-center gap-2 mb-3">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                            <ShieldCheck className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">{t("gym.verification.fileHint")}</p>
                        </div>
                        <FileUpload
                          value={documents[0]?.fileUrl ?? ""}
                          onChange={(url) => updateDoc(0, url)}
                          folder="documents"
                          label={t("gym.verification.uploadLicence")}
                          disabled={formLocked}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {documents.slice(1).map((doc, i) => {
                        const info = DOC_TYPES[i + 1];
                        return (
                          <div key={i} className={`border border-dashed border-border rounded-xl p-4 ${doc.fileUrl ? "border-primary/40 bg-primary/10" : "bg-muted/40"}`}>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              {info ? t(info.labelKey) : DOC_TYPE_KEY[doc.documentType] ? t(DOC_TYPE_KEY[doc.documentType]) : t("gym.verification.docLabel")}
                            </p>
                            <FileUpload
                              value={doc.fileUrl}
                              onChange={(url) => updateDoc(i + 1, url)}
                              folder="documents"
                              label={t("common.actions.upload")}
                              disabled={formLocked}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Section 2b: Quản lý tài liệu lẻ (UC-012) khi hồ sơ đã tồn tại */}
              {hasProfile && canManageDocs && (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                    <div className="size-6 rounded bg-info-muted flex items-center justify-center">
                      <ShieldCheck className="size-3.5 text-info" />
                    </div>
                    <h2 className="text-[15px] font-bold text-foreground">{t("gym.verification.submittedDocs")}</h2>
                  </div>
                  <DocumentManager />
                </div>
              )}

              {/* Section 3: Chi nhánh — trang quản lý thật (gỡ bảng mock B-34) */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded bg-success-muted flex items-center justify-center">
                      <GitBranch className="size-3.5 text-success" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-foreground">{t("gym.nav.branches")}</h2>
                      <p className="text-xs text-muted-foreground">{t("gym.verification.branchesHint")}</p>
                    </div>
                  </div>
                  <Link href="/gym/branches"
                    className="text-xs text-primary font-semibold hover:underline">
                    {t("gym.verification.manageBranches")}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Info panel */}
            <div className="space-y-4">
              <div className="bg-primary rounded-2xl p-5 text-primary-foreground">
                <h3 className="text-sm font-bold mb-3">{t("gym.verification.noticeTitle")}</h3>
                <ul className="space-y-2.5">
                  {[
                    t("gym.verification.notice1"),
                    t("gym.verification.notice2"),
                    t("gym.verification.notice3"),
                  ].map((note, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-success-foreground/85">
                      <CheckCircle2 className="size-3.5 text-success-foreground mt-0.5 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-[13px] font-bold text-foreground mb-4">{t("gym.verification.statusTitle")}</h3>
                <div className="space-y-3">
                  {[
                    { label: t("gym.verification.stepBasic"), pct: profilePct },
                    { label: t("gym.verification.stepDocs"), pct: docPct },
                  ].map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-muted-foreground font-medium">{label}</span>
                        <span className={`text-[10px] font-bold ${pct === 100 ? "text-success" : "text-warning"}`}>
                          {pct === 100 ? t("gym.verification.stepDone") : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-warning"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}
