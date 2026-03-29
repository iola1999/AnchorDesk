export const KNOWLEDGE_BASE_ROOT_PATH = "资料库";

export type DerivedDirectoryRecord = {
  name: string;
  path: string;
  parentPath: string | null;
};

export function normalizeDirectoryPath(
  value: string,
  fallback = KNOWLEDGE_BASE_ROOT_PATH,
) {
  const normalized = value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  return normalized || fallback;
}

export function getPathSegments(path: string) {
  return normalizeDirectoryPath(path)
    .split("/")
    .filter(Boolean);
}

export function getDirectoryName(path: string) {
  const segments = getPathSegments(path);
  return segments[segments.length - 1] ?? KNOWLEDGE_BASE_ROOT_PATH;
}

export function getParentDirectoryPath(path: string) {
  const segments = getPathSegments(path);
  if (segments.length <= 1) {
    return null;
  }

  return segments.slice(0, -1).join("/");
}

export function buildDirectoryPath(parentPath: string | null, name: string) {
  const normalizedName = name
    .trim()
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\/+|\/+$/g, "");

  if (!normalizedName) {
    return normalizeDirectoryPath(parentPath ?? KNOWLEDGE_BASE_ROOT_PATH);
  }

  return parentPath
    ? normalizeDirectoryPath(`${parentPath}/${normalizedName}`)
    : normalizeDirectoryPath(normalizedName);
}

export function listAncestorDirectoryPaths(path: string) {
  const segments = getPathSegments(path);
  return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}

export function buildDirectoryRecordsFromDocumentPaths(paths: string[]) {
  const seen = new Set<string>();
  const records: DerivedDirectoryRecord[] = [];

  for (const sourcePath of paths) {
    const normalizedPath = normalizeDirectoryPath(sourcePath);
    const segments = normalizedPath.split("/");
    const directorySegments = segments.slice(0, -1);

    directorySegments.forEach((_, index) => {
      const path = directorySegments.slice(0, index + 1).join("/");
      if (!path || seen.has(path)) {
        return;
      }

      seen.add(path);
      records.push({
        name: directorySegments[index] ?? KNOWLEDGE_BASE_ROOT_PATH,
        path,
        parentPath: index === 0 ? null : directorySegments.slice(0, index).join("/"),
      });
    });
  }

  return records.sort((left, right) => {
    const depthDiff = left.path.split("/").length - right.path.split("/").length;
    if (depthDiff !== 0) {
      return depthDiff;
    }

    return left.path.localeCompare(right.path, "zh-CN");
  });
}

export function isSameOrDescendantPath(path: string, ancestorPath: string) {
  const normalizedPath = normalizeDirectoryPath(path);
  const normalizedAncestor = normalizeDirectoryPath(ancestorPath);

  return (
    normalizedPath === normalizedAncestor ||
    normalizedPath.startsWith(`${normalizedAncestor}/`)
  );
}

export function replacePathPrefix(
  path: string,
  fromPrefix: string,
  toPrefix: string,
) {
  const normalizedPath = normalizeDirectoryPath(path);
  const normalizedFrom = normalizeDirectoryPath(fromPrefix);
  const normalizedTo = normalizeDirectoryPath(toPrefix);

  if (normalizedPath === normalizedFrom) {
    return normalizedTo;
  }

  if (!normalizedPath.startsWith(`${normalizedFrom}/`)) {
    return normalizedPath;
  }

  return `${normalizedTo}${normalizedPath.slice(normalizedFrom.length)}`;
}
