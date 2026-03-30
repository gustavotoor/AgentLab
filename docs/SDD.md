# Software Design Document

## Architecture Overview

AgentLab is a Next.js 15 full-stack application using the App Router with React Server Components.

### Layers

```
Browser
  ↓ HTTP
Next.js App Router (middleware → route handler)
  ↓
Server Components / API Routes
  ↓
Prisma ORM
  ↓
PostgreSQL
```

External services:
- **Anthropic API** — via user's own API key (BYOK)
- **SMTP** — for email verification and password reset

## Key Architectural Decisions

### 1. BYOK Model
Users supply their own Anthropic API key. This avoids vendor lock-in and removes the need to manage billing. Keys are encrypted with AES-256-GCM server-side.

### 2. Cookie-Based i18n
No URL routing for locales. Locale is read from a `locale` cookie. This simplifies routing and avoids URL complexity.

### 3. JWT Sessions
NextAuth uses JWT strategy (no DB session table). Custom fields (onboardingDone, apiKeyValid, locale, theme) are encoded in the JWT and updated via `update()`.

### 4. Streaming Chat
Vercel AI SDK's `streamText` with `toDataStreamResponse()` provides real-time streaming. The `X-Conversation-Id` response header communicates the created conversation ID to the client.

### 5. Standalone Output
`output: 'standalone'` in next.config.ts allows the Docker image to be minimal (no node_modules copy).

## Data Flow: Chat Message

1. User types message in `ChatWindow`
2. POST to `/api/chat` with `{ agentId, conversationId, message }`
3. Server verifies agent ownership
4. Server decrypts API key from user record
5. Server creates conversation if needed
6. Server saves user message to DB
7. Server calls `streamText(anthropicModel, systemPrompt, history + userMessage)`
8. Response streams back to client via `toDataStreamResponse()`
9. Client reads stream, renders streaming assistant message
10. On `onFinish`: server saves assistant message, sets conversation title, increments chat count

## Security

- Passwords: bcryptjs with cost factor 12
- API keys: AES-256-GCM, random IV per encryption
- Tokens: SHA-256 hash stored (raw sent via email)
- Session: HttpOnly JWT cookie
- Route protection: NextAuth middleware
- Input validation: Zod schemas on all API routes
