import { describe, expect, test } from "vitest";
import {
  CONVERSATION_STREAM_EVENT,
  KNOWLEDGE_SOURCE_SCOPE,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
} from "@anchordesk/contracts";

import {
  buildConversationAttachmentLinkTarget,
  applyAssistantThinkingDeltaEvent,
  applyAssistantToolMessageEvent,
  applyAssistantDeltaEvent,
  appendSubmittedConversationTurn,
  applyAssistantTerminalEvent,
  applyAssistantTerminalEventToSessionSnapshot,
  buildConversationExportFilename,
  findLatestAssistantMessageId,
  findStreamingAssistantMessageId,
  resolveConversationStreamingAssistantMessageId,
  restartAssistantSessionSnapshotForRetry,
  restartAssistantMessageForRetry,
} from "./conversation-session";

describe("buildConversationAttachmentLinkTarget", () => {
  test("opens attachment documents in a new browser tab", () => {
    expect(
      buildConversationAttachmentLinkTarget({
        workspaceId: "workspace-1",
        documentId: "document-1",
      }),
    ).toEqual({
      href: "/workspaces/workspace-1/documents/document-1",
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  test("returns null when the attachment cannot resolve to a document page", () => {
    expect(
      buildConversationAttachmentLinkTarget({
        workspaceId: "workspace-1",
        documentId: null,
      }),
    ).toBeNull();
  });
});

describe("appendSubmittedConversationTurn", () => {
  test("appends the new user turn and assistant placeholder to the current thread", () => {
    expect(
      appendSubmittedConversationTurn({
        messages: [
          {
            id: "user-1",
            role: MESSAGE_ROLE.USER,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "旧问题",
            structuredJson: null,
          },
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "旧回答",
            structuredJson: null,
          },
        ],
        userMessage: {
          id: "user-2",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "新问题",
          structuredJson: null,
        },
        assistantMessage: {
          id: "assistant-2",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: {
            run_started_at: "2026-03-30T10:00:00.000Z",
          },
        },
      }),
    ).toEqual([
      {
        id: "user-1",
        role: MESSAGE_ROLE.USER,
        status: MESSAGE_STATUS.COMPLETED,
        contentMarkdown: "旧问题",
        structuredJson: null,
      },
      {
        id: "assistant-1",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.COMPLETED,
        contentMarkdown: "旧回答",
        structuredJson: null,
      },
      {
        id: "user-2",
        role: MESSAGE_ROLE.USER,
        status: MESSAGE_STATUS.COMPLETED,
        contentMarkdown: "新问题",
        structuredJson: null,
      },
      {
        id: "assistant-2",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.STREAMING,
        contentMarkdown: "",
        structuredJson: {
          run_started_at: "2026-03-30T10:00:00.000Z",
        },
      },
    ]);
  });

  test("replaces duplicate submitted message ids instead of duplicating them", () => {
    expect(
      appendSubmittedConversationTurn({
        messages: [
          {
            id: "user-1",
            role: MESSAGE_ROLE.USER,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "旧问题",
            structuredJson: null,
          },
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.FAILED,
            contentMarkdown: "旧失败",
            structuredJson: {
              agent_error: "queue offline",
            },
          },
        ],
        userMessage: {
          id: "user-1",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "更新后的问题",
          structuredJson: null,
        },
        assistantMessage: {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: null,
        },
      }),
    ).toEqual([
      {
        id: "user-1",
        role: MESSAGE_ROLE.USER,
        status: MESSAGE_STATUS.COMPLETED,
        contentMarkdown: "更新后的问题",
        structuredJson: null,
      },
      {
        id: "assistant-1",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.STREAMING,
        contentMarkdown: "",
        structuredJson: null,
      },
    ]);
  });
});

describe("findLatestAssistantMessageId", () => {
  test("returns the latest assistant turn in the chat thread", () => {
    expect(
      findLatestAssistantMessageId([
        {
          id: "user-1",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "问题一",
          structuredJson: null,
        },
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "回答一",
          structuredJson: null,
        },
        {
          id: "user-2",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "问题二",
          structuredJson: null,
        },
        {
          id: "assistant-2",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.FAILED,
          contentMarkdown: "回答二失败",
          structuredJson: null,
        },
      ]),
    ).toBe("assistant-2");
  });

  test("returns null when the chat thread has no assistant output", () => {
    expect(
      findLatestAssistantMessageId([
        {
          id: "user-1",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "问题一",
          structuredJson: null,
        },
      ]),
    ).toBeNull();
  });
});

describe("buildConversationExportFilename", () => {
  test("uses the nearest user prompt prefix for the exported markdown filename", () => {
    expect(
      buildConversationExportFilename({
        conversationId: "2cddead8-7dac-1234-9876-abcdefabcdef",
        messageId: "assistant-2",
        messages: [
          {
            id: "user-1",
            role: MESSAGE_ROLE.USER,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "旧问题",
            structuredJson: null,
          },
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "旧回答",
            structuredJson: null,
          },
          {
            id: "user-2",
            role: MESSAGE_ROLE.USER,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "  帮我整理 2026 年第一季度发布计划 / 风险清单\n并输出重点  ",
            structuredJson: null,
          },
          {
            id: "assistant-2",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "新回答",
            structuredJson: null,
          },
        ],
      }),
    ).toBe("帮我整理-2026-年第一季度发布计划-风险清单-并输出重点.md");
  });

  test("limits the prompt-derived filename to the configured prefix length", () => {
    const filename = buildConversationExportFilename({
      conversationId: "2cddead8-7dac-1234-9876-abcdefabcdef",
      messageId: "assistant-1",
      messages: [
        {
          id: "user-1",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "这是一个很长的提示词".repeat(12),
          structuredJson: null,
        },
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "回答",
          structuredJson: null,
        },
      ],
    });

    expect(filename.endsWith(".md")).toBe(true);
    expect(filename.slice(0, -3).length).toBeLessThanOrEqual(48);
  });

  test("falls back to a compact conversation id filename when no prompt is available", () => {
    expect(
      buildConversationExportFilename({
        conversationId: "2cddead8-7dac-1234-9876-abcdefabcdef",
        messageId: "assistant-1",
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "回答",
            structuredJson: null,
          },
        ],
      }),
    ).toBe("conversation-2cddead8.md");
  });
});

