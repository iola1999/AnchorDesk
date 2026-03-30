import { z } from "zod";

import { KNOWLEDGE_SOURCE_SCOPE_VALUES } from "./constants";

export const GROUNDED_EVIDENCE_KIND = {
  DOCUMENT_ANCHOR: "document_anchor",
  WEB_PAGE: "web_page",
} as const;
export const GROUNDED_EVIDENCE_KIND_VALUES = [
  GROUNDED_EVIDENCE_KIND.DOCUMENT_ANCHOR,
  GROUNDED_EVIDENCE_KIND.WEB_PAGE,
] as const;

const groundedEvidenceBaseSchema = z.object({
  evidence_id: z.string().min(1),
  label: z.string().min(1),
  quote_text: z.string().min(1),
  source_scope: z.enum(KNOWLEDGE_SOURCE_SCOPE_VALUES).nullable().optional(),
  library_title: z.string().nullable().optional(),
});

const groundedDocumentEvidenceSchema = groundedEvidenceBaseSchema.extend({
  kind: z.literal(GROUNDED_EVIDENCE_KIND.DOCUMENT_ANCHOR),
  anchor_id: z.string().uuid(),
  document_path: z.string().min(1),
  page_no: z.number().int().min(1).nullable(),
});

const groundedWebEvidenceSchema = groundedEvidenceBaseSchema.extend({
  kind: z.literal(GROUNDED_EVIDENCE_KIND.WEB_PAGE),
  url: z.string().url(),
  domain: z.string().min(1),
  title: z.string().min(1),
});

export const groundedEvidenceSchema = z.discriminatedUnion("kind", [
  groundedDocumentEvidenceSchema,
  groundedWebEvidenceSchema,
]);

export const groundedAnswerCitationSchema = z.object({
  evidence_id: z.string().min(1),
});

export const groundedAnswerSchema = z.object({
  answer_markdown: z.string().min(1),
  citations: z.array(groundedAnswerCitationSchema).default([]),
});

export type GroundedEvidence = z.infer<typeof groundedEvidenceSchema>;
export type GroundedAnswerCitationReference = z.infer<typeof groundedAnswerCitationSchema>;
export type GroundedAnswer = {
  answer_markdown: string;
  citations: GroundedEvidence[];
};
