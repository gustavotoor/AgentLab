import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { truncate } from '@/lib/utils'
import { Plus, Bot, MessageSquare, BarChart3, ArrowRight, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

/**
 * Dashboard page showing stats and recent agents.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('dashboard')

  const [totalAgents, recentAgents, conversationStats] = await Promise.all([
    prisma.agent.count({ where: { userId: session!.user.id } }),
    prisma.agent.findMany({
      where: { userId: session!.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: { _count: { select: { conversations: true } } },
    }),
    prisma.conversation.count({
      where: { agent: { userId: session!.user.id } },
    }),
  ])

  const stats = [
    { label: t('totalAgents'), value: totalAgents, icon: Bot, color: 'text-blue-500' },
    { label: t('totalConversations'), value: conversationStats, icon: MessageSquare, color: 'text-violet-500' },
    { label: 'Active API Key', value: session!.user.apiKeyValid ? 'Configured' : 'Not set', icon: Zap, color: session!.user.apiKeyValid ? 'text-emerald-500' : 'text-amber-500', isText: true },
  ]

  const firstName = session!.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title={t('title')} />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {t('welcome', { name: firstName })} 👋
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Here&apos;s what&apos;s happening with your agents.
            </p>
          </div>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="h-4 w-4" />
              {t('createAgent')}
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${stat.isText ? 'text-xl' : ''}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* API Key warning */}
        {!session!.user.apiKeyValid && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Set up your API key to start chatting</p>
                <p className="text-xs text-muted-foreground">Add your Anthropic API key in settings</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings">Configure</Link>
            </Button>
          </div>
        )}

        {/* Recent Agents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('recentAgents')}</h3>
            {totalAgents > 0 && (
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/agents">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {recentAgents.length === 0 ? (
            <EmptyState
              emoji="🤖"
              title={t('noAgents')}
              description={t('createFirst')}
              actionLabel={t('createAgent')}
              onAction={() => {}}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentAgents.map((agent) => (
                <Card key={agent.id} className="border hover:border-primary/30 transition-all duration-200 group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{agent.emoji}</span>
                      <span className="text-xs text-muted-foreground">
                        {agent._count.conversations} chats
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{agent.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {truncate(agent.personality, 80)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1 h-8 text-xs">
                        <Link href={`/agents/${agent.id}`}>
                          {t('chatNow')}
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Link href={`/agents/${agent.id}/edit`}>
                          <BarChart3 className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
