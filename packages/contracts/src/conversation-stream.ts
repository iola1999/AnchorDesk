import { z } from "zod";

export const conversationStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("tool_message"),
    message_id: z.string().uuid(),
    role: z.literal("tool"),
    status: z.enum(["streaming", "completed", "failed"]),
    content_markdown: z.string(),
    created_at: z.string(),
    structured: z.record(z.string(), z.unknown()).nullable().optional(),
  }),
  z.object({
    type: z.literal("answer_done"),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid().nullable(),
  }),
  z.object({
    type: z.literal("run_failed"),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid().nullable(),
    error: z.string(),
  }),
]);

export type ConversationStreamEvent = z.infer<typeof conversationStreamEventSchema>;

