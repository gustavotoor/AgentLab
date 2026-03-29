/**
 * Settings page — tabbed interface for user preferences and account management.
 *
 * Tab 1 (Account): Name, email (read-only), profile photo upload.
 * Tab 2 (API Key): BYOK management — add, view masked key, remove.
 * Tab 3 (Appearance): Theme selector (Light/Dark/System), language selector.
 * Tab 4 (Security): Change password, delete account with confirmation dialog.
 *
 * All data persists via /api/user/* endpoints.
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Key,
  Palette,
  Shield,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Globe,
  Upload,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { setUserLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

/** Fade-in animation shared across tab content */
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const [, startTransition] = useTransition();

  // ── Account tab state ──
  const [accountName, setAccountName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── API Key tab state ──
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [removingKey, setRemovingKey] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);

  // ── Security tab state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  // ── Delete account state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── Language state ──
  const [selectedLanguage, setSelectedLanguage] = useState("pt-BR");

  /** Populate name from session */
  useEffect(() => {
    if (session?.user?.name) {
      setAccountName(session.user.name);
    }
  }, [session]);

  /** Fetch current API key status on mount */
  const fetchKeyStatus = useCallback(async () => {
    setLoadingKey(true);
    try {
      const res = await fetch("/api/user/api-key");
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.valid ?? false);
        setMaskedKey(data.maskedKey ?? null);
      }
    } catch {
      // Key status unknown
    } finally {
      setLoadingKey(false);
    }
  }, []);

  useEffect(() => {
    fetchKeyStatus();
  }, [fetchKeyStatus]);

  // ── Handlers ──

  /** Save account name */
  async function handleSaveName() {
    if (!accountName.trim()) return;
    setSavingName(true);
    setNameSaved(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accountName.trim() }),
      });

      if (res.ok) {
        setNameSaved(true);
        await updateSession();
        setTimeout(() => setNameSaved(false), 3000);
      }
    } catch {
      // Silently fail
    } finally {
      setSavingName(false);
    }
  }

  /** Handle profile photo upload */
  async function handlePhotoUpload(file: File) {
    const formData = new FormData();
    formData.append("photo", file);

    try {
      await fetch("/api/user/photo", {
        method: "POST",
        body: formData,
      });
      await updateSession();
    } catch {
      // Silently fail
    }
  }

  /** Handle drag and drop events for photo upload */
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handlePhotoUpload(e.dataTransfer.files[0]);
    }
  }

  /** Save and validate a new API key */
  async function handleSaveKey() {
    if (!newApiKey.trim()) return;
    setSavingKey(true);
    setKeyStatus("idle");

    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });

      if (res.ok) {
        setKeyStatus("valid");
        setNewApiKey("");
        await fetchKeyStatus();
      } else {
        setKeyStatus("invalid");
      }
    } catch {
      setKeyStatus("invalid");
    } finally {
      setSavingKey(false);
    }
  }

  /** Remove the stored API key */
  async function handleRemoveKey() {
    setRemovingKey(true);

    try {
      await fetch("/api/user/api-key", { method: "DELETE" });
      setHasKey(false);
      setMaskedKey(null);
      setKeyStatus("idle");
    } catch {
      // Silently fail
    } finally {
      setRemovingKey(false);
    }
  }

  /** Change password */
  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordError(t("passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus("error");
      setPasswordError(t("passwordTooShort"));
      return;
    }

    setChangingPassword(true);
    setPasswordStatus("idle");
    setPasswordError("");

    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordStatus("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordStatus("idle"), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordStatus("error");
        setPasswordError(data.message || t("passwordChangeError"));
      }
    } catch {
      setPasswordStatus("error");
      setPasswordError(t("passwordChangeError"));
    } finally {
      setChangingPassword(false);
    }
  }

  /** Delete account */
  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);

    try {
      await fetch("/api/user", { method: "DELETE" });
      window.location.href = "/login";
    } catch {
      setDeleting(false);
    }
  }

  /** Switch language */
  function handleLanguageChange(locale: string) {
    setSelectedLanguage(locale);
    startTransition(async () => {
      await setUserLocale(locale);
      window.location.reload();
    });
  }

  /** Tabs configuration */
  const tabs = [
    { value: "account", icon: User, label: t("tabAccount") },
    { value: "api-key", icon: Key, label: t("tabApiKey") },
    { value: "appearance", icon: Palette, label: t("tabAppearance") },
    { value: "security", icon: Shield, label: t("tabSecurity") },
  ];

  /** Theme options */
  const themeOptions = [
    { value: "light", icon: Sun, label: t("themeLight") },
    { value: "dark", icon: Moon, label: t("themeDark") },
    { value: "system", icon: Monitor, label: t("themeSystem") },
  ];

  /** Language options */
  const languageOptions = [
    { value: "pt-BR", flag: "BR", label: "PT-BR" },
    { value: "en", flag: "US", label: "English" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("subtitle")}
        </p>
      </motion.div>

      <Tabs defaultValue="account" className="mt-8">
        {/* Tab navigation */}
        <TabsList className="bg-muted/50 rounded-xl p-1 h-auto flex-wrap">
          {tabs.map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─────────────────────── Account Tab ─────────────────────── */}
        <TabsContent value="account" className="mt-6">
          <motion.div {...fadeIn} className="space-y-6">
            {/* Name */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight mb-4">
                {t("accountInfo")}
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name" className="text-sm font-medium">
                    {t("nameLabel")}
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="settings-name"
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                    <Button
                      onClick={handleSaveName}
                      disabled={savingName || !accountName.trim()}
                      className="h-11 rounded-xl px-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : nameSaved ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t("save")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("emailLabel")}</Label>
                  <Input
                    type="email"
                    value={session?.user?.email ?? ""}
                    readOnly
                    className="h-11 rounded-xl bg-muted/50 border-border/40 text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Profile photo upload */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight mb-4">
                {t("profilePhoto")}
              </h3>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
                  dragActive
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                    : "border-border/50 hover:border-border hover:bg-muted/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t("photoUploadTitle")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("photoUploadHint")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  {t("photoUploadButton")}
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─────────────────────── API Key Tab ─────────────────────── */}
        <TabsContent value="api-key" className="mt-6">
          <motion.div {...fadeIn}>
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight mb-1">
                {t("apiKeyTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("apiKeySecurityNote")}
              </p>

              {loadingKey ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : hasKey ? (
                /* Key exists — show masked key with status */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4 border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/15 flex items-center justify-center">
                        <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-medium">
                          {maskedKey ?? "sk-ant-...****"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {t("keyStatusValid")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveKey}
                      disabled={removingKey}
                      className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-800/30"
                    >
                      {removingKey ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          {t("removeKey")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* No key — show input */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-api-key" className="text-sm font-medium">
                      {t("apiKeyInputLabel")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="settings-api-key"
                        type={showNewKey ? "text" : "password"}
                        placeholder="sk-ant-api03-..."
                        value={newApiKey}
                        onChange={(e) => {
                          setNewApiKey(e.target.value);
                          setKeyStatus("idle");
                        }}
                        className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20 pr-11 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewKey(!showNewKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence mode="wait">
                      {keyStatus === "valid" && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">{t("keySavedValid")}</span>
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
                          <span className="text-sm font-medium">{t("keyInvalid")}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    onClick={handleSaveKey}
                    disabled={!newApiKey.trim() || savingKey}
                    className="h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
                  >
                    {savingKey ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("validating")}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t("saveAndValidate")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* BYOK explainer */}
            <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-200/40 dark:border-amber-800/20 p-5 mt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("byokSecurityExplanation")}
              </p>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─────────────────────── Appearance Tab ─────────────────────── */}
        <TabsContent value="appearance" className="mt-6">
          <motion.div {...fadeIn} className="space-y-6">
            {/* Theme selector */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight mb-4">
                {t("themeTitle")}
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                      theme === value
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 shadow-sm"
                        : "border-border/40 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center",
                        theme === value
                          ? "bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-amber-500/15"
                          : "bg-muted/60 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        theme === value
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                    {theme === value && (
                      <motion.div
                        layoutId="theme-check"
                        className="absolute top-2.5 right-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Language selector */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t("languageTitle")}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map(({ value, flag, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleLanguageChange(value)}
                    className={cn(
                      "relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200",
                      selectedLanguage === value
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 shadow-sm"
                        : "border-border/40 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <span className="text-2xl">{flag === "BR" ? "\u{1F1E7}\u{1F1F7}" : "\u{1F1FA}\u{1F1F8}"}</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selectedLanguage === value
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                    {selectedLanguage === value && (
                      <motion.div
                        layoutId="lang-check"
                        className="absolute top-2.5 right-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─────────────────────── Security Tab ─────────────────────── */}
        <TabsContent value="security" className="mt-6">
          <motion.div {...fadeIn} className="space-y-6">
            {/* Change password */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight mb-4">
                {t("changePassword")}
              </h3>

              <div className="space-y-4 max-w-md">
                {/* Current password */}
                <div className="space-y-2">
                  <Label htmlFor="current-pw" className="text-sm font-medium">
                    {t("currentPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-pw"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-2">
                  <Label htmlFor="new-pw" className="text-sm font-medium">
                    {t("newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pw"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm new password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw" className="text-sm font-medium">
                    {t("confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pw"
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl bg-white dark:bg-white/5 border-border/60 focus:border-amber-500 focus:ring-amber-500/20 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password feedback */}
                <AnimatePresence mode="wait">
                  {passwordStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">{t("passwordChanged")}</span>
                    </motion.div>
                  )}
                  {passwordStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{passwordError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
                >
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      {t("updatePassword")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-card rounded-2xl border border-red-200/60 dark:border-red-900/30 p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight text-red-600 dark:text-red-400 mb-1">
                {t("dangerZone")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dangerZoneDescription")}
              </p>

              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-800/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deleteAccount")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-md">
                  <DialogHeader>
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/15 flex items-center justify-center mb-2">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-lg font-semibold">
                      {t("deleteAccountTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {t("deleteAccountWarning")}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-2">
                    <Label htmlFor="delete-confirm" className="text-sm font-medium">
                      {t("deleteConfirmLabel")}
                    </Label>
                    <Input
                      id="delete-confirm"
                      type="text"
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) =>
                        setDeleteConfirmText(e.target.value.toUpperCase())
                      }
                      className="h-11 rounded-xl font-mono tracking-wider"
                    />
                  </div>

                  <DialogFooter className="gap-3 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirmText("");
                      }}
                      className="rounded-xl"
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE" || deleting}
                      className="rounded-xl"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("confirmDelete")}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
