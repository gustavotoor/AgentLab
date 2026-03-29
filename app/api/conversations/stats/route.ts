/**
 * GET /api/conversations/stats — Dashboard statistics.
 * Returns total conversations and messages sent today for the authenticated user.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalConversations, messagesToday] = await Promise.all([
      db.conversation.count({
        where: { agent: { userId: session.user.id } },
      }),
      db.message.count({
        where: {
          createdAt: { gte: today },
          conversation: { agent: { userId: session.user.id } },
        },
      }),
    ]);

    return NextResponse.json({
      total: totalConversations,
      today: messagesToday,
    });
  } catch (error) {
    console.error("[STATS_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
