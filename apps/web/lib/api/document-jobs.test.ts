import { describe, expect, test } from "vitest";

import {
  canRetryDocumentJob,
  describeDocumentJobFailure,
} from "./document-jobs";

describe("document job helpers", () => {
  test("marks failed jobs as retryable", () => {
    expect(canRetryDocumentJob({ status: "failed" })).toBe(true);
    expect(canRetryDocumentJob({ status: "running" })).toBe(false);
  });

  test("describes failure with stage, code, and message", () => {
    expect(
      describeDocumentJobFailure({
        stage: "parsing_layout",
        errorCode: "ocr_disabled",
        errorMessage: "OCR provider is disabled.",
      }),
    ).toBe("失败阶段：parsing_layout · ocr_disabled · OCR provider is disabled.");
  });
});
