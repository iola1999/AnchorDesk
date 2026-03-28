type WorkspaceOverviewDocument = {
  status: string;
  latestVersion: {
    parseStatus: string;
  } | null;
  latestJob: {
    status: string;
  } | null;
};

type WorkspaceOverviewConversation = {
  status: "active" | "archived";
};

export function isWorkspaceDocumentProcessing(document: WorkspaceOverviewDocument) {
  if (document.latestJob?.status === "queued" || document.latestJob?.status === "running") {
    return true;
  }

  if (!document.latestVersion) {
    return document.status === "uploading" || document.status === "processing";
  }

  return (
    document.latestVersion.parseStatus !== "ready" &&
    document.latestVersion.parseStatus !== "failed"
  );
}

export function isWorkspaceDocumentFailed(document: WorkspaceOverviewDocument) {
  return (
    document.status === "failed" ||
    document.latestJob?.status === "failed" ||
    document.latestVersion?.parseStatus === "failed"
  );
}

export function isWorkspaceDocumentReady(document: WorkspaceOverviewDocument) {
  return !isWorkspaceDocumentProcessing(document) && !isWorkspaceDocumentFailed(document);
}

export function summarizeWorkspaceOverview(input: {
  documents: WorkspaceOverviewDocument[];
  conversations: WorkspaceOverviewConversation[];
  reportsCount: number;
}) {
  const processingDocuments = input.documents.filter(isWorkspaceDocumentProcessing).length;
  const failedDocuments = input.documents.filter(isWorkspaceDocumentFailed).length;
  const readyDocuments = input.documents.filter(isWorkspaceDocumentReady).length;
  const activeConversations = input.conversations.filter(
    (conversation) => conversation.status === "active",
  ).length;
  const archivedConversations = input.conversations.length - activeConversations;

  return {
    totalDocuments: input.documents.length,
    readyDocuments,
    processingDocuments,
    failedDocuments,
    activeConversations,
    archivedConversations,
    reportsCount: input.reportsCount,
    hasKnowledgeReady: readyDocuments > 0,
    hasPendingWork: processingDocuments > 0,
  };
}
