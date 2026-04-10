# Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire web app around the new editorial design system while keeping the existing workspace/chat/upload/citation/permission behavior intact.

**Architecture:** Replace the visual foundation first: tokens, fonts, shared surfaces, buttons, fields, navigation, and shell scaffolds. Then sweep page families in this order: workspace family, knowledge-base/settings surfaces, management family, auth/public family. Keep business state and API wiring unchanged; only introduce small shared UI components where they reduce repeated page chrome.

**Tech Stack:** Next.js App Router, React, Tailwind CSS utility classes, shared UI helpers in `apps/web/lib/ui.ts`, Vitest, jsdom component tests

---

## Planned File Map

- `apps/web/app/globals.css`
  - Replace the old warm-paper tokens with the editorial token set and add the new headline/body font stacks.
- `apps/web/lib/ui.ts`
  - Redefine shared surfaces, buttons, fields, chips, navigation helpers, and page/header scaffolds.
- `apps/web/lib/ui.test.ts`
  - Lock the new shared visual contract so downstream page work can reuse the same primitives safely.
- `apps/web/components/shared/editorial-page-header.tsx`
  - New shared page hero/header for workspace and management pages.
- `apps/web/components/shared/auth-shell.tsx`
  - New shared auth frame used by `/login` and `/register`.
- `apps/web/components/shared/public-page-shell.tsx`
  - New shared public reading frame used by `/share/[shareToken]`.
- `apps/web/components/shared/settings-shell.tsx`
  - Upgrade the current management shell to the new editorial layout.
- `apps/web/components/workspaces/workspace-shell-frame.tsx`
  - Replace the old warm card/sidebar language with the editorial workspace shell.
- `apps/web/components/chat/**`
  - Re-skin chat, composer, process timeline, and empty state without changing submit/stream/retry behavior.
- `apps/web/components/workspaces/knowledge-base-explorer.tsx`
  - Re-skin the knowledge-base toolbar, list/table shell, mounted-library area, and modals without touching upload/DnD/task logic.
- `apps/web/components/settings/**`
  - Apply the management-family shell and page header to settings/admin screens.
- `apps/web/components/account/account-settings-workbench.tsx`
  - Align account settings with the redesigned management family.
- `apps/web/app/(dashboard)/**/page.tsx`
  - Sweep workspace, document, report, settings, admin, and account pages onto the new shell language.
- `apps/web/app/(auth)/**/page.tsx`
  - Switch auth pages to the new auth frame.
- `apps/web/app/share/[shareToken]/page.tsx`
  - Switch public share page to the new public frame.
- `.impeccable.md`
  - Replace the old visual system rules with the editorial system that the code now implements.
- `docs/anchor-desk-nextjs-app-structure.md`
  - Update shell-family and shared-UI documentation if the new shared frame components are introduced.

### Task 1: Rebuild Global Editorial Tokens And Core Primitives

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/lib/ui.ts`
- Modify: `apps/web/lib/ui.test.ts`
- Modify: `apps/web/components/shared/popover.tsx`
- Modify: `apps/web/components/shared/modal-shell.tsx`
- Modify: `apps/web/components/shared/action-dialog.tsx`

- [ ] **Step 1: Write the failing shared-UI tests**

```ts
import { describe, expect, it } from "vitest";

import { buttonStyles, inputStyles, navItemStyles, ui } from "./ui";

describe("editorial primitives", () => {
  it("uses the new integrated secondary button instead of the outlined warm variant", () => {
    const classes = buttonStyles({ variant: "secondary", size: "sm" });

    expect(classes).toContain("bg-app-surface-lowest");
    expect(classes).toContain("text-app-secondary");
    expect(classes).not.toContain("border-app-border bg-white/90");
  });

  it("uses low-surface filled fields and lighter corners", () => {
    const classes = inputStyles();

    expect(classes).toContain("bg-app-surface-low");
    expect(classes).toContain("rounded-[12px]");
    expect(classes).not.toContain("rounded-[20px]");
  });

  it("marks selected nav items with an anchor-line treatment instead of a raised white pill", () => {
    const classes = navItemStyles({ selected: true });

    expect(classes).toContain("before:w-[2px]");
    expect(classes).toContain("text-app-text");
    expect(classes).not.toContain("shadow-soft");
  });

  it("exposes the new editorial surface helpers", () => {
    expect(ui.panel).toContain("bg-app-surface-lowest");
    expect(ui.panel).toContain("rounded-[16px]");
    expect(ui.popover).toContain("backdrop-blur-xl");
    expect(ui.toolbar).toContain("bg-app-surface-low");
  });
});
```

- [ ] **Step 2: Run the shared-UI tests to confirm they fail**

Run: `pnpm vitest run apps/web/lib/ui.test.ts`

Expected: FAIL because `buttonStyles()`, `inputStyles()`, `navItemStyles()`, and `ui.panel` still return the old warm-card contract.

- [ ] **Step 3: Replace the token layer and shared helper contract**

Update `apps/web/app/globals.css` to define the editorial tokens and fonts:

```css
:root {
  --bg: #f7f9fb;
  --surface-low: #f2f4f6;
  --surface: #eceef0;
  --surface-high: #e6e8ea;
  --surface-lowest: #ffffff;
  --text: #191c1e;
  --secondary: #565e74;
  --accent-beige: #f0e0cb;
  --outline-variant: #c6c6cd;
  --secondary-fixed: #dae2fd;
  --font-sans: "Inter", "PingFang SC", "Hiragino Sans GB", "Source Han Sans SC", sans-serif;
  --font-headline: "Manrope", "PingFang SC", "Hiragino Sans GB", "Source Han Sans SC", sans-serif;
}

