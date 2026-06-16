import { UserTable } from "@/modules/user";

export default function UsersPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Module demo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Users</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          This page imports only the public surface of the User module.
        </p>
      </div>
      <UserTable />
    </main>
  );
}
