import Link from "next/link";

import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";

export default function NewWorkspacePage() {
  return (
    <div className="workspace-create-page">
      <div className="workspace-create-copy stack">
        <p className="workspace-panel-eyebrow">Create Space</p>
        <h1>创建一个新的工作空间</h1>
        <p className="muted">
          一个空间对应一组资料、历史会话和生成结果。先把主题边界定义清楚，后续助手输出会更稳定。
        </p>
        <Link href="/workspaces" className="assistant-secondary-link">
          返回空间列表
        </Link>
      </div>
      <CreateWorkspaceForm />
    </div>
  );
}
