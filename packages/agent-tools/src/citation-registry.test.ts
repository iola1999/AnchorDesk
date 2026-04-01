import { describe, expect, it } from "vitest";

import {
  ASSISTANT_TOOL,
  buildRawInlineCitationToken,
} from "@anchordesk/contracts";

import {
  attachCitationMetadataToToolOutput,
  createAssistantCitationRegistry,
} from "./citation-registry";

describe("createAssistantCitationRegistry", () => {
  it("reuses the same numeric citation id for the same anchor across tool outputs", () => {
    const registry = createAssistantCitationRegistry();

    expect(registry.registerDocumentAnchor("anchor-1")).toEqual({
      citationId: 1,
      citationToken: buildRawInlineCitationToken(1),
      evidenceId: "anchor:anchor-1",
    });
    expect(registry.registerDocumentAnchor("anchor-1")).toEqual({
      citationId: 1,
      citationToken: buildRawInlineCitationToken(1),
      evidenceId: "anchor:anchor-1",
    });
    expect(registry.registerWebPage("https://example.com/post")).toEqual({
      citationId: 2,
      citationToken: buildRawInlineCitationToken(2),
      evidenceId: "web:https://example.com/post",
    });
  });
});

describe("attachCitationMetadataToToolOutput", () => {
  it("injects citation fields into retrievable document results and fetched sources", () => {
    const registry = createAssistantCitationRegistry();

    expect(
      attachCitationMetadataToToolOutput({
        registry,
        toolName: ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE,
        output: {
          ok: true,
          results: [
            {
              anchor_id: "anchor-1",
              snippet: "片段一",
            },
            {
              anchor_id: "anchor-2",
              snippet: "片段二",
            },
          ],
        },
      }),
    ).toEqual({
      ok: true,
      results: [
        {
          anchor_id: "anchor-1",
          snippet: "片段一",
          citation_id: 1,
          citation_token: "[[cite:1]]",
        },
        {
          anchor_id: "anchor-2",
          snippet: "片段二",
          citation_id: 2,
          citation_token: "[[cite:2]]",
        },
      ],
    });

    expect(
      attachCitationMetadataToToolOutput({
        registry,
        toolName: ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE,
        output: {
          ok: true,
          document: {
            document_id: "doc-1",
            pages: [
              {
                anchor_id: "anchor-3",
                page_no: 1,
                text: "第一页",
              },
            ],
          },
        },
      }),
    ).toEqual({
      ok: true,
      document: {
        document_id: "doc-1",
        pages: [
          {
            anchor_id: "anchor-3",
            page_no: 1,
            text: "第一页",
            citation_id: 3,
            citation_token: "[[cite:3]]",
          },
        ],
      },
    });

    expect(
      attachCitationMetadataToToolOutput({
        registry,
        toolName: ASSISTANT_TOOL.FETCH_SOURCE,
        output: {
          ok: true,
          source: {
            url: "https://example.com/post",
            title: "Example",
            paragraphs: ["正文"],
          },
        },
      }),
    ).toEqual({
      ok: true,
      source: {
        url: "https://example.com/post",
        title: "Example",
        paragraphs: ["正文"],
        citation_id: 4,
        citation_token: "[[cite:4]]",
      },
    });
  });
});