@theme inline {
  --color-app-bg: var(--bg);
  --color-app-surface-low: var(--surface-low);
  --color-app-surface: var(--surface);
  --color-app-surface-high: var(--surface-high);
  --color-app-surface-lowest: var(--surface-lowest);
  --color-app-secondary: var(--secondary);
  --color-app-outline-variant: var(--outline-variant);
  --color-app-secondary-fixed: var(--secondary-fixed);
  --font-headline: var(--font-headline);
}

h1,
h2,
h3 {
  font-family: var(--font-headline);
}
```

Update `apps/web/lib/ui.ts` to point primitives at the new contract:

```ts
export const ui = {
  page: "mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 md:px-8 md:py-10",
  panel:
    "rounded-[16px] bg-app-surface-lowest px-6 py-6 shadow-[0_24px_60px_rgba(25,28,30,0.05)]",
  panelLarge:
    "rounded-[16px] bg-app-surface-lowest px-8 py-8 shadow-[0_28px_70px_rgba(25,28,30,0.05)]",
  popover:
    "rounded-[16px] border border-[color:color-mix(in_srgb,var(--outline-variant)_12%,transparent)] bg-white/70 p-1.5 shadow-[0_20px_60px_rgba(25,28,30,0.06)] backdrop-blur-xl",
  toolbar:
    "flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-app-surface-low px-4 py-3",
};

export function inputStyles() {
  return cn(
    textSelectionStyles.content,
    "w-full rounded-[12px] border border-transparent bg-app-surface-low text-app-text outline-none transition placeholder:text-app-secondary focus:border-[color:color-mix(in_srgb,var(--outline-variant)_24%,transparent)] focus:bg-app-surface-lowest",
    "h-11 px-3.5 text-[14px]",
  );
}

export function navItemStyles({ selected = false } = {}) {
  return selected
    ? "relative text-app-text before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[2px] before:rounded-full before:bg-app-primary"
    : "text-app-secondary hover:text-app-text";
}
```

- [ ] **Step 4: Re-skin shared floating surfaces to consume the new primitives**

Use the new primitive classes inside floating components instead of hand-written warm-card classes:

```tsx
// apps/web/components/shared/modal-shell.tsx
<div className={cn(ui.dialog, "bg-white/72 backdrop-blur-2xl")}>{children}</div>

// apps/web/components/shared/action-dialog.tsx
<div className={cn(ui.panel, "gap-4 p-6")}>
  <header className="grid gap-1">
    <h2 className="font-headline text-[1.35rem] text-app-text">{title}</h2>
    <p className="text-[13px] text-app-secondary">{description}</p>
  </header>
</div>

// apps/web/components/shared/popover.tsx
className={cn(ui.popover, className)}
```

- [ ] **Step 5: Run the shared primitive and floating-surface tests**

Run: `pnpm vitest run apps/web/lib/ui.test.ts apps/web/components/shared/floating-components.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/globals.css apps/web/lib/ui.ts apps/web/lib/ui.test.ts apps/web/components/shared/popover.tsx apps/web/components/shared/modal-shell.tsx apps/web/components/shared/action-dialog.tsx
git commit -m "feat: add editorial design primitives"
```

### Task 2: Upgrade Shared Shells And Workspace Navigation

**Files:**
- Create: `apps/web/components/shared/editorial-page-header.tsx`
- Modify: `apps/web/components/shared/settings-shell.tsx`
- Modify: `apps/web/components/workspaces/workspace-shell-frame.tsx`
- Modify: `apps/web/components/workspaces/workspace-conversation-sidebar-item.tsx`
- Modify: `apps/web/components/workspaces/workspace-user-panel.tsx`
- Modify: `apps/web/components/workspaces/workspaces-header-actions.tsx`
- Modify: `apps/web/lib/workspace-shell.test.ts`
- Create: `apps/web/components/workspaces/workspace-shell-frame.test.tsx`

- [ ] **Step 1: Write the failing shell tests**

Create `apps/web/components/workspaces/workspace-shell-frame.test.tsx`:

```tsx
// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { WorkspaceShellFrame } from "./workspace-shell-frame";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspaces/workspace-1/knowledge-base",
}));

describe("WorkspaceShellFrame", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  test("marks the active workspace section with page semantics", () => {
    act(() => {
      root.render(
        createElement(WorkspaceShellFrame, {
          workspace: { id: "workspace-1", title: "Alpha" },
          workspaces: [{ id: "workspace-1", title: "Alpha" }],
          conversations: [],
          activeView: "knowledge-base",
          currentUser: { username: "fan", isSuperAdmin: true },
          canAccessSystemSettings: true,
          breadcrumbs: [{ label: "空间", href: "/workspaces" }, { label: "Alpha" }],
          children: createElement("div", null, "content"),
        }),
      );
    });

    const currentLink = container.querySelector('a[aria-current="page"]');
    expect(currentLink?.textContent).toContain("资料库");
  });
});
```

Extend `apps/web/lib/workspace-shell.test.ts` with a class-level expectation:

```ts
test("keeps shell scrolling available after the redesign", () => {
  expect(resolveWorkspaceShellContentClass("shell")).toContain("overflow-y-auto");
});
```

- [ ] **Step 2: Run the shell tests to confirm they fail**

Run: `pnpm vitest run apps/web/lib/workspace-shell.test.ts apps/web/components/workspaces/workspace-shell-frame.test.tsx`

Expected: FAIL because `WorkspaceShellFrame` does not emit `aria-current="page"` for the active workspace section yet.

- [ ] **Step 3: Introduce the new shell/header scaffold and active-nav semantics**

Create `apps/web/components/shared/editorial-page-header.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

