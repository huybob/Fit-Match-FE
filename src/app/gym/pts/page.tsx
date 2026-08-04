"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Loader2, Award, FileText, Trash2, X, CalendarClock
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
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";
import { DataTable } from "@/shared/components/common/data-table";
import { UserAvatar } from "@/shared/components/common/user-avatar";

/* Chỉ giữ class; nhãn lấy từ gym.ptStatus.* trong component. */
const STATUS_CLS: Record<GymPtStatus, string> = {
  ACTIVE: "bg-success-muted text-success",
  INACTIVE: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

// ─────────────────────────────────────────────
// Certifications & documents dialog
// ─────────────────────────────────────────────
function PtCredentialsDialog({ pt, onClose }: { pt: GymPtResponse; onClose: () => void }) {
  const t = useTranslations();
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
      toast({ type: "success", title: t("gym.trainers.certSaved") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });
  const delCert = useMutation({
    mutationFn: (certId: number) => gymService.deletePtCert(ptId, certId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-pt-certs", ptId] }); toast({ type: "success", title: t("gym.trainers.certDeleted") }); },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });
  const addDoc = useMutation({
    mutationFn: () => gymService.addPtDoc(ptId, { documentType: docType.trim(), fileUrl: docUrl.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pt-docs", ptId] });
      setDocType(""); setDocUrl("");
      toast({ type: "success", title: t("gym.trainers.docAdded") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });
  const delDoc = useMutation({
    mutationFn: (docId: number) => gymService.deletePtDoc(ptId, docId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-pt-docs", ptId] }); toast({ type: "success", title: t("gym.trainers.docDeleted") }); },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });

  function submitCert() {
    if (!cName.trim()) { toast({ type: "warning", title: t("gym.trainers.certNameRequired") }); return; }
    saveCert.mutate({
      name: cName.trim(),
      issuingOrganization: cOrg.trim() || undefined,
      issueDate: cIssue || undefined,
      expiryDate: cExpiry || undefined,
      credentialUrl: cUrl.trim() || undefined
    });
  }
  function submitDoc() {
    if (!docType.trim() || !docUrl.trim()) { toast({ type: "warning", title: t("gym.trainers.docRequired") }); return; }
    addDoc.mutate();
  }

  return (
    <Dialog open title={t("gym.trainers.certsDialogTitle", { name: pt.displayName ?? pt.username ?? "" })} onClose={onClose}>
      <div className="space-y-6">
        {/* Certifications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Award className="size-4 text-primary" /> {t("gym.trainers.certsTitle")}</h3>
            {!showCertForm && (
              <Button variant="link" size="inline" onClick={() => { resetCert(); setShowCertForm(true); }} className="flex gap-1 text-primary">
                <Plus className="size-3" />{t("common.actions.add")}</Button>
            )}
          </div>
          {(certs as PtCertResponse[]).length === 0 && !showCertForm ? (
            <p className="text-xs text-muted-foreground py-1">{t("gym.trainers.noCerts")}</p>
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
                    <IconButton tooltip={t("gym.trainers.editCert")} onClick={() => editCert(c)} className="size-8 text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /></IconButton>
                    <IconButton tooltip={t("gym.trainers.deleteCert")} onClick={() => c.id && delCert.mutate(c.id)} className="size-8 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showCertForm && (
            <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2.5">
              <Input value={cName} onChange={e => setCName(e.target.value)} placeholder={t("gym.trainers.certNameLabel")} className="h-9" />
              <Input value={cOrg} onChange={e => setCOrg(e.target.value)} placeholder={t("gym.trainers.certOrgLabel")} className="h-9" />
              <div className="grid grid-cols-2 gap-2">
                <DatePicker value={cIssue} onChange={(v) => setCIssue(v ?? "")} placeholder={t("gym.trainers.issueDate")} className="h-9" />
                <DatePicker value={cExpiry} onChange={(v) => setCExpiry(v ?? "")} placeholder={t("gym.trainers.expiryDate")} className="h-9" />
              </div>
              <FileUpload value={cUrl} onChange={setCUrl} folder="certifications" label={t("gym.trainers.uploadCert")} />
              <div className="flex gap-2">
                <Button onClick={submitCert} disabled={saveCert.isPending} className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5">
                  {saveCert.isPending && <Loader2 className="size-3.5 animate-spin" />} {t("common.actions.save")}
                </Button>
                <Button onClick={resetCert} className="h-8 px-4 bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none text-xs">{t("common.actions.cancel")}</Button>
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-2"><FileText className="size-4 text-primary" /> {t("gym.trainers.docsTitle")}</h3>
          {(docs as PtDocResponse[]).length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">{t("gym.trainers.noDocs")}</p>
          ) : (
            <div className="space-y-2 mb-2">
              {(docs as PtDocResponse[]).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border">
                  <p className="text-xs text-foreground truncate">{doc.documentType}</p>
                  <IconButton tooltip={t("gym.trainers.deleteDoc")} onClick={() => doc.id && delDoc.mutate(doc.id)} className="size-8 shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></IconButton>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2.5">
            <Input value={docType} onChange={e => setDocType(e.target.value)} placeholder={t("gym.trainers.docTypePlaceholder")} className="h-9" />
            <FileUpload value={docUrl} onChange={setDocUrl} folder="documents" label={t("gym.trainers.uploadDoc")} />
            <Button onClick={submitDoc} disabled={addDoc.isPending} className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5">
              {addDoc.isPending && <Loader2 className="size-3.5 animate-spin" />} {t("gym.trainers.addDoc")}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="h-9 px-5 bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none gap-1.5">
            <X className="size-4" />{t("common.actions.close")}</Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function GymPtsPage() {
  const t = useTranslations();
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
  // Bug 15: chứng chỉ nhập ngay khi tạo PT (BE yêu cầu PT tồn tại trước nên
  // gom danh sách ở client, tạo PT xong mới lần lượt gọi addPtCert).
  const [newCerts, setNewCerts] = useState<PtCertInput[]>([]);
  const [ncName, setNcName] = useState("");
  const [ncOrg, setNcOrg] = useState("");
  const [ncIssue, setNcIssue] = useState("");
  const [ncExpiry, setNcExpiry] = useState("");
  const [ncUrl, setNcUrl] = useState("");

  function resetNewCertDraft() {
    setNcName(""); setNcOrg(""); setNcIssue(""); setNcExpiry(""); setNcUrl("");
  }
  function addNewCert() {
    if (!ncName.trim()) { toast({ type: "warning", title: t("gym.trainers.certNameRequired") }); return; }
    setNewCerts((prev) => [...prev, {
      name: ncName.trim(),
      issuingOrganization: ncOrg.trim() || undefined,
      issueDate: ncIssue || undefined,
      expiryDate: ncExpiry || undefined,
      credentialUrl: ncUrl.trim() || undefined,
    }]);
    resetNewCertDraft();
  }

  const ptsQuery = useQuery({
    queryKey: ["gym-pts"],
    queryFn: () => gymService.listPts({ page: 0, size: 100 })
  });
  const pts = ptsQuery.data?.content ?? [];

  const saveMut = useMutation({
    mutationFn: async () => {
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
      const created = await gymService.createPt(payload);
      // Bug 15: BE cần PT tồn tại trước (FK) — tạo xong mới thêm từng chứng chỉ.
      if (created?.id != null) {
        for (const cert of newCerts) {
          try {
            await gymService.addPtCert(created.id, cert);
          } catch (e) {
            toast({
              type: "warning",
              title: t("gym.trainers.certAddFailed", { name: cert.name ?? "" }),
              description: toErrorMessage(e),
            });
          }
        }
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pts"] });
      closeForm();
      toast({ type: "success", title: editing ? t("gym.trainers.updated") : t("gym.trainers.created") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: GymPtStatus }) =>
      gymService.updatePtStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pts"] });
      toast({ type: "success", title: t("gym.trainers.statusUpdated") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null);
    setUsername(""); setEmail(""); setPassword(""); setPhone("");
    setDisplayName(""); setBio(""); setSpecialization(""); setServiceArea(""); setExperienceYears("");
    setNewCerts([]); resetNewCertDraft();
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
        toast({ type: "warning", title: t("gym.trainers.credentialsRequired") }); return;
      }
      // Khớp rule @StrongPassword phía BE: 8-100 ký tự, có ít nhất 1 chữ và 1 số
      if (password.length < 8 || password.length > 100 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        toast({ type: "warning", title: t("gym.trainers.passwordRule") }); return;
      }
    }
    if (!displayName.trim()) { toast({ type: "warning", title: t("gym.trainers.displayNameRequired") }); return; }
    saveMut.mutate();
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.trainers.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.trainers.subtitle")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" /> {t("gym.trainers.add")}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          {/* DataTable đã có sẵn loading / lỗi / rỗng. Hai nhánh viết tay trước đây
              nuốt mất nhánh LỖI: API hỏng cũng ra "chưa có huấn luyện viên nào". */}
            <DataTable
              minWidth="35rem"
              rows={pts}
              rowKey={(pt) => String(pt.id)}
              loading={ptsQuery.isLoading}
              error={ptsQuery.isError}
              errorDescription={ptsQuery.error ? toErrorMessage(ptsQuery.error) : undefined}
              onRetry={() => ptsQuery.refetch()}
              emptyTitle={t("gym.trainers.empty")}
              columns={[
                {
                  key: "trainer",
                  header: t("gym.trainers.title"),
                  cell: (pt) => (
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        className="size-8"
                        name={pt.displayName ?? pt.username}
                        tintSeed={pt.id}
                        fallbackClassName="text-xs font-bold"
                      />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">
                          {pt.displayName ?? pt.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground">@{pt.username}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "specialization",
                  header: t("gym.trainers.specialization"),
                  hideBelow: "md",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (pt) => pt.specialization ?? "—",
                },
                {
                  key: "experience",
                  header: t("gym.trainers.experience"),
                  hideBelow: "lg",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (pt) =>
                    pt.experienceYears != null
                      ? t("gym.trainers.years", { years: pt.experienceYears })
                      : "—",
                },
                {
                  key: "status",
                  header: t("common.table.status"),
                  // B-33: SUSPENDED chỉ do Admin đặt (BE luôn 409 nếu gym gửi) —
                  // khi bị đình chỉ hiện badge + lý do, không cho gym đổi.
                  cell: (pt) =>
                    pt.status === "SUSPENDED" ? (
                      <div>
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLS.SUSPENDED}`}
                        >
                          {t("gym.trainers.suspendedByAdmin")}
                        </span>
                        {pt.suspensionReason && (
                          <p className="mt-1 max-w-[220px] text-[10px] text-destructive">
                            {pt.suspensionReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={pt.status ?? "ACTIVE"}
                        onValueChange={(v) =>
                          pt.id && statusMut.mutate({ id: pt.id, status: v as GymPtStatus })
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className={`h-8 w-[150px] text-[11px] font-semibold ${STATUS_CLS[pt.status ?? "ACTIVE"]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">{t("gym.ptStatus.ACTIVE")}</SelectItem>
                          <SelectItem value="INACTIVE">{t("gym.ptStatus.INACTIVE")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ),
                },
                {
                  key: "actions",
                  header: t("common.table.actions"),
                  align: "right",
                  cell: (pt) => (
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="link" size="inline"
 onClick={() => openEdit(pt)}
 className="flex gap-1 text-primary"
>
                        <Pencil className="size-3.5" />
                        {t("common.actions.edit")}
                      </Button>
                      <button
                        onClick={() => setCredentialsPt(pt)}
                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
                      >
                        <Award className="size-3.5" /> {t("gym.trainers.certsAndDocs")}
                      </button>
                      <button
                        onClick={() => setOpsPt(pt)}
                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
                      >
                        <CalendarClock className="size-3.5" /> {t("gym.trainers.operations")}
                      </button>
                    </div>
                  ),
                },
              ]}
            />
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} title={editing ? t("gym.trainers.editTitle") : t("gym.trainers.addTitle")} onClose={closeForm}>
        <div className="space-y-4">
          {!editing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.accountLabel")} <span className="text-destructive">*</span></label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="pt_username" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("auth.email")} <span className="text-destructive">*</span></label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="pt@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.passwordLabel")} <span className="text-destructive">*</span></label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.phone")}</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.displayNameLabel")} <span className="text-destructive">*</span></label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t("gym.trainers.displayNamePlaceholder")} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.specialization")}</label>
              <Input value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Gym & Fitness" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.experienceYearsLabel")}</label>
              <Input value={experienceYears} onChange={e => setExperienceYears(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="3" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.serviceAreaLabel")}</label>
            <Input value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder={t("gym.branches.cityPlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.trainers.bioLabel")}</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={t("gym.trainers.bioPlaceholder")} />
          </div>

          {/* Bug 15: thêm chứng chỉ ngay khi tạo PT — trước đây phải tạo xong
              mới vào t("gym.trainers.certsAndDocs"), card PT hiển thị t("gym.trainers.certCount", { count: 0 }). */}
          {!editing && (
            <div className="rounded-lg border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
                <Award className="size-3.5 text-primary" /> {t("gym.trainers.certsOptional")}
              </p>
              {newCerts.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {newCerts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                        {(c.issuingOrganization || c.issueDate) && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.issuingOrganization}{c.issueDate ? ` · ${c.issueDate}` : ""}
                          </p>
                        )}
                      </div>
                      <IconButton
                        tooltip={t("gym.trainers.removeFromList")}
                        onClick={() => setNewCerts((prev) => prev.filter((_, idx) => idx !== i))}
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Input value={ncName} onChange={e => setNcName(e.target.value)} placeholder={t("gym.trainers.certNamePlaceholder")} className="h-9" />
                <Input value={ncOrg} onChange={e => setNcOrg(e.target.value)} placeholder={t("gym.trainers.certOrgLabel")} className="h-9" />
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker value={ncIssue} onChange={(v) => setNcIssue(v ?? "")} placeholder={t("gym.trainers.issueDate")} className="h-9" />
                  <DatePicker value={ncExpiry} onChange={(v) => setNcExpiry(v ?? "")} placeholder={t("gym.trainers.expiryDate")} className="h-9" />
                </div>
                <FileUpload value={ncUrl} onChange={setNcUrl} folder="certifications" label={t("gym.trainers.uploadCert")} />
                <Button onClick={addNewCert} className="h-8 px-4 bg-card border border-border text-primary hover:bg-primary/5 shadow-none text-xs gap-1">
                  <Plus className="size-3.5" /> {t("gym.trainers.addToList")}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}
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
