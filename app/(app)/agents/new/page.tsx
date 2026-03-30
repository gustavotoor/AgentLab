import { getTranslations } from 'next-intl/server'
import { TopBar } from '@/components/layout/TopBar'
import { AgentForm } from '@/components/agents/AgentForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Agent' }

interface PageProps {
  searchParams: Promise<{ templateId?: string }>
}

/**
 * New agent creation page.
 */
export default async function NewAgentPage({ searchParams }: PageProps) {
  const t = await getTranslations('agents')
  const { templateId } = await searchParams

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title={t('createAgent')} />
      <div className="flex-1 overflow-y-auto p-6">
        <AgentForm defaultTemplateId={templateId} />
      </div>
    </div>
  )
}
