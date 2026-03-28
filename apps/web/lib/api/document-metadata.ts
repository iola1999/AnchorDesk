import { z } from "zod";

export const documentTypeOptions = [
  { value: "contract", label: "合同" },
  { value: "pleading", label: "起诉状" },
  { value: "evidence", label: "证据" },
  { value: "statute", label: "法律法规" },
  { value: "case_law", label: "案例" },
  { value: "memo", label: "备忘录" },
  { value: "email", label: "邮件" },
  { value: "meeting_note", label: "会议纪要" },
  { value: "other", label: "其他" },
] as const;

export const documentTypeValues = documentTypeOptions.map((item) => item.value) as [
  (typeof documentTypeOptions)[number]["value"],
  ...(typeof documentTypeOptions)[number]["value"][],
];

export const documentMetadataPatchSchema = z
  .object({
    title: z.string().min(1).optional(),
    directoryPath: z.string().optional(),
    docType: z.enum(documentTypeValues).optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.directoryPath !== undefined ||
      value.docType !== undefined ||
      value.tags !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export type DocumentMetadataPatch = z.infer<typeof documentMetadataPatchSchema>;
export type DocumentTypeValue = (typeof documentTypeValues)[number];

type CurrentDocumentMetadata = {
  title: string;
  sourceFilename: string;
  directoryPath: string;
  logicalPath: string;
  docType: DocumentTypeValue;
  tags: string[];
};

function arraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function normalizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "");
}

export function normalizeDirectoryPath(value: string, fallback = "资料库") {
  const normalized = value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  return normalized || fallback;
}

export function normalizeDocumentTags(values: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function parseTagsInput(value: string) {
  return normalizeDocumentTags(value.split(/[,\n，]/g));
}

export function buildStoredFilename(title: string, currentSourceFilename: string) {
  const extensionMatch = currentSourceFilename.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1] ?? "";
  const fallbackBaseName = currentSourceFilename.replace(/\.[^.]+$/, "");
  const normalizedTitle = normalizeFilenamePart(title) || fallbackBaseName;

  if (extension && normalizedTitle.toLowerCase().endsWith(extension.toLowerCase())) {
    return normalizedTitle;
  }

  return `${normalizedTitle}${extension}`;
}

export function buildDocumentTitle(sourceFilename: string) {
  return sourceFilename.replace(/\.[^.]+$/, "");
}

export function buildDocumentPath(directoryPath: string, sourceFilename: string) {
  return `${normalizeDirectoryPath(directoryPath)}/${sourceFilename.replace(/^\/+|\/+$/g, "")}`.replace(
    /\/+/g,
    "/",
  );
}

export function buildAnchorLabel(title: string, pageNo: number) {
  return `${title} · 第${pageNo}页`;
}

export function buildMessageCitationLabel(documentPath: string, pageNo: number) {
  return `${documentPath} · 第${pageNo}页`;
}

export function buildDocumentMetadataUpdate(
  current: CurrentDocumentMetadata,
  patch: DocumentMetadataPatch,
) {
  const sourceFilename =
    patch.title !== undefined
      ? buildStoredFilename(patch.title, current.sourceFilename)
      : current.sourceFilename;
  const title = buildDocumentTitle(sourceFilename);
  const directoryPath =
    patch.directoryPath !== undefined
      ? normalizeDirectoryPath(patch.directoryPath, current.directoryPath)
      : current.directoryPath;
  const logicalPath = buildDocumentPath(directoryPath, sourceFilename);
  const docType = patch.docType ?? current.docType;
  const tags = patch.tags ? normalizeDocumentTags(patch.tags) : current.tags;

  const pathChanged =
    sourceFilename !== current.sourceFilename ||
    directoryPath !== current.directoryPath ||
    logicalPath !== current.logicalPath;
  const searchPayloadChanged =
    pathChanged ||
    docType !== current.docType ||
    !arraysEqual(tags, current.tags);
  const metadataChanged =
    title !== current.title ||
    pathChanged ||
    docType !== current.docType ||
    !arraysEqual(tags, current.tags);

  return {
    title,
    sourceFilename,
    directoryPath,
    logicalPath,
    docType,
    tags,
    pathChanged,
    metadataChanged,
    searchPayloadChanged,
  };
}
