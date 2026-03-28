export function resolveWorkspaceArchivedAt(input: {
  archived?: boolean;
  currentArchivedAt?: Date | null;
  now?: Date;
}) {
  if (input.archived === undefined) {
    return input.currentArchivedAt ?? null;
  }

  if (input.archived) {
    return input.currentArchivedAt ?? input.now ?? new Date();
  }

  return null;
}

export function isWorkspaceArchived(archivedAt: Date | null | undefined) {
  return archivedAt instanceof Date;
}
