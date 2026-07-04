import { z } from 'zod'
import { SEX_VALUES } from '../constants.js'

// Same lower bound OWASP recommends for user-chosen passwords; upper bound just
// guards against pathological input sizes being hashed.
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128)

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(255),
  password: passwordSchema,
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date')
    .refine((value) => new Date(value).getTime() < Date.now(), 'Date of birth must be in the past'),
  sex: z.enum(SEX_VALUES),
  heightCm: z
    .number()
    .min(50, 'Height must be at least 50cm')
    .max(272, 'Height must be under 272cm'),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>
