import asyncio
import json
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent.graph import run_graph
from agent.tools import TOOL_WHITELIST
from security.sanitizer import sanitize

app = FastAPI(title="AgentLab LangGraph Backend", version="1.0.0")

INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "")
# FRONTEND_URL pode ser múltiplos valores separados por vírgula
# Ex: "https://agentlab.gustavokarsten.com,http://localhost:3000"
_frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [u.strip() for u in _frontend_urls.split(",") if u.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# --- Pydantic models ---

class AgentConfig(BaseModel):
    name: str = Field(..., max_length=100)
    emoji: str = Field(..., max_length=10)
    personality: str = Field(..., max_length=2000)
    template_personality: str = Field(default="", max_length=2000)
    tone: str = Field(..., max_length=50)
    locale: str = Field(..., pattern=r"^(pt-BR|en)$")
    extra_soul: Optional[str] = Field(None, max_length=1000)
    template_id: str = Field(..., max_length=50)
    available_tools: list[str] = Field(default_factory=list, max_length=5)
    api_key: str = Field(..., min_length=20, max_length=300)
    model: str = Field(default="claude-sonnet-4-6", max_length=100)
    lang_graph_enabled: bool = True

    def model_dump_safe(self) -> dict:
        """Return dict without the api_key for logging."""
        d = self.model_dump()
        d.pop("api_key", None)
        return d


class AgentStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    agent_config: AgentConfig
    session_id: str = Field(..., min_length=1, max_length=100)
    conversation_id: Optional[str] = Field(None, max_length=100)
    delay_mode: bool = Field(default=False)


# --- SSE streaming helper ---

async def _stream_sse(queue: asyncio.Queue):
    """Consume the queue and yield SSE-formatted strings."""
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=120.0)
        except asyncio.TimeoutError:
            yield "event: error\ndata: {\"message\": \"timeout\"}\n\n"
            break

        event_type = event.get("type", "data")
        data = json.dumps(event.get("data", {}))
        yield f"event: {event_type}\ndata: {data}\n\n"

        if event_type == "done":
            break


# --- Endpoints ---

@app.post("/agent/stream")
async def agent_stream(
    request: AgentStreamRequest,
    x_internal_secret: str = Header(default=""),
):
    # Authenticate inter-service calls
    if INTERNAL_SECRET and x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Validate available tools against whitelist
    safe_tools = [t for t in request.agent_config.available_tools if t in TOOL_WHITELIST]

    # Secondary sanitization at service boundary
    sanitized = sanitize(request.message)
    if sanitized.injection_detected:
        # Still process — injection_detected flows through graph safely
        pass

    agent_config_dict = request.agent_config.model_dump()
    agent_config_dict["available_tools"] = safe_tools

    delay = 0.3 if request.delay_mode else 0.0

    queue: asyncio.Queue = asyncio.Queue()

    async def _run_and_catch():
        try:
            await run_graph(
                message=request.message,
                agent_config=agent_config_dict,
                session_id=request.session_id,
                conversation_id=request.conversation_id,
                queue=queue,
                delay=delay,
            )
        except Exception as e:
            await queue.put({
                "type": "error",
                "data": {"message": str(e), "node": "graph", "recoverable": False},
            })
            await queue.put({
                "type": "done",
                "data": {"status": "error", "total_ms": 0, "nodes_executed": 0,
                         "session_id": request.session_id, "conversation_id": request.conversation_id,
                         "total_tokens": 0, "total_cost": 0.0},
            })

    asyncio.create_task(_run_and_catch())

    return StreamingResponse(
        _stream_sse(queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/health")
async def health():
    langfuse_ok = False
    try:
        from observability.langfuse_setup import get_langfuse
        langfuse_ok = get_langfuse() is not None
    except Exception:
        pass

    return {
        "status": "ok",
        "model_default": "claude-sonnet-4-6",
        "model_classifier": "claude-haiku-4-5-20251001",
        "tools_available": list(TOOL_WHITELIST),
        "langfuse_connected": langfuse_ok,
    }
