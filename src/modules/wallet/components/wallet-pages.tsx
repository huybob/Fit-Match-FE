"use client";

import { formatCurrency } from "@/utils/format.util";
import { VIETNAM_BANKS } from "@/shared/constants/banks.constant";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BadgeCheck, Banknote, CheckCheck, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { Withdrawal, WithdrawalStatus } from "@/services/wallet.service";
import type { WalletTxnType } from "@/types/Wallet";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useCreateWithdrawal,
  useGymWallet,
  useGymWalletTransactions,
  useWithdrawalDecision,
  useWithdrawals,
} from "../hooks/use-wallet";
import { useWalletSchemas } from "../use-wallet-schemas";
import { DataTable } from "@/shared/components/common/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { useFormatters } from "@/i18n/use-formatters";

/* Nhãn loại bút toán ví ở wallet.ledger.* (key trùng WalletTxnType). */

const statuses: WithdrawalStatus[] = ["PENDING", "APPROVED", "PAID", "REJECTED"];
// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

const statusVariant: Record<WithdrawalStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  PAID: "success",
};

/* Nhãn trạng thái rút tiền ở wallet.status.* */

export function WalletPage({ scope }: { scope: "gym" | "admin" }) {
  const t = useTranslations();
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [creating, setCreating] = useState(false);
  const [deciding, setDeciding] = useState<{ withdrawal: Withdrawal; decision: "approve" | "reject" | "markPaid" } | null>(null);
  const query = useWithdrawals(scope, status || undefined);
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{scope === "gym" ? t("wallet.gymTitle") : t("wallet.adminTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{scope === "gym" ? t("wallet.gymDescription") : t("wallet.adminDescription")}</p>
        </div>
        {scope === "gym" && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("wallet.create")}
          </Button>
        )}
      </section>

      {scope === "gym" && <WalletSummary />}
      {scope === "gym" && <WalletLedger />}

      <Select value={status} onValueChange={(v) => setStatus(v as WithdrawalStatus | "")}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={t("common.filters.allStatuses")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t("common.filters.allStatuses")}</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>{t(`wallet.status.${s}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title={t("wallet.loadError")} description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title={t("wallet.empty")} description={t("wallet.emptyHint")} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((w) => (
              <article key={w.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-muted-foreground">#{w.id}</p>
                  <Badge variant={statusVariant[w.status]}>
                    {t(`wallet.status.${w.status}`)}
                  </Badge>
                </div>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
                  <Banknote className="size-6 text-primary" />
                  {money(w.amount)}
                </h2>
                <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {scope === "admin" && w.requestedBy && <span>{t("wallet.requestedBy")} {w.requestedBy}</span>}
                  <span>{t("wallet.bank")} {w.bankName}</span>
                  <span>{t("wallet.accountNumber")} {w.bankAccount}</span>
                  <span>{t("wallet.accountHolder")} {w.accountHolder}</span>
                  {w.reviewNote && (
                    <span className={w.status === "REJECTED" ? "text-destructive" : "text-success"}>
                      {t("wallet.moderatorNote")} {w.reviewNote}
                    </span>
                  )}
                  {w.payoutReference && (
                    <span className="text-success">{t("wallet.payoutRef")} {w.payoutReference}</span>
                  )}
                </div>
                {scope === "admin" && w.status === "PENDING" && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setDeciding({ withdrawal: w, decision: "approve" })}>
                      <BadgeCheck className="size-4" />{t("common.actions.approve")}</Button>
                    <Button variant="destructive" onClick={() => setDeciding({ withdrawal: w, decision: "reject" })}>
                      <XCircle className="size-4" />{t("common.actions.reject")}</Button>
                  </div>
                )}
                {scope === "admin" && w.status === "APPROVED" && (
                  <div className="mt-4">
                    <Button onClick={() => setDeciding({ withdrawal: w, decision: "markPaid" })}>
                      <CheckCheck className="size-4" />{t("wallet.transferred")}
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {scope === "gym" && <CreateWithdrawalDialog open={creating} onClose={() => setCreating(false)} />}
      {deciding && (
        <DecisionDialog
          withdrawal={deciding.withdrawal}
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
        />
      )}
    </div>
  );
}

/** UC-061: số dư 4 bucket của ví gym. */
function WalletSummary() {
  const t = useTranslations();
  const wallet = useGymWallet();

  // D-16: lỗi API ví trước đây bị che thành 0đ (`?? 0`) — hiện lỗi rõ ràng thay vì số sai.
  if (wallet.isError) {
    return (
      <section className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">{t("wallet.walletLoadError")}</p>
          <p className="text-xs text-destructive">{toErrorMessage(wallet.error)}</p>
        </div>
      </section>
    );
  }

  const buckets: Array<{ key: string; label: string; value?: number; hint: string }> = [
    { key: "held", label: t("wallet.held"), value: wallet.data?.heldBalance, hint: t("wallet.heldHint") },
    { key: "pending", label: t("wallet.pending"), value: wallet.data?.pendingBalance, hint: t("wallet.pendingHint") },
    { key: "available", label: t("wallet.available"), value: wallet.data?.availableBalance, hint: t("wallet.availableHint") },
    { key: "frozen", label: t("wallet.frozen"), value: wallet.data?.frozenBalance, hint: t("wallet.frozenHint") },
  ];
  return (
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {buckets.map((b) => (
        <div key={b.key} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{b.label}</p>
          <p className="mt-1 text-xl font-black">{wallet.isLoading ? "…" : money(b.value)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{b.hint}</p>
        </div>
      ))}
    </section>
  );
}

/** D-3 (UC-061): sổ cái ví — trước đây hook tồn tại nhưng không component nào render. */
function WalletLedger() {
  const t = useTranslations();
  const fmt = useFormatters();
  const [page, setPage] = useState(0);
  const query = useGymWalletTransactions(page);
  const items = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const totalElements = query.data?.totalElements ?? 0;

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">{t("wallet.ledgerTitle")}</h2>
      </div>
      {query.isLoading ? (
        <div className="p-5"><LoadingSkeleton /></div>
      ) : query.isError ? (
        <div className="p-5"><EmptyState title={t("wallet.ledgerLoadError")} description={toErrorMessage(query.error)} /></div>
      ) : !items.length ? (
        <p className="p-5 text-sm text-muted-foreground">{t("wallet.ledgerEmpty")}</p>
      ) : (
        <>
          <DataTable
            className="rounded-none"
            minWidth="52rem"
            rows={items}
            rowKey={(txn) => String(txn.id)}
            columns={[
              {
                // Bug S2-10: bấm tiêu đề cột để sắp xếp tăng/giảm dần.
                key: "createdAt",
                header: t("common.table.time"),
                cellClassName: "text-xs text-muted-foreground",
                sortValue: (txn) => txn.createdAt,
                cell: (txn) => fmt.dateTime(txn.createdAt),
              },
              {
                key: "type",
                header: t("admin.cms.fieldType"),
                cellClassName: "text-xs font-semibold text-foreground",
                sortValue: (txn) => txn.type,
                cell: (txn) =>
                  txn.type ? t(`wallet.ledger.${txn.type as WalletTxnType}`) : "—",
              },
              {
                key: "amount",
                header: t("common.table.amount"),
                align: "right",
                cellClassName: "font-semibold",
                sortValue: (txn) => txn.amount,
                cell: (txn) => money(txn.amount),
              },
              {
                key: "bookingId",
                header: t("wallet.colBooking"),
                hideBelow: "md",
                cellClassName: "text-xs text-muted-foreground",
                cell: (txn) => (txn.bookingId ? `#${txn.bookingId}` : "—"),
              },
              {
                key: "heldAfter",
                header: t("wallet.colHeld"),
                align: "right",
                hideBelow: "lg",
                cellClassName: "text-xs text-muted-foreground",
                cell: (txn) => money(txn.heldAfter),
              },
              {
                key: "pendingAfter",
                header: t("wallet.colPending"),
                align: "right",
                hideBelow: "lg",
                cellClassName: "text-xs text-muted-foreground",
                cell: (txn) => money(txn.pendingAfter),
              },
              {
                key: "availableAfter",
                header: t("wallet.colAvailable"),
                align: "right",
                hideBelow: "xl",
                cellClassName: "text-xs text-muted-foreground",
                cell: (txn) => money(txn.availableAfter),
              },
              {
                key: "frozenAfter",
                header: t("wallet.colFrozen"),
                align: "right",
                hideBelow: "xl",
                cellClassName: "text-xs text-muted-foreground",
                cell: (txn) => money(txn.frozenAfter),
              },
            ]}
          />
          <Pagination
            className="border-t border-border px-5 py-3"
            page={page}
            zeroBased
            totalPages={totalPages}
            totalItems={totalElements}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}

function CreateWithdrawalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const mutation = useCreateWithdrawal();
  const wallet = useGymWallet();
  const available = wallet.data?.availableBalance ?? 0;
  const schemas = useWalletSchemas();
  const form = useForm<z.infer<typeof schemas.createWithdrawal>>({
    resolver: zodResolver(schemas.createWithdrawal),
    defaultValues: { amount: 0, bankName: "", bankAccount: "", accountHolder: "" },
  });

  return (
    <Dialog open={open} title={t("wallet.create")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          // D-9: chặn vượt khả dụng ngay tại client (BE vẫn là chốt cuối).
          if (v.amount > available) {
            form.setError("amount", {
              message: t("wallet.exceedsAvailable", { max: money(available) }),
            });
            return;
          }
          try {
            await mutation.mutateAsync(v);
            toast({ type: "success", title: t("wallet.created"), description: t("wallet.createdDesc") });
            form.reset();
            onClose();
          } catch (e) {
            toast({ type: "error", title: t("wallet.requestFailed"), description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label={t("wallet.amountAvailable", { max: money(available) })} error={form.formState.errors.amount}>
          <Input type="number" min={10000} max={available} step={1000} {...form.register("amount", { valueAsNumber: true })} />
        </FieldShell>
        <FieldShell label={t("wallet.bankLabel")} error={form.formState.errors.bankName}>
          <Controller
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("wallet.selectBank")} />
                </SelectTrigger>
                <SelectContent>
                  {VIETNAM_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
        <FieldShell label={t("wallet.accountNumberLabel")} error={form.formState.errors.bankAccount}>
          <Input {...form.register("bankAccount")} />
        </FieldShell>
        <FieldShell label={t("wallet.accountHolderLabel")} error={form.formState.errors.accountHolder}>
          <Input {...form.register("accountHolder")} />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <Banknote className="size-4" />
          {mutation.isPending ? t("common.states.processing") : t("wallet.submitRequest")}
        </Button>
      </form>
    </Dialog>
  );
}

/* Nhãn ở wallet.decision.*; ở đây chỉ giữ ràng buộc nghiệp vụ. */
const decisionMeta = {
  approve: { requireNote: false },
  reject: { requireNote: true },
  markPaid: { requireNote: false },
} as const;

function DecisionDialog({ withdrawal, decision, onClose }: {
  withdrawal: Withdrawal;
  decision: "approve" | "reject" | "markPaid";
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const mutation = useWithdrawalDecision();
  const [note, setNote] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const meta = decisionMeta[decision];

  async function run() {
    if (meta.requireNote && !note.trim()) {
      toast({ type: "warning", title: t("wallet.validation.noteRequired") });
      return;
    }
    if (decision === "markPaid" && !payoutReference.trim()) {
      toast({ type: "warning", title: t("wallet.validation.payoutRefRequired") });
      return;
    }
    try {
      await mutation.mutateAsync({
        id: withdrawal.id,
        decision,
        note: note.trim() || undefined,
        payoutReference: payoutReference.trim() || undefined,
      });
      toast({
        type: "success",
        title: t("wallet.decisionSuccess", { action: t(`wallet.decision.${decision}.title`) }),
      });
      onClose();
    } catch (e) {
      toast({ type: "error", title: t("wallet.requestFailed"), description: toErrorMessage(e) });
    }
  }

  return (
    <Dialog open title={t(`wallet.decision.${decision}.title`)} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        #{withdrawal.id} · {money(withdrawal.amount)} · {withdrawal.bankName} — {withdrawal.bankAccount} ({withdrawal.accountHolder})
      </p>
      {decision === "markPaid" && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {t("wallet.payoutRefLabel")} <span className="text-destructive">*</span>
          </label>
          <Input
            value={payoutReference}
            maxLength={100}
            onChange={(e) => setPayoutReference(e.target.value)}
            placeholder={t("wallet.payoutRefPlaceholder")}
          />
        </div>
      )}
      <Textarea
        className="mt-4"
        maxLength={500}
        placeholder={meta.requireNote ? t("booking.reasonRequiredLabel") : t("wallet.noteOptional")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-4 flex gap-2">
        <Button
          variant={decision === "reject" ? "destructive" : "default"}
          disabled={mutation.isPending}
          onClick={() => void run()}
        >
          {mutation.isPending ? t("common.states.processing") : t(`wallet.decision.${decision}.confirm`)}
        </Button>
        <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
      </div>
    </Dialog>
  );
}
