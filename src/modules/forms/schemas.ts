import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = loginSchema.extend({
  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập không quá 50 ký tự")
    .regex(/^[a-zA-Z0-9._-]+$/, "Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang"),
  // A-5: họ tên hiển thị (có dấu) — tách khỏi username.
  fullName: z.string().min(2, "Vui lòng nhập họ tên").max(100, "Họ tên không quá 100 ký tự"),
  email: z.string().email("Email is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  phone: z.union([
    z.literal(""),
    z.string().regex(/^[0-9+\-() ]{7,20}$/, "Phone number is invalid"),
  ]),
  // UC-001: BE chỉ nhận accountType (CUSTOMER | GYM_OPERATOR); PT do Gym tạo.
  accountType: z.enum(["CUSTOMER", "GYM_OPERATOR"]),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const resendVerificationSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const updateProfileSchema = z.object({
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z
    .union([z.literal(""), z.string().regex(/^[0-9+\-() ]{7,20}$/, "Số điện thoại không hợp lệ")])
    .optional(),
});

// Phase 4: các schema mock cũ (booking/checkout/profile/adminPackage/adminTrainer)
// đã xóa cùng cụm modules/ecommerce — form thật dùng schema trong module tương ứng.
