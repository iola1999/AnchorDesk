import { describe, expect, test } from "vitest";
import { CONVERSATION_STATUS } from "@knowledge-assistant/contracts";

import {
  chooseWorkspaceConversation,
  groupWorkspaceConversations,
  normalizeConversationTitle,
} from "./conversations";

describe("conversation helpers", () => {
  test("normalizes conversation titles and falls back when empty", () => {
    expect(normalizeConversationTitle("  发布方案讨论  ", "默认会话")).toBe(
      "发布方案讨论",
    );
    expect(normalizeConversationTitle("   ", "默认会话")).toBe("默认会话");
  });

  test("chooses the requested conversation when it exists", () => {
    const selected = chooseWorkspaceConversation(
      [
        {
          id: "active-2",
          title: "第二个会话",
          status: CONVERSATION_STATUS.ACTIVE,
          updatedAt: new Date("2026-03-28T10:00:00Z"),
        },
        {
          id: "archived-1",
          title: "已归档会话",
          status: CONVERSATION_STATUS.ARCHIVED,
          updatedAt: new Date("2026-03-28T11:00:00Z"),
        },
      ],
      "archived-1",
    );

    expect(selected?.id).toBe("archived-1");
  });

  test("returns null when no conversation is explicitly requested", () => {
    const selected = chooseWorkspaceConversation([
      {
        id: "active-older",
        title: "较早",
        status: CONVERSATION_STATUS.ACTIVE,
        updatedAt: new Date("2026-03-28T09:00:00Z"),
      },
      {
        id: "archived-newer",
        title: "已归档",
        status: CONVERSATION_STATUS.ARCHIVED,
        updatedAt: new Date("2026-03-28T12:00:00Z"),
      },
      {
        id: "active-newer",
        title: "较新",
        status: CONVERSATION_STATUS.ACTIVE,
        updatedAt: new Date("2026-03-28T11:00:00Z"),
      },
    ]);

    expect(selected).toBeNull();
  });

  test("returns null when the requested conversation does not exist", () => {
    const selected = chooseWorkspaceConversation(
      [
        {
          id: "active-older",
          title: "较早",
          status: CONVERSATION_STATUS.ACTIVE,
          updatedAt: new Date("2026-03-28T09:00:00Z"),
        },
      ],
      "missing",
    );

    expect(selected).toBeNull();
  });

  test("groups conversations by status while preserving recent-first order", () => {
    const grouped = groupWorkspaceConversations([
      {
        id: "active-1",
        title: "活跃一",
        status: CONVERSATION_STATUS.ACTIVE,
        updatedAt: new Date("2026-03-28T11:00:00Z"),
      },
      {
        id: "archived-1",
        title: "归档一",
        status: CONVERSATION_STATUS.ARCHIVED,
        updatedAt: new Date("2026-03-28T12:00:00Z"),
      },
      {
        id: "active-2",
        title: "活跃二",
        status: CONVERSATION_STATUS.ACTIVE,
        updatedAt: new Date("2026-03-28T10:00:00Z"),
      },
    ]);

    expect(grouped.active.map((item) => item.id)).toEqual(["active-1", "active-2"]);
    expect(grouped.archived.map((item) => item.id)).toEqual(["archived-1"]);
  });
});
