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
import { toErrorMessage } from "@/shared/utils/error.util";
import { FileUpload } from "@/shared/components/common/file-upload";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";

const STATUS_STEPS = [
  { label: "Thông tin doanh nghiệp" },
  { label: "Tài liệu pháp lý" },
  { label: "Chờ phê duyệt" },
];

const DOC_TYPES = [
  { type: "BUSINESS_LICENSE", label: "Giấy phép kinh doanh (Bản gốc/Công chứng)" },
  { type: "TAX_CERT", label: "Chứng nhận thuế" },
  { type: "SUPPLEMENT", label: "Tài liệu bổ sung" },
];

const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.type, d.label]),
);

function statusStepIndex(s?: GymVerificationStatus) {
  if (!s || s === "NOT_SUBMITTED") return 0;
  if (s === "PENDING" || s === "REQUIRES_INFO" || s === "REJECTED") return 2;
  return 3; // APPROVED / SUSPENDED — hồ sơ đã qua vòng duyệt
}

/** Quản lý tài liệu lẻ (UC-012) — dùng khi hồ sơ đã tồn tại và BE còn cho sửa. */
function DocumentManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newType, setNewType] = useState(DOC_TYPES[2].type);
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
      toast({ type: "success", title: "Đã thêm tài liệu" });
    },
    onError: (e) => toast({ type: "error", title: "Thêm thất bại", description: toErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => gymService.deleteDocument(id),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: "Đã xóa tài liệu" });
    },
    onError: (e) => toast({ type: "error", title: "Xóa thất bại", description: toErrorMessage(e) }),
  });

  return (
    <div className="px-6 py-5 space-y-4">
      {docs.isLoading ? (
        <div className="h-16 bg-muted rounded-xl animate-pulse" />
      ) : docs.isError ? (
        <p className="text-xs text-red-500">{toErrorMessage(docs.error)}</p>
      ) : (docs.data ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa có tài liệu nào.</p>
      ) : (
        <ul className="space-y-2">
          {(docs.data ?? []).map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">
                  {DOC_TYPE_LABEL[doc.documentType] ?? doc.documentType}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{doc.fileUrl}</p>
              </div>
              <button
                onClick={() => doc.id && remove.mutate(doc.id)}
                disabled={remove.isPending}
                className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors shrink-0"
                aria-label="Xóa tài liệu"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Thêm tài liệu mới</p>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="w-full h-9 text-sm border border-border rounded-lg px-2.5 bg-card text-foreground"
        >
          {DOC_TYPES.map((d) => (
            <option key={d.type} value={d.type}>{d.label}</option>
          ))}
        </select>
        <FileUpload value={newUrl} onChange={setNewUrl} folder="documents" label="Tải tài liệu lên" />
        <Button
          onClick={() => add.mutate()}
          disabled={!newUrl.trim() || add.isPending}
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-white text-sm"
        >
          {add.isPending && <Loader2 className="size-4 animate-spin" />} Thêm tài liệu
        </Button>
      </div>
    </div>
  );
}

export default function GymVerificationPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [gymName, setGymName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
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
    if (status.phone) setPhone(status.phone);
    if (status.documents?.length) setDocuments(status.documents);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.verificationStatus]);

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
        title: isResubmit ? "Đã nộp lại hồ sơ" : "Đã gửi hồ sơ xác minh thành công",
      });
      qc.invalidateQueries({ queryKey: ["gym-verification-status"] });
      qc.invalidateQueries({ queryKey: ["gym-documents"] });
    },
    onError: (e) => toast({ type: "error", title: "Gửi thất bại", description: toErrorMessage(e) }),
  });

  function updateDoc(index: number, value: string) {
    setDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, fileUrl: value } : d)));
  }

  function handleSubmit() {
    if (!gymName.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập tên phòng tập" });
      return;
    }
    const validDocs = documents.filter((d) => d.fileUrl.trim());
    if (validDocs.length === 0) {
      toast({ type: "warning", title: "Vui lòng cung cấp ít nhất 1 tài liệu" });
      return;
    }
    submitMut.mutate({
      gymName: gymName.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      documents: validDocs.map(({ documentType, fileUrl }) => ({ documentType, fileUrl })),
    });
  }

  const stepIdx = statusStepIndex(verificationStatus);
  const docFilled = documents.filter((d) => d.fileUrl.trim()).length;
  const profilePct = gymName ? 100 : 0;
  const docPct = Math.round((docFilled / Math.max(documents.length, 1)) * 100);

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <WorkspaceHeader />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Xác minh doanh nghiệp</h1>
              <p className="text-sm text-muted-foreground mt-1">Vui lòng cung cấp đầy đủ thông tin để kích hoạt tài khoản đối tác chính thức.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitMut.isPending || formLocked}
              className="h-9 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              {submitMut.isPending ? "Đang gửi..." : isResubmit ? "Nộp lại hồ sơ" : "Gửi yêu cầu"}
            </button>
          </div>

          {statusError && (
            <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{toErrorMessage(statusErrorObj)}</p>
            </div>
          )}

          {/* Progress stepper */}
          <div className="bg-card rounded-2xl border border-border px-6 py-5 mb-6 shadow-sm">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < stepIdx;
                const current = i === stepIdx || (stepIdx === 0 && i === 0);
                return (
                  <div key={step.label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`size-9 rounded-full flex items-center justify-center border-2 ${
                        done ? "bg-primary border-primary"
                          : current ? "bg-card border-primary"
                          : "bg-card border-border"
                      }`}>
                        {done ? (
                          <CheckCircle2 className="size-5 text-white" />
                        ) : current ? (
                          <div className="size-3 rounded-full bg-primary" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold text-center max-w-[100px] leading-tight ${
                        done || current ? "text-primary" : "text-muted-foreground"
                      }`}>{step.label}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {isRejected && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Hồ sơ bị từ chối</p>
                  {status?.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5">{status.rejectionReason}</p>
                  )}
                  <p className="text-xs text-red-600 mt-1">Bạn có thể chỉnh sửa thông tin bên dưới và nộp lại.</p>
                </div>
              </div>
            )}
            {isRequiresInfo && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Cần bổ sung thông tin</p>
                  {status?.reviewNote && (
                    <p className="text-xs text-amber-700 mt-0.5">Ghi chú của quản trị viên: {status.reviewNote}</p>
                  )}
                  <p className="text-xs text-amber-700 mt-1">Cập nhật thông tin/tài liệu theo yêu cầu rồi bấm “Nộp lại hồ sơ”.</p>
                </div>
              </div>
            )}
            {isPending && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Clock className="size-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Hồ sơ đang được xét duyệt. Thời gian phê duyệt từ 24 - 48 giờ làm việc. Bạn vẫn có thể bổ sung tài liệu ở mục bên dưới.</p>
              </div>
            )}
            {isApproved && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Doanh nghiệp đã được xác minh. Tài khoản đối tác chính thức đã kích hoạt.</p>
              </div>
            )}
            {isSuspended && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Phòng tập đang bị đình chỉ</p>
                  {status?.reviewNote && (
                    <p className="text-xs text-red-600 mt-0.5">Lý do: {status.reviewNote}</p>
                  )}
                  <p className="text-xs text-red-600 mt-1">Nội dung của bạn đã bị ẩn khỏi marketplace. Vui lòng liên hệ quản trị viên để được kích hoạt lại.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Left: Form sections */}
            <div className="col-span-2 space-y-5">
              {/* Section 1: Business info */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                  <div className="size-6 rounded bg-blue-100 flex items-center justify-center">
                    <Building2 className="size-3.5 text-primary" />
                  </div>
                  <h2 className="text-[15px] font-bold text-foreground">Thông tin doanh nghiệp</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Tên phòng tập (Thương hiệu) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="FitMatch Premium Gym"
                      disabled={formLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Giới thiệu ngắn về phòng tập"
                      disabled={formLocked}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Địa chỉ</label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, tên đường..."
                        disabled={formLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Thành phố</label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="TP. Hồ Chí Minh"
                        disabled={formLocked}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Số điện thoại</label>
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
                    <div className="size-6 rounded bg-purple-100 flex items-center justify-center">
                      <ShieldCheck className="size-3.5 text-purple-600" />
                    </div>
                    <h2 className="text-[15px] font-bold text-foreground">Tài liệu pháp lý</h2>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">
                        Giấy phép kinh doanh (Bản gốc/Công chứng) <span className="text-red-500">*</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-xl p-6 ${
                        documents[0]?.fileUrl ? "border-primary/40 bg-primary/10" : "border-border bg-muted/40"
                      }`}>
                        <div className="flex flex-col items-center gap-2 mb-3">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                            <ShieldCheck className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG (Tối đa 10MB)</p>
                        </div>
                        <FileUpload
                          value={documents[0]?.fileUrl ?? ""}
                          onChange={(url) => updateDoc(0, url)}
                          folder="documents"
                          label="Tải giấy phép lên"
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
                              {info?.label ?? DOC_TYPE_LABEL[doc.documentType] ?? "Tài liệu"}
                            </p>
                            <FileUpload
                              value={doc.fileUrl}
                              onChange={(url) => updateDoc(i + 1, url)}
                              folder="documents"
                              label="Tải lên"
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
                    <div className="size-6 rounded bg-purple-100 flex items-center justify-center">
                      <ShieldCheck className="size-3.5 text-purple-600" />
                    </div>
                    <h2 className="text-[15px] font-bold text-foreground">Tài liệu đã nộp</h2>
                  </div>
                  <DocumentManager />
                </div>
              )}

              {/* Section 3: Chi nhánh — trang quản lý thật (gỡ bảng mock B-34) */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded bg-green-100 flex items-center justify-center">
                      <GitBranch className="size-3.5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-foreground">Chi nhánh</h2>
                      <p className="text-xs text-muted-foreground">Quản lý chi nhánh tại trang riêng sau khi hồ sơ được duyệt.</p>
                    </div>
                  </div>
                  <Link href="/gym/branches"
                    className="text-xs text-primary font-semibold hover:underline">
                    Quản lý chi nhánh →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Info panel */}
            <div className="space-y-4">
              <div className="bg-primary rounded-2xl p-5 text-white">
                <h3 className="text-sm font-bold mb-3">Lưu ý quan trọng</h3>
                <ul className="space-y-2.5">
                  {[
                    "Đảm bảo tất cả thông tin khớp với Giấy phép kinh doanh của bạn.",
                    "Ảnh chụp tài liệu phải rõ nét, không tối hoặc bị mất góc.",
                    "Thời gian phê duyệt hồ sơ từ 24h - 48h làm việc.",
                  ].map((note, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-white/85">
                      <CheckCircle2 className="size-3.5 text-white mt-0.5 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-[13px] font-bold text-foreground mb-4">Trạng thái hồ sơ</h3>
                <div className="space-y-3">
                  {[
                    { label: "Thông tin cơ bản", pct: profilePct },
                    { label: "Tài liệu pháp lý", pct: docPct },
                  ].map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-muted-foreground font-medium">{label}</span>
                        <span className={`text-[10px] font-bold ${pct === 100 ? "text-emerald-600" : "text-orange-500"}`}>
                          {pct === 100 ? "Hoàn tất" : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
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
