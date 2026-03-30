import { MESSAGE_STATUS, TIMELINE_EVENT } from "./domain";
import { normalizeConversationFailureMessage } from "./conversation-errors";

export function buildAssistantFailedMessageState(error: unknown) {
  const message = normalizeConversationFailureMessage(error);

  return {
    status: MESSAGE_STATUS.FAILED,
    contentMarkdown: `Agent 处理失败：${message}`,
    structuredJson: {
      agent_error: message,
    } satisfies Record<string, unknown>,
  };
}

export function buildRunFailedToolMessageState(error: unknown) {
  const message = normalizeConversationFailureMessage(error);

  return {
    status: MESSAGE_STATUS.FAILED,
    contentMarkdown: `运行失败：${message}`,
    structuredJson: {
      timeline_event: TIMELINE_EVENT.RUN_FAILED,
      error: message,
    } satisfies Record<string, unknown>,
  };
}
