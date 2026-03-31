'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useLocale } from '@/hooks/use-locale'
import { useTheme } from 'next-themes'
import {
  Loader2, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Trash2, ExternalLink, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  name: string | null
  email: string
  locale: string
  theme: string
  apiKeyMasked: string | null
  apiKeyValid: boolean
  openaiKeyMasked: string | null
  openaiKeyValid: boolean
}

export function SettingsTabs({ user }: { user: UserData }) {
  const t = useTranslations('settings')
  const { update } = useSession()
  const router = useRouter()
  const { switchLocale } = useLocale()
  const { setTheme } = useTheme()

  // Profile
  const [name, setName] = useState(user.name ?? '')
  const [locale, setLocale] = useState(user.locale)
  const [theme, setThemeState] = useState(user.theme)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  // Anthropic API key
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [apiKeyDeleteLoading, setApiKeyDeleteLoading] = useState(false)
  const [apiKeyMasked, setApiKeyMasked] = useState(user.apiKeyMasked)
  const [apiKeyValid, setApiKeyValid] = useState(user.apiKeyValid)
  const [apiKeyDeleteOpen, setApiKeyDeleteOpen] = useState(false)

  // OpenAI API key
  const [openaiKey, setOpenaiKey] = useState('')
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [openaiKeyLoading, setOpenaiKeyLoading] = useState(false)
  const [openaiKeyDeleteLoading, setOpenaiKeyDeleteLoading] = useState(false)
  const [openaiKeyMasked, setOpenaiKeyMasked] = useState(user.openaiKeyMasked)
  const [openaiKeyValid, setOpenaiKeyValid] = useState(user.openaiKeyValid)
  const [openaiKeyDeleteOpen, setOpenaiKeyDeleteOpen] = useState(false)

  // Delete account
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleProfileSave = async () => {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, locale, theme }),
      })
      if (res.ok) {
        await update({ name, locale, theme })
        switchLocale(locale as 'pt-BR' | 'en')
        setTheme(theme)
        toast({ title: t('profileUpdated') })
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: data.error ?? 'Failed to update profile', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      if (res.ok) {
        toast({ title: t('passwordChanged') })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast({ title: data.error ?? 'Failed to change password', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleApiKeySave = async () => {
    if (!apiKey.trim()) return
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeyMasked(data.data.masked)
        setApiKeyValid(true)
        setApiKey('')
        await update({ apiKeyValid: true })
        toast({ title: t('apiKeySaved') })
      } else {
        const data = await res.json()
        toast({ title: data.error ?? 'Failed to save API key', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setApiKeyLoading(false)
    }
  }

  const handleApiKeyDelete = async () => {
    setApiKeyDeleteLoading(true)
    try {
      const res = await fetch('/api/user/api-key', { method: 'DELETE' })
      if (res.ok) {
        setApiKeyMasked(null)
        setApiKeyValid(false)
        setApiKeyDeleteOpen(false)
        await update({ apiKeyValid: false })
        toast({ title: 'API key removed' })
      } else {
        toast({ title: 'Failed to remove API key', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setApiKeyDeleteLoading(false)
    }
  }

  const handleOpenaiKeySave = async () => {
    if (!openaiKey.trim()) return
    setOpenaiKeyLoading(true)
    try {
      const res = await fetch('/api/user/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: openaiKey.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setOpenaiKeyMasked(data.data.masked)
        setOpenaiKeyValid(true)
        setOpenaiKey('')
        toast({ title: t('openaiKeySaved') })
      } else {
        const data = await res.json()
        toast({ title: data.error ?? 'Failed to save OpenAI API key', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setOpenaiKeyLoading(false)
    }
  }

  const handleOpenaiKeyDelete = async () => {
    setOpenaiKeyDeleteLoading(true)
    try {
      const res = await fetch('/api/user/openai-key', { method: 'DELETE' })
      if (res.ok) {
        setOpenaiKeyMasked(null)
        setOpenaiKeyValid(false)
        setOpenaiKeyDeleteOpen(false)
        toast({ title: 'OpenAI API key removed' })
      } else {
        toast({ title: 'Failed to remove OpenAI API key', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setOpenaiKeyDeleteLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        toast({ title: 'Failed to delete account', variant: 'destructive' })
        setDeleteLoading(false)
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Toaster />
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">{t('profile')}</TabsTrigger>
          <TabsTrigger value="security" className="flex-1">{t('security')}</TabsTrigger>
          <TabsTrigger value="apikey" className="flex-1">{t('apiKey')}</TabsTrigger>
          <TabsTrigger value="danger" className="flex-1">Danger</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input value={user.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('language')}</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">🇧🇷 Português (BR)</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('theme')}</Label>
                <Select value={theme} onValueChange={setThemeState}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('themeLight')}</SelectItem>
                    <SelectItem value="dark">{t('themeDark')}</SelectItem>
                    <SelectItem value="system">{t('themeSystem')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleProfileSave} disabled={profileLoading}>
              {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">{t('changePassword')}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('currentPassword')}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('newPassword')}</Label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('confirmPassword')}</Label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('changePassword')}
            </Button>
          </div>
        </TabsContent>

        {/* ── API Key ── */}
        <TabsContent value="apikey" className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('byokTitle')}</h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">{t('byokDesc')}</p>
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {t('getApiKey')}
              </a>
            </div>

            {/* Current key status */}
            {apiKeyMasked && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2">
                  {apiKeyValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium font-mono">{apiKeyMasked}</p>
                    <p className="text-xs text-muted-foreground">
                      {apiKeyValid ? t('apiKeyValid') : t('apiKeyInvalid')}
                    </p>
                  </div>
                </div>

                {/* Delete key */}
                <Dialog open={apiKeyDeleteOpen} onOpenChange={setApiKeyDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove API key</DialogTitle>
                      <DialogDescription>
                        This will remove your Anthropic API key. You won&apos;t be able to chat with agents until you add a new one.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setApiKeyDeleteOpen(false)}>Cancel</Button>
                      <Button
                        variant="destructive"
                        onClick={handleApiKeyDelete}
                        disabled={apiKeyDeleteLoading}
                      >
                        {apiKeyDeleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Remove key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="space-y-2">
              <Label>{apiKeyMasked ? 'Update API key' : t('anthropicApiKey')}</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t('apiKeyPlaceholder')}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t('apiKeyDesc')}</p>
            </div>

            <Button onClick={handleApiKeySave} disabled={apiKeyLoading || !apiKey.trim()}>
              {apiKeyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('saveApiKey')}
            </Button>
          </div>

          {/* ── OpenAI ── */}
          <div className="space-y-4 pt-2 border-t">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t('openaiByokTitle')}</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{t('openaiByokDesc')}</p>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {t('getOpenaiKey')}
              </a>
            </div>

            {openaiKeyMasked && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2">
                  {openaiKeyValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium font-mono">{openaiKeyMasked}</p>
                    <p className="text-xs text-muted-foreground">
                      {openaiKeyValid ? t('apiKeyValid') : t('apiKeyInvalid')}
                    </p>
                  </div>
                </div>

                <Dialog open={openaiKeyDeleteOpen} onOpenChange={setOpenaiKeyDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('removeOpenaiKey')}</DialogTitle>
                      <DialogDescription>
                        This will remove your OpenAI API key. Agents using OpenAI models won&apos;t work until you add a new one.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenaiKeyDeleteOpen(false)}>Cancel</Button>
                      <Button
                        variant="destructive"
                        onClick={handleOpenaiKeyDelete}
                        disabled={openaiKeyDeleteLoading}
                      >
                        {openaiKeyDeleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Remove key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="space-y-2">
              <Label>{openaiKeyMasked ? 'Update OpenAI key' : t('openaiApiKey')}</Label>
              <div className="relative">
                <Input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={t('openaiApiKeyPlaceholder')}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t('apiKeyDesc')}</p>
            </div>

            <Button onClick={handleOpenaiKeySave} disabled={openaiKeyLoading || !openaiKey.trim()}>
              {openaiKeyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('saveApiKey')}
            </Button>
          </div>
        </TabsContent>

        {/* ── Danger zone ── */}
        <TabsContent value="danger" className="space-y-6">
          <div className="rounded-xl border border-destructive/30 p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-destructive">{t('dangerZone')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('deleteAccountDesc')}</p>
            </div>

            <Dialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeleteConfirmText('') }}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  {t('deleteAccount')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('deleteAccount')}</DialogTitle>
                  <DialogDescription>
                    This will permanently delete your account, all agents, conversations, and messages. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className={cn(deleteConfirmText && deleteConfirmText !== 'DELETE' && 'border-destructive')}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                  >
                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('deleteAccountConfirm')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
