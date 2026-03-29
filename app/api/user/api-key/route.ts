/**
 * POST /api/user/api-key — Save and validate an Anthropic API key.
 * Flow: validate key with a minimal API call → encrypt → save to DB.
 * DELETE /api/user/api-key — Remove the stored API key.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        { error: "invalid-key-format", valid: false },
        { status: 400 }
      );
    }

    // Validate the key by making a minimal API call
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: "invalid-key", valid: false },
            { status: 400 }
          );
        }
        // Rate limit or other API error — key might still be valid
        console.warn("[API_KEY_VALIDATION]", response.status, error);
      }
    } catch {
      return NextResponse.json(
        { error: "validation-failed", valid: false },
        { status: 400 }
      );
    }

    // Encrypt and save
    const encrypted = encrypt(apiKey);
    const masked = `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: encrypted,
        apiKeyMasked: masked,
        apiKeyValid: true,
      },
    });

    return NextResponse.json({ valid: true, maskedKey: masked });
  } catch (error) {
    console.error("[API_KEY_POST_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: null,
        apiKeyMasked: null,
        apiKeyValid: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API_KEY_DELETE_ERROR]", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
