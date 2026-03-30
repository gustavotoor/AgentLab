# AgentLab

Build and chat with custom AI agents powered by your own Anthropic API key.

## Features

- **BYOK** — Bring Your Own Key: use your Anthropic API key, pay Anthropic directly
- **8 Agent Templates** — Personal assistant, consultant, professor, copywriter, dev helper, life coach, support agent, free agent
- **Custom Personalities** — Define tone, personality, language, and extra instructions
- **Persistent Chat History** — All conversations saved per agent
- **Multilingual** — PT-BR (default) and English, cookie-based locale switching
- **Dark/Light/System Themes** — Powered by next-themes
- **Secure Key Storage** — AES-256-GCM encryption for API keys
- **Email Verification** — Secure registration flow with token-based verification

## Tech Stack

- **Next.js 15** — App Router, React Server Components, standalone output
- **TypeScript** — Strict mode throughout
- **Tailwind CSS + shadcn/ui** — Component library
- **Prisma 6 + PostgreSQL** — Database ORM
- **NextAuth.js v4** — JWT-based authentication
- **Vercel AI SDK v4** — Streaming chat with `@ai-sdk/anthropic`
- **next-intl** — i18n without URL routing
- **Framer Motion** — Animations
- **bcryptjs** — Password hashing
- **AES-256-GCM** — API key encryption

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Anthropic API key (users bring their own)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random secret (32+ chars)
- `NEXTAUTH_URL` — Your app URL
- `ENCRYPTION_KEY` — 64-char hex key for AES-256-GCM

Generate secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32
```

### Development

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Start dev server
npm run dev
```

### Docker

```bash
# Set required env vars in .env
docker-compose up -d
```

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── (public)/          # Public pages (landing, auth)
├── (app)/             # Protected app pages
└── api/               # API routes

components/
├── ui/                # shadcn/ui components
├── auth/              # Auth forms and layout
├── agents/            # Agent cards and forms
├── chat/              # Chat UI components
├── layout/            # Sidebar and TopBar
├── settings/          # Settings tabs
└── shared/            # Shared utilities

lib/
├── auth.ts            # NextAuth config
├── db.ts              # Prisma singleton
├── crypto.ts          # AES-256-GCM
├── tokens.ts          # Token generation
├── email.ts           # Email sender
├── prompts.ts         # System prompt builder
├── ai.ts              # Anthropic client
├── validations.ts     # Zod schemas
└── utils.ts           # Utilities
```

## License

MIT
