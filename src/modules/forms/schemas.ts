import { z } from "zod";

// P1-1.6: chính sách mật khẩu — khớp @StrongPassword phía BE (8-100 ký tự, có ít
// nhất một chữ cái và một chữ số). Dùng chung cho đăng ký / đổi / đặt lại mật khẩu.
const strongPassword = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(100, "Mật khẩu không quá 100 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất một chữ cái")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số");

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
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không quá 100 ký tự")
    .regex(/^\p{L}+(?:[ ]\p{L}+)*$/u, "Họ tên chỉ gồm chữ cái và khoảng trắng, không chứa số hoặc ký tự đặc biệt"),
  email: z.string().email("Email is invalid"),
  password: strongPassword,
  phone: z.union([
    z.literal(""),
    z.string().regex(/^[0-9+\-() ]{7,20}$/, "Phone number is invalid"),
  ]),
  // UC-001: BE chỉ nhận accountType (CUSTOMER | GYM_OPERATOR); PT do Gym tạo.
  accountType: z.enum(["CUSTOMER", "GYM_OPERATOR"]),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPassword,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: strongPassword,
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
