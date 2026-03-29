# Spec 01 — Authentication
**Status:** Ready to implement  
**Priority:** P0 — Blocks all other features  
**Estimated effort:** 4–6h  
**Depends on:** spec/00-architecture.md

---

## Purpose
Implement the full authentication system: registration with email confirmation, login, password recovery, and route protection. The auth system must be secure, user-friendly, and visually polished.

---

## Behavior

### Registration Flow
1. User visits `/register`
2. Fills: name, email, password, confirm password
3. Submits → API validates → creates User with `emailVerified: null`
4. System generates SHA-256 token → saves as `VerificationToken` (type: `email-verification`, expires: 24h)
5. System sends confirmation email with link: `[APP_URL]/verify-email?token=[TOKEN]`
6. User is redirected to `/verify-email` (pending confirmation screen)
7. User clicks link in email → `/verify-email?token=[TOKEN]`
8. API validates token (exists, not expired, not used) → sets `emailVerified: now()`, marks token as used
9. User sees success screen → auto-redirect to `/onboarding` after 2 seconds

### Login Flow
1. User visits `/login`
2. Fills: email, password
3. Submits → NextAuth validates credentials
4. If `emailVerified` is null → reject with error: "Please confirm your email. [Resend confirmation]"
5. If password wrong → generic error: "Invalid email or password"
6. If valid → session created → redirect to `/dashboard`

