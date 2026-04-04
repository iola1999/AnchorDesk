import { requestAgentRuntimeCancel } from "./agent-runtime";

export async function cancelStreamingAssistantRun(input: {
  conversationId: string;
  assistantMessageId: string;
  runId: string | null;
  reason: "user_stop" | "stale_stream_expired";
}) {
  if (!input.runId) {
    return false;
  }

  await requestAgentRuntimeCancel({
    assistantMessageId: input.assistantMessageId,
    runId: input.runId,
    reason: input.reason,
  });

  return true;
}
