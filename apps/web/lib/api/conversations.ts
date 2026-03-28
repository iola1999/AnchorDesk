import { z } from "zod";
import {
  CONVERSATION_STATUS,
  CONVERSATION_STATUS_VALUES,
  type ConversationStatus,
} from "@knowledge-assistant/contracts";

export const conversationPatchSchema = z
  .object({
    title: z.string().optional(),
    status: z.enum(CONVERSATION_STATUS_VALUES).optional(),
  })
  .refine((value) => value.title !== undefined || value.status !== undefined, {
    message: "At least one field must be provided",
  });

export type WorkspaceConversationListItem = {
  id: string;
  title: string;
  status: ConversationStatus;
  updatedAt: Date;
};

export function normalizeConversationTitle(input: string, fallback: string) {
  const normalized = input.trim().replace(/\s+/g, " ");
  return normalized || fallback;
}

export function chooseWorkspaceConversation(
  conversations: WorkspaceConversationListItem[],
  requestedConversationId?: string,
) {
  if (!requestedConversationId) {
    return null;
  }

  return conversations.find((item) => item.id === requestedConversationId) ?? null;
}

export function chooseWorkspaceConversationWithMeta<T extends WorkspaceConversationListItem>(
  conversations: T[],
  requestedConversationId?: string,
) {
  if (!requestedConversationId) {
    return null;
  }

  return conversations.find((item) => item.id === requestedConversationId) ?? null;
}

export function groupWorkspaceConversations(
  conversations: WorkspaceConversationListItem[],
) {
  return {
    active: conversations.filter((item) => item.status === CONVERSATION_STATUS.ACTIVE),
    archived: conversations.filter((item) => item.status === CONVERSATION_STATUS.ARCHIVED),
  };
}

export function groupWorkspaceConversationsWithMeta<T extends WorkspaceConversationListItem>(
  conversations: T[],
) {
  return {
    active: conversations.filter((item) => item.status === CONVERSATION_STATUS.ACTIVE),
    archived: conversations.filter((item) => item.status === CONVERSATION_STATUS.ARCHIVED),
  };
}

export function formatConversationUpdatedAt(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
