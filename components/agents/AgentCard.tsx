/**
 * Agent card component — displays an agent's info in a grid/list layout.
 * Shows emoji, name, template type, conversation count, and action buttons.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Pencil, Copy, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    emoji: string;
    templateId: string;
    tone: string;
    totalChats: number;
    updatedAt: string;
  };
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function AgentCard({ agent, onDuplicate, onDelete, className }: AgentCardProps) {
  const t = useTranslations("agents");

  const timeAgo = getRelativeTime(new Date(agent.updatedAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative bg-card rounded-2xl border border-border/50 p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center text-2xl">
            {agent.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-tight">{agent.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{agent.templateId.replace(/-/g, " ")}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="text-muted-foreground text-lg">⋯</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem asChild>
              <Link href={`/agents/${agent.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("edit")}
              </Link>
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(agent.id)}>
                <Copy className="h-4 w-4 mr-2" />
                {t("duplicate")}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(agent.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{agent.totalChats} {t("conversations").toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Chat button */}
      <Link href={`/agents/${agent.id}`}>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4 rounded-xl text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-2" />
          {t("chat")}
        </Button>
      </Link>
    </motion.div>
  );
}

/** Returns a human-readable relative time string from a Date */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
