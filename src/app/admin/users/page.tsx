"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/modules/auth/auth-guard";
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  DollarSign,
  Tag,
  Heart,
  BarChart3,
  FileText,
  ClipboardList,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useToast } from "@/lib/toast-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { AdminUserResponse, UserStatus, UserRole } from "@/services/admin.service";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users, active: true },
  { href: "/admin/verification", label: "Verification", icon: BadgeCheck },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/vouchers", label: "Vouchers", icon: Tag },
  { href: "/admin/loyalty", label: "Loyalty", icon: Heart },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

const roleLabels: Record<string, string> = {
  ROLE_CUSTOMER: "Customer",
  ROLE_PT: "PT",
  ROLE_GYM_OPERATOR: "Gym Admin",
  ROLE_ADMIN: "Admin",
};

const statusVariant: Record<UserStatus, "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  BANNED: "destructive",
};

const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  BANNED: "Suspended",
};

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore();
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      <Link href="/" className="block px-5 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <p className="text-base font-bold text-[#0f172a] leading-tight">FitMatch</p>
        <p className="text-xs text-gray-400 mt-0.5">Admin Console</p>
      </Link>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {adminLinks.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-[#2563eb] text-white" : "text-gray-500 hover:text-[#0f172a] hover:bg-gray-50"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-8 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user?.fullName ?? user?.username ?? "A")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0f172a] truncate">{user?.fullName ?? user?.username ?? "Admin"}</p>
            <p className="text-xs text-gray-400 truncate">Senior Admin</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function UserInitials({ user }: { user: AdminUserResponse }) {
  const name = user.fullName ?? user.username ?? "?";
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500"];
  const color = colors[(user.id ?? 0) % colors.length];
  return (
    <div className={`size-9 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden`}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={name} className="size-full object-cover" />
      ) : initials}
    </div>
  );
}

function RoleChangeDialog({
  user,
  onClose,
}: {
  user: AdminUserResponse;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const client = useQueryClient();
  const [role, setRole] = useState<UserRole>(user.role ?? "ROLE_CUSTOMER");
  const mutation = useMutation({
    mutationFn: () => adminService.assignRole(user.id!, { role }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ type: "success", title: "Cập nhật role thành công" });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={`Đổi role: ${user.fullName ?? user.username}`} onClose={onClose}>
      <div className="space-y-4">
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ROLE_CUSTOMER">Customer</SelectItem>
            <SelectItem value="ROLE_PT">PT (Personal Trainer)</SelectItem>
            <SelectItem value="ROLE_GYM_OPERATOR">Gym Admin</SelectItem>
            <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || role === user.role}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ActionsMenu({
  user,
  onRoleChange,
}: {
  user: AdminUserResponse;
  onRoleChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const client = useQueryClient();

  const toggleStatus = useMutation({
    mutationFn: () =>
      adminService.updateStatus(user.id!, {
        status: user.status === "BANNED" ? "ACTIVE" : "BANNED",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ type: "success", title: user.status === "BANNED" ? "Đã mở khóa" : "Đã khóa tài khoản" });
      setOpen(false);
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="size-4 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => { setOpen(false); onRoleChange(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Shield className="size-3.5 text-blue-500" /> Đổi role
            </button>
            <button
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-gray-50 ${
                user.status === "BANNED" ? "text-green-600" : "text-red-600"
              }`}
            >
              {user.status === "BANNED" ? (
                <><CheckCircle className="size-3.5" /> Mở khóa</>
              ) : (
                <><Ban className="size-3.5" /> Khóa tài khoản</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function UserManagementContent() {
  const { toast } = useToast();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState({ keyword: "", role: "", status: "" });
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUserResponse | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: () =>
      adminService.searchUsers({
        keyword: search.keyword || undefined,
        role: search.role || undefined,
        status: search.status || undefined,
        page,
        size: 10,
      }),
  });

  const users = query.data?.content ?? [];
  const totalElements = query.data?.totalElements ?? 0;
  const totalPages = query.data?.totalPages ?? 1;

  function applyFilters() {
    setSearch({ keyword, role, status });
    setPage(0);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AdminSidebar onLogout={handleLogout} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input
                className="pl-9 pr-4 h-8 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52"
                placeholder="Global Search..."
              />
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          {/* Page title */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-[#191b23]">User Management</h1>
            <Button variant="outline" className="gap-2 h-9 text-sm">
              <Download className="size-4" /> Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Role</p>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="ROLE_CUSTOMER">Customer</SelectItem>
                  <SelectItem value="ROLE_PT">PT</SelectItem>
                  <SelectItem value="ROLE_GYM_OPERATOR">Gym Admin</SelectItem>
                  <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Status</p>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-32 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="BANNED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Search</p>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search by name, email, or ID..."
                className="h-9 w-64 text-sm"
              />
            </div>
            <Button
              onClick={applyFilters}
              className="h-9 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm"
            >
              Apply Filters
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {query.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-3">
                        <div className="h-8 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <UserInitials user={u} />
                          <div className="min-w-0">
                            <p className="font-medium text-[#191b23] truncate">{u.fullName ?? u.username ?? "—"}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          {roleLabels[u.role ?? ""] ?? u.role ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[u.status ?? "ACTIVE"] ?? "default"}>
                          {statusLabel[u.status ?? "ACTIVE"] ?? u.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionsMenu user={u} onRoleChange={() => setRoleChangeUser(u)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {totalElements > 0
                  ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, totalElements)} of ${totalElements.toLocaleString()} users`
                  : "No users found"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs gap-1"
                  disabled={page === 0}
                  onClick={() => setPage((v) => v - 1)}
                >
                  <ChevronLeft className="size-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs gap-1"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((v) => v + 1)}
                >
                  Next <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {roleChangeUser && (
        <RoleChangeDialog user={roleChangeUser} onClose={() => setRoleChangeUser(null)} />
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return <UserManagementContent />;
}
