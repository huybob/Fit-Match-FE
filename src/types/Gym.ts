import type { PageResponse } from "@/shared/types/api-response.type";

export interface Gym {
  id?: number;
  name?: string;
  description?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverUrl?: string;
  averageRating?: number;
  status?: string;
  [key: string]: unknown;
}

export interface GymRequest {
  name: string;
  description?: string;
  city: string;
  district: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface GymBranch {
  id?: number;
  gymId?: number;
  name?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface BranchRequest {
  name: string;
  address: string;
  city?: string;
  district?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface GymFacility {
  id?: number;
  gymId?: number;
  name?: string;
  type: FacilityType;
  description?: string;
  iconUrl?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export interface FacilityRequest {
  name: string;
  type?: FacilityType;
  description?: string;
  iconUrl?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export type FacilityType =
  | "EQUIPMENT"
  | "AMENITY"
  | "CLASS_ROOM"
  | "LOCKER_ROOM"
  | "SHOWER"
  | "PARKING"
  | "WIFI"
  | "OTHER";

export interface GymPartnership {
  id?: number;
  gymId?: number;
  gymName?: string;
  profileId?: number;
  ptProfileId?: number;
  ptName?: string;
  requestMessage?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PartnershipActionRequest {
  message?: string;
}

export type GymPage = PageResponse<Gym>;
export type BranchPage = PageResponse<GymBranch>;
export type FacilityPage = PageResponse<GymFacility>;
export type PartnershipPage = PageResponse<GymPartnership>;
