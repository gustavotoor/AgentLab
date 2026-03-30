'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Loader2, Save } from 'lucide-react'
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
import { AGENT_TEMPLATES, AGENT_TONES } from '@/lib/prompts'
import type { Agent } from '@prisma/client'

const EMOJI_OPTIONS = ['🤖', '🦾', '🧠', '⚡', '🎯', '🚀', '💡', '🔮', '🦁', '🐺', '🦊', '🐉', '👾', '🎭', '🌟', '💎']

interface AgentFormProps {
  agent?: Agent
  defaultTemplateId?: string
}

/**
 * Form for creating or editing an AI agent.
 * Handles template selection, personality customization, and submission.
 */
export function AgentForm({ agent, defaultTemplateId }: AgentFormProps) {
  const t = useTranslations('agents')
  const router = useRouter()

  const isEditing = !!agent

  const defaultTemplate = AGENT_TEMPLATES.find((t) => t.id === (agent?.templateId ?? defaultTemplateId)) ?? AGENT_TEMPLATES[0]

  const [name, setName] = useState(agent?.name ?? '')
  const [emoji, setEmoji] = useState(agent?.emoji ?? '🤖')
  const [templateId, setTemplateId] = useState(agent?.templateId ?? (defaultTemplateId ?? AGENT_TEMPLATES[0].id))
  const [personality, setPersonality] = useState(agent?.personality ?? defaultTemplate.personality)
  const [tone, setTone] = useState(agent?.tone ?? 'professional')
  const [locale, setLocale] = useState(agent?.locale ?? 'pt-BR')
  const [extraSoul, setExtraSoul] = useState(agent?.extraSoul ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId)
    const template = AGENT_TEMPLATES.find((t) => t.id === newTemplateId)
    if (template && !isEditing) {
      setPersonality(template.personality)
      setEmoji(template.emoji)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const payload = { name, emoji, templateId, personality, tone, locale, extraSoul: extraSoul || undefined }

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
        const details = data.details
        if (details) {
          const firstError = Object.values(details).flat()[0] as string
          setError(firstError ?? data.error)
        } else {
          setError(data.error ?? 'Something went wrong')
        }
      } else {
        toast({
          title: isEditing ? t('agentUpdated') : t('agentCreated'),
          variant: 'default',
        })
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
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-8 max-w-2xl"
      >
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Identity */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identity</h2>

          {/* Emoji picker */}
          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                    emoji === e ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'
                  }`}
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
              required
              disabled={isLoading}
            />
          </div>
        </section>

        {/* Template */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Template</h2>

          <div className="space-y-2">
            <Label>{t('template')}</Label>
            <Select value={templateId} onValueChange={handleTemplateChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <span className="flex items-center gap-2">
                      <span>{template.emoji}</span>
                      <span>{template.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Personality */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personality</h2>

          <div className="space-y-2">
            <Label htmlFor="personality">{t('personality')}</Label>
            <Textarea
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder={t('personalityPlaceholder')}
              rows={5}
              required
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

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? t('saveChanges') : t('createAgent')}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </motion.form>
    </>
  )
}