export function EditorialPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-app-secondary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3">
          <h1 className="font-headline text-[2.6rem] font-extrabold tracking-[-0.05em] text-app-text">
            {title}
          </h1>
          {description ? <p className="max-w-2xl text-[15px] leading-7 text-app-secondary">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
```

Update `apps/web/components/workspaces/workspace-shell-frame.tsx`:

```tsx
<aside className="hidden min-[720px]:flex min-[720px]:h-[100dvh] min-[720px]:bg-app-surface-low">
  <WorkspaceSidebarContent
    workspace={workspace}
    conversations={conversations}
    activeConversationId={activeConversationId}
    activeView={activeView}
    currentUser={currentUser}
    canAccessSystemSettings={canAccessSystemSettings}
  />
</aside>

<header className="sticky top-0 z-20 border-b border-[color:color-mix(in_srgb,var(--outline-variant)_12%,transparent)] bg-white/72 px-0.5 py-3 backdrop-blur-xl">
  <div className="flex min-w-0 items-center justify-between gap-4">
    <div className="min-w-0 flex-1">
      <BreadcrumbTrail
        workspace={workspace}
        workspaces={workspaces}
        conversations={conversations}
        breadcrumbs={breadcrumbs}
        activeView={activeView}
        currentConversation={currentConversation}
      />
    </div>
    {topActions ? <div className="flex shrink-0 items-center gap-2">{topActions}</div> : null}
  </div>
</header>
```

And mark the selected workspace nav link semantically:

```tsx
<Link
  href={`/workspaces/${workspace.id}/knowledge-base`}
  aria-current={activeView === "knowledge-base" ? "page" : undefined}
  className={workspaceNavLink(activeView === "knowledge-base")}
>
  <span>资料库</span>
</Link>
```

- [ ] **Step 4: Re-skin sidebar rows and header actions without changing navigation behavior**

Update the workspace shell leaf components to use the editorial shell:

```tsx
// apps/web/components/workspaces/workspace-conversation-sidebar-item.tsx
className={cn(
  "group relative grid gap-1 rounded-[12px] px-4 py-3 transition",
  active ? "bg-transparent text-app-text before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[2px] before:rounded-full before:bg-app-primary" : "text-app-secondary hover:bg-white/50 hover:text-app-text",
)}

// apps/web/components/workspaces/workspaces-header-actions.tsx
return cn(
  buttonStyles({ variant: "secondary", size: "sm", shape: "pill" }),
  "gap-1.5 border-transparent bg-app-surface-lowest px-2.5 shadow-none hover:bg-app-surface-high",
);
```

- [ ] **Step 5: Run the shell tests again**

Run: `pnpm vitest run apps/web/lib/workspace-shell.test.ts apps/web/components/workspaces/workspace-shell-frame.test.tsx apps/web/lib/workspace-user-panel-component.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/shared/editorial-page-header.tsx apps/web/components/shared/settings-shell.tsx apps/web/components/workspaces/workspace-shell-frame.tsx apps/web/components/workspaces/workspace-conversation-sidebar-item.tsx apps/web/components/workspaces/workspace-user-panel.tsx apps/web/components/workspaces/workspaces-header-actions.tsx apps/web/lib/workspace-shell.test.ts apps/web/components/workspaces/workspace-shell-frame.test.tsx
git commit -m "feat: redesign shared workspace shells"
```

### Task 3: Rebuild Workspace Overview, Chat, Document, And Report Surfaces

**Files:**
- Modify: `apps/web/app/(dashboard)/workspaces/page.tsx`
- Modify: `apps/web/components/chat/workspace-empty-conversation-stage.tsx`
- Modify: `apps/web/components/chat/conversation-page-actions.tsx`
- Modify: `apps/web/components/chat/composer.tsx`
- Modify: `apps/web/components/chat/conversation-session.tsx`
- Modify: `apps/web/lib/conversation-density.ts`
- Modify: `apps/web/lib/conversation-density.test.ts`
- Modify: `apps/web/app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`
- Modify: `apps/web/app/(dashboard)/workspaces/[workspaceId]/reports/[reportId]/page.tsx`

- [ ] **Step 1: Write the failing conversation-density tests**

Extend `apps/web/lib/conversation-density.test.ts`:

```ts
it("uses an editorial glass composer shell instead of the old bordered card", () => {
  expect(conversationDensityClassNames.composerShell).toContain("backdrop-blur-xl");
  expect(conversationDensityClassNames.composerCard).toContain("rounded-[16px]");
  expect(conversationDensityClassNames.composerCard).toContain("bg-white/78");
  expect(conversationDensityClassNames.composerCard).not.toContain("rounded-[20px]");
});

it("keeps answer surfaces border-light and typography-led", () => {
  expect(conversationDensityClassNames.answerText).toContain("leading-7");
  expect(conversationDensityClassNames.timelineEntryCard).not.toContain("shadow-soft");
});
```

- [ ] **Step 2: Run the conversation-density tests to confirm they fail**

Run: `pnpm vitest run apps/web/lib/conversation-density.test.ts`

Expected: FAIL because the current density contract still returns the old rounded 20px composer card and the old border-first surfaces.

- [ ] **Step 3: Update the shared chat density contract and chat surfaces**

Update `apps/web/lib/conversation-density.ts`:

```ts
export const conversationDensityClassNames = {
  sessionStack: "min-w-0 gap-6",
  answerText: "text-[14px] leading-7 text-app-text",
  timelineEntryCard: "rounded-[14px] bg-app-surface-lowest/70 px-4 py-3",
  composerShell:
    "sticky bottom-0 z-10 bg-linear-to-t from-app-bg via-app-bg/92 to-transparent px-0 pb-1 pt-8 backdrop-blur-xl",
  composerCard:
    "rounded-[16px] border border-[color:color-mix(in_srgb,var(--outline-variant)_14%,transparent)] bg-white/78 px-4 py-3 shadow-[0_28px_60px_rgba(25,28,30,0.06)] backdrop-blur-xl",
};
```

Then apply it in the chat components:

```tsx
// apps/web/components/chat/workspace-empty-conversation-stage.tsx
<EditorialPageHeader
  eyebrow="Workspaces"
  title={workspaceTitle}
  description="围绕一个主题组织资料、问答和结论。"
/>

// apps/web/components/chat/conversation-page-actions.tsx
<div className="rounded-full bg-app-surface-low px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-app-secondary">
  {messageCount} 条消息
</div>
```

- [ ] **Step 4: Re-skin the workspace overview, document reader, and report page without changing data flow**

Update the page shells:

```tsx
// apps/web/app/(dashboard)/workspaces/page.tsx
<div className={cn(ui.page, "gap-8")}>
  <EditorialPageHeader
    eyebrow="Workspaces"
    title="工作空间"
    description="围绕项目、客户或研究主题组织资料与对话。"
    actions={
      <WorkspacesHeaderActions
        initialUser={{
          name: session?.user?.name,
          username,
        }}
        canAccessSystemSettings={canAccessSystemSettings}
      />
    }
  />
</div>

// apps/web/app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx
<div className={cn(ui.page, "gap-6")}>
  <div className={cn(ui.panelLarge, "grid gap-6")}>
    <div className="grid gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-secondary">Document</p>
      <h1 className="font-headline text-[2rem] font-extrabold tracking-[-0.04em] text-app-text">{doc.title}</h1>
    </div>
    {contentBlocks}
    {detailsPanels}
  </div>
</div>

// apps/web/app/(dashboard)/workspaces/[workspaceId]/reports/[reportId]/page.tsx
<section className={cn(ui.panelLarge, "grid gap-5")}>
  <div className={ui.toolbar}>
    <div className="grid gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-secondary">Report</p>
      <h1 className="font-headline text-[2rem] font-extrabold tracking-[-0.04em] text-app-text">{report[0].title}</h1>
    </div>
    <Link href={`/api/reports/${reportId}/export-docx`} className={buttonStyles({ variant: "secondary" })}>
      导出 DOCX
    </Link>
  </div>
</section>
```

Do not change any data queries, event handlers, or document/report actions.

- [ ] **Step 5: Run the chat tests**

Run: `pnpm vitest run apps/web/lib/conversation-density.test.ts apps/web/components/chat/conversation-session.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/(dashboard)/workspaces/page.tsx apps/web/components/chat/workspace-empty-conversation-stage.tsx apps/web/components/chat/conversation-page-actions.tsx apps/web/components/chat/composer.tsx apps/web/components/chat/conversation-session.tsx apps/web/lib/conversation-density.ts apps/web/lib/conversation-density.test.ts apps/web/app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx apps/web/app/(dashboard)/workspaces/[workspaceId]/reports/[reportId]/page.tsx
git commit -m "feat: redesign workspace overview and reading surfaces"
```

### Task 4: Rebuild Knowledge Base And Workspace Settings Surfaces

**Files:**
- Create: `apps/web/components/workspaces/knowledge-base-explorer.test.tsx`
- Modify: `apps/web/app/(dashboard)/workspaces/[workspaceId]/knowledge-base/page.tsx`
- Modify: `apps/web/components/workspaces/knowledge-base-explorer.tsx`
- Modify: `apps/web/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`
- Modify: `apps/web/components/workspaces/workspace-settings-form.tsx`
- Modify: `apps/web/components/workspaces/workspace-library-subscriptions.tsx`
- Modify: `apps/web/components/workspaces/workspace-lifecycle-panel.tsx`

- [ ] **Step 1: Write the failing knowledge-base shell test**

Create `apps/web/components/workspaces/knowledge-base-explorer.test.tsx`:

```tsx
// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KnowledgeBaseExplorer } from "./knowledge-base-explorer";

describe("KnowledgeBaseExplorer", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  test("renders the read-only notice and back link for mounted libraries", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          documentsEndpoint: "/api/knowledge-libraries/library-1/documents",
          editable: false,
          canManageTasks: false,
          mountedLibraries: [],
          readOnlyNotice: "已挂载只读 · 设计系统库",
          scopeLabel: "订阅资料库",
          backLink: { href: "/workspaces/workspace-1/knowledge-base", label: "返回我的资料" },
        }),
      );
    });

    expect(container.textContent).toContain("已挂载只读 · 设计系统库");
    expect(container.querySelector('a[href="/workspaces/workspace-1/knowledge-base"]')?.textContent).toContain("返回我的资料");
  });
});
```

- [ ] **Step 2: Run the knowledge-base explorer test to confirm it fails**

Run: `pnpm vitest run apps/web/components/workspaces/knowledge-base-explorer.test.tsx`

Expected: FAIL because the component currently depends on the existing old shell structure and does not yet expose the redesigned hero/toolbar structure cleanly for this test.

- [ ] **Step 3: Apply the editorial shell to the knowledge-base page and explorer**

Update the page wrapper:

```tsx
// apps/web/app/(dashboard)/workspaces/[workspaceId]/knowledge-base/page.tsx
<KnowledgeBaseExplorer
  initialCurrentPath={explorer.currentDirectory.path}
  currentDirectoryId={explorer.currentDirectory.id}
  directories={explorer.directories}
  documents={explorer.documents}
  documentHrefBase={`/workspaces/${workspaceId}/documents`}
  scopeLabel={isViewingSubscribedGlobalLibrary ? "订阅资料库" : "我的资料"}
