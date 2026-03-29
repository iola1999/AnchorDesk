const KNOWLEDGE_BASE_ROOT_PATH = "资料库";

function normalizeDirectoryPath(value, fallback = KNOWLEDGE_BASE_ROOT_PATH) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  return normalized || fallback;
}

function getDirectoryName(path) {
  const segments = normalizeDirectoryPath(path).split("/").filter(Boolean);
  return segments[segments.length - 1] ?? KNOWLEDGE_BASE_ROOT_PATH;
}

function listAncestorDirectoryPaths(path) {
  const segments = normalizeDirectoryPath(path).split("/").filter(Boolean);
  return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}

async function ensureDirectoryPath(client, workspaceId, path) {
  const ancestors = listAncestorDirectoryPaths(path);
  let parentId = null;

  for (const ancestorPath of ancestors) {
    const result = await client.query(
      `
        insert into workspace_directories (
          workspace_id,
          parent_id,
          name,
          path,
          created_at,
          updated_at,
          deleted_at
        ) values ($1, $2, $3, $4, now(), now(), null)
        on conflict (workspace_id, path) do update set
          parent_id = excluded.parent_id,
          name = excluded.name,
          deleted_at = null,
          updated_at = now()
        returning id
      `,
      [workspaceId, parentId, getDirectoryName(ancestorPath), ancestorPath],
    );

    parentId = result.rows[0]?.id ?? null;
  }
}

export const workspaceDirectoriesUpgrade = {
  key: "2026-03-workspace-directories-backfill",
  description:
    "Create root directory records and backfill materialized workspace directories from document paths.",
  blocking: true,
  safeInDevStartup: true,
  async run(context) {
    const workspaces = await context.client.query(`select id from workspaces`);
    const documents = await context.client.query(
      `
        select workspace_id, directory_path
        from documents
      `,
    );

    for (const workspace of workspaces.rows) {
      await ensureDirectoryPath(context.client, workspace.id, KNOWLEDGE_BASE_ROOT_PATH);
    }

    for (const row of documents.rows) {
      await ensureDirectoryPath(
        context.client,
        row.workspace_id,
        normalizeDirectoryPath(row.directory_path),
      );
    }

    return {
      workspaceCount: workspaces.rowCount ?? workspaces.rows.length,
      documentCount: documents.rowCount ?? documents.rows.length,
    };
  },
};
