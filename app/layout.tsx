/**
 * Root layout for AgentLab.
 * Wraps the entire app with providers (session, theme, i18n, tooltips).
 * Uses Geist Sans + Geist Mono from Google Fonts.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMessages } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AgentLab — Build Your AI Agents",
    template: "%s | AgentLab",
  },
  description:
    "Create, customize, and deploy personalized AI assistants from ready-to-use templates. Bring your own Anthropic API key.",
  openGraph: {
    title: "AgentLab — Build Your AI Agents",
    description: "Create personalized AI assistants in minutes.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getUserLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
