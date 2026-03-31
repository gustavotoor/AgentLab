'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Save, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { AGENT_TEMPLATES, AGENT_TONES, buildSystemPrompt } from '@/lib/prompts'
import { cn } from '@/lib/utils'
import { sanitize } from '@/lib/sanitizer'
import type { Agent } from '@prisma/client'

const AVAILABLE_TOOLS = [
  { id: 'web_search', label: '🔍 Busca na web', description: 'Requer TAVILY_API_KEY no servidor' },
  { id: 'calculator', label: '🧮 Calculadora', description: 'Expressões matemáticas seguras' },
  { id: 'datetime', label: '🕐 Data/Hora', description: 'Data e hora atuais com timezone' },
] as const

const EMOJI_OPTIONS = ['🤖', '🦾', '🧠', '⚡', '🎯', '🚀', '💡', '🔮', '🦁', '🐺', '🦊', '🐉', '👾', '🎭', '🌟', '💎']

const CATEGORY_COLORS: Record<string, string> = {
  productivity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  business: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  education: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  technical: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  wellness: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  all: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const PERSONALITY_MAX = 500

interface AgentFormProps {
  agent?: Agent
  defaultTemplateId?: string
}

const STEPS = ['Template', 'Personality', 'Preview'] as const

export function AgentForm({ agent, defaultTemplateId }: AgentFormProps) {
  const t = useTranslations('agents')
  const router = useRouter()
  const isEditing = !!agent

  const defaultTemplate =
    AGENT_TEMPLATES.find((t) => t.id === (agent?.templateId ?? defaultTemplateId)) ?? AGENT_TEMPLATES[0]

  const [step, setStep] = useState(isEditing ? 1 : 0)
  const [templateId, setTemplateId] = useState(agent?.templateId ?? defaultTemplate.id)
  const [name, setName] = useState(agent?.name ?? '')
  const [emoji, setEmoji] = useState(agent?.emoji ?? defaultTemplate.emoji)
  const [personality, setPersonality] = useState(agent?.personality ?? defaultTemplate.personality)
  const [tone, setTone] = useState(agent?.tone ?? 'professional')
  const [locale, setLocale] = useState(agent?.locale ?? 'pt-BR')
  const [extraSoul, setExtraSoul] = useState(agent?.extraSoul ?? '')
  const [langGraphEnabled, setLangGraphEnabled] = useState(agent?.langGraphEnabled ?? false)
  const [availableTools, setAvailableTools] = useState<string[]>(agent?.availableTools ?? [])
  const [provider, setProvider] = useState<'anthropic' | 'openai'>(
    (agent?.provider as 'anthropic' | 'openai') ?? 'anthropic'
  )
  const defaultModel = provider === 'openai' ? 'gpt-5' : 'claude-sonnet-4-6'
  const [model, setModel] = useState(agent?.model ?? defaultModel)
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/models?provider=${provider}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.length) {
          setAvailableModels(d.data)
          // Reset model to first available when provider changes (unless editing with existing model)
          if (!agent?.model || agent.provider !== provider) {
            setModel(d.data[0].id)
          }
        } else {
          setAvailableModels([])
        }
      })
      .catch(() => {})
  }, [provider]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTemplate = AGENT_TEMPLATES.find((t) => t.id === templateId) ?? AGENT_TEMPLATES[0]

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id)
    const tmpl = AGENT_TEMPLATES.find((t) => t.id === id)
    if (tmpl) {
      setEmoji(tmpl.emoji)
      setPersonality(tmpl.personality)
    }
  }

  const previewPrompt = buildSystemPrompt(
    { name: name || 'My Agent', emoji, templateId, personality, tone, locale, extraSoul },
    { name: 'User' }
  )

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    // Sanitize personality and extraSoul before sending
    const { text: cleanPersonality } = sanitize(personality)
    const { text: cleanExtraSoul } = extraSoul ? sanitize(extraSoul) : { text: '' }

    const payload = {
      name,
      emoji,
      templateId,
      personality: cleanPersonality,
      tone,
      locale,
      extraSoul: cleanExtraSoul || undefined,
      langGraphEnabled,
      availableTools,
      model,
      provider,
    }

    try {
      const url = isEditing ? `/api/agents/${agent.id}` : '/api/agents'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        const firstError = data.details
          ? (Object.values(data.details).flat()[0] as string)
          : data.error
        setError(firstError ?? 'Something went wrong')
        setStep(1)
      } else {
        toast({ title: isEditing ? t('agentUpdated') : t('agentCreated') })
        router.push(`/agents/${data.data.id}`)
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Toaster />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  i === step ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-8 sm:w-12 transition-colors', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Step 0: Template picker ── */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold">Choose a template</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a starting personality for your agent. You can customize it in the next step.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AGENT_TEMPLATES.map((tmpl) => {
                const isFreeAgent = tmpl.id === 'free-agent'
                const isSelected = templateId === tmpl.id
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all duration-150 space-y-2',
                      isFreeAgent ? 'border-dashed' : '',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-3xl">{tmpl.emoji}</span>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tmpl.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.categories.map((cat) => (
                        <span
                          key={cat}
                          className={cn('text-xs px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[cat])}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(1)}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Identity & Personality ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 max-w-2xl"
          >
            {/* Identity */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identity</h2>

              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={cn(
                        'text-2xl p-2 rounded-lg border-2 transition-all',
                        emoji === e ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={isLoading}
                />
              </div>
            </section>

            {/* Personality */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personality</h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="personality">{t('personality')}</Label>
                  <span
                    className={cn(
                      'text-xs',
                      personality.length > PERSONALITY_MAX * 0.9
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {personality.length}/{PERSONALITY_MAX}
                  </span>
                </div>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value.slice(0, PERSONALITY_MAX))}
                  placeholder={t('personalityPlaceholder')}
                  rows={5}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tone')}</Label>
                  <Select value={tone} onValueChange={setTone} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('locale')}</Label>
                  <Select value={locale} onValueChange={setLocale} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">🇧🇷 Português (BR)</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(v) => setProvider(v as 'anthropic' | 'openai')}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select value={model} onValueChange={setModel} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length > 0 ? (
                        availableModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={model}>{model}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Modelos agênticos disponíveis na sua chave {provider === 'openai' ? 'OpenAI' : 'Anthropic'}.
              </p>

              <div className="space-y-2">
                <Label htmlFor="extraSoul">
                  {t('extraSoul')}{' '}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="extraSoul"
                  value={extraSoul}
                  onChange={(e) => setExtraSoul(e.target.value)}
                  placeholder={t('extraSoulPlaceholder')}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </section>

            {/* LangGraph Lab */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">🔬 LangGraph Lab</h2>

              <div className="flex items-start justify-between rounded-lg border p-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Ativar modo laboratório</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O agente usará LangGraph + Langfuse. Um painel lateral mostrará as decisões em tempo real.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={langGraphEnabled}
                  onClick={() => setLangGraphEnabled(!langGraphEnabled)}
                  disabled={isLoading}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                    langGraphEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      langGraphEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {langGraphEnabled && (
                <div className="space-y-2 pl-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ferramentas disponíveis</Label>
                  <div className="space-y-2">
                    {AVAILABLE_TOOLS.map((tool) => {
                      const checked = availableTools.includes(tool.id)
                      return (
                        <label
                          key={tool.id}
                          className="flex items-start gap-3 cursor-pointer rounded-md border p-3 hover:bg-muted/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setAvailableTools((prev) =>
                                checked ? prev.filter((t) => t !== tool.id) : [...prev, tool.id]
                              )
                            }
                            disabled={isLoading}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium">{tool.label}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            <div className="flex gap-3">
              {!isEditing && (
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim() || !personality.trim()}
              >
                Preview
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-2xl"
          >
            <div>
              <h2 className="text-lg font-semibold">Preview your agent</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This is the system prompt that will be sent to Claude.
              </p>
            </div>

            {/* Agent card preview */}
            <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
              <div className="text-5xl shrink-0">{emoji}</div>
              <div>
                <p className="font-semibold text-lg">{name || 'My Agent'}</p>
                <p className="text-sm text-muted-foreground">{selectedTemplate.name} · {tone}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {locale === 'pt-BR' ? '🇧🇷 Portuguese' : '🇺🇸 English'}
                </p>
              </div>
            </div>

            {/* System prompt preview */}
            <div className="space-y-2">
              <Label>System prompt (read-only)</Label>
              <div className="rounded-lg border bg-muted/30 p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                {previewPrompt}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? t('saveChanges') : t('createAgent')}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
