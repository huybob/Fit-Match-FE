"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";

/**
 * Schema rút tiền, message đi qua i18n.
 * Ràng buộc giữ NGUYÊN như schema tĩnh cũ (không đổi hợp đồng BE).
 */
export function useWithdrawalSchemas() {
  const t = useTranslations();

  return useMemo(() => {
    const createWithdrawal = z.object({
      amount: z
        .number({ error: t("withdrawal.validation.amountRequired") })
        .min(10_000, { message: t("withdrawal.validation.amountMin") }),
      bankName: z
        .string()
        .min(1, { message: t("withdrawal.validation.pickBank") })
        .max(100),
      bankAccount: z
        .string()
        .min(4, { message: t("withdrawal.validation.accountInvalid") })
        .max(50),
      accountHolder: z
        .string()
        .min(1, { message: t("withdrawal.validation.holderRequired") })
        .max(150),
    });


    return { createWithdrawal };
  }, [t]);
}
