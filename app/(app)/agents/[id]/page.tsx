/**
 * Agent chat page -- full chat interface for a specific agent.
 *
 * Layout: ConversationSidebar on the left (collapsible), ChatWindow in the center.
 * Fetches agent data from /api/agents/[id] on mount.
 * Responsive: sidebar hidden on mobile, toggled with a button.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";

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

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AgentChatPage() {
  const t = useTranslations("chat");
  const params = useParams<{ id: string }>();
  const agentId = params.id;

  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /** Fetch agent data on mount */
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (!res.ok) throw new Error("not found");
        const data: AgentData = await res.json();
        setAgent(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (agentId) fetchAgent();
  }, [agentId]);

  /** Toggle sidebar visibility */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  /** Start a new conversation (reset id) */
  const handleNewConversation = useCallback(() => {
    setConversationId(null);
  }, []);

  /** Switch to an existing conversation */
  const handleSelectConversation = useCallback((id: string) => {
    setConversationId(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  /** Called when the server creates a new conversation */
  const handleConversationCreated = useCallback((id: string) => {
    setConversationId(id);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm text-muted-foreground">{t("loadingAgent")}</p>
        </motion.div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
  /* ---------------------------------------------------------------- */

  if (error || !agent) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center px-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{t("agentNotFound")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {t("agentNotFoundDesc")}
          </p>
          <Button asChild variant="outline" className="mt-5 rounded-xl">
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToAgents")}
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main layout                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      {/* Conversation sidebar */}
      <ConversationSidebar
        agentId={agent.id}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatWindow
          agent={agent}
          conversationId={conversationId}
          onConversationCreated={handleConversationCreated}
          onNewConversation={handleNewConversation}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}
