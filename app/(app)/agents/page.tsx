/**
 * My Agents page — lists all agents created by the authenticated user.
 * Supports grid/list toggle, fetches from /api/agents, and provides
 * duplicate and delete actions. Includes a confirmation dialog for
 * deletion, a loading skeleton state, and an empty-state CTA.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  List,
  Bot,
  Store,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentCard } from "@/components/agents/AgentCard";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Agent {
  id: string;
  name: string;
  emoji: string;
  templateId: string;
  tone: string;
  totalChats: number;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AgentsPage() {
  const t = useTranslations("agents");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch agents ──────────────────────────────────────── */
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  /* ── Duplicate agent ───────────────────────────────────── */
  const handleDuplicate = useCallback(
    async (id: string) => {
      const agent = agents.find((a) => a.id === id);
      if (!agent) return;

      try {
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${agent.name} (copy)`,
            emoji: agent.emoji,
            templateId: agent.templateId,
            tone: agent.tone,
          }),
        });

        if (res.ok) {
          await fetchAgents();
        }
      } catch {
        // silent
      }
    },
    [agents, fetchAgents]
  );

  /* ── Delete agent ──────────────────────────────────────── */
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/agents/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== deleteId));
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  const agentToDelete = agents.find((a) => a.id === deleteId);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/15">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                view === "grid"
                  ? "bg-background shadow-sm text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                view === "list"
                  ? "bg-background shadow-sm text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Create button */}
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/15"
          >
            <Link href="/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("createNew")}
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        /* Skeleton loading state */
        <div
          className={cn(
            "gap-4",
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {[...Array(6)].map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "rounded-2xl",
                view === "grid" ? "h-[180px]" : "h-[88px]"
              )}
            />
          ))}
        </div>
      ) : agents.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/60"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{t("emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {t("emptyDescription")}
          </p>
          <Button
            asChild
            className="mt-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/15"
          >
            <Link href="/store">
              <Store className="h-4 w-4 mr-2" />
              {t("goToStore")}
            </Link>
          </Button>
        </motion.div>
      ) : (
        /* Agent cards */
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "gap-4",
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col"
            )}
          >
            {agents.map((agent) => (
              <motion.div key={agent.id} variants={itemVariants}>
                <AgentCard
                  agent={agent}
                  onDuplicate={handleDuplicate}
                  onDelete={(id) => setDeleteId(id)}
                  className={view === "list" ? "flex-row" : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Delete confirmation dialog ─────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDescription", { name: agentToDelete?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
