import { z } from "zod";
import {
  CONVERSATION_STATUS,
  CONVERSATION_STATUS_VALUES,
  type ConversationStatus,
} from "@anchordesk/contracts";

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

export type WorkspaceConversationMeta = WorkspaceConversationListItem & {
  createdAt: Date;
  messageCount: number;
  attachmentCount: number;
};

export function buildConversationTitleFromPrompt(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized;
}

export function normalizeConversationTitle(input: string, fallback: string) {
  const normalized = input.trim().replace(/\s+/g, " ");
  return normalized || fallback;
}

export function applySubmittedConversationToList(input: {
  conversationId: string;
  conversations: WorkspaceConversationListItem[];
  now?: Date;
  promptContent: string;
}) {
  const now = input.now ?? new Date();
  const existingConversation = input.conversations.find(
    (conversation) => conversation.id === input.conversationId,
  );
  const nextConversation: WorkspaceConversationListItem = {
    id: input.conversationId,
    title:
      existingConversation?.title ?? buildConversationTitleFromPrompt(input.promptContent),
    status: existingConversation?.status ?? CONVERSATION_STATUS.ACTIVE,
    updatedAt: now,
  };

  return [
    nextConversation,
    ...input.conversations.filter(
      (conversation) => conversation.id !== input.conversationId,
    ),
  ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
}

export function applySubmittedTurnToConversationMeta(input: {
  attachmentCount: number;
  conversationId: string;
  current?: WorkspaceConversationMeta | null;
  now?: Date;
  promptContent: string;
}): WorkspaceConversationMeta {
  const now = input.now ?? new Date();

  if (!input.current || input.current.id !== input.conversationId) {
    return {
      id: input.conversationId,
      title: buildConversationTitleFromPrompt(input.promptContent),
      status: CONVERSATION_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
      messageCount: 2,
      attachmentCount: input.attachmentCount,
    };
  }

  return {
    ...input.current,
    updatedAt: now,
    messageCount: input.current.messageCount + 2,
    attachmentCount: Math.max(input.current.attachmentCount, input.attachmentCount),
  };
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

export function formatConversationMetaTimestamp(
  value: Date,
  now = new Date(),
) {
  const timeLabel = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);

  const isSameDay =
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate();
  if (isSameDay) {
    return `今天 ${timeLabel}`;
  }

  const yesterday = new Date(now);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    value.getFullYear() === yesterday.getFullYear() &&
    value.getMonth() === yesterday.getMonth() &&
    value.getDate() === yesterday.getDate();
  if (isYesterday) {
    return `昨天 ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    year: value.getFullYear() === now.getFullYear() ? undefined : "numeric",
    month: "long",
    day: "numeric",
  }).format(value);

  return `${dateLabel} ${timeLabel}`;
}

export function formatConversationSidebarUpdatedAt(
  value: Date,
  now = new Date(),
) {
  const diffMs = now.getTime() - value.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) {
    return "刚刚";
  }

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}分钟前`;
  }

  if (diffMs < day) {
    return `${Math.max(1, Math.floor(diffMs / hour))}小时前`;
  }

  if (diffMs < week) {
    return `${Math.max(1, Math.floor(diffMs / day))}天前`;
  }

  if (value.getFullYear() === now.getFullYear()) {
    return `${value.getMonth() + 1}月${value.getDate()}日`;
  }

  return `${value.getFullYear()}年${value.getMonth() + 1}月${value.getDate()}日`;
}

export function resolveConversationDeleteRedirect({
  workspaceId,
  deletedConversationId,
  activeConversationId,
}: {
  workspaceId: string;
  deletedConversationId: string;
  activeConversationId?: string;
}) {
  if (deletedConversationId !== activeConversationId) {
    return null;
  }

  return `/workspaces/${workspaceId}`;
}
