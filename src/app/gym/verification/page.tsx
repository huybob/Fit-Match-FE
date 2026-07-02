"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, GitBranch, ShieldCheck,
  Bell, Search, CheckCircle2, Clock, AlertCircle, Circle,
  MapPin, Plus, Pencil,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
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

const STATUS_STEPS = [
  { label: "Thông tin doanh nghiệp" },
  { label: "Tài liệu pháp lý" },
  { label: "Xác thực chi nhánh" },
];

const DOC_TYPES = [
  { type: "BUSINESS_LICENSE", label: "Giấy phép kinh doanh (Bản gốc/Công chứng)" },
  { type: "TAX_CERT", label: "Chứng nhận thuế" },
  { type: "SUPPLEMENT", label: "Tài liệu bổ sung" },
];

function statusStepIndex(s?: GymVerificationStatus) {
  if (!s || s === "NOT_SUBMITTED") return 0;
  if (s === "PENDING") return 2;
  if (s === "APPROVED") return 3;
  return 0;
}

export default function GymVerificationPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [gymName, setGymName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [legalRep, setLegalRep] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [documents, setDocuments] = useState<GymDocumentDto[]>(
    DOC_TYPES.map(d => ({ documentType: d.type, fileUrl: "" }))
  );

  const { data: status } = useQuery({
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

  const submitMut = useMutation({
    mutationFn: (payload: SubmitGymRegistrationRequest) => {
      const isRejected = status?.verificationStatus === "REJECTED";
      return isRejected
        ? gymService.resubmitRegistration(payload)
        : gymService.submitRegistration(payload);
    },
    onSuccess: () => {
      toast({ type: "success", title: "Đã gửi hồ sơ xác minh thành công" });
      qc.invalidateQueries({ queryKey: ["gym-verification-status"] });
    },
    onError: (e) => toast({ type: "error", title: "Gửi thất bại", description: toErrorMessage(e) }),
  });

  function updateDoc(index: number, value: string) {
    setDocuments(prev => prev.map((d, i) => i === index ? { ...d, fileUrl: value } : d));
  }

  function handleSubmit() {
    if (!gymName.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập tên phòng tập" }); return;
    }
    const validDocs = documents.filter(d => d.fileUrl.trim());
    if (validDocs.length === 0) {
      toast({ type: "warning", title: "Vui lòng cung cấp ít nhất 1 tài liệu" }); return;
    }
    submitMut.mutate({
      gymName: gymName.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      documents: validDocs,
    });
  }

  const verificationStatus = status?.verificationStatus;
  const stepIdx = statusStepIndex(verificationStatus);
  const isPending = verificationStatus === "PENDING";
  const isApproved = verificationStatus === "APPROVED";
  const isRejected = verificationStatus === "REJECTED";
  const displayName = user?.fullName ?? user?.username ?? "Gym";
  const initial = displayName[0]?.toUpperCase() ?? "G";

  const docFilled = documents.filter(d => d.fileUrl.trim()).length;
  const profilePct = gymName ? 100 : 0;
  const docPct = Math.round((docFilled / documents.length) * 100);
  const branchPct = 0;

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none w-56 placeholder:text-gray-400" placeholder="Tìm kiếm tài liệu, chi nhánh..." />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell className="size-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initial}
              </div>
              <span className="text-sm font-semibold text-gray-700">{displayName}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">Xác minh doanh nghiệp</h1>
              <p className="text-sm text-gray-500 mt-1">Vui lòng cung cấp đầy đủ thông tin để kích hoạt tài khoản đối tác chính thức.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitMut.isPending || isPending || isApproved}
                className="h-9 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                Lưu bản nháp
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

          {/* Progress stepper */}
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 mb-6 shadow-sm">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < stepIdx;
                const current = i === stepIdx || (stepIdx === 0 && i === 0);
                return (
                  <div key={step.label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`size-9 rounded-full flex items-center justify-center border-2 ${
                        done ? "bg-[#2563eb] border-[#2563eb]"
                          : current ? "bg-white border-[#2563eb]"
                          : "bg-white border-gray-200"
                      }`}>
                        {done ? (
                          <CheckCircle2 className="size-5 text-white" />
                        ) : current ? (
                          <div className="size-3 rounded-full bg-[#2563eb]" />
                        ) : (
                          <Circle className="size-4 text-gray-300" />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold text-center max-w-[100px] leading-tight ${
                        done || current ? "text-[#2563eb]" : "text-gray-400"
                      }`}>{step.label}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full ${done ? "bg-[#2563eb]" : "bg-gray-200"}`} />
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
                </div>
              </div>
            )}
            {isPending && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Clock className="size-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Hồ sơ đang được xét duyệt. Thời gian phê duyệt từ 24 - 48 giờ làm việc.</p>
              </div>
            )}
            {isApproved && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Doanh nghiệp đã được xác minh. Tài khoản đối tác chính thức đã kích hoạt.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Left: Form sections */}
            <div className="col-span-2 space-y-5">
              {/* Section 1: Business info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
                  <div className="size-6 rounded bg-blue-100 flex items-center justify-center">
                    <Building2 className="size-3.5 text-blue-600" />
                  </div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Thông tin doanh nghiệp</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Tên phòng tập (Thương hiệu) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={gymName}
                      onChange={e => setGymName(e.target.value)}
                      placeholder="FitMatch Premium Gym"
                      disabled={isPending || isApproved}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mã số doanh nghiệp</label>
                      <Input
                        value={businessCode}
                        onChange={e => setBusinessCode(e.target.value)}
                        placeholder="Vd: 0101234567"
                        disabled={isPending || isApproved}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mã số thuế</label>
                      <Input
                        value={taxCode}
                        onChange={e => setTaxCode(e.target.value)}
                        placeholder="Nhập mã số thuế"
                        disabled={isPending || isApproved}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Người đại diện pháp luật</label>
                    <Input
                      value={legalRep}
                      onChange={e => setLegalRep(e.target.value)}
                      placeholder="Họ và tên người đại diện"
                      disabled={isPending || isApproved}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Địa chỉ</label>
                      <Input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Số nhà, tên đường..."
                        disabled={isPending || isApproved}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thành phố</label>
                      <Input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="TP. Hồ Chí Minh"
                        disabled={isPending || isApproved}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Legal documents */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
                  <div className="size-6 rounded bg-purple-100 flex items-center justify-center">
                    <ShieldCheck className="size-3.5 text-purple-600" />
                  </div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Tài liệu pháp lý</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {/* Main upload: Business license */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Giấy phép kinh doanh (Bản gốc/Công chứng) <span className="text-red-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-xl p-6 ${
                      documents[0]?.fileUrl ? "border-[#2563eb]/40 bg-blue-50" : "border-gray-200 bg-gray-50"
                    }`}>
                      <div className="flex flex-col items-center gap-2 mb-3">
                        <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <ShieldCheck className="size-5 text-gray-400" />
                        </div>
                        <p className="text-[10px] text-gray-400">PDF, JPG, PNG (Tối đa 10MB)</p>
                      </div>
                      <FileUpload
                        value={documents[0]?.fileUrl ?? ""}
                        onChange={url => updateDoc(0, url)}
                        folder="documents"
                        label="Tải giấy phép lên"
                        disabled={isPending || isApproved}
                      />
                    </div>
                  </div>

                  {/* Tax cert + Supplement */}
                  <div className="grid grid-cols-2 gap-4">
                    {documents.slice(1).map((doc, i) => {
                      const info = DOC_TYPES[i + 1];
                      return (
                        <div key={i} className={`border border-dashed border-gray-200 rounded-xl p-4 ${doc.fileUrl ? "border-[#2563eb]/40 bg-blue-50" : "bg-gray-50"}`}>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            {info?.label ?? "Tài liệu"}
                          </p>
                          <FileUpload
                            value={doc.fileUrl}
                            onChange={url => updateDoc(i + 1, url)}
                            folder="documents"
                            label="Tải lên"
                            disabled={isPending || isApproved}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Branches */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded bg-green-100 flex items-center justify-center">
                      <GitBranch className="size-3.5 text-green-600" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#0f172a]">Xác thực chi nhánh</h2>
                  </div>
                  <Link href="/gym/gyms"
                    className="flex items-center gap-1 text-xs text-[#2563eb] font-semibold hover:underline">
                    <Plus className="size-3" /> Thêm chi nhánh
                  </Link>
                </div>
                <div className="px-6 py-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 text-left">Tên chi nhánh</th>
                        <th className="pb-3 text-left">Địa chỉ</th>
                        <th className="pb-3 text-left">Trạng thái</th>
                        <th className="pb-3 text-left">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "FitMatch Quận 1", address: "123 Lê Lợi, P. Bến Thành, Q.1, TP. HCM", ok: true },
                        { name: "FitMatch Thảo Điền", address: "45 Xuân Thủy, P. Thảo Điền, Q.2, TP. HCM", ok: false },
                      ].map(({ name, address: addr, ok }) => (
                        <tr key={name} className="border-t border-gray-50">
                          <td className="py-3 text-[13px] font-semibold text-[#0f172a]">{name}</td>
                          <td className="py-3 text-[12px] text-gray-500">{addr}</td>
                          <td className="py-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              ok ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"
                            }`}>
                              {ok ? "Đã xác minh" : "Đang chờ duyệt"}
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="p-1.5 text-gray-400 hover:text-[#2563eb] transition-colors">
                              <Pencil className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Info panel */}
            <div className="space-y-4">
              {/* Important notes */}
              <div className="bg-[#2563eb] rounded-2xl p-5 text-white">
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

              {/* Profile status */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-[13px] font-bold text-[#0f172a] mb-4">Trạng thái hồ sơ</h3>
                <div className="space-y-3">
                  {[
                    { label: "Thông tin cơ bản", pct: profilePct, color: "bg-green-500" },
                    { label: "Tài liệu pháp lý", pct: docPct, color: "bg-orange-400" },
                    { label: "Xác thực chi nhánh", pct: branchPct, color: "bg-gray-200", empty: true },
                  ].map(({ label, pct, color, empty }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-gray-600 font-medium">{label}</span>
                        <span className={`text-[10px] font-bold ${empty ? "text-gray-400" : pct === 100 ? "text-emerald-600" : "text-orange-500"}`}>
                          {empty ? "Chưa bắt đầu" : pct === 100 ? "Hoàn tất" : `${pct}% tải liệu`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map / location */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-50">
                  <h3 className="text-[13px] font-bold text-[#0f172a] flex items-center gap-2">
                    <MapPin className="size-3.5 text-[#2563eb]" /> Vị trí trụ sở chính
                  </h3>
                </div>
                <div className="h-28 bg-gradient-to-br from-blue-100 via-green-100 to-emerald-100 flex items-end p-3">
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-full shadow-sm">
                    <MapPin className="size-3 text-red-500" />
                    <span className="text-[10px] font-semibold text-gray-700">
                      {address || "123 Lê Lợi, Quận 1"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}
