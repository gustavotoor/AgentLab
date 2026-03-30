'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Key, Bot, CheckCircle2, ArrowRight, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

/**
 * Multi-step onboarding flow: API key setup → completion.
 */
export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const { update } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to save API key')
      } else {
        setApiKeySaved(true)
        toast({ title: 'API key saved!', variant: 'default' })
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    setStep(2)
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/user/complete-onboarding', { method: 'POST' })
      await update({ onboardingDone: true })
      router.push('/dashboard')
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Toaster />
      <div className="w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-xl border bg-card p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{t('step1Title')}</h2>
                  <p className="text-sm text-muted-foreground">{t('step1Desc')}</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <span>How to get your API key</span>
                </h3>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to console.anthropic.com</li>
                  <li>Create an account or log in</li>
                  <li>Click &quot;API Keys&quot; in the sidebar</li>
                  <li>Create a new key and copy it here</li>
                </ol>
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Anthropic Console
                </a>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {apiKeySaved ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">API key saved successfully!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="apiKey">Your Anthropic API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-ant-api03-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={isLoading}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your key is encrypted with AES-256-GCM and never shared.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!apiKeySaved ? (
                  <>
                    <Button
                      className="flex-1"
                      onClick={handleSaveApiKey}
                      disabled={isLoading || !apiKey}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save API Key'
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
                      {t('skip')}
                    </Button>
                  </>
                ) : (
                  <Button className="flex-1" onClick={() => setStep(2)}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-xl border bg-card p-8 space-y-6 text-center"
            >
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 ring-8 ring-primary/5">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('step3Title')}</h2>
                <p className="text-muted-foreground text-sm">{t('step3Desc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: '🤝', label: '8 agent templates' },
                  { icon: '🔐', label: 'AES-256 encryption' },
                  { icon: '💬', label: 'Persistent chat history' },
                  { icon: '🌍', label: 'PT-BR + English' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleComplete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t('complete')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
