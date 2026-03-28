import { z } from "zod";

import { GROUNDED_ANSWER_CONFIDENCE_VALUES } from "./constants";

export const groundedEvidenceSchema = z.object({
  anchor_id: z.string().uuid(),
  document_path: z.string().min(1),
  page_no: z.number().int().min(1).nullable(),
  label: z.string().min(1),
  quote_text: z.string().min(1),
});

export const groundedAnswerCitationSchema = z.object({
  anchor_id: z.string().uuid(),
  label: z.string().min(1),
  quote_text: z.string().min(1),
});

export const groundedAnswerSchema = z.object({
  answer_markdown: z.string().min(1),
  confidence: z.enum(GROUNDED_ANSWER_CONFIDENCE_VALUES),
  unsupported_reason: z.string().nullable(),
  citations: z.array(groundedAnswerCitationSchema).default([]),
  missing_information: z.array(z.string().min(1)).default([]),
});

export type GroundedEvidence = z.infer<typeof groundedEvidenceSchema>;
export type GroundedAnswerCitation = z.infer<typeof groundedAnswerCitationSchema>;
export type GroundedAnswer = z.infer<typeof groundedAnswerSchema>;
