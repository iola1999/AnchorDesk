import { z } from "zod";

import { auth } from "@/auth";
import { createWorkspaceDirectory } from "@/lib/api/knowledge-base-actions";
import { requireOwnedWorkspace } from "@/lib/guards/workspace";

export const runtime = "nodejs";

const createDirectorySchema = z.object({
  parentDirectoryId: z.string().min(1, "父目录不能为空"),
  name: z.string().trim().min(1, "目录名称不能为空").max(255, "目录名称不能超过 255 个字符"),
});

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
  const parsed = createDirectorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "创建目录参数无效" },
      { status: 400 },
    );
  }

  try {
    const directory = await createWorkspaceDirectory({
      workspaceId,
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
