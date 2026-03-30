'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AGENT_TEMPLATES } from '@/lib/prompts'
import { Search, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  productivity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  business: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  education: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  technical: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  wellness: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  all: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const ALL_CATEGORIES = ['all', 'productivity', 'business', 'education', 'creative', 'technical', 'wellness'] as const
type Category = (typeof ALL_CATEGORIES)[number]

export function StoreContent() {
  const t = useTranslations('store')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  const filtered = useMemo(() => {
    return AGENT_TEMPLATES.filter((tmpl) => {
      const matchesSearch =
        search.trim() === '' ||
        tmpl.name.toLowerCase().includes(search.toLowerCase()) ||
        tmpl.description.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        activeCategory === 'all' || tmpl.categories.includes(activeCategory as never)

      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                activeCategory === cat
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {t(`categories.${cat}` as 'categories.all')}
            </button>
          ))}
        </div>
      </div>

      {/* Templates grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No templates found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template) => {
            const isFreeAgent = template.id === 'free-agent'
            return (
              <div
                key={template.id}
                className={cn(
                  'group rounded-xl border bg-card hover:shadow-md transition-all duration-200 flex flex-col',
                  isFreeAgent
                    ? 'border-dashed border-2 border-muted-foreground/30 hover:border-primary/40'
                    : 'hover:border-primary/40'
                )}
              >
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl">{template.emoji}</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {template.categories.map((cat) => (
                        <span
                          key={cat}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.all
                          )}
                        >
                          {t(`categories.${cat}` as 'categories.productivity')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  </div>

                  <p className="text-xs text-muted-foreground/70 line-clamp-3 border-t pt-3">
                    {template.personality.slice(0, 120)}...
                  </p>
                </div>

                <div className="p-4 pt-0">
                  <Button asChild className="w-full" size="sm" variant={isFreeAgent ? 'outline' : 'default'}>
                    <Link href={`/agents/new?templateId=${template.id}`}>
                      {t('useTemplate')}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
