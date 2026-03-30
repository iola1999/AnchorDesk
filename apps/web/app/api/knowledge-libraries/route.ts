import {
  KNOWLEDGE_LIBRARY_TYPE,
} from "@anchordesk/contracts";
import { getDb, knowledgeLibraries } from "@anchordesk/db";

import { auth } from "@/auth";
import {
  buildUniqueKnowledgeLibrarySlug,
  listManagedKnowledgeLibrariesWithStats,
} from "@/lib/api/admin-knowledge-libraries";
import {
  knowledgeLibraryCreateSchema,
  normalizeKnowledgeLibrarySlug,
} from "@/lib/api/knowledge-libraries";
import { ensureKnowledgeLibraryRootDirectory } from "@/lib/api/workspace-directories";
import { isSuperAdminUsername } from "@/lib/auth/super-admin";

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

  if (!isSuperAdminUsername(user.username)) {
    return { error: forbiddenResponse() } as const;
  }

  return { user } as const;
}

export async function GET() {
  const authResult = await requireSuperAdminUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  return Response.json({
    libraries: await listManagedKnowledgeLibrariesWithStats(),
  });
}

export async function POST(request: Request) {
  const authResult = await requireSuperAdminUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = knowledgeLibraryCreateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "资料库参数无效" },
      { status: 400 },
    );
  }

  const db = getDb();
  const baseSlug = normalizeKnowledgeLibrarySlug(parsed.data.slug, parsed.data.title);
  const slug = await buildUniqueKnowledgeLibrarySlug({
    baseSlug,
    db,
  });

  const [library] = await db
    .insert(knowledgeLibraries)
    .values({
      libraryType: KNOWLEDGE_LIBRARY_TYPE.GLOBAL_MANAGED,
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      managedByUserId: authResult.user.id,
    })
    .returning();

  await ensureKnowledgeLibraryRootDirectory(library.id, db);

  return Response.json({ library }, { status: 201 });
}
