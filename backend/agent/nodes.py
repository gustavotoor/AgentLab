import asyncio
import json
import time
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from agent.state import AgentState
from agent.tools import TOOL_MAP, TOOL_WHITELIST
from agent.personality import build_agent_system_prompt
from observability.langfuse_setup import create_span, end_span
from security.sanitizer import sanitize
from streaming.sse import NodeEmitter, emit


# --- Intent classification prompt ---

INTENT_PROMPT = """You are a routing layer for an AI assistant.
Classify the user message into ONE of these intents:
- conversation: casual chat, greetings, opinions, general questions — no external data needed
- tool_use: requires real-time data (web search, math calculation, current date/time)
- reasoning: complex multi-step analysis, requires full personality context
- clarification: ambiguous message — the agent should ask a clarifying question

Also provide:
- sub_intent: short snake_case label (e.g. "math_calculation", "current_weather", "casual_greeting")
- confidence: float 0.0-1.0

Respond in JSON only, no markdown:
{"intent": "...", "sub_intent": "...", "confidence": 0.0}"""


def _make_haiku(api_key: str) -> ChatAnthropic:
    return ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        api_key=api_key,
        max_tokens=256,
    )


def _make_model(api_key: str, model: str) -> ChatAnthropic:
    return ChatAnthropic(
        model=model,
        api_key=api_key,
        max_tokens=4096,
    )


def _estimate_tokens(text: str) -> int:
    return len(text) // 4


# --- Node 1: classify_intent ---

async def classify_intent(state: AgentState, config: dict) -> dict:
    queue: asyncio.Queue = config["configurable"]["queue"]
    trace = config["configurable"].get("trace")
    delay: float = config["configurable"].get("delay", 0.0)
    agent_config = state["agent_config"]

    emitter = NodeEmitter(queue, "classify_intent")
    span = create_span(trace, "classify_intent", {"input": state["input"]})

    await emitter.start()
    if delay:
        await asyncio.sleep(delay)

    # Run injection check on the raw input
    sanitized = sanitize(state["input"])
    injection_detected = sanitized.injection_detected

    await emitter.data("model", "claude-haiku-4-5-20251001")

    if injection_detected:
        await emitter.data("security", "injection_detected")
        elapsed = await emitter.complete()
        end_span(span, {"intent": "conversation", "injection": True}, {"duration_ms": elapsed})
        return {
            "input_sanitized": sanitized.text,
            "injection_detected": True,
            "intent": "conversation",
            "sub_intent": "security_block",
            "confidence": 1.0,
            "events": [{"type": "classify_intent", "intent": "conversation", "injection": True}],
        }

    haiku = _make_haiku(agent_config["api_key"])
    messages = [
        SystemMessage(content=INTENT_PROMPT),
        HumanMessage(content=sanitized.text),
    ]
    response = await haiku.ainvoke(messages)
    raw = response.content.strip()

    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
    except Exception:
        parsed = {"intent": "conversation", "sub_intent": "unknown", "confidence": 0.5}

    intent = parsed.get("intent", "conversation")
    sub_intent = parsed.get("sub_intent", "")
    confidence = float(parsed.get("confidence", 0.5))

    if delay:
        await asyncio.sleep(delay)

    await emitter.data("intent", intent)
    await emitter.data("sub_intent", sub_intent)
    await emitter.data("confidence", f"{confidence:.2f}")
    elapsed = await emitter.complete()

    end_span(span, {"intent": intent, "sub_intent": sub_intent}, {"duration_ms": elapsed})

    return {
        "input_sanitized": sanitized.text,
        "injection_detected": False,
        "intent": intent,
        "sub_intent": sub_intent,
        "confidence": confidence,
        "events": [{"type": "classify_intent", "intent": intent}],
    }


# --- Node 2: retrieve_context ---

async def retrieve_context(state: AgentState, config: dict) -> dict:
    queue: asyncio.Queue = config["configurable"]["queue"]
    trace = config["configurable"].get("trace")
    delay: float = config["configurable"].get("delay", 0.0)
    agent_config = state["agent_config"]

    emitter = NodeEmitter(queue, "retrieve_context")
    span = create_span(trace, "retrieve_context", {"intent": state["intent"]})

    await emitter.start()
    if delay:
        await asyncio.sleep(delay)

    await emitter.data("source", "agent_config")

    # Chunk personality + extraSoul and score by keyword overlap
    personality = agent_config.get("personality", "")
    extra_soul = agent_config.get("extra_soul", "") or ""
    full_text = personality + "\n\n" + extra_soul

    query_words = set(state["input_sanitized"].lower().split())
    paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]

    scored = []
    for para in paragraphs:
        para_words = set(para.lower().split())
        overlap = len(query_words & para_words)
        scored.append((overlap, para))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [
        {"source": "agent_personality", "content": p}
        for _, p in scored[:3]
        if p
    ]

    context_tokens = sum(_estimate_tokens(c["content"]) for c in top_chunks)

    if delay:
        await asyncio.sleep(delay)

    await emitter.data("chunks_found", len(top_chunks))
    await emitter.data("context_tokens", context_tokens)
    elapsed = await emitter.complete()

    end_span(span, {"chunks": len(top_chunks)}, {"context_tokens": context_tokens, "duration_ms": elapsed})

    return {
        "retrieved_context": top_chunks,
        "events": [{"type": "retrieve_context", "chunks": len(top_chunks)}],
    }


