import { and, eq } from "drizzle-orm";

import {
  getDb,
  knowledgeLibraries,
} from "@anchordesk/db";

import { auth } from "@/auth";
import {
  buildUniqueKnowledgeLibrarySlug,
  findManagedKnowledgeLibrary,
  loadManagedKnowledgeLibrarySummary,
} from "@/lib/api/admin-knowledge-libraries";
import {
  knowledgeLibraryPatchSchema,
  normalizeKnowledgeLibrarySlug,
} from "@/lib/api/knowledge-libraries";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const runtime = "nodejs";

function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

async function requireSuperAdminUser() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return { error: unauthorizedResponse() } as const;
  }

  if (!isSuperAdmin(user)) {
    return { error: forbiddenResponse() } as const;
  }

  return { user } as const;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ libraryId: string }> },
) {
  const authResult = await requireSuperAdminUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { libraryId } = await params;
  const library = await loadManagedKnowledgeLibrarySummary(libraryId);

  if (!library) {
    return Response.json({ error: "Library not found" }, { status: 404 });
  }

  return Response.json({ library });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ libraryId: string }> },
) {
  const authResult = await requireSuperAdminUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { libraryId } = await params;
  const existingLibrary = await findManagedKnowledgeLibrary(libraryId);

  if (!existingLibrary) {
    return Response.json({ error: "Library not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = knowledgeLibraryPatchSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "资料库参数无效" },
      { status: 400 },
    );
  }

  const db = getDb();
  const title = parsed.data.title ?? existingLibrary.title;
  const slug =
    parsed.data.slug !== undefined || parsed.data.title !== undefined
      ? await buildUniqueKnowledgeLibrarySlug({
          baseSlug: normalizeKnowledgeLibrarySlug(
            parsed.data.slug ?? existingLibrary.slug,
            title,
          ),
          excludeLibraryId: libraryId,
          db,
        })
      : existingLibrary.slug;

  const [library] = await db
    .update(knowledgeLibraries)
    .set({
      title,
      slug,
      description:
        parsed.data.description !== undefined
          ? parsed.data.description || null
          : existingLibrary.description,
      status: parsed.data.status ?? existingLibrary.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeLibraries.id, libraryId),
        eq(knowledgeLibraries.id, existingLibrary.id),
      ),
    )
    .returning();

  return Response.json({ library });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ libraryId: string }> },
) {
  const authResult = await requireSuperAdminUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { libraryId } = await params;
  const library = await loadManagedKnowledgeLibrarySummary(libraryId);

  if (!library) {
    return Response.json({ error: "Library not found" }, { status: 404 });
  }

  if (library.documentCount > 0 || library.subscriptionCount > 0) {
    return Response.json(
      {
        error: "请先清空资料并移除订阅，或改为归档资料库",
      },
      { status: 409 },
    );
  }

  await getDb().delete(knowledgeLibraries).where(eq(knowledgeLibraries.id, libraryId));

  return Response.json({ ok: true });
}
