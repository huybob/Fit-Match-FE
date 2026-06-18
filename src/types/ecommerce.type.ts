export type PackageType = "membership" | "pt" | "class";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface GymPackage {
  id: string;
  name: string;
  type: PackageType;
  duration: string;
  price: number;
  originalPrice?: number;
  sessions: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  gender: "male" | "female";
  experience: number;
  price: number;
  rating: number;
  reviews: number;
  bio: string;
  availableSlots: string[];
}

export interface Booking {
  id: string;
  trainerName: string;
  date: string;
  time: string;
  type: string;
  status: BookingStatus;
}
