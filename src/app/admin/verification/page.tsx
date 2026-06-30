"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard, Users, ShieldCheck, DollarSign, Tag,
  Heart, BarChart3, FileText, ClipboardList, LogOut,
  Search, Bell, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Eye, Clock, ArrowLeft, Loader2, FileCheck, User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import type { PtVerificationResponse } from "@/types/Admin";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck, active: true },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/vouchers", label: "Vouchers", icon: Tag },
  { href: "/admin/loyalty", label: "Loyalty", icon: Heart },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

const statusLabel: Record<string, string> = {
  NOT_SUBMITTED: "Chưa nộp",
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const statusStyle: Record<string, string> = {
  NOT_SUBMITTED: "bg-gray-100 text-gray-500",
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore();
  return (
    <aside className="w-56 shrink-0 bg-[#1a1f37] flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-base font-bold text-white leading-tight">FitMatch</p>
        <p className="text-xs text-white/50 mt-0.5">Admin Console</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {adminLinks.map(({ href, label, icon: Icon, active }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-[#2563eb] text-white" : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon className="size-4 shrink-0" />{label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-8 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user?.fullName ?? user?.username ?? "A")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName ?? user?.username ?? "Admin"}</p>
            <p className="text-xs text-white/40 truncate">Admin User</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors">
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────
// Detail view
// ──────────────────────────────────────────────
function VerificationDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pt-verif", id],
    queryFn: () => adminService.getPtVerification(id),
  });

  const approve = useMutation({
    mutationFn: () => adminService.approvePtVerification(id),
    onSuccess: () => {
      toast({ type: "success", title: "Đã duyệt hồ sơ PT" });
      qc.invalidateQueries({ queryKey: ["admin", "pt-verifications"] });
      onBack();
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  const reject = useMutation({
    mutationFn: () => adminService.rejectPtVerification(id, { reason: rejectReason }),
    onSuccess: () => {
      toast({ type: "success", title: "Đã từ chối hồ sơ PT" });
      qc.invalidateQueries({ queryKey: ["admin", "pt-verifications"] });
      onBack();
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-gray-400" />
    </div>
  );

  const pt = data;
  const isPending = pt?.verificationStatus === "PENDING";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="size-4" /> Quay lại danh sách
      </button>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: PT info */}
        <div className="col-span-2 space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-[#191b23] mb-4">Thông tin Huấn luyện viên</h2>
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {(pt?.displayName ?? pt?.username ?? "PT")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-[#191b23]">{pt?.displayName ?? pt?.username}</p>
                <p className="text-sm text-gray-400">@{pt?.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pt?.specialization && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{pt.specialization}</span>
                  )}
                  {pt?.experienceYears != null && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{pt.experienceYears} năm kinh nghiệm</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[pt?.verificationStatus ?? "PENDING"]}`}>
                    {statusLabel[pt?.verificationStatus ?? "PENDING"]}
                  </span>
                </div>
              </div>
            </div>
            {pt?.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Giới thiệu</p>
                <p className="text-sm text-gray-700 leading-relaxed">{pt.bio}</p>
              </div>
            )}
            {pt?.serviceArea && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Khu vực phục vụ</p>
                <p className="text-sm text-gray-700">{pt.serviceArea}</p>
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-[#191b23] mb-4">Tài liệu đính kèm</h2>
            {pt?.documents && pt.documents.length > 0 ? (
              <div className="space-y-2">
                {pt.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <FileCheck className="size-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{doc}</span>
                    <a href={doc} target="_blank" rel="noreferrer"
                      className="text-xs text-[#2563eb] font-medium hover:underline shrink-0">
                      Xem
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <User className="size-8 mb-2" />
                <p className="text-sm">Chưa có tài liệu</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-[#191b23] mb-4">Hành động</h2>
            {isPending ? (
              <div className="space-y-3">
                <Button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                  Duyệt hồ sơ
                </Button>
                {!showReject ? (
                  <Button
                    onClick={() => setShowReject(true)}
                    className="w-full gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-none"
                  >
                    <XCircle className="size-4" /> Từ chối
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => reject.mutate()}
                        disabled={!rejectReason.trim() || reject.isPending}
                        className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs h-9"
                      >
                        {reject.isPending && <Loader2 className="size-3.5 animate-spin" />}
                        Xác nhận từ chối
                      </Button>
                      <Button
                        onClick={() => { setShowReject(false); setRejectReason(""); }}
                        className="flex-1 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-none text-xs h-9"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                pt?.verificationStatus === "APPROVED" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
              }`}>
                {pt?.verificationStatus === "APPROVED" ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                <span className="text-sm font-medium">{statusLabel[pt?.verificationStatus ?? "PENDING"]}</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-[#191b23] mb-3">Thông tin nộp hồ sơ</h2>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-gray-400" />
                <span>ID: #{pt?.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-gray-400" />
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

  const queueStats = [
    { label: "PENDING REVIEW", value: data?.totalElements ?? 0, sub: "+12%", color: "text-blue-600", bar: "bg-blue-500" },
    { label: "APPROVED (TODAY)", value: 48, sub: "Target Met", color: "text-green-600", bar: "bg-green-500" },
    { label: "REJECTED", value: 12, sub: "-3%", color: "text-red-500", bar: "bg-red-500" },
    { label: "AVG. RESPONSE TIME", value: "2.4h", sub: "High Traffic", color: "text-orange-500", bar: "bg-orange-400" },
  ];

  if (selectedId !== null) {
    return <VerificationDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#191b23]">Verification Queue</h1>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-500">PT Application Review</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {queueStats.map(({ label, value, sub, color, bar }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <div className="flex items-end justify-between mb-2">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <span className="text-xs font-semibold text-gray-400">{sub}</span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${bar} rounded-full`} style={{ width: "60%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#191b23]">Recent Applications</h2>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
            <button className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">Export</button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShieldCheck className="size-8 mb-2" />
            <p className="text-sm">Không có yêu cầu nào</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 text-left">Applicant</th>
                  <th className="pb-3 text-left">Submitted Date</th>
                  <th className="pb-3 text-left">Status</th>
                  <th className="pb-3 text-left">Type</th>
                  <th className="pb-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((pt: PtVerificationResponse) => (
                  <tr key={pt.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(pt.displayName ?? pt.username ?? "PT")[0]?.toUpperCase()}
                          {(pt.displayName ?? pt.username ?? "PT").split(" ")[1]?.[0]?.toUpperCase() ?? ""}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#191b23]">{pt.displayName ?? pt.username}</p>
                          <p className="text-[10px] text-gray-400">@{pt.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="text-xs text-gray-600">ID #{pt.id}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusStyle[pt.verificationStatus ?? "PENDING"]}`}>
                        {statusLabel[pt.verificationStatus ?? "PENDING"]}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-600">
                      {pt.specialization ?? "Personal Trainer"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setSelectedId(pt.id!)}
                        className="flex items-center gap-1.5 text-xs text-[#2563eb] font-semibold hover:underline"
                      >
                        <Eye className="size-3.5" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {page * 10 + 1}–{Math.min((page + 1) * 10, data?.totalElements ?? 0)} of {data?.totalElements ?? 0} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="size-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`size-7 flex items-center justify-center rounded-lg text-xs font-medium ${
                        page === i ? "bg-[#2563eb] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="size-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
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
  const { logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Console</span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input className="pl-9 pr-4 h-8 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none w-52 placeholder:text-gray-400" placeholder="Search applicants..." />
            </div>
            <button className="size-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <Bell className="size-4" />
            </button>
          </div>
        </header>
        <VerificationQueue />
      </main>
    </div>
  );
}
