// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { MESSAGE_ROLE, MESSAGE_STATUS } from "@anchordesk/contracts";

import { ConversationSession } from "./conversation-session";

describe("ConversationSession", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test("opens knowledge-base source cards in a new tab and renders markdown excerpts compactly", () => {
    act(() => {
      root.render(
        createElement(ConversationSession, {
          conversationId: "conversation-1",
          workspaceId: "workspace-1",
          assistantMessageId: "assistant-1",
          assistantStatus: MESSAGE_STATUS.COMPLETED,
          streamEnabled: false,
          initialMessages: [
            {
              id: "assistant-1",
              role: MESSAGE_ROLE.ASSISTANT,
              status: MESSAGE_STATUS.COMPLETED,
              contentMarkdown: "这是回答[^1]",
              structuredJson: null,
            },
          ],
          initialCitations: [
            {
              id: "citation-1",
              messageId: "assistant-1",
              label: "资料库/项目A/部署清单.md · 第2节",
              quoteText:
                "## 发布前检查\n- 回归验证完成\n- 灰度环境通过\n[部署手册](https://example.com/runbook)",
              sourceScope: "workspace_private",
              documentId: "document-1",
              anchorId: "anchor-9",
            },
          ],
        }),
      );
    });

    const sourcesButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("参考资料"),
    );

    expect(sourcesButton).toBeTruthy();

    act(() => {
      sourcesButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const link = container.querySelector(
      'a[href="/workspaces/workspace-1/documents/document-1?anchorId=anchor-9"]',
    );
    const excerpt = container.querySelector(".citation-preview-markdown");

    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(excerpt?.querySelectorAll("ul li")).toHaveLength(2);
    expect(excerpt?.textContent).toContain("部署手册");
  });

  test("renders streamed thinking before the final answer starts", () => {
    act(() => {
      root.render(
        createElement(ConversationSession, {
          conversationId: "conversation-1",
          workspaceId: "workspace-1",
          assistantMessageId: "assistant-1",
          assistantStatus: MESSAGE_STATUS.STREAMING,
          streamEnabled: false,
          initialMessages: [
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
                thinking_text: "先确认 Cloud Agent SDK 的流事件类型，再决定怎么展示",
              },
            },
          ],
        }),
      );
    });

    const thinkingDisclosure = container.querySelector(
      'details[data-thinking-panel="assistant-1"]',
    ) as HTMLDetailsElement | null;

    expect(thinkingDisclosure?.open).toBe(true);
    expect(container.textContent).toContain("思考");
    expect(container.textContent).toContain(
      "先确认 Cloud Agent SDK 的流事件类型，再决定怎么展示",
    );
  });

  test("collapses the thinking disclosure after answer drafting starts", () => {
    act(() => {
      root.render(
        createElement(ConversationSession, {
          conversationId: "conversation-1",
          workspaceId: "workspace-1",
          assistantMessageId: "assistant-1",
          assistantStatus: MESSAGE_STATUS.STREAMING,
          streamEnabled: false,
          initialMessages: [
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
                thinking_text: "先查来源，再整理结论",
              },
            },
          ],
        }),
      );
    });

    const thinkingDisclosure = container.querySelector(
      'details[data-thinking-panel="assistant-1"]',
    ) as HTMLDetailsElement | null;

    expect(thinkingDisclosure?.open).toBe(true);

    act(() => {
      root.render(
        createElement(ConversationSession, {
          conversationId: "conversation-1",
          workspaceId: "workspace-1",
          assistantMessageId: "assistant-1",
          assistantStatus: MESSAGE_STATUS.STREAMING,
          streamEnabled: false,
          initialMessages: [
            {
              id: "assistant-1",
              role: MESSAGE_ROLE.ASSISTANT,
              status: MESSAGE_STATUS.STREAMING,
              contentMarkdown: "第一段回答",
              structuredJson: {
                run_id: "run-1",
                run_started_at: "2026-04-02T10:00:00.000Z",
                run_last_heartbeat_at: "2026-04-02T10:00:01.000Z",
                run_lease_expires_at: "2026-04-02T10:00:46.000Z",
                phase: "drafting",
                status_text: "助手正在生成回答...",
                thinking_text: "先查来源，再整理结论",
              },
            },
          ],
        }),
      );
    });

    expect(thinkingDisclosure?.open).toBe(false);
    expect(container.textContent).toContain("已完成");
  });

  test("allows manually collapsing the thinking disclosure", () => {
    act(() => {
      root.render(
        createElement(ConversationSession, {
          conversationId: "conversation-1",
          workspaceId: "workspace-1",
          assistantMessageId: "assistant-1",
          assistantStatus: MESSAGE_STATUS.STREAMING,
          streamEnabled: false,
          initialMessages: [
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
                thinking_text: "先查来源，再整理结论",
              },
            },
          ],
        }),
      );
    });

    const thinkingDisclosure = container.querySelector(
      'details[data-thinking-panel="assistant-1"]',
    ) as HTMLDetailsElement | null;

    expect(thinkingDisclosure?.open).toBe(true);

    act(() => {
      if (thinkingDisclosure) {
        thinkingDisclosure.open = false;
        thinkingDisclosure.dispatchEvent(new Event("toggle", { bubbles: true }));
      }
    });

    expect(thinkingDisclosure?.open).toBe(false);
  });

  test("renders submitted attachments beside the user message in a new tab", () => {
    act(() => {
      root.render(
        createElement(ConversationSession, {
          conversationId: "conversation-1",
          workspaceId: "workspace-1",
          streamEnabled: false,
          initialMessages: [
            {
              id: "user-1",
              role: MESSAGE_ROLE.USER,
              status: MESSAGE_STATUS.COMPLETED,
              contentMarkdown: "先看这份合同",
              structuredJson: {
                submitted_attachments: [
                  {
                    attachmentId: "attachment-1",
                    documentId: "document-1",
                    sourceFilename: "合同审阅稿.docx",
                  },
                ],
              },
            },
          ],
        }),
      );
    });

    const link = container.querySelector(
      'a[href="/workspaces/workspace-1/documents/document-1"]',
    );

    expect(link?.textContent).toContain("合同审阅稿.docx");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(container.textContent).toContain("先看这份合同");
  });
});
