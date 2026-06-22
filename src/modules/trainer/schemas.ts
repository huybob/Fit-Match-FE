import { z } from "zod";

export const trainerProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(50),
  pricePerHour: z.number().positive(),
  pricePerSession: z.number().positive(),
});

export const trainerServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  durationMinutes: z.number().int().min(15),
});

export const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  isRecurring: z.boolean(),
  effectiveDate: z.string().optional(),
}).refine((value) => value.endTime > value.startTime, { message: "End time must be after start time", path: ["endTime"] });

export const certificateSchema = z.object({
  name: z.string().min(1).max(200),
  issuingOrg: z.string().min(1).max(200),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
}).refine((value) => !value.issueDate || !value.expiryDate || value.expiryDate >= value.issueDate, { message: "Expiry date must be after issue date", path: ["expiryDate"] });

export const partnershipSchema = z.object({
  gymId: z.number().int().positive(),
  requestMessage: z.string().max(500).optional(),
});
