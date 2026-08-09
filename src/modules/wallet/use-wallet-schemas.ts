"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";

/**
 * Schema rút tiền + tài khoản ngân hàng, message đi qua i18n.
 * V61: form rút tiền chọn tài khoản đã lưu (`bankAccountId`) thay vì gõ tay —
 * thông tin ngân hàng chuyển sang schema `bankAccount`.
 */
export function useWalletSchemas() {
  const t = useTranslations();

  return useMemo(() => {
    const createWithdrawal = z.object({
      amount: z
        .number({ error: t("wallet.validation.amountRequired") })
        .min(10_000, { message: t("wallet.validation.amountMin") })
        // VND không có đơn vị lẻ và QR VietQR chỉ nhận số nguyên đồng; BE cũng chặn.
        .int({ message: t("wallet.validation.amountWhole") }),
      bankAccountId: z
        .number({ error: t("wallet.validation.pickAccount") })
        .min(1, { message: t("wallet.validation.pickAccount") }),
    });

    const bankAccount = z.object({
      bankId: z
        .number({ error: t("wallet.validation.pickBank") })
        .min(1, { message: t("wallet.validation.pickBank") }),
      accountNumber: z
        .string()
        .min(4, { message: t("wallet.validation.accountInvalid") })
        .max(50)
        .regex(/^[A-Za-z0-9]+$/, { message: t("wallet.validation.accountFormat") }),
      accountHolder: z
        .string()
        .min(1, { message: t("wallet.validation.holderRequired") })
        .max(150),
      setDefault: z.boolean().optional(),
    });

    return { createWithdrawal, bankAccount };
  }, [t]);
}
