/**
 * ChatInput -- auto-growing textarea with send button for the chat interface.
 *
 * - Textarea expands from 1 to 5 rows as the user types.
 * - Enter sends the message; Shift+Enter inserts a newline.
 * - Send button activates (amber accent) when there is text.
 * - Disabled state while assistant is responding.
 */
"use client";

import { useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatInputProps {
  /** Current value of the textarea */
  value: string;
  /** Callback fired when the value changes */
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Callback fired when the user submits the message */
  onSubmit: () => void;
  /** When true, the input is disabled (assistant is responding) */
  isLoading?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_ROWS = 1;
const MAX_ROWS = 5;
const LINE_HEIGHT = 24; // px — matches leading-6

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  const t = useTranslations("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-resize the textarea to fit content up to MAX_ROWS */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_ROWS + 16; // + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  /** Handle keyboard shortcuts: Enter to send, Shift+Enter for newline */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading) {
        e.preventDefault();
        if (value.trim()) {
          onSubmit();
        }
      }
    },
    [value, onSubmit, isLoading]
  );

  /** Wrapped onChange that also triggers auto-resize */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e);
      requestAnimationFrame(autoResize);
    },
    [onChange, autoResize]
  );

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="border-t border-border/40 bg-background/80 backdrop-blur-md px-4 py-3 sm:px-6">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-card px-4 py-2.5 transition-colors duration-150",
          isLoading
            ? "border-border/30 opacity-75"
            : "border-border/50 focus-within:border-amber-400/60 focus-within:shadow-sm focus-within:shadow-amber-500/5"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={t("placeholder")}
          rows={MIN_ROWS}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm leading-6 placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed",
            "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          )}
          style={{ minHeight: `${LINE_HEIGHT + 16}px`, maxHeight: `${LINE_HEIGHT * MAX_ROWS + 16}px` }}
        />

        {/* Send button */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="icon"
                disabled
                className="h-8 w-8 rounded-xl bg-muted"
              >
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="send"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="icon"
                disabled={!canSend}
                onClick={onSubmit}
                className={cn(
                  "h-8 w-8 rounded-xl transition-all duration-200",
                  canSend
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-105"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-muted-foreground/50 text-center mt-2 select-none">
        {t("enterToSend")}
      </p>
    </div>
  );
}
