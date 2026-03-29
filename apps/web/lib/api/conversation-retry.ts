import { MESSAGE_ROLE, MESSAGE_STATUS, type MessageRole, type MessageStatus } from "@knowledge-assistant/contracts";

export type RetryableConversationMessage = {
  id: string;
  role: MessageRole;
  status: MessageStatus;
  contentMarkdown: string;
};

export function findRetryableConversationTurn(messages: RetryableConversationMessage[]) {
  const lastMessage = messages.at(-1);
  const previousMessage = messages.at(-2);

  if (!lastMessage || !previousMessage) {
    return null;
  }

  if (
    lastMessage.role !== MESSAGE_ROLE.ASSISTANT ||
    lastMessage.status !== MESSAGE_STATUS.FAILED
  ) {
    return null;
  }

  if (previousMessage.role !== MESSAGE_ROLE.USER) {
    return null;
  }

  return {
    assistantMessageId: lastMessage.id,
    userMessageId: previousMessage.id,
    promptContent: previousMessage.contentMarkdown,
  };
}
