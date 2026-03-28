import { FlowProducer, Queue, type JobsOptions } from "bullmq";
import { DEFAULT_QUEUE_JOB_RETENTION_LIMIT } from "@knowledge-assistant/contracts";

export const QUEUE_NAMES = {
  respond: "conversation.respond",
  parse: "document.parse",
  chunk: "document.chunk",
  embed: "document.embed",
  index: "document.index",
} as const;

export type IngestJobPayload = {
  workspaceId: string;
  documentId: string;
  documentVersionId: string;
};

export type ConversationResponseJobPayload = {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  prompt: string;
};

export function getRedisConnection() {
  return {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  };
}

export function createFlowProducer() {
  return new FlowProducer({
    connection: getRedisConnection(),
  });
}

export function createQueue(name: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]) {
  return new Queue(name, {
    connection: getRedisConnection(),
  });
}

export async function enqueueIngestFlow(
  payload: IngestJobPayload,
  options?: JobsOptions,
) {
  const producer = createFlowProducer();

  return producer.add({
    name: QUEUE_NAMES.index,
    queueName: QUEUE_NAMES.index,
    data: payload,
    opts: {
      jobId: `${payload.documentVersionId}:index`,
      removeOnComplete: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
      removeOnFail: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
      ...options,
    },
    children: [
      {
        name: QUEUE_NAMES.embed,
        queueName: QUEUE_NAMES.embed,
        data: payload,
        opts: {
          jobId: `${payload.documentVersionId}:embed`,
          removeOnComplete: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
          removeOnFail: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
        },
        children: [
          {
            name: QUEUE_NAMES.chunk,
            queueName: QUEUE_NAMES.chunk,
            data: payload,
            opts: {
              jobId: `${payload.documentVersionId}:chunk`,
              removeOnComplete: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
              removeOnFail: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
            },
            children: [
              {
                name: QUEUE_NAMES.parse,
                queueName: QUEUE_NAMES.parse,
                data: payload,
                opts: {
                  jobId: `${payload.documentVersionId}:parse`,
                  removeOnComplete: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
                  removeOnFail: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
                },
              },
            ],
          },
        ],
      },
    ],
  });
}

export async function enqueueConversationResponse(
  payload: ConversationResponseJobPayload,
  options?: JobsOptions,
) {
  const queue = createQueue(QUEUE_NAMES.respond);

  return queue.add(QUEUE_NAMES.respond, payload, {
    jobId: `${payload.assistantMessageId}:respond`,
    removeOnComplete: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
    removeOnFail: DEFAULT_QUEUE_JOB_RETENTION_LIMIT,
    ...options,
  });
}