/>
```

Update the explorer itself:

```tsx
<div className="grid gap-8">
  <EditorialPageHeader
    eyebrow="Library"
    title="资料库"
    description="组织研究资料、技术文档和上传内容，供检索与引用使用。"
  />

  <section className="grid gap-4 rounded-[16px] bg-app-surface-low px-4 py-4">
    <div className={ui.toolbar}>
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonStyles({ size: "sm" })}>上传资料</button>
        <button className={buttonStyles({ variant: "secondary", size: "sm" })}>新建目录</button>
      </div>
      <label className="w-full sm:w-[320px]">
        <span className="sr-only">搜索资料</span>
        <input className={inputStyles({ size: "compact" })} type="search" placeholder="搜索目录、文件名或类型" />
      </label>
    </div>
    <div className="rounded-[16px] bg-app-surface-lowest px-4 py-4">
      <div className="overflow-hidden rounded-[16px] bg-app-surface-lowest">
        <table className="w-full border-collapse text-left">
          <thead className="bg-app-surface-low/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-app-secondary">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                documentHrefBase={documentHrefBase}
                editable={editable}
                onOpenDirectory={syncPath}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
</div>
```

Use whitespace and tonal surfaces for rows; do not change upload, DnD, move, delete, or task polling code paths.

- [ ] **Step 4: Re-skin workspace settings surfaces without changing form actions**

Apply the new page hero and section style:

```tsx
// apps/web/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx
<EditorialPageHeader
  eyebrow="Space"
  title="空间设置"
  description="调整空间名称、资料订阅和生命周期设置。"
  actions={
    <div className="flex items-center gap-2">
      <span className={ui.chip}> {workspace.workspacePrompt ? "已设预置提示词" : "无预置提示词"} </span>
      <span className={ui.chip}>{libraryCatalog.length} 个可见资料库</span>
    </div>
  }