describe("findStreamingAssistantMessageId", () => {
  test("returns the assistant turn that is currently streaming", () => {
    expect(
      findStreamingAssistantMessageId([
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "已完成",
          structuredJson: null,
        },
        {
          id: "assistant-2",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: null,
        },
      ]),
    ).toBe("assistant-2");
  });

  test("returns null when no assistant turn is streaming", () => {
    expect(
      findStreamingAssistantMessageId([
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.FAILED,
          contentMarkdown: "失败",
          structuredJson: null,
        },
      ]),
    ).toBeNull();
  });
});

describe("resolveConversationStreamingAssistantMessageId", () => {
  test("prefers the local chat state over stale streaming props", () => {
    expect(
      resolveConversationStreamingAssistantMessageId({
        assistantMessageId: "assistant-1",
        assistantStatus: MESSAGE_STATUS.STREAMING,
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "已完成",
            structuredJson: null,
          },
        ],
      }),
    ).toBeNull();
  });

  test("falls back to streaming props only before local messages are available", () => {
    expect(
      resolveConversationStreamingAssistantMessageId({
        assistantMessageId: "assistant-1",
        assistantStatus: MESSAGE_STATUS.STREAMING,
        messages: [],
      }),
    ).toBe("assistant-1");
  });
});

describe("applyAssistantThinkingDeltaEvent", () => {
  test("appends streamed thinking text into the assistant structured state", () => {
    expect(
      applyAssistantThinkingDeltaEvent({
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.STREAMING,
            contentMarkdown: "",
            structuredJson: {
              run_id: "run-1",
              run_started_at: "2026-04-02T10:00:00.000Z",
              run_last_heartbeat_at: "2026-04-02T10:00:00.000Z",
              run_lease_expires_at: "2026-04-02T10:00:45.000Z",
              phase: "analyzing",
              status_text: "助手正在分析问题并准备回答...",
              thinking_text: "先确认",
              process_steps: [
                {
                  id: "thinking-1",
                  kind: "thinking",
                  status: "streaming",
                  created_at: "2026-04-02T10:00:00.000Z",
                  updated_at: "2026-04-02T10:00:00.000Z",
                  completed_at: null,
                  text: "先确认",
                },
              ],
            },
          },
        ],
        event: {
          type: CONVERSATION_STREAM_EVENT.ASSISTANT_THINKING_DELTA,
          conversation_id: "conversation-1",
          message_id: "assistant-1",
          status: MESSAGE_STATUS.STREAMING,
          thinking_text: "先确认 SDK 有没有暴露 thinking",
          delta_text: " SDK 有没有暴露 thinking",
        },
      }),
    ).toEqual([
      {
        id: "assistant-1",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.STREAMING,
        contentMarkdown: "",
        structuredJson: {
          run_id: "run-1",
          run_started_at: "2026-04-02T10:00:00.000Z",
          run_last_heartbeat_at: "2026-04-02T10:00:00.000Z",
          run_lease_expires_at: "2026-04-02T10:00:45.000Z",
          phase: "analyzing",
          status_text: "助手正在分析问题并准备回答...",
          thinking_text: "先确认 SDK 有没有暴露 thinking",
          process_steps: [
            {
              id: "thinking-1",
              kind: "thinking",
              status: "streaming",
              created_at: "2026-04-02T10:00:00.000Z",
              updated_at: expect.any(String),
              completed_at: null,
              text: "先确认 SDK 有没有暴露 thinking",
            },
          ],
        },
      },
    ]);
  });
});

