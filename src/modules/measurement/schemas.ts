import { z } from "zod";

// Bám rule DTO BodyMeasurementRequest: customerId + measurementDate bắt buộc, các chỉ số optional dương.
const optionalPositive = z
  .number()
  .positive()
  .optional()
  .or(z.nan().transform(() => undefined));

export const createMeasurementSchema = z.object({
  customerId: z.number().int().positive(),
  measurementDate: z.string().min(1),
  weight: optionalPositive,
  height: optionalPositive,
  bodyFatPercent: optionalPositive,
  muscleMass: optionalPositive,
  waist: optionalPositive,
  chest: optionalPositive,
  arm: optionalPositive,
  thigh: optionalPositive,
  notes: z.string().max(500).optional(),
});
