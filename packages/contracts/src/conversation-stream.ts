import { z } from "zod";

import {
  CONVERSATION_STREAM_EVENT,
  MESSAGE_ROLE,
  MESSAGE_STATUS_VALUES,
} from "./constants";

export const conversationStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.TOOL_MESSAGE),
    message_id: z.string().uuid(),
    role: z.literal(MESSAGE_ROLE.TOOL),
    status: z.enum(MESSAGE_STATUS_VALUES),
    content_markdown: z.string(),
    created_at: z.string(),
    structured: z.record(z.string(), z.unknown()).nullable().optional(),
  }),
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.ANSWER_DONE),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid().nullable(),
  }),
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.RUN_FAILED),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid().nullable(),
    error: z.string(),
  }),
]);

export type ConversationStreamEvent = z.infer<typeof conversationStreamEventSchema>;
