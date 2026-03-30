# Spec 07 — Settings
**Status:** Ready to implement  
**Priority:** P2  
**Estimated effort:** 2–3h  
**Depends on:** spec/00-architecture.md, spec/01-auth.md

---

## Purpose
Allow users to manage their account, API key, appearance preferences, and security settings.

---

## Behavior

### Tabs
- Account
- API Key
- Appearance
- Security

---

### Tab: Account
**Fields:**
- Name (text, required)
- Email (read-only, with note: "To change your email, contact support")
- Profile Photo (optional, upload)

**Actions:**
- "Save changes" button
- Success toast: "Profile updated"

**Profile Photo:**
- Upload button opens file picker
- Accepts: jpg, png, webp
- Max size: 2MB
- Stored in: `public/avatars/[userId].[ext]` or cloud storage (optional enhancement)
- Displayed in sidebar, topbar

---

### Tab: API Key
**Display:**
- Status indicator: ✅ Valid / ❌ Invalid or Missing
- If set: shows masked key `sk-ant-...xxxx`
- If not set: shows "No API key configured"

**Actions:**
- Input field: paste new API key
- "Validate" button → tests against Anthropic
- On success: encrypts + saves + shows masked version
- "Delete key" button (red, destructive) → clears `apiKeyEncrypted` + `apiKeyMasked` + sets `apiKeyValid = false`
- Confirmation modal for delete: "Delete API key? You won't be able to chat until you add a new one."

**Help text:**
- "Get your API key at console.anthropic.com"
- "Your key is encrypted and never stored in plain text."

---

### Tab: Appearance
**Fields:**
- Theme (Radio or toggle: Light / Dark / System)
- Language (Select: Português / English)

**Behavior:**
- Changes apply immediately (no save button)
- Theme toggle uses `next-themes` → updates `document.documentElement.classList`
- Language change updates user locale in DB + reloads with new language

---

### Tab: Security
**Fields:**
- Current Password (text)
- New Password (text + Eye toggle)
- Confirm New Password (text + Eye toggle)
- Password strength bar

**Actions:**
- "Update password" button
- On success: toast + keep user logged in (session persists)
- On error: inline error on current password field

**Delete Account:**
- Section at bottom (red/danger zone)
- "Delete account" button → confirmation modal:
  - "This will permanently delete your account, all agents, and all conversation history. This cannot be undone."
  - Input field: type "DELETE" to confirm
  - "Delete account" button (red, destructive)
- On confirm: cascade delete User → Agents → Conversations → Messages → clear session → redirect to landing page

---

## UI Specification

**Layout:**
- Centered form (max-width 600px)
- Tabs at top (horizontal, pill-style)
- Active tab: filled accent color
- Inactive: outlined

**Danger Zone (Delete Account):**
- Red border, light red background
- Clear warning text
- Final action requires typing "DELETE"

---

## API Specification

### PATCH /api/user/profile
**Request:**
```json
{ "name": "Gustavo", "image": "/avatars/clx123.jpg" }
```
**Response 200:** updated user

### POST /api/user/api-key
(Already defined in spec/02-onboarding.md)

### DELETE /api/user/api-key
**Response 204:** key deleted

### PATCH /api/user/appearance
**Request:**
```json
{ "theme": "dark", "locale": "pt-BR" }
```
**Response 200:** updated user

### PATCH /api/user/password
**Request:**
```json
{ "currentPassword": "old", "newPassword": "new12345" }
```
**Response 200:** `{ "message": "Password updated" }`  
**Response 400:** `{ "error": "Current password is incorrect" }`

### DELETE /api/user/account
**Request:**
```json
{ "confirmation": "DELETE" }
```
**Response 204:** account deleted, session cleared  
**Response 400:** `{ "error": "Confirmation does not match" }`

---

## Acceptance Criteria
- [ ] All 4 tabs render correctly
- [ ] Account tab saves name
- [ ] Account tab shows email (read-only)
- [ ] API Key tab validates and saves key
- [ ] API Key tab shows masked version after save
- [ ] API Key delete shows confirmation + clears key
- [ ] Appearance tab changes apply immediately
- [ ] Theme persists across reloads
- [ ] Language change reloads with new locale
- [ ] Security tab updates password
- [ ] Current password must match to change
- [ ] Delete account requires typing "DELETE"
- [ ] Delete account cascade deletes all related data
- [ ] After delete: session cleared + redirect to landing

## Edge Cases
- User uploads image > 2MB → validation error: "Image must be under 2MB"
- User uploads non-image file → validation error
- User enters wrong current password → inline error
- New password same as current → validation error
- Network error on save → shows error toast, preserves form data

## Definition of Done
All acceptance criteria checked. All tabs functional. API key encryption working. Account deletion cascades correctly. Theme and locale persist.