# --- Node 3: execute_tools ---

async def execute_tools(state: AgentState, config: dict) -> dict:
    queue: asyncio.Queue = config["configurable"]["queue"]
    trace = config["configurable"].get("trace")
    delay: float = config["configurable"].get("delay", 0.0)
    agent_config = state["agent_config"]

    emitter = NodeEmitter(queue, "execute_tools")
    span = create_span(trace, "execute_tools", {"sub_intent": state["sub_intent"]})

    await emitter.start()
    if delay:
        await asyncio.sleep(delay)

    available = [t for t in agent_config.get("available_tools", []) if t in TOOL_WHITELIST]
    tools_executed: list[str] = []
    tool_results: dict[str, str] = {}

    # Determine which tools to run based on sub_intent
    sub = state.get("sub_intent", "")

    # Simple heuristic routing by sub_intent keywords
    run_web = any(w in sub for w in ["search", "weather", "news", "web", "find", "lookup"]) and "web_search" in available
    run_calc = any(w in sub for w in ["calc", "math", "calculat", "equation", "number"]) and "calculator" in available
    run_date = any(w in sub for w in ["date", "time", "day", "clock", "when"]) and "datetime" in available

    # Fallback: if tool_use intent but nothing matched, try all available
    if not (run_web or run_calc or run_date) and available:
        run_web = "web_search" in available
        run_calc = "calculator" in available
        run_date = "datetime" in available

    if run_web:
        await emitter.data("tool_name", "web_search")
        result = await asyncio.get_event_loop().run_in_executor(
            None, TOOL_MAP["web_search"], state["input_sanitized"]
        )
        tools_executed.append("web_search")
        tool_results["web_search"] = result
        if delay:
            await asyncio.sleep(delay)
        await emitter.data("result_length", len(result))

    if run_calc:
        # Extract expression from input (use full input as expression)
        await emitter.data("tool_name", "calculator")
        result = await asyncio.get_event_loop().run_in_executor(
            None, TOOL_MAP["calculator"], state["input_sanitized"]
        )
        tools_executed.append("calculator")
        tool_results["calculator"] = result
        if delay:
            await asyncio.sleep(delay)
        await emitter.data("result_length", len(result))

    if run_date:
        await emitter.data("tool_name", "datetime")
        # Use locale to pick timezone
        tz = "America/Sao_Paulo" if agent_config.get("locale") == "pt-BR" else "UTC"
        result = await asyncio.get_event_loop().run_in_executor(
            None, TOOL_MAP["datetime"], tz
        )
        tools_executed.append("datetime")
        tool_results["datetime"] = result
        if delay:
            await asyncio.sleep(delay)
        await emitter.data("result_length", len(result))

    elapsed = await emitter.complete()
    end_span(span, {"tools": tools_executed}, {"duration_ms": elapsed})

    return {
        "tools_executed": tools_executed,
        "tool_results": tool_results,
        "events": [{"type": "execute_tools", "tools": tools_executed}],
    }


# --- Node 4: generate_response ---

