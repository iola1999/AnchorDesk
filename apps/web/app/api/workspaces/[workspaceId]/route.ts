import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, workspaces } from "@law-doc/db";

import { auth } from "@/auth";

export const runtime = "nodejs";

const workspacePatchSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200).optional(),
  description: z.string().trim().max(500).optional(),
  industry: z.string().trim().max(80).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const result = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);

  if (!result[0]) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  return Response.json({ workspace: result[0] });
}

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

  const db = getDb();
  const result = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);

  const workspace = result[0];
  if (!workspace) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = workspacePatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid workspace patch" },
      { status: 400 },
    );
  }

  const nextData = parsed.data;
  const [updatedWorkspace] = await db
    .update(workspaces)
    .set({
      title: nextData.title ?? workspace.title,
      description: nextData.description ?? workspace.description,
      industry: nextData.industry ?? workspace.industry,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  return Response.json({ workspace: updatedWorkspace });
}
