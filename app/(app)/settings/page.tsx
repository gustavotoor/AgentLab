import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

/**
 * Settings page - loads user data and renders tabbed settings UI.
 */
export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('settings')

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      locale: true,
      theme: true,
      apiKeyMasked: true,
      apiKeyValid: true,
    },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title={t('title')} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <SettingsTabs user={user!} />
        </div>
      </div>
    </div>
  )
}
