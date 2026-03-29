/**
 * GET /api/agents/[id] — Get a single agent (verifies ownership).
 * PATCH /api/agents/[id] — Update an agent and regenerate system prompt.
 * DELETE /api/agents/[id] — Delete an agent and all its conversations.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentSchema } from "@/lib/validations";
import { buildSystemPrompt } from "@/lib/prompts";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const agent = await db.agent.findFirst({
      where: { id, userId: session.user.id },
      include: {
        _count: { select: { conversations: true } },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("[AGENT_GET_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.agent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = agentSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation-error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Regenerate system prompt if any prompt-affecting fields changed
    const promptFields = { ...existing, ...data };
    const systemPrompt = buildSystemPrompt(
      {
        name: promptFields.name,
        templateId: promptFields.templateId,
        personality: promptFields.personality,
        tone: promptFields.tone,
        locale: promptFields.locale,
        extraSoul: promptFields.extraSoul ?? undefined,
      },
      session.user.name ?? undefined
    );

    const agent = await db.agent.update({
      where: { id },
      data: {
        ...data,
        systemPrompt,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("[AGENT_PATCH_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const agent = await db.agent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    await db.agent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AGENT_DELETE_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
