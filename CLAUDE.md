# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js 15)
npm run build        # Production build
npm run lint         # ESLint
npx prisma migrate dev   # Run DB migrations
npx prisma studio        # Open DB GUI
npx prisma generate      # Regenerate Prisma client (also runs on postinstall)
docker-compose up -d     # Start local PostgreSQL + Next.js
```

There is no test suite configured.

## Environment Setup

Copy `.env.example` to `.env.local`. Required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random base64 string (`openssl rand -base64 32`)
- `ENCRYPTION_KEY` — 64-char hex string (`openssl rand -hex 32`) for AES-256-GCM
- `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` — app base URL
- `SMTP_*` — email delivery for verification/password reset

## Architecture

**AgentLab** is a BYOK (Bring Your Own Key) AI chat platform. Users create custom AI agents backed by their own Anthropic API key.

### Route Groups

- `app/(public)/` — unauthenticated pages (landing, login, register, email verification, password reset)
- `app/(app)/` — protected pages (dashboard, agents CRUD, chat, settings, store, onboarding)
- `app/api/` — REST API routes

Protection is handled by NextAuth middleware in `middleware.ts`.

### Key `lib/` Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth v4 config — JWT strategy, credentials provider, custom session callbacks |
| `lib/db.ts` | Prisma singleton (prevents duplicate clients during hot reload) |
| `lib/crypto.ts` | AES-256-GCM encrypt/decrypt for API keys; `maskApiKey()` |
| `lib/ai.ts` | Factory functions `createAnthropicClient()` / `createModel()` that decrypt the user's stored API key |
| `lib/prompts.ts` | 8 agent templates + `buildSystemPrompt()` that assembles the final system prompt |
| `lib/validations.ts` | All Zod schemas (forms and API request bodies) |
| `lib/tokens.ts` | SHA-256 token generation and expiry for email/password flows |
| `lib/email.ts` | Nodemailer SMTP — `sendVerificationEmail()`, `sendPasswordResetEmail()` |

### Auth Flow

1. Register → SHA-256 email verification token → confirm via `/verify-email?token=`
2. Login → credentials checked, `emailVerified` required → JWT issued with custom fields (`onboardingDone`, `apiKeyValid`, `locale`, `theme`)
3. Password reset: `/forgot-password` → 1h token email → `/reset-password?token=`

Custom session fields are defined in `types/next-auth.d.ts`.

### BYOK API Key Flow

1. User POSTs key to `/api/user/api-key`
2. Server validates it (test call to Anthropic), encrypts with AES-256-GCM, stores encrypted + masked versions
3. At chat time: `lib/ai.ts` decrypts key → creates Anthropic client → calls Claude 3.5 Sonnet
4. Streaming via Vercel AI SDK `streamText()` → `toDataStreamResponse()`
5. Messages persisted in `onFinish` callback; `X-Conversation-Id` header sent to client

The API key never leaves the server unencrypted.

### Agent System Prompt

`lib/prompts.ts` builds `agent.systemPrompt` from: template personality + user-defined personality + tone + locale + optional `extraSoul`. The assembled prompt is stored in the `Agent` model at creation time.

### i18n

Cookie-based locale (no URL routing). Supported: `pt-BR` (default) and `en`. Config in `i18n/request.ts`; translations in `messages/`.

### Database Schema

4 main models with cascading deletes: `User → Agent → Conversation → Message`. `VerificationToken` for email/password flows (stored as SHA-256 hash; raw token sent by email).

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript · Prisma + PostgreSQL · NextAuth v4 (JWT) · Vercel AI SDK + `@ai-sdk/anthropic` · shadcn/ui + Radix UI · Tailwind CSS · next-intl · Framer Motion
