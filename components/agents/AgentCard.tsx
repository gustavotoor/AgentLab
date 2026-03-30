'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MessageSquare, Edit2, Copy, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { truncate } from '@/lib/utils'
import type { Agent } from '@prisma/client'

interface AgentCardProps {
  agent: Agent & { _count: { conversations: number } }
}

/**
 * Agent card component with chat, edit, duplicate, and delete actions.
 */
export function AgentCard({ agent }: AgentCardProps) {
  const t = useTranslations('agents')
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: t('agentDeleted'), variant: 'default' })
        router.refresh()
      } else {
        toast({ title: 'Failed to delete agent', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const res = await fetch(`/api/agents/${agent.id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        toast({ title: t('agentDuplicated'), variant: 'default' })
        router.refresh()
      } else {
        toast({ title: 'Failed to duplicate agent', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <>
      <Toaster />
      <Card className="group border hover:border-primary/30 hover:shadow-md transition-all duration-200">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{agent.emoji}</span>
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{agent.name}</h3>
                <p className="text-xs text-muted-foreground">{agent._count.conversations} chats</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/agents/${agent.id}/edit`}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    {t('edit')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('deleteAgent')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Personality preview */}
          <p className="text-xs text-muted-foreground line-clamp-3">
            {truncate(agent.personality, 100)}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1 h-8 text-xs">
              <Link href={`/agents/${agent.id}`}>
                <MessageSquare className="h-3 w-3" />
                {t('startChat')}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
              <Link href={`/agents/${agent.id}/edit`}>
                <Edit2 className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAgent')}</DialogTitle>
            <DialogDescription>{t('deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