describe("applyAssistantToolMessageEvent", () => {
  test("records tool boundaries into the assistant process steps", () => {
    expect(
      applyAssistantToolMessageEvent({
        assistantMessageId: "assistant-1",
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.STREAMING,
            contentMarkdown: "",
            structuredJson: {
              process_steps: [
                {
                  id: "thinking-1",
                  kind: "thinking",
                  status: "streaming",
                  created_at: "2026-04-02T10:00:00.000Z",
                  updated_at: "2026-04-02T10:00:00.000Z",
                  completed_at: null,
                  text: "先确认资料库是否可用",
                },
              ],
            },
          },
        ],
        timelineMessage: {
          id: "tool-message-1",
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "开始调用工具：search_workspace_knowledge",
          createdAt: "2026-04-02T10:00:01.000Z",
          structuredJson: {
            tool_name: "search_workspace_knowledge",
            tool_use_id: "tool-use-1",
          },
        },
      }),
    ).toEqual([
      {
        id: "assistant-1",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.STREAMING,
        contentMarkdown: "",
        structuredJson: {
          process_steps: [
            {
              id: "thinking-1",
              kind: "thinking",
              status: "completed",
              created_at: "2026-04-02T10:00:00.000Z",
              updated_at: "2026-04-02T10:00:01.000Z",
              completed_at: "2026-04-02T10:00:01.000Z",
              text: "先确认资料库是否可用",
            },
            {
              id: "tool-use-1",
              kind: "tool",
              status: MESSAGE_STATUS.STREAMING,
              created_at: "2026-04-02T10:00:01.000Z",
              updated_at: "2026-04-02T10:00:01.000Z",
              completed_at: null,
              tool_name: "search_workspace_knowledge",
              tool_use_id: "tool-use-1",
              tool_message_id: "tool-message-1",
            },
          ],
        },
      },
    ]);
  });
});

