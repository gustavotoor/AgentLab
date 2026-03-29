/**
 * ChatWindow -- main chat container that manages messages, streaming, and scroll.
 *
 * - Uses Vercel AI SDK `useChat` for real-time streaming from /api/chat.
 * - Renders agent info header (emoji, name, template type).
 * - Auto-scrolls to the latest message.
 * - "New Conversation" button in the header.
 * - Passes agentId and conversationId in the request body.
 */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  RotateCcw,
  Sparkles,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  templateId: string;
  tone: string;
}

interface ChatWindowProps {
  /** Agent data to display and chat with */
  agent: AgentData;
  /** Current conversation id (null = start new) */
  conversationId: string | null;
  /** Called when a new conversation is created server-side */
  onConversationCreated?: (id: string) => void;
  /** Called when the user clicks "New Conversation" */
  onNewConversation: () => void;
  /** Toggle the conversation sidebar (mobile) */
  onToggleSidebar?: () => void;
  /** Whether the sidebar is currently open */
  sidebarOpen?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ChatWindow({
  agent,
  conversationId,
  onConversationCreated,
  onNewConversation,
  onToggleSidebar,
  sidebarOpen,
}: ChatWindowProps) {
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      agentId: agent.id,
      conversationId,
    },
    onFinish: (message) => {
      /* If the server returns a conversationId header, propagate it */
      // The API should return the conversationId; handled via response metadata
    },
    onResponse: (response) => {
      const newConvId = response.headers.get("x-conversation-id");
      if (newConvId && newConvId !== conversationId) {
        onConversationCreated?.(newConvId);
      }
    },
  });

  /** Reset messages when conversation changes */
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    /** Fetch existing messages for the selected conversation */
    async function loadMessages() {
      try {
        const res = await fetch(`/api/conversations/${agent.id}/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(
            data.messages?.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              createdAt: new Date(m.createdAt),
            })) ?? []
          );
        }
      } catch {
        /* fail silently */
      }
    }

    loadMessages();
  }, [conversationId, agent.id, setMessages]);

  /** Auto-scroll to bottom on new messages */
  useEffect(() => {
    if (!hasScrolledUp) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, hasScrolledUp]);

  /** Detect if user has scrolled up */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setHasScrolledUp(!atBottom);
  }, []);

  /** Scroll-to-bottom handler */
  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
    setHasScrolledUp(false);
  }, []);

  /** Submit wrapper that invokes the useChat handler */
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    handleSubmit();
  }, [input, handleSubmit]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-8 w-8 rounded-lg lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Agent info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center text-xl shadow-sm">
              {agent.emoji}
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight leading-tight">
                {agent.name}
              </h2>
              <p className="text-[11px] text-muted-foreground capitalize">
                {agent.templateId.replace(/-/g, " ")}
              </p>
            </div>
          </div>
        </div>

        {/* New conversation */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNewConversation}
          className="rounded-xl text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          {t("newConversation")}
        </Button>
      </motion.header>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center mb-4 shadow-sm">
              <span className="text-3xl">{agent.emoji}</span>
            </div>
            <h3 className="font-semibold tracking-tight text-lg">{agent.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("emptyState")}
            </p>

            {/* Suggested starters */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[t("starter1"), t("starter2"), t("starter3")].map((starter, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  onClick={() => {
                    handleInputChange({ target: { value: starter } } as React.ChangeEvent<HTMLTextAreaElement>);
                  }}
                  className="px-4 py-2 rounded-2xl border border-border/50 bg-card text-xs text-muted-foreground hover:text-foreground hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all duration-150"
                >
                  <Sparkles className="h-3 w-3 inline mr-1.5 text-amber-500" />
                  {starter}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Message list */
          <div className="flex flex-col space-y-3 max-w-3xl mx-auto w-full">
            <AnimatePresence initial={false}>
              {messages.map((message, idx) => (
                <MessageBubble
                  key={message.id}
                  role={message.role as "user" | "assistant"}
                  content={message.content}
                  createdAt={message.createdAt?.toISOString?.() ?? new Date().toISOString()}
                  isStreaming={isLoading && idx === messages.length - 1 && message.role === "assistant"}
                />
              ))}
            </AnimatePresence>

            {/* Loading indicator while waiting for first token */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-start flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/60 dark:bg-muted/40 border border-border/40"
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground ml-1">{t("thinking")}</span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {hasScrolledUp && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={scrollToBottom}
              className="rounded-full shadow-md text-xs bg-background/90 backdrop-blur-sm"
            >
              {t("scrollToBottom")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
}
