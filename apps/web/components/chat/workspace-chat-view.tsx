"use client";

import { useEffect, useState } from "react";

import { type ConversationStatus } from "@anchordesk/contracts";

import { ConversationPageActions } from "@/components/chat/conversation-page-actions";
import { type ComposerAttachment, type ComposerSubmittedTurn } from "@/components/chat/composer";
import { WorkspaceEmptyConversationStage } from "@/components/chat/workspace-empty-conversation-stage";
import { WorkspaceConversationPanel } from "@/components/chat/workspace-conversation-panel";
import { type AssistantProcessMessage } from "@/lib/api/conversation-process";
import {
  applySubmittedConversationToList,
  type WorkspaceConversationListItem,
} from "@/lib/api/conversations";
import {
  type ConversationChatMessage,
  type ConversationMessageCitation,
} from "@/lib/api/conversation-session";
import { WorkspaceShell } from "@/components/workspaces/workspace-shell";

type TimelineMessagesByAssistant = Record<string, AssistantProcessMessage[]>;

type ActiveConversationMeta = {
  id: string;
  title: string;
  status: ConversationStatus;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  attachmentCount: number;
};

export function WorkspaceChatView({
  workspace,
  workspaces,
  initialConversations,
  currentUser,
  breadcrumbs,
  workspaceId,
  activeConversation,
  initialTimelineMessagesByAssistant,
  initialMessages,
  initialCitations,
  initialAttachments,
}: {
  workspace: {
    id: string;
    title: string;
  };
  workspaces: Array<{
    id: string;
    title: string;
  }>;
  initialConversations: WorkspaceConversationListItem[];
  currentUser: {
    name?: string | null;
    username: string;
  };
  breadcrumbs: Array<{ label: string; href?: string }>;
  workspaceId: string;
  activeConversation?: ActiveConversationMeta | null;
  initialTimelineMessagesByAssistant?: TimelineMessagesByAssistant;
  initialMessages?: ConversationChatMessage[];
  initialCitations?: ConversationMessageCitation[];
  initialAttachments?: ComposerAttachment[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    activeConversation?.id,
  );

  useEffect(() => {
    setConversations(initialConversations);
    setActiveConversationId(activeConversation?.id);
  }, [activeConversation?.id, initialConversations]);

  function handleSubmittedTurn(turn: ComposerSubmittedTurn) {
    setConversations((current) =>
      applySubmittedConversationToList({
        conversations: current,
        conversationId: turn.conversationId,
        promptContent: turn.userMessage.contentMarkdown,
      }),
    );
    setActiveConversationId(turn.conversationId);
  }

  const activeConversationListItem = activeConversationId
    ? conversations.find((conversation) => conversation.id === activeConversationId) ?? null
    : null;
  const canShowServerTopActions =
    Boolean(activeConversation) && activeConversation?.id === activeConversationId;

  return (
    <WorkspaceShell
      workspace={workspace}
      workspaces={workspaces}
      conversations={conversations}
      activeConversationId={activeConversationId}
      currentUser={currentUser}
      contentScroll="contained"
      breadcrumbs={breadcrumbs}
      topActions={
        canShowServerTopActions && activeConversation ? (
          <ConversationPageActions
            conversationId={activeConversation.id}
            workspaceId={workspaceId}
            conversationTitle={activeConversationListItem?.title ?? activeConversation.title}
            conversationStatus={activeConversationListItem?.status ?? activeConversation.status}
            createdAt={activeConversation.createdAt}
            updatedAt={activeConversationListItem?.updatedAt ?? activeConversation.updatedAt}
            creatorLabel={`${currentUser.username}（你）`}
            messageCount={activeConversation.messageCount}
            attachmentCount={activeConversation.attachmentCount}
          />
        ) : undefined
      }
    >
      {activeConversation ? (
        <WorkspaceConversationPanel
          conversationId={activeConversation.id}
          workspaceId={workspaceId}
          initialTimelineMessagesByAssistant={initialTimelineMessagesByAssistant ?? {}}
          initialMessages={initialMessages ?? []}
          initialCitations={initialCitations ?? []}
          initialAttachments={initialAttachments ?? []}
          onSubmittedTurn={handleSubmittedTurn}
        />
      ) : (
        <WorkspaceEmptyConversationStage
          workspaceId={workspaceId}
          workspaceTitle={workspace.title}
          onSubmittedTurn={handleSubmittedTurn}
        />
      )}
    </WorkspaceShell>
  );
}