describe("restartAssistantMessageForRetry", () => {
  test("resets the retried assistant turn to a fresh streaming state and clears citations", () => {
    const now = new Date("2026-03-30T09:00:00.000Z");

    expect(
      restartAssistantMessageForRetry({
        assistantMessageId: "assistant-1",
        citations: [
          {
            id: "citation-1",
            messageId: "assistant-1",
            anchorId: "anchor-1",
            documentId: "document-1",
            label: "旧引用",
            quoteText: "旧摘录",
          },
        ],
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.FAILED,
            contentMarkdown: "Agent 处理失败：queue offline",
            structuredJson: {
              agent_error: "queue offline",
            },
          },
        ],
        now,
      }),
    ).toEqual({
      messages: [
        expect.objectContaining({
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: expect.objectContaining({
            run_id: expect.any(String),
            run_started_at: "2026-03-30T09:00:00.000Z",
            run_last_heartbeat_at: "2026-03-30T09:00:00.000Z",
            run_lease_expires_at: "2026-03-30T09:00:45.000Z",
            phase: "analyzing",
            status_text: "助手正在分析问题并准备回答...",
            stream_event_id: null,
            active_tool_name: null,
            active_tool_use_id: null,
            active_task_id: null,
            process_steps: [],
          }),
        }),
      ],
      citations: [],
    });
  });

  test("uses the server-provided assistant snapshot when retry returns a new run state", () => {
    expect(
      restartAssistantMessageForRetry({
        assistantMessageId: "assistant-1",
        nextAssistantMessage: {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: {
            run_id: "run-2",
            run_started_at: "2026-03-30T09:01:00.000Z",
            run_last_heartbeat_at: "2026-03-30T09:01:00.000Z",
            run_lease_expires_at: "2026-03-30T09:01:45.000Z",
            phase: "analyzing",
            status_text: "助手正在分析问题并准备回答...",
            stream_event_id: null,
            active_tool_name: null,
            active_tool_use_id: null,
            active_task_id: null,
          },
        },
        citations: [],
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.FAILED,
            contentMarkdown: "失败",
            structuredJson: {
              agent_error: "queue offline",
            },
          },
        ],
      }),
    ).toEqual({
      messages: [
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: {
            run_id: "run-2",
            run_started_at: "2026-03-30T09:01:00.000Z",
            run_last_heartbeat_at: "2026-03-30T09:01:00.000Z",
            run_lease_expires_at: "2026-03-30T09:01:45.000Z",
            phase: "analyzing",
            status_text: "助手正在分析问题并准备回答...",
            stream_event_id: null,
            active_tool_name: null,
            active_tool_use_id: null,
            active_task_id: null,
          },
        },
      ],
      citations: [],
    });
  });
});

describe("restartAssistantSessionSnapshotForRetry", () => {
  test("clears the retried assistant timeline while preserving other turns", () => {
    const now = new Date("2026-03-30T09:00:00.000Z");

    expect(
      restartAssistantSessionSnapshotForRetry({
        assistantMessageId: "assistant-1",
        citations: [],
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.FAILED,
            contentMarkdown: "失败",
            structuredJson: {
              agent_error: "queue offline",
            },
          },
        ],
        timelineMessagesByAssistant: {
          "assistant-1": [
            {
              id: "tool-1",
              status: MESSAGE_STATUS.COMPLETED,
              contentMarkdown: "工具执行完成",
              createdAt: "2026-03-30T08:59:00.000Z",
              structuredJson: null,
            },
          ],
          "assistant-2": [
            {
              id: "tool-2",
              status: MESSAGE_STATUS.COMPLETED,
              contentMarkdown: "保留其他轮",
              createdAt: "2026-03-30T08:58:00.000Z",
              structuredJson: null,
            },
          ],
        },
        now,
      }),
    ).toEqual({
      messages: [
        expect.objectContaining({
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: expect.objectContaining({
            run_id: expect.any(String),
            run_started_at: "2026-03-30T09:00:00.000Z",
            run_last_heartbeat_at: "2026-03-30T09:00:00.000Z",
            run_lease_expires_at: "2026-03-30T09:00:45.000Z",
            phase: "analyzing",
            status_text: "助手正在分析问题并准备回答...",
            stream_event_id: null,
            active_tool_name: null,
            active_tool_use_id: null,
            active_task_id: null,
            process_steps: [],
          }),
        }),
      ],
      citations: [],
      timelineMessagesByAssistant: {
        "assistant-2": [
          {
            id: "tool-2",
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "保留其他轮",
            createdAt: "2026-03-30T08:58:00.000Z",
            structuredJson: null,
          },
        ],
      },
    });
  });
});

