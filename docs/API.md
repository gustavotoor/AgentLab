# API Reference

All API routes require authentication via NextAuth session unless noted.

## Authentication

### POST /api/auth/register
Create a new account. Sends verification email.
- Body: `{ name, email, password }`

### GET /api/auth/verify-email?token=...
Verify email address. Token is from verification email.

### POST /api/auth/resend-verification
Resend verification email.
- Body: `{ email }`

### POST /api/auth/forgot-password
Request password reset email.
- Body: `{ email }`

### POST /api/auth/reset-password
Reset password with token.
- Body: `{ token, password, confirmPassword }`

## User

### GET /api/user/profile
Get current user profile.

### PATCH /api/user/profile
Update profile fields.
- Body: `{ name?, locale?, theme? }`

### POST /api/user/api-key
Save Anthropic API key (encrypted).
- Body: `{ apiKey }`

### DELETE /api/user/api-key
Remove stored API key.

### POST /api/user/password
Change password.
- Body: `{ currentPassword, newPassword, confirmPassword }`

### DELETE /api/user/delete
Permanently delete account and all data.

### POST /api/user/complete-onboarding
Mark onboarding as complete.

## Agents

### GET /api/agents
List all agents for current user.

### POST /api/agents
Create a new agent.
- Body: `{ name, emoji, templateId, personality, tone, locale, extraSoul? }`

### GET /api/agents/[id]
Get agent by ID.

### PATCH /api/agents/[id]
Update agent.
- Body: Partial agent fields.

### DELETE /api/agents/[id]
Delete agent and all conversations.

### POST /api/agents/[id]/duplicate
Duplicate an agent.

## Chat

### POST /api/chat
Send a message (streaming response).
- Body: `{ agentId, conversationId?, message }`
- Response: Server-Sent Events stream (Vercel AI SDK format)
- Headers: `X-Conversation-Id` with the conversation ID

## Conversations

### GET /api/conversations/[agentId]
List all conversations for an agent.

### GET /api/conversations/[agentId]/[conversationId]
Get messages in a conversation.

### DELETE /api/conversations/[agentId]/[conversationId]
Delete a conversation.

## Dashboard

### GET /api/dashboard
Get dashboard statistics (agent count, conversation count, message count, recent agents).
