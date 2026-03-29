/**
 * PATCH /api/user/password — Change password for authenticated user.
 * Validates current password before allowing the update.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation-error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "no-password-set" }, { status: 400 });
    }

    const isValid = await compare(parsed.data.currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "wrong-current-password" }, { status: 400 });
    }

    const hashedPassword = await hash(parsed.data.newPassword, 12);

    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PASSWORD_PATCH_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
