/**
 * MessageBubble -- renders a single chat message with role-appropriate styling.
 *
 * - User messages: right-aligned with amber/orange gradient, white text.
 * - Assistant messages: left-aligned with subtle muted background, markdown support.
 * - Copy-to-clipboard button appears on hover.
 * - Streaming indicator (blinking cursor) when the assistant is still typing.
 */
"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MessageBubbleProps {
  /** The message role -- "user" or "assistant" */
  role: "user" | "assistant";
  /** Raw text content of the message */
  content: string;
  /** ISO timestamp string */
  createdAt?: string;
  /** Whether the assistant is still streaming this message */
  isStreaming?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Lightweight markdown renderer                                      */
/* ------------------------------------------------------------------ */

/**
 * Converts a subset of markdown to React elements:
 * bold, italic, inline code, fenced code blocks, and unordered lists.
 */
function renderMarkdown(raw: string): React.ReactNode[] {
  const blocks = raw.split(/\n{2,}/);

  return blocks.map((block, bi) => {
    const trimmed = block.trim();

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
      return (
        <pre
          key={bi}
          className="bg-zinc-900 text-zinc-100 text-[13px] leading-relaxed rounded-xl p-4 overflow-x-auto my-2 font-mono"
        >
          {lang && (
            <span className="block text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">
              {lang}
            </span>
          )}
          <code>{code}</code>
        </pre>
      );
    }

    // Unordered list
    if (/^[-*] /.test(trimmed)) {
      const items = trimmed.split(/\n/).filter((l) => /^[-*] /.test(l.trim()));
      return (
        <ul key={bi} className="list-disc list-inside space-y-1 my-1.5">
          {items.map((item, ii) => (
            <li key={ii}>{renderInline(item.replace(/^[-*] /, ""))}</li>
          ))}
        </ul>
      );
    }

    // Ordered list
    if (/^\d+\. /.test(trimmed)) {
      const items = trimmed.split(/\n/).filter((l) => /^\d+\. /.test(l.trim()));
      return (
        <ol key={bi} className="list-decimal list-inside space-y-1 my-1.5">
          {items.map((item, ii) => (
            <li key={ii}>{renderInline(item.replace(/^\d+\.\s/, ""))}</li>
          ))}
        </ol>
      );
    }

    // Regular paragraph
    return (
      <p key={bi} className="my-1 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });
}

/** Renders inline markdown: bold, italic, inline code */
function renderInline(text: string): React.ReactNode[] {
  // Regex: code (`...`), bold (**...**), italic (*...* or _..._)
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="bg-zinc-200 dark:bg-zinc-800 text-[13px] px-1.5 py-0.5 rounded-md font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/* ------------------------------------------------------------------ */
/*  Format timestamp                                                   */
/* ------------------------------------------------------------------ */

/** Returns a short time string (e.g. "14:32") from an ISO date string */
function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MessageBubble({ role, content, createdAt, isStreaming }: MessageBubbleProps) {
  const t = useTranslations("chat");
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";
  const time = useMemo(() => formatTime(createdAt), [createdAt]);

  /** Copy message content to clipboard */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may not be available */
    }
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("group flex flex-col max-w-[85%] md:max-w-[70%]", isUser ? "self-end items-end" : "self-start items-start")}
    >
      {/* Bubble */}
      <div
        className={cn(
          "relative rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/15"
            : "bg-muted/60 dark:bg-muted/40 text-foreground border border-border/40"
        )}
      >
        {/* Content */}
        <div className={cn("whitespace-pre-wrap break-words", isUser && "[&_code]:bg-white/20 [&_code]:text-white")}>
          {isUser ? content : renderMarkdown(content)}
        </div>

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block ml-0.5 w-[7px] h-[18px] bg-amber-500 dark:bg-amber-400 rounded-sm animate-pulse align-text-bottom" />
        )}

        {/* Copy button on hover */}
        <div
          className={cn(
            "absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            isUser ? "left-0" : "right-0"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg bg-background shadow-sm border-border/60"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {copied ? t("copied") : t("copy")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Timestamp */}
      {time && (
        <span className="text-[11px] text-muted-foreground mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {time}
        </span>
      )}
    </motion.div>
  );
}
