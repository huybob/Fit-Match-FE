"use client";

import { useState } from "react";
import {
  ShieldCheck, ChevronLeft, ChevronRight, CheckCircle,
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

/** B-6: file documents yêu cầu Bearer — mở qua blob thay vì <a href> (401). */
function SecureFileLink({ url }: { url: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() =>
        openSecureFile(url).catch((e) =>
          toast({ type: "error", title: "Không mở được tài liệu", description: toErrorMessage(e) }),
        )
      }
      className="text-xs text-primary font-medium hover:underline shrink-0"
    >
      Xem
    </button>
  );
}

const statusLabel: Record<string, string> = {
  NOT_SUBMITTED: "Chưa nộp",
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  REQUIRES_INFO: "Cần bổ sung",
  SUSPENDED: "Đình chỉ",
};

const statusStyle: Record<string, string> = {
  NOT_SUBMITTED: "bg-muted text-muted-foreground",
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  REQUIRES_INFO: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-600",
};

// ──────────────────────────────────────────────
// Detail view
// ──────────────────────────────────────────────
function VerificationDetail({ id, onBack }: { id: number; onBack: () => void }) {
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
        <ArrowLeft className="size-4" /> Quay lại danh sách
      </button>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: PT info */}
        <div className="col-span-2 space-y-5">
          {/* Profile card */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Thông tin Huấn luyện viên</h2>
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {(pt?.displayName ?? pt?.username ?? "PT")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground">{pt?.displayName ?? pt?.username}</p>
                <p className="text-sm text-muted-foreground">@{pt?.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pt?.specialization && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-blue-700 text-xs font-medium">{pt.specialization}</span>
                  )}
                  {pt?.experienceYears != null && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">{pt.experienceYears} năm kinh nghiệm</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[pt?.verificationStatus ?? "PENDING"]}`}>
                    {statusLabel[pt?.verificationStatus ?? "PENDING"]}
                  </span>
                </div>
              </div>
            </div>
            {pt?.bio && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Giới thiệu</p>
                <p className="text-sm text-foreground leading-relaxed">{pt.bio}</p>
              </div>
            )}
            {pt?.serviceArea && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Khu vực phục vụ</p>
                <p className="text-sm text-foreground">{pt.serviceArea}</p>
              </div>
            )}
            {pt?.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1">Lý do từ chối trước đó</p>
                <p className="text-sm text-red-700">{pt.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Tài liệu đính kèm</h2>
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
                <p className="text-sm">Chưa có tài liệu</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info — B-18: BE trả 410 cho duyệt PT độc lập (PT do Gym quản lý, UC-019) */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Trạng thái</h2>
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              pt?.verificationStatus === "APPROVED" ? "bg-green-50 text-green-700" : "bg-muted/40 text-muted-foreground"
            }`}>
              {pt?.verificationStatus === "APPROVED" ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
              <span className="text-sm font-medium">{statusLabel[pt?.verificationStatus ?? "PENDING"]}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              PT được tạo và quản lý bởi phòng tập (UC-019). Nền tảng không duyệt PT độc lập —
              can thiệp chất lượng/an toàn thực hiện qua Đình chỉ PT tại trang Users.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Thông tin nộp hồ sơ</h2>
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
        <h1 className="text-2xl font-bold text-foreground">Hồ sơ Huấn luyện viên</h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground">Chỉ xem — PT do phòng tập quản lý (UC-019)</span>
      </div>

      {/* B-36: gỡ stats mock (48/12/2.4h) + nút Export không handler */}

      {/* Filter + Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Danh sách hồ sơ</h2>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="text-xs border border-border rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="PENDING">Đang chờ</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="NOT_SUBMITTED">Chưa nộp</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShieldCheck className="size-8 mb-2" />
            <p className="text-sm">Không có yêu cầu nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="pb-3 text-left">Applicant</th>
                  <th className="pb-3 text-left">Submitted Date</th>
                  <th className="pb-3 text-left">Status</th>
                  <th className="pb-3 text-left">Type</th>
                  <th className="pb-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((pt: PtVerificationResponse) => (
                  <tr key={pt.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(pt.displayName ?? pt.username ?? "PT")[0]?.toUpperCase()}
                          {(pt.displayName ?? pt.username ?? "PT").split(" ")[1]?.[0]?.toUpperCase() ?? ""}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{pt.displayName ?? pt.username}</p>
                          <p className="text-[10px] text-muted-foreground">@{pt.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="text-xs text-muted-foreground">ID #{pt.id}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusStyle[pt.verificationStatus ?? "PENDING"]}`}>
                        {statusLabel[pt.verificationStatus ?? "PENDING"]}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {pt.specialization ?? "Personal Trainer"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setSelectedId(pt.id!)}
                        className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                      >
                        <Eye className="size-3.5" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {page * 10 + 1}–{Math.min((page + 1) * 10, data?.totalElements ?? 0)} of {data?.totalElements ?? 0} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="size-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`size-7 flex items-center justify-center rounded-lg text-xs font-medium ${
                        page === i ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="size-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
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
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<null | "reject" | "request" | "suspend">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "gym-verif", id],
    queryFn: () => adminService.getGymVerification(id),
  });

  const done = (title: string) => {
    toast({ type: "success", title });
    qc.invalidateQueries({ queryKey: ["admin", "gym-verifications"] });
    onBack();
  };
  const fail = (e: unknown) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) });

  const approve = useMutation({ mutationFn: () => adminService.approveGymVerification(id), onSuccess: () => done("Đã duyệt hồ sơ Gym"), onError: fail });
  const reactivate = useMutation({ mutationFn: () => adminService.reactivateGymVerification(id), onSuccess: () => done("Đã kích hoạt lại Gym"), onError: fail });
  const reject = useMutation({ mutationFn: () => adminService.rejectGymVerification(id, { reason }), onSuccess: () => done("Đã từ chối hồ sơ Gym"), onError: fail });
  const requestInfo = useMutation({ mutationFn: () => adminService.requestGymInfo(id, { reason }), onSuccess: () => done("Đã yêu cầu bổ sung hồ sơ"), onError: fail });
  const suspend = useMutation({ mutationFn: () => adminService.suspendGymVerification(id, { reason }), onSuccess: () => done("Đã đình chỉ Gym"), onError: fail });

  const reasonPending = reject.isPending || requestInfo.isPending || suspend.isPending;
  function submitReason() {
    if (!reason.trim()) { toast({ type: "warning", title: "Vui lòng nhập lý do" }); return; }
    if (mode === "reject") reject.mutate();
    else if (mode === "request") requestInfo.mutate();
    else if (mode === "suspend") suspend.mutate();
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
        <ArrowLeft className="size-4" /> Quay lại danh sách
      </button>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Thông tin phòng gym</h2>
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="size-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground">{gym?.gymName ?? gym?.username}</p>
                <p className="text-sm text-muted-foreground">@{gym?.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {gym?.city && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-blue-700 text-xs font-medium">
                      <MapPin className="size-3" /> {gym.city}
                    </span>
                  )}
                  {gym?.phone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      <Phone className="size-3" /> {gym.phone}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[gym?.verificationStatus ?? "PENDING"]}`}>
                    {statusLabel[gym?.verificationStatus ?? "PENDING"]}
                  </span>
                </div>
              </div>
            </div>
            {gym?.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Mô tả</p>
                <p className="text-sm text-foreground leading-relaxed">{gym.description}</p>
              </div>
            )}
            {gym?.address && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Địa chỉ</p>
                <p className="text-sm text-foreground">{gym.address}</p>
              </div>
            )}
            {gym?.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1">Lý do từ chối trước đó</p>
                <p className="text-sm text-red-700">{gym.rejectionReason}</p>
              </div>
            )}
            {gym?.reviewNote && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-1">Ghi chú xét duyệt (request-info/đình chỉ)</p>
                <p className="text-sm text-amber-800">{gym.reviewNote}</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Tài liệu pháp lý</h2>
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
                <p className="text-sm">Chưa có tài liệu</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Hành động</h2>
            <div className="mb-3">
              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle[st]}`}>{statusLabel[st]}</span>
            </div>

            {mode ? (
              <div className="space-y-2">
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={mode === "request" ? "Nội dung cần bổ sung..." : "Nhập lý do..."}
                  rows={3}
                  className="w-full text-sm border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex gap-2">
                  <Button onClick={submitReason} disabled={!reason.trim() || reasonPending}
                    className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs h-9">
                    {reasonPending && <Loader2 className="size-3.5 animate-spin" />} Xác nhận
                  </Button>
                  <Button onClick={() => { setMode(null); setReason(""); }}
                    className="flex-1 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none text-xs h-9">Hủy</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {canReview && (
                  <>
                    <Button onClick={() => approve.mutate()} disabled={approve.isPending} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                      {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />} Duyệt hồ sơ
                    </Button>
                    <Button onClick={() => { setReason(""); setMode("request"); }} className="w-full gap-2 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-none">
                      <Clock className="size-4" /> Yêu cầu bổ sung
                    </Button>
                    <Button onClick={() => { setReason(""); setMode("reject"); }} className="w-full gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-none">
                      <XCircle className="size-4" /> Từ chối
                    </Button>
                  </>
                )}
                {st === "APPROVED" && (
                  <Button onClick={() => { setReason(""); setMode("suspend"); }} className="w-full gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-none">
                    <XCircle className="size-4" /> Đình chỉ Gym
                  </Button>
                )}
                {st === "SUSPENDED" && (
                  <Button onClick={() => reactivate.mutate()} disabled={reactivate.isPending} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                    {reactivate.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />} Kích hoạt lại
                  </Button>
                )}
                {st === "REQUIRES_INFO" && (
                  <p className="text-sm text-muted-foreground">
                    Đang chờ phòng tập bổ sung thông tin và nộp lại. Hồ sơ sẽ quay về “Đang chờ” khi họ nộp.
                  </p>
                )}
                {st === "REJECTED" && (
                  <p className="text-sm text-muted-foreground">Hồ sơ đã bị từ chối.</p>
                )}
              </div>
            )}
          </div>

          {/* UC-060 (D-4): đóng băng / gỡ đóng băng ví gym khi có rủi ro */}
          {(st === "APPROVED" || st === "SUSPENDED") && gym?.id && (
            <WalletFreezePanel gymProfileId={gym.id} />
          )}

          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Thông tin nộp hồ sơ</h2>
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
      toast({ type: "success", title: mode === "freeze" ? "Đã đóng băng số dư" : "Đã gỡ đóng băng" });
      setMode(null);
      setAmount("");
      setReason("");
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  const invalid = !amount || Number(amount) <= 0 || !reason.trim();

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">Ví phòng tập (UC-060)</h2>
      {mode ? (
        <div className="space-y-2">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Số tiền (VND)"
            className="w-full text-sm border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Lý do (bắt buộc, ghi audit)..."
            className="w-full text-sm border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex gap-2">
            <Button onClick={() => mutation.mutate()} disabled={invalid || mutation.isPending}
              className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs h-9">
              {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              {mode === "freeze" ? "Đóng băng" : "Gỡ đóng băng"}
            </Button>
            <Button onClick={() => setMode(null)}
              className="flex-1 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none text-xs h-9">
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={() => setMode("freeze")}
            className="w-full gap-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-none text-xs h-9">
            Đóng băng số dư khả dụng
          </Button>
          <Button onClick={() => setMode("unfreeze")}
            className="w-full gap-2 border border-border bg-card text-muted-foreground hover:bg-muted/40 shadow-none text-xs h-9">
            Gỡ đóng băng
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Chuyển một phần khả dụng ↔ đóng băng khi có rủi ro/tranh chấp; ghi audit + sổ cái ví.
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
        <h1 className="text-2xl font-bold text-foreground">Verification Queue</h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground">Gym Application Review</span>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Applications</h2>
          {/* B-7: đủ trạng thái — REQUIRES_INFO/SUSPENDED để admin theo dõi bổ sung + kích hoạt lại */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="text-xs border border-border rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="PENDING">Đang chờ</option>
            <option value="REQUIRES_INFO">Cần bổ sung</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="SUSPENDED">Đình chỉ</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="size-8 mb-2" />
            <p className="text-sm">Không có yêu cầu nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="pb-3 text-left">Phòng gym</th>
                  <th className="pb-3 text-left">Khu vực</th>
                  <th className="pb-3 text-left">Status</th>
                  <th className="pb-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((gym: GymVerificationResponse) => (
                  <tr key={gym.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                          <Building2 className="size-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{gym.gymName ?? gym.username}</p>
                          <p className="text-[10px] text-muted-foreground">@{gym.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{gym.city ?? "—"}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusStyle[gym.verificationStatus ?? "PENDING"]}`}>
                        {statusLabel[gym.verificationStatus ?? "PENDING"]}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setSelectedId(gym.id!)}
                        className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                      >
                        <Eye className="size-3.5" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {page * 10 + 1}–{Math.min((page + 1) * 10, data?.totalElements ?? 0)} of {data?.totalElements ?? 0} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="size-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`size-7 flex items-center justify-center rounded-lg text-xs font-medium ${
                        page === i ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="size-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
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
          <ShieldCheck className="size-4" /> Huấn luyện viên
        </button>
        <button
          onClick={() => setTab("gym")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "gym" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-4" /> Phòng gym
        </button>
      </div>

      {tab === "pt" ? <VerificationQueue /> : <GymVerificationQueue />}
    </>
  );
}
