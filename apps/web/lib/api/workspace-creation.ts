import { slugify } from "./slug";
import { normalizeWorkspacePrompt } from "./workspace-prompt";

type CreateWorkspaceInput = {
  userId: string;
  title: string;
  industry?: string;
  workspacePrompt?: string;
};

type CreateWorkspaceDeps<TWorkspace> = {
  slugExists: (slug: string) => Promise<boolean>;
  insertWorkspace: (values: {
    userId: string;
    slug: string;
    title: string;
    industry: string | null;
    workspacePrompt: string | null;
  }) => Promise<TWorkspace>;
};

export async function createWorkspace<TWorkspace>(
  input: CreateWorkspaceInput,
  deps: CreateWorkspaceDeps<TWorkspace>,
) {
  const baseSlug = slugify(input.title) || "workspace";
  let slug = baseSlug;
  let suffix = 1;

  while (await deps.slugExists(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return deps.insertWorkspace({
    userId: input.userId,
    slug,
    title: input.title,
    industry: input.industry?.trim() || null,
    workspacePrompt: normalizeWorkspacePrompt(input.workspacePrompt),
  });
}
