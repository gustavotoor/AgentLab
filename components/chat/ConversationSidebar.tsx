/**
 * ConversationSidebar -- left panel showing conversation history for an agent.
 *
 * - Fetches conversations from /api/conversations/[agentId].
 * - Active conversation is highlighted with amber accent.
 * - "New Conversation" button at the top.
 * - Collapsible on mobile via sheet overlay.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  X,
  PanelLeftClose,
  PanelLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
}

interface ConversationSidebarProps {
  /** The agent id to fetch conversations for */
  agentId: string;
  /** Currently active conversation id (if any) */
  activeConversationId?: string | null;
  /** Called when the user selects a conversation */
  onSelectConversation: (id: string) => void;
  /** Called when the user starts a new conversation */
  onNewConversation: () => void;
  /** Whether the sidebar is open (mobile) */
  isOpen: boolean;
  /** Toggle sidebar visibility */
  onToggle: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Formats an ISO date string into a short readable date */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConversationSidebar({
  agentId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const t = useTranslations("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetch conversation list for the current agent */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations/${agentId}`);
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
      }
    } catch {
      /* silently fail — user can retry */
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ---------------------------------------------------------------- */
  /*  Sidebar content (shared between desktop and mobile)              */
  /* ---------------------------------------------------------------- */

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-sm font-semibold tracking-tight">{t("conversations")}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg lg:hidden"
          onClick={onToggle}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* New Conversation */}
      <div className="px-3 pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewConversation}
          className="w-full justify-start rounded-xl text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          {t("newConversation")}
        </Button>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2 py-2">
        {loading ? (
          <div className="space-y-2 px-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{t("noConversations")}</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv, i) => {
              const isActive = conv.id === activeConversationId;
              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group/conv",
                    isActive
                      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        isActive ? "text-amber-500" : "text-muted-foreground/50"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-medium leading-tight">
                        {conv.title || t("untitled")}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {formatDate(conv.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="hidden lg:flex flex-col border-r border-border/40 bg-card/40 backdrop-blur-sm h-full overflow-hidden flex-shrink-0"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop toggle (when collapsed) */}
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "fixed top-[4.5rem] z-20 h-8 w-8 rounded-lg transition-all",
            isOpen ? "left-[252px]" : "left-4"
          )}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={onToggle}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card border-r border-border/50 shadow-xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
