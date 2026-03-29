/**
 * Create Agent page — 3-step wizard for creating a new AI agent.
 *
 * Step 1: Choose a template from a visual grid (pre-selects if ?template=... is set)
 * Step 2: Customize name, emoji, personality, tone, and language
 * Step 3: Extra instructions + live system prompt preview
 *
 * On submission, POSTs to /api/agents and redirects to /agents/[id].
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Shared template data                                               */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  emoji: string;
  nameKey: string;
  descriptionKey: string;
  category: string;
}

const TEMPLATES: Template[] = [
  { id: "personal-assistant", emoji: "\u{1F91D}", nameKey: "personalAssistant", descriptionKey: "personalAssistantDesc", category: "productivity" },
  { id: "business-consultant", emoji: "\u{1F4BC}", nameKey: "businessConsultant", descriptionKey: "businessConsultantDesc", category: "business" },
  { id: "professor", emoji: "\u{1F393}", nameKey: "professor", descriptionKey: "professorDesc", category: "creative" },
  { id: "writer", emoji: "\u270D\uFE0F", nameKey: "writer", descriptionKey: "writerDesc", category: "creative" },
  { id: "dev-assistant", emoji: "\u{1F4BB}", nameKey: "devAssistant", descriptionKey: "devAssistantDesc", category: "technical" },
  { id: "coach", emoji: "\u{1F9D8}", nameKey: "coach", descriptionKey: "coachDesc", category: "productivity" },
  { id: "attendant", emoji: "\u{1F6D2}", nameKey: "attendant", descriptionKey: "attendantDesc", category: "business" },
  { id: "free-character", emoji: "\u{1F3AD}", nameKey: "freeCharacter", descriptionKey: "freeCharacterDesc", category: "creative" },
];

const EMOJI_OPTIONS = [
  "\u{1F916}", "\u{1F4A1}", "\u{1F525}", "\u{1F680}", "\u{1F3AF}",
  "\u{1F48E}", "\u{1F31F}", "\u{26A1}", "\u{1F9E0}", "\u{1F3A8}",
  "\u{1F4DA}", "\u{1F50D}", "\u{1F4AC}", "\u{1F393}", "\u{2764}\uFE0F",
  "\u{1F3C6}", "\u{1F30D}", "\u{1F511}", "\u{1F4DD}", "\u{1F308}",
];

const TONE_OPTIONS = ["formal", "casual", "technical", "friendly"] as const;
const LANGUAGE_OPTIONS = ["pt-BR", "en", "bilingual"] as const;

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current, total }: { current: number; total: number }) {
  const t = useTranslations("agents");
  const stepLabels = [t("stepTemplate"), t("stepCustomize"), t("stepFinish")];

  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isComplete = step < current;
        const isActive = step === current;

        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 0.9,
                  backgroundColor: isComplete || isActive ? undefined : undefined,
                }}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                  isComplete
                    ? "bg-amber-500 border-amber-500 text-white"
                    : isActive
                    ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : step}
              </motion.div>
              <span
                className={cn(
                  "text-[11px] mt-1.5 font-medium whitespace-nowrap",
                  isActive
                    ? "text-amber-600 dark:text-amber-400"
                    : isComplete
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {stepLabels[i]}
              </span>
            </div>

            {/* Connector line */}
            {i < total - 1 && (
              <div className="relative w-16 sm:w-24 h-0.5 mx-2 mb-5">
                <div className="absolute inset-0 bg-border rounded-full" />
                <motion.div
                  initial={false}
                  animate={{ scaleX: isComplete ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-amber-500 rounded-full origin-left"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function NewAgentPage() {
  const t = useTranslations("agents");
  const tt = useTranslations("templates");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [templateId, setTemplateId] = useState(
    searchParams.get("template") ?? ""
  );
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("\u{1F916}");
  const [personality, setPersonality] = useState("");
  const [tone, setTone] = useState<string>("friendly");
  const [locale, setLocale] = useState<string>("pt-BR");
  const [extraSoul, setExtraSoul] = useState("");

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

  /* ── Navigation ────────────────────────────────────────── */
  const canGoNext = useCallback(() => {
    if (step === 1) return !!templateId;
    if (step === 2) return name.trim().length > 0 && personality.trim().length > 0;
    return true;
  }, [step, templateId, name, personality]);

  const goNext = () => {
    if (canGoNext() && step < 3) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  /* ── Submit ────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
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
        const data = await res.json();
        router.push(`/agents/${data.id}`);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step content ──────────────────────────────────────── */
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    goNext();
  };
  const handleBack = () => {
    setDirection(-1);
    goBack();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/15">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("createTitle")}</h1>
        </div>
        <StepIndicator current={step} total={3} />
      </motion.div>

      {/* ── Step content ───────────────────────────────────── */}
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <h2 className="font-semibold text-lg">{t("chooseTemplate")}</h2>
              <p className="text-sm text-muted-foreground">{t("chooseTemplateHint")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TEMPLATES.map((tpl) => (
                <motion.button
                  key={tpl.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTemplateId(tpl.id)}
                  className={cn(
                    "text-left p-4 rounded-2xl border-2 transition-all duration-200",
                    templateId === tpl.id
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md shadow-amber-500/10"
                      : "border-border/50 bg-card hover:border-border hover:shadow-sm"
                  )}
                >
                  <div className="text-3xl mb-2">{tpl.emoji}</div>
                  <h3 className="font-semibold text-sm">{tt(tpl.nameKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tt(tpl.descriptionKey)}
                  </p>
                  {templateId === tpl.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2"
                    >
                      <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                        {t("selected")}
                      </Badge>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="text-center mb-2">
              <h2 className="font-semibold text-lg">{t("customizeAgent")}</h2>
              <p className="text-sm text-muted-foreground">{t("customizeHint")}</p>
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

            {/* Tone + Language row */}
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
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="text-center mb-6">
              <h2 className="font-semibold text-lg">{t("finalTouches")}</h2>
              <p className="text-sm text-muted-foreground">{t("finalTouchesHint")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Extra instructions */}
              <div className="space-y-3">
                <label className="text-sm font-medium">{t("extraInstructions")}</label>
                <Textarea
                  placeholder={t("extraInstructionsPlaceholder")}
                  value={extraSoul}
                  onChange={(e) => setExtraSoul(e.target.value)}
                  rows={12}
                  className="rounded-xl border-border/50 focus-visible:ring-amber-500/30 focus-visible:border-amber-400 resize-none"
                />
              </div>

              {/* Live preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t("promptPreview")}</label>
                </div>
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4 h-[calc(100%-2rem)] overflow-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {systemPrompt}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation buttons ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between pt-2"
      >
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={handleBack}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>

        {step < 3 ? (
          <Button
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/15"
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            {t("next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/15"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("createAgent")}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </motion.div>
    </div>
  );
}
