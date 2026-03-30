/**
 * Client-side and server-side input sanitizer for injection protection.
 * Mirrors the Python backend/security/sanitizer.py logic.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/gi,
  /system\s*:/gi,
  /\bdo\s+not\s+follow\b/gi,
  /\bjailbreak\b/gi,
  /\bpretend\s+(you\s+are|to\s+be|that)\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bnew\s+instruction(s)?\b/gi,
  /<\/?system>/gi,
  /\[INST\]/gi,
  /\bHuman\s*:\s*/gi,
  /\bAssistant\s*:\s*/gi,
  /override\s+(your\s+)?(instructions?|prompt|rules?)/gi,
]

const MAX_SPECIAL_CHAR_RATIO = 0.3

function specialCharRatio(text: string): number {
  if (!text) return 0
  const special = [...text].filter((c) => !/[\w\s]/.test(c)).length
  return special / text.length
}

export interface SanitizeResult {
  text: string
  injectionDetected: boolean
}

export function sanitize(text: string): SanitizeResult {
  let injectionDetected = false
  let sanitized = text

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      injectionDetected = true
      sanitized = sanitized.replace(pattern, '[FILTERED]')
    }
    pattern.lastIndex = 0
  }

  if (specialCharRatio(text) > MAX_SPECIAL_CHAR_RATIO) {
    injectionDetected = true
  }

  return { text: sanitized, injectionDetected }
}
