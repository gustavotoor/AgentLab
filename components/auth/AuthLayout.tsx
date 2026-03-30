import Link from 'next/link'
import { Zap } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  panel?: {
    quote?: string
    author?: string
  }
}

/**
 * Split-panel auth layout with dark left panel and white right form area.
 */
export function AuthLayout({ children, title, subtitle, panel }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A0A0F 0%, #0D1B3E 50%, #1A1A2E 100%)',
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">AgentLab</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white leading-snug">
              Build AI agents that work{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                exactly like you want.
              </span>
            </h2>
            <p className="text-blue-200/70 text-lg leading-relaxed">
              Personalized agents with your Anthropic key. No subscriptions, no markup, total
              control.
            </p>
          </div>

          {panel?.quote && (
            <blockquote className="border-l-2 border-blue-500/40 pl-4">
              <p className="text-blue-100/60 italic text-sm">{panel.quote}</p>
              {panel.author && (
                <footer className="mt-2 text-blue-400/50 text-xs">{panel.author}</footer>
              )}
            </blockquote>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {['8 templates', 'BYOK', 'AES-256 encrypted'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-blue-300/60 text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">AgentLab</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
