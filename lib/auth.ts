/**
 * NextAuth.js v4 configuration for AgentLab.
 * Uses credentials provider with email/password authentication.
 * JWT strategy for session management, Prisma for user persistence.
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("missing-credentials");
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user || !user.password) throw new Error("invalid-credentials");

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("invalid-credentials");
        if (!user.emailVerified) throw new Error("email-not-verified");

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id;
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.onboardingDone = session.onboardingDone ?? token.onboardingDone;
      }
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, image: true, onboardingDone: true, locale: true, theme: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.onboardingDone = dbUser.onboardingDone;
          token.locale = dbUser.locale;
          token.theme = dbUser.theme;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.onboardingDone = token.onboardingDone as boolean;
        session.user.locale = token.locale as string;
        session.user.theme = token.theme as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
