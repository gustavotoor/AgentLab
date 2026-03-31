# Spec 02 — Onboarding
**Status:** Implemented
**Priority:** P1  
**Estimated effort:** 2–3h  
**Depends on:** spec/01-auth.md

---

## Purpose
Guide new users through first-time setup after email confirmation: welcome screen, profile, and API key. The goal is to get them to their first agent as fast as possible while collecting what's needed to use the app.

---

## Behavior

### When does onboarding trigger?
- After successful email confirmation → redirect to `/onboarding`
- If user logs in and `onboardingDone = false` → redirect to `/onboarding`
- If `onboardingDone = true` → skip to `/dashboard`

### Onboarding Steps
3 steps with a progress indicator at the top.

**Step 1 — Welcome**
- Displays: logo, "Welcome to AgentLab, [NAME]!", brief explanation of what AgentLab does
- 3 feature highlights: Create Agents / Chat / BYOK
- Single CTA button: "Get Started →"
- No data collected, no validation

**Step 2 — Profile**
- Fields:
  - Display Name (pre-filled with name from registration, editable)
  - Language preference (Select: Português / English) — sets `locale`
- CTA: "Continue →"
- Back button: returns to step 1

**Step 3 — API Key**
- Explanation: "AgentLab uses your own Anthropic API key to power your agents. This keeps your usage private and under your control."
- Link: "Get your API key at console.anthropic.com →" (opens in new tab)
- Input field: paste API key
- Validate button: checks key against Anthropic API
  - Loading state while validating
  - Success: green checkmark + "Key is valid ✓"
  - Error: red X + "Invalid key. Check it and try again."
- Skip option: "I'll add this later" (grayed text link below button)
- CTA: "Finish setup →" (enabled with valid key OR after skip)

### After Onboarding
- Sets `onboardingDone = true` in DB
- Saves `locale` preference
- Saves API key (encrypted) if provided
- Redirects to `/agents/new` (directly to create first agent)
- If skipped API key: redirect to `/dashboard` with a reminder banner "Add your API key in Settings to start chatting"

---

## UI Specification

**Layout:**
- Full-screen centered card (max-width 560px)
- Subtle gradient or pattern background
- Progress bar at top showing step X of 3
- Step number indicator: "Step 1 of 3"
- Animated transitions between steps (slide left/right)

**Progress indicator:**
- 3 circles connected by line
- Active: filled accent color
- Completed: filled with checkmark
- Future: outlined/gray

**Navigation:**
- "Back" button (left) — goes to previous step
- "Continue" / "Finish" button (right) — primary action
- Step 1 has no Back button
- Skip option on step 3 only

---

## API Specification

### PATCH /api/user/profile (used in step 2)
**Request:**
```json
{ "name": "Gustavo", "locale": "pt-BR" }
```
**Response 200:**
```json
{ "id": "...", "name": "Gustavo", "locale": "pt-BR" }
```

### POST /api/user/api-key (used in step 3)
**Request:**
```json
{ "apiKey": "sk-ant-api03-..." }
```
**Behavior:**
1. Validates format (starts with `sk-ant-`)
2. Makes test call to Anthropic API (`/messages` with minimal input)
3. If valid: encrypts key → saves `apiKeyEncrypted` + `apiKeyMasked` + `apiKeyValid: true`
4. Returns success or error

**Response 200:**
```json
{ "valid": true, "maskedKey": "sk-ant-...xxxx" }
```
**Response 400:**
```json
{ "valid": false, "error": "Invalid API key" }
```

### POST /api/user/complete-onboarding
**Request:** empty body  
**Response 200:**
```json
{ "onboardingDone": true }
```

---

## Acceptance Criteria
- [ ] User with `onboardingDone: false` is redirected to `/onboarding` on login
- [ ] Step 1 shows welcome with user's name
- [ ] Step 2 saves name + locale preference
- [ ] Step 3 validates API key against Anthropic
- [ ] Valid key shows green confirmation
- [ ] Invalid key shows error without crashing
- [ ] "Skip" bypasses API key step
- [ ] After finishing, `onboardingDone` is set to `true`
- [ ] Progress indicator shows correct step
- [ ] Transitions between steps are animated
- [ ] User can go back from step 2 or 3
- [ ] Authenticated users with `onboardingDone: true` are never shown onboarding again

## Edge Cases
- User refreshes on step 2 → stays on step 2 (state maintained or resets to step 1)
- User has no API key at end → shows reminder banner on dashboard
- Anthropic API is down during key validation → shows "Could not validate. Try again later. Skip for now."

## Definition of Done
All acceptance criteria checked. Onboarding completes end-to-end. API key saves and validates correctly. Locale preference persists.
