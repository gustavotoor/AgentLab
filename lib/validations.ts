/**
 * Zod validation schemas for all forms in AgentLab.
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const agentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  emoji: z.string().optional().default("🤖"),
  templateId: z.string().min(1, "Template is required"),
  personality: z.string().min(10, "Personality must be at least 10 characters"),
  tone: z.enum(["formal", "casual", "technical", "friendly"]),
  locale: z.string().optional().default("pt-BR"),
  extraSoul: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export const apiKeySchema = z.object({
  apiKey: z.string().min(1, "API key is required").startsWith("sk-ant-", "Must be a valid Anthropic API key"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
