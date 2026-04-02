export const SHARE_FEEDBACK_BRIEF_MS = 1600;

export type ShareFeedback = {
  tone: "success" | "error";
  message: string;
  duration?: number;
};

function buildBriefSuccessFeedback(message: string): ShareFeedback {
  return {
    tone: "success",
    message,
    duration: SHARE_FEEDBACK_BRIEF_MS,
  };
}

export function buildCopyShareNotice(copySucceeded: boolean): ShareFeedback {
  if (copySucceeded) {
    return buildBriefSuccessFeedback("分享链接已复制");
  }

  return {
    tone: "error",
    message: "复制链接失败",
  };
}

export function buildDisableShareNotice(): ShareFeedback {
  return buildBriefSuccessFeedback("分享已关闭");
}
