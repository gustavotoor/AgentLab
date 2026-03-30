'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Bot,
  Store,
  Settings,
  LogOut,
  Plus,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/agents', labelKey: 'agents', icon: Bot },
  { href: '/store', labelKey: 'store', icon: Store },
  { href: '/settings', labelKey: 'settings', icon: Settings },
]

/**
 * App sidebar navigation component with icon labels and user info.
 */
export function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex h-full w-16 flex-col items-center border-r bg-sidebar border-sidebar-border py-4">
        {/* Logo */}
        <Link href="/dashboard" className="mb-8 flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-border hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t(item.labelKey as 'dashboard' | 'agents' | 'store' | 'settings')}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}

          {/* New Agent button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="mt-2 h-10 w-10 rounded-xl border border-dashed border-sidebar-border text-sidebar-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => router.push('/agents/new')}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('newAgent')}</p>
            </TooltipContent>
          </Tooltip>
        </nav>

        {/* User avatar + logout */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground hover:bg-sidebar-border transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Sign out</p>
            </TooltipContent>
          </Tooltip>

          <Link href="/settings">
            <Avatar className="h-9 w-9 ring-2 ring-sidebar-border hover:ring-primary transition-all">
              <AvatarImage src={session?.user?.image ?? ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {getInitials(session?.user?.name ?? session?.user?.email ?? '?')}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  )
}
