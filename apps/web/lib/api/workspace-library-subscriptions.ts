import { eq } from "drizzle-orm";
import {
  KNOWLEDGE_LIBRARY_TYPE,
} from "@anchordesk/contracts";

import {
  documents,
  getDb,
  knowledgeLibraries,
  workspaceLibrarySubscriptions,
} from "@anchordesk/db";

export async function listWorkspaceGlobalLibraryCatalog(
  workspaceId: string,
  db: ReturnType<typeof getDb> = getDb(),
) {
  const [libraries, subscriptions, documentRows] = await Promise.all([
    db
      .select({
        id: knowledgeLibraries.id,
        title: knowledgeLibraries.title,
        slug: knowledgeLibraries.slug,
        description: knowledgeLibraries.description,
        status: knowledgeLibraries.status,
        updatedAt: knowledgeLibraries.updatedAt,
      })
      .from(knowledgeLibraries)
      .where(
        eq(knowledgeLibraries.libraryType, KNOWLEDGE_LIBRARY_TYPE.GLOBAL_MANAGED),
      )
      .orderBy(knowledgeLibraries.title),
    db
      .select({
        libraryId: workspaceLibrarySubscriptions.libraryId,
        status: workspaceLibrarySubscriptions.status,
        searchEnabled: workspaceLibrarySubscriptions.searchEnabled,
        updatedAt: workspaceLibrarySubscriptions.updatedAt,
      })
      .from(workspaceLibrarySubscriptions)
      .where(eq(workspaceLibrarySubscriptions.workspaceId, workspaceId)),
    db.select({
      libraryId: documents.libraryId,
    }).from(documents),
  ]);

  const subscriptionByLibraryId = new Map(
    subscriptions.map((subscription) => [subscription.libraryId, subscription] as const),
  );
  const documentCountByLibraryId = new Map<string, number>();
  for (const row of documentRows) {
    if (!row.libraryId) {
      continue;
    }

    documentCountByLibraryId.set(
      row.libraryId,
      (documentCountByLibraryId.get(row.libraryId) ?? 0) + 1,
    );
  }

  return libraries.map((library) => {
    const subscription = subscriptionByLibraryId.get(library.id) ?? null;

    return {
      ...library,
      documentCount: documentCountByLibraryId.get(library.id) ?? 0,
      subscriptionStatus: subscription?.status ?? null,
      searchEnabled: subscription?.searchEnabled ?? false,
      subscriptionUpdatedAt: subscription?.updatedAt ?? null,
    };
  });
}
