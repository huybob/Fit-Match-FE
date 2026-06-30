"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Bell, Search, Plus, CheckCircle2,
  Clock, Circle, Trash2, ExternalLink, AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { trainerService } from "@/services/trainer.service";
import type {
  SubmitPtRegistrationRequest,
  PtDocumentDto,
  CertificationResponse,
  CertificationRequest,
  PtVerificationStatus,
} from "@/types/Trainer";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";

const SPECIALIZATIONS = ["Gym & Fitness", "Yoga", "Kickboxing", "Pilates", "Swimming", "Boxing", "Zumba"];
const EXP_OPTIONS = [
  { value: 1, label: "Dưới 1 năm" },
  { value: 2, label: "1 - 3 năm" },
  { value: 5, label: "3 - 5 năm" },
  { value: 8, label: "5 - 10 năm" },
  { value: 11, label: "Trên 10 năm" },
];

const STATUS_STEPS: { key: PtVerificationStatus | "DRAFT"; label: string }[] = [
  { key: "NOT_SUBMITTED", label: "Bản thảo" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã xác minh" },
];

function statusStepIndex(s?: PtVerificationStatus) {
  if (!s || s === "NOT_SUBMITTED") return 0;
  if (s === "PENDING") return 1;
  if (s === "APPROVED") return 2;
  return 0; // REJECTED — back to draft
}

export default function TrainerVerificationPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(2);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [documents, setDocuments] = useState<PtDocumentDto[]>([
    { documentType: "CCCD_FRONT", fileUrl: "" },
    { documentType: "CCCD_BACK", fileUrl: "" },
  ]);

  // Certification dialog
  const [showCertForm, setShowCertForm] = useState(false);
  const [certName, setCertName] = useState("");
  const [certOrg, setCertOrg] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certUrl, setCertUrl] = useState("");

  const { data: status } = useQuery({
    queryKey: ["pt-verification-status"],
    queryFn: trainerService.getVerificationStatus,
  });

  useEffect(() => {
    if (!status) return;
    if (status.displayName) setDisplayName(status.displayName);
    if (status.serviceArea) setServiceArea(status.serviceArea);
    if (status.bio) setBio(status.bio);
    if (status.experienceYears) setExperienceYears(status.experienceYears);
    if (status.specialization) setSpecializations((status.specialization as string).split(",").map((s: string) => s.trim()).filter(Boolean));
    if (status.documents?.length) setDocuments(status.documents);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.verificationStatus]);

  const { data: certs = [], isLoading: loadingCerts } = useQuery({
    queryKey: ["pt-certifications"],
    queryFn: trainerService.listCertifications,
  });

  const submitMut = useMutation({
    mutationFn: (payload: SubmitPtRegistrationRequest) => {
      const isRejected = status?.verificationStatus === "REJECTED";
      return isRejected
        ? trainerService.resubmitRegistration(payload)
        : trainerService.submitRegistration(payload);
    },
    onSuccess: () => {
      toast({ type: "success", title: "Đã gửi hồ sơ xác minh thành công" });
      qc.invalidateQueries({ queryKey: ["pt-verification-status"] });
    },
    onError: (e) => toast({ type: "error", title: "Gửi thất bại", description: toErrorMessage(e) }),
  });

  const addCertMut = useMutation({
    mutationFn: (payload: CertificationRequest) => trainerService.addCertification(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pt-certifications"] });
      setShowCertForm(false);
      setCertName(""); setCertOrg(""); setCertDate(""); setCertUrl("");
      toast({ type: "success", title: "Đã thêm chứng chỉ" });
    },
    onError: (e) => toast({ type: "error", title: "Thêm thất bại", description: toErrorMessage(e) }),
  });

  const deleteCertMut = useMutation({
    mutationFn: (id: number) => trainerService.deleteCertification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pt-certifications"] });
      toast({ type: "success", title: "Đã xóa chứng chỉ" });
    },
  });

  function toggleSpec(s: string) {
    setSpecializations(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function updateDoc(index: number, field: keyof PtDocumentDto, value: string) {
    setDocuments(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  }

  function handleSubmit() {
    if (!displayName.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập tên hiển thị" }); return;
    }
    const validDocs = documents.filter(d => d.fileUrl.trim());
    if (validDocs.length === 0) {
      toast({ type: "warning", title: "Vui lòng cung cấp ít nhất 1 tài liệu" }); return;
    }
    submitMut.mutate({
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      serviceArea: serviceArea.trim() || undefined,
      specialization: specializations.join(", ") || undefined,
      experienceYears,
      documents: validDocs,
    });
  }

  const verificationStatus = status?.verificationStatus;
  const stepIdx = statusStepIndex(verificationStatus);
  const isPending = verificationStatus === "PENDING";
  const isApproved = verificationStatus === "APPROVED";
  const isRejected = verificationStatus === "REJECTED";

  const initial = (user?.fullName ?? user?.username ?? "T")[0]?.toUpperCase();

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none w-56 placeholder:text-gray-400" placeholder="Tìm kiếm..." />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell className="size-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {initial}
              </div>
              <span className="text-sm font-semibold text-gray-700">{user?.fullName ?? user?.username}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">Xác Minh Danh Tính Chuyên Gia</h1>
              <p className="text-sm text-gray-500 mt-1">Hoàn thành các bước dưới đây để xây dựng niềm tin với khách hàng và bắt đầu cung cấp dịch vụ trên FitMatch.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitMut.isPending || isPending || isApproved}
                className="flex items-center gap-2 h-9 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                Lưu bản thảo
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitMut.isPending || isPending || isApproved}
                className="flex items-center gap-2 h-9 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200 disabled:opacity-40"
              >
                {submitMut.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>

          {/* Status stepper */}
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 mb-6 shadow-sm">
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i < stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`size-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done ? "bg-[#2563eb] border-[#2563eb]"
                          : current ? "bg-white border-[#2563eb]"
                          : "bg-white border-gray-200"
                      }`}>
                        {done ? (
                          <CheckCircle2 className="size-5 text-white" />
                        ) : current && isRejected ? (
                          <AlertCircle className="size-4 text-red-500" />
                        ) : current ? (
                          <div className="size-3 rounded-full bg-[#2563eb]" />
                        ) : (
                          <Circle className="size-4 text-gray-300" />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold whitespace-nowrap ${
                        done || current ? "text-[#2563eb]" : "text-gray-400"
                      }`}>{step.label}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full ${done ? "bg-[#2563eb]" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {isRejected && status?.rejectionReason && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Hồ sơ bị từ chối</p>
                  <p className="text-xs text-red-600 mt-0.5">{status.rejectionReason}</p>
                  <p className="text-xs text-red-500 mt-1">Vui lòng chỉnh sửa và gửi lại hồ sơ.</p>
                </div>
              </div>
            )}
            {isPending && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Clock className="size-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Hồ sơ đang được xét duyệt. Thời gian xử lý thường từ 24 - 48 giờ làm việc.</p>
              </div>
            )}
            {isApproved && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Tài khoản đã được xác minh. Bạn có thể bắt đầu cung cấp dịch vụ.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Section 1: Personal info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-blue-600">1</span>
                  </div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Thông tin cá nhân</h2>
                </div>
                {displayName && serviceArea && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Hoàn tất</span>
                )}
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    disabled={isPending || isApproved}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Khu vực phục vụ</label>
                  <input
                    value={serviceArea}
                    onChange={e => setServiceArea(e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    disabled={isPending || isApproved}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
                  <input
                    placeholder="0901 234 567"
                    disabled={isPending || isApproved}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2563eb] disabled:bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giới thiệu bản thân</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Mô tả kinh nghiệm, phương pháp huấn luyện..."
                    disabled={isPending || isApproved}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2563eb] resize-none disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Experience & Specialization */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-purple-600">2</span>
                  </div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Kinh nghiệm & Chứng chỉ</h2>
                </div>
                {specializations.length > 0 && (
                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Đang nhập liệu</span>
                )}
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số năm kinh nghiệm</label>
                  <select
                    value={experienceYears}
                    onChange={e => setExperienceYears(Number(e.target.value))}
                    disabled={isPending || isApproved}
                    className="h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2563eb] disabled:bg-gray-50 min-w-[200px]"
                  >
                    {EXP_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Chuyên môn chính</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS.map(s => (
                      <button
                        key={s}
                        type="button"
                        disabled={isPending || isApproved}
                        onClick={() => toggleSpec(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          specializations.includes(s)
                            ? "bg-[#2563eb] border-[#2563eb] text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:border-[#2563eb] hover:text-[#2563eb]"
                        } disabled:cursor-not-allowed`}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                {/* Certifications list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-600">Chứng chỉ đã đạt</label>
                    {!isPending && !isApproved && (
                      <button
                        onClick={() => setShowCertForm(true)}
                        className="flex items-center gap-1 text-xs text-[#2563eb] font-semibold hover:underline"
                      >
                        <Plus className="size-3" /> Thêm chứng chỉ
                      </button>
                    )}
                  </div>

                  {loadingCerts ? (
                    <p className="text-xs text-gray-400 py-2">Đang tải...</p>
                  ) : (certs as CertificationResponse[]).length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Chưa có chứng chỉ nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {(certs as CertificationResponse[]).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-lg bg-blue-100 flex items-center justify-center">
                              <ShieldCheck className="size-3.5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#0f172a]">{c.name}</p>
                              {c.issuingOrganization && <p className="text-[10px] text-gray-400">{c.issuingOrganization} {c.issueDate ? `· ${c.issueDate}` : ""}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {c.credentialUrl && (
                              <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-[#2563eb] transition-colors">
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                            {!isPending && !isApproved && (
                              <button
                                onClick={() => c.id && deleteCertMut.mutate(c.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCertForm && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                      <p className="text-xs font-bold text-[#0f172a]">Thêm chứng chỉ mới</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input value={certName} onChange={e => setCertName(e.target.value)}
                            placeholder="Tên chứng chỉ *" className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563eb]" />
                        </div>
                        <input value={certOrg} onChange={e => setCertOrg(e.target.value)}
                          placeholder="Tổ chức cấp" className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563eb]" />
                        <input value={certDate} onChange={e => setCertDate(e.target.value)}
                          type="date" placeholder="Ngày cấp" className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563eb]" />
                        <div className="col-span-2">
                          <input value={certUrl} onChange={e => setCertUrl(e.target.value)}
                            placeholder="Link xác minh (URL)" className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563eb]" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addCertMut.mutate({ name: certName, issuingOrganization: certOrg || undefined, issueDate: certDate || undefined, credentialUrl: certUrl || undefined })}
                          disabled={!certName.trim() || addCertMut.isPending}
                          className="h-8 px-4 bg-[#2563eb] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
                        >
                          {addCertMut.isPending ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button onClick={() => setShowCertForm(false)} className="h-8 px-4 bg-white border border-gray-200 text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-50">
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Documents */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-orange-600">3</span>
                  </div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Hồ sơ đính kèm</h2>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-xs text-gray-500 mb-4">Vui lòng tải lên ảnh chụp bản gốc của Chứng minh nhân dân/CCCD và các Bằng cấp chuyên môn liên quan.</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {documents.map((doc, i) => (
                    <div key={i} className={`border-2 border-dashed rounded-xl p-4 ${doc.fileUrl ? "border-[#2563eb]/40 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        {doc.documentType === "CCCD_FRONT" ? "Mặt trước CCCD" :
                         doc.documentType === "CCCD_BACK" ? "Mặt sau CCCD" : doc.documentType}
                      </p>
                      <input
                        value={doc.fileUrl}
                        onChange={e => updateDoc(i, "fileUrl", e.target.value)}
                        placeholder="Dán URL ảnh vào đây..."
                        disabled={isPending || isApproved}
                        className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563eb] bg-white disabled:bg-gray-100"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG (Tối đa 5MB)</p>
                    </div>
                  ))}
                </div>

                {!isPending && !isApproved && (
                  <button
                    onClick={() => setDocuments(prev => [...prev, { documentType: "CERTIFICATE", fileUrl: "" }])}
                    className="flex items-center gap-1.5 text-xs text-[#2563eb] font-semibold hover:underline"
                  >
                    <Plus className="size-3" /> Thêm tài liệu khác
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom notice */}
          <div className="mt-5 flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <div className="size-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[8px] text-[#2563eb] font-bold">i</span>
              </div>
              Thông tin của bạn sẽ được bảo mật và chỉ hiển thị cho mục đích xác minh.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitMut.isPending || isPending || isApproved}
                className="h-9 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                Lưu bản thảo
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitMut.isPending || isPending || isApproved}
                className="h-9 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                {submitMut.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
    </main>
  );
}
