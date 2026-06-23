import { z } from "zod";
export const createPaymentSchema=z.object({bookingId:z.number().int().positive(),paymentMethod:z.enum(["VNPAY","MOMO","BANK_TRANSFER","CASH"])});
export const refundSchema=z.object({amount:z.number().positive(),reason:z.string().min(1)});
