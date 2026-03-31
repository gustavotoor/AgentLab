# Spec 11 — LangGraph Lab Mode
**Status:** Implemented (post-build)
**Priority:** P1
**Added:** After initial build — not in original spec
**Depends on:** spec/00-architecture.md, spec/05-agent-crud.md, spec/06-chat.md, spec/10-multi-provider.md

---

## Purpose
Add a "laboratory" mode to AgentLab where agent reasoning is made **transparent and observable in real time**. When Lab Mode is enabled on an agent, a Python FastAPI microservice runs the conversation through a LangGraph pipeline with 5 nodes, emitting events at each step. The frontend renders these events in a live panel alongside the chat.

This feature is the capstone portfolio piece — it demonstrates: multi-service architecture, real-time streaming, LangGraph/LLM observability, and advanced React UI.

---

## Architecture

```
Browser
  │
  ├── ChatWindowLangGraph.tsx
  │     └── useAgentStream (SSE consumer)
  │           │
  │           ▼
  │   Next.js: POST /api/chat/langgraph
  │     - Auth check
  │     - Decrypt BYOK key (Anthropic or OpenAI)
  │     - Save user message to DB
  │     - Forward request to Python backend (SSE proxy)
  │     - Save assistant message on stream complete
  │           │
  │           ▼
  │   Python FastAPI (port 8000)
  │     └── LangGraph pipeline:
  │           1. classify_intent
  │           2. retrieve_context | execute_tools
  │           3. generate_response
  │           4. validate_response
  │           └── NodeEmitter → SSE events
  │
  └── LabPanel (right sidebar)
        ├── ExecutionLog — terminal log of SSE events
        ├── GraphDiagram — SVG of the 5-node pipeline
        └── ObservabilityPanel — Langfuse trace link
```

---

## Behavior

### Enabling Lab Mode

In agent edit form (Step 3 — Advanced):
- Toggle: "Enable Lab Mode" (`langGraphEnabled`)
- Multi-select: "Available Tools" (`availableTools`) — e.g. `web_search`, `code_interpreter`

When Lab Mode is enabled, the agent's chat page automatically renders `ChatWindowLangGraph.tsx` instead of `ChatWindow.tsx`.

### Chat Page (Lab Mode)

Layout:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡]  [🔬] Agent Name                              [Edit ✏️] │
├──────────────┬──────────────────────────┬────────────────────┤
│              │                          │                    │
│ Conversation │     Chat Area            │    LabPanel        │
│  Sidebar     │                          │  ┌─────────────┐  │
│              │  [User message]          │  │ ExecutionLog│  │
│              │                          │  │ (terminal)  │  │
│              │  [Assistant message]     │  └─────────────┘  │
│              │                          │  ┌─────────────┐  │
│              │                          │  │ GraphDiagram│  │
│              │                          │  │ (SVG nodes) │  │
│              ├──────────────────────────┤  └─────────────┘  │
│              │  [Message input...] [➤]  │  ┌─────────────┐  │
│              │                          │  │Observability│  │
└──────────────┴──────────────────────────┴──┴─────────────┘  │
```

### SSE Protocol

The Python backend emits Server-Sent Events on the format:

| Event Type | Payload | Description |
|------------|---------|-------------|
| `node_start` | `{ node: "classify_intent" }` | A graph node began execution |
| `node_data` | `{ node: "...", data: {...} }` | Intermediate data from a node |
| `node_complete` | `{ node: "...", duration_ms: 120 }` | Node finished |
| `message_chunk` | `{ text: "Hello" }` | LLM token (streamed to chat) |
| `done` | `{ trace_id: "..." }` | Full graph execution complete |
| `error` | `{ message: "..." }` | Error at any point |

The Next.js bridge (`/api/chat/langgraph`) proxies these events directly to the browser.

### LangGraph Pipeline Nodes

1. **classify_intent** — Classifies user message intent (question, task, chitchat, etc.)
2. **retrieve_context** — Retrieves relevant context from conversation history
3. **execute_tools** — Executes any enabled tools (conditional node)
4. **generate_response** — Calls LLM to generate the response
5. **validate_response** — Quality checks the response before sending

### ExecutionLog Component

- Terminal-style UI (dark background, monospace font, green/amber text)
- Logs each node event with timestamp and duration
- Animated entry (fade-in per line)
- Scrollable, auto-scrolls to latest entry

### GraphDiagram Component

- Static SVG of the 5-node pipeline
- Nodes highlight as they execute (uses SSE `node_start`/`node_complete` events)
- Shows current active node in real time

### ObservabilityPanel Component

- Shows Langfuse trace URL after `done` event (if Langfuse is configured)
- Displays trace ID, total duration, token counts when available

---

## Backend (Python FastAPI)

### File Structure
```
backend/
├── main.py               # FastAPI app, routes
├── requirements.txt      # Python deps (langgraph, fastapi, langfuse, etc.)
├── Dockerfile
├── agent/
│   ├── graph.py          # LangGraph StateGraph definition
│   ├── nodes.py          # Individual node functions
│   └── state.py          # AgentState TypedDict
├── observability/
│   └── langfuse.py       # Langfuse client + NodeEmitter
├── security/
│   └── auth.py           # Request authentication (shared secret)
└── streaming/
    └── emitter.py        # NodeEmitter class (SSE event builder)
