import { api } from "@/services/api";
import type {
  CreatePaymentRequest,
  Payment,
  PaymentPage,
  PaymentStatus,
  RefundRequest,
} from "@/types/Payment";

export type {
  CreatePaymentRequest,
  Payment,
  PaymentPage,
  PaymentStatus,
  RefundRequest,
} from "@/types/Payment";

function list(path: string, status?: PaymentStatus) {
  return api.get<PaymentPage>(path, {
    params: { page: 0, size: 20, status },
  });
}

export const paymentService = {
  getMine: (status?: PaymentStatus) => list("/payments/me", status),
  getPt: (status?: PaymentStatus) => list("/payments/pt", status),
  create: (bookingId: number, payload: CreatePaymentRequest) =>
    api.post<Payment, CreatePaymentRequest>(`/payments/${bookingId}`, payload),
  refund: (id: number, payload: RefundRequest) =>
    api.put<Payment, RefundRequest>(`/payments/${id}/refund`, payload),
};
