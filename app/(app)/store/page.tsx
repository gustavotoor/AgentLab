import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { AGENT_TEMPLATES } from '@/lib/prompts'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Template Store' }

const CATEGORY_COLORS: Record<string, string> = {
  productivity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  business: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  education: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  technical: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  wellness: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  all: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

/**
 * Agent template store page. Displays all available templates with category badges.
 */
export default async function StorePage() {
  const t = await getTranslations('store')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title={t('title')} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">{t('title')}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AGENT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="group rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div className="p-5 flex-1 space-y-3">
                  {/* Emoji + categories */}
                  <div className="flex items-start justify-between">
                    <span className="text-4xl">{template.emoji}</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {template.categories.map((cat) => (
                        <span
                          key={cat}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.all}`}
                        >
                          {t(`categories.${cat}` as 'categories.productivity')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Name + description */}
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  </div>

                  {/* Personality preview */}
                  <p className="text-xs text-muted-foreground/70 line-clamp-3 border-t pt-3">
                    {template.personality.slice(0, 120)}...
                  </p>
                </div>

                {/* Action */}
                <div className="p-4 pt-0">
                  <Button asChild className="w-full group-hover:bg-primary/90" size="sm">
                    <Link href={`/agents/new?templateId=${template.id}`}>
                      {t('useTemplate')}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
