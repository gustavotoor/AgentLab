/**
 * POST /api/chat — Streaming chat endpoint using Vercel AI SDK.
 * Flow: authenticate → verify agent ownership → decrypt user API key →
 * create/get conversation → call Anthropic with system prompt → stream response →
 * save messages to DB after stream completes.
 */
import { streamText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { getAnthropicModel } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, agentId, conversationId } = await req.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return new Response("Bad request", { status: 400 });
    }

    // Verify agent ownership
    const agent = await db.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    });

    if (!agent) {
      return new Response("Agent not found", { status: 404 });
    }

    // Get user's API key
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { apiKeyEncrypted: true, apiKeyValid: true },
    });

    // Try user's key first, then fallback to system key
    let apiKey: string | undefined;

    if (user?.apiKeyEncrypted && user.apiKeyValid) {
      try {
        apiKey = decrypt(user.apiKeyEncrypted);
      } catch {
        console.error("[CHAT] Failed to decrypt user API key");
      }
    }

    if (!apiKey) {
      apiKey = process.env.ANTHROPIC_API_KEY;
    }

    if (!apiKey) {
      return new Response("No API key configured. Add your Anthropic API key in Settings.", {
        status: 403,
      });
    }

    // Get or create conversation
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      // Create new conversation with title from first user message
      const firstMessage = messages.find((m: { role: string }) => m.role === "user");
      const title = firstMessage
        ? (firstMessage.content as string).slice(0, 100)
        : "New conversation";

      const conversation = await db.conversation.create({
        data: {
          agentId,
          title,
        },
      });
      activeConversationId = conversation.id;

      // Increment agent chat count
      await db.agent.update({
        where: { id: agentId },
        data: { totalChats: { increment: 1 } },
      });
    }

    // Save user message to DB
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      await db.message.create({
        data: {
          conversationId: activeConversationId,
          role: "user",
          content: lastUserMessage.content as string,
        },
      });
    }

    // Create the Anthropic model with user's API key
    const model = getAnthropicModel(apiKey);

    // Stream the response
    const result = streamText({
      model,
      system: agent.systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        // Save assistant message to DB after stream completes
        await db.message.create({
          data: {
            conversationId: activeConversationId,
            role: "assistant",
            content: text,
          },
        });
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "X-Conversation-Id": activeConversationId,
      },
    });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return new Response("Internal server error", { status: 500 });
  }
}
