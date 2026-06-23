import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
type S = components["schemas"];
export type Payment = S["PaymentResponse"];
export type PaymentStatus = NonNullable<Payment["status"]>;
export type CreatePaymentRequest = S["CreatePaymentRequest"];
export type RefundRequest = S["RefundRequest"];
async function list(path: string, status?: PaymentStatus) { const response = await axiosClient.get<S["ApiResponsePagedResponsePaymentResponse"]>(path,{params:{page:0,size:20,status}}); return unwrapApiData(response.data); }
export const paymentService = {
  getMine: (status?: PaymentStatus) => list("/payments/me",status), getPt: (status?: PaymentStatus) => list("/payments/pt",status),
  async create(bookingId:number,payload:CreatePaymentRequest){const response=await axiosClient.post<S["ApiResponsePaymentResponse"]>(`/payments/${bookingId}`,payload);return unwrapApiData(response.data);},
  async refund(id:number,payload:RefundRequest){const response=await axiosClient.put<S["ApiResponsePaymentResponse"]>(`/payments/${id}/refund`,payload);return unwrapApiData(response.data);},
};
