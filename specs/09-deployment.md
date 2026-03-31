# Spec 09 — Deployment & Documentation
**Status:** Implemented
**Priority:** P2  
**Estimated effort:** 2h  
**Depends on:** All other specs

---

## Purpose
Provide everything needed to deploy AgentLab on Dokploy and document the project for future developers (and portfolio viewers).

---

## Deployment

### Dockerfile (multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

**Requirements:**
- `output: 'standalone'` in `next.config.ts`
- Prisma client generated at build time
- Static files copied manually

### docker-compose.yml

```yaml
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://agentlab:agentlab@db:5432/agentlab
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - EMAIL_PROVIDER=smtp
      - EMAIL_FROM=${EMAIL_FROM}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=agentlab
      - POSTGRES_PASSWORD=agentlab
      - POSTGRES_DB=agentlab
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agentlab"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Dokploy Deployment Steps
1. Connect GitHub repo to Dokploy
2. Set environment variables in Dokploy dashboard
3. Set build context: `/`
4. Set Dockerfile path: `Dockerfile`
5. Expose port: `3000`
6. Add persistent volume for postgres (if using compose)
7. Deploy
8. Run migrations: `npx prisma migrate deploy` (via Dokploy console or entrypoint script)

---

## Documentation

### README.md (root)

**Structure:**
```markdown
# AgentLab

## What is this?
One-paragraph description

## Tech Stack
Table with links

## Architecture Overview
Mermaid diagram or ASCII

## Project Structure
Every folder and file explained

## Getting Started
5 commands to run locally

## Environment Variables
Every var documented

## Database Schema
Tables, fields, relationships

## Authentication Flow
Step-by-step with diagrams

## BYOK — How it works
Security explanation

## Email System
SMTP vs Resend config

## i18n
How to add languages

## Theming
Light/dark implementation

## Docker & Deploy
Dokploy step by step

## API Reference
All endpoints

## Key Technical Decisions
Why X over Y

## Credits
Built by Gustavo Karsten
```

### docs/ folder

| File | Content |
|------|---------|
| `docs/AUTH.md` | Full auth flow: registration, email confirm, password reset, session |
| `docs/BYOK.md` | API key encryption: AES-256-GCM, key derivation, storage |
| `docs/DATABASE.md` | Schema with ER diagram (ASCII), migrations |
| `docs/DEPLOYMENT.md` | Dokploy setup, environment, troubleshooting |
| `docs/PROMPTS.md` | System prompt generation logic |
| `docs/EMAIL.md` | SMTP and Resend setup guides |
| `docs/API.md` | Every endpoint with request/response examples |
| `docs/COMPONENTS.md` | Every React component documented |
| `docs/SDD.md` | Spec-driven development methodology used in this project |

### docs/SDD.md Content

```markdown
# Spec-Driven Development

This project follows SDD methodology.

## What is SDD?
Brief explanation (from research)

## Why SDD?
Benefits for AI-assisted development

## Our Implementation
- specs/ folder with 9 spec files
- Each spec: Purpose, Behavior, Acceptance Criteria, Edge Cases, DoD
- PRD.md as high-level vision

## Workflow
1. Write spec for feature
2. Review spec
3. Implement from spec
4. Validate against acceptance criteria
5. Mark spec as "Done"

## Files
- [PRD.md](../PRD.md) — Product vision
- [specs/00-architecture.md](../specs/00-architecture.md)
- [specs/01-auth.md](../specs/01-auth.md)
- ... (all specs linked)
```

---

## Acceptance Criteria
- [ ] Dockerfile builds successfully
- [ ] docker-compose up brings up app + postgres
- [ ] App accessible on localhost:3000
- [ ] Migrations run on container start (or documented how)
- [ ] README.md follows full structure
- [ ] All 9 docs/ files created with content
- [ ] docs/SDD.md explains the methodology
- [ ] Every spec linked in docs/SDD.md
- [ ] .env.example has all variables with comments
- [ ] No hardcoded secrets anywhere

## Edge Cases
- Docker build fails on M1 Mac → ensure platform flags correct
- Postgres doesn't start → healthcheck retries
- Migration fails on fresh DB → Prisma migrate deploy handles

## Definition of Done
Docker builds and runs. README is comprehensive. All docs written. SDD methodology documented. Ready for portfolio presentation.
