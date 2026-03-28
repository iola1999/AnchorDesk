export type ReportOutlineSectionDraft = {
  title: string;
  section_key?: string;
};

export type ReportSectionCitation = {
  anchor_id: string;
  label: string;
};

export type ReportEvidenceAnchor = {
  anchor_id: string;
  label: string;
  quote_text: string;
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function slugifySectionKey(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "section";
}

export function normalizeOutlineSections(sections: ReportOutlineSectionDraft[]) {
  const usedKeys = new Map<string, number>();

  return sections
    .map((section) => {
      const title = section.title.trim();
      if (!title) {
        return null;
      }

      const baseKey = slugifySectionKey(section.section_key?.trim() || title);
      const nextCount = (usedKeys.get(baseKey) ?? 0) + 1;
      usedKeys.set(baseKey, nextCount);

      return {
        title,
        section_key: nextCount === 1 ? baseKey : `${baseKey}_${nextCount}`,
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);
}

export function formatReportEvidenceDossier(
  evidence: ReportEvidenceAnchor[],
  maxItems = evidence.length,
) {
  return evidence
    .slice(0, maxItems)
    .map(
      (item, index) =>
        [
          `${index + 1}. ${item.label}`,
          `anchor_id: ${item.anchor_id}`,
          `quote: ${item.quote_text.trim() || "(empty)"}`,
        ].join("\n"),
    )
    .join("\n\n");
}

export function buildReportOutlinePrompt(input: {
  title: string;
  task: string;
  evidence: ReportEvidenceAnchor[];
}) {
  return [
    "Report title:",
    input.title.trim(),
    "",
    "User task:",
    input.task.trim(),
    "",
    "Evidence dossier:",
    input.evidence.length > 0
      ? formatReportEvidenceDossier(input.evidence, 6)
      : "(no workspace evidence retrieved)",
  ].join("\n");
}

export function buildReportSectionPrompt(input: {
  reportTitle: string;
  sectionTitle: string;
  instruction: string;
  evidence: ReportEvidenceAnchor[];
}) {
  return [
    "Report title:",
    input.reportTitle.trim(),
    "",
    "Section title:",
    input.sectionTitle.trim(),
    "",
    "Instruction:",
    input.instruction.trim(),
    "",
    "Evidence dossier:",
    input.evidence.length > 0
      ? formatReportEvidenceDossier(input.evidence, 8)
      : "(no workspace evidence retrieved)",
  ].join("\n");
}

export function buildReportSectionMarkdown(input: {
  title: string;
  body: string;
  citations: ReportSectionCitation[];
  missingInformation: string[];
}) {
  const sections = [`## ${input.title.trim()}`, "", input.body.trim() || "当前资料不足以支持更具体的章节写作。"];
  const citationLines = input.citations
    .map((citation) => citation.label.trim())
    .filter(Boolean);
  const missingInformation = uniqueStrings(input.missingInformation);

  if (citationLines.length > 0) {
    sections.push("", "### 依据");
    for (const label of citationLines) {
      sections.push(`- ${label}`);
    }
  }

  if (missingInformation.length > 0) {
    sections.push("", "### 待补充信息");
    for (const item of missingInformation) {
      sections.push(`- ${item}`);
    }
  }

  return sections.join("\n");
}
