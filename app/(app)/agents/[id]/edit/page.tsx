/**
 * Edit Agent page — pre-filled form for modifying an existing agent.
 * Fetches agent data from /api/agents/[id], displays a single-page form
 * mirroring the creation wizard fields, and PATCHes on submit.
 * Includes a danger zone with delete functionality at the bottom.
 */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Shared constants                                                   */
/* ------------------------------------------------------------------ */

const TEMPLATES = [
  { id: "personal-assistant", emoji: "\u{1F91D}", nameKey: "personalAssistant" },
  { id: "business-consultant", emoji: "\u{1F4BC}", nameKey: "businessConsultant" },
  { id: "professor", emoji: "\u{1F393}", nameKey: "professor" },
  { id: "writer", emoji: "\u270D\uFE0F", nameKey: "writer" },
  { id: "dev-assistant", emoji: "\u{1F4BB}", nameKey: "devAssistant" },
  { id: "coach", emoji: "\u{1F9D8}", nameKey: "coach" },
  { id: "attendant", emoji: "\u{1F6D2}", nameKey: "attendant" },
  { id: "free-character", emoji: "\u{1F3AD}", nameKey: "freeCharacter" },
] as const;

const EMOJI_OPTIONS = [
  "\u{1F916}", "\u{1F4A1}", "\u{1F525}", "\u{1F680}", "\u{1F3AF}",
  "\u{1F48E}", "\u{1F31F}", "\u{26A1}", "\u{1F9E0}", "\u{1F3A8}",
  "\u{1F4DA}", "\u{1F50D}", "\u{1F4AC}", "\u{1F393}", "\u{2764}\uFE0F",
  "\u{1F3C6}", "\u{1F30D}", "\u{1F511}", "\u{1F4DD}", "\u{1F308}",
];

const TONE_OPTIONS = ["formal", "casual", "technical", "friendly"] as const;
const LANGUAGE_OPTIONS = ["pt-BR", "en", "bilingual"] as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  templateId: string;
  personality: string;
  tone: string;
  locale: string;
  extraSoul: string | null;
  systemPrompt: string;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function EditAgentPage() {
  const t = useTranslations("agents");
  const tt = useTranslations("templates");
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("\u{1F916}");
  const [templateId, setTemplateId] = useState("");
  const [personality, setPersonality] = useState("");
  const [tone, setTone] = useState("friendly");
  const [locale, setLocale] = useState("pt-BR");
  const [extraSoul, setExtraSoul] = useState("");

  /* ── Fetch agent ───────────────────────────────────────── */
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (res.ok) {
          const data: AgentData = await res.json();
          setName(data.name);
          setEmoji(data.emoji);
          setTemplateId(data.templateId);
          setPersonality(data.personality);
          setTone(data.tone);
          setLocale(data.locale);
          setExtraSoul(data.extraSoul ?? "");
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [agentId]);

  /* ── System prompt preview ─────────────────────────────── */
  const systemPrompt = useMemo(() => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    const tplName = tpl ? tt(tpl.nameKey) : "Agent";

    return [
      `You are ${name || "[Agent Name]"}, an AI agent from AgentLab.`,
      "",
      `Template: ${tplName}`,
      `Personality: ${personality || "[Not yet defined]"}`,
      "",
      `Tone: ${tone}`,
      `Language: ${locale}`,
      "",
      extraSoul ? `Extra instructions:\n${extraSoul}` : "",
      "",
      `Always stay true to your personality. Respond in a ${tone} manner.`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [name, templateId, personality, tone, locale, extraSoul, tt]);

  /* ── Save ──────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          emoji,
          templateId,
          personality,
          tone,
          locale,
          extraSoul: extraSoul || undefined,
          systemPrompt,
        }),
      });

      if (res.ok) {
        router.push(`/agents/${agentId}`);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [agentId, name, emoji, templateId, personality, tone, locale, extraSoul, systemPrompt, router]);

  /* ── Delete ────────────────────────────────────────────── */
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/agents");
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [agentId, router]);

  /* ── Loading skeleton ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-10 w-10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center text-2xl">
            {emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              {t("editTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
        </div>

        <Button
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/15"
          onClick={handleSave}
          disabled={saving || !name.trim() || !personality.trim()}
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          {t("save")}
        </Button>
      </motion.div>

      {/* ── Form ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left column: form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template indicator */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("template")}</label>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
              <div className="text-2xl">
                {TEMPLATES.find((t) => t.id === templateId)?.emoji ?? "\u{1F916}"}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {TEMPLATES.find((t) => t.id === templateId)
                    ? tt(TEMPLATES.find((t) => t.id === templateId)!.nameKey)
                    : templateId}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {templateId.replace(/-/g, " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("agentName")}</label>
            <Input
              placeholder={t("agentNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border-border/50 focus-visible:ring-amber-500/30 focus-visible:border-amber-400"
            />
          </div>

          {/* Emoji picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("agentEmoji")}</label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-xl border border-border/40">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-150 hover:bg-muted",
                    emoji === em
                      ? "bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-500 scale-110"
                      : ""
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("personality")}</label>
            <Textarea
              placeholder={t("personalityPlaceholder")}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={4}
              className="rounded-xl border-border/50 focus-visible:ring-amber-500/30 focus-visible:border-amber-400 resize-none"
            />
          </div>

          {/* Tone + Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("tone")}</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-11 rounded-xl border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`tone_${opt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("language")}</label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="h-11 rounded-xl border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`lang_${opt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Extra instructions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("extraInstructions")}</label>
            <Textarea
              placeholder={t("extraInstructionsPlaceholder")}
              value={extraSoul}
              onChange={(e) => setExtraSoul(e.target.value)}
              rows={5}
              className="rounded-xl border-border/50 focus-visible:ring-amber-500/30 focus-visible:border-amber-400 resize-none"
            />
          </div>
        </div>

        {/* Right column: live preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">{t("promptPreview")}</label>
          </div>
          <div className="bg-muted/30 border border-border/40 rounded-xl p-4 sticky top-20 max-h-[calc(100vh-8rem)] overflow-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {systemPrompt}
            </pre>
          </div>
        </div>
      </motion.div>

      {/* ── Danger zone ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="border border-red-200 dark:border-red-900/40 rounded-2xl p-5 bg-red-50/30 dark:bg-red-950/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">
              {t("dangerZone")}
            </h3>
            <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5">
              {t("dangerZoneDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("deleteAgent")}
          </Button>
        </div>
      </motion.div>

      {/* ── Delete dialog ──────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDescription", { name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteOpen(false)}
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
