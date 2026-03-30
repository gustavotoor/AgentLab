import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return { title: t('loginTitle') }
}

/**
 * Login page.
 */
export default async function LoginPage() {
  const t = await getTranslations('auth')

  return (
    <AuthLayout
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      panel={{
        quote: 'The best AI assistant is the one you can customize to think exactly like your team.',
        author: '— AgentLab users',
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
