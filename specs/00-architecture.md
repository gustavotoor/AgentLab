# Spec 00 — Architecture & Foundation
**Status:** Implemented
**Priority:** P0 — Must be done first  
**Estimated effort:** 2–3h

---

## Purpose
Define the technical foundation of AgentLab: stack, folder structure, database schema, environment variables, and Docker setup. Everything else is built on top of this spec.

---

## Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js (App Router) | 16.x | Full-stack, server components, streaming support |
| Language | TypeScript | 6.x | Type safety, better DX, required for portfolio |
| Styling | Tailwind CSS | 4.x | Utility-first, fast, well-known |
| Components | shadcn/ui | latest | Copy-paste components, fully customizable |
| Icons | Lucide React | latest | Consistent icon set |
| Animations | Framer Motion | latest | Production-grade animations |
| ORM | Prisma | 7.x | Type-safe DB access, auto-migrations |
| Database | PostgreSQL | 15+ | Relational, production-proven |
| Auth | NextAuth.js | 4.x | Session management, Prisma adapter |
| AI | Vercel AI SDK | 6.x | Streaming, multi-provider, BYOK-friendly |
| AI Provider | @ai-sdk/anthropic | 3.x | Claude models |
| Email | Nodemailer + Resend | latest | SMTP fallback + Resend for production |
| Encryption | Node.js crypto (built-in) | — | AES-256-GCM for API keys |
| Hashing | bcryptjs | 3.x | Password hashing |
| i18n | next-intl | 4.x | PT-BR default + EN |
| Themes | next-themes | 0.4.x | Light/dark/system, SSR-safe |
| Validation | Zod | 3.x | Runtime schema validation |
| HTTP client | Native fetch | — | Built into Next.js |

---

## Folder Structure

