"use client";

import { useUser } from "../hooks/use-user-hooks";

interface UserDetailProps {
  id: string;
}

export function UserDetail({ id }: UserDetailProps) {
  const { data: user, isLoading } = useUser(id);

  if (isLoading) {
    return <div>Loading user...</div>;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{user.displayName}</h2>
      <p className="mt-1 text-sm text-slate-600">{user.email}</p>
    </section>
  );
}
