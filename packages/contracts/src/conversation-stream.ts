import { z } from "zod";

import {
  CONVERSATION_STREAM_EVENT,
  KNOWLEDGE_SOURCE_SCOPE_VALUES,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
  MESSAGE_STATUS_VALUES,
} from "./constants";

const conversationStreamCitationSchema = z.object({
  id: z.string().uuid(),
  anchor_id: z.string().uuid(),
  document_id: z.string().uuid(),
  label: z.string().min(1),
  quote_text: z.string(),
  source_scope: z.enum(KNOWLEDGE_SOURCE_SCOPE_VALUES).nullable().optional(),
  library_title: z.string().nullable().optional(),
});

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
    type: z.literal(CONVERSATION_STREAM_EVENT.ANSWER_DELTA),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid(),
    status: z.enum(MESSAGE_STATUS_VALUES),
    content_markdown: z.string(),
  }),
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.ANSWER_DONE),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid().nullable(),
    status: z.literal(MESSAGE_STATUS.COMPLETED),
    content_markdown: z.string().nullable(),
    structured: z.record(z.string(), z.unknown()).nullable().optional(),
    citations: z.array(conversationStreamCitationSchema),
  }),
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.RUN_FAILED),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid().nullable(),
    status: z.literal(MESSAGE_STATUS.FAILED),
    content_markdown: z.string().nullable(),
    structured: z.record(z.string(), z.unknown()).nullable().optional(),
    citations: z.array(conversationStreamCitationSchema),
    error: z.string(),
  }),
]);

export type ConversationStreamEvent = z.infer<typeof conversationStreamEventSchema>;
