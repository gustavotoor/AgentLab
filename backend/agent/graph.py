import asyncio
import time

from langgraph.graph import END, START, StateGraph

from agent.nodes import (
    classify_intent,
    retrieve_context,
    execute_tools,
    generate_response,
    validate_response,
)
from agent.state import AgentState
from observability.langfuse_setup import create_trace, end_trace
from streaming.sse import emit


def route_after_classify(state: AgentState) -> str:
    intent = state.get("intent", "conversation")
    available_tools = state.get("agent_config", {}).get("available_tools", [])

    if state.get("injection_detected"):
        return "generate_response"

    if intent == "tool_use" and available_tools:
        return "execute_tools"
    elif intent == "reasoning":
        return "retrieve_context"
    else:
        return "generate_response"


def route_after_validate(state: AgentState) -> str:
    validation_passed = state.get("validation_passed", True)
    attempts = state.get("attempts", 0)

    if not validation_passed and attempts < 2:
        return "generate_response"
    return END


# Build graph
builder = StateGraph(AgentState)

builder.add_node("classify_intent", classify_intent)
builder.add_node("retrieve_context", retrieve_context)
builder.add_node("execute_tools", execute_tools)
builder.add_node("generate_response", generate_response)
builder.add_node("validate_response", validate_response)

builder.add_edge(START, "classify_intent")
builder.add_conditional_edges(
    "classify_intent",
    route_after_classify,
    {
        "execute_tools": "execute_tools",
        "retrieve_context": "retrieve_context",
        "generate_response": "generate_response",
    },
)
builder.add_edge("execute_tools", "generate_response")
builder.add_edge("retrieve_context", "generate_response")
builder.add_edge("generate_response", "validate_response")
builder.add_conditional_edges(
    "validate_response",
    route_after_validate,
    {
        "generate_response": "generate_response",
        END: END,
    },
)

graph = builder.compile()


async def run_graph(
    message: str,
    agent_config: dict,
    session_id: str,
    conversation_id: str | None,
    queue: asyncio.Queue,
    delay: float = 0.0,
) -> None:
    start = time.monotonic()

    trace = create_trace(
        session_id=session_id,
        input_text=message,
        agent_name=agent_config.get("name", "Agent"),
        locale=agent_config.get("locale", "pt-BR"),
    )

    initial_state: AgentState = {
        "messages": [],
        "input": message,
        "input_sanitized": message,
        "agent_config": agent_config,
        "session_id": session_id,
        "conversation_id": conversation_id,
        "intent": "",
        "sub_intent": "",
        "confidence": 0.0,
        "retrieved_context": [],
        "tools_executed": [],
        "tool_results": {},
        "response": "",
        "response_tokens": 0,
        "validation_passed": False,
        "attempts": 0,
        "injection_detected": False,
        "events": [],
        "total_tokens": 0,
        "total_cost": 0.0,
    }

    config = {
        "configurable": {
            "queue": queue,
            "trace": trace,
            "delay": delay,
        }
    }

    final_state = await graph.ainvoke(initial_state, config=config)

    total_ms = int((time.monotonic() - start) * 1000)

    await emit(queue, "done", {
        "total_ms": total_ms,
        "nodes_executed": len(final_state.get("events", [])),
        "status": "success",
        "session_id": session_id,
        "conversation_id": conversation_id,
        "total_tokens": final_state.get("total_tokens", 0),
        "total_cost": round(final_state.get("total_cost", 0.0), 6),
    })

    end_trace(
        trace,
        output=final_state.get("response", ""),
        metadata={
            "total_ms": total_ms,
            "total_tokens": final_state.get("total_tokens", 0),
            "total_cost": final_state.get("total_cost", 0.0),
        },
    )
