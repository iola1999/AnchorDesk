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

export function splitMockAssistantText(text: string, maxSentencesPerChunk = 2) {
  const sentences = text
    .split(/(?<=[。！？.!?])/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [];
  }

  const chunkSize = Math.max(1, maxSentencesPerChunk);
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    chunks.push(sentences.slice(index, index + chunkSize).join(""));
  }

  return chunks;
}
