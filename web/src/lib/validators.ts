import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  college: z.string().min(2, 'College name is required'),
  branch: z.string().min(2, 'Branch of study is required'),
  graduationYear: z.coerce.number().min(2020, 'Please enter a valid graduation year')
})

export const profileSchema = z.object({
  headline: z.string().max(100, 'Headline is too long').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  githubUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  linkedinUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  portfolioUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional()
})
