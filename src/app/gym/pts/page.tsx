"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Users, Loader2, Award, FileText, Trash2, X, CalendarClock
} from "lucide-react";
import { PtOpsDialog } from "@/modules/gym/components/pt-ops-dialog";
import { gymService } from "@/services/gym.service";
import type {
  GymPtResponse, GymPtStatus, CreateGymPtInput, UpdateGymPtInput,
  PtCertResponse, PtCertInput, PtDocResponse
} from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";
import { DatePicker } from "@/shared/components/ui/date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/shared/components/ui/select";
import { FileUpload } from "@/shared/components/common/file-upload";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";

const STATUS: Record<GymPtStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "Đang hoạt động", cls: "bg-emerald-100 text-emerald-700" },
  INACTIVE: { label: "Tạm ẩn", cls: "bg-muted text-muted-foreground" },
  SUSPENDED: { label: "Đình chỉ", cls: "bg-red-100 text-red-600" }
};

// ─────────────────────────────────────────────
// Certifications & documents dialog
// ─────────────────────────────────────────────
function PtCredentialsDialog({ pt, onClose }: { pt: GymPtResponse; onClose: () => void }) {
  const ptId = pt.id!;
  const { toast } = useToast();
  const qc = useQueryClient();

  const [editingCert, setEditingCert] = useState<PtCertResponse | null>(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [cName, setCName] = useState("");
  const [cOrg, setCOrg] = useState("");
  const [cIssue, setCIssue] = useState("");
  const [cExpiry, setCExpiry] = useState("");
  const [cUrl, setCUrl] = useState("");

  const [docType, setDocType] = useState("");
  const [docUrl, setDocUrl] = useState("");

  const { data: certs = [] } = useQuery({
    queryKey: ["gym-pt-certs", ptId],
    queryFn: () => gymService.listPtCerts(ptId)
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["gym-pt-docs", ptId],
    queryFn: () => gymService.listPtDocs(ptId)
  });

  function resetCert() {
    setShowCertForm(false); setEditingCert(null);
    setCName(""); setCOrg(""); setCIssue(""); setCExpiry(""); setCUrl("");
  }
  function editCert(c: PtCertResponse) {
    setEditingCert(c); setShowCertForm(true);
    setCName(c.name ?? ""); setCOrg(c.issuingOrganization ?? "");
    setCIssue(c.issueDate ?? ""); setCExpiry(c.expiryDate ?? ""); setCUrl(c.credentialUrl ?? "");
  }

  const saveCert = useMutation({
    mutationFn: (payload: PtCertInput) =>
      editingCert?.id != null
        ? gymService.updatePtCert(ptId, editingCert.id, payload)
        : gymService.addPtCert(ptId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pt-certs", ptId] });
      resetCert();
      toast({ type: "success", title: "Đã lưu chứng chỉ" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) })
  });
  const delCert = useMutation({
    mutationFn: (certId: number) => gymService.deletePtCert(ptId, certId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-pt-certs", ptId] }); toast({ type: "success", title: "Đã xóa chứng chỉ" }); },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) })
  });
  const addDoc = useMutation({
    mutationFn: () => gymService.addPtDoc(ptId, { documentType: docType.trim(), fileUrl: docUrl.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pt-docs", ptId] });
      setDocType(""); setDocUrl("");
      toast({ type: "success", title: "Đã thêm tài liệu" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) })
  });
  const delDoc = useMutation({
    mutationFn: (docId: number) => gymService.deletePtDoc(ptId, docId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-pt-docs", ptId] }); toast({ type: "success", title: "Đã xóa tài liệu" }); },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) })
  });

  function submitCert() {
    if (!cName.trim()) { toast({ type: "warning", title: "Nhập tên chứng chỉ" }); return; }
    saveCert.mutate({
      name: cName.trim(),
      issuingOrganization: cOrg.trim() || undefined,
      issueDate: cIssue || undefined,
      expiryDate: cExpiry || undefined,
      credentialUrl: cUrl.trim() || undefined
    });
  }
  function submitDoc() {
    if (!docType.trim() || !docUrl.trim()) { toast({ type: "warning", title: "Nhập loại tài liệu và tải tệp lên" }); return; }
    addDoc.mutate();
  }

  return (
    <Dialog open title={`Chứng chỉ & tài liệu · ${pt.displayName ?? pt.username}`} onClose={onClose}>
      <div className="space-y-6">
        {/* Certifications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Award className="size-4 text-primary" /> Chứng chỉ</h3>
            {!showCertForm && (
              <button onClick={() => { resetCert(); setShowCertForm(true); }} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                <Plus className="size-3" /> Thêm
              </button>
            )}
          </div>
          {(certs as PtCertResponse[]).length === 0 && !showCertForm ? (
            <p className="text-xs text-muted-foreground py-1">Chưa có chứng chỉ.</p>
          ) : (
            <div className="space-y-2">
              {(certs as PtCertResponse[]).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                    {(c.issuingOrganization || c.issueDate) && (
                      <p className="text-[10px] text-muted-foreground truncate">{c.issuingOrganization}{c.issueDate ? ` · ${c.issueDate}` : ""}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => editCert(c)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /></button>
                    <button onClick={() => c.id && delCert.mutate(c.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showCertForm && (
            <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-blue-100 space-y-2.5">
              <Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Tên chứng chỉ *" className="h-9" />
              <Input value={cOrg} onChange={e => setCOrg(e.target.value)} placeholder="Tổ chức cấp" className="h-9" />
              <div className="grid grid-cols-2 gap-2">
                <DatePicker value={cIssue} onChange={setCIssue} placeholder="Ngày cấp" className="h-9" />
                <DatePicker value={cExpiry} onChange={setCExpiry} placeholder="Ngày hết hạn" className="h-9" />
              </div>
              <FileUpload value={cUrl} onChange={setCUrl} folder="certifications" label="Tải chứng chỉ lên" />
              <div className="flex gap-2">
                <Button onClick={submitCert} disabled={saveCert.isPending} className="h-8 px-4 bg-primary hover:bg-primary/90 text-white text-xs gap-1.5">
                  {saveCert.isPending && <Loader2 className="size-3.5 animate-spin" />} Lưu
                </Button>
                <Button onClick={resetCert} className="h-8 px-4 bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none text-xs">Hủy</Button>
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-2"><FileText className="size-4 text-primary" /> Tài liệu năng lực</h3>
          {(docs as PtDocResponse[]).length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">Chưa có tài liệu.</p>
          ) : (
            <div className="space-y-2 mb-2">
              {(docs as PtDocResponse[]).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border">
                  <p className="text-xs text-foreground truncate">{doc.documentType}</p>
                  <button onClick={() => doc.id && delDoc.mutate(doc.id)} className="p-1 text-muted-foreground hover:text-red-500 shrink-0"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2.5">
            <Input value={docType} onChange={e => setDocType(e.target.value)} placeholder="Loại tài liệu (vd: Bằng cấp, CCCD)" className="h-9" />
            <FileUpload value={docUrl} onChange={setDocUrl} folder="documents" label="Tải tài liệu lên" />
            <Button onClick={submitDoc} disabled={addDoc.isPending} className="h-8 px-4 bg-primary hover:bg-primary/90 text-white text-xs gap-1.5">
              {addDoc.isPending && <Loader2 className="size-3.5 animate-spin" />} Thêm tài liệu
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="h-9 px-5 bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none gap-1.5">
            <X className="size-4" /> Đóng
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function GymPtsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymPtResponse | null>(null);
  const [credentialsPt, setCredentialsPt] = useState<GymPtResponse | null>(null);
  const [opsPt, setOpsPt] = useState<GymPtResponse | null>(null);

  // form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["gym-pts"],
    queryFn: () => gymService.listPts({ page: 0, size: 100 })
  });
  const pts = data?.content ?? [];

  const saveMut = useMutation({
    mutationFn: () => {
      if (editing?.id != null) {
        const payload: UpdateGymPtInput = {
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
          specialization: specialization.trim() || undefined,
          serviceArea: serviceArea.trim() || undefined,
          experienceYears: experienceYears ? Number(experienceYears) : undefined
        };
        return gymService.updatePt(editing.id, payload);
      }
      const payload: CreateGymPtInput = {
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        specialization: specialization.trim() || undefined,
        serviceArea: serviceArea.trim() || undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined
      };
      return gymService.createPt(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pts"] });
      closeForm();
      toast({ type: "success", title: editing ? "Đã cập nhật PT" : "Đã tạo PT" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) })
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: GymPtStatus }) =>
      gymService.updatePtStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pts"] });
      toast({ type: "success", title: "Đã cập nhật trạng thái" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null);
    setUsername(""); setEmail(""); setPassword(""); setPhone("");
    setDisplayName(""); setBio(""); setSpecialization(""); setServiceArea(""); setExperienceYears("");
    setFormOpen(true);
  }
  function openEdit(pt: GymPtResponse) {
    setEditing(pt);
    setDisplayName(pt.displayName ?? ""); setBio(pt.bio ?? "");
    setSpecialization(pt.specialization ?? ""); setServiceArea(pt.serviceArea ?? "");
    setExperienceYears(pt.experienceYears != null ? String(pt.experienceYears) : "");
    setFormOpen(true);
  }
  function closeForm() { setFormOpen(false); setEditing(null); }
  function save() {
    if (!editing) {
      if (!username.trim() || !email.trim() || !password) {
        toast({ type: "warning", title: "Nhập tài khoản, email và mật khẩu" }); return;
      }
    }
    if (!displayName.trim()) { toast({ type: "warning", title: "Nhập tên hiển thị" }); return; }
    saveMut.mutate();
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Huấn luyện viên</h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý đội ngũ PT của phòng gym: hồ sơ, chứng chỉ và tài liệu năng lực.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="size-4" /> Thêm PT
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : pts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="size-10 mb-3" />
              <p className="text-sm">Chưa có huấn luyện viên nào. Bấm &quot;Thêm PT&quot; để tạo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="pb-3 text-left">Huấn luyện viên</th>
                  <th className="pb-3 text-left">Chuyên môn</th>
                  <th className="pb-3 text-left">Kinh nghiệm</th>
                  <th className="pb-3 text-left">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pts.map((pt) => (
                  <tr key={pt.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(pt.displayName ?? pt.username ?? "P")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{pt.displayName ?? pt.username}</p>
                          <p className="text-[10px] text-muted-foreground">@{pt.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{pt.specialization ?? "—"}</td>
                    <td className="py-3 text-xs text-muted-foreground">{pt.experienceYears != null ? `${pt.experienceYears} năm` : "—"}</td>
                    <td className="py-3">
                      {/* B-33: SUSPENDED chỉ do Admin đặt (BE luôn 409 nếu gym gửi) —
                          khi bị đình chỉ hiện badge + lý do, không cho gym đổi. */}
                      {pt.status === "SUSPENDED" ? (
                        <div>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS.SUSPENDED.cls}`}>
                            Đình chỉ bởi quản trị viên
                          </span>
                          {pt.suspensionReason && (
                            <p className="mt-1 max-w-[220px] text-[10px] text-red-600">{pt.suspensionReason}</p>
                          )}
                        </div>
                      ) : (
                        <Select value={pt.status ?? "ACTIVE"} onValueChange={(v) => pt.id && statusMut.mutate({ id: pt.id, status: v as GymPtStatus })}>
                          <SelectTrigger size="sm" className={`w-[150px] h-8 text-[11px] font-semibold ${STATUS[pt.status ?? "ACTIVE"].cls}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                            <SelectItem value="INACTIVE">Tạm ẩn</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(pt)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          <Pencil className="size-3.5" /> Sửa
                        </button>
                        <button onClick={() => setCredentialsPt(pt)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary">
                          <Award className="size-3.5" /> Chứng chỉ & tài liệu
                        </button>
                        <button onClick={() => setOpsPt(pt)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary">
                          <CalendarClock className="size-3.5" /> Vận hành
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} title={editing ? "Chỉnh sửa huấn luyện viên" : "Thêm huấn luyện viên"} onClose={closeForm}>
        <div className="space-y-4">
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tài khoản <span className="text-red-500">*</span></label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="pt_username" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email <span className="text-red-500">*</span></label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="pt@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Số điện thoại</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên hiển thị <span className="text-red-500">*</span></label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nguyễn Văn An" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chuyên môn</label>
              <Input value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Gym & Fitness" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Số năm kinh nghiệm</label>
              <Input value={experienceYears} onChange={e => setExperienceYears(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="3" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Khu vực phục vụ</label>
            <Input value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="TP. Hồ Chí Minh" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Giới thiệu</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Kinh nghiệm, phương pháp huấn luyện..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </div>
        </div>
      </Dialog>

      {credentialsPt && (
        <PtCredentialsDialog pt={credentialsPt} onClose={() => setCredentialsPt(null)} />
      )}
      {opsPt && <PtOpsDialog pt={opsPt} onClose={() => setOpsPt(null)} />}
    </main>
  );
}
