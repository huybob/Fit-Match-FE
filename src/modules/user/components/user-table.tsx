"use client";

import { useUsers } from "../hooks/use-user-hooks";
import { useTranslation } from "react-i18next";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { EmptyState } from "@/shared/components/common/empty-state";

export function UserTable() {
  const { data: users, isLoading, error } = useUsers();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title={t("admin.usersLoadError")}
        description={t("admin.usersLoadErrorDescription")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900">
          <tr>
            <th className="px-5 py-4 font-black">{t("common.name")}</th>
            <th className="px-5 py-4 font-black">{t("common.email")}</th>
            <th className="px-5 py-4 font-black">{t("auth.role")}</th>
            <th className="px-5 py-4 font-black">{t("common.status")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {users?.map((user) => (
            <tr
              key={user.id}
              className="transition-colors hover:bg-lime-50/50 dark:hover:bg-lime-950/10"
            >
              <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white">
                {user.displayName}
              </td>
              <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                {user.email}
              </td>
              <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                {user.roleLabel}
              </td>
              <td className="px-5 py-4">
                <span
                  className={
                    user.statusTone === "green"
                      ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                      : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                  }
                >
                  {user.statusLabel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