/>
```

Update `WorkspaceSettingsForm` rows to the new integrated setting-row style:

```tsx
<label className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
  <div className="grid content-start gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-secondary">Space Name</span>
    <span className="text-[14px] font-semibold text-app-text">空间名称</span>
  </div>
  <input className={ui.input} value={title} onChange={(event) => setTitle(event.target.value)} />
</label>
```

- [ ] **Step 5: Run the targeted tests**

Run: `pnpm vitest run apps/web/components/workspaces/knowledge-base-explorer.test.tsx apps/web/lib/ui.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/workspaces/knowledge-base-explorer.test.tsx apps/web/app/(dashboard)/workspaces/[workspaceId]/knowledge-base/page.tsx apps/web/components/workspaces/knowledge-base-explorer.tsx apps/web/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx apps/web/components/workspaces/workspace-settings-form.tsx apps/web/components/workspaces/workspace-library-subscriptions.tsx apps/web/components/workspaces/workspace-lifecycle-panel.tsx
git commit -m "feat: redesign knowledge base and workspace settings"
```

### Task 5: Rebuild Management-Family Shells And Pages

**Files:**
- Create: `apps/web/components/shared/settings-shell.test.tsx`
- Modify: `apps/web/components/shared/settings-shell.tsx`
- Modify: `apps/web/components/settings/system-management-sidebar.tsx`
- Modify: `apps/web/components/settings/system-settings-form.tsx`
- Modify: `apps/web/components/settings/global-library-create-form.tsx`
- Modify: `apps/web/components/settings/global-library-metadata-form.tsx`
- Modify: `apps/web/components/settings/model-profiles-admin.tsx`
- Modify: `apps/web/components/settings/system-runtime-overview-panel.tsx`
- Modify: `apps/web/components/account/account-settings-workbench.tsx`
- Modify: `apps/web/app/(dashboard)/settings/libraries/page.tsx`
- Modify: `apps/web/app/(dashboard)/settings/libraries/[libraryId]/page.tsx`

- [ ] **Step 1: Write the failing management-shell test**

Create `apps/web/components/shared/settings-shell.test.tsx`:

```tsx
// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { SettingsShell } from "./settings-shell";

