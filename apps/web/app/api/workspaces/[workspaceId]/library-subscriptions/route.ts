import { and, eq } from "drizzle-orm";
import {
  KNOWLEDGE_LIBRARY_STATUS,
  KNOWLEDGE_LIBRARY_TYPE,
  WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS,
} from "@anchordesk/contracts";
import {
  getDb,
  knowledgeLibraries,
  workspaceLibrarySubscriptions,
} from "@anchordesk/db";

import { auth } from "@/auth";
import { workspaceLibrarySubscriptionMutationSchema } from "@/lib/api/knowledge-libraries";
import { requireOwnedWorkspace } from "@/lib/guards/workspace";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await requireOwnedWorkspace(workspaceId, userId);
  if (!workspace) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = workspaceLibrarySubscriptionMutationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "订阅参数无效" },
      { status: 400 },
    );
  }

  const db = getDb();
  const [library] = await db
    .select({
      id: knowledgeLibraries.id,
      status: knowledgeLibraries.status,
      libraryType: knowledgeLibraries.libraryType,
    })
    .from(knowledgeLibraries)
    .where(
      and(
        eq(knowledgeLibraries.id, parsed.data.libraryId),
        eq(
          knowledgeLibraries.libraryType,
          KNOWLEDGE_LIBRARY_TYPE.GLOBAL_MANAGED,
        ),
      ),
    )
    .limit(1);

  if (!library) {
    return Response.json({ error: "Library not found" }, { status: 404 });
  }

  const isRevoked =
    parsed.data.status === WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.REVOKED;
  if (!isRevoked && library.status !== KNOWLEDGE_LIBRARY_STATUS.ACTIVE) {
    return Response.json(
      { error: "Only active global libraries can be subscribed" },
      { status: 409 },
    );
  }

  const [subscription] = await db
    .insert(workspaceLibrarySubscriptions)
    .values({
      workspaceId,
      libraryId: parsed.data.libraryId,
      status: parsed.data.status,
      searchEnabled:
        parsed.data.searchEnabled ??
        parsed.data.status === WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.ACTIVE,
      createdByUserId: userId,
      revokedAt: isRevoked ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [
        workspaceLibrarySubscriptions.workspaceId,
        workspaceLibrarySubscriptions.libraryId,
      ],
      set: {
        status: parsed.data.status,
        searchEnabled:
          parsed.data.searchEnabled ??
          parsed.data.status === WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.ACTIVE,
        revokedAt: isRevoked ? new Date() : null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return Response.json({ subscription });
}
