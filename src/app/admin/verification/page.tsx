"use client";

import { useState } from "react";
import {
  ShieldCheck, CheckCircle,
  XCircle, Eye, Clock, ArrowLeft, Loader2, FileCheck, User,
  Building2, MapPin, Phone,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import type { PtVerificationResponse, GymVerificationResponse } from "@/types/Admin";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { openSecureFile } from "@/shared/utils/secure-file.util";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { NumberInput } from "@/shared/components/ui/number-input";
import { Pagination } from "@/shared/components/ui/pagination";
import { Textarea } from "@/shared/components/ui/textarea";
import { useTranslations } from "next-intl";
import { DataTable } from "@/shared/components/common/data-table";
import { UserAvatar } from "@/shared/components/common/user-avatar";

/** B-6: file documents yêu cầu Bearer — mở qua blob thay vì <a href> (401). */
function SecureFileLink({ url }: { url: string }) {
  const t = useTranslations();
  const { toast } = useToast();
  return (
    <Button variant="link" size="inline"
 onClick={() =>
 openSecureFile(url).catch((e) =>
 toast({ type: "error", title: t("admin.verification.openFileFailed"), description: toErrorMessage(e) }),
 )
 }
 className="text-primary shrink-0"
>{t("common.actions.view")}</Button>
  );
}


const statusStyle: Record<string, string> = {
  NOT_SUBMITTED: "bg-muted text-muted-foreground",
  PENDING: "bg-warning-muted text-warning",
  APPROVED: "bg-success-muted text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  REQUIRES_INFO: "bg-warning-muted text-warning",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

// Bug 14: trạng thái vận hành thật của PT (UC-019/021) — nguồn sự thật thay cho
// verificationStatus (deprecated, kẹt "Đang chờ" với mọi PT do gym tạo).
const ptStatusStyle: Record<string, string> = {
  ACTIVE: "bg-success-muted text-success",
  INACTIVE: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

// ──────────────────────────────────────────────
// Detail view
// ──────────────────────────────────────────────
function VerificationDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const t = useTranslations();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pt-verif", id],
    queryFn: () => adminService.getPtVerification(id),
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );

  const pt = data;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> {t("admin.verification.backToList")}
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: PT info */}
        <div className="space-y-5 lg:col-span-2">
          {/* Profile card */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t("admin.verification.ptInfo")}</h2>
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0">
                {(pt?.displayName ?? pt?.username ?? "PT")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground">{pt?.displayName ?? pt?.username}</p>
                <p className="text-sm text-muted-foreground">@{pt?.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pt?.specialization && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{pt.specialization}</span>
                  )}
                  {pt?.experienceYears != null && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">{pt.experienceYears} {t("admin.verification.yearsExperience")}</span>
                  )}
                  {/* Bug 14: hiển thị trạng thái vận hành thật thay vì verificationStatus deprecated. */}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ptStatusStyle[pt?.status ?? "INACTIVE"]}`}>
                    {t(`admin.verification.ptStatus.${pt?.status ?? "INACTIVE"}`)}
                  </span>
                </div>
              </div>
            </div>
            {pt?.bio && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t("admin.verification.bio")}</p>
                <p className="text-sm text-foreground leading-relaxed">{pt.bio}</p>
              </div>
            )}
            {pt?.serviceArea && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("admin.verification.serviceArea")}</p>
                <p className="text-sm text-foreground">{pt.serviceArea}</p>
              </div>
            )}
            {pt?.rejectionReason && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-xs font-semibold text-destructive mb-1">{t("admin.verification.previousRejectReason")}</p>
                <p className="text-sm text-destructive">{pt.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t("admin.verification.attachments")}</h2>
            {pt?.documents && pt.documents.length > 0 ? (
              <div className="space-y-2">
                {pt.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                    <FileCheck className="size-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{doc.documentType}</p>
                      <p className="text-sm text-foreground truncate">{doc.fileUrl}</p>
                    </div>
                    <SecureFileLink url={doc.fileUrl} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <User className="size-8 mb-2" />
                <p className="text-sm">{t("admin.verification.noDocuments")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info — B-18: BE trả 410 cho duyệt PT độc lập (PT do Gym quản lý, UC-019) */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t("common.table.status")}</h2>
            {/* Bug 14: nguồn sự thật = trạng thái vận hành (PtStatus). */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              pt?.status === "ACTIVE" ? "bg-success-muted text-success" : "bg-muted/40 text-muted-foreground"
            }`}>
              {pt?.status === "ACTIVE" ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
              <span className="text-sm font-medium">{t(`admin.verification.ptStatus.${pt?.status ?? "INACTIVE"}`)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {t("admin.verification.ptManagedByGymNote")}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t("admin.verification.submissionInfo")}</h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>ID: #{pt?.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <span>{pt?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Queue list view
// ──────────────────────────────────────────────
function VerificationQueue() {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pt-verifications", statusFilter, page],
    queryFn: () => adminService.listPtVerifications({ status: statusFilter, page, size: 10 }),
  });

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  if (selectedId !== null) {
    return <VerificationDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.verification.ptTitle")}</h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground">{t("admin.verification.ptReadOnly")}</span>
      </div>

      {/* B-36: gỡ stats mock (48/12/2.4h) + nút Export không handler */}

      {/* Filter + Table */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">{t("admin.verification.listTitle")}</h2>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">{t("admin.verification.status.PENDING")}</SelectItem>
              <SelectItem value="APPROVED">{t("admin.verification.status.APPROVED")}</SelectItem>
              <SelectItem value="REJECTED">{t("common.actions.reject")}</SelectItem>
              <SelectItem value="NOT_SUBMITTED">{t("admin.verification.status.NOT_SUBMITTED")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShieldCheck className="size-8 mb-2" />
            <p className="text-sm">{t("admin.verification.emptyRequests")}</p>
          </div>
        ) : (
          <>
            <DataTable
              rows={items as PtVerificationResponse[]}
              rowKey={(pt) => String(pt.id)}
              emptyTitle={t("admin.verification.emptyPt")}
              columns={[
                {
                  key: "applicant",
                  header: t("admin.verification.colApplicant"),
                  cell: (pt) => (
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        className="size-8"
                        name={pt.displayName ?? pt.username ?? "PT"}
                        tintSeed={pt.id}
                        fallbackClassName="text-xs font-bold"
                      />
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {pt.displayName ?? pt.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground">@{pt.username}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "submittedAt",
                  header: t("admin.verification.colSubmittedAt"),
                  hideBelow: "sm",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (pt) => `ID #${pt.id}`,
                },
                {
                  key: "status",
                  header: t("common.table.status"),
                  // Bug 14: trạng thái vận hành thật (ACTIVE = đã xác thực qua gym).
                  cell: (pt) => (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${ptStatusStyle[pt.status ?? "INACTIVE"]}`}
                    >
                      {t(`admin.verification.ptStatus.${pt.status ?? "INACTIVE"}`)}
                    </span>
                  ),
                },
                {
                  key: "type",
                  header: t("admin.verification.colType"),
                  hideBelow: "md",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (pt) =>
                    pt.specialization ?? t("admin.verification.defaultSpecialization"),
                },
                {
                  key: "actions",
                  header: t("common.table.actions"),
                  cell: (pt) => (
                    <Button variant="link" size="inline"
 onClick={() => setSelectedId(pt.id!)}
 className="flex gap-1.5 text-primary"
>
                      <Eye className="size-3.5" /> {t("admin.verification.viewProfile")}
                    </Button>
                  ),
                },
              ]}
            />

            {totalPages > 1 && (
              /* Trước đây chỉ render tối đa 5 số trang nên các trang từ 6 trở đi
                 không thể bấm tới; Pagination dùng dấu "…" nên tới được mọi trang. */
              <Pagination
                className="mt-4 border-t border-border pt-4"
                page={page}
                zeroBased
                totalPages={totalPages}
                totalItems={data?.totalElements ?? 0}
                pageSize={10}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Gym detail view
// ──────────────────────────────────────────────
function GymVerificationDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<null | "reject" | "request" | "suspend" | "address">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "gym-verif", id],
    queryFn: () => adminService.getGymVerification(id),
  });

  const done = (title: string) => {
    toast({ type: "success", title });
    qc.invalidateQueries({ queryKey: ["admin", "gym-verifications"] });
    onBack();
  };
  const fail = (e: unknown) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) });

  const approve = useMutation({ mutationFn: () => adminService.approveGymVerification(id), onSuccess: () => done(t("admin.verification.gymApproved")), onError: fail });
  const reactivate = useMutation({ mutationFn: () => adminService.reactivateGymVerification(id), onSuccess: () => done(t("admin.verification.gymReactivated")), onError: fail });
  const reject = useMutation({ mutationFn: () => adminService.rejectGymVerification(id, { reason }), onSuccess: () => done(t("admin.verification.gymRejected")), onError: fail });
  const requestInfo = useMutation({ mutationFn: () => adminService.requestGymInfo(id, { reason }), onSuccess: () => done(t("admin.verification.infoRequested")), onError: fail });
  const suspend = useMutation({ mutationFn: () => adminService.suspendGymVerification(id, { reason }), onSuccess: () => done(t("admin.verification.gymSuspended")), onError: fail });
  // Bug S2-01: nhắc gym sửa địa chỉ mà KHÔNG đình chỉ — gym vẫn nhận booking bình thường.
  const requestAddress = useMutation({
    mutationFn: () => adminService.requestGymAddressRecheck(id, { reason }),
    onSuccess: () => done(t("admin.verification.addressRecheckRequested")),
    onError: fail,
  });

  const reasonPending = reject.isPending || requestInfo.isPending || suspend.isPending || requestAddress.isPending;
  function submitReason() {
    if (!reason.trim()) { toast({ type: "warning", title: t("admin.verification.reasonRequired") }); return; }
    if (mode === "reject") reject.mutate();
    else if (mode === "request") requestInfo.mutate();
    else if (mode === "suspend") suspend.mutate();
    else if (mode === "address") requestAddress.mutate();
  }

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );

  const gym = data;
  const st = gym?.verificationStatus ?? "PENDING";
  // B-8: BE requirePending chỉ nhận PENDING — REQUIRES_INFO phải chờ gym nộp lại (về PENDING).
  const canReview = st === "PENDING";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> {t("admin.verification.backToList")}
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t("admin.verification.gymInfo")}</h2>
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0">
                <Building2 className="size-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground">{gym?.gymName ?? gym?.username}</p>
                <p className="text-sm text-muted-foreground">@{gym?.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {gym?.city && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <MapPin className="size-3" /> {gym.city}
                    </span>
                  )}
                  {gym?.phone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      <Phone className="size-3" /> {gym.phone}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[gym?.verificationStatus ?? "PENDING"]}`}>
                    {t(`admin.verification.status.${gym?.verificationStatus ?? "PENDING"}`)}
                  </span>
                </div>
              </div>
            </div>
            {gym?.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t("common.table.description")}</p>
                <p className="text-sm text-foreground leading-relaxed">{gym.description}</p>
              </div>
            )}
            {gym?.address && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("admin.verification.address")}</p>
                <p className="text-sm text-foreground">{gym.address}</p>
                {/* Bug S2-01: đã yêu cầu xác minh lại thì hiện nguyên trạng để admin
                    khỏi gửi lại lần nữa; cờ tự gỡ khi gym lưu địa chỉ mới. */}
                {gym.addressVerified === false && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-warning-muted px-2.5 py-1 text-[11px] font-semibold text-warning">
                    <MapPin className="size-3" />
                    {t("admin.verification.addressRecheckPending")}
                    {gym.addressReviewNote ? ` — ${gym.addressReviewNote}` : ""}
                  </p>
                )}
              </div>
            )}
            {gym?.rejectionReason && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-xs font-semibold text-destructive mb-1">{t("admin.verification.previousRejectReason")}</p>
                <p className="text-sm text-destructive">{gym.rejectionReason}</p>
              </div>
            )}
            {gym?.reviewNote && (
              <div className="mt-3 p-3 bg-warning-muted rounded-lg border border-warning/30">
                <p className="text-xs font-semibold text-warning mb-1">{t("admin.verification.reviewNote")}</p>
                <p className="text-sm text-warning">{gym.reviewNote}</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t("admin.verification.legalDocs")}</h2>
            {gym?.documents && gym.documents.length > 0 ? (
              <div className="space-y-2">
                {gym.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                    <FileCheck className="size-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{doc.documentType}</p>
                      <p className="text-sm text-foreground truncate">{doc.fileUrl}</p>
                    </div>
                    <SecureFileLink url={doc.fileUrl} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Building2 className="size-8 mb-2" />
                <p className="text-sm">{t("admin.verification.noDocuments")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t("admin.verification.actions")}</h2>
            <div className="mb-3">
              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle[st]}`}>{t(`admin.verification.status.${st}`)}</span>
            </div>

            {mode ? (
              <div className="space-y-2">
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={
                    mode === "request"
                      ? t("admin.verification.requestInfoPlaceholder")
                      : mode === "address"
                        ? t("admin.verification.addressRecheckPlaceholder")
                        : t("admin.verification.reasonPlaceholder")
                  }
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={submitReason} disabled={!reason.trim() || reasonPending}
                    className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9">
                    {reasonPending && <Loader2 className="size-3.5 animate-spin" />} {t("common.actions.confirm")}
                  </Button>
                  <Button onClick={() => { setMode(null); setReason(""); }}
                    className="flex-1 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none text-xs h-9">{t("common.actions.cancel")}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {canReview && (
                  <>
                    <Button onClick={() => approve.mutate()} disabled={approve.isPending} className="w-full gap-2 bg-success hover:bg-success text-success-foreground">
                      {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />} {t("admin.verification.approveProfile")}
                    </Button>
                    <Button onClick={() => { setReason(""); setMode("request"); }} className="w-full gap-2 border border-warning/30 bg-warning-muted text-warning hover:bg-warning-muted shadow-none">
                      <Clock className="size-4" /> {t("admin.verification.requestInfo")}
                    </Button>
                    <Button onClick={() => { setReason(""); setMode("reject"); }} className="w-full gap-2 border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10 shadow-none">
                      <XCircle className="size-4" />{t("common.actions.reject")}</Button>
                  </>
                )}
                {/* Bug S2-01: địa chỉ sai chuẩn thì nhắc gym sửa, không phải đình chỉ.
                    Dùng được ở mọi trạng thái vì địa chỉ lệch cũng gặp ở hồ sơ đang chờ duyệt. */}
                <Button onClick={() => { setReason(""); setMode("address"); }} className="w-full gap-2 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none">
                  <MapPin className="size-4" /> {t("admin.verification.requestAddressRecheck")}
                </Button>
                {st === "APPROVED" && (
                  <Button onClick={() => { setReason(""); setMode("suspend"); }} className="w-full gap-2 border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10 shadow-none">
                    <XCircle className="size-4" /> {t("admin.verification.suspendGym")}
                  </Button>
                )}
                {st === "SUSPENDED" && (
                  <Button onClick={() => reactivate.mutate()} disabled={reactivate.isPending} className="w-full gap-2 bg-success hover:bg-success text-success-foreground">
                    {reactivate.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />} {t("admin.verification.reactivate")}
                  </Button>
                )}
                {st === "REQUIRES_INFO" && (
                  <p className="text-sm text-muted-foreground">
                    {t("admin.verification.awaitingResubmit")}
                  </p>
                )}
                {st === "REJECTED" && (
                  <p className="text-sm text-muted-foreground">{t("admin.verification.rejectedNote")}</p>
                )}
              </div>
            )}
          </div>

          {/* UC-060 (D-4): đóng băng / gỡ đóng băng ví gym khi có rủi ro */}
          {(st === "APPROVED" || st === "SUSPENDED") && gym?.id && (
            <WalletFreezePanel gymProfileId={gym.id} />
          )}

          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t("admin.verification.submissionInfo")}</h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>ID: #{gym?.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <span>{gym?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** UC-060 (D-4): admin/finance đóng băng một phần số dư ví gym kèm lý do (ghi audit + ledger). */
function WalletFreezePanel({ gymProfileId }: { gymProfileId: number }) {
  const t = useTranslations();
  const { toast } = useToast();
  const [mode, setMode] = useState<null | "freeze" | "unfreeze">(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { amount: Number(amount), reason: reason.trim() };
      return mode === "freeze"
        ? adminService.freezeWallet(gymProfileId, payload)
        : adminService.unfreezeWallet(gymProfileId, payload);
    },
    onSuccess: () => {
      toast({ type: "success", title: mode === "freeze" ? t("admin.verification.balanceFrozen") : t("admin.verification.balanceUnfrozen") });
      setMode(null);
      setAmount("");
      setReason("");
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const invalid = !amount || Number(amount) <= 0 || !reason.trim();

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">{t("admin.verification.gymWallet")}</h2>
      {mode ? (
        <div className="space-y-2">
          <NumberInput
            value={amount === "" ? null : Number(amount)}
            onValueChange={(v) => setAmount(v === null ? "" : String(v))}
            min={1}
            suffix="VND"
            aria-label={t("admin.verification.walletAmountLabel")}
            className="h-10 text-sm"
          />
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t("admin.verification.walletReasonPlaceholder")}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={() => mutation.mutate()} disabled={invalid || mutation.isPending}
              className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9">
              {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              {mode === "freeze" ? t("admin.verification.freeze") : t("admin.verification.unfreeze")}
            </Button>
            <Button onClick={() => setMode(null)}
              className="flex-1 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none text-xs h-9">{t("common.actions.cancel")}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={() => setMode("freeze")}
            className="w-full gap-2 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10 shadow-none text-xs h-9">
            {t("admin.verification.freezeAvailable")}
          </Button>
          <Button onClick={() => setMode("unfreeze")}
            className="w-full gap-2 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none text-xs h-9">
            {t("admin.verification.unfreeze")}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            {t("admin.verification.walletHint")}
          </p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Gym queue list view
// ──────────────────────────────────────────────
function GymVerificationQueue() {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "gym-verifications", statusFilter, page],
    queryFn: () => adminService.listGymVerifications({ status: statusFilter, page, size: 10 }),
  });

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  if (selectedId !== null) {
    return <GymVerificationDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        {/* BUG-10: ba nhãn này trước đây hardcode tiếng Anh nên không đổi theo locale. */}
        <h1 className="text-2xl font-bold text-foreground">{t("admin.verification.queueTitle")}</h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground">{t("admin.verification.queueSubtitle")}</span>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">{t("admin.verification.recentApplications")}</h2>
          {/* B-7: đủ trạng thái — REQUIRES_INFO/SUSPENDED để admin theo dõi bổ sung + kích hoạt lại */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">{t("admin.verification.status.PENDING")}</SelectItem>
              <SelectItem value="REQUIRES_INFO">{t("admin.verification.status.REQUIRES_INFO")}</SelectItem>
              <SelectItem value="APPROVED">{t("admin.verification.status.APPROVED")}</SelectItem>
              <SelectItem value="SUSPENDED">{t("admin.verification.status.SUSPENDED")}</SelectItem>
              <SelectItem value="REJECTED">{t("common.actions.reject")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="size-8 mb-2" />
            <p className="text-sm">{t("admin.verification.emptyRequests")}</p>
          </div>
        ) : (
          <>
            <DataTable
              rows={items as GymVerificationResponse[]}
              rowKey={(gym) => String(gym.id)}
              emptyTitle={t("admin.verification.emptyGym")}
              columns={[
                {
                  key: "gym",
                  header: t("admin.verification.colGym"),
                  cell: (gym) => (
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary">
                        <Building2 className="size-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {gym.gymName ?? gym.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground">@{gym.username}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "area",
                  header: t("admin.verification.colArea"),
                  hideBelow: "sm",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (gym) => gym.city ?? "—",
                },
                {
                  key: "status",
                  header: t("common.table.status"),
                  cell: (gym) => (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle[gym.verificationStatus ?? "PENDING"]}`}
                    >
                      {t(`admin.verification.status.${gym.verificationStatus ?? "PENDING"}`)}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: t("common.table.actions"),
                  cell: (gym) => (
                    <Button variant="link" size="inline"
 onClick={() => setSelectedId(gym.id!)}
 className="flex gap-1.5 text-primary"
>
                      <Eye className="size-3.5" /> {t("admin.verification.viewProfile")}
                    </Button>
                  ),
                },
              ]}
            />

            {totalPages > 1 && (
              /* Trước đây chỉ render tối đa 5 số trang nên các trang từ 6 trở đi
                 không thể bấm tới; Pagination dùng dấu "…" nên tới được mọi trang. */
              <Pagination
                className="mt-4 border-t border-border pt-4"
                page={page}
                zeroBased
                totalPages={totalPages}
                totalItems={data?.totalElements ?? 0}
                pageSize={10}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────
export default function AdminVerificationPage() {
  const t = useTranslations();
  // Gym là luồng duyệt chính (PT chỉ xem) — mặc định tab gym.
  const [tab, setTab] = useState<"pt" | "gym">("gym");

  return (
    <>
      {/* PT / Gym tabs */}
      <div className="bg-card border-b border-border px-6 flex items-center gap-1 shrink-0">
        <button
          onClick={() => setTab("pt")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "pt" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="size-4" /> {t("admin.verification.colTrainer")}
        </button>
        <button
          onClick={() => setTab("gym")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "gym" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-4" /> {t("admin.verification.colGym")}
        </button>
      </div>

      {tab === "pt" ? <VerificationQueue /> : <GymVerificationQueue />}
    </>
  );
}
