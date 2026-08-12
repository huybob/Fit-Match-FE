"use client";

import { formatCurrency } from "@/utils/format.util";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  CheckCheck,
  CreditCard,
  Plus,
  QrCode,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { ProfileSectionHeader } from "@/modules/layout/profile-shell";
import type { WalletOwnerType, Withdrawal, WithdrawalStatus } from "@/services/wallet.service";
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
  ownerTypeOf,
  useBankAccounts,
  useCreateWithdrawal,
  useWallet,
  useWalletTransactions,
  useWithdrawalDecision,
  useWithdrawals,
} from "../hooks/use-wallet";
import type { WalletScope } from "../query-keys";
import { useWalletSchemas } from "../use-wallet-schemas";
import { DataTable } from "@/shared/components/common/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { useFormatters } from "@/i18n/use-formatters";

/* Nhãn loại bút toán ví ở wallet.ledger.* (key trùng WalletTxnType). */

const statuses: WithdrawalStatus[] = ["PENDING", "APPROVED", "PAID", "REJECTED"];
const ownerTypes: WalletOwnerType[] = ["GYM", "CUSTOMER"];
// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

const statusVariant: Record<WithdrawalStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  PAID: "success",
};

/**
 * Ví Gym giữ escrow booking nên có đủ 4 bucket; ví khách hàng chỉ nhận tiền hoàn
 * đã sẵn sàng rút, hiển thị held/pending luôn bằng 0 chỉ gây khó hiểu.
 */
const showsEscrowBuckets = (scope: WalletScope) => scope === "gym";

/* Nhãn trạng thái rút tiền ở wallet.status.* */

