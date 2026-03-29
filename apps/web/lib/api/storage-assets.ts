export function resolveStorageKeysToDelete(input: {
  referencedStorageKeys: string[];
  deletingStorageKeys: string[];
}) {
  const referencedCounts = new Map<string, number>();
  for (const key of input.referencedStorageKeys) {
    referencedCounts.set(key, (referencedCounts.get(key) ?? 0) + 1);
  }

  const deletingCounts = new Map<string, number>();
  for (const key of input.deletingStorageKeys) {
    deletingCounts.set(key, (deletingCounts.get(key) ?? 0) + 1);
  }

  return [...deletingCounts.keys()].filter(
    (key) => (referencedCounts.get(key) ?? 0) <= (deletingCounts.get(key) ?? 0),
  );
}
