"use client";

import { useUsers } from "../hooks/use-user-hooks";

export function UserTable() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load users.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users?.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {user.displayName}
              </td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3 text-slate-600">{user.roleLabel}</td>
              <td className="px-4 py-3">
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