describe("applyAssistantTerminalEvent", () => {
  test("hydrates the completed assistant message and replaces its citations", () => {
    const result = applyAssistantTerminalEvent({
      messages: [
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "正在生成",
          structuredJson: null,
        },
      ],
      citations: [
        {
          id: "old-citation",
          messageId: "assistant-1",
          anchorId: "a3a2f34f-778d-4a09-8941-6778dcb6b412",
          documentId: "06ec053c-8082-451f-bda3-7cda5863a46e",
          label: "旧引用",
          quoteText: "旧摘录",
        },
      ],
      event: {
        type: CONVERSATION_STREAM_EVENT.ANSWER_DONE,
        conversation_id: "16c8de0a-1b31-41d3-a48b-2d4d8f423886",
        message_id: "assistant-1",
        status: MESSAGE_STATUS.COMPLETED,
        content_markdown: "最终回答",
        structured: null,
        citations: [
          {
            id: "new-citation",
            anchor_id: "89e6420f-c248-4df9-a8e5-d0a19f9a3c59",
            document_id: "4e87ef0d-a2d9-465a-8ddf-3cfc92c30b16",
            label: "新版引用",
            quote_text: "新版摘录",
            source_scope: KNOWLEDGE_SOURCE_SCOPE.GLOBAL_LIBRARY,
            library_title: "平台规范库",
          },
        ],
      },
    });

    expect(result.messages).toEqual([
      expect.objectContaining({
        id: "assistant-1",
        status: MESSAGE_STATUS.COMPLETED,
        contentMarkdown: "最终回答",
        structuredJson: null,
      }),
    ]);
    expect(result.citations).toEqual([
      {
        id: "new-citation",
        messageId: "assistant-1",
        anchorId: "89e6420f-c248-4df9-a8e5-d0a19f9a3c59",
        documentId: "4e87ef0d-a2d9-465a-8ddf-3cfc92c30b16",
        label: "新版引用",
        quoteText: "新版摘录",
        sourceScope: KNOWLEDGE_SOURCE_SCOPE.GLOBAL_LIBRARY,
        libraryTitle: "平台规范库",
        sourceUrl: null,
        sourceDomain: null,
        sourceTitle: null,
      },
    ]);
  });

  test("hydrates the failed assistant message and clears stale citations", () => {
    const result = applyAssistantTerminalEvent({
      messages: [
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "正在生成",
          structuredJson: null,
        },
      ],
      citations: [
        {
          id: "stale-citation",
          messageId: "assistant-1",
          anchorId: "2ef3ea43-971e-42f6-9465-d0d17117d8d1",
          documentId: "3ee35888-e295-462b-a960-e2634c6c447b",
          label: "旧引用",
          quoteText: "旧摘录",
        },
      ],
      event: {
        type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
        conversation_id: "16c8de0a-1b31-41d3-a48b-2d4d8f423886",
        message_id: "assistant-1",
        status: MESSAGE_STATUS.FAILED,
        content_markdown: "Agent 处理失败：queue offline",
        structured: {
          agent_error: "queue offline",
        },
        citations: [],
        error: "queue offline",
      },
    });

    expect(result.messages).toEqual([
      expect.objectContaining({
        id: "assistant-1",
        status: MESSAGE_STATUS.FAILED,
        contentMarkdown: "Agent 处理失败：queue offline",
        structuredJson: {
          agent_error: "queue offline",
        },
      }),
    ]);
    expect(result.citations).toEqual([]);
  });

  test("falls back to the local streaming assistant when run_failed has no message id", () => {
    const result = applyAssistantTerminalEvent({
      messages: [
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.STREAMING,
          contentMarkdown: "",
          structuredJson: {
            run_started_at: "2026-03-30T10:00:00.000Z",
          },
        },
      ],
      citations: [
        {
          id: "stale-citation",
          messageId: "assistant-1",
          anchorId: "2ef3ea43-971e-42f6-9465-d0d17117d8d1",
          documentId: "3ee35888-e295-462b-a960-e2634c6c447b",
          label: "旧引用",
          quoteText: "旧摘录",
        },
      ],
      fallbackMessageId: "assistant-1",
      event: {
        type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
        conversation_id: "16c8de0a-1b31-41d3-a48b-2d4d8f423886",
        message_id: null,
        status: MESSAGE_STATUS.FAILED,
        content_markdown: null,
        structured: null,
        citations: [],
        error: "Assistant message not found.",
      },
    });

    expect(result.messages).toEqual([
      expect.objectContaining({
        id: "assistant-1",
        status: MESSAGE_STATUS.FAILED,
        contentMarkdown: "Agent 处理失败：Assistant message not found.",
        structuredJson: {
          agent_error: "Assistant message not found.",
          run_started_at: "2026-03-30T10:00:00.000Z",
        },
      }),
    ]);
    expect(result.citations).toEqual([]);
  });
});

