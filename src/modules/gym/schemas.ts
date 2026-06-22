import { z } from "zod";

const phone = z
  .union([z.literal(""), z.string().regex(/^[0-9+\-() ]{7,20}$/)])
  .optional();
export const gymSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  address: z.string().min(1).max(500),
  phone,
  email: z.union([z.literal(""), z.string().email()]).optional(),
});
export const branchSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  phone,
});
export const facilitySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum([
    "EQUIPMENT",
    "AMENITY",
    "CLASS_ROOM",
    "LOCKER_ROOM",
    "SHOWER",
    "PARKING",
    "WIFI",
    "OTHER",
  ]),
  iconUrl: z.string().optional(),
  isAvailable: z.boolean(),
});
