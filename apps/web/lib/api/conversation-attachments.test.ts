import { describe, expect, test } from "vitest";

import {
  COMPOSER_ATTACHMENT_STATUS,
  buildDraftAttachmentExpiryDate,
  buildTemporaryAttachmentDirectory,
  buildTemporaryAttachmentLogicalPath,
  canSubmitWithAttachments,
  hasReadyAttachments,
  resolveSubmittedAttachmentIds,
  resolveComposerAttachmentStatus,
} from "./conversation-attachments";

describe("conversation attachment helpers", () => {
  test("builds scoped temporary directories for draft uploads and live conversations", () => {
    expect(
      buildTemporaryAttachmentDirectory({
        draftUploadId: "draft_1234567890",
        attachmentKey: "upload_abcdef",
      }),
    ).toBe("资料库/临时目录/草稿-draft_12/附件-upload_a");

    expect(
      buildTemporaryAttachmentDirectory({
        conversationId: "conversation-abcdef123456",
        attachmentKey: "file-001",
      }),
    ).toBe("资料库/临时目录/会话-conversa/附件-file-001");
  });

  test("builds logical paths and draft expiry timestamps", () => {
    expect(
      buildTemporaryAttachmentLogicalPath({
        directoryPath: "资料库/临时目录/草稿-a1b2",
        sourceFilename: "发布清单.md",
      }),
    ).toBe("资料库/临时目录/草稿-a1b2/发布清单.md");

    expect(
      buildDraftAttachmentExpiryDate(new Date("2026-03-29T00:00:00.000Z")).toISOString(),
    ).toBe("2026-03-30T00:00:00.000Z");
  });

  test("allows sending once every attachment is either ready or failed", () => {
    expect(
      canSubmitWithAttachments([
        COMPOSER_ATTACHMENT_STATUS.READY,
        COMPOSER_ATTACHMENT_STATUS.FAILED,
      ]),
    ).toBe(true);
    expect(
      canSubmitWithAttachments([
        COMPOSER_ATTACHMENT_STATUS.PARSING,
        COMPOSER_ATTACHMENT_STATUS.READY,
      ]),
    ).toBe(false);
    expect(
      hasReadyAttachments([
        COMPOSER_ATTACHMENT_STATUS.FAILED,
        COMPOSER_ATTACHMENT_STATUS.READY,
      ]),
    ).toBe(true);
    expect(hasReadyAttachments([COMPOSER_ATTACHMENT_STATUS.FAILED])).toBe(false);
    expect(resolveComposerAttachmentStatus({ jobStatus: "completed" })).toBe(
      COMPOSER_ATTACHMENT_STATUS.READY,
    );
    expect(resolveComposerAttachmentStatus({ parseStage: "failed" })).toBe(
      COMPOSER_ATTACHMENT_STATUS.FAILED,
    );
    expect(resolveComposerAttachmentStatus({ jobStatus: "running" })).toBe(
      COMPOSER_ATTACHMENT_STATUS.PARSING,
    );
  });

  test("only includes ready attachments in the submitted attachment list", () => {
    expect(
      resolveSubmittedAttachmentIds([
        {
          id: "attachment-1",
          status: COMPOSER_ATTACHMENT_STATUS.READY,
        },
        {
          id: "local-2",
          attachmentId: "attachment-2",
          status: COMPOSER_ATTACHMENT_STATUS.READY,
        },
        {
          id: "attachment-2",
          status: COMPOSER_ATTACHMENT_STATUS.READY,
        },
        {
          id: "attachment-3",
          status: COMPOSER_ATTACHMENT_STATUS.FAILED,
        },
      ]),
    ).toEqual(["attachment-1", "attachment-2"]);
  });
});