describe("applyAssistantDeltaEvent", () => {
  test("replaces the message content when the server sends a full snapshot update", () => {
    expect(
      applyAssistantDeltaEvent({
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.STREAMING,
            contentMarkdown: "前面已经流出来的部分",
            structuredJson: {
              run_id: "run-1",
              run_started_at: "2026-03-31T10:00:00.000Z",
              run_last_heartbeat_at: "2026-03-31T10:00:10.000Z",
              run_lease_expires_at: "2026-03-31T10:00:55.000Z",
            },
          },
        ],
        event: {
          type: CONVERSATION_STREAM_EVENT.ANSWER_DELTA,
          conversation_id: "conversation-1",
          message_id: "assistant-1",
          status: MESSAGE_STATUS.STREAMING,
          content_markdown: "基于当前已验证证据的完整回答",
          delta_text: null,
        },
      }),
    ).toEqual([
      {
        id: "assistant-1",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.STREAMING,
        contentMarkdown: "基于当前已验证证据的完整回答",
        structuredJson: {
          run_id: "run-1",
          run_started_at: "2026-03-31T10:00:00.000Z",
          run_last_heartbeat_at: "2026-03-31T10:00:10.000Z",
          run_lease_expires_at: "2026-03-31T10:00:55.000Z",
          process_steps: [],
        },
      },
    ]);
  });

  test("appends incremental deltas to the existing streamed content", () => {
    expect(
      applyAssistantDeltaEvent({
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.STREAMING,
            contentMarkdown: "第一段",
            structuredJson: {
              run_id: "run-1",
              run_started_at: "2026-03-31T10:00:00.000Z",
              run_last_heartbeat_at: "2026-03-31T10:00:10.000Z",
              run_lease_expires_at: "2026-03-31T10:00:55.000Z",
            },
          },
        ],
        event: {
          type: CONVERSATION_STREAM_EVENT.ANSWER_DELTA,
          conversation_id: "conversation-1",
          message_id: "assistant-1",
          status: MESSAGE_STATUS.STREAMING,
          content_markdown: "",
          delta_text: "第二段",
        },
      }),
    ).toEqual([
      {
        id: "assistant-1",
        role: MESSAGE_ROLE.ASSISTANT,
        status: MESSAGE_STATUS.STREAMING,
        contentMarkdown: "第一段第二段",
        structuredJson: {
          run_id: "run-1",
          run_started_at: "2026-03-31T10:00:00.000Z",
          run_last_heartbeat_at: "2026-03-31T10:00:10.000Z",
          run_lease_expires_at: "2026-03-31T10:00:55.000Z",
          process_steps: [],
        },
      },
    ]);
  });
});

