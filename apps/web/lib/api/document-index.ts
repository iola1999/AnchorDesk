import { eq } from "drizzle-orm";

import {
  citationAnchors,
  documentChunks,
  documents,
  documentVersions,
  getDb,
  messageCitations,
} from "@knowledge-assistant/db";
import {
  deleteDocumentVersionPoints,
  upsertDocumentChunks,
} from "@knowledge-assistant/retrieval";
import { deleteObject, getJson } from "@knowledge-assistant/storage";

import {
  buildAnchorLabel,
  buildMessageCitationLabel,
} from "./document-metadata";

type EmbeddingArtifact = {
  points: Array<{
    chunk_id: string;
    vector: number[];
  }>;
};

export function getEmbeddingArtifactKey(documentVersionId: string) {
  return `embedding-artifacts/${documentVersionId}.json`;
}

async function listDocumentVersions(documentId: string) {
  const db = getDb();
  return db
    .select({
      id: documentVersions.id,
      workspaceId: documents.workspaceId,
      storageKey: documentVersions.storageKey,
    })
    .from(documentVersions)
    .innerJoin(documents, eq(documents.id, documentVersions.documentId))
    .where(eq(documentVersions.documentId, documentId));
}

async function fetchChunksForIndex(documentVersionId: string) {
  const db = getDb();
  const rows = await db
    .select({
      chunkId: documentChunks.id,
      workspaceId: documentChunks.workspaceId,
      documentId: documentChunks.documentId,
      documentVersionId: documentChunks.documentVersionId,
      pageStart: documentChunks.pageStart,
      pageEnd: documentChunks.pageEnd,
      sectionLabel: documentChunks.sectionLabel,
      headingPath: documentChunks.headingPath,
      keywords: documentChunks.keywords,
      text: documentChunks.chunkText,
      documentPath: documents.logicalPath,
      directoryPath: documents.directoryPath,
      docType: documents.docType,
      tags: documents.tagsJson,
      anchorId: citationAnchors.id,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documents.id, documentChunks.documentId))
    .innerJoin(citationAnchors, eq(citationAnchors.chunkId, documentChunks.id))
    .where(eq(documentChunks.documentVersionId, documentVersionId));

  return rows.map((row) => ({
    pointId: row.chunkId,
    workspaceId: row.workspaceId,
    documentId: row.documentId,
    documentVersionId: row.documentVersionId,
    chunkId: row.chunkId,
    anchorId: row.anchorId,
    docType: row.docType,
    documentPath: row.documentPath,
    directoryPath: row.directoryPath,
    tags: row.tags ?? [],
    pageStart: row.pageStart,
    pageEnd: row.pageEnd,
    headingPath: row.headingPath ?? [],
    sectionLabel: row.sectionLabel ?? null,
    keywords: row.keywords ?? [],
    text: row.text,
  }));
}

async function syncDocumentVersionIndex(input: {
  workspaceId: string;
  documentVersionId: string;
}) {
  const chunks = await fetchChunksForIndex(input.documentVersionId);
  const embeddingArtifact = await getJson<EmbeddingArtifact>(
    getEmbeddingArtifactKey(input.documentVersionId),
  );
  const vectorsByChunkId = new Map(
    (embeddingArtifact?.points ?? []).map((item) => [item.chunk_id, item.vector] as const),
  );
  const vectors =
    chunks.length > 0 && chunks.every((chunk) => vectorsByChunkId.has(chunk.chunkId))
      ? chunks.map((chunk) => vectorsByChunkId.get(chunk.chunkId) ?? [])
      : undefined;

  await deleteDocumentVersionPoints(input);

  if (chunks.length > 0) {
    await upsertDocumentChunks(chunks, { vectors });
  }
}

export async function syncDocumentSearchIndex(documentId: string) {
  const versions = await listDocumentVersions(documentId);

  for (const version of versions) {
    await syncDocumentVersionIndex({
      workspaceId: version.workspaceId,
      documentVersionId: version.id,
    });
  }
}

export async function deleteDocumentSearchIndexAndAssets(documentId: string) {
  const versions = await listDocumentVersions(documentId);

  for (const version of versions) {
    await deleteDocumentVersionPoints({
      workspaceId: version.workspaceId,
      documentVersionId: version.id,
    });
  }

  await Promise.all(
    versions.flatMap((version) => [
      deleteObject(version.storageKey),
      deleteObject(getEmbeddingArtifactKey(version.id)),
    ]),
  );
}

export async function syncDocumentCitationMetadata(input: {
  documentId: string;
  title: string;
  logicalPath: string;
}) {
  const db = getDb();
  const anchors = await db
    .select({
      id: citationAnchors.id,
      pageNo: citationAnchors.pageNo,
    })
    .from(citationAnchors)
    .where(eq(citationAnchors.documentId, input.documentId));

  for (const anchor of anchors) {
    await db
      .update(citationAnchors)
      .set({
        documentPath: input.logicalPath,
        anchorLabel: buildAnchorLabel(input.title, anchor.pageNo),
      })
      .where(eq(citationAnchors.id, anchor.id));
  }

  const citations = await db
    .select({
      id: messageCitations.id,
      pageNo: messageCitations.pageNo,
    })
    .from(messageCitations)
    .where(eq(messageCitations.documentId, input.documentId));

  for (const citation of citations) {
    await db
      .update(messageCitations)
      .set({
        documentPath: input.logicalPath,
        label: buildMessageCitationLabel(input.logicalPath, citation.pageNo),
      })
      .where(eq(messageCitations.id, citation.id));
  }
}
