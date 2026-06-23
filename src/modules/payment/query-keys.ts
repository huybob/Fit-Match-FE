import type { PaymentStatus } from "@/services/payment.service";
export const paymentKeys={all:["payments"] as const,list:(scope:"customer"|"pt",status?:PaymentStatus)=>[...paymentKeys.all,scope,status] as const};
