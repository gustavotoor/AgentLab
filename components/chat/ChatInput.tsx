'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  disabled?: boolean
}

/**
 * Chat input component with auto-resize textarea and keyboard shortcuts.
 */
export function ChatInput({ value, onChange, onSubmit, isLoading, disabled }: ChatInputProps) {
  const t = useTranslations('chat')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim() && !disabled) {
        onSubmit()
      }
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`
    onChange(target.value)
  }

  return (
    <div className="flex gap-3 items-end">
      <Textarea
        ref={textareaRef}
        value={value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={t('messagePlaceholder')}
        rows={1}
        className="min-h-[44px] max-h-[200px] resize-none flex-1"
        disabled={isLoading || disabled}
      />
      <Button
        type="button"
        size="icon"
        onClick={onSubmit}
        disabled={isLoading || !value.trim() || disabled}
        className="h-11 w-11 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
