import type { PageResponse } from "@/shared/types/api-response.type";

export interface Review {
  id?: number;
  bookingId?: number;
  customerId?: number;
  customerName?: string;
  customerAvatar?: string;
  ptProfileId?: number;
  ptName?: string;
  gymId?: number;
  gymName?: string;
  rating?: number;
  comment?: string;
  repliedById?: number;
  repliedByName?: string;
  reply?: string;
  repliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface ReplyRequest {
  reply: string;
}

export type ReviewPage = PageResponse<Review>;
