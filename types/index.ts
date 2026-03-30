import type { Agent, Conversation, Message, User } from '@prisma/client'

/** Extended User type with relations */
export type UserWithRelations = User & {
  agents?: AgentWithRelations[]
}

/** Agent with conversation count */
export type AgentWithStats = Agent & {
  _count?: {
    conversations: number
  }
}

/** Agent with conversations */
export type AgentWithRelations = Agent & {
  conversations?: ConversationWithMessages[]
  _count?: {
    conversations: number
  }
}

/** Conversation with messages */
export type ConversationWithMessages = Conversation & {
  messages?: Message[]
  _count?: {
    messages: number
  }
}

/** Dashboard statistics */
export interface DashboardStats {
  totalAgents: number
  totalConversations: number
  totalMessages: number
  recentAgents: AgentWithStats[]
}

/** API response wrapper */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

/** Chat message format for the UI */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

/** Agent template type */
export interface AgentTemplate {
  id: string
  emoji: string
  name: string
  description: string
  categories: string[]
  personality: string
}

/** Locale types */
export type Locale = 'pt-BR' | 'en'
export type Theme = 'light' | 'dark' | 'system'
