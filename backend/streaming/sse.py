import asyncio
import time
from typing import Any


async def emit(queue: asyncio.Queue, event_type: str, data: dict[str, Any]) -> None:
    """Put a typed SSE event onto the queue."""
    await queue.put({"type": event_type, "data": data})


class NodeEmitter:
    """Helper used inside each graph node to emit SSE events consistently."""

    def __init__(self, queue: asyncio.Queue, node_name: str):
        self.queue = queue
        self.node_name = node_name
        self._start_time = time.monotonic()

    async def start(self) -> None:
        from datetime import datetime, timezone
        await emit(self.queue, "node_start", {
            "node": self.node_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        self._start_time = time.monotonic()

    async def data(self, key: str, value: Any) -> None:
        await emit(self.queue, "node_data", {
            "node": self.node_name,
            "key": key,
            "value": str(value),
        })

    async def complete(self) -> int:
        elapsed_ms = int((time.monotonic() - self._start_time) * 1000)
        await emit(self.queue, "node_complete", {
            "node": self.node_name,
            "duration_ms": elapsed_ms,
        })
        return elapsed_ms
