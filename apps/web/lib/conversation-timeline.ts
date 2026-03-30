import type { AssistantProcessTimelineEntry } from "@/lib/api/conversation-process";

export type ConversationTimelineEntryView = AssistantProcessTimelineEntry;

export function canExpandConversationTimelineEntry(
  entry: ConversationTimelineEntryView,
) {
  return entry.kind === "tool_call" && (entry.input !== null || entry.output !== null);
}

export function describeConversationTimelineEntryDetailsLabel(
  entry: ConversationTimelineEntryView,
) {
  const hasInput = entry.input !== null;
  const hasOutput = entry.output !== null;

  if (hasInput && hasOutput) {
    return "查看入参与结果";
  }

  if (hasInput) {
    return "查看入参";
  }

  if (hasOutput) {
    return "查看结果";
  }

  return "查看详情";
}
