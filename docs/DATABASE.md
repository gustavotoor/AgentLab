# Database Schema

AgentLab uses PostgreSQL with Prisma ORM.

## Models

### User
- Authentication data (email, password hash)
- Preferences (locale, theme)
- BYOK (encrypted API key, masked key, validity flag)
- Onboarding state

### VerificationToken
- Multi-purpose token (email verification, password reset)
- Token stored as SHA-256 hash
- Type field: `EMAIL_VERIFICATION` | `PASSWORD_RESET`
- Supports `usedAt` to prevent reuse

### Agent
- Belongs to User
- Configuration: name, emoji, templateId, personality, tone, locale, extraSoul
- Generated: systemPrompt (built server-side), totalChats

### Conversation
- Belongs to Agent
- Optional title (set from first user message)

### Message
- Belongs to Conversation
- role: `user` | `assistant`
- content: full message text

## Migrations

```bash
# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name your-migration-name

# Deploy migrations (production)
npx prisma migrate deploy
```

## Prisma Studio

```bash
npx prisma studio
```
