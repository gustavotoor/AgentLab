# Spec 10 — Multi-Provider BYOK
**Status:** Implemented (post-build)
**Priority:** P1
**Added:** After initial build — not in original spec
**Depends on:** spec/00-architecture.md, spec/02-onboarding.md, spec/07-settings.md

---

## Purpose
Extend the BYOK architecture to support **OpenAI** alongside Anthropic. Users can add both keys and choose the provider (and specific model) per agent. This was driven by the desire to let portfolio reviewers who have OpenAI keys but not Anthropic keys also test the platform.

---

## Behavior

### User-Level Changes (Settings)

**New "OpenAI Key" section in Settings → API Key tab:**
- Paste OpenAI API key → validate → encrypt and store
- Status indicator (Valid/Invalid/Missing)
- Masked display: `sk-...xxxx`
- Delete key option

Both keys (Anthropic + OpenAI) coexist independently.

### Agent-Level Changes (CRUD)

**Provider selector** in agent creation/edit form:
- Shown only when at least one key is configured
- Options: `Anthropic` | `OpenAI`
- Switching provider resets model selection

**Model selector** (dynamic, per-provider):
- Calls `GET /api/models?provider=[provider]`
- Anthropic: returns Opus + Sonnet families (no Haiku)
- OpenAI: returns GPT-5.x, o3, o4 families only (no legacy models)
- Default model: `claude-sonnet-4-6` for Anthropic

### Chat Routing

At chat time:
1. `agent.provider` determines which BYOK key to decrypt
2. `agent.model` determines which model to call
3. `lib/ai.ts` creates the appropriate provider client (Anthropic or OpenAI via `@ai-sdk/openai`)
4. Same Vercel AI SDK `streamText()` call — provider-agnostic

For LangGraph mode: `app/api/chat/langgraph/route.ts` also reads `agent.provider` + `agent.model` and forwards them to the Python backend inside `agent_config`.

---

## Database Changes

**User model additions:**
```prisma
openaiKeyEncrypted  String?
openaiKeyMasked     String?
openaiKeyValid      Boolean  @default(false)
```

**Agent model additions:**
```prisma
provider  String  @default("anthropic")  // "anthropic" | "openai"
model     String  @default("claude-sonnet-4-6")
```

---

## API Specification

### POST /api/user/openai-key
**Request:**
```json
{ "key": "sk-..." }
```
**Behavior:**
1. Validates format (starts with `sk-`)
2. Test call: `GET https://api.openai.com/v1/models` with the key
3. On success: AES-256-GCM encrypt → store `openaiKeyEncrypted` + `openaiKeyMasked` + `openaiKeyValid = true`

**Response 200:**
```json
{ "masked": "sk-...xxxx", "valid": true }
```
**Response 400:** `{ "error": "Invalid OpenAI API key" }`

### DELETE /api/user/openai-key
Clears `openaiKeyEncrypted`, `openaiKeyMasked`, sets `openaiKeyValid = false`.
**Response 204**

### GET /api/models?provider=anthropic|openai
**Behavior:**
1. Authenticates user
2. Decrypts appropriate BYOK key for the requested provider
3. Calls provider's model list API
4. Filters to agentic-capable models only:
   - Anthropic: `claude-*` models excluding Haiku
   - OpenAI: `gpt-5.x`, `o3`, `o4` families only
5. Returns formatted list

**Response 200:**
```json
{
  "data": [
    { "id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "provider": "anthropic" },
    { "id": "claude-opus-4-6", "name": "Claude Opus 4.6", "provider": "anthropic" }
  ]
}
```
**Response 402:** No API key configured for this provider

---

## Acceptance Criteria
- [ ] OpenAI key can be added, validated, and deleted in Settings
- [ ] Agent form shows provider selector when keys are configured
- [ ] Model list updates when provider changes
- [ ] Switching provider defaults to appropriate model
- [ ] Chat works with both Anthropic and OpenAI agents
- [ ] LangGraph mode respects agent provider/model selection
- [ ] Invalid OpenAI key shows error
- [ ] Provider-specific error messages in chat if key is missing/invalid

## Edge Cases
- User has only Anthropic key: OpenAI option hidden in provider selector
- User has only OpenAI key: Anthropic option hidden
- API key expires mid-session: chat shows error message, no crash
- OpenAI model returned by API is not in expected filter: excluded silently
- Agent set to OpenAI provider, user deletes OpenAI key: chat shows "Add your OpenAI API key in Settings"

## Definition of Done
Both providers work end-to-end in chat. Model list is dynamic. Keys stored encrypted. Settings UI handles both keys cleanly.
