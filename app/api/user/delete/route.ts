/**
 * DELETE /api/user/delete — Permanently delete user account and all data.
 * Requires confirmation text "DELETE" in the request body.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { confirmation } = await req.json();

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "confirmation-required" },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle agents, conversations, messages)
    await db.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_DELETE_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
