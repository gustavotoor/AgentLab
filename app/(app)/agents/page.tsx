import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { AgentCard } from '@/components/agents/AgentCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Plus, Bot } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Agents' }

/**
 * Agents list page showing all user agents with CRUD actions.
 */
export default async function AgentsPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('agents')

  const agents = await prisma.agent.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { conversations: true } } },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={t('title')}
        actions={
          <Button asChild size="sm">
            <Link href="/agents/new">
              <Plus className="h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {agents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title={t('noAgents')}
            description={t('noAgentsDesc')}
            actionLabel={t('createAgent')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
