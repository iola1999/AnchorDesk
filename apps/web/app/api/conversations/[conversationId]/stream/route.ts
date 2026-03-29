import { and, asc, eq } from "drizzle-orm";

import {
  CONVERSATION_STREAM_EVENT,
  DEFAULT_CONVERSATION_STREAM_POLL_INTERVAL_MS,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
  type ConversationStreamEvent,
} from "@knowledge-assistant/contracts";
import { getDb, messageCitations, messages } from "@knowledge-assistant/db";

import { auth } from "@/auth";
import {
  buildAssistantDeltaStreamEvent,
  buildAssistantTerminalStreamEvent,
  buildToolMessageStreamEvent,
} from "@/lib/api/conversation-stream";
import { requireOwnedConversation } from "@/lib/guards/resources";

export const runtime = "nodejs";

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const assistantMessageId = new URL(request.url).searchParams.get("assistantMessageId");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await requireOwnedConversation(conversationId, userId);
  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (!assistantMessageId) {
    return Response.json({ error: "assistantMessageId is required" }, { status: 400 });
  }

  const db = getDb();
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emittedMessageIds = new Set<string>();
      let lastAssistantContent = "";

      while (!request.signal.aborted) {
        const toolMessages = await db
          .select({
            id: messages.id,
            status: messages.status,
            contentMarkdown: messages.contentMarkdown,
            createdAt: messages.createdAt,
            structuredJson: messages.structuredJson,
          })
          .from(messages)
          .where(
            and(eq(messages.conversationId, conversationId), eq(messages.role, MESSAGE_ROLE.TOOL)),
          )
          .orderBy(asc(messages.createdAt));

        for (const message of toolMessages) {
          if (emittedMessageIds.has(message.id)) {
            continue;
          }

          emittedMessageIds.add(message.id);
          const payload = buildToolMessageStreamEvent({
            id: message.id,
            status: message.status,
            contentMarkdown: message.contentMarkdown,
            createdAt: message.createdAt,
            structuredJson:
              (message.structuredJson as Record<string, unknown> | null | undefined) ?? null,
          });

          controller.enqueue(
            encoder.encode(
              encodeSse(CONVERSATION_STREAM_EVENT.TOOL_MESSAGE, payload),
            ),
          );
        }

        const [assistantMessage] = await db
          .select({
            id: messages.id,
            status: messages.status,
            contentMarkdown: messages.contentMarkdown,
            structuredJson: messages.structuredJson,
          })
          .from(messages)
          .where(
            and(
              eq(messages.id, assistantMessageId),
              eq(messages.conversationId, conversationId),
            ),
          )
          .limit(1);

        const assistantCitations =
          assistantMessage &&
          (assistantMessage.status === MESSAGE_STATUS.COMPLETED ||
            assistantMessage.status === MESSAGE_STATUS.FAILED)
            ? await db
                .select({
                  id: messageCitations.id,
                  anchorId: messageCitations.anchorId,
                  documentId: messageCitations.documentId,
                  label: messageCitations.label,
                })
                .from(messageCitations)
                .where(eq(messageCitations.messageId, assistantMessage.id))
                .orderBy(asc(messageCitations.ordinal))
            : [];

        const terminalEvent = buildAssistantTerminalStreamEvent({
          conversationId,
          assistantMessage: assistantMessage
            ? {
                id: assistantMessage.id,
                status: assistantMessage.status,
                contentMarkdown: assistantMessage.contentMarkdown,
                structuredJson:
                  (assistantMessage.structuredJson as Record<string, unknown> | null | undefined) ??
                  null,
              }
            : null,
          citations: assistantCitations,
        });

        if (
          assistantMessage &&
          assistantMessage.status === MESSAGE_STATUS.STREAMING &&
          assistantMessage.contentMarkdown !== lastAssistantContent
        ) {
          lastAssistantContent = assistantMessage.contentMarkdown;
          controller.enqueue(
            encoder.encode(
              encodeSse(
                CONVERSATION_STREAM_EVENT.ANSWER_DELTA,
                buildAssistantDeltaStreamEvent({
                  conversationId,
                  assistantMessage: {
                    id: assistantMessage.id,
                    status: assistantMessage.status,
                    contentMarkdown: assistantMessage.contentMarkdown,
                    structuredJson:
                      (assistantMessage.structuredJson as
                        | Record<string, unknown>
                        | null
                        | undefined) ?? null,
                  },
                }),
              ),
            ),
          );
        }

        if (terminalEvent) {
          controller.enqueue(
            encoder.encode(
              encodeSse(terminalEvent.type, terminalEvent satisfies ConversationStreamEvent),
            ),
          );
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(": keepalive\n\n"));
        await sleep(DEFAULT_CONVERSATION_STREAM_POLL_INTERVAL_MS);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
