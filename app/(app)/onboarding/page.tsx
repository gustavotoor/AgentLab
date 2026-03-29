/**
 * Onboarding flow page — 3 animated steps with progress bar.
 *
 * Step 1: Welcome — introduces AgentLab features with sparkle animation.
 * Step 2: Profile — name, language preference, avatar/emoji picker.
 * Step 3: API Key — BYOK input with validation and skip option.
 *
 * Uses framer-motion AnimatePresence for smooth step transitions.
 * On completion, PATCHes /api/user/profile to set onboardingDone=true
 * and redirects to /dashboard.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LayoutTemplate,
  Key,
  Radio,
  ArrowRight,
  ArrowLeft,
  User,
  Globe,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

/** Total number of onboarding steps */
const TOTAL_STEPS = 3;

/** Available avatar emojis for the optional picker */
const AVATAR_EMOJIS = [
  "😊", "😎", "🤖", "🧑‍💻", "🚀", "🦊", "🐱", "🌟",
  "🎯", "💡", "🔥", "🧠", "👾", "🎨", "🦁", "🐼",
];

/** Slide animation variants for step transitions */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 2 state
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [selectedEmoji, setSelectedEmoji] = useState("");

  // Step 3 state
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid">("idle");

  // Finishing state
  const [finishing, setFinishing] = useState(false);

  /** Pre-fill name from session when available */
  useEffect(() => {
    if (session?.user?.name && !name) {
      setName(session.user.name);
    }
  }, [session, name]);

  /** Navigate to the next step */
  function goNext() {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  /** Navigate to the previous step */
  function goBack() {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  /** Validate the entered API key against the backend */
  async function handleValidateKey() {
    if (!apiKey.trim()) return;
    setValidating(true);
    setKeyStatus("idle");

    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (res.ok) {
        setKeyStatus("valid");
      } else {
        setKeyStatus("invalid");
      }
    } catch {
      setKeyStatus("invalid");
    } finally {
      setValidating(false);
    }
  }

  /** Complete onboarding: save profile and redirect to dashboard */
  async function handleFinish() {
    setFinishing(true);

    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || session?.user?.name || "User",
          language,
          avatar: selectedEmoji || undefined,
          onboardingDone: true,
        }),
      });

      router.push("/dashboard");
    } catch {
      // Redirect anyway — the user can fix profile in Settings
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] dark:bg-[#111113] p-6">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;

            return (
              <div key={stepNum} className="flex items-center">
                {/* Dot */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    backgroundColor: isActive || isCompleted
                      ? "rgb(245, 158, 11)"
                      : "rgb(229, 231, 235)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                >
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.div>

                {/* Connecting line */}
                {stepNum < TOTAL_STEPS && (
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted
                        ? "rgb(245, 158, 11)"
                        : "rgb(229, 231, 235)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-0.5 mx-1.5"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content card */}
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-border/50 shadow-xl shadow-black/[0.03] p-8 overflow-hidden min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ───── Step 1: Welcome ───── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex-1 flex flex-col"
              >
                {/* Logo with sparkle animation */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(245, 158, 11, 0.0)",
                        "0 0 0 12px rgba(245, 158, 11, 0.08)",
                        "0 0 0 0 rgba(245, 158, 11, 0.0)",
                      ],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-center">
                  {t("welcomeTitle")}
                </h1>
                <p className="text-muted-foreground text-sm text-center mt-3 leading-relaxed max-w-sm mx-auto">
                  {t("welcomeDescription")}
                </p>

                {/* Feature icons */}
                <div className="flex items-center justify-center gap-6 mt-8">
                  {[
                    { icon: LayoutTemplate, label: t("featureTemplates") },
                    { icon: Key, label: t("featureBYOK") },
                    { icon: Radio, label: t("featureStreaming") },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Spacer + CTA */}
                <div className="mt-auto pt-8">
                  <Button
                    onClick={goNext}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-amber-500/20 text-sm"
                  >
                    {t("letsGo")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ───── Step 2: Profile ───── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center">
                    <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {t("profileTitle")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t("profileDescription")}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 flex-1">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="onboard-name" className="text-sm font-medium">
                      {t("nameLabel")}
                    </Label>
                    <Input
                      id="onboard-name"
                      type="text"
                      placeholder={t("namePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      {t("languageLabel")}
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pt-BR">
                          <span className="flex items-center gap-2">
                            <span>PT-BR</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="en">
                          <span className="flex items-center gap-2">
                            <span>English</span>
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Avatar / Emoji picker */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Smile className="h-3.5 w-3.5" />
                      {t("avatarLabel")}
                    </Label>
                    <div className="grid grid-cols-8 gap-2">
                      {AVATAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() =>
                            setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)
                          }
                          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-150 border ${
                            selectedEmoji === emoji
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm scale-110"
                              : "border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-border"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="h-12 rounded-xl flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("back")}
                  </Button>
                  <Button
                    onClick={goNext}
                    className="h-12 rounded-xl flex-[2] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-amber-500/20"
                  >
                    {t("continue")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ───── Step 3: API Key ───── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center">
                    <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {t("apiKeyTitle")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeyDescription")}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 flex-1">
                  {/* BYOK explanation */}
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200/40 dark:border-amber-800/20 p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("byokExplanation")}
                    </p>
                    <a
                      href="https://console.anthropic.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block"
                    >
                      {t("getKeyLink")}
                    </a>
                  </div>

                  {/* API key input */}
                  <div className="space-y-2">
                    <Label htmlFor="onboard-api-key" className="text-sm font-medium">
                      {t("apiKeyLabel")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="onboard-api-key"
                        type={showKey ? "text" : "password"}
                        placeholder="sk-ant-api03-..."
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setKeyStatus("idle");
                        }}
                        className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20 pr-11 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Validation feedback */}
                    <AnimatePresence mode="wait">
                      {keyStatus === "valid" && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {t("keyValid")}
                          </span>
                        </motion.div>
                      )}
                      {keyStatus === "invalid" && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-red-600 dark:text-red-400"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {t("keyInvalid")}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Validate button */}
                  <Button
                    variant="outline"
                    onClick={handleValidateKey}
                    disabled={!apiKey.trim() || validating}
                    className="w-full h-11 rounded-xl"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("validating")}
                      </>
                    ) : (
                      t("validateButton")
                    )}
                  </Button>
                </div>

                {/* Navigation */}
                <div className="mt-8 space-y-3">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={goBack}
                      className="h-12 rounded-xl flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t("back")}
                    </Button>
                    <Button
                      onClick={handleFinish}
                      disabled={finishing}
                      className="h-12 rounded-xl flex-[2] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-amber-500/20"
                    >
                      {finishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {t("finish")}
                          <Sparkles className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Skip link */}
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full text-center text-sm text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {t("skipForNow")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
