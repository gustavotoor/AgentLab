"""
AgentLab tool definitions.
Only tools in agent_config.available_tools are permitted at runtime.
"""
import os
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx

TOOL_WHITELIST = {"web_search", "calculator", "datetime"}


# --- Web Search via SearXNG ---

def web_search(query: str) -> str:
    """
    Search the web using SearXNG JSON API.
    SearXNG is a self-hosted meta-search engine — no API key required.
    Configure SEARXNG_URL to point to your instance.
    """
    searxng_url = os.getenv("SEARXNG_URL", "")
    if not searxng_url:
        return "Web search não configurado. Defina SEARXNG_URL com a URL de uma instância SearXNG."
    try:
        response = httpx.get(
            f"{searxng_url}/search",
            params={
                "q": query,
                "format": "json",
                "language": "pt-BR",
                "categories": "general",
            },
            timeout=10.0,
            headers={"Accept": "application/json"},
            follow_redirects=True,
        )
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])[:4]

        if not results:
            return "No results found."

        formatted = []
        for r in results:
            title = r.get("title", "")
            content = r.get("content", "")[:400]
            url = r.get("url", "")
            formatted.append(f"**{title}**\n{content}\nSource: {url}")

        return "\n\n---\n\n".join(formatted)
    except Exception as e:
        return f"Web search failed: {str(e)}"


# --- Calculator ---

def calculator(expression: str) -> str:
    """
    Evaluate a mathematical expression safely using numexpr.
    Never uses eval() directly.
    """
    try:
        import numexpr as ne
        safe = all(c in "0123456789+-*/()., ^%eE " for c in expression)
        if not safe:
            return "Invalid expression: only basic math operators are allowed."
        result = ne.evaluate(expression)
        return str(float(result))
    except Exception as e:
        return f"Calculation error: {str(e)}"


# --- DateTime ---

def datetime_info(timezone: str = "America/Sao_Paulo") -> str:
    """Return current date, time, and day of week in the given timezone."""
    try:
        tz = ZoneInfo(timezone)
    except (ZoneInfoNotFoundError, Exception):
        tz = ZoneInfo("America/Sao_Paulo")
    now = datetime.now(tz)
    return (
        f"Current date: {now.strftime('%Y-%m-%d')}\n"
        f"Current time: {now.strftime('%H:%M:%S')} ({timezone})\n"
        f"Day of week: {now.strftime('%A')}"
    )


TOOL_MAP = {
    "web_search": web_search,
    "calculator": calculator,
    "datetime": datetime_info,
}
