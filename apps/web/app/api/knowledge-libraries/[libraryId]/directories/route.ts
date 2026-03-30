import { z } from "zod";

import { auth } from "@/auth";
import { findManagedKnowledgeLibrary } from "@/lib/api/admin-knowledge-libraries";
import { createKnowledgeLibraryDirectory } from "@/lib/api/knowledge-library-actions";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const runtime = "nodejs";

const createDirectorySchema = z.object({
  parentDirectoryId: z.string().min(1, "父目录不能为空"),
  name: z.string().trim().min(1, "目录名称不能为空").max(255, "目录名称不能超过 255 个字符"),
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
  if (library.status === "archived") {
    return Response.json({ error: "Archived libraries are read-only" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDirectorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "创建目录参数无效" },
      { status: 400 },
    );
  }

  try {
    const directory = await createKnowledgeLibraryDirectory({
      libraryId,
      parentDirectoryId: parsed.data.parentDirectoryId,
      name: parsed.data.name,
    });

    return Response.json({ directory }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "创建目录失败",
      },
      { status: 400 },
    );
  }
}
