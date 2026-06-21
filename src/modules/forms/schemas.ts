import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = loginSchema.extend({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username contains invalid characters"),
  email: z.string().email("Email is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  phone: z.union([
    z.literal(""),
    z.string().regex(/^[0-9+\-() ]{7,20}$/, "Phone number is invalid"),
  ]),
  role: z.enum(["ROLE_CUSTOMER", "ROLE_PT", "ROLE_GYM_OPERATOR"]),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100),
});

export const bookingSchema = z.object({
  trainerId: z.string().min(1, "Trainer is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  type: z.string().min(1, "Training type is required"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Phone is required"),
});

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Email is invalid"),
  phone: z.string().min(8, "Phone is required"),
  method: z.string().min(1, "Payment method is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Phone is required"),
  goal: z.string().min(3, "Goal is required"),
});

export const adminPackageSchema = z.object({
  name: z.string().min(2, "Package name is required"),
  price: z.coerce.number().min(1, "Price is required"),
  duration: z.string().min(1, "Duration is required"),
  type: z.string().min(1, "Type is required"),
});

export const adminTrainerSchema = z.object({
  name: z.string().min(2, "Trainer name is required"),
  specialty: z.string().min(2, "Specialty is required"),
  experience: z.coerce.number().min(1, "Experience is required"),
  price: z.coerce.number().min(1, "Price is required"),
});
