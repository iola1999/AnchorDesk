import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCitationLocator, PARSE_STATUS } from "@knowledge-assistant/contracts";

import {
  citationAnchors,
  documentBlocks,
  documentJobs,
  documents,
  documentVersions,
  getDb,
  workspaces,
} from "@knowledge-assistant/db";

import { auth } from "@/auth";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { DocumentJobPanel } from "@/components/documents/document-job-panel";
import { DocumentMetadataForm } from "@/components/documents/document-metadata-form";
import { PdfViewer } from "@/components/documents/pdf-viewer";
import { readCitationLocator } from "@/lib/api/document-metadata";
import { buildDocumentViewerPages } from "@/lib/api/document-view";
import { documentTypeOptions } from "@/lib/api/document-metadata";
import { cn, ui } from "@/lib/ui";

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string; documentId: string }>;
  searchParams: Promise<{ anchorId?: string; page?: string }>;
}) {
  const { workspaceId, documentId } = await params;
  const { anchorId, page } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const db = getDb();

  const workspace = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.userId, userId),
        isNull(workspaces.archivedAt),
      ),
    )
    .limit(1);

  if (!workspace[0]) {
    notFound();
  }

  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)))
    .limit(1);

  if (!doc[0]) {
    notFound();
  }

  const versions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId));

  const latestVersion = doc[0].latestVersionId
    ? versions.find((version) => version.id === doc[0].latestVersionId) ?? null
    : versions[versions.length - 1] ?? null;

  const latestJob = latestVersion
    ? (
        await db
          .select()
          .from(documentJobs)
          .where(eq(documentJobs.documentVersionId, latestVersion.id))
          .limit(1)
      )[0] ?? null
    : null;

  let anchor: {
    documentPath: string;
    pageNo: number;
    anchorLabel: string;
    anchorText: string;
  } | null = null;
  let blocks: Array<{
    id: string;
    pageNo: number;
    orderIndex: number;
    blockType: string;
    text: string;
    headingPath: string[] | null;
    sectionLabel: string | null;
    metadataJson?: Record<string, unknown> | null;
  }> = [];
  let pageAnchors: Array<{
    id: string;
    pageNo: number;
    blockId: string | null;
    anchorText: string;
    anchorLabel: string;
  }> = [];

  if (latestVersion) {
    [anchor, blocks, pageAnchors] = await Promise.all([
      anchorId
        ? db
            .select({
              documentPath: citationAnchors.documentPath,
              pageNo: citationAnchors.pageNo,
              anchorLabel: citationAnchors.anchorLabel,
              anchorText: citationAnchors.anchorText,
            })
            .from(citationAnchors)
            .where(
              and(
                eq(citationAnchors.id, anchorId),
                eq(citationAnchors.documentId, documentId),
              ),
            )
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      db
        .select({
          id: documentBlocks.id,
          pageNo: documentBlocks.pageNo,
          orderIndex: documentBlocks.orderIndex,
          blockType: documentBlocks.blockType,
          text: documentBlocks.text,
          headingPath: documentBlocks.headingPath,
          sectionLabel: documentBlocks.sectionLabel,
          metadataJson: documentBlocks.metadataJson,
        })
        .from(documentBlocks)
        .where(eq(documentBlocks.documentVersionId, latestVersion.id)),
      db
        .select({
          id: citationAnchors.id,
          pageNo: citationAnchors.pageNo,
          blockId: citationAnchors.blockId,
          anchorText: citationAnchors.anchorText,
          anchorLabel: citationAnchors.anchorLabel,
        })
        .from(citationAnchors)
        .where(eq(citationAnchors.documentVersionId, latestVersion.id)),
    ]);
  }

  const viewerPages = buildDocumentViewerPages({
    blocks,
    anchors: pageAnchors,
    highlightedAnchorId: anchorId,
  });
  const requestedPage = Number.parseInt(page ?? "", 10);
  const docTypeLabel =
    documentTypeOptions.find((item) => item.value === doc[0].docType)?.label ?? doc[0].docType;
  const tags = doc[0].tagsJson ?? [];
  const canRenderPdf = doc[0].mimeType.includes("pdf") && Boolean(latestVersion);

  return (
    <div className={cn(ui.page, "max-w-[1440px]")}>
      {/* 顶部标题区，去除了笨重的 panelLarge，改为通栏透明底带底边框 */}
      <div className="mb-2 grid gap-5 border-b border-app-border/40 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-app-text">{doc[0].title}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-[15px] text-app-muted-strong">
              <span>{doc[0].logicalPath}</span>
              <span className="text-app-border-strong px-0.5">•</span>
              <span className="inline-flex items-center rounded-full bg-app-surface-strong px-2.5 py-0.5 text-xs font-medium text-app-text">
                {doc[0].status}
              </span>
              {latestVersion ? (
                <>
                  <span className="text-app-border-strong px-0.5">•</span>
                  <span>v{latestVersion.version}</span>
                  <span className="text-app-border-strong px-0.5">•</span>
                  <span>{latestVersion.parseStatus}</span>
                  {latestJob && latestJob.stage && latestJob.progress !== null ? (
                    <>
                      <span className="text-app-border-strong px-0.5">•</span>
                      <span>
                        {latestJob.stage} {latestJob.progress}%
                      </span>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
            {tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full border border-app-border bg-app-surface-soft px-2 py-0.5 text-[13px] text-app-muted-strong">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-end">
            <DeleteDocumentButton workspaceId={workspaceId} documentId={documentId} />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
        {/* 左侧主内容区：阅读器与解析内容 */}
        <div className="grid min-w-0 gap-6">
          {canRenderPdf ? (
            <PdfViewer
              fileUrl={`/api/workspaces/${workspaceId}/documents/${documentId}/content`}
              title={doc[0].title}
              initialPage={anchor?.pageNo ?? (Number.isFinite(requestedPage) ? requestedPage : 1)}
              highlightedText={anchor?.anchorText ?? ""}
            />
          ) : null}
          
          {anchor ? (
            <div className="grid gap-2 rounded-2xl border border-app-accent/20 bg-app-accent/5 p-4 mix-blend-multiply">
              <h3 className="text-[13px] font-semibold text-app-accent">当前引用定位：{anchor.anchorLabel}</h3>
              <p className="text-[14px] leading-relaxed text-app-text">{anchor.anchorText}</p>
            </div>
          ) : null}

          <div className="grid gap-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-[15px] font-semibold text-app-text">解析内容区块</h3>
              <span className="text-[13px] text-app-muted">
                {viewerPages.length > 0
                  ? `共 ${viewerPages.length} 页`
                  : latestVersion?.parseStatus === PARSE_STATUS.READY
                    ? "暂无解析内容"
                    : "等待解析完成"}
              </span>
            </div>
            {viewerPages.length > 0 ? (
              viewerPages.map((page) => (
                <section
                  key={page.pageNo}
                  className="grid gap-3 rounded-2xl border border-app-border/60 bg-white/40 p-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <strong className="text-[14px] text-app-text">第 {page.pageNo} 页</strong>
                    <span className="text-[12px] text-app-muted">{page.anchors.length} 条引用锚点</span>
                  </div>
                  {page.anchors.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {page.anchors.map((item) => (
                         <Link
                          key={item.id}
                          href={`/workspaces/${workspaceId}/documents/${documentId}?anchorId=${item.id}`}
                          className={cn(
                            "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[12px] transition hover:-translate-y-px",
                            item.isHighlighted
                              ? "border-app-accent/30 bg-app-accent/10 text-app-accent"
                              : "border-app-border/80 bg-white hover:border-app-border-strong text-app-muted-strong",
                          )}
                        >
                          {item.anchorLabel}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    {page.blocks.map((block) => (
                      <article
                        key={block.id}
                        className={cn(
                          "grid gap-2 rounded-xl border p-3.5 transition-all",
                          block.isHighlighted
                            ? "border-app-accent/40 bg-white shadow-soft ring-1 ring-app-accent/10 relative z-10"
                            : "border-app-border/60 bg-white/70 hover:bg-white hover:border-app-border",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-app-text text-[13px] font-medium">{block.blockType}</strong>
                          <span className={ui.muted}>
                            {block.sectionLabel ?? block.headingPath.at(-1) ?? "正文"}
                            {block.anchorCount > 0 ? ` · ${block.anchorCount} 个引用` : ""}
                            {formatCitationLocator(
                              readCitationLocator(
                                (block.metadataJson as Record<string, unknown> | null | undefined) ??
                                  null,
                              ),
                            )
                              ? ` · ${formatCitationLocator(
                                  readCitationLocator(
                                    (block.metadataJson as
                                      | Record<string, unknown>
                                      | null
                                      | undefined) ?? null,
                                  ),
                                )}`
                              : ""}
                          </span>
                        </div>
                        {block.headingPath.length > 0 ? (
                          <div className={cn(ui.muted, "text-[13px]")}>
                            {block.headingPath.join(" / ")}
                          </div>
                        ) : null}
                        <div className="leading-6 text-[14px] text-app-text">{block.text}</div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className={cn(ui.muted, "py-12 text-center text-[13px]")}>
                {latestVersion?.parseStatus === PARSE_STATUS.READY
                  ? "未提取出文本内容"
                  : "当前还没有可展示的解析内容。若状态仍在处理中，稍后刷新即可。"}
              </p>
            )}
          </div>
        </div>

        {/* 右侧边栏：状态、属性、版本 */}
        <div className="grid w-full shrink-0 gap-5">
          <DocumentJobPanel job={latestJob} />
          
          <div className="sticky top-6 grid gap-5">
            <DocumentMetadataForm
              workspaceId={workspaceId}
              document={{
                id: documentId,
                title: doc[0].title,
                directoryPath: doc[0].directoryPath,
                docType: doc[0].docType,
                tags,
              }}
            />
            
            <div className="grid gap-3 rounded-2xl border border-app-border/60 bg-white/50 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between pb-1 border-b border-app-border/40">
                <h3 className="text-[14px] font-semibold text-app-text">版本历史</h3>
              </div>
              <ul className="grid gap-2">
                {versions.map((version, idx) => (
                  <li key={version.id} className="flex flex-col gap-1 rounded-xl border border-app-border/60 bg-white/70 px-3 py-2.5 transition hover:bg-white">
                    <div className="flex items-center justify-between">
                      <strong className="text-[13px] font-medium text-app-text">v{version.version} {idx === versions.length - 1 && "(当前)"}</strong>
                      <span className="inline-flex items-center rounded-md bg-app-surface-soft px-1.5 py-0.5 text-[11px] font-medium text-app-muted-strong border border-app-border/40">
                        {version.parseStatus}
                      </span>
                    </div>
                    {version.sha256 ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-app-muted/80">SHA</span>
                        <div className="truncate text-[11px] font-mono text-app-muted" title={version.sha256}>
                          {version.sha256}
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
