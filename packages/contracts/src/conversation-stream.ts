import { z } from "zod";

import {
  ASSISTANT_STREAM_PHASE_VALUES,
  CONVERSATION_STREAM_EVENT,
  KNOWLEDGE_SOURCE_SCOPE_VALUES,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
  MESSAGE_STATUS_VALUES,
} from "./constants";

const conversationStreamCitationSchema = z.object({
  id: z.string().uuid(),
  anchor_id: z.string().uuid().nullable().optional(),
  document_id: z.string().uuid().nullable().optional(),
  label: z.string().min(1),
  quote_text: z.string(),
  source_scope: z.enum(KNOWLEDGE_SOURCE_SCOPE_VALUES).nullable().optional(),
  library_title: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  source_domain: z.string().nullable().optional(),
  source_title: z.string().nullable().optional(),
});

export const conversationStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.ASSISTANT_STATUS),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid(),
    status: z.enum(MESSAGE_STATUS_VALUES),
    phase: z.enum(ASSISTANT_STREAM_PHASE_VALUES).nullable().optional(),
    status_text: z.string().nullable().optional(),
    tool_name: z.string().nullable().optional(),
    tool_use_id: z.string().nullable().optional(),
    task_id: z.string().nullable().optional(),
  }),
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
    type: z.literal(CONVERSATION_STREAM_EVENT.TOOL_PROGRESS),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid(),
    tool_use_id: z.string(),
    tool_name: z.string(),
    elapsed_seconds: z.number().nonnegative(),
    status_text: z.string().nullable().optional(),
    task_id: z.string().nullable().optional(),
  }),
  z.object({
    type: z.literal(CONVERSATION_STREAM_EVENT.ANSWER_DELTA),
    conversation_id: z.string().uuid(),
    message_id: z.string().uuid(),
    status: z.enum(MESSAGE_STATUS_VALUES),
    content_markdown: z.string(),
    delta_text: z.string().nullable().optional(),
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
