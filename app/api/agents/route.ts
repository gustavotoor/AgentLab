/**
 * GET /api/agents — List all agents for the authenticated user.
 * POST /api/agents — Create a new agent with system prompt generation.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentSchema } from "@/lib/validations";
import { buildSystemPrompt } from "@/lib/prompts";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const agents = await db.agent.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        emoji: true,
        templateId: true,
        tone: true,
        totalChats: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("[AGENTS_GET_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = agentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation-error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, emoji, templateId, personality, tone, locale, extraSoul } = parsed.data;

    // Build the system prompt from agent configuration
    const systemPrompt = buildSystemPrompt(
      { name, templateId, personality, tone, locale, extraSoul },
      session.user.name ?? undefined
    );

    const agent = await db.agent.create({
      data: {
        userId: session.user.id,
        name,
        emoji: emoji || "🤖",
        templateId,
        personality,
        tone,
        locale: locale || "pt-BR",
        extraSoul: extraSoul || null,
        systemPrompt,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("[AGENTS_POST_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
