import {
  buildDirectoryPath,
  getDirectoryName,
  isSameOrDescendantPath,
  normalizeDirectoryPath,
} from "./directory-paths";
import { buildDocumentPath } from "./document-metadata";

type SelectedDirectory = {
  id: string;
  path: string;
  name?: string;
};

type SelectedDocument = {
  id: string;
  logicalPath: string;
  directoryPath: string;
  sourceFilename: string;
};

function sortByPathDepth<T extends { path: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const depthDiff = left.path.split("/").length - right.path.split("/").length;
    if (depthDiff !== 0) {
      return depthDiff;
    }

    return left.path.localeCompare(right.path, "zh-CN");
  });
}

export function compactKnowledgeBaseSelection(input: {
  directories: SelectedDirectory[];
  documents: SelectedDocument[];
}) {
  const directories = sortByPathDepth(
    input.directories.map((directory) => ({
      ...directory,
      path: normalizeDirectoryPath(directory.path),
    })),
  ).filter((directory, index, directories) => {
    return !directories.some(
      (candidate, candidateIndex) =>
        candidateIndex < index && isSameOrDescendantPath(directory.path, candidate.path),
    );
  });

  const documents = input.documents.filter((document) => {
    return !directories.some((directory) =>
      isSameOrDescendantPath(document.directoryPath, directory.path),
    );
  });

  return {
    directories,
    documents,
  };
}

export function buildDirectoryMovePlan(
  directories: SelectedDirectory[],
  targetDirectoryPath: string,
) {
  const normalizedTargetPath = normalizeDirectoryPath(targetDirectoryPath);
  const compactedDirectories = compactKnowledgeBaseSelection({
    directories,
    documents: [],
  }).directories;

  return compactedDirectories.map((directory) => {
    if (isSameOrDescendantPath(normalizedTargetPath, directory.path)) {
      throw new Error("不能把目录移动到它自身或子目录中");
    }

    return {
      id: directory.id,
      fromPath: directory.path,
      toPath: buildDirectoryPath(
        normalizedTargetPath,
        directory.name ?? getDirectoryName(directory.path),
      ),
    };
  });
}

export function buildDocumentMovePlan(
  documents: SelectedDocument[],
  targetDirectoryPath: string,
) {
  const normalizedTargetPath = normalizeDirectoryPath(targetDirectoryPath);

  return documents.map((document) => ({
    id: document.id,
    fromLogicalPath: document.logicalPath,
    toDirectoryPath: normalizedTargetPath,
    toLogicalPath: buildDocumentPath(normalizedTargetPath, document.sourceFilename),
  }));
}
