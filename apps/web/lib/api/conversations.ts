import { z } from "zod";

export const conversationPatchSchema = z
  .object({
    title: z.string().optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .refine((value) => value.title !== undefined || value.status !== undefined, {
    message: "At least one field must be provided",
  });

export type WorkspaceConversationListItem = {
  id: string;
  title: string;
  status: "active" | "archived";
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
  if (requestedConversationId) {
    const requested = conversations.find((item) => item.id === requestedConversationId);
    if (requested) {
      return requested;
    }
  }

  const activeConversations = conversations
    .filter((item) => item.status === "active")
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

  return (
    activeConversations[0] ??
    conversations[0] ??
    null
  );
}

export function chooseWorkspaceConversationWithMeta<T extends WorkspaceConversationListItem>(
  conversations: T[],
  requestedConversationId?: string,
) {
  if (requestedConversationId) {
    const requested = conversations.find((item) => item.id === requestedConversationId);
    if (requested) {
      return requested;
    }
  }

  const activeConversations = conversations
    .filter((item) => item.status === "active")
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

  return activeConversations[0] ?? conversations[0] ?? null;
}

export function groupWorkspaceConversations(
  conversations: WorkspaceConversationListItem[],
) {
  return {
    active: conversations.filter((item) => item.status === "active"),
    archived: conversations.filter((item) => item.status === "archived"),
  };
}

export function groupWorkspaceConversationsWithMeta<T extends WorkspaceConversationListItem>(
  conversations: T[],
) {
  return {
    active: conversations.filter((item) => item.status === "active"),
    archived: conversations.filter((item) => item.status === "archived"),
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
