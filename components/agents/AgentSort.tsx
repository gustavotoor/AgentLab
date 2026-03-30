'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-used', label: 'Most used' },
  { value: 'a-z', label: 'A → Z' },
] as const

export function AgentSort() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('sort') ?? 'newest'

  return (
    <Select
      value={current}
      onValueChange={(v) => router.push(`/agents?sort=${v}`)}
    >
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
