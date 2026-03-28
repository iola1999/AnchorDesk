import { canRetryDocumentJob, describeDocumentJobFailure } from "@/lib/api/document-jobs";
import { RetryDocumentJobButton } from "@/components/workspaces/retry-document-job-button";
import { ManualRefreshButton } from "@/components/workspaces/manual-refresh-button";

export function DocumentJobPanel({
  job,
}: {
  job: {
    id: string;
    stage: string;
    status: string;
    progress: number;
    errorCode?: string | null;
    errorMessage?: string | null;
    updatedAt: Date;
    startedAt?: Date | null;
    finishedAt?: Date | null;
  } | null;
}) {
  if (!job) {
    return null;
  }

  return (
    <div className="card stack">
      <div className="toolbar">
        <div>
          <h3>任务详情</h3>
          <p className="muted">
            {job.stage} · {job.status} · {job.progress}%
          </p>
        </div>
        <ManualRefreshButton />
      </div>
      <div className="stack">
        <p className="muted">更新时间：{job.updatedAt.toLocaleString("zh-CN")}</p>
        {job.startedAt ? (
          <p className="muted">开始时间：{job.startedAt.toLocaleString("zh-CN")}</p>
        ) : null}
        {job.finishedAt ? (
          <p className="muted">结束时间：{job.finishedAt.toLocaleString("zh-CN")}</p>
        ) : null}
        {job.status === "failed" ? (
          <p className="error">
            {describeDocumentJobFailure({
              stage: job.stage,
              errorCode: job.errorCode,
              errorMessage: job.errorMessage,
            })}
          </p>
        ) : null}
      </div>
      {canRetryDocumentJob(job) ? <RetryDocumentJobButton jobId={job.id} /> : null}
    </div>
  );
}
