import { describe, expect, test } from "vitest";

import {
  isWorkspaceDocumentFailed,
  isWorkspaceDocumentProcessing,
  isWorkspaceDocumentReady,
  summarizeWorkspaceOverview,
} from "./workspace-overview";

describe("workspace overview document state", () => {
  test("treats queued or running jobs as processing", () => {
    expect(
      isWorkspaceDocumentProcessing({
        status: "ready",
        latestVersion: {
          parseStatus: "ready",
        },
        latestJob: {
          status: "running",
        },
      }),
    ).toBe(true);
  });

  test("treats failed job or parse status as failed instead of ready", () => {
    const document = {
      status: "ready",
      latestVersion: {
        parseStatus: "failed",
      },
      latestJob: null,
    };

    expect(isWorkspaceDocumentFailed(document)).toBe(true);
    expect(isWorkspaceDocumentReady(document)).toBe(false);
  });

  test("treats ready version with no active job as ready", () => {
    const document = {
      status: "ready",
      latestVersion: {
        parseStatus: "ready",
      },
      latestJob: null,
    };

    expect(isWorkspaceDocumentProcessing(document)).toBe(false);
    expect(isWorkspaceDocumentFailed(document)).toBe(false);
    expect(isWorkspaceDocumentReady(document)).toBe(true);
  });
});

describe("summarizeWorkspaceOverview", () => {
  test("counts document, conversation, and report buckets for the workspace shell", () => {
    expect(
      summarizeWorkspaceOverview({
        documents: [
          {
            status: "ready",
            latestVersion: {
              parseStatus: "ready",
            },
            latestJob: null,
          },
          {
            status: "processing",
            latestVersion: {
              parseStatus: "embedding",
            },
            latestJob: {
              status: "running",
            },
          },
          {
            status: "failed",
            latestVersion: {
              parseStatus: "failed",
            },
            latestJob: {
              status: "failed",
            },
          },
        ],
        conversations: [
          { status: "active" },
          { status: "archived" },
        ],
        reportsCount: 4,
      }),
    ).toEqual({
      totalDocuments: 3,
      readyDocuments: 1,
      processingDocuments: 1,
      failedDocuments: 1,
      activeConversations: 1,
      archivedConversations: 1,
      reportsCount: 4,
      hasKnowledgeReady: true,
      hasPendingWork: true,
    });
  });
});