```
AgentLab/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth)
│   │   ├── page.tsx              # Landing page /
│   │   ├── login/page.tsx        # /login
│   │   ├── register/page.tsx     # /register
│   │   ├── verify-email/         # /verify-email
│   │   ├── forgot-password/      # /forgot-password
│   │   └── reset-password/       # /reset-password
│   ├── (app)/                    # Protected routes (auth required)
│   │   ├── layout.tsx            # App shell (sidebar + topbar)
│   │   ├── onboarding/           # /onboarding
│   │   ├── dashboard/            # /dashboard
│   │   ├── store/                # /store
│   │   ├── agents/               # /agents
│   │   │   ├── new/              # /agents/new
│   │   │   └── [id]/             # /agents/[id] (chat)
│   │   │       └── edit/         # /agents/[id]/edit
│   │   └── settings/             # /settings
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Auth endpoints
│   │   ├── user/                 # User profile + API key
│   │   ├── agents/               # Agent CRUD
│   │   ├── chat/                 # Chat streaming
│   │   └── conversations/        # Conversation history
│   ├── globals.css
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── auth/                     # Auth-specific components
│   ├── agents/                   # AgentCard, AgentForm, TemplateCard
│   ├── chat/                     # ChatWindow, MessageBubble, ChatInput
│   ├── layout/                   # Sidebar, TopBar, MobileNav
│   └── shared/                   # LoadingSpinner, EmptyState, etc.
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma client singleton
│   ├── crypto.ts                 # AES-256-GCM encrypt/decrypt
│   ├── email.ts                  # Email sender (SMTP + Resend)
│   ├── tokens.ts                 # Token generation + verification
│   ├── prompts.ts                # System prompt builder
│   ├── ai.ts                     # Anthropic client factory (BYOK)
│   └── validations.ts            # Zod schemas
├── messages/
│   ├── pt-BR.json                # Portuguese translations
│   └── en.json                   # English translations
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
├── specs/                        # This folder — SDD specs
├── docs/                         # Technical documentation
├── public/                       # Static assets
├── types/
│   └── index.ts                  # Shared TypeScript types
├── hooks/
│   ├── use-theme.ts
│   └── use-locale.ts
├── .env.example                  # All env vars documented
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Database Schema

### Users
Stores account info, preferences, and encrypted API key.

```
User {
  id                String   PK, cuid
  email             String   UNIQUE
  name              String?
  password          String?  bcrypt hash
  image             String?  URL
  emailVerified     DateTime? null = unconfirmed
  apiKeyEncrypted   String?  AES-256-GCM encrypted
  apiKeyMasked      String?  "sk-ant-...xxxx"
  apiKeyValid       Boolean  default false
  onboardingDone    Boolean  default false
  locale            String   default "pt-BR"
  theme             String   default "light"
  createdAt         DateTime default now()
  updatedAt         DateTime @updatedAt
}
```

### VerificationTokens
Handles email confirmation and password reset tokens.

```
VerificationToken {
  id        String   PK, cuid
  userId    String   FK → User
  token     String   UNIQUE, SHA-256 hash
  type      String   "email-verification" | "password-reset"
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime default now()
}
```

### Agents
User-created AI agents with their configuration.

```
Agent {
  id           String   PK, cuid
  userId       String   FK → User
  name         String
  emoji        String   default "🤖"
  templateId   String   e.g. "personal-assistant"
  personality  String   user-defined textarea
  tone         String   "formal"|"casual"|"technical"|"friendly"
  locale       String   default "pt-BR"
  extraSoul    String?  additional instructions
  systemPrompt String   generated full system prompt
  totalChats   Int      default 0
  createdAt    DateTime default now()
  updatedAt    DateTime @updatedAt
}
```

### Conversations
Chat sessions between user and agent.

```
Conversation {
  id        String   PK, cuid
  agentId   String   FK → Agent
  title     String?  auto-generated from first message
  createdAt DateTime default now()
}
```

### Messages
Individual messages in a conversation.

```
Message {
  id             String   PK, cuid
  conversationId String   FK → Conversation
  role           String   "user" | "assistant"
  content        String
  createdAt      DateTime default now()
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/agentlab"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""           # openssl rand -base64 32

# Encryption (for user API keys)
ENCRYPTION_KEY=""            # openssl rand -hex 32

# Email
EMAIL_PROVIDER="smtp"        # smtp | resend
EMAIL_FROM="AgentLab <no-reply@agentlab.dev>"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
RESEND_API_KEY=""            # if EMAIL_PROVIDER=resend

# Anthropic (optional fallback for demo)
ANTHROPIC_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="AgentLab"
```

---

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] `npx prisma migrate dev` creates all tables
- [ ] `npm run build` completes without TypeScript errors
- [ ] `docker compose up` starts app + postgres
- [ ] App is accessible at `localhost:3000`
- [ ] All env vars in `.env.example` are documented with comments
- [ ] Tailwind + shadcn/ui renders correctly
- [ ] next-intl serves PT-BR by default
- [ ] next-themes applies light theme by default

## Edge Cases
- DATABASE_URL not set → app should fail fast with clear error message
- NEXTAUTH_SECRET not set → NextAuth throws on session operations
- Missing SMTP config with EMAIL_PROVIDER=smtp → email operations fail gracefully with logged error

## Definition of Done
All acceptance criteria checked. `npm run build` exits 0. Docker Compose brings up both services and app responds to `GET /`.

---

## ⚡ Post-Build Additions

> These items were **not in the original spec** and were added after the initial build was complete.

### New Database Fields

**User model:**
- `openaiKeyEncrypted String?` — AES-256-GCM encrypted OpenAI API key
- `openaiKeyMasked String?` — "sk-...xxxx" masked version
- `openaiKeyValid Boolean @default(false)` — validity flag

**Agent model:**
- `provider String @default("anthropic")` — AI provider: `"anthropic"` | `"openai"`
- `model String @default("claude-sonnet-4-6")` — selected model ID (dynamic per-agent)
- `langGraphEnabled Boolean @default(false)` — toggles LangGraph lab mode
- `availableTools String[] @default([])` — list of tools available to the LangGraph agent

### New Services

- **Python FastAPI backend** at `backend/` (port 8000 in Docker) — handles LangGraph graph execution. Has its own `Dockerfile.backend` and is included in `docker-compose.yml`.
- **Langfuse observability** — optional self-hosted stack via `docker-compose.langfuse.yml`

### New Folder Structure Entries

```
backend/                          # Python FastAPI + LangGraph microservice
├── main.py
├── requirements.txt
├── Dockerfile
├── agent/                        # LangGraph graph nodes
├── observability/                # Langfuse integration
├── security/                     # Auth middleware
└── streaming/                    # SSE protocol handlers

components/
└── lab/                          # LangGraph lab UI components
    ├── LabPanel.tsx
    ├── ExecutionLog.tsx
    ├── GraphDiagram.tsx
    └── ObservabilityPanel.tsx

hooks/
├── useAgentStream.ts             # SSE stream consumption hook
└── useLogAnimation.ts            # Terminal log animation hook

types/
└── agent-stream.ts               # SSE event types

lib/
└── sanitizer.ts                  # HTML/content sanitization

app/api/
├── chat/langgraph/route.ts       # LangGraph SSE bridge
└── models/route.ts               # Dynamic model list (Anthropic + OpenAI)
```

### New Environment Variables

```env
# OpenAI (optional — for multi-provider BYOK)
OPENAI_API_KEY=""                # Only needed if user brings OpenAI key

# LangGraph backend
LANGGRAPH_BACKEND_URL="http://localhost:8000"

# Langfuse observability (optional)
LANGFUSE_PUBLIC_KEY=""
LANGFUSE_SECRET_KEY=""
LANGFUSE_HOST="http://localhost:3005"
```

> See spec 10 (Multi-Provider) and spec 11 (LangGraph Lab) for full details.
