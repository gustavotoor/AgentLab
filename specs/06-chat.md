# Spec 06 — Chat Interface
**Status:** Implemented
**Priority:** P1  
**Estimated effort:** 4–5h  
**Depends on:** spec/00-architecture.md, spec/05-agent-crud.md

---

## Purpose
The core feature: the chat interface where users interact with their agents. Supports streaming, conversation history, and a clean, focused UX.

---

## Behavior

### Page Load
- URL: `/agents/[id]`
- Verifies user owns the agent (403 if not)
- If user has no valid API key: shows "Add your API key in Settings to start chatting" with link
- Loads agent info (name, emoji) → displays in header
- Loads conversation list (left sidebar, collapsible on mobile)
- If `?conversation=[convId]` in URL: loads that conversation
- Otherwise: starts new empty conversation

### Conversation Sidebar (Left)
- Lists all conversations for this agent
- Shows: auto-generated title (first 30 chars of first user message) OR "New conversation"
- Shows: date (relative: "Today", "Yesterday", or "Mar 25")
- Clicking a conversation loads it in the main chat area
- "New conversation" button at top
- Conversations sorted by `createdAt` desc

### Chat Area (Center)
- Header: agent emoji + name + "Edit" icon link to `/agents/[id]/edit`
- Message bubbles:
  - User: right-aligned, accent color background, white text
  - Assistant: left-aligned, subtle gray background, dark text
- Each message shows: content, timestamp (hover)
- Assistant messages have "Copy" icon (copies to clipboard + toast)
- Auto-scroll to bottom when new messages arrive
- Empty state: "Start a conversation with [AGENT NAME]"

### Input Area (Bottom)
- Textarea (auto-grow up to 5 lines, then scroll)
- Placeholder: "Message [AGENT NAME]..."
- Send button (right side, primary style)
- Submit: Enter (send) / Shift+Enter (newline)
- Loading state while streaming: send button becomes spinner

### Streaming
- Uses Vercel AI SDK `streamText`
- Assistant response streams in real-time, character by character
- Shows typing indicator (pulsing dots) before first token
- On complete: message saved to DB, conversation title generated if first message

### New Conversation Flow
1. User clicks "New conversation"
2. Sidebar shows "New conversation" as active
3. Main chat is empty
4. User types message → sends
5. API creates new Conversation record → first user message → streams assistant response → saves assistant message
6. Conversation title set to first 30 chars of user message

---

## UI Specification

### Layout
```
┌─────────────────────────────────────────────────────┐
│ [≡]  [Agent Emoji] Agent Name              [Edit ✏️] │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Convers. │                                          │
│ Sidebar  │         Chat Area                       │
│          │                                          │
│ [New ▸]  │   [User message - right]                │
│          │                                          │
│ Today    │   [Assistant message - left]            │
│ ├─ Conv1 │                                          │
│ └─ Conv2 │                                          │
│          │                                          │
│ Yesterday│                                          │
│ └─ Conv3 │                                          │
│          ├──────────────────────────────────────────┤
│          │  [Message input...                ] [➤] │
└──────────┴──────────────────────────────────────────┘
```

### Responsive Behavior
- Desktop: sidebar + chat visible
- Mobile: sidebar hidden by default, hamburger toggle in header, slides in from left as overlay

### Visual Design (Use frontend-design skill)
- Chat area: clean white/off-white background
- User bubble: accent color (deep blue or gradient), rounded, subtle shadow
- Assistant bubble: light gray, rounded, clean typography
- Typing indicator: 3 animated dots
- Scrollbar: subtle, custom styled
- Input: bottom-fixed on mobile, sticky on desktop

---

## API Specification

### POST /api/chat
**Request:**
```json
{
  "agentId": "clx123...",
  "conversationId": "clx456..." | null,
  "message": "Hello, how are you?"
}
```

**Behavior:**
1. Validates user owns agent
2. If no conversationId: creates new Conversation, returns new ID
3. Saves user message
4. Loads agent.systemPrompt
5. Loads user.apiKeyEncrypted → decrypts → validates → creates Anthropic client
6. Streams response using Vercel AI SDK:
   - System: agent.systemPrompt
   - Messages: full conversation history (limit to last 20 messages for context)
7. On stream complete: saves assistant message
8. If first message in conversation: sets conversation.title from user message (first 30 chars)

**Response:** Streaming text (Vercel AI SDK format)
```
0:{"text":"Hello"}
0:{"text":"!"}
0:{"text":" How"}
...
e:{"finishReason":"stop","usage":{"promptTokens":12,"completionTokens":8}}
```

### GET /api/conversations/[agentId]
**Response 200:**
```json
{
  "conversations": [
    {
      "id": "clx123",
      "title": "How do I organize my...",
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ]
}
```

### GET /api/conversations/[agentId]/[conversationId]
**Response 200:**
```json
{
  "id": "clx123",
  "title": "...",
  "messages": [
    { "role": "user", "content": "Hello", "createdAt": "..." },
    { "role": "assistant", "content": "Hi! How can I help?", "createdAt": "..." }
  ]
}
```

---

## Acceptance Criteria
- [ ] Chat page loads agent info in header
- [ ] Sidebar lists all conversations for this agent
- [ ] Clicking conversation loads its messages
- [ ] "New conversation" starts fresh chat
- [ ] First user message creates conversation + sets title
- [ ] User messages display right-aligned, assistant left-aligned
- [ ] Assistant messages have copy button
- [ ] Streaming shows real-time text
- [ ] Typing indicator appears before first token
- [ ] Auto-scrolls to bottom on new message
- [ ] Enter sends, Shift+Enter adds newline
- [ ] No API key → shows CTA to add key
- [ ] Non-owner → 403 error
- [ ] Mobile: sidebar hidden, hamburger toggle works

## Edge Cases
- Very long message (1000+ chars) → input grows to max 5 lines, then scrolls
- Empty message submitted → ignored, no API call
- Anthropic API error (rate limit, invalid key mid-session) → shows error message in chat: "Something went wrong. Try again."
- Conversation with 50+ messages → only last 20 sent as context (to stay under token limits)
- Network drops during stream → stream stops, user sees partial message, can retry

## Definition of Done
All acceptance criteria checked. Streaming works. Conversation history persists. Copy works. Mobile layout functional.

---

## ⚡ Post-Build Additions

> These items were **not in the original spec** and were added after the initial build was complete.

### Markdown Rendering

Assistant messages now render Markdown (bold, italic, code blocks, lists, links). This was not specified originally — messages were plain text. A sanitizer (`lib/sanitizer.ts`) strips unsafe HTML before rendering.

### LangGraph Chat Variant

When `agent.langGraphEnabled = true`, the chat page renders `ChatWindowLangGraph.tsx` instead of the standard `ChatWindow.tsx`. This variant:

- Sends messages to `POST /api/chat/langgraph` (SSE) instead of `POST /api/chat`
- Shows a **LabPanel** alongside the chat (collapsible, right side):
  - **ExecutionLog** — terminal-style real-time log of graph node execution
  - **GraphDiagram** — SVG visualization of the LangGraph pipeline
  - **ObservabilityPanel** — Langfuse trace link for the current run
- Uses `useAgentStream` hook for SSE consumption
- SSE events: `node_start`, `node_data`, `node_complete`, `message_chunk`, `done`, `error`

> See spec 11 (LangGraph Lab) for full details.
