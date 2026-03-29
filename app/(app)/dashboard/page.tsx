/**
 * Dashboard page — main view after login.
 * Shows welcome message, stats cards, recent agents grid, and quick CTA.
 * Design: Clean grid with warm accent colors, subtle animations.
 */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Zap, Plus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agents/AgentCard";
import { useTranslations } from "next-intl";

interface DashboardData {
  totalAgents: number;
  totalConversations: number;
  messagesToday: number;
  recentAgents: Array<{
    id: string;
    name: string;
    emoji: string;
    templateId: string;
    tone: string;
    totalChats: number;
    updatedAt: string;
  }>;
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [agentsRes, conversationsRes] = await Promise.all([
          fetch("/api/agents"),
          fetch("/api/conversations/stats"),
        ]);

        const agents = agentsRes.ok ? await agentsRes.json() : [];
        const stats = conversationsRes.ok ? await conversationsRes.json() : { total: 0, today: 0 };

        setData({
          totalAgents: agents.length,
          totalConversations: stats.total ?? 0,
          messagesToday: stats.today ?? 0,
          recentAgents: agents.slice(0, 6),
        });
      } catch {
        setData({
          totalAgents: 0,
          totalConversations: 0,
          messagesToday: 0,
          recentAgents: [],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const stats = [
    {
      icon: Bot,
      label: t("totalAgents"),
      value: data?.totalAgents ?? 0,
      color: "from-amber-400 to-orange-500",
      bg: "bg-amber-50 dark:bg-amber-900/15",
    },
    {
      icon: MessageSquare,
      label: t("totalConversations"),
      value: data?.totalConversations ?? 0,
      color: "from-blue-400 to-indigo-500",
      bg: "bg-blue-50 dark:bg-blue-900/15",
    },
    {
      icon: Zap,
      label: t("messagesToday"),
      value: data?.messagesToday ?? 0,
      color: "from-emerald-400 to-teal-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/15",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("welcome")}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your agents.
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div
            key={label}
            {...fadeIn}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 bg-gradient-to-r ${color} bg-clip-text`} style={{ color: "var(--amber-500, #f59e0b)" }} />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-8 w-16 rounded-lg" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">{value}</p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick action */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl border border-amber-200/30 dark:border-amber-800/20 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight">{t("quickAction")}</h3>
              <p className="text-sm text-muted-foreground">
                Browse templates and create your perfect AI assistant.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/15">
            <Link href="/store">
              <Plus className="h-4 w-4 mr-2" />
              {t("createFirst") || "Create Agent"}
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Recent agents */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("recentAgents")}</h2>
          {(data?.totalAgents ?? 0) > 0 && (
            <Link
              href="/agents"
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-2xl" />
            ))}
          </div>
        ) : data && data.recentAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border/60">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">{t("noAgents")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Get started by visiting the store and creating your first agent.
            </p>
            <Button asChild variant="outline" className="mt-4 rounded-xl">
              <Link href="/store">
                <Plus className="h-4 w-4 mr-2" />
                {t("createFirst") || "Create your first agent"}
              </Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
