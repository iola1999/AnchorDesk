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

  // Create a regex pattern that matches `query` ignoring whitespace/newline differences
  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const tokens = normalizedQuery.split(/\s+/).map(escapeRegex);
  const pattern = new RegExp(tokens.join('\\s+'), 'i');

  const match = text.match(pattern);
  if (!match || match.index === undefined) {
    // try even fuzzier matching: ignore all space gaps completely!
    const chars = Array.from(normalizedQuery.replace(/\s+/g, ''));
    if (chars.length < 3) return [{ text, highlighted: false }];
    const fuzzyPattern = new RegExp(chars.map(escapeRegex).join('\\s*'), 'i');
    const fuzzyMatch = text.match(fuzzyPattern);
    
    if (fuzzyMatch && fuzzyMatch.index !== undefined) {
      const idx = fuzzyMatch.index;
      const len = fuzzyMatch[0].length;
      return [
        { text: text.slice(0, idx), highlighted: false },
        { text: text.slice(idx, idx + len), highlighted: true },
        { text: text.slice(idx + len), highlighted: false }
      ].filter(item => item.text.length > 0);
    }

    return [{ text, highlighted: false }];
  }

  const idx = match.index;
  const len = match[0].length;
  return [
    { text: text.slice(0, idx), highlighted: false },
    { text: text.slice(idx, idx + len), highlighted: true },
    { text: text.slice(idx + len), highlighted: false },
  ].filter(item => item.text.length > 0);
}
