"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Banknote, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell, inputClassName, selectClassName } from "@/modules/forms/form-controls";
import type { Withdrawal, WithdrawalStatus } from "@/services/withdrawal.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useApproveWithdrawal,
  useCreateWithdrawal,
  useRejectWithdrawal,
  useWithdrawals,
} from "../hooks/use-withdrawal";
import { createWithdrawalSchema, rejectWithdrawalSchema } from "../schemas";

const statuses: WithdrawalStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const money = (value: number | undefined, lang: string) =>
  new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const statusTone: Record<WithdrawalStatus, string> = {
  PENDING: "bg-orange-50 text-orange-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export function WithdrawalsPage({ scope }: { scope: "pt" | "admin" }) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  const query = useWithdrawals(scope, status || undefined);
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-orange-500" />
          <h1 className="text-3xl font-black">{t(`withdrawal.${scope}Title`)}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t(`withdrawal.${scope}Description`)}</p>
        </div>
        {scope === "pt" && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("withdrawal.create")}
          </Button>
        )}
      </section>

      <select
        className={selectClassName}
        value={status}
        onChange={(e) => setStatus(e.target.value as WithdrawalStatus | "")}
      >
        <option value="">{t("withdrawal.allStatuses")}</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {t(`withdrawal.statuses.${s}`)}
          </option>
        ))}
      </select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title={t("withdrawal.loadError")} description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title={t("withdrawal.empty")} description={t("withdrawal.emptyDescription")} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((w) => (
              <article
                key={w.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-zinc-400">#{w.id}</p>
                  <Badge className={w.status ? statusTone[w.status] : undefined}>
                    {w.status ? t(`withdrawal.statuses.${w.status}`) : "—"}
                  </Badge>
                </div>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
                  <Banknote className="size-6 text-lime-600" />
                  {money(w.amount, i18n.language)}
                </h2>
                <div className="mt-3 grid gap-1 text-sm text-zinc-500">
                  {scope === "admin" && (
                    <span>
                      {t("withdrawal.trainer")}: {w.ptName}
                    </span>
                  )}
                  <span>
                    {t("withdrawal.bank")}: {w.bankName}
                  </span>
                  <span>
                    {t("withdrawal.account")}: {w.bankAccount}
                  </span>
                  <span>
                    {t("withdrawal.holder")}: {w.bankHolder}
                  </span>
                  {w.notes && (
                    <span>
                      {t("withdrawal.notes")}: {w.notes}
                    </span>
                  )}
                  {w.status === "REJECTED" && w.rejectionReason && (
                    <span className="text-red-600">
                      {t("withdrawal.rejectionReason")}: {w.rejectionReason}
                    </span>
                  )}
                  {w.status === "APPROVED" && w.approvedByName && (
                    <span className="text-emerald-600">
                      {t("withdrawal.approvedBy")}: {w.approvedByName}
                    </span>
                  )}
                </div>
                {scope === "admin" && w.status === "PENDING" && (
                  <div className="mt-4 flex gap-2">
                    <ApproveButton id={w.id!} />
                    <Button className="bg-red-600" onClick={() => setRejecting(w)}>
                      <XCircle className="size-4" />
                      {t("withdrawal.reject")}
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <CreateWithdrawalDialog open={creating} onClose={() => setCreating(false)} />
      {rejecting && <RejectDialog withdrawal={rejecting} onClose={() => setRejecting(null)} />}
    </div>
  );
}

function ApproveButton({ id }: { id: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const mutation = useApproveWithdrawal();
  return (
    <Button
      disabled={mutation.isPending}
      onClick={async () => {
        try {
          await mutation.mutateAsync(id);
          toast({ type: "success", title: t("withdrawal.approved") });
        } catch (e) {
          toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(e) });
        }
      }}
    >
      <BadgeCheck className="size-4" />
      {t("withdrawal.approve")}
    </Button>
  );
}

function CreateWithdrawalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const mutation = useCreateWithdrawal();
  const form = useForm<z.infer<typeof createWithdrawalSchema>>({
    resolver: zodResolver(createWithdrawalSchema),
    defaultValues: { amount: 0, bankName: "", bankAccount: "", bankHolder: "", notes: "" },
  });
  return (
    <Dialog open={open} title={t("withdrawal.create")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync(v);
            toast({ type: "success", title: t("withdrawal.created") });
            form.reset();
            onClose();
          } catch (e) {
            toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label={t("withdrawal.amount")} error={form.formState.errors.amount}>
          <input type="number" className={inputClassName} {...form.register("amount", { valueAsNumber: true })} />
        </FieldShell>
        <FieldShell label={t("withdrawal.bank")} error={form.formState.errors.bankName}>
          <input className={inputClassName} {...form.register("bankName")} />
        </FieldShell>
        <FieldShell label={t("withdrawal.account")} error={form.formState.errors.bankAccount}>
          <input className={inputClassName} {...form.register("bankAccount")} />
        </FieldShell>
        <FieldShell label={t("withdrawal.holder")} error={form.formState.errors.bankHolder}>
          <input className={inputClassName} {...form.register("bankHolder")} />
        </FieldShell>
        <FieldShell label={t("withdrawal.notes")} error={form.formState.errors.notes}>
          <textarea className={inputClassName} {...form.register("notes")} />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <Banknote className="size-4" />
          {t("withdrawal.submit")}
        </Button>
      </form>
    </Dialog>
  );
}

function RejectDialog({ withdrawal, onClose }: { withdrawal: Withdrawal; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const mutation = useRejectWithdrawal();
  const form = useForm<z.infer<typeof rejectWithdrawalSchema>>({
    resolver: zodResolver(rejectWithdrawalSchema),
    defaultValues: { reason: "" },
  });
  return (
    <Dialog open title={t("withdrawal.reject")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync({ id: withdrawal.id!, payload: v });
            toast({ type: "success", title: t("withdrawal.rejected") });
            onClose();
          } catch (e) {
            toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label={t("withdrawal.rejectionReason")} error={form.formState.errors.reason}>
          <textarea className={inputClassName} {...form.register("reason")} />
        </FieldShell>
        <Button className="bg-red-600" disabled={mutation.isPending}>
          <XCircle className="size-4" />
          {t("withdrawal.reject")}
        </Button>
      </form>
    </Dialog>
  );
}