describe("applyAssistantTerminalEventToSessionSnapshot", () => {
  test("keeps the settled turn timeline when producing a parent sync snapshot", () => {
    expect(
      applyAssistantTerminalEventToSessionSnapshot({
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.STREAMING,
            contentMarkdown: "",
            structuredJson: null,
          },
        ],
        citations: [],
        timelineMessagesByAssistant: {
          "assistant-1": [
            {
              id: "tool-1",
              status: MESSAGE_STATUS.COMPLETED,
              contentMarkdown: "工具执行完成：fetch_source",
              createdAt: "2026-03-30T10:00:02.000Z",
              structuredJson: null,
            },
          ],
        },
        event: {
          type: CONVERSATION_STREAM_EVENT.ANSWER_DONE,
          conversation_id: "conversation-1",
          message_id: "assistant-1",
          status: MESSAGE_STATUS.COMPLETED,
          content_markdown: "最终回答",
          structured: null,
          citations: [
            {
              id: "citation-1",
              anchor_id: "anchor-1",
              document_id: "document-1",
              label: "资料一",
              quote_text: "摘录一",
              source_scope: null,
              library_title: null,
              source_url: null,
              source_domain: null,
              source_title: null,
            },
          ],
        },
      }),
    ).toEqual({
      messages: [
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "最终回答",
          structuredJson: null,
        },
      ],
      citations: [
        {
          id: "citation-1",
          messageId: "assistant-1",
          anchorId: "anchor-1",
          documentId: "document-1",
          label: "资料一",
          quoteText: "摘录一",
          sourceScope: null,
          libraryTitle: null,
          sourceUrl: null,
          sourceDomain: null,
          sourceTitle: null,
        },
      ],
      timelineMessagesByAssistant: {
        "assistant-1": [
          {
            id: "tool-1",
            status: MESSAGE_STATUS.COMPLETED,
            contentMarkdown: "工具执行完成：fetch_source",
            createdAt: "2026-03-30T10:00:02.000Z",
            structuredJson: null,
          },
        ],
      },
    });
  });

  test("keeps external web citations in session snapshots", () => {
    expect(
      applyAssistantTerminalEvent({
        messages: [
          {
            id: "assistant-1",
            role: MESSAGE_ROLE.ASSISTANT,
            status: MESSAGE_STATUS.STREAMING,
            contentMarkdown: "",
            structuredJson: null,
          },
        ],
        citations: [],
        event: {
          type: CONVERSATION_STREAM_EVENT.ANSWER_DONE,
          conversation_id: "conversation-1",
          message_id: "assistant-1",
          status: MESSAGE_STATUS.COMPLETED,
          content_markdown: "最终回答",
          structured: null,
          citations: [
            {
              id: "citation-web-1",
              anchor_id: null,
              document_id: null,
              label: "最新局势说明 · example.com",
              quote_text: "该文称最新变化出现在上周末。",
              source_scope: KNOWLEDGE_SOURCE_SCOPE.WEB,
              library_title: null,
              source_url: "https://example.com/post",
              source_domain: "example.com",
              source_title: "最新局势说明",
            },
          ],
        },
      }),
    ).toEqual({
      messages: [
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "最终回答",
          structuredJson: null,
        },
      ],
      citations: [
        {
          id: "citation-web-1",
          messageId: "assistant-1",
          anchorId: null,
          documentId: null,
          label: "最新局势说明 · example.com",
          quoteText: "该文称最新变化出现在上周末。",
          sourceScope: KNOWLEDGE_SOURCE_SCOPE.WEB,
          libraryTitle: null,
          sourceUrl: "https://example.com/post",
          sourceDomain: "example.com",
          sourceTitle: "最新局势说明",
        },
      ],
    });
  });
});
