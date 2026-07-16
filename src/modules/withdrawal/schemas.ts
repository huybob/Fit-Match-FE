import { z } from "zod";

// Bám DTO BE WithdrawalCreateRequest: amount/bankAccount/bankName/accountHolder bắt buộc.
export const createWithdrawalSchema = z.object({
  amount: z.number().positive({ message: "Số tiền phải lớn hơn 0" }),
  bankName: z.string().min(1, { message: "Chọn ngân hàng" }).max(100),
  bankAccount: z.string().min(4, { message: "Số tài khoản không hợp lệ" }).max(50),
  accountHolder: z.string().min(1, { message: "Nhập chủ tài khoản" }).max(150),
});

export const rejectWithdrawalSchema = z.object({
  note: z.string().min(1, { message: "Nhập lý do" }).max(500),
});
