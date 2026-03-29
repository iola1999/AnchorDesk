export function extractAssistantTextDelta(message: unknown) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const streamMessage = message as {
    type?: string;
    event?: {
      type?: string;
      delta?: {
        type?: string;
        text?: string;
      };
    };
  };

  if (
    streamMessage.type !== "stream_event" ||
    streamMessage.event?.type !== "content_block_delta" ||
    streamMessage.event.delta?.type !== "text_delta"
  ) {
    return null;
  }

  return typeof streamMessage.event.delta.text === "string"
    ? streamMessage.event.delta.text
    : null;
}
