import os
from typing import Optional

_langfuse = None


def get_langfuse():
    global _langfuse
    if _langfuse is None:
        try:
            from langfuse import Langfuse
            _langfuse = Langfuse(
                public_key=os.getenv("LANGFUSE_PUBLIC_KEY", ""),
                secret_key=os.getenv("LANGFUSE_SECRET_KEY", ""),
                host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
            )
        except Exception:
            _langfuse = None
    return _langfuse


def create_trace(session_id: str, input_text: str, agent_name: str, locale: str):
    lf = get_langfuse()
    if lf is None:
        return None
    try:
        return lf.trace(
            name="agentlab-execution",
            session_id=session_id,
            input=input_text,
            metadata={"agent_name": agent_name, "locale": locale},
        )
    except Exception:
        return None


def create_span(trace, name: str, input_data: dict | None = None):
    if trace is None:
        return None
    try:
        return trace.span(name=name, input=input_data or {})
    except Exception:
        return None


def end_span(span, output_data: dict | None = None, metadata: dict | None = None):
    if span is None:
        return
    try:
        span.end(output=output_data or {}, metadata=metadata or {})
    except Exception:
        pass


def end_trace(trace, output: str | None = None, metadata: dict | None = None):
    if trace is None:
        return
    try:
        trace.update(output=output, metadata=metadata or {})
    except Exception:
        pass
