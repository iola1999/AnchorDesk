import Link from "next/link";

import { EditorialPageHeader } from "@/components/shared/editorial-page-header";
import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";
import { buttonStyles, cn, ui } from "@/lib/ui";

export default function NewWorkspacePage() {
  return (
    <div className={cn(ui.pageNarrow, "min-h-screen max-w-[920px] gap-4 py-6")}>
      <EditorialPageHeader
        title="新建工作空间"
        description="创建空间并设置统一回答约束"
        actions={
          <Link
            href="/workspaces"
            className={cn(
              buttonStyles({ variant: "secondary", size: "sm" }),
              "border border-[color:color-mix(in_srgb,var(--outline-variant)_18%,transparent)] bg-app-surface-low/92 shadow-none hover:bg-app-surface",
            )}
          >
            返回空间列表
          </Link>
        }
      />
      <CreateWorkspaceForm />
    </div>
  );
}