describe("SettingsShell", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  test("keeps the management shell as a true two-column frame on desktop", () => {
    act(() => {
      root.render(
        createElement(SettingsShell, {
          sidebar: createElement("div", null, "sidebar"),
          children: createElement("div", null, "content"),
        }),
      );
    });

    expect(container.textContent).toContain("sidebar");
    expect(container.textContent).toContain("content");
    expect(container.innerHTML).toContain("xl:grid-cols-[264px_minmax(0,1fr)]");
  });
});
```

- [ ] **Step 2: Run the management-shell test to confirm it fails**

Run: `pnpm vitest run apps/web/components/shared/settings-shell.test.tsx`

Expected: FAIL because the current shell still uses the old `252px` warm-sidebar layout and does not emit the new frame class.

- [ ] **Step 3: Upgrade `SettingsShell` and the system-management sidebar to the editorial frame**

Update `apps/web/components/shared/settings-shell.tsx`:

```tsx
<div className="grid min-h-screen w-full grid-cols-1 xl:grid-cols-[264px_minmax(0,1fr)]">
  <aside className="bg-app-surface-low xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto">
    {sidebar}
  </aside>
  <main className={cn("min-w-0 bg-app-bg px-6 py-8 md:px-8 md:py-10", mainClassName)}>
    {children}
  </main>
</div>
```

Update `SystemManagementSidebar` to use the new nav language:

```tsx
<nav className="grid gap-1" aria-label="系统管理导航">
  {navItems.map((item) => (
    <Link
      key={item.id}
      href={item.href}
      aria-current={item.selected ? "page" : undefined}
      className={cn("relative rounded-[12px] px-4 py-3 text-[13px] transition", navItemStyles({ selected: item.selected }))}
    >
      {item.label}
    </Link>
  ))}
</nav>
```

- [ ] **Step 4: Sweep the settings/admin/account pages onto the new shared shell**

Apply `EditorialPageHeader` and lighter section surfaces to the management-family pages:

```tsx
// apps/web/components/settings/system-settings-form.tsx
<EditorialPageHeader
  eyebrow="Runtime"
  title="运行时参数"
  description="维护 provider、检索、基础设施与运行时开关。"
  actions={<button className={buttonStyles({ size: "sm" })}>保存系统参数</button>}
/>

// apps/web/components/settings/model-profiles-admin.tsx
<section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
  <aside className="rounded-[16px] bg-app-surface-low px-4 py-4">
    <div className="grid gap-3">
      {items.map((profile) => (
        <button
          key={profile.id}
          type="button"
          className={cn(
            "grid gap-1.5 rounded-[14px] px-3.5 py-3 text-left transition",
            profile.id === selectedId
              ? "bg-app-surface-lowest text-app-text"
              : "bg-transparent text-app-secondary hover:bg-white/60 hover:text-app-text",
          )}
          onClick={() => handleSelectProfile(profile.id)}
        >
          <strong className="truncate text-[13px] font-semibold">
            {formatEnabledModelProfileLabel(profile)}
          </strong>
          <span className="truncate text-[12px]">
            {describeModelProfileApiType(profile.apiType)}
          </span>
        </button>
      ))}
    </div>
  </aside>
  <div className="rounded-[16px] bg-app-surface-lowest px-5 py-5">
    <div className="grid gap-4">
      <h2 className="font-headline text-[1.5rem] font-bold tracking-[-0.03em] text-app-text">
        {selectedProfile ? "编辑模型" : "新建模型"}
      </h2>
      <div className="grid gap-4">
        <label className={ui.label}>
          显示名称
          <input
            className={ui.input}
            value={draft.displayName}
            onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
          />
        </label>
        <label className={ui.label}>
          模型名
          <input
            className={ui.input}
            value={draft.modelName}
            onChange={(event) => setDraft((current) => ({ ...current, modelName: event.target.value }))}
          />
        </label>
      </div>
    </div>
  </div>
</section>

