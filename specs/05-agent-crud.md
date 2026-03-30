# Spec 05 — Agent CRUD
**Status:** Ready to implement  
**Priority:** P1  
**Estimated effort:** 3–4h  
**Depends on:** spec/00-architecture.md, spec/04-agent-store.md

---

## Purpose
Create, view, edit, duplicate, and delete agents. The creation form is a multi-step wizard. The list page gives full management over the user's agents.

---

## Behavior

### Create Agent (/agents/new)
3-step wizard with animated progress indicator.

**Step 1 — Choose Template**
- Visual template picker (same cards as store, but selectable)
- Pre-selected if `?template=xxx` is in URL
- User must select one to proceed
- "Next →" button

**Step 2 — Customize**
Fields:
- Agent Name (text, required, max 50 chars)
- Emoji (emoji picker — click to open picker, updates preview)
- Tone (Select: Formal / Casual / Technical / Friendly)
- Language (Select: PT-BR / EN / Bilingual)
- Personality (Textarea, required, max 500 chars — "Describe how your agent should behave")
- Character counter on personality field

Live Preview (right side on desktop):
- Shows agent card as it will appear in the agents list
- Updates in real time as user types

**Step 3 — Advanced (optional)**
Fields:
- Extra Instructions (Textarea, optional, max 1000 chars — "Any additional rules or context")
- System Prompt Preview (read-only, shows the generated prompt)

"Create Agent" button (primary, full width)
Loading state on submit.

### Agent List (/agents)
- Grid layout (same as dashboard cards)
- List/Grid toggle (stores preference in localStorage)
- Each agent card shows:
  - Emoji, name, template badge
  - Conversation count, last active date
  - Action buttons: Chat (primary), Edit (icon), Duplicate (icon), Delete (icon)
- Sort options: Newest / Oldest / Most Used / A-Z
- Empty state when no agents

### Edit Agent (/agents/[id]/edit)
- Same form as create (3 steps)
- Pre-filled with current agent data
- "Save Changes" button
- Changes trigger system prompt regeneration

### Duplicate Agent
- Creates a copy with name "[Original Name] (copy)"
- Same template, personality, tone, locale
- New ID, 0 conversations
- Redirect to the new agent's edit page

### Delete Agent
- Confirmation modal: "Delete [AGENT NAME]? This will permanently delete all [X] conversations. This cannot be undone."
- On confirm: soft delete (or hard delete — keep simple for MVP: hard delete + cascade)
- Redirect to `/agents`

---

## System Prompt Generation (lib/prompts.ts)

```
buildSystemPrompt(agent, user):

You are {agent.name}, an AI agent created on AgentLab.

{TEMPLATE_PERSONALITY_BASE}

Tone: {agent.tone}
Language: {agent.locale}

About you:
{agent.personality}

{agent.extraSoul ? "Additional instructions:\n" + agent.extraSoul : ""}

About the person you're helping:
- Name: {user.name}

Always stay in character. Be consistent with your tone and personality.
```

---

## API Specification

### GET /api/agents
**Response 200:**
```json
{
  "agents": [
    {
      "id": "...",
      "name": "My Assistant",
      "emoji": "🤝",
      "templateId": "personal-assistant",
      "tone": "casual",
      "locale": "pt-BR",
      "totalChats": 4,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### POST /api/agents
**Request:**
```json
{
  "name": "My Assistant",
  "emoji": "🤝",
  "templateId": "personal-assistant",
  "personality": "Helpful and concise...",
  "tone": "casual",
  "locale": "pt-BR",
  "extraSoul": ""
}
```
**Response 201:**
```json
{ "id": "...", "name": "My Assistant", ... }
```

### GET /api/agents/[id]
Returns single agent (verifies ownership)  
**Response 403** if not owner

### PATCH /api/agents/[id]
Same body as POST, partial updates allowed  
**Response 200:** updated agent

### DELETE /api/agents/[id]
Cascades: deletes Conversations → Messages → Agent  
**Response 204**

### POST /api/agents/[id]/duplicate
**Response 201:** new agent object

---

## Acceptance Criteria
- [ ] Create form has 3 steps with animated progress
- [ ] Template pre-selection via URL param works
- [ ] Emoji picker opens and updates preview
- [ ] Live preview updates as user types name/emoji
- [ ] System prompt is generated and saved on create
- [ ] System prompt preview shown in step 3
- [ ] Edit form pre-fills with existing values
- [ ] Editing regenerates system prompt
- [ ] Duplicate creates copy with "(copy)" suffix
- [ ] Delete shows confirmation modal with conversation count
- [ ] Delete cascades to conversations and messages
- [ ] Agents list shows all user agents
- [ ] Sort options work
- [ ] Grid/list toggle works and persists
- [ ] Empty state shown when no agents
- [ ] Non-owner cannot access/edit/delete another user's agent (403)

## Edge Cases
- Agent name already taken by same user → allowed (no uniqueness constraint)
- User creates agent without API key → agent created, chat page shows "Add API key to start chatting"
- User has 0 conversations and tries to delete → no mention of conversations in modal
- Template ID in URL param doesn't exist → defaults to free-agent

## Definition of Done
All acceptance criteria checked. Full CRUD works. System prompt builds correctly. No unauthorized access possible.
