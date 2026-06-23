import { z } from "zod";

// Bám rule DTO WithdrawalRequestDto: amount/bankName/bankAccount/bankHolder bắt buộc, notes optional.
export const createWithdrawalSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(1).max(100),
  bankAccount: z.string().min(4).max(50),
  bankHolder: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
});

export const rejectWithdrawalSchema = z.object({
  reason: z.string().min(1).max(500),
});
