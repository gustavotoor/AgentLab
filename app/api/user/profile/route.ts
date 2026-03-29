/**
 * PATCH /api/user/profile — Update user profile fields.
 * Supports: name, locale, theme, onboardingDone.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Whitelist allowed fields
    const allowedFields: Record<string, unknown> = {};
    if (typeof body.name === "string") allowedFields.name = body.name.trim();
    if (typeof body.locale === "string" && ["pt-BR", "en"].includes(body.locale)) {
      allowedFields.locale = body.locale;
    }
    if (typeof body.theme === "string" && ["light", "dark", "system"].includes(body.theme)) {
      allowedFields.theme = body.theme;
    }
    if (typeof body.onboardingDone === "boolean") {
      allowedFields.onboardingDone = body.onboardingDone;
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: "no-valid-fields" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: allowedFields,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        locale: true,
        theme: true,
        onboardingDone: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_PATCH_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
