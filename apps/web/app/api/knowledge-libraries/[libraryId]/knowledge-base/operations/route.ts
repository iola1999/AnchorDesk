import { z } from "zod";

import { auth } from "@/auth";
import { findManagedKnowledgeLibrary } from "@/lib/api/admin-knowledge-libraries";
import {
  deleteKnowledgeLibraryEntries,
  moveKnowledgeLibraryEntries,
} from "@/lib/api/knowledge-library-actions";
import { isSuperAdmin } from "@/lib/auth/super-admin";

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
  if (library.status === "archived") {
    return Response.json({ error: "Archived libraries are read-only" }, { status: 409 });
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
        ? await moveKnowledgeLibraryEntries({
            libraryId,
            targetDirectoryId: parsed.data.targetDirectoryId,
            directoryIds: parsed.data.directoryIds,
            documentIds: parsed.data.documentIds,
          })
        : await deleteKnowledgeLibraryEntries({
            libraryId,
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
