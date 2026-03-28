import { describe, expect, test } from "vitest";
import { GROUNDED_ANSWER_CONFIDENCE } from "@knowledge-assistant/contracts";

import {
  describeGroundedAnswerConfidence,
  readGroundedAnswerStatus,
} from "./grounded-answer-status";

describe("readGroundedAnswerStatus", () => {
  test("normalizes grounded answer metadata", () => {
    expect(
      readGroundedAnswerStatus({
        confidence: GROUNDED_ANSWER_CONFIDENCE.MEDIUM,
        unsupported_reason: "当前资料不足以支持直接结论。",
        missing_information: ["补充上线记录", "补充上线记录", "补充回滚预案"],
      }),
    ).toEqual({
      confidence: GROUNDED_ANSWER_CONFIDENCE.MEDIUM,
      unsupportedReason: "当前资料不足以支持直接结论。",
      missingInformation: ["补充上线记录", "补充回滚预案"],
    });
  });

  test("falls back safely when metadata is missing or malformed", () => {
    expect(
      readGroundedAnswerStatus({
        confidence: "unknown",
        unsupported_reason: "   ",
        missing_information: [123, null],
      }),
    ).toEqual({
      confidence: null,
      unsupportedReason: null,
      missingInformation: [],
    });
  });
});

describe("describeGroundedAnswerConfidence", () => {
  test("prefers unsupported state over confidence labels", () => {
    expect(
      describeGroundedAnswerConfidence({
        confidence: GROUNDED_ANSWER_CONFIDENCE.HIGH,
        unsupportedReason: "当前资料不足。",
        missingInformation: [],
      }),
    ).toBe("依据不足");
  });

  test("maps supported confidence to localized labels", () => {
    expect(
      describeGroundedAnswerConfidence({
        confidence: GROUNDED_ANSWER_CONFIDENCE.HIGH,
        unsupportedReason: null,
        missingInformation: [],
      }),
    ).toBe("高置信");
    expect(
      describeGroundedAnswerConfidence({
        confidence: GROUNDED_ANSWER_CONFIDENCE.MEDIUM,
        unsupportedReason: null,
        missingInformation: [],
      }),
    ).toBe("中置信");
    expect(
      describeGroundedAnswerConfidence({
        confidence: GROUNDED_ANSWER_CONFIDENCE.LOW,
        unsupportedReason: null,
        missingInformation: [],
      }),
    ).toBe("低置信");
  });
});
