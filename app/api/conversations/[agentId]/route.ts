/**
 * GET /api/conversations/[agentId] — List all conversations for an agent.
 * Returns conversations with message count, ordered by most recent.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { agentId } = await params;

    // Verify agent ownership
    const agent = await db.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const conversations = await db.conversation.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[CONVERSATIONS_GET_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
