# Spec 03 — Dashboard
**Status:** Ready to implement  
**Priority:** P1  
**Estimated effort:** 2h  
**Depends on:** spec/00-architecture.md, spec/01-auth.md

---

## Purpose
Main page after login. Gives the user a quick overview of their agents, recent activity, and fast access to key actions.

---

## Behavior

### Data Displayed
- Greeting: "Good morning/afternoon/evening, [NAME]" (based on server time)
- Stats row:
  - Total agents created
  - Total conversations
  - Messages today (count from `Message.createdAt` >= today 00:00 local time)
- Recent agents: last 6 agents ordered by `updatedAt` desc
- If no agents exist: empty state

### Actions Available
- "New Agent" button → navigates to `/agents/new`
- Click on agent card → navigates to `/agents/[id]` (chat)
- "View all" link → navigates to `/agents`

### API Key Banner
- If `apiKeyValid = false` AND `onboardingDone = true`:
  - Show yellow warning banner: "Add your API key in Settings to start chatting with your agents."
  - Link: "Go to Settings →"
  - Dismissible (stored in localStorage, not DB)

---

## UI Specification

**Layout:**
- App shell (sidebar + topbar, from layout spec)
- Page content: padding, max-width container

**Stats Row:**
- 3 cards side by side (responsive: stacks on mobile)
- Each card: icon, large number, label
- Subtle animation on number (count-up effect on mount)

**Agent Grid:**
- 3 columns desktop, 2 tablet, 1 mobile
- Agent card (reused in `/agents` page):
  - Emoji (large, centered top)
  - Agent name
  - Template type (small badge)
  - Conversation count
  - "Chat" button
  - Hover: card lifts with shadow

**Empty State:**
- Illustration (simple SVG robot or emoji)
- Heading: "No agents yet"
- Body: "Create your first agent from the store"
- CTA button: "Browse Agent Store"

---

## API Specification

### GET /api/dashboard
**Response 200:**
```json
{
  "greeting": "Good evening",
  "stats": {
    "totalAgents": 3,
    "totalConversations": 12,
    "messagesToday": 5
  },
  "recentAgents": [
    {
      "id": "...",
      "name": "My Assistant",
      "emoji": "🤝",
      "templateId": "personal-assistant",
      "totalChats": 4,
      "updatedAt": "2026-03-28T..."
    }
  ],
  "hasApiKey": true
}
```

---

## Acceptance Criteria
- [ ] Greeting changes based on time of day
- [ ] Stats show correct counts from DB
- [ ] Recent agents (max 6) display correctly
- [ ] Empty state shown when no agents exist
- [ ] API key banner shows when key is missing/invalid
- [ ] "New Agent" button navigates to /agents/new
- [ ] Agent card "Chat" button navigates to /agents/[id]
- [ ] "View all" navigates to /agents
- [ ] Page loads in < 500ms (server component data fetching)

## Edge Cases
- User just registered, no agents → empty state
- All agents have 0 conversations → shows 0 correctly
- Stats are 0 for new users → shows 0, not blank

## Definition of Done
All acceptance criteria checked. Dashboard loads with real data. Empty state renders. API key banner appears for users without valid key.
