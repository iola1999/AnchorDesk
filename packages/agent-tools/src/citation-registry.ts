import {
  ASSISTANT_TOOL,
  buildRawInlineCitationToken,
  normalizeAssistantToolName,
} from "@anchordesk/contracts";

type CitationRegistryEntry = {
  citationId: number;
  citationToken: string;
  evidenceId: string;
};

export type AssistantCitationRegistry = ReturnType<typeof createAssistantCitationRegistry>;

function buildAnchorEvidenceId(anchorId: string) {
  return `anchor:${anchorId}`;
}

function buildWebEvidenceId(url: string) {
  return `web:${url}`;
}

function asObjectRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function createAssistantCitationRegistry() {
  let nextCitationId = 1;
  const entriesByEvidenceId = new Map<string, CitationRegistryEntry>();

  function ensureEntry(evidenceId: string) {
    const existing = entriesByEvidenceId.get(evidenceId);
    if (existing) {
      return existing;
    }

    const entry = {
      citationId: nextCitationId,
      citationToken: buildRawInlineCitationToken(nextCitationId),
      evidenceId,
    } satisfies CitationRegistryEntry;
    nextCitationId += 1;
    entriesByEvidenceId.set(evidenceId, entry);
    return entry;
  }

  return {
    registerDocumentAnchor(anchorId: string) {
      return ensureEntry(buildAnchorEvidenceId(anchorId));
    },
    registerWebPage(url: string) {
      return ensureEntry(buildWebEvidenceId(url));
    },
  };
}

function withCitationFields(
  value: Record<string, unknown>,
  entry: CitationRegistryEntry,
) {
  return {
    ...value,
    citation_id: entry.citationId,
    citation_token: entry.citationToken,
  };
}

export function attachCitationMetadataToToolOutput(input: {
  output: unknown;
  registry: AssistantCitationRegistry;
  toolName: string;
}) {
  const normalizedToolName = normalizeAssistantToolName(input.toolName);
  const output = asObjectRecord(input.output);
  if (!output || output.ok !== true) {
    return input.output;
  }

  if (
    normalizedToolName === ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE ||
    normalizedToolName === ASSISTANT_TOOL.SEARCH_CONVERSATION_ATTACHMENTS
  ) {
    const results = Array.isArray(output.results) ? output.results : [];
    return {
      ...output,
      results: results.map((result) => {
        const record = asObjectRecord(result);
        const anchorId =
          record && typeof record.anchor_id === "string" ? record.anchor_id.trim() : "";
        if (!record || !anchorId) {
          return result;
        }

        return withCitationFields(record, input.registry.registerDocumentAnchor(anchorId));
      }),
    };
  }

  if (normalizedToolName === ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE) {
    const document = asObjectRecord(output.document);
    const pages = Array.isArray(document?.pages) ? document.pages : [];
    if (!document) {
      return input.output;
    }

    return {
      ...output,
      document: {
        ...document,
        pages: pages.map((page) => {
          const record = asObjectRecord(page);
          const anchorId =
            record && typeof record.anchor_id === "string" ? record.anchor_id.trim() : "";
          if (!record || !anchorId) {
            return page;
          }

          return withCitationFields(record, input.registry.registerDocumentAnchor(anchorId));
        }),
      },
    };
  }

  if (normalizedToolName === ASSISTANT_TOOL.READ_CITATION_ANCHOR) {
    const anchor = asObjectRecord(output.anchor);
    const anchorId =
      anchor && typeof anchor.anchor_id === "string" ? anchor.anchor_id.trim() : "";
    if (!anchor || !anchorId) {
      return input.output;
    }

    return {
      ...output,
      anchor: withCitationFields(anchor, input.registry.registerDocumentAnchor(anchorId)),
    };
  }

  if (normalizedToolName === ASSISTANT_TOOL.FETCH_SOURCE) {
    const source = asObjectRecord(output.source);
    const url = source && typeof source.url === "string" ? source.url.trim() : "";
    if (!source || !url) {
      return input.output;
    }

    return {
      ...output,
      source: withCitationFields(source, input.registry.registerWebPage(url)),
    };
  }

  if (normalizedToolName === ASSISTANT_TOOL.FETCH_SOURCES) {
    const sources = Array.isArray(output.sources) ? output.sources : [];
    return {
      ...output,
      sources: sources.map((source) => {
        const record = asObjectRecord(source);
        const url = record && typeof record.url === "string" ? record.url.trim() : "";
        if (!record || !url) {
          return source;
        }

        return withCitationFields(record, input.registry.registerWebPage(url));
      }),
    };
  }

  return input.output;
}