async def generate_response(state: AgentState, config: dict) -> dict:
    queue: asyncio.Queue = config["configurable"]["queue"]
    trace = config["configurable"].get("trace")
    delay: float = config["configurable"].get("delay", 0.0)
    agent_config = state["agent_config"]

    emitter = NodeEmitter(queue, "generate_response")
    span = create_span(trace, "generate_response", {"language": agent_config.get("locale")})

    await emitter.start()
    if delay:
        await asyncio.sleep(delay)

    model_name = agent_config.get("model", "claude-sonnet-4-6")
    await emitter.data("model", model_name)

    # Build system prompt
    config_with_attempts = {**agent_config, "_attempts": state.get("attempts", 0)}
    system_content = build_agent_system_prompt(config_with_attempts)

    # Append retrieved context
    context_parts: list[str] = []
    if state.get("retrieved_context"):
        ctx_text = "\n\n".join(c["content"] for c in state["retrieved_context"])
        context_parts.append(f"## Context from your personality\n{ctx_text}")

    # Append tool results
    if state.get("tool_results"):
        for tool_name, result in state["tool_results"].items():
            context_parts.append(f"## Tool result ({tool_name})\n{result}")

    if context_parts:
        system_content += "\n\n" + "\n\n".join(context_parts)

    await emitter.data("context_tokens", _estimate_tokens(system_content))

    # Handle injection: return a safe refusal without LLM call
    if state.get("injection_detected"):
        locale = agent_config.get("locale", "pt-BR")
        refusal = (
            "Desculpe, não consigo processar essa mensagem."
            if locale == "pt-BR"
            else "Sorry, I cannot process that message."
        )
        await queue.put({"type": "message_chunk", "data": {"content": refusal, "delta": True}})
        elapsed = await emitter.complete()
        return {
            "response": refusal,
            "response_tokens": 0,
            "attempts": state.get("attempts", 0) + 1,
            "validation_passed": True,
            "events": [{"type": "generate_response", "tokens": 0}],
        }

    messages = list(state.get("messages", [])) + [HumanMessage(content=state["input_sanitized"])]

    sonnet = _make_model(agent_config["api_key"], model_name)

    full_response = ""
    input_tokens = 0
    output_tokens = 0
    start = time.monotonic()

    async for chunk in sonnet.astream(messages, config={"system": system_content}):
        if hasattr(chunk, "content") and chunk.content:
            full_response += chunk.content
            await queue.put({"type": "message_chunk", "data": {"content": chunk.content, "delta": True}})
        if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
            input_tokens = chunk.usage_metadata.get("input_tokens", input_tokens)
            output_tokens = chunk.usage_metadata.get("output_tokens", output_tokens)

    if delay:
        await asyncio.sleep(delay)

    latency_ms = int((time.monotonic() - start) * 1000)
    total_tokens = input_tokens + output_tokens
    # Approximate cost (Sonnet-class pricing: $3/1M input, $15/1M output)
    cost = (input_tokens * 3 + output_tokens * 15) / 1_000_000

    await emitter.data("response_tokens", output_tokens)
    await emitter.data("total_tokens", total_tokens)
    await emitter.data("cost_usd", f"{cost:.4f}")
    await emitter.data("latency_ms", latency_ms)
    elapsed = await emitter.complete()

    end_span(
        span,
        {"response": full_response[:200]},
        {"tokens": total_tokens, "cost": cost, "duration_ms": elapsed},
    )

    return {
        "response": full_response,
        "response_tokens": output_tokens,
        "messages": [AIMessage(content=full_response)],
        "total_tokens": state.get("total_tokens", 0) + total_tokens,
        "total_cost": state.get("total_cost", 0.0) + cost,
        "attempts": state.get("attempts", 0) + 1,
        "events": [{"type": "generate_response", "tokens": total_tokens}],
    }


# --- Node 5: validate_response ---

async def validate_response(state: AgentState, config: dict) -> dict:
    queue: asyncio.Queue = config["configurable"]["queue"]
    delay: float = config["configurable"].get("delay", 0.0)
    response = state.get("response", "")
    intent = state.get("intent", "conversation")
    attempts = state.get("attempts", 0)
    locale = state.get("agent_config", {}).get("locale", "pt-BR")

    emitter = NodeEmitter(queue, "validate_response")
    await emitter.start()
    if delay:
        await asyncio.sleep(delay)

    # Skip validation for security blocks
    if state.get("injection_detected"):
        await emitter.data("status", "accepted")
        await emitter.data("checks_passed", "injection_block")
        await emitter.complete()
        return {"validation_passed": True}

    checks_failed: list[str] = []

    if len(response.strip()) < 20:
        checks_failed.append("too_short")

    if intent == "clarification" and "?" not in response:
        checks_failed.append("clarification_missing_question")

    if intent == "tool_use" and state.get("tool_results"):
        # Response should reference at least some content from tool results
        tool_content = " ".join(state["tool_results"].values()).lower()[:100]
        if tool_content and not any(word in response.lower() for word in tool_content.split()[:5]):
            checks_failed.append("tool_result_not_used")

    validation_passed = len(checks_failed) == 0 or attempts >= 2

    status = "accepted" if validation_passed else "retry"
    await emitter.data("status", status)
    await emitter.data("checks_passed", str(len(checks_failed) == 0))
    await emitter.complete()

    return {
        "validation_passed": validation_passed,
        "events": [{"type": "validate_response", "status": status}],
    }
