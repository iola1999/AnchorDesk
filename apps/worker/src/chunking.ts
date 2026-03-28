export type ChunkingBlock = {
  id: string;
  pageNo: number;
  orderIndex: number;
  blockType: string;
  sectionLabel: string | null;
  headingPath: string[];
  text: string;
};

export type ChunkSeed = {
  sourceBlockId: string | null;
  pageStart: number;
  pageEnd: number;
  sectionLabel: string | null;
  headingPath: string[];
  chunkText: string;
  plainText: string;
  keywords: string[];
  tokenCount: number;
};

const DEFAULT_MAX_CHARS = 1_200;

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractKeywords(text: string, sectionLabel: string | null, headingPath: string[]) {
  const source = [sectionLabel ?? "", ...headingPath, text].join(" ");
  const matches = source.match(
    /第[\d一二三四五六七八九十百千零〇]+[条款项章编节]|[0-9]+(?:\.[0-9]+){1,4}|[\p{Script=Han}]{2,8}/gu,
  );

  return unique((matches ?? []).slice(0, 16).map((item) => item.trim()));
}

function buildChunkText(headingPath: string[], bodyTexts: string[]) {
  const headingLines = unique(headingPath.map((item) => normalizeWhitespace(item)));
  const body = bodyTexts.map((item) => normalizeWhitespace(item)).filter(Boolean);
  return [...headingLines, ...body].filter(Boolean).join("\n\n").trim();
}

function finalizeChunk(input: {
  bodyBlocks: ChunkingBlock[];
  headingPath: string[];
  sectionLabel: string | null;
  pendingHeadingBlock: ChunkingBlock | null;
}) {
  const allBlocks =
    input.bodyBlocks.length > 0
      ? input.bodyBlocks
      : input.pendingHeadingBlock
        ? [input.pendingHeadingBlock]
        : [];

  if (allBlocks.length === 0) {
    return null;
  }

  const bodyTexts =
    input.bodyBlocks.length > 0
      ? input.bodyBlocks.map((block) => block.text)
      : input.pendingHeadingBlock
        ? [input.pendingHeadingBlock.text]
        : [];
  const chunkText = buildChunkText(input.headingPath, bodyTexts);

  if (!chunkText) {
    return null;
  }

  const pageNumbers = allBlocks.map((block) => block.pageNo);
  const sourceBlockId = input.bodyBlocks[0]?.id ?? input.pendingHeadingBlock?.id ?? null;
  const sectionLabel =
    input.sectionLabel ??
    input.pendingHeadingBlock?.sectionLabel ??
    input.bodyBlocks[0]?.sectionLabel ??
    null;

  return {
    sourceBlockId,
    pageStart: Math.min(...pageNumbers),
    pageEnd: Math.max(...pageNumbers),
    sectionLabel,
    headingPath: input.headingPath,
    chunkText,
    plainText: chunkText,
    keywords: extractKeywords(chunkText, sectionLabel, input.headingPath),
    tokenCount: chunkText.length,
  } satisfies ChunkSeed;
}

export function buildChunkSeeds(
  blocks: ChunkingBlock[],
  options?: { maxChars?: number },
) {
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;
  const ordered = [...blocks].sort((left, right) => {
    if (left.pageNo !== right.pageNo) {
      return left.pageNo - right.pageNo;
    }
    return left.orderIndex - right.orderIndex;
  });

  const chunks: ChunkSeed[] = [];
  let activeHeadingPath: string[] = [];
  let activeSectionLabel: string | null = null;
  let pendingHeadingBlock: ChunkingBlock | null = null;
  let bodyBlocks: ChunkingBlock[] = [];
  let bodyLength = 0;

  const flush = () => {
    const chunk = finalizeChunk({
      bodyBlocks,
      headingPath: activeHeadingPath,
      sectionLabel: activeSectionLabel,
      pendingHeadingBlock,
    });
    if (chunk) {
      chunks.push(chunk);
    }
    bodyBlocks = [];
    bodyLength = 0;
    pendingHeadingBlock = null;
  };

  for (const block of ordered) {
    const normalizedText = normalizeWhitespace(block.text);
    if (!normalizedText) {
      continue;
    }

    const nextHeadingPath: string[] =
      block.headingPath.length > 0
        ? block.headingPath.map((item) => normalizeWhitespace(item)).filter(Boolean)
        : activeHeadingPath;
    const nextSectionLabel: string | null = block.sectionLabel ?? activeSectionLabel;

    if (block.blockType === "heading") {
      flush();
      activeHeadingPath = nextHeadingPath.length > 0 ? nextHeadingPath : [normalizedText];
      activeSectionLabel = block.sectionLabel ?? nextSectionLabel ?? normalizedText;
      pendingHeadingBlock = {
        ...block,
        text: normalizedText,
      };
      continue;
    }

    const blockLength = normalizedText.length;
    const headingChanged =
      JSON.stringify(nextHeadingPath) !== JSON.stringify(activeHeadingPath) ||
      nextSectionLabel !== activeSectionLabel;

    if (headingChanged && (bodyBlocks.length > 0 || pendingHeadingBlock)) {
      flush();
    }

    if (nextHeadingPath.length > 0) {
      activeHeadingPath = nextHeadingPath;
    }
    activeSectionLabel = nextSectionLabel;

    if (bodyBlocks.length > 0 && bodyLength + blockLength > maxChars) {
      flush();
    }

    bodyBlocks.push({
      ...block,
      text: normalizedText,
    });
    bodyLength += blockLength;
  }

  flush();
  return chunks;
}
