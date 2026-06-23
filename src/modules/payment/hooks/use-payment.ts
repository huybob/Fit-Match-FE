"use client";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { paymentService,PaymentStatus,CreatePaymentRequest,RefundRequest } from "@/services/payment.service";
import { paymentKeys } from "../query-keys";
const refresh=(c:ReturnType<typeof useQueryClient>)=>()=>c.invalidateQueries({queryKey:paymentKeys.all});
export function usePayments(scope:"customer"|"pt",status?:PaymentStatus){return useQuery({queryKey:paymentKeys.list(scope,status),queryFn:()=>scope==="customer"?paymentService.getMine(status):paymentService.getPt(status)});}
export function useCreatePayment(){const c=useQueryClient();return useMutation({mutationFn:({bookingId,payload}:{bookingId:number;payload:CreatePaymentRequest})=>paymentService.create(bookingId,payload),onSuccess:refresh(c)});}
export function useRefundPayment(){const c=useQueryClient();return useMutation({mutationFn:({id,payload}:{id:number;payload:RefundRequest})=>paymentService.refund(id,payload),onSuccess:refresh(c)});}
