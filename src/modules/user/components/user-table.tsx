"use client";

import { useUsers } from "../hooks/use-user-hooks";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Badge } from "@/shared/components/ui/badge";

export function UserTable() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title="Không thể tải danh sách người dùng"
        description="Đã xảy ra lỗi khi tải danh sách người dùng. Vui lòng thử lại."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-4 font-black">Tên</th>
            <th className="px-5 py-4 font-black">Email</th>
            <th className="px-5 py-4 font-black">Vai trò</th>
            <th className="px-5 py-4 font-black">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users?.map((user) => (
            <tr
              key={user.id}
              className="transition-colors hover:bg-primary/5"
            >
              <td className="px-5 py-4 font-bold">{user.displayName}</td>
              <td className="px-5 py-4 text-muted-foreground">{user.email}</td>
              <td className="px-5 py-4 text-muted-foreground">{user.roleLabel}</td>
              <td className="px-5 py-4">
                <Badge variant={user.statusTone === "green" ? "success" : "secondary"}>
                  {user.statusLabel}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