// apps/web/components/account/account-settings-workbench.tsx
<EditorialPageHeader eyebrow="Account" title="个人设置" />
```

Keep the existing forms, list queries, and admin actions exactly as they are; this task is only about shell and presentation.

- [ ] **Step 5: Run the management-shell tests**

Run: `pnpm vitest run apps/web/components/shared/settings-shell.test.tsx apps/web/lib/ui.test.ts apps/web/lib/system-management.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/shared/settings-shell.test.tsx apps/web/components/shared/settings-shell.tsx apps/web/components/settings/system-management-sidebar.tsx apps/web/components/settings/system-settings-form.tsx apps/web/components/settings/global-library-create-form.tsx apps/web/components/settings/global-library-metadata-form.tsx apps/web/components/settings/model-profiles-admin.tsx apps/web/components/settings/system-runtime-overview-panel.tsx apps/web/components/account/account-settings-workbench.tsx apps/web/app/(dashboard)/settings/libraries/page.tsx apps/web/app/(dashboard)/settings/libraries/[libraryId]/page.tsx
git commit -m "feat: redesign management surfaces"
```

### Task 6: Rebuild Auth And Public Share Families

**Files:**
- Create: `apps/web/components/shared/auth-shell.tsx`
- Create: `apps/web/components/shared/public-page-shell.tsx`
- Modify: `apps/web/components/shared/auth-form.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`
- Modify: `apps/web/app/(auth)/register/page.tsx`
- Modify: `apps/web/app/share/[shareToken]/page.tsx`

- [ ] **Step 1: Write the failing auth/share shell tests**

Create `apps/web/components/shared/auth-shell.test.tsx`:

```tsx
// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  test("renders the editorial auth frame with brand and content slots", () => {
    act(() => {
      root.render(createElement(AuthShell, { children: createElement("div", null, "form-slot") }));
    });

    expect(container.textContent).toContain("AnchorDesk");
    expect(container.textContent).toContain("form-slot");
  });
});
```

- [ ] **Step 2: Run the auth-shell test to confirm it fails**

Run: `pnpm vitest run apps/web/components/shared/auth-shell.test.tsx`

Expected: FAIL because `AuthShell` does not exist yet.

- [ ] **Step 3: Create the new auth and public shell components**

Create `apps/web/components/shared/auth-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { AnchorDeskLogo } from "@/components/icons";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-app-bg lg:grid-cols-[minmax(0,1fr)_560px]">
      <section className="hidden bg-app-surface-low px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-app-primary text-app-primary-contrast">
            <AnchorDeskLogo className="size-[18px]" />
          </span>
          <div className="grid gap-1">
            <strong className="font-headline text-[18px] text-app-text">AnchorDesk</strong>
            <span className="text-[11px] uppercase tracking-[0.18em] text-app-secondary">Personal Knowledge</span>
          </div>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="font-headline text-[3rem] font-extrabold tracking-[-0.05em] text-app-text">登录你的知识工作台</h1>
        </div>
      </section>
      <section className="grid place-items-center px-6 py-10">{children}</section>
    </main>
  );
}
```

Create `apps/web/components/shared/public-page-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { AnchorDeskLogo } from "@/components/icons";

export function PublicPageShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <header className="sticky top-0 z-10 border-b border-[color:color-mix(in_srgb,var(--outline-variant)_12%,transparent)] bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] items-center gap-3 px-6 py-3">
          <span className="grid size-8 place-items-center rounded-[10px] bg-app-primary text-app-primary-contrast">
            <AnchorDeskLogo className="size-[14px]" />
          </span>
          <div className="grid gap-0.5">
            <strong className="font-headline text-[14px] text-app-text">AnchorDesk</strong>
            <span className="text-[11px] uppercase tracking-[0.16em] text-app-secondary">{title}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-8 px-6 py-10">{children}</main>
      {footer ? <footer className="border-t border-[color:color-mix(in_srgb,var(--outline-variant)_12%,transparent)] py-4">{footer}</footer> : null}
    </div>
  );
}
```

- [ ] **Step 4: Move the auth pages and share page onto the new shells**

Update the auth pages:

```tsx
// apps/web/app/(auth)/login/page.tsx
return (
  <AuthShell>
    <div className="grid w-full max-w-[420px] gap-4">
      <AuthForm mode="login" registrationEnabled={registrationEnabled} />
      {registrationEnabled ? (
        <p className="text-[13px] text-app-secondary">
          还没有账号？ <Link className="text-app-text underline underline-offset-4" href="/register">去注册</Link>
        </p>
      ) : (
        <p className="text-[13px] text-app-secondary">当前未开放注册</p>
      )}
    </div>
  </AuthShell>
);
```

Update `AuthForm` itself:

```tsx
<form onSubmit={onSubmit} className={cn(ui.panelLarge, "grid gap-4 bg-white/78 backdrop-blur-xl")}>
  <div className="space-y-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-app-secondary">
      {mode === "login" ? "Sign In" : "Register"}
    </p>
    <h1 className="font-headline text-[2rem] font-extrabold tracking-[-0.04em] text-app-text">
      {mode === "login" ? "登录" : "注册"}
    </h1>
  </div>