export function WalletPage({ scope }: { scope: WalletScope }) {
  const t = useTranslations();
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [ownerFilter, setOwnerFilter] = useState<WalletOwnerType | "">("");
  const [creating, setCreating] = useState(false);
  const [deciding, setDeciding] = useState<{ withdrawal: Withdrawal; decision: "approve" | "reject" | "markPaid" } | null>(null);
  const owner = ownerTypeOf(scope);
  const query = useWithdrawals(scope, status || undefined, ownerFilter || undefined);
  const items = query.data?.content ?? [];

  const createButton = owner ? (
    <Button onClick={() => setCreating(true)}>
      <Plus className="size-4" />
      {t("wallet.create")}
    </Button>
  ) : null;

  return (
    <div>
      {/* Ví khách hàng nằm trong khu vực thành viên nên đội header giống "Hồ sơ"
          / "Bảo mật"; ví gym và trang duyệt của admin giữ header workspace. */}
      {scope === "customer" ? (
        <div className="mb-6">
          <ProfileSectionHeader
            icon={<Wallet className="size-5" />}
            title={t(`wallet.title.${scope}`)}
            description={t(`wallet.description.${scope}`)}
            action={createButton}
          />
        </div>
      ) : (
        <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
            <h1 className="text-3xl font-black">{t(`wallet.title.${scope}`)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t(`wallet.description.${scope}`)}</p>
          </div>
          {createButton}
        </section>
      )}

      {owner && <WalletSummary scope={scope} owner={owner} />}
      {owner && <WalletLedger owner={owner} />}

      <div className="flex flex-wrap gap-3">
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

        {/* Finance cần tách được lệnh của gym, PT và khách hàng — ba nhóm này
            có mức độ rủi ro và quy trình đối chiếu khác nhau. */}
        {scope === "admin" && (
          <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as WalletOwnerType | "")}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t("wallet.allOwnerTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("wallet.allOwnerTypes")}</SelectItem>
              {ownerTypes.map((o) => (
                <SelectItem key={o} value={o}>{t(`wallet.ownerType.${o}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

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
              <WithdrawalCard
                key={w.id}
                withdrawal={w}
                scope={scope}
                onDecide={(decision) => setDeciding({ withdrawal: w, decision })}
              />
            ))}
          </div>
        )}
      </div>

      {owner && (
        <CreateWithdrawalDialog
          owner={owner}
          open={creating}
          onClose={() => setCreating(false)}
        />
      )}
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

function WithdrawalCard({ withdrawal: w, scope, onDecide }: {
  withdrawal: Withdrawal;
  scope: WalletScope;
  onDecide: (decision: "approve" | "reject" | "markPaid") => void;
}) {
  const t = useTranslations();
  const isAdmin = scope === "admin";

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase text-muted-foreground">#{w.id}</p>
        <div className="flex items-center gap-2">
          {isAdmin && w.ownerType && (
            <Badge variant="outline">{t(`wallet.ownerType.${w.ownerType}`)}</Badge>
          )}
          <Badge variant={statusVariant[w.status]}>{t(`wallet.status.${w.status}`)}</Badge>
        </div>
      </div>
      <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
        <Banknote className="size-6 text-primary" />
        {money(w.amount)}
      </h2>
      <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
        {isAdmin && (w.ownerName || w.requestedBy) && (
          <span>{t("wallet.requestedBy")} {w.ownerName ?? w.requestedBy}</span>
        )}
        <span>{t("wallet.bank")} {w.bankName}</span>
        <span>{t("wallet.accountNumber")} {w.bankAccount}</span>
        <span>{t("wallet.accountHolder")} {w.accountHolder}</span>
        {/* Mã đối soát phải hiện rõ: đây là nội dung chuyển khoản bắt buộc để
            webhook Casso khớp được giao dịch chi với lệnh rút này. */}
        {w.refCode && (
          <span className="font-mono text-xs text-foreground">
            {t("wallet.refCode")} {w.refCode}
          </span>
        )}
        {w.reviewNote && (
          <span className={w.status === "REJECTED" ? "text-destructive" : "text-success"}>
            {t("wallet.moderatorNote")} {w.reviewNote}
          </span>
        )}
        {w.payoutReference && (
          <span className="text-success">{t("wallet.payoutRef")} {w.payoutReference}</span>
        )}
      </div>

      {w.status === "PAID" && w.autoMatched && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success">
          <Sparkles className="size-3.5" />
          {t("wallet.autoMatched")}
        </p>
      )}

      {isAdmin && w.status === "PENDING" && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => onDecide("approve")}>
            <BadgeCheck className="size-4" />{t("common.actions.approve")}
          </Button>
          <Button variant="destructive" onClick={() => onDecide("reject")}>
            <XCircle className="size-4" />{t("common.actions.reject")}
          </Button>
        </div>
      )}
      {isAdmin && w.status === "APPROVED" && (
        <div className="mt-4 space-y-3">
          <PayoutQr withdrawal={w} />
          <Button variant="outline" onClick={() => onDecide("markPaid")}>
            <CheckCheck className="size-4" />{t("wallet.transferred")}
          </Button>
        </div>
      )}
    </article>
  );
}

/**
 * QR VietQR trỏ tới tài khoản người thụ hưởng — admin quét bằng app ngân hàng là
 * có sẵn ngân hàng, số tài khoản, số tiền và nội dung chuyển khoản.
 * Chuyển xong, webhook Casso đối chiếu biến động số dư và tự chốt lệnh sang PAID;
 * nút "đã chuyển khoản" bên dưới chỉ dùng khi không tự khớp được.
 */
function PayoutQr({ withdrawal }: { withdrawal: Withdrawal }) {
  const t = useTranslations();

  if (!withdrawal.qrContent) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
        <span>{t("wallet.qrUnavailable")}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-muted-foreground">
        <QrCode className="size-3.5" />
        {t("wallet.scanToPay")}
      </p>
      <div className="flex items-center gap-4">
        {/* Ảnh QR do img.vietqr.io dựng — không phải ảnh trong repo nên dùng
            thẻ img thường thay vì next/image (host ngoài, kích thước cố định). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withdrawal.qrContent}
          alt={t("wallet.scanToPay")}
          width={148}
          height={148}
          className="size-[148px] rounded-lg bg-white object-contain p-1"
        />
        <div className="grid gap-1 text-xs text-muted-foreground">
          <span>{t("wallet.bank")} <b className="text-foreground">{withdrawal.bankName}</b></span>
          <span>{t("wallet.accountNumber")} <b className="text-foreground">{withdrawal.bankAccount}</b></span>
          <span>{t("wallet.accountHolder")} <b className="text-foreground">{withdrawal.accountHolder}</b></span>
          <span>{t("common.table.amount")}: <b className="text-foreground">{money(withdrawal.amount)}</b></span>
          <span className="font-mono">{t("wallet.transferContent")} <b className="text-foreground">{withdrawal.refCode}</b></span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("wallet.autoMatchHint")}</p>
    </div>
  );
}

/** UC-061: số dư các bucket của ví. */
function WalletSummary({ scope, owner }: { scope: WalletScope; owner: WalletOwnerType }) {
  const t = useTranslations();
  const wallet = useWallet(owner);

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

  const escrow = showsEscrowBuckets(scope);
  const buckets: Array<{ key: string; label: string; value?: number; hint: string }> = [
    ...(escrow
      ? [
          { key: "held", label: t("wallet.held"), value: wallet.data?.heldBalance, hint: t("wallet.heldHint") },
          { key: "pending", label: t("wallet.pending"), value: wallet.data?.pendingBalance, hint: t("wallet.pendingHint") },
        ]
      : []),
    { key: "available", label: t("wallet.available"), value: wallet.data?.availableBalance, hint: t("wallet.availableHint") },
    { key: "frozen", label: t("wallet.frozen"), value: wallet.data?.frozenBalance, hint: t("wallet.frozenHint") },
  ];
  return (
    <section className={`mb-5 grid gap-3 sm:grid-cols-2 ${escrow ? "xl:grid-cols-4" : ""}`}>
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
function WalletLedger({ owner }: { owner: WalletOwnerType }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const [page, setPage] = useState(0);
  const query = useWalletTransactions(owner, page);
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

function CreateWithdrawalDialog({ owner, open, onClose }: {
  owner: WalletOwnerType;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const mutation = useCreateWithdrawal(owner);
  const wallet = useWallet(owner);
  const accounts = useBankAccounts();
  const available = wallet.data?.availableBalance ?? 0;
  const schemas = useWalletSchemas();
  const form = useForm<z.infer<typeof schemas.createWithdrawal>>({
    resolver: zodResolver(schemas.createWithdrawal),
    defaultValues: { amount: 0, bankAccountId: 0 },
  });

  // Chọn sẵn tài khoản mặc định: user chỉ có một tài khoản thì không phải bấm thêm.
  const defaultAccountId = accounts.data?.find((a) => a.defaultAccount)?.id
    ?? accounts.data?.[0]?.id;
  useEffect(() => {
    if (open && defaultAccountId && !form.getValues("bankAccountId")) {
      form.setValue("bankAccountId", defaultAccountId);
    }
  }, [open, defaultAccountId, form]);

  const hasAccounts = (accounts.data?.length ?? 0) > 0;

  return (
    <Dialog open={open} title={t("wallet.create")} onClose={onClose}>
      {!accounts.isLoading && !hasAccounts ? (
        // Không có tài khoản thụ hưởng thì không tạo được lệnh rút — dẫn thẳng
        // sang trang quản lý thay vì để form trống bí ẩn.
        <div className="space-y-4">
          <EmptyState
            title={t("wallet.noBankAccount")}
            description={t("wallet.noBankAccountHint")}
          />
          <Button asChild>
            <Link href="/profile/bank-accounts">
              <CreditCard className="size-4" />
              {t("wallet.manageBankAccounts")}
            </Link>
          </Button>
        </div>
      ) : (
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
          <FieldShell label={t("wallet.beneficiaryLabel")} error={form.formState.errors.bankAccountId}>
            <Controller
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("wallet.selectAccount")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(accounts.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.bankName} — {a.accountNumber} ({a.accountHolder})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FieldShell>
          <Link
            href="/profile/bank-accounts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <CreditCard className="size-3.5" />
            {t("wallet.manageBankAccounts")}
          </Link>
          <Button disabled={mutation.isPending}>
            <Banknote className="size-4" />
            {mutation.isPending ? t("common.states.processing") : t("wallet.submitRequest")}
          </Button>
        </form>
      )}
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
      {decision === "approve" && (
        <p className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {t("wallet.approveHint")}
        </p>
      )}
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
