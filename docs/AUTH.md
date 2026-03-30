# Authentication

AgentLab uses NextAuth.js v4 with a custom Credentials provider.

## Flow

1. **Registration**: User fills form → POST /api/auth/register → creates User + VerificationToken → sends email
2. **Email verification**: User clicks link → GET /api/auth/verify-email?token=... → marks emailVerified
3. **Login**: POST credentials → NextAuth authorize callback → checks emailVerified → returns JWT
4. **Session**: JWT stored in cookie, exposed to client via useSession()

## Token Types

- `EMAIL_VERIFICATION` — 24-hour expiry
- `PASSWORD_RESET` — 1-hour expiry

Tokens are stored as SHA-256 hashes in the database. Raw tokens are only sent via email.

## Session Fields

Custom fields added to the NextAuth session:
- `user.id` — Database user ID
- `user.onboardingDone` — Whether onboarding is complete
- `user.apiKeyValid` — Whether an API key is configured
- `user.locale` — User's preferred locale
- `user.theme` — User's preferred theme

## Route Protection

Middleware (`middleware.ts`) uses `withAuth` from `next-auth/middleware`:
- Unauthenticated requests to `/(app)/*` redirect to `/login`
- Authenticated users visiting auth pages redirect to `/dashboard`
