import JSZip from "jszip";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  documents,
  documentVersions,
  getDb,
  workspaceDirectories,
} from "@anchordesk/db";
import { getObjectBytes } from "@anchordesk/storage";

import { auth } from "@/auth";
import { findManagedKnowledgeLibrary } from "@/lib/api/admin-knowledge-libraries";
import { compactKnowledgeBaseSelection } from "@/lib/api/knowledge-base-operations";
import { isSameOrDescendantPath } from "@/lib/api/directory-paths";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const runtime = "nodejs";

const downloadSchema = z.object({
  directoryIds: z.array(z.string().min(1)).max(200).default([]),
  documentIds: z.array(z.string().min(1)).max(200).default([]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ libraryId: string }> },
) {
  const { libraryId } = await params;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const library = await findManagedKnowledgeLibrary(libraryId);
  if (!library) {
    return Response.json({ error: "Library not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = downloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "下载参数无效" },
      { status: 400 },
    );
  }

  const db = getDb();
  const [selectedDirectories, selectedDocuments, allDocuments] = await Promise.all([
    parsed.data.directoryIds.length > 0
      ? db
          .select()
          .from(workspaceDirectories)
          .where(
            and(
              eq(workspaceDirectories.libraryId, libraryId),
              isNull(workspaceDirectories.deletedAt),
              inArray(workspaceDirectories.id, parsed.data.directoryIds),
            ),
          )
      : Promise.resolve([]),
    parsed.data.documentIds.length > 0
      ? db
          .select()
          .from(documents)
          .where(and(eq(documents.libraryId, libraryId), inArray(documents.id, parsed.data.documentIds)))
      : Promise.resolve([]),
    db.select().from(documents).where(eq(documents.libraryId, libraryId)),
  ]);

  const compactedSelection = compactKnowledgeBaseSelection({
    directories: selectedDirectories.map((directory) => ({
      id: directory.id,
      path: directory.path,
      name: directory.name,
    })),
    documents: selectedDocuments.map((document) => ({
      id: document.id,
      logicalPath: document.logicalPath,
      directoryPath: document.directoryPath,
      sourceFilename: document.sourceFilename,
    })),
  });

  const selectedDocumentRows = allDocuments.filter((document) => {
    if (compactedSelection.documents.some((selectedDocument) => selectedDocument.id === document.id)) {
      return true;
    }

    return compactedSelection.directories.some((directory) =>
      isSameOrDescendantPath(document.directoryPath, directory.path),
    );
  });

  const latestVersionIds = selectedDocumentRows
    .map((document) => document.latestVersionId)
    .filter((value): value is string => Boolean(value));
  const versions =
    latestVersionIds.length > 0
      ? await db
          .select({
            id: documentVersions.id,
            storageKey: documentVersions.storageKey,
          })
          .from(documentVersions)
          .where(inArray(documentVersions.id, latestVersionIds))
      : [];
  const versionById = new Map(versions.map((version) => [version.id, version] as const));

  if (selectedDocumentRows.length === 0) {
    return Response.json({ error: "没有可下载的资料" }, { status: 400 });
  }

  const zip = new JSZip();

  for (const document of selectedDocumentRows) {
    const version = document.latestVersionId
      ? versionById.get(document.latestVersionId) ?? null
      : null;
    if (!version) {
      continue;
    }

    const bytes = await getObjectBytes(version.storageKey);
    if (!bytes) {
      continue;
    }

    zip.file(document.logicalPath, bytes);
  }

  const archive = await zip.generateAsync({ type: "uint8array" });
  const archiveBuffer = Buffer.from(archive);
  const filename = `${library.slug || "knowledge-library"}-${Date.now()}.zip`;

  return new Response(archiveBuffer, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "no-store",
    },
  });
}
