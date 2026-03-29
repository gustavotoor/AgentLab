/**
 * Landing page — the public face of AgentLab.
 * Design direction: Dark luxury meets warm amber glow.
 * Dramatic hero with animated headline, floating agent cards,
 * 3 feature pillars, live chat demo, testimonial stats, and CTA.
 */
"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Sparkles,
  Bot,
  Shield,
  Zap,
  ArrowRight,
  MessageSquare,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Animated counter for stats section */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="text-white/40 text-sm mt-1">{label}</p>
    </motion.div>
  );
}

/** Fake chat message for the demo section */
function DemoMessage({
  content,
  isUser,
  delay,
}: {
  content: string;
  isUser: boolean;
  delay: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
            : "bg-white/[0.06] text-white/80 border border-white/[0.06]"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const features = [
    {
      icon: Bot,
      title: "8 Agent Templates",
      description:
        "Start with pre-built personalities — personal assistant, business consultant, developer buddy, and more. Customize everything.",
    },
    {
      icon: Shield,
      title: "Bring Your Own Key",
      description:
        "Your API key, encrypted with AES-256-GCM. We never store it in plaintext. Full control, zero vendor lock-in.",
    },
    {
      icon: Zap,
      title: "Real-time Streaming",
      description:
        "Responses stream in real-time, just like talking to a real assistant. Powered by Claude with the Vercel AI SDK.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">AgentLab</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/15 border-0"
            >
              <Link href="/register">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative pt-32 pb-24 md:pt-44 md:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/[0.03] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/[0.02] rounded-full blur-[200px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Open-source AI agent platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]"
          >
            Build your AI
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              agent in minutes
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg md:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed"
          >
            Create, customize, and deploy personalized AI assistants from
            ready-to-use templates. Use your own Anthropic API key. Start
            chatting in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-13 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-base font-medium shadow-xl shadow-amber-500/20 border-0"
            >
              <Link href="/register">
                Start building — it&apos;s free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 px-8 rounded-2xl border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-base"
            >
              <Link href="#features">
                See how it works
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Floating agent cards around hero */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            {[
              { emoji: "🤝", name: "Assistant", x: "5%", y: "20%", delay: 0 },
              { emoji: "💻", name: "DevBot", x: "85%", y: "15%", delay: 1.5 },
              { emoji: "✍️", name: "Writer", x: "90%", y: "65%", delay: 3 },
              { emoji: "🎓", name: "Professor", x: "2%", y: "70%", delay: 2 },
            ].map(({ emoji, name, x, y, delay }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.8, 0.8, 0],
                  scale: [0.8, 1, 1, 0.9],
                  y: [0, -15, -10, -25],
                }}
                transition={{
                  duration: 7,
                  delay,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
                className="absolute rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.06] px-3.5 py-2"
                style={{ left: x, top: y }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-white/60 text-xs font-medium">{name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-16 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat value="8" label="Agent Templates" />
          <AnimatedStat value="2" label="Languages" />
          <AnimatedStat value="AES-256" label="Encryption" />
          <AnimatedStat value="∞" label="Conversations" />
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-amber-400 text-sm font-medium uppercase tracking-wider mb-3">
              Features
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Everything you need to build
              <br />
              <span className="text-white/30">AI agents that actually work</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative bg-white/[0.02] rounded-3xl border border-white/[0.05] p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5 group-hover:bg-amber-500/15 transition-colors">
                  <Icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Chat Demo ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-amber-400 text-sm font-medium uppercase tracking-wider mb-3">
                Chat Interface
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
                Conversations that feel
                <span className="text-white/30"> natural</span>
              </h2>
              <p className="text-white/40 leading-relaxed mb-8">
                Stream responses in real-time powered by Claude. Each agent
                remembers its personality, tone, and your instructions across
                every conversation.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                {[
                  { icon: MessageSquare, text: "Real-time streaming responses" },
                  { icon: Globe, text: "Bilingual agents (PT-BR & English)" },
                  { icon: Lock, text: "Encrypted API key storage (AES-256-GCM)" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-white/50">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-amber-400/70" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Chat demo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/[0.02] rounded-3xl border border-white/[0.06] overflow-hidden"
            >
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-lg">
                  💻
                </div>
                <div>
                  <p className="text-sm font-medium">Dev Assistant</p>
                  <p className="text-xs text-white/30">Online • Streaming</p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4 min-h-[320px]">
                <DemoMessage
                  content="How do I set up Prisma with PostgreSQL in a Next.js project?"
                  isUser={true}
                  delay={0}
                />
                <DemoMessage
                  content="Great question! Here's a quick setup guide:

1. Install Prisma: `npm install prisma @prisma/client`
2. Initialize: `npx prisma init`
3. Define your schema in `prisma/schema.prisma`
4. Run `npx prisma migrate dev` to create tables

Want me to walk through the schema design?"
                  isUser={false}
                  delay={0.3}
                />
                <DemoMessage
                  content="Yes, show me a User model with relations"
                  isUser={true}
                  delay={0.6}
                />
              </div>

              {/* Input area */}
              <div className="px-5 py-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-2.5 border border-white/[0.05]">
                  <span className="text-white/20 text-sm flex-1">Type a message...</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.05] to-transparent rounded-3xl border border-amber-500/10 p-12 md:p-16"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/[0.05] rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Ready to build your
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  first AI agent?
                </span>
              </h2>
              <p className="text-white/40 text-lg mb-8 max-w-lg mx-auto">
                Create a free account, pick a template, add your API key, and
                start chatting. It takes less than 2 minutes.
              </p>
              <Button
                asChild
                size="lg"
                className="h-13 px-10 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-base font-medium shadow-xl shadow-amber-500/25 border-0"
              >
                <Link href="/register">
                  Create free account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">AgentLab</span>
            <span className="text-white/20 text-xs ml-2">
              Built by Gustavo Karsten
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <Link href="/login" className="hover:text-white/60 transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-white/60 transition-colors">
              Register
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
