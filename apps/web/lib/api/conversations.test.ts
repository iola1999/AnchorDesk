import { describe, expect, test } from "vitest";

import {
  chooseWorkspaceConversation,
  groupWorkspaceConversations,
  normalizeConversationTitle,
} from "./conversations";

describe("conversation helpers", () => {
  test("normalizes conversation titles and falls back when empty", () => {
    expect(normalizeConversationTitle("  合同审查讨论  ", "默认会话")).toBe(
      "合同审查讨论",
    );
    expect(normalizeConversationTitle("   ", "默认会话")).toBe("默认会话");
  });

  test("chooses the requested conversation when it exists", () => {
    const selected = chooseWorkspaceConversation(
      [
        {
          id: "active-2",
          title: "第二个会话",
          status: "active",
          updatedAt: new Date("2026-03-28T10:00:00Z"),
        },
        {
          id: "archived-1",
          title: "已归档会话",
          status: "archived",
          updatedAt: new Date("2026-03-28T11:00:00Z"),
        },
      ],
      "archived-1",
    );

    expect(selected?.id).toBe("archived-1");
  });

  test("falls back to the most recently updated active conversation", () => {
    const selected = chooseWorkspaceConversation([
      {
        id: "active-older",
        title: "较早",
        status: "active",
        updatedAt: new Date("2026-03-28T09:00:00Z"),
      },
      {
        id: "archived-newer",
        title: "已归档",
        status: "archived",
        updatedAt: new Date("2026-03-28T12:00:00Z"),
      },
      {
        id: "active-newer",
        title: "较新",
        status: "active",
        updatedAt: new Date("2026-03-28T11:00:00Z"),
      },
    ]);

    expect(selected?.id).toBe("active-newer");
  });

  test("groups conversations by status while preserving recent-first order", () => {
    const grouped = groupWorkspaceConversations([
      {
        id: "active-1",
        title: "活跃一",
        status: "active",
        updatedAt: new Date("2026-03-28T11:00:00Z"),
      },
      {
        id: "archived-1",
        title: "归档一",
        status: "archived",
        updatedAt: new Date("2026-03-28T12:00:00Z"),
      },
      {
        id: "active-2",
        title: "活跃二",
        status: "active",
        updatedAt: new Date("2026-03-28T10:00:00Z"),
      },
    ]);

    expect(grouped.active.map((item) => item.id)).toEqual(["active-1", "active-2"]);
    expect(grouped.archived.map((item) => item.id)).toEqual(["archived-1"]);
  });
});
