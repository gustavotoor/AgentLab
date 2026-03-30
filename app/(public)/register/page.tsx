import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return { title: t('registerTitle') }
}

/**
 * User registration page.
 */
export default async function RegisterPage() {
  const t = await getTranslations('auth')

  return (
    <AuthLayout
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
    >
      <RegisterForm />
    </AuthLayout>
  )
}
