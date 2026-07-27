"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";

/**
 * Bộ validator dùng chung, thông báo lỗi đã đi qua i18n.
 *
 * Vì sao là HOOK chứ không phải schema tĩnh: message phải dịch được, mà `t()`
 * chỉ gọi được trong component. Hook resolve sẵn chuỗi rồi trả về các builder —
 * nhờ vậy KHÔNG phải truyền `t` qua ranh giới hàm (union >1700 key sẽ vượt giới
 * hạn TypeScript ở vị trí generic — TS2590).
 *
 * Dùng:
 *   const v = useValidators();
 *   const schema = useMemo(() => z.object({ email: v.email() }), [v]);
 */

/** Regex dùng chung — khớp ràng buộc phía BE. */
const RE = {
  /** Chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang. */
  code: /^[a-zA-Z0-9._-]+$/,
  /** Chỉ chữ cái (mọi ngôn ngữ) và khoảng trắng đơn. */
  personName: /^\p{L}+(?:[ ]\p{L}+)*$/u,
  phoneVn: /^[0-9+\-() ]{7,20}$/,
  /** Bắt hầu hết emoji — dùng để chặn emoji trong tên/mã. */
  emoji: /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u,
  /** Ký tự đặc biệt (ngoài chữ, số, khoảng trắng, gạch). */
  specialChar: /[^\p{L}\p{N}\s._-]/u,
} as const;

export function useValidators() {
  const t = useTranslations();

  return useMemo(() => {
    const msg = {
      required: (field: string) => t("common.validation.required", { field }),
      requiredSelect: (field: string) => t("common.validation.requiredSelect", { field }),
      minLength: (field: string, min: number) => t("common.validation.minLength", { field, min }),
      maxLength: (field: string, max: number) => t("common.validation.maxLength", { field, max }),
      min: (field: string, min: number) => t("common.validation.min", { field, min }),
      max: (field: string, max: number) => t("common.validation.max", { field, max }),
      between: (field: string, min: number, max: number) =>
        t("common.validation.between", { field, min, max }),
      email: t("common.validation.email"),
      phone: t("common.validation.phone"),
      url: t("common.validation.url"),
      integer: (field: string) => t("common.validation.integer", { field }),
      positive: (field: string) => t("common.validation.positive", { field }),
      nonNegative: (field: string) => t("common.validation.nonNegative", { field }),
      decimal: (field: string, places: number) =>
        t("common.validation.decimal", { field, places }),
      password: t("common.validation.password"),
      passwordConfirm: t("common.validation.passwordConfirm"),
      whitespace: (field: string) => t("common.validation.whitespace", { field }),
      noEdgeSpace: (field: string) => t("common.validation.noLeadingTrailingSpace", { field }),
      specialChar: (field: string) => t("common.validation.specialChar", { field }),
      emoji: (field: string) => t("common.validation.emoji", { field }),
      code: (field: string) => t("common.validation.code", { field }),
      priceInvalid: t("common.validation.priceInvalid"),
    };

    /** Chuỗi bắt buộc: trim, không được rỗng/toàn khoảng trắng. */
    const requiredText = (field: string, opts?: { min?: number; max?: number }) => {
      let s = z
        .string()
        .trim()
        .min(1, msg.required(field));
      if (opts?.min !== undefined) s = s.min(opts.min, msg.minLength(field, opts.min));
      if (opts?.max !== undefined) s = s.max(opts.max, msg.maxLength(field, opts.max));
      return s;
    };

    /** Chuỗi không bắt buộc nhưng nếu có thì phải hợp lệ. */
    const optionalText = (field: string, max?: number) => {
      let s = z.string().trim();
      if (max !== undefined) s = s.max(max, msg.maxLength(field, max));
      return s;
    };

    /**
     * Số nhập từ input (RHF trả string) — giữ string trong form, convert khi submit.
     * Rỗng = không nhập (hợp lệ) khi `optional`.
     */
    const numberText = (
      field: string,
      o: { min?: number; max?: number; integer?: boolean; optional?: boolean } = {},
    ) =>
      z.string().superRefine((raw, ctx) => {
        const v = raw.trim();
        if (v === "") {
          if (!o.optional) ctx.addIssue({ code: "custom", message: msg.required(field) });
          return;
        }
        const n = Number(v);
        if (Number.isNaN(n)) {
          ctx.addIssue({ code: "custom", message: t("common.validation.number", { field }) });
          return;
        }
        if (o.integer && !Number.isInteger(n)) {
          ctx.addIssue({ code: "custom", message: msg.integer(field) });
          return;
        }
        if (o.min !== undefined && o.max !== undefined && (n < o.min || n > o.max)) {
          ctx.addIssue({ code: "custom", message: msg.between(field, o.min, o.max) });
          return;
        }
        if (o.min !== undefined && n < o.min) {
          ctx.addIssue({ code: "custom", message: msg.min(field, o.min) });
        }
        if (o.max !== undefined && n > o.max) {
          ctx.addIssue({ code: "custom", message: msg.max(field, o.max) });
        }
      });

    return {
      msg,
      requiredText,
      optionalText,
      numberText,

      email: () => z.string().trim().min(1, msg.required(msg.email)).email(msg.email),

      /** Khớp @StrongPassword của BE: 8–100 ký tự, ≥1 chữ cái và ≥1 chữ số. */
      password: () =>
        z
          .string()
          .min(8, msg.password)
          .max(100, msg.password)
          .regex(/[A-Za-z]/, msg.password)
          .regex(/\d/, msg.password),

      /** Số điện thoại VN, cho phép để trống. */
      phoneOptional: () =>
        z.union([z.literal(""), z.string().regex(RE.phoneVn, msg.phone)]),

      /** Tên người: chỉ chữ + khoảng trắng, chặn số/ký tự đặc biệt/emoji. */
      personName: (field: string, min = 2, max = 100) =>
        requiredText(field, { min, max })
          .regex(RE.personName, msg.specialChar(field))
          .refine((v) => !RE.emoji.test(v), msg.emoji(field)),

      /** Mã/slug: chữ không dấu, số, . _ - */
      code: (field: string, min = 3, max = 50) =>
        requiredText(field, { min, max }).regex(RE.code, msg.code(field)),

      /** Chặn ký tự đặc biệt trong chuỗi bất kỳ. */
      noSpecialChar: (field: string) => (s: z.ZodString) =>
        s.refine((v) => !RE.specialChar.test(v), msg.specialChar(field)),

      urlOptional: () => z.union([z.literal(""), z.string().url(msg.url)]),

      /** Ngày ISO bắt buộc, không được ở tương lai. */
      pastDate: (field: string) =>
        requiredText(field).refine(
          (v) => v <= new Date().toISOString().slice(0, 10),
          t("common.validation.datePast", { field }),
        ),

      /** Ràng buộc "xác nhận mật khẩu khớp" — dùng với .refine trên object. */
      confirmMatches: <T extends { password: string; confirmPassword: string }>() =>
        ({
          check: (d: T) => d.password === d.confirmPassword,
          opts: { message: msg.passwordConfirm, path: ["confirmPassword"] as const },
        }),
    };
  }, [t]);
}

export type Validators = ReturnType<typeof useValidators>;
