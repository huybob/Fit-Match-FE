"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useValidators } from "@/shared/validations/use-validators";
import { useTranslations } from "next-intl";

/**
 * Schema cho toàn bộ form auth, message đã đi qua i18n.
 *
 * Là hook (không phải const tĩnh) vì message phải dịch được. Ràng buộc giữ
 * NGUYÊN như schema cũ để không đổi hợp đồng với BE.
 */
export function useAuthSchemas() {
  const v = useValidators();
  const t = useTranslations();

  return useMemo(() => {
    const fieldUsername = t("auth.username");
    const fieldFullName = t("auth.fullName");
    const fieldPassword = t("auth.passwordLabel");

    const login = z.object({
      username: v.requiredText(fieldUsername),
      password: v.requiredText(fieldPassword),
    });

    const register = z
      .object({
        username: v.code(fieldUsername, 3, 50),
        fullName: v.personName(fieldFullName, 2, 100),
        email: v.email(),
        password: v.password(),
        confirmPassword: v.requiredText(t("auth.confirmPassword")),
        phone: v.phoneOptional(),
        // UC-001: BE chỉ nhận accountType (CUSTOMER | GYM_OPERATOR); PT do Gym tạo.
        accountType: z.enum(["CUSTOMER", "GYM_OPERATOR"]),
        terms: z.boolean().refine((b) => b === true, t("auth.mustAgreeTerms")),
      })
      .refine((d) => d.password === d.confirmPassword, {
        message: v.msg.passwordConfirm,
        path: ["confirmPassword"],
      });

    const changePassword = z.object({
      oldPassword: v.requiredText(t("auth.currentPassword")),
      newPassword: v.password(),
    });

    /** Trang /change-password có thêm ô xác nhận; API vẫn chỉ nhận old + new. */
    const changePasswordWithConfirm = z
      .object({
        oldPassword: z
          .string()
          .min(1, t("common.validation.currentPasswordRequired")),
        newPassword: v.password(),
        confirmPassword: z
          .string()
          .min(1, t("common.validation.confirmNewPassword")),
      })
      .refine((d) => d.newPassword === d.confirmPassword, {
        message: v.msg.passwordConfirm,
        path: ["confirmPassword"],
      });

    const forgotPassword = z.object({ email: v.email() });

    const resetPassword = z
      .object({
        newPassword: v.password(),
        confirmPassword: v.requiredText(t("auth.confirmPassword")),
      })
      .refine((d) => d.newPassword === d.confirmPassword, {
        message: v.msg.passwordConfirm,
        path: ["confirmPassword"],
      });

    const resendVerification = z.object({ email: v.email() });

    const updateProfile = z.object({
      email: z.union([z.literal(""), z.string().email(v.msg.email)]).optional(),
      phone: v.phoneOptional().optional(),
    });

    return {
      login,
      register,
      changePassword,
      changePasswordWithConfirm,
      forgotPassword,
      resetPassword,
      resendVerification,
      updateProfile,
    };
  }, [v, t]);
}

export type LoginValues = z.infer<ReturnType<typeof useAuthSchemas>["login"]>;
export type RegisterValues = z.infer<ReturnType<typeof useAuthSchemas>["register"]>;
export type ChangePasswordValues = z.infer<ReturnType<typeof useAuthSchemas>["changePassword"]>;
export type ForgotPasswordValues = z.infer<ReturnType<typeof useAuthSchemas>["forgotPassword"]>;
export type ResetPasswordValues = z.infer<ReturnType<typeof useAuthSchemas>["resetPassword"]>;
export type ResendVerificationValues = z.infer<
  ReturnType<typeof useAuthSchemas>["resendVerification"]
>;
