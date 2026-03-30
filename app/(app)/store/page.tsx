import { TopBar } from '@/components/layout/TopBar'
import { StoreContent } from '@/components/agents/StoreContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Template Store' }

export default function StorePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Template Store" />
      <div className="flex-1 overflow-y-auto p-6">
        <StoreContent />
      </div>
    </div>
  )
}
