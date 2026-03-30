import base64
import re
import unicodedata
from typing import NamedTuple


class SanitizeResult(NamedTuple):
    text: str
    injection_detected: bool


# Injection patterns to detect/replace
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?", re.I),
    re.compile(r"system\s*:", re.I),
    re.compile(r"\bdo\s+not\s+follow\b", re.I),
    re.compile(r"\bjailbreak\b", re.I),
    re.compile(r"\bpretend\s+(you\s+are|to\s+be|that)\b", re.I),
    re.compile(r"\byou\s+are\s+now\b", re.I),
    re.compile(r"\bnew\s+instruction(s)?\b", re.I),
    re.compile(r"<\/?system>", re.I),
    re.compile(r"\[INST\]", re.I),
    re.compile(r"\bHuman\s*:\s*", re.I),
    re.compile(r"\bAssistant\s*:\s*", re.I),
    re.compile(r"override\s+(your\s+)?(instructions?|prompt|rules?)", re.I),
]

# High ratio of special characters signals encoded injection
_MAX_SPECIAL_CHAR_RATIO = 0.30


def _check_base64_injection(text: str) -> bool:
    """Detect injection attempts hidden in Base64-encoded tokens."""
    tokens = text.split()
    for token in tokens:
        if len(token) < 20:
            continue
        try:
            decoded = base64.b64decode(token + "==", validate=False).decode("utf-8", errors="ignore")
            for pattern in _INJECTION_PATTERNS:
                if pattern.search(decoded):
                    return True
        except Exception:
            continue
    return False


def _special_char_ratio(text: str) -> float:
    if not text:
        return 0.0
    special = sum(1 for c in text if not (c.isalnum() or c.isspace()))
    return special / len(text)


def sanitize(text: str) -> SanitizeResult:
    """
    Sanitize text through 4 layers of injection protection.
    Returns the cleaned text and whether injection was detected.
    """
    # Layer 1: Unicode normalization (neutralizes homoglyph attacks)
    text = unicodedata.normalize("NFKC", text)

    injection_detected = False

    # Layer 2: Regex pattern matching
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            injection_detected = True
            text = pattern.sub("[FILTERED]", text)

    # Layer 3: Base64-encoded injection detection
    if _check_base64_injection(text):
        injection_detected = True

    # Layer 4: High special-char ratio signals encoded/obfuscated injection
    if _special_char_ratio(text) > _MAX_SPECIAL_CHAR_RATIO:
        injection_detected = True

    return SanitizeResult(text=text, injection_detected=injection_detected)
