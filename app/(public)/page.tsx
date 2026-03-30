import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Zap, Key, Layers, Palette, History, Shield, Globe, ArrowRight, Bot, ChevronRight, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  { icon: Key, key: 'byok' },
  { icon: Layers, key: 'templates' },
  { icon: Palette, key: 'custom' },
  { icon: History, key: 'history' },
  { icon: Shield, key: 'secure' },
  { icon: Globe, key: 'multilingual' },
] as const

const AGENT_PREVIEWS = [
  { emoji: '🤝', name: 'Personal Assistant', desc: 'Organizes your day' },
  { emoji: '💼', name: 'Consultant', desc: 'Strategy & analysis' },
  { emoji: '💻', name: 'Dev Assistant', desc: 'Code reviews & debug' },
  { emoji: '🎓', name: 'Professor', desc: 'Patient explanations' },
  { emoji: '✍️', name: 'Copywriter', desc: 'Texts that convert' },
  { emoji: '🧘', name: 'Life Coach', desc: 'Goals & motivation' },
]

/**
 * Public landing page showcasing AgentLab's features.
 */
export default async function LandingPage() {
  const t = await getTranslations('landing')
  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session

  return (
    <div className="min-h-screen bg-[#060912]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#060912]/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">AgentLab</span>
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/5">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
                <Link href="/register">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            {t('hero.badge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            {t('hero.title')}{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-violet-400 bg-clip-text text-transparent">
              {t('hero.titleAccent')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 shadow-xl shadow-blue-600/20 text-base"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 shadow-xl shadow-blue-600/20 text-base"
              >
                <Link href="/register">
                  {t('hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 border-white/10 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/20 text-base bg-transparent"
            >
              <Link href="/store">
                {t('hero.ctaSecondary')}
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-white/30">{t('hero.noCard')}</p>
        </div>

        {/* Agent preview cards */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGENT_PREVIEWS.map((agent, i) => (
              <div
                key={agent.name}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center hover:border-blue-500/20 hover:bg-white/[0.04] transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-3xl mb-2">{agent.emoji}</div>
                <div className="text-white text-xs font-medium mb-1">{agent.name}</div>
                <div className="text-white/40 text-xs">{agent.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('features.title')}
            </h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-blue-500/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/20 mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">
                  {t(`features.${key}.title` as `features.byok.title`)}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {t(`features.${key}.desc` as `features.byok.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
          <p className="text-white/50 mb-16">Three steps to your first AI agent</p>

          <div className="space-y-px">
            {[
              { num: '01', title: 'Get your Anthropic API key', desc: 'Free to start at console.anthropic.com. Pay only for what you use.' },
              { num: '02', title: 'Choose a template or start blank', desc: '8 ready-made personalities. Or define your own from scratch.' },
              { num: '03', title: 'Chat and customize', desc: 'Talk with your agent. Refine its personality until it\'s perfect.' },
            ].map((step) => (
              <div
                key={step.num}
                className="flex gap-8 items-start p-6 rounded-xl hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="text-5xl font-black text-white/5 shrink-0 font-mono leading-none">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-violet-600/5" />
            <div className="relative">
              <Bot className="h-12 w-12 text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-3">{t('cta.title')}</h2>
              <p className="text-white/50 mb-8">{t('cta.subtitle')}</p>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 shadow-xl shadow-blue-600/20"
              >
                <Link href="/register">
                  {t('cta.button')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-white/30 text-sm">AgentLab</span>
          </div>
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} AgentLab. Your agents, your key.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-white/30 text-xs hover:text-white/60">
              Sign in
            </Link>
            <Link href="/register" className="text-white/30 text-xs hover:text-white/60">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
