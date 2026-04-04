import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tables = {
    messageCitations: Symbol("messageCitations"),
    messages: Symbol("messages"),
  };

  const selectResults: unknown[][] = [];
  const auth = vi.fn();
  const cancelStreamingAssistantRun = vi.fn();
  const createSseWriter = vi.fn();
  const createRedisClient = vi.fn(() => ({
    quit: vi.fn(async () => undefined),
  }));
  const loggerChild = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
  const readConversationStreamEvents = vi.fn();
  const requireOwnedConversation = vi.fn();

  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => selectResults.shift() ?? []),
          orderBy: vi.fn(async () => selectResults.shift() ?? []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    })),
  };

  return {
    auth,
    cancelStreamingAssistantRun,
    createSseWriter,
    createRedisClient,
    db,
    loggerChild,
    readConversationStreamEvents,
    requireOwnedConversation,
    selectResults,
    tables,
  };
});

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/api/conversation-run-control", () => ({
  cancelStreamingAssistantRun: mocks.cancelStreamingAssistantRun,
}));

vi.mock("@/lib/api/sse-writer", async () => {
  const actual =
    await vi.importActual<typeof import("./sse-writer")>("./sse-writer");

  return {
    ...actual,
    createSseWriter: mocks.createSseWriter.mockImplementation(actual.createSseWriter),
  };
});

vi.mock("@/lib/guards/resources", () => ({
  requireOwnedConversation: mocks.requireOwnedConversation,
}));

vi.mock("@/lib/server/logger", () => ({
  buildRequestLogContext: () => ({}),
  logger: {
    child: () => mocks.loggerChild,
  },
  resolveRequestId: () => "request-1",
}));

vi.mock("@anchordesk/db", () => ({
  getDb: () => mocks.db,
  messageCitations: mocks.tables.messageCitations,
  messages: mocks.tables.messages,
}));

vi.mock("@anchordesk/logging", () => ({
  serializeErrorForLog: (error: unknown) => ({
    message: error instanceof Error ? error.message : String(error),
  }),
}));

vi.mock("@anchordesk/queue", () => ({
  createRedisClient: mocks.createRedisClient,
  readConversationStreamEvents: mocks.readConversationStreamEvents,
}));

let GET!: typeof import("../../app/api/conversations/[conversationId]/stream/route").GET;

beforeAll(async () => {
  ({ GET } = await import("../../app/api/conversations/[conversationId]/stream/route"));
});

beforeEach(() => {
  vi.useFakeTimers();
  mocks.selectResults.length = 0;
  mocks.auth.mockReset();
  mocks.cancelStreamingAssistantRun.mockReset();
  mocks.createSseWriter.mockReset();
  mocks.createRedisClient.mockClear();
  mocks.readConversationStreamEvents.mockReset();
  mocks.requireOwnedConversation.mockReset();
  mocks.loggerChild.debug.mockReset();
  mocks.loggerChild.error.mockReset();
  mocks.loggerChild.info.mockReset();
  mocks.loggerChild.warn.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/conversations/[conversationId]/stream", () => {
  it("routes stream writes through the safe SSE writer helper", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
    });
    mocks.requireOwnedConversation.mockResolvedValue({
      id: "conversation-1",
      workspaceId: "workspace-1",
    });
    mocks.selectResults.push([], []);

    const response = await GET(
      new Request(
        "http://localhost/api/conversations/conversation-1/stream?assistantMessageId=assistant-1",
      ),
      {
        params: Promise.resolve({ conversationId: "conversation-1" }),
      },
    );

    await response.body?.cancel();
    await Promise.resolve();

    expect(mocks.createSseWriter).toHaveBeenCalledTimes(1);
  });

  it("does not log a stream failure after the client closes before the next keepalive", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
    });
    mocks.requireOwnedConversation.mockResolvedValue({
      id: "conversation-1",
      workspaceId: "workspace-1",
    });
    mocks.selectResults.push([], []);

    const response = await GET(
      new Request(
        "http://localhost/api/conversations/conversation-1/stream?assistantMessageId=assistant-1",
      ),
      {
        params: Promise.resolve({ conversationId: "conversation-1" }),
      },
    );

    await Promise.resolve();
    await Promise.resolve();

    await response.body?.cancel();
    await vi.advanceTimersByTimeAsync(5000);
    await Promise.resolve();

    expect(mocks.loggerChild.error).not.toHaveBeenCalled();
  });
});
