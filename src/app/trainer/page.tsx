"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, Pencil, Award, ShieldCheck, Clock, AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { trainerService } from "@/services/trainer.service";
import type { CertificationResponse, UpdatePtProfileRequest } from "@/types/Trainer";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";
import { WorkspaceUserMenu } from "@/shared/components/common/workspace-user-menu";

const STATUS: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  APPROVED: { label: "Đã xác minh", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  PENDING: { label: "Đang chờ duyệt", cls: "bg-amber-100 text-amber-700", icon: Clock },
  REQUIRES_INFO: { label: "Cần bổ sung", cls: "bg-amber-100 text-amber-700", icon: AlertCircle },
  REJECTED: { label: "Bị từ chối", cls: "bg-red-100 text-red-600", icon: AlertCircle },
  SUSPENDED: { label: "Đình chỉ", cls: "bg-red-100 text-red-600", icon: AlertCircle },
  NOT_SUBMITTED: { label: "Chưa xác minh", cls: "bg-gray-100 text-gray-500", icon: AlertCircle },
};

export default function TrainerSelfServicePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["pt-my-profile"],
    queryFn: trainerService.getMyProfilePreview,
  });
  const { data: certs = [] } = useQuery({
    queryKey: ["pt-my-certs"],
    queryFn: trainerService.listCertifications,
  });

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setSpecialization(profile.specialization ?? "");
    setServiceArea(profile.serviceArea ?? "");
    setExperienceYears(profile.experienceYears != null ? String(profile.experienceYears) : "");
  }, [profile]);

  const save = useMutation({
    mutationFn: (payload: UpdatePtProfileRequest) => trainerService.updateMyLimitedProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pt-my-profile"] });
      setOpen(false);
      toast({ type: "success", title: "Đã cập nhật hồ sơ" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  function submit() {
    if (!displayName.trim()) { toast({ type: "warning", title: "Nhập tên hiển thị" }); return; }
    save.mutate({
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      specialization: specialization.trim() || undefined,
      serviceArea: serviceArea.trim() || undefined,
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
    });
  }

  const st = STATUS[profile?.verificationStatus ?? "NOT_SUBMITTED"] ?? STATUS.NOT_SUBMITTED;
  const StIcon = st.icon;

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none w-56 placeholder:text-gray-400" placeholder="Tìm kiếm..." />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Bell className="size-4" /></button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <WorkspaceUserMenu />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Hồ sơ của tôi</h1>
            <p className="text-sm text-gray-500 mt-1">Xem và cập nhật thông tin cá nhân. Chứng chỉ do phòng gym quản lý.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                      {(profile?.displayName ?? "T")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0f172a]">{profile?.displayName ?? "—"}</h2>
                      {profile?.specialization && <p className="text-sm text-gray-500 mt-0.5">{profile.specialization}</p>}
                      <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}>
                        <StIcon className="size-3" /> {st.label}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => setOpen(true)} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                    <Pencil className="size-4" /> Chỉnh sửa
                  </Button>
                </div>
                {profile?.rejectionReason && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{profile.rejectionReason}</div>
                )}
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs font-semibold text-gray-400 uppercase">Kinh nghiệm</p><p className="mt-0.5 text-gray-700">{profile?.experienceYears != null ? `${profile.experienceYears} năm` : "—"}</p></div>
                  <div><p className="text-xs font-semibold text-gray-400 uppercase">Khu vực</p><p className="mt-0.5 flex items-center gap-1 text-gray-700">{profile?.serviceArea ? <><MapPin className="size-3.5 text-gray-400" />{profile.serviceArea}</> : "—"}</p></div>
                </div>
                {profile?.bio && (
                  <div className="mt-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Giới thiệu</p><p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p></div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#0f172a] mb-3"><Award className="size-4 text-blue-600" /> Chứng chỉ</h2>
              {(certs as CertificationResponse[]).length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Chưa có chứng chỉ. Liên hệ phòng gym để bổ sung.</p>
              ) : (
                <div className="space-y-2">
                  {(certs as CertificationResponse[]).map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <ShieldCheck className="size-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0f172a] truncate">{c.name}</p>
                        {c.issuingOrganization && <p className="text-[10px] text-gray-400 truncate">{c.issuingOrganization}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} title="Chỉnh sửa hồ sơ" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên hiển thị <span className="text-red-500">*</span></label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Chuyên môn</label>
              <Input value={specialization} onChange={e => setSpecialization(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số năm kinh nghiệm</label>
              <Input value={experienceYears} onChange={e => setExperienceYears(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Khu vực phục vụ</label>
            <Input value={serviceArea} onChange={e => setServiceArea(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giới thiệu</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">Hủy</Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">{save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
