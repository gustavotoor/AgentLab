import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentSort } from '@/components/agents/AgentSort'
import { EmptyState } from '@/components/shared/EmptyState'
import { Plus, Bot } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Agents' }

type SortKey = 'newest' | 'oldest' | 'most-used' | 'a-z'

function getOrderBy(sort: SortKey) {
  switch (sort) {
    case 'oldest': return { createdAt: 'asc' as const }
    case 'most-used': return { totalChats: 'desc' as const }
    case 'a-z': return { name: 'asc' as const }
    default: return { updatedAt: 'desc' as const }
  }
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('agents')
  const { sort } = await searchParams
  const sortKey = (['newest', 'oldest', 'most-used', 'a-z'].includes(sort ?? '')
    ? sort
    : 'newest') as SortKey

  const agents = await prisma.agent.findMany({
    where: { userId: session!.user.id },
    orderBy: getOrderBy(sortKey),
    include: { _count: { select: { conversations: true } } },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={t('title')}
        actions={
          <div className="flex items-center gap-2">
            <Suspense>
              <AgentSort />
            </Suspense>
            <Button asChild size="sm">
              <Link href="/agents/new">
                <Plus className="h-4 w-4" />
                {t('new')}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {agents.length === 0 ? (
          <EmptyState
            icon={<Bot className="h-8 w-8 text-muted-foreground" />}
            title={t('noAgents')}
            description={t('noAgentsDesc')}
            actionLabel={t('createAgent')}
            actionHref="/agents/new"
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
