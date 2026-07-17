import { z } from "zod";

// Bám DTO BE WithdrawalCreateRequest: amount/bankAccount/bankName/accountHolder bắt buộc.
// D-9: min 10.000đ — dưới mức đó phí chuyển khoản không đáng; max theo available check ở component.
export const createWithdrawalSchema = z.object({
  amount: z
    .number({ error: "Nhập số tiền" })
    .min(10_000, { message: "Số tiền rút tối thiểu 10.000đ" }),
  bankName: z.string().min(1, { message: "Chọn ngân hàng" }).max(100),
  bankAccount: z.string().min(4, { message: "Số tài khoản không hợp lệ" }).max(50),
  accountHolder: z.string().min(1, { message: "Nhập chủ tài khoản" }).max(150),
});

export const rejectWithdrawalSchema = z.object({
  note: z.string().min(1, { message: "Nhập lý do" }).max(500),
});
