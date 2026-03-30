import { z } from 'zod'

/** Schema for user registration */
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

/** Schema for user login */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/** Schema for forgot password request */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/** Schema for password reset */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/** Schema for profile update */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  locale: z.enum(['pt-BR', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

/** Schema for password change */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/** Schema for API key update */
export const apiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .regex(/^sk-ant-/, 'Must be a valid Anthropic API key (starts with sk-ant-)'),
})

/** Schema for agent creation/update */
export const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  emoji: z.string().default('🤖'),
  templateId: z.string().min(1, 'Template is required'),
  personality: z.string().min(10, 'Personality must be at least 10 characters').max(2000),
  tone: z.string().min(1, 'Tone is required'),
  locale: z.enum(['pt-BR', 'en']).default('pt-BR'),
  extraSoul: z.string().max(1000).optional(),
})

/** Schema for chat message */
export const chatMessageSchema = z.object({
  agentId: z.string().min(1),
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(10000),
})

/** Type exports */
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ApiKeyInput = z.infer<typeof apiKeySchema>
export type AgentInput = z.infer<typeof agentSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
