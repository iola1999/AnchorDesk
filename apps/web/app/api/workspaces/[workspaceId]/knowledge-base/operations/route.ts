import { z } from "zod";

import { auth } from "@/auth";
import {
  deleteWorkspaceKnowledgeBaseEntries,
  moveWorkspaceKnowledgeBaseEntries,
} from "@/lib/api/knowledge-base-actions";
import { requireOwnedWorkspace } from "@/lib/guards/workspace";

export const runtime = "nodejs";

const idsSchema = z.array(z.string().min(1)).max(200).default([]);

const operationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("move"),
    targetDirectoryId: z.string().min(1, "目标目录不能为空"),
    directoryIds: idsSchema,
    documentIds: idsSchema,
  }),
  z.object({
    action: z.literal("delete"),
    directoryIds: idsSchema,
    documentIds: idsSchema,
  }),
]);

export async function POST(
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
  const parsed = operationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "资料库操作参数无效" },
      { status: 400 },
    );
  }

  try {
    const result =
      parsed.data.action === "move"
        ? await moveWorkspaceKnowledgeBaseEntries({
            workspaceId,
            targetDirectoryId: parsed.data.targetDirectoryId,
            directoryIds: parsed.data.directoryIds,
            documentIds: parsed.data.documentIds,
          })
        : await deleteWorkspaceKnowledgeBaseEntries({
            workspaceId,
            directoryIds: parsed.data.directoryIds,
            documentIds: parsed.data.documentIds,
          });

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "资料库操作失败",
      },
      { status: 400 },
    );
  }
}
