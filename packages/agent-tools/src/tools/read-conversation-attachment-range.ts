import { and, asc, eq, gte, lte } from "drizzle-orm";

import {
  MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES,
  readConversationAttachmentRangeInputSchema,
} from "@anchordesk/contracts";
import {
  citationAnchors,
  conversationAttachments,
  documentBlocks,
  documentChunks,
  documentPages,
  documents,
  getDb,
} from "@anchordesk/db";

import { buildToolFailure } from "../tool-output";

export { MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES };

type AttachmentRangeBlock = {
  pageNo: number;
  orderIndex: number;
  text: string;
};

type AttachmentRangeAnchor = {
  anchorId: string;
  anchorLabel: string;
  pageStart: number;
  pageEnd: number;
};

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function pickCoveringAnchor(
  pageNo: number,
  anchors: AttachmentRangeAnchor[],
) {
  return anchors
    .filter((anchor) => anchor.pageStart <= pageNo && anchor.pageEnd >= pageNo)
    .sort((left, right) => {
      const leftSpan = left.pageEnd - left.pageStart;
      const rightSpan = right.pageEnd - right.pageStart;
      if (leftSpan !== rightSpan) {
        return leftSpan - rightSpan;
      }

      return left.pageStart - right.pageStart;
    })[0] ?? null;
}

export function buildReadConversationAttachmentRangeResult(input: {
  documentId: string;
  documentTitle: string;
  documentPath: string;
  requestedPageStart: number;
  requestedPageEnd: number;
  totalPages: number;
  blocks: AttachmentRangeBlock[];
  anchors: AttachmentRangeAnchor[];
}) {
  const loadedPageStart = input.requestedPageStart;
  const loadedPageEnd = Math.min(
    input.requestedPageEnd,
    input.requestedPageStart + MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES - 1,
    input.totalPages,
  );

  const blocksByPage = new Map<number, string[]>();
  for (const block of [...input.blocks].sort((left, right) => {
    if (left.pageNo !== right.pageNo) {
      return left.pageNo - right.pageNo;
    }

    return left.orderIndex - right.orderIndex;
  })) {
    const normalizedText = normalizeText(block.text);
    if (!normalizedText) {
      continue;
    }

    const current = blocksByPage.get(block.pageNo) ?? [];
    current.push(normalizedText);
    blocksByPage.set(block.pageNo, current);
  }

  const pages = Array.from(blocksByPage.entries())
    .filter(([pageNo]) => pageNo >= loadedPageStart && pageNo <= loadedPageEnd)
    .sort((left, right) => left[0] - right[0])
    .map(([pageNo, paragraphs]) => {
      const anchor = pickCoveringAnchor(pageNo, input.anchors);
      if (!anchor) {
        return null;
      }

      return {
        anchor_id: anchor.anchorId,
        anchor_label: anchor.anchorLabel,
        page_no: pageNo,
        text: paragraphs.join("\n\n"),
      };
    })
    .filter((page): page is NonNullable<typeof page> => page !== null);

  if (pages.length === 0) {
    return buildToolFailure(
      "ATTACHMENT_RANGE_EMPTY",
      "No readable attachment text was found in the requested page range.",
      false,
    );
  }

  return {
    ok: true,
    document: {
      document_id: input.documentId,
      document_title: input.documentTitle,
      document_path: input.documentPath,
      requested_page_start: input.requestedPageStart,
      requested_page_end: input.requestedPageEnd,
      loaded_page_start: pages[0]?.page_no ?? loadedPageStart,
      loaded_page_end: pages.at(-1)?.page_no ?? loadedPageEnd,
      total_pages: input.totalPages,
      truncated: loadedPageEnd < input.requestedPageEnd,
      max_page_window: MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES,
      pages,
    },
  };
}

export async function readConversationAttachmentRangeHandler(input: unknown) {
  const args = readConversationAttachmentRangeInputSchema.parse(input);
  const db = getDb();

  try {
    const [attachment] = await db
      .select({
        documentId: documents.id,
        documentVersionId: conversationAttachments.documentVersionId,
        documentTitle: documents.title,
        documentPath: documents.logicalPath,
      })
      .from(conversationAttachments)
      .innerJoin(documents, eq(documents.id, conversationAttachments.documentId))
      .where(
        and(
          eq(conversationAttachments.conversationId, args.conversation_id),
          eq(conversationAttachments.documentId, args.document_id),
        ),
      )
      .limit(1);

    if (!attachment) {
      return buildToolFailure(
        "ATTACHMENT_NOT_FOUND",
        "Conversation attachment not found for the requested document.",
        false,
      );
    }

    const effectivePageEnd = Math.min(
      args.page_end,
      args.page_start + MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES - 1,
    );

    const [pageRows, blockRows, anchorRows] = await Promise.all([
      db
        .select({
          pageNo: documentPages.pageNo,
        })
        .from(documentPages)
        .where(eq(documentPages.documentVersionId, attachment.documentVersionId))
        .orderBy(asc(documentPages.pageNo)),
      db
        .select({
          pageNo: documentBlocks.pageNo,
          orderIndex: documentBlocks.orderIndex,
          text: documentBlocks.text,
        })
        .from(documentBlocks)
        .where(
          and(
            eq(documentBlocks.documentVersionId, attachment.documentVersionId),
            gte(documentBlocks.pageNo, args.page_start),
            lte(documentBlocks.pageNo, effectivePageEnd),
          ),
        )
        .orderBy(asc(documentBlocks.pageNo), asc(documentBlocks.orderIndex)),
      db
        .select({
          anchorId: citationAnchors.id,
          anchorLabel: citationAnchors.anchorLabel,
          pageStart: documentChunks.pageStart,
          pageEnd: documentChunks.pageEnd,
        })
        .from(documentChunks)
        .innerJoin(citationAnchors, eq(citationAnchors.chunkId, documentChunks.id))
        .where(
          and(
            eq(documentChunks.documentVersionId, attachment.documentVersionId),
            lte(documentChunks.pageStart, effectivePageEnd),
            gte(documentChunks.pageEnd, args.page_start),
          ),
        )
        .orderBy(asc(documentChunks.pageStart), asc(documentChunks.pageEnd)),
    ]);

    const totalPages = new Set(pageRows.map((row) => row.pageNo)).size;
    if (totalPages === 0) {
      return buildToolFailure(
        "ATTACHMENT_TEXT_UNAVAILABLE",
        "No parsed attachment text is available for this document.",
        false,
      );
    }

    return buildReadConversationAttachmentRangeResult({
      documentId: attachment.documentId,
      documentTitle: attachment.documentTitle,
      documentPath: attachment.documentPath,
      requestedPageStart: args.page_start,
      requestedPageEnd: args.page_end,
      totalPages,
      blocks: blockRows,
      anchors: anchorRows,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Conversation attachment range read failed";
    return buildToolFailure("CONVERSATION_ATTACHMENT_RANGE_UNAVAILABLE", message, true);
  }
}