### Forgot Password Flow
1. User clicks "Forgot password?" on `/login`
2. Redirected to `/forgot-password`
3. Fills email → submits
4. If email exists: generate SHA-256 token → save as `VerificationToken` (type: `password-reset`, expires: 1h) → send email
5. If email does NOT exist: same response (security — don't leak which emails exist)
6. User sees success screen regardless
7. User clicks link: `[APP_URL]/reset-password?token=[TOKEN]`
8. API validates token → shows reset form
9. User enters new password + confirm → submits
10. API updates password hash → marks token as used → redirect to `/login` with success toast

### Resend Confirmation Email
- Available on `/verify-email` screen
- Cooldown: 60 seconds between resends (enforced client-side + server-side rate limit)
- Creates new token (invalidates previous one for same user)

### Route Protection
- Middleware checks session on every request to `/(app)/*`
- Unauthenticated → redirect to `/login?callbackUrl=[original-url]`
- After login → redirect to `callbackUrl` or `/dashboard`
- Authenticated user visiting `/login` or `/register` → redirect to `/dashboard`

---

## UI Specification

### `/login` — Design: Split Layout

**Left panel (brand side):**
- Dark gradient background (`#0A0A0F` to `#1A1A2E`)
- AgentLab logo (top-left)
- Headline: "Your agents. Your rules." (large, bold, serif or display font)
- Subline: "Build and chat with AI agents tailored to you."
- Animated floating agent cards (3 cards, parallax on mouse move or CSS float animation)
- Bottom: social proof — "Join X+ users" or feature bullets

**Right panel (form side):**
- White/off-white background
- Centered form card (max-width 400px)
- "Welcome back" heading
- Email input with label
- Password input with Eye/EyeOff toggle button (Lucide icons)
- "Forgot password?" link (right-aligned, below password field)
- Submit button: "Sign in" — full width, with loading spinner
- Divider: "or"
- "Don't have an account? Create one" link
- Error state: field border turns red + error message below field
- Framer Motion: form card fades in + slides up on mount

**Responsive (mobile):**
- Left panel hidden
- Form centered on full screen with subtle gradient background

### `/register` — Design: Same split, mirrored

**Left panel:** same brand side  
**Right panel:**
- "Create your account" heading
- Name input
- Email input
- Password input + Eye/EyeOff toggle + password strength bar (4 levels: weak/fair/good/strong)
- Confirm password input + Eye/EyeOff toggle
- Submit button: "Create account" with spinner
- "Already have an account? Sign in" link
- Error states inline per field

### `/verify-email` (pending screen)

- Centered card, full-screen gradient background
- Animated email envelope icon (CSS bounce or Framer Motion)
- Heading: "Check your inbox"
- Body: "We sent a confirmation email to [EMAIL]. Click the link to activate your account."
- Resend button with 60s countdown: "Resend email (59s)"
- "Wrong email? Go back" link

### `/verify-email?token=xxx` (token validation)

- Auto-validates on page load (no button needed)
- Loading state: spinner + "Validating..."
- Success state: green checkmark animation (Framer Motion scale) + "Account confirmed! Redirecting..."
- Error state: red X + "Link expired or invalid." + "Request new link" button

### `/forgot-password`

- Centered card
- Heading: "Reset your password"
- Body: "Enter your email and we'll send you a link to reset your password."
- Email input + submit button
- After submit: success state — envelope icon + "Check your email"
- "Back to login" link

### `/reset-password?token=xxx`

- Auto-validates token on load
- If invalid: error card with "Back to login" link
- If valid: reset form
  - New password + Eye/EyeOff
  - Confirm password + Eye/EyeOff
  - Password strength bar
  - Submit button: "Reset password"
- After success: redirect to `/login` + toast: "Password updated! Sign in."

---

## API Specification

### POST /api/auth/register
**Request:**
```json
{ "name": "Gustavo", "email": "g@example.com", "password": "min8chars" }
```
**Response 201:**
```json
{ "message": "Confirmation email sent" }
```
**Response 400:** validation errors  
**Response 409:** "Email already registered"

### POST /api/auth/verify-email
**Request:**
```json
{ "token": "sha256-token-string" }
```
**Response 200:**
```json
{ "message": "Email confirmed" }
```
**Response 400:** "Token expired" | "Token already used" | "Invalid token"

### POST /api/auth/resend-verification
**Request:**
```json
{ "email": "g@example.com" }
```
**Response 200:** always (don't leak if email exists)  
**Rate limit:** 1 request per 60 seconds per IP

### POST /api/auth/forgot-password
**Request:**
```json
{ "email": "g@example.com" }
```
**Response 200:** always (don't leak existence)

### POST /api/auth/reset-password
**Request:**
```json
{ "token": "sha256-token", "password": "newpassword" }
```
**Response 200:** `{ "message": "Password updated" }`  
**Response 400:** "Token expired" | "Invalid token" | validation errors

---

## Security Requirements
- Passwords hashed with bcryptjs (cost factor: 12)
- Tokens are SHA-256 hashes of random 32-byte values
- Raw token is sent in email link, hash stored in DB (so DB leak doesn't expose tokens)
- Password reset tokens expire in 1h
- Email confirmation tokens expire in 24h
- Tokens are single-use (marked `usedAt` on first use)
- "Forgot password" and "Resend verification" never reveal if email exists (same response either way)
- Login error message is always generic: "Invalid email or password"

---

## Acceptance Criteria
- [ ] User can register with valid email + password
- [ ] Duplicate email registration returns 409
- [ ] Confirmation email is received with working link
- [ ] Clicking link confirms account and redirects to onboarding
- [ ] Expired token (24h+) shows error with option to resend
- [ ] Already-used token shows clear error
- [ ] User cannot login without confirming email
- [ ] "Forgot password" sends email (or silently succeeds if email not found)
- [ ] Password reset link works once, then shows "already used"
- [ ] Reset link expired after 1h
- [ ] Password Eye/EyeOff toggle works on all password fields
- [ ] Middleware redirects unauthenticated users to /login
- [ ] Middleware redirects authenticated users away from /login and /register
- [ ] callbackUrl is respected after login

## Edge Cases
- User registers but never confirms → can resend after 60s, token expires in 24h
- User requests multiple password resets → only latest token is valid
- User tries to access reset link after already resetting → "already used" error
- User submits login with wrong password 5 times → (phase 2: rate limit; MVP: no lockout)
- Email delivery fails → log error, return 500 with user-friendly message

## Definition of Done
All acceptance criteria checked. Auth flow works end-to-end in browser. Emails received with working links. Route protection working. No TypeScript errors.
