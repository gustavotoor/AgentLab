import operator
from typing import Annotated, Optional, TypedDict

from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    # Conversation history (append-only)
    messages: Annotated[list[BaseMessage], operator.add]

    # Raw and sanitized user input
    input: str
    input_sanitized: str

    # Agent configuration forwarded from Next.js
    # Keys: name, emoji, personality, template_personality, tone, locale,
    #       extra_soul, template_id, available_tools, api_key, lang_graph_enabled
    agent_config: dict

    # Session identifiers
    session_id: str
    conversation_id: Optional[str]

    # Intent classification results
    intent: str          # "conversation" | "tool_use" | "reasoning" | "clarification"
    sub_intent: str
    confidence: float

    # Context retrieval
    retrieved_context: list[dict]  # [{source, content}]

    # Tool execution
    tools_executed: Annotated[list[str], operator.add]
    tool_results: dict  # {tool_name: result_str}

    # Response generation
    response: str
    response_tokens: int

    # Validation
    validation_passed: bool
    attempts: int

    # Security
    injection_detected: bool

    # Observability
    events: Annotated[list[dict], operator.add]
    total_tokens: int
    total_cost: float
