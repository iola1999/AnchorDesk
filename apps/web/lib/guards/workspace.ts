import { and, eq } from "drizzle-orm";

import { getDb, workspaces } from "@knowledge-assistant/db";

export async function requireOwnedWorkspace(workspaceId: string, userId: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);

  return result[0] ?? null;
}
