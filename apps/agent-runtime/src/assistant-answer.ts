import {
  buildDisplayInlineCitationToken,
  extractRawInlineCitationSlots,
  replaceRawInlineCitationTokens,
  type GroundedEvidence,
} from "@anchordesk/contracts";

export type CollectedGroundedEvidence = {
  citationId: number;
  evidence: GroundedEvidence;
};

export function toDisplayInlineCitationText(value: string) {
  return replaceRawInlineCitationTokens(value, (slot) =>
    buildDisplayInlineCitationToken(slot),
  );
}

export function materializeAssistantAnswer(input: {
  rawText: string;
  evidenceRegistry: CollectedGroundedEvidence[];
}) {
  const rawSlots = extractRawInlineCitationSlots(input.rawText);
  const evidenceByCitationId = new Map(
    input.evidenceRegistry.map((entry) => [entry.citationId, entry.evidence] as const),
  );

  if (rawSlots.length === 0) {
    if (input.evidenceRegistry.length > 0 && input.rawText.trim().length > 0) {
      throw new Error("Assistant answer missing required citation markers.");
    }

    return {
      answerMarkdown: input.rawText,
      citations: [] as GroundedEvidence[],
    };
  }

  const citations: GroundedEvidence[] = [];
  const displayIndexByCitationId = new Map<number, number>();

  for (const slot of rawSlots) {
    const evidence = evidenceByCitationId.get(slot);
    if (!evidence) {
      throw new Error(`Assistant answer referenced unknown citation id ${slot}.`);
    }

    if (!displayIndexByCitationId.has(slot)) {
      displayIndexByCitationId.set(slot, citations.length + 1);
      citations.push(evidence);
    }
  }

  return {
    answerMarkdown: replaceRawInlineCitationTokens(input.rawText, (slot) => {
      const displayIndex = displayIndexByCitationId.get(slot);
      if (!displayIndex) {
        throw new Error(`Assistant answer referenced unknown citation id ${slot}.`);
      }

      return buildDisplayInlineCitationToken(displayIndex);
    }),
    citations,
  };
}
