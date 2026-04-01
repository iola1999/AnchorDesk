import { asc, eq, inArray } from "drizzle-orm";

import {
  ASSISTANT_TOOL,
  DOCUMENT_STATUS,
  PARSE_STATUS,
} from "@anchordesk/contracts";
import {
  conversationAttachments,
  documentBlocks,
  documentPages,
  documentVersions,
  documents,
  getDb,
} from "@anchordesk/db";

const ATTACHMENT_CONTEXT_TOTAL_CHAR_BUDGET = 24_000;
const ATTACHMENT_CONTEXT_FULL_TEXT_CHAR_LIMIT = 12_000;
const ATTACHMENT_CONTEXT_EXCERPT_CHAR_LIMIT = 4_000;
const ATTACHMENT_CONTEXT_MIN_PREVIEW_CHARS = 800;

export type ConversationAttachmentPromptPage = {
  pageNo: number;
  text: string;
};

export type ConversationAttachmentPromptAttachment = {
  documentId: string;
  documentTitle: string;
  documentPath: string;
  sourceFilename: string;
  pageCount: number;
  blockCount: number;
  pages: ConversationAttachmentPromptPage[];
};

function normalizePageText(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function formatAttachmentPage(page: ConversationAttachmentPromptPage) {
  const text = normalizePageText(page.text);
  if (!text) {
    return "";
  }

  return [`[Page ${page.pageNo}]`, text].join("\n");
}

function buildInlinePreview(
  attachment: ConversationAttachmentPromptAttachment,
  maxChars: number,
) {
  const pageEntries = attachment.pages
    .map((page) => ({
      pageNo: page.pageNo,
      text: formatAttachmentPage(page),
    }))
    .filter((page) => page.text.length > 0);

  if (pageEntries.length === 0 || maxChars < ATTACHMENT_CONTEXT_MIN_PREVIEW_CHARS) {
    return {
      previewText: "",
      previewMode: "metadata_only" as const,
      loadedPageStart: null,
      loadedPageEnd: null,
      omitted: attachment.pageCount > 0,
    };
  }

  const fullText = pageEntries.map((page) => page.text).join("\n\n");
  if (
    fullText.length <= ATTACHMENT_CONTEXT_FULL_TEXT_CHAR_LIMIT &&
    fullText.length <= maxChars
  ) {
    return {
      previewText: fullText,
      previewMode: "full_text" as const,
      loadedPageStart: pageEntries[0]?.pageNo ?? null,
      loadedPageEnd: pageEntries.at(-1)?.pageNo ?? null,
      omitted: false,
    };
  }

  const excerptLimit = Math.min(ATTACHMENT_CONTEXT_EXCERPT_CHAR_LIMIT, maxChars);
  const previewParts: string[] = [];
  let remainingChars = excerptLimit;
  let loadedPageStart: number | null = null;
  let loadedPageEnd: number | null = null;

  for (const page of pageEntries) {
    if (remainingChars <= 0) {
      break;
    }

    const text = page.text;
    if (text.length <= remainingChars) {
      previewParts.push(text);
      remainingChars -= text.length + 2;
      loadedPageStart ??= page.pageNo;
      loadedPageEnd = page.pageNo;
      continue;
    }

    const slice = text.slice(0, Math.max(0, remainingChars - 1)).trimEnd();
    if (!slice) {
      break;
    }

    previewParts.push(`${slice}…`);
    loadedPageStart ??= page.pageNo;
    loadedPageEnd = page.pageNo;
    remainingChars = 0;
    break;
  }

  return {
    previewText: previewParts.join("\n\n"),
    previewMode: previewParts.length > 0 ? ("excerpt_only" as const) : ("metadata_only" as const),
    loadedPageStart,
    loadedPageEnd,
    omitted: previewParts.length === 0 || fullText.length > previewParts.join("\n\n").length,
  };
}

export function buildConversationAttachmentContextSection(
  attachments: ConversationAttachmentPromptAttachment[],
) {
  if (attachments.length === 0) {
    return "";
  }

  let remainingBudget = ATTACHMENT_CONTEXT_TOTAL_CHAR_BUDGET;
  const sections = [`attachment_count: ${attachments.length}`];

  attachments.forEach((attachment, index) => {
    const preview = buildInlinePreview(attachment, remainingBudget);
    remainingBudget = Math.max(0, remainingBudget - preview.previewText.length);

    const block = [
      `[Attachment ${index + 1}]`,
      `document_id: ${attachment.documentId}`,
      `document_title: ${attachment.documentTitle}`,
      `document_path: ${attachment.documentPath}`,
      `source_filename: ${attachment.sourceFilename}`,
      `page_count: ${attachment.pageCount}`,
      `block_count: ${attachment.blockCount}`,
      `preload_status: ${preview.previewMode}`,
      ...(preview.loadedPageStart !== null && preview.loadedPageEnd !== null
        ? [`preloaded_pages: ${preview.loadedPageStart}-${preview.loadedPageEnd}`]
        : []),
      ...(preview.previewText
        ? ["content:", preview.previewText]
        : ["content: omitted from preload because the shared attachment preview budget is exhausted."]),
      ...(preview.previewMode === "excerpt_only" || preview.previewMode === "metadata_only"
        ? [
            `note: remaining content omitted because this attachment is long. Use ${ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE} with this document_id to read a focused page range when needed.`,
          ]
        : []),
    ];

    sections.push(block.join("\n"));
  });

  return sections.join("\n\n");
}

export function buildConversationPromptWithAttachments(input: {
  prompt: string;
  attachments: ConversationAttachmentPromptAttachment[];
}) {
  const prompt = input.prompt.trim();
  const attachmentSection = buildConversationAttachmentContextSection(input.attachments);

  if (!attachmentSection) {
    return prompt;
  }

  return [
    prompt,
    "",
    "The following conversation attachments are preloaded for quick reading.",
    "If you rely on attachment facts in the final answer, still call search_conversation_attachments or read_conversation_attachment_range to retrieve citation_token-backed evidence before citing.",
    "",
    attachmentSection,
  ].join("\n");
}

export async function loadConversationAttachmentPromptAttachments(conversationId: string) {
  const db = getDb();
  const attachmentRows = await db
    .select({
      documentId: documents.id,
      documentVersionId: conversationAttachments.documentVersionId,
      documentTitle: documents.title,
      documentPath: documents.logicalPath,
      sourceFilename: documents.sourceFilename,
      documentStatus: documents.status,
      parseStatus: documentVersions.parseStatus,
    })
    .from(conversationAttachments)
    .innerJoin(documents, eq(documents.id, conversationAttachments.documentId))
    .innerJoin(
      documentVersions,
      eq(documentVersions.id, conversationAttachments.documentVersionId),
    )
    .where(eq(conversationAttachments.conversationId, conversationId))
    .orderBy(asc(conversationAttachments.createdAt));

  const readyAttachments = attachmentRows.filter(
    (attachment) =>
      attachment.documentStatus === DOCUMENT_STATUS.READY &&
      attachment.parseStatus === PARSE_STATUS.READY,
  );

  if (readyAttachments.length === 0) {
    return [];
  }

  const versionIds = readyAttachments.map((attachment) => attachment.documentVersionId);
  const [pageRows, blockRows] = await Promise.all([
    db
      .select({
        documentVersionId: documentPages.documentVersionId,
        pageNo: documentPages.pageNo,
      })
      .from(documentPages)
      .where(inArray(documentPages.documentVersionId, versionIds))
      .orderBy(asc(documentPages.documentVersionId), asc(documentPages.pageNo)),
    db
      .select({
        documentVersionId: documentBlocks.documentVersionId,
        pageNo: documentBlocks.pageNo,
        orderIndex: documentBlocks.orderIndex,
        text: documentBlocks.text,
      })
      .from(documentBlocks)
      .where(inArray(documentBlocks.documentVersionId, versionIds))
      .orderBy(
        asc(documentBlocks.documentVersionId),
        asc(documentBlocks.pageNo),
        asc(documentBlocks.orderIndex),
      ),
  ]);

  const pageNosByVersionId = new Map<string, number[]>();
  const blockCountByVersionId = new Map<string, number>();
  for (const row of pageRows) {
    const current = pageNosByVersionId.get(row.documentVersionId) ?? [];
    current.push(row.pageNo);
    pageNosByVersionId.set(row.documentVersionId, current);
  }

  const pagesByVersionId = new Map<string, ConversationAttachmentPromptPage[]>();
  for (const row of blockRows) {
    const current = pagesByVersionId.get(row.documentVersionId) ?? [];
    const existing = current.at(-1);
    const normalizedText = normalizePageText(row.text);
    blockCountByVersionId.set(
      row.documentVersionId,
      (blockCountByVersionId.get(row.documentVersionId) ?? 0) + 1,
    );
    if (!normalizedText) {
      pagesByVersionId.set(row.documentVersionId, current);
      continue;
    }

    if (existing && existing.pageNo === row.pageNo) {
      existing.text = `${existing.text}\n\n${normalizedText}`;
    } else {
      current.push({
        pageNo: row.pageNo,
        text: normalizedText,
      });
    }
    pagesByVersionId.set(row.documentVersionId, current);
  }

  return readyAttachments.map((attachment) => {
    const pages = pagesByVersionId.get(attachment.documentVersionId) ?? [];
    const pageNos = pageNosByVersionId.get(attachment.documentVersionId) ?? pages.map((page) => page.pageNo);

    return {
      documentId: attachment.documentId,
      documentTitle: attachment.documentTitle,
      documentPath: attachment.documentPath,
      sourceFilename: attachment.sourceFilename,
      pageCount: pageNos.length,
      blockCount: blockCountByVersionId.get(attachment.documentVersionId) ?? 0,
      pages,
    } satisfies ConversationAttachmentPromptAttachment;
  });
}
