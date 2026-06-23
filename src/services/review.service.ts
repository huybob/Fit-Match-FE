import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
type S=components["schemas"];
export type Review=S["ReviewResponse"];export type ReviewRequest=S["ReviewRequest"];export type ReplyRequest=S["ReplyRequest"];
async function list(path:string){const response=await axiosClient.get<S["ApiResponsePagedResponseReviewResponse"]>(path,{params:{page:0,size:20}});return unwrapApiData(response.data);}
export const reviewService={getMine:()=>list("/reviews/me"),getPt:(id:number)=>list(`/reviews/pt/${id}`),getGym:(id:number)=>list(`/reviews/gym/${id}`),
 async create(payload:ReviewRequest){const r=await axiosClient.post<S["ApiResponseReviewResponse"]>("/reviews",payload);return unwrapApiData(r.data);},async update(id:number,payload:ReviewRequest){const r=await axiosClient.put<S["ApiResponseReviewResponse"]>(`/reviews/${id}`,payload);return unwrapApiData(r.data);},async remove(id:number){await axiosClient.delete(`/reviews/${id}`);},async reply(id:number,payload:ReplyRequest){const r=await axiosClient.put<S["ApiResponseReviewResponse"]>(`/reviews/${id}/reply`,payload);return unwrapApiData(r.data);}};
