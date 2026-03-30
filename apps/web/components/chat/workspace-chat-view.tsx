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
  applySubmittedTurnToConversationMeta,
  markConversationActivityInList,
  markConversationMetaActivity,
  type WorkspaceConversationListItem,
  type WorkspaceConversationMeta,
} from "@/lib/api/conversations";
import {
  type ConversationChatMessage,
  type ConversationMessageCitation,
} from "@/lib/api/conversation-session";
import { WorkspaceShell } from "@/components/workspaces/workspace-shell";

type TimelineMessagesByAssistant = Record<string, AssistantProcessMessage[]>;

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
  activeConversation?: WorkspaceConversationMeta | null;
  initialTimelineMessagesByAssistant?: TimelineMessagesByAssistant;
  initialMessages?: ConversationChatMessage[];
  initialCitations?: ConversationMessageCitation[];
  initialAttachments?: ComposerAttachment[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    activeConversation?.id,
  );
  const [activeConversationMeta, setActiveConversationMeta] = useState<
    WorkspaceConversationMeta | null
  >(activeConversation ?? null);

  useEffect(() => {
    setConversations(initialConversations);
    setActiveConversationId(activeConversation?.id);
    setActiveConversationMeta(activeConversation ?? null);
  }, [activeConversation, initialConversations]);

  function handleSubmittedTurn(turn: ComposerSubmittedTurn) {
    setConversations((current) =>
      applySubmittedConversationToList({
        conversations: current,
        conversationId: turn.conversationId,
        promptContent: turn.userMessage.contentMarkdown,
      }),
    );
    setActiveConversationId(turn.conversationId);
    setActiveConversationMeta((current) =>
      applySubmittedTurnToConversationMeta({
        current,
        conversationId: turn.conversationId,
        promptContent: turn.userMessage.contentMarkdown,
        attachmentCount: turn.attachments.length,
      }),
    );
  }

  function handleAssistantTerminalEvent(conversationId: string) {
    setConversations((current) =>
      markConversationActivityInList({
        conversations: current,
        conversationId,
      }),
    );
    setActiveConversationMeta((current) =>
      markConversationMetaActivity({
        current,
        conversationId,
      }),
    );
  }

  const activeConversationListItem = activeConversationId
    ? conversations.find((conversation) => conversation.id === activeConversationId) ?? null
    : null;
  const currentConversationMeta =
    activeConversationMeta && activeConversationMeta.id === activeConversationId
      ? activeConversationMeta
      : null;

  return (
    <WorkspaceShell
      workspace={workspace}
      workspaces={workspaces}
      conversations={conversations}
      activeConversationId={activeConversationId}
      currentUser={currentUser}
      contentScroll="shell"
      breadcrumbs={breadcrumbs}
      topActions={
        currentConversationMeta ? (
          <ConversationPageActions
            conversationId={currentConversationMeta.id}
            workspaceId={workspaceId}
            conversationTitle={
              activeConversationListItem?.title ?? currentConversationMeta.title
            }
            conversationStatus={
              activeConversationListItem?.status ?? currentConversationMeta.status
            }
            createdAt={currentConversationMeta.createdAt}
            updatedAt={activeConversationListItem?.updatedAt ?? currentConversationMeta.updatedAt}
            creatorLabel={`${currentUser.username}（你）`}
            messageCount={currentConversationMeta.messageCount}
            attachmentCount={currentConversationMeta.attachmentCount}
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
          onAssistantTerminalEvent={handleAssistantTerminalEvent}
        />
      ) : (
        <WorkspaceEmptyConversationStage
          workspaceId={workspaceId}
          workspaceTitle={workspace.title}
          onSubmittedTurn={handleSubmittedTurn}
          onAssistantTerminalEvent={handleAssistantTerminalEvent}
        />
      )}
    </WorkspaceShell>
  );
}