</form>
```

Update `apps/web/app/share/[shareToken]/page.tsx`:

```tsx
return (
  <PublicPageShell
    title="共享会话"
    footer={
      <p className="mx-auto max-w-[1120px] px-6 text-[11px] text-app-secondary">
        本页面仅供查看；外部网页链接可打开，本地资料引用不提供跳转
      </p>
    }
  >
    <EditorialPageHeader title={sharedConversation.title} />
    <ConversationSession
      conversationId={sharedConversation.conversationId}
      assistantMessageId={activeAssistantMessage?.id ?? null}
      assistantStatus={
        activeAssistantMessage?.role === MESSAGE_ROLE.ASSISTANT
          ? activeAssistantMessage.status
          : null
      }
      initialTimelineMessagesByAssistant={groupAssistantProcessMessages(
        thread.map((message) => ({
          id: message.id,
          role: message.role,
          status: message.status,
          contentMarkdown: message.contentMarkdown,
          createdAt: message.createdAt,
          structuredJson:
            (message.structuredJson as Record<string, unknown> | null | undefined) ?? null,
        })),
      )}
      initialMessages={chatThread.map((message) => ({
        id: message.id,
        role: message.role,
        status: message.status,
        contentMarkdown: message.contentMarkdown,
        structuredJson:
          (message.structuredJson as Record<string, unknown> | null | undefined) ?? null,
      }))}
      initialCitations={citations.map((citation) => ({
        id: citation.id,
        messageId: citation.messageId,
        anchorId: citation.anchorId,
        documentId: citation.documentId,
        label: citation.label,
        quoteText: citation.quoteText,
        sourceScope: citation.sourceScope,
        libraryTitle: citation.libraryTitle,
        sourceUrl: citation.sourceUrl,
        sourceDomain: citation.sourceDomain,
        sourceTitle: citation.sourceTitle,
      }))}
      streamEnabled={false}
      documentLinksEnabled={false}
      readOnly
      emptyStateMessage="当前会话还没有可分享的消息"
    />
  </PublicPageShell>
);
```

- [ ] **Step 5: Run the auth/share tests**

Run: `pnpm vitest run apps/web/components/shared/auth-shell.test.tsx apps/web/components/chat/conversation-session.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/shared/auth-shell.tsx apps/web/components/shared/public-page-shell.tsx apps/web/components/shared/auth-shell.test.tsx apps/web/components/shared/auth-form.tsx apps/web/app/(auth)/login/page.tsx apps/web/app/(auth)/register/page.tsx apps/web/app/share/[shareToken]/page.tsx
git commit -m "feat: redesign auth and share shells"
```

### Task 7: Sync Visual Documentation And Run Full Verification

**Files:**
- Modify: `.impeccable.md`
- Modify: `docs/anchor-desk-nextjs-app-structure.md`
- Modify: `apps/web/lib/ui.test.ts`
- Modify: `apps/web/lib/workspace-shell.test.ts`
- Modify: `apps/web/lib/conversation-density.test.ts`
- Modify: `apps/web/components/shared/floating-components.test.tsx`
- Modify: `apps/web/components/chat/conversation-session.test.tsx`
- Modify: `apps/web/components/workspaces/knowledge-base-explorer.test.tsx`
- Modify: `apps/web/components/shared/settings-shell.test.tsx`
- Modify: `apps/web/components/shared/auth-shell.test.tsx`

- [ ] **Step 1: Update `.impeccable.md` to match the new editorial system**

Replace the old warm-paper rules with the new production rules. The updated document must include:

```md
## 2. 色彩系统

| 语义 | 变量 | 值 |
|------|------|------|
| 页面背景 | `--bg` | `#F7F9FB` |
| 低层表面 | `--surface-low` | `#F2F4F6` |
| 默认表面 | `--surface` | `#ECEEF0` |
| 顶层表面 | `--surface-lowest` | `#FFFFFF` |
| 次级文本 | `--secondary` | `#565E74` |
| AI/引用强调 | `--accent-beige` | `#F0E0CB` |

规则：
- 默认不用实体分割线做区块分隔
- 导航选中使用 anchor line
- 标题使用 headline sans，不再使用 serif heading
```

- [ ] **Step 2: Update the app-structure doc to describe the new shell family**

Add the shared frame components and shell-family rules:

```md
- `apps/web/components/shared/editorial-page-header.tsx`
  - 统一 workspace 与 management family 的页头
- `apps/web/components/shared/auth-shell.tsx`
  - 统一 `/login` 与 `/register` 的认证页框架
- `apps/web/components/shared/public-page-shell.tsx`
  - 统一公开只读页面框架
```

- [ ] **Step 3: Run the targeted frontend tests**

Run: `pnpm vitest run apps/web/lib/ui.test.ts apps/web/lib/workspace-shell.test.ts apps/web/lib/conversation-density.test.ts apps/web/components/shared/floating-components.test.tsx apps/web/components/workspaces/workspace-shell-frame.test.tsx apps/web/components/workspaces/knowledge-base-explorer.test.tsx apps/web/components/shared/settings-shell.test.tsx apps/web/components/shared/auth-shell.test.tsx apps/web/components/chat/conversation-session.test.tsx`

Expected: PASS

- [ ] **Step 4: Run the repository-level quality gates**

Run: `pnpm test:ts`
Expected: PASS

Run: `pnpm build:web`
Expected: PASS

- [ ] **Step 5: Manually smoke-test every page family**

Run the local app and verify:

```bash
pnpm dev
```

Then check:

- `/workspaces`
- `/workspaces/[workspaceId]`
- `/workspaces/[workspaceId]/knowledge-base`
- `/workspaces/[workspaceId]/settings`
- `/workspaces/[workspaceId]/documents/[documentId]`
- `/workspaces/[workspaceId]/reports/[reportId]`
- `/settings`
- `/settings/libraries`
- `/settings/libraries/[libraryId]`
- `/admin/models`
- `/admin/runtime`
- `/account`
- `/login`
- `/register`
- `/share/[shareToken]`

Specific manual assertions:

- 聊天发送、停止、失败重试仍正常
- citation 卡片和分享页只读视图仍正常
- 知识库上传、批量选择、拖拽、只读挂载库仍正常
- 设置和删除类动作仍正常可达
- 移动端 drawer 与桌面端 shell 都正常

- [ ] **Step 6: Commit**

```bash
git add .impeccable.md docs/anchor-desk-nextjs-app-structure.md
git commit -m "docs: sync editorial design system guidance"
```
