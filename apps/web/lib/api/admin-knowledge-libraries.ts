import { and, count, eq, inArray, ne, sql } from "drizzle-orm";
import {
  KNOWLEDGE_LIBRARY_TYPE,
  WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS,
} from "@anchordesk/contracts";

import {
  documents,
  getDb,
  knowledgeLibraries,
  workspaceLibrarySubscriptions,
} from "@anchordesk/db";

export async function findManagedKnowledgeLibrary(
  libraryId: string,
  db: ReturnType<typeof getDb> = getDb(),
) {
  const [library] = await db
    .select({
      id: knowledgeLibraries.id,
      title: knowledgeLibraries.title,
      slug: knowledgeLibraries.slug,
      description: knowledgeLibraries.description,
      status: knowledgeLibraries.status,
      libraryType: knowledgeLibraries.libraryType,
      workspaceId: knowledgeLibraries.workspaceId,
      managedByUserId: knowledgeLibraries.managedByUserId,
      createdAt: knowledgeLibraries.createdAt,
      updatedAt: knowledgeLibraries.updatedAt,
    })
    .from(knowledgeLibraries)
    .where(
      and(
        eq(knowledgeLibraries.id, libraryId),
        eq(
          knowledgeLibraries.libraryType,
          KNOWLEDGE_LIBRARY_TYPE.GLOBAL_MANAGED,
        ),
      ),
    )
    .limit(1);

  return library ?? null;
}

export async function buildUniqueKnowledgeLibrarySlug(input: {
  baseSlug: string;
  excludeLibraryId?: string;
  db?: ReturnType<typeof getDb>;
}) {
  const db = input.db ?? getDb();
  let candidate = input.baseSlug.trim() || "library";
  let counter = 2;

  while (true) {
    const [conflict] = await db
      .select({ id: knowledgeLibraries.id })
      .from(knowledgeLibraries)
      .where(
        and(
          eq(knowledgeLibraries.slug, candidate),
          input.excludeLibraryId
            ? ne(knowledgeLibraries.id, input.excludeLibraryId)
            : sql`true`,
        ),
      )
      .limit(1);

    if (!conflict) {
      return candidate;
    }

    candidate = `${input.baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function listManagedKnowledgeLibrariesWithStats(
  db: ReturnType<typeof getDb> = getDb(),
) {
  const libraries = await db
    .select({
      id: knowledgeLibraries.id,
      title: knowledgeLibraries.title,
      slug: knowledgeLibraries.slug,
      description: knowledgeLibraries.description,
      status: knowledgeLibraries.status,
      updatedAt: knowledgeLibraries.updatedAt,
      createdAt: knowledgeLibraries.createdAt,
    })
    .from(knowledgeLibraries)
    .where(
      eq(knowledgeLibraries.libraryType, KNOWLEDGE_LIBRARY_TYPE.GLOBAL_MANAGED),
    )
    .orderBy(knowledgeLibraries.title);

  if (libraries.length === 0) {
    return [];
  }

  const libraryIds = libraries.map((library) => library.id);
  const [documentCounts, activeSubscriptionCounts] = await Promise.all([
    db
      .select({
        libraryId: documents.libraryId,
        count: count(documents.id),
      })
      .from(documents)
      .where(inArray(documents.libraryId, libraryIds))
      .groupBy(documents.libraryId),
    db
      .select({
        libraryId: workspaceLibrarySubscriptions.libraryId,
        count: count(workspaceLibrarySubscriptions.id),
      })
      .from(workspaceLibrarySubscriptions)
      .where(
        and(
          inArray(workspaceLibrarySubscriptions.libraryId, libraryIds),
          eq(
            workspaceLibrarySubscriptions.status,
            WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.ACTIVE,
          ),
        ),
      )
      .groupBy(workspaceLibrarySubscriptions.libraryId),
  ]);

  const documentCountByLibraryId = new Map(
    documentCounts.map((row) => [row.libraryId ?? "", row.count] as const),
  );
  const activeSubscriptionCountByLibraryId = new Map(
    activeSubscriptionCounts.map((row) => [row.libraryId, row.count] as const),
  );

  return libraries.map((library) => ({
    ...library,
    documentCount: documentCountByLibraryId.get(library.id) ?? 0,
    activeSubscriptionCount: activeSubscriptionCountByLibraryId.get(library.id) ?? 0,
  }));
}

export async function loadManagedKnowledgeLibrarySummary(
  libraryId: string,
  db: ReturnType<typeof getDb> = getDb(),
) {
  const library = await findManagedKnowledgeLibrary(libraryId, db);

  if (!library) {
    return null;
  }

  const [documentCountRow, subscriptionCountRow] = await Promise.all([
    db
      .select({ count: count(documents.id) })
      .from(documents)
      .where(eq(documents.libraryId, libraryId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select({ count: count(workspaceLibrarySubscriptions.id) })
      .from(workspaceLibrarySubscriptions)
      .where(eq(workspaceLibrarySubscriptions.libraryId, libraryId))
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  return {
    ...library,
    documentCount: documentCountRow?.count ?? 0,
    subscriptionCount: subscriptionCountRow?.count ?? 0,
  };
}
