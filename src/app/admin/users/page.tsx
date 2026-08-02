"use client";

import { useState } from "react";
import { Download, MoreHorizontal, Shield, Ban, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
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
import { downloadCsv } from "@/shared/utils/csv.util";
import type { AdminUserResponse, UserStatus, UserRole } from "@/services/admin.service";
import { Textarea } from "@/shared/components/ui/textarea";
import { IconButton } from "@/shared/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useTranslations, useLocale } from "next-intl";
import { roleLabelKey } from "@/shared/utils/enum-label.util";
import { Pagination } from "@/shared/components/ui/pagination";
import { UserAvatar } from "@/shared/components/common/user-avatar";
import { DataTable } from "@/shared/components/common/data-table";
import { SearchInput } from "@/shared/components/ui/search-input";


const statusVariant: Record<UserStatus, "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  BANNED: "destructive",
};


function UserInitials({ user }: { user: AdminUserResponse }) {
  return (
    <UserAvatar
      className="size-9"
      src={user.avatarUrl}
      name={user.fullName ?? user.username}
      tintSeed={user.id}
      fallbackClassName="text-xs font-bold"
    />
  );
}

function RoleChangeDialog({
  user,
  onClose,
}: {
  user: AdminUserResponse;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();
  const [role, setRole] = useState<UserRole>(user.role ?? "ROLE_CUSTOMER");
  const mutation = useMutation({
    mutationFn: () => adminService.assignRole(user.id!, { role }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ type: "success", title: t("admin.users.roleUpdated") });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={t("admin.users.changeRoleTitle", { name: user.fullName ?? user.username ?? "" })} onClose={onClose}>
      <div className="space-y-4">
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ROLE_CUSTOMER">{t("common.roles.customer")}</SelectItem>
            <SelectItem value="ROLE_PT">{t("common.roles.pt")}</SelectItem>
            <SelectItem value="ROLE_GYM_OPERATOR">{t("common.roles.gymOperator")}</SelectItem>
            <SelectItem value="ROLE_ADMIN">{t("common.roles.admin")}</SelectItem>
            <SelectItem value="ROLE_MODERATOR">{t("common.roles.moderator")}</SelectItem>
            <SelectItem value="ROLE_FINANCE_ADMIN">{t("common.roles.financeAdmin")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || role === user.role}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {mutation.isPending ? t("common.states.saving") : t("common.actions.save")}
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
  const t = useTranslations();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const client = useQueryClient();
  const isPt = user.role === "ROLE_PT";

  const toggleStatus = useMutation({
    mutationFn: () =>
      adminService.updateStatus(user.id!, {
        status: user.status === "BANNED" ? "ACTIVE" : "BANNED",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ type: "success", title: user.status === "BANNED" ? t("admin.users.unbanned") : t("admin.users.banned") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const suspendPt = useMutation({
    mutationFn: () => adminService.suspendPt(user.id!, { reason }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ type: "success", title: t("admin.users.ptSuspended") });
      setSuspendOpen(false);
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const reactivatePt = useMutation({
    mutationFn: () => adminService.reactivatePt(user.id!),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ type: "success", title: t("admin.users.ptUnsuspended") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton tooltip={t("common.actions.moreActions")}>
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem onSelect={onRoleChange}>
            <Shield className="size-3.5 text-primary" /> {t("admin.users.changeRole")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant={user.status === "BANNED" ? "default" : "destructive"}
            disabled={toggleStatus.isPending}
            onSelect={(event) => {
              // Giữ menu mở trong lúc mutation chạy để người dùng thấy trạng thái disabled.
              event.preventDefault();
              toggleStatus.mutate();
            }}
            className={user.status === "BANNED" ? "text-success focus:text-success" : undefined}
          >
            {user.status === "BANNED" ? (
              <><CheckCircle className="size-3.5" /> {t("admin.users.unban")}</>
            ) : (
              <><Ban className="size-3.5" /> {t("admin.users.ban")}</>
            )}
          </DropdownMenuItem>
          {isPt && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => { setReason(""); setSuspendOpen(true); }}
              >
                <Ban className="size-3.5" /> {t("admin.users.suspendPt")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={reactivatePt.isPending}
                onSelect={(event) => {
                  event.preventDefault();
                  reactivatePt.mutate();
                }}
                className="text-success focus:text-success"
              >
                <CheckCircle className="size-3.5" /> {t("admin.users.unsuspendPt")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={suspendOpen} title={t("admin.users.suspendPtTitle", { name: user.fullName ?? user.username ?? "" })} onClose={() => setSuspendOpen(false)}>
        <div className="space-y-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t("admin.users.suspendReasonPlaceholder")}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSuspendOpen(false)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={() => suspendPt.mutate()} disabled={!reason.trim() || suspendPt.isPending} className="gap-2 bg-destructive hover:bg-destructive text-destructive-foreground">
              {suspendPt.isPending && <Loader2 className="size-4 animate-spin" />} {t("admin.users.confirmSuspend")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function UserManagementContent() {
  const t = useTranslations();
  const locale = useLocale();
  // Trước đây format cứng "en-US" nên ngày luôn hiện kiểu Mỹ dù đang xem tiếng Việt.
  const dateFmt = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
          {/* Page title */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-foreground">{t("admin.users.title")}</h1>
            {/* E-13: export thật (trang hiện tại) thay stub chết trước đây */}
            <Button
              variant="outline"
              className="gap-2 h-9 text-sm"
              disabled={!users.length}
              onClick={() =>
                downloadCsv(
                  `users-trang-${page + 1}`,
                  [
                    "ID",
                    t("admin.users.colUsername"),
                    t("admin.users.colFullName"),
                    "Email",
                    "Role",
                    t("common.table.status"),
                    t("admin.users.colCreatedAt"),
                  ],
                  users.map((u) => [
                    u.id, u.username, u.fullName, u.email,
                    t(roleLabelKey(u.role)), u.status,
                    u.createdAt ? dateFmt.format(new Date(u.createdAt)) : "",
                  ]),
                )
              }
            >
              <Download className="size-4" /> {t("admin.users.exportCsv")}
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("admin.users.colRole")}</p>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder={t("admin.users.allRoles")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("admin.users.allRoles")}</SelectItem>
                  <SelectItem value="ROLE_CUSTOMER">{t("common.roles.customer")}</SelectItem>
                  <SelectItem value="ROLE_PT">{t("common.roles.pt")}</SelectItem>
                  <SelectItem value="ROLE_GYM_OPERATOR">{t("common.roles.gymOperator")}</SelectItem>
                  <SelectItem value="ROLE_ADMIN">{t("common.roles.admin")}</SelectItem>
                  <SelectItem value="ROLE_MODERATOR">{t("common.roles.moderator")}</SelectItem>
                  <SelectItem value="ROLE_FINANCE_ADMIN">{t("common.roles.financeAdmin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("admin.users.colStatus")}</p>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-32 text-sm">
                  <SelectValue placeholder={t("admin.users.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("admin.users.allStatuses")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("admin.users.status.ACTIVE")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("admin.users.status.INACTIVE")}</SelectItem>
                  <SelectItem value="BANNED">{t("admin.users.status.BANNED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("admin.users.searchLabel")}
              </p>
              <SearchInput
                value={keyword}
                onValueChange={setKeyword}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder={t("admin.users.searchPlaceholder")}
                className="h-9 w-full text-sm sm:w-64"
              />
            </div>
            <Button
              onClick={applyFilters}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            >
              {t("admin.users.applyFilters")}
            </Button>
          </div>

          <DataTable
            rows={users}
            rowKey={(u) => String(u.id)}
            loading={query.isLoading}
            error={query.isError}
            errorTitle={t("admin.users.loadError")}
            errorDescription={query.isError ? toErrorMessage(query.error) : undefined}
            onRetry={() => query.refetch()}
            emptyTitle={t("admin.users.empty")}
            columns={[
              {
                // Bug S2-10: bấm tiêu đề cột để sắp xếp tăng/giảm dần.
                key: "user",
                header: t("admin.users.colUser"),
                sortValue: (u) => u.fullName ?? u.username,
                cell: (u) => (
                  <div className="flex items-center gap-3">
                    <UserInitials user={u} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {u.fullName ?? u.username ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "role",
                header: t("admin.users.colRole"),
                sortValue: (u) => u.role,
                cell: (u) => (
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t(roleLabelKey(u.role))}
                  </span>
                ),
              },
              {
                key: "status",
                header: t("admin.users.colStatus"),
                sortValue: (u) => u.status ?? "ACTIVE",
                cell: (u) => (
                  <Badge variant={statusVariant[u.status ?? "ACTIVE"] ?? "default"}>
                    {t(`admin.users.status.${u.status ?? "ACTIVE"}`)}
                  </Badge>
                ),
              },
              {
                key: "createdAt",
                header: t("admin.users.colCreatedAt"),
                hideBelow: "md",
                cellClassName: "text-xs text-muted-foreground",
                sortValue: (u) => u.createdAt,
                cell: (u) => (u.createdAt ? dateFmt.format(new Date(u.createdAt)) : "—"),
              },
              {
                key: "actions",
                header: t("common.table.actions"),
                align: "right",
                cell: (u) => <ActionsMenu user={u} onRoleChange={() => setRoleChangeUser(u)} />,
              },
            ]}
            footer={
              <Pagination
                page={page}
                zeroBased
                totalPages={totalPages}
                totalItems={totalElements}
                pageSize={10}
                onPageChange={setPage}
                disabled={query.isLoading}
              />
            }
          />
        </div>

      {roleChangeUser && (
        <RoleChangeDialog user={roleChangeUser} onClose={() => setRoleChangeUser(null)} />
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return <UserManagementContent />;
}