```

### NodeEmitter Pattern

Every node function receives a `NodeEmitter` and calls:
```python
emitter.node_start("classify_intent")
# ... do work ...
emitter.node_data("classify_intent", {"intent": "question"})
emitter.node_complete("classify_intent")
```

This ensures all nodes emit consistent observability events.

### Request Format (Next.js → Python)

```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "agent_config": {
    "system_prompt": "...",
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "tools": ["web_search"],
    "api_key": "DECRYPTED_BYOK_KEY"
  }
}
```

Note: The BYOK key is decrypted by Next.js before forwarding. It never reaches the client browser.

---

## New API Endpoint

### POST /api/chat/langgraph
**Auth:** NextAuth session
**Request:**
```json
{
  "agentId": "clx123...",
  "conversationId": "clx456..." | null,
  "message": "What is the meaning of life?"
}
```
**Behavior:**
1. Validates user owns agent and agent has `langGraphEnabled = true`
2. Decrypts BYOK key for `agent.provider`
3. Saves user message to DB
4. POSTs to Python backend as streaming SSE request
5. Proxies all SSE events to browser
6. On `done` event: saves assistant message assembled from `message_chunk` events
7. Updates conversation title if first message

**Response:** SSE stream
**Header:** `X-Conversation-Id: clx456...`

---

## Docker Changes

### Updated docker-compose.yml

Added `backend` service:
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  ports:
    - "8000:8000"
  environment:
    - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    - LANGFUSE_PUBLIC_KEY=${LANGFUSE_PUBLIC_KEY}
    - LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET_KEY}
  depends_on:
    - postgres
```

### New docker-compose.langfuse.yml

Optional standalone Langfuse stack for local observability:
```yaml
# Runs Langfuse web + worker + postgres + clickhouse
# Access at http://localhost:3005
```

---

## Acceptance Criteria
- [ ] Lab Mode toggle visible in agent edit form (Step 3)
- [ ] Available Tools multi-select works
- [ ] Agent with Lab Mode shows `ChatWindowLangGraph.tsx` on chat page
- [ ] LabPanel renders alongside chat
- [ ] SSE events appear in ExecutionLog in real time
- [ ] GraphDiagram highlights active nodes during execution
- [ ] ObservabilityPanel shows trace link after completion
- [ ] Messages are saved to DB as with standard chat
- [ ] LangGraph mode respects `agent.provider` + `agent.model`
- [ ] Python backend docker service starts with `docker-compose up`

## Edge Cases
- Python backend is down: Next.js bridge returns 503, chat shows error
- Langfuse not configured: ObservabilityPanel shows "Langfuse not configured"
- Agent has Lab Mode but user sends empty message: ignored, no API call
- Tool execution fails: `error` SSE event, chat shows partial response + error note
- Very long graph execution (>30s): client shows "Still thinking..." indicator

## Definition of Done
End-to-end Lab Mode works. All 5 nodes emit SSE events. ExecutionLog shows them live. GraphDiagram highlights correctly. Messages persist. Docker Compose starts all services.
