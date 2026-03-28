export function resolveInitialPdfPage(input: {
  highlightedAnchorPage?: number;
  requestedPage?: number;
  totalPages: number;
}) {
  const preferred = input.highlightedAnchorPage ?? input.requestedPage ?? 1;
  if (preferred < 1) {
    return 1;
  }

  if (preferred > input.totalPages) {
    return input.totalPages;
  }

  return preferred;
}

export function buildPdfSearchResults(
  query: string,
  pages: Array<{ pageNo: number; text: string }>,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return pages
    .filter((page) => page.text.toLowerCase().includes(normalizedQuery))
    .map((page) => ({
      pageNo: page.pageNo,
      snippet: page.text,
    }));
}

export function splitHighlightedText(text: string, query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [{ text, highlighted: false }];
  }

  const result: Array<{ text: string; highlighted: boolean }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = text.indexOf(normalizedQuery, cursor);
    if (index === -1) {
      result.push({ text: text.slice(cursor), highlighted: false });
      break;
    }

    if (index > cursor) {
      result.push({ text: text.slice(cursor, index), highlighted: false });
    }

    result.push({
      text: text.slice(index, index + normalizedQuery.length),
      highlighted: true,
    });
    cursor = index + normalizedQuery.length;
  }

  return result.filter((item) => item.text.length > 0);
}
