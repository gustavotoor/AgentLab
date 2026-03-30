import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TopBar } from '@/components/layout/TopBar'
import { AgentForm } from '@/components/agents/AgentForm'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const agent = await prisma.agent.findUnique({ where: { id }, select: { name: true } })
  return { title: agent ? `Edit ${agent.name}` : 'Edit Agent' }
}

/**
 * Agent edit page. Loads agent data and renders the edit form.
 */
export default async function EditAgentPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const t = await getTranslations('agents')

  const agent = await prisma.agent.findFirst({
    where: { id, userId: session!.user.id },
  })

  if (!agent) notFound()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title={t('editAgent')} />
      <div className="flex-1 overflow-y-auto p-6">
        <AgentForm agent={agent} />
      </div>
    </div>
  )
}
