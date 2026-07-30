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
  location?: string;
  avatarColor?: string;
  imageUrl?: string;
}

export interface Gym {
  id: string;
  name: string;
  location: string;
  rating: number;
  badge?: string;
  facilities: string[];
  gradient: string;
  imageUrl?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  initials: string;
  quote: string;
  date: string;
}

export interface BlogPost {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  color: string;
  imageUrl?: string;
}

export interface Booking {
  id: string;
  trainerName: string;
  date: string;
  time: string;
  type: string;
  status: BookingStatus;
}
