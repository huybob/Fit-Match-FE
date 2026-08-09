"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { BankAccount } from "@/services/wallet.service";
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
import { toErrorMessage } from "@/shared/utils/error.util";
import { useBankAccountMutations, useBankAccounts, useBanks } from "../hooks/use-wallet";
import { useWalletSchemas } from "../use-wallet-schemas";

/**
 * Quản lý tài khoản ngân hàng nhận tiền rút (V61) — dùng chung cho gym operator,
 * PT và khách hàng. Mã BIN của ngân hàng lấy từ master data BE, vì đây là thứ
 * cho phép admin quét QR chuyển khoản thay vì nhập tay số tài khoản.
 */
export function BankAccountsPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const accounts = useBankAccounts();
  const { setDefault, remove } = useBankAccountMutations();
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BankAccount | null>(null);

  const items = accounts.data ?? [];

  /** Nhận sẵn chuỗi đã dịch: key i18n là union type nên không truyền string thô được. */
  async function run(action: Promise<unknown>, successTitle: string) {
    try {
      await action;
      toast({ type: "success", title: successTitle });
    } catch (e) {
      toast({ type: "error", title: t("wallet.requestFailed"), description: toErrorMessage(e) });
    }
  }

  return (
    <div>
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{t("wallet.bankAccounts.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("wallet.bankAccounts.description")}</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          {t("wallet.bankAccounts.add")}
        </Button>
      </section>

      {accounts.isLoading ? (
        <LoadingSkeleton />
      ) : accounts.isError ? (
        <EmptyState title={t("wallet.loadError")} description={toErrorMessage(accounts.error)} />
      ) : !items.length ? (
        <EmptyState
          title={t("wallet.bankAccounts.empty")}
          description={t("wallet.bankAccounts.emptyHint")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" />
                  <h2 className="text-lg font-black">{a.bankName}</h2>
                </div>
                {a.defaultAccount && (
                  <Badge variant="success">{t("wallet.bankAccounts.default")}</Badge>
                )}
              </div>
              <p className="mt-2 font-mono text-xl font-black tracking-wide">{a.accountNumber}</p>
              <p className="text-sm text-muted-foreground">{a.accountHolder}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!a.defaultAccount && (
                  <Button
                    variant="outline"
                    disabled={setDefault.isPending}
                    onClick={() => void run(
                      setDefault.mutateAsync(a.id),
                      t("wallet.bankAccounts.defaultUpdated"),
                    )}
                  >
                    <Star className="size-4" />
                    {t("wallet.bankAccounts.setDefault")}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setEditing(a)}>
                  <Pencil className="size-4" />
                  {t("common.actions.edit")}
                </Button>
                <Button variant="destructive" onClick={() => setConfirmDelete(a)}>
                  <Trash2 className="size-4" />
                  {t("common.actions.delete")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BankAccountDialog
          account={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {confirmDelete && (
        <Dialog open title={t("wallet.bankAccounts.deleteTitle")} onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted-foreground">
            {t("wallet.bankAccounts.deleteConfirm", {
              bank: confirmDelete.bankName,
              account: confirmDelete.accountNumber,
            })}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={async () => {
                await run(remove.mutateAsync(confirmDelete.id), t("wallet.bankAccounts.deleted"));
                setConfirmDelete(null);
              }}
            >
              {remove.isPending ? t("common.states.processing") : t("common.actions.delete")}
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              {t("common.actions.cancel")}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function BankAccountDialog({ account, onClose }: {
  account: BankAccount | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const banks = useBanks();
  const { create, update } = useBankAccountMutations();
  const schemas = useWalletSchemas();
  const form = useForm<z.infer<typeof schemas.bankAccount>>({
    resolver: zodResolver(schemas.bankAccount),
    defaultValues: {
      bankId: account?.bankId ?? 0,
      accountNumber: account?.accountNumber ?? "",
      accountHolder: account?.accountHolder ?? "",
      setDefault: account?.defaultAccount ?? false,
    },
  });

  useEffect(() => {
    form.reset({
      bankId: account?.bankId ?? 0,
      accountNumber: account?.accountNumber ?? "",
      accountHolder: account?.accountHolder ?? "",
      setDefault: account?.defaultAccount ?? false,
    });
  }, [account, form]);

  const pending = create.isPending || update.isPending;

  return (
    <Dialog
      open
      title={account ? t("wallet.bankAccounts.edit") : t("wallet.bankAccounts.add")}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            if (account) {
              await update.mutateAsync({ id: account.id, payload: v });
            } else {
              await create.mutateAsync(v);
            }
            toast({ type: "success", title: t("wallet.bankAccounts.saved") });
            onClose();
          } catch (e) {
            toast({ type: "error", title: t("wallet.requestFailed"), description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label={t("wallet.bankLabel")} error={form.formState.errors.bankId}>
          <Controller
            control={form.control}
            name="bankId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("wallet.selectBank")} />
                </SelectTrigger>
                <SelectContent>
                  {(banks.data ?? []).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.shortName} — {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
        <FieldShell label={t("wallet.accountNumberLabel")} error={form.formState.errors.accountNumber}>
          <Input inputMode="numeric" {...form.register("accountNumber")} />
        </FieldShell>
        <FieldShell label={t("wallet.accountHolderLabel")} error={form.formState.errors.accountHolder}>
          <Input {...form.register("accountHolder")} />
        </FieldShell>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="size-4" {...form.register("setDefault")} />
          {t("wallet.bankAccounts.markDefault")}
        </label>
        <Button disabled={pending}>
          <CreditCard className="size-4" />
          {pending ? t("common.states.processing") : t("common.actions.save")}
        </Button>
      </form>
    </Dialog>
  );
}
