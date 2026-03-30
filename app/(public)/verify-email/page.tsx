'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
        } else {
          setStatus('success')
          setMessage(data.message)
          setTimeout(() => router.push('/login'), 3000)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('An error occurred. Please try again.')
      })
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">AgentLab</span>
        </Link>

        <div className="rounded-xl border bg-card p-8 shadow-sm space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h1 className="text-xl font-semibold">Verifying your email...</h1>
              <p className="text-muted-foreground text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-semibold">Email verified!</h1>
              <p className="text-muted-foreground text-sm">
                {message} You will be redirected to login shortly.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Go to login</Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold">Verification failed</h1>
              <p className="text-muted-foreground text-sm">{message}</p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/login">Back to login</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">Create new account</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Email verification page. Reads token from URL and calls verification API.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
