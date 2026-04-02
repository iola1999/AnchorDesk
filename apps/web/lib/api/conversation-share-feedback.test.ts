import { describe, expect, test } from "vitest";

import {
  buildCopyShareNotice,
  buildDisableShareNotice,
  SHARE_FEEDBACK_BRIEF_MS,
} from "./conversation-share-feedback";

describe("conversation share feedback helpers", () => {
  test("returns light copy feedback for manual link copy actions", () => {
    expect(SHARE_FEEDBACK_BRIEF_MS).toBe(1600);

    expect(buildCopyShareNotice(true)).toEqual({
      tone: "success",
      message: "分享链接已复制",
      duration: SHARE_FEEDBACK_BRIEF_MS,
    });

    expect(buildCopyShareNotice(false)).toEqual({
      tone: "error",
      message: "复制链接失败",
    });
  });

  test("returns a short-lived success feedback after disabling share", () => {
    expect(buildDisableShareNotice()).toEqual({
      tone: "success",
      message: "分享已关闭",
      duration: SHARE_FEEDBACK_BRIEF_MS,
    });
  });
});
