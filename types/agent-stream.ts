export type SSEEventType =
  | 'node_start'
  | 'node_data'
  | 'node_complete'
  | 'message_chunk'
  | 'done'
  | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: Record<string, unknown>
}

export interface NodeStartData {
  node: string
  timestamp: string
}

export interface NodeDataData {
  node: string
  key: string
  value: string
}

export interface NodeCompleteData {
  node: string
  duration_ms: number
}

export interface MessageChunkData {
  content: string
  delta: boolean
}

export interface DoneData {
  total_ms: number
  nodes_executed: number
  status: 'success' | 'error'
  session_id: string
  conversation_id: string | null
  total_tokens: number
  total_cost: number
}

export interface ErrorData {
  message: string
  node: string
  recoverable: boolean
}

/** A parsed log line for the ExecutionLog terminal UI */
export type LogLineType =
  | 'node_start'
  | 'node_data'
  | 'node_complete'
  | 'done'
  | 'error'

export interface LogLine {
  id: string
  type: LogLineType
  node?: string
  key?: string
  value?: string
  duration_ms?: number
  total_ms?: number
  total_tokens?: number
  total_cost?: number
  status?: string
  message?: string
  timestamp: number
}
