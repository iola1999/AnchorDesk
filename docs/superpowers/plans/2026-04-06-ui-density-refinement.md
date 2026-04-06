# UI Density Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the entire web app slightly denser and more refined without changing layout structure, behavior, or page architecture.

**Architecture:** Tighten shared UI primitives first so most surfaces shrink consistently, then sweep page-specific hardcoded sizes in workspace shell, chat, knowledge-base, document, settings, and share surfaces. Keep the existing routing, component boundaries, and layout grids intact.

**Tech Stack:** Next.js App Router, Tailwind CSS utility classes, shared UI helpers in `apps/web/lib/ui.ts`, Vitest

---

### Task 1: Tighten Global UI Primitives

**Files:**
- Modify: `apps/web/lib/ui.ts`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/lib/ui.test.ts`

- [ ] Reduce default page padding, shared panel padding, section panel padding, button height, input/select height, and default text sizes by one step
- [ ] Slightly reduce panel/tile/dialog shadow weight and large-corner radius so surfaces feel lighter instead of merely smaller
- [ ] Update `ui` helper tests to lock the new shared size contract

### Task 2: Tighten Shell-Level Spacing Without Changing Layout

**Files:**
- Modify: `apps/web/lib/workspace-shell.ts`
- Modify: `apps/web/components/shared/settings-shell.tsx`
- Modify: `apps/web/components/workspaces/workspace-shell-frame.tsx`
- Modify: `apps/web/components/workspaces/workspace-conversation-sidebar-item.tsx`

- [ ] Reduce shell padding, sidebar internal spacing, breadcrumb/header spacing, and sidebar row chrome while keeping the same two-column and drawer structure
- [ ] Keep sidebar width, content max-width, and main layout regions unchanged
- [ ] Verify navigation rows, timestamps, and action affordances still read clearly at the smaller scale

### Task 3: Tighten Shared Floating Surfaces And Entry Forms

**Files:**
- Modify: `apps/web/components/shared/modal-shell.tsx`
- Modify: `apps/web/components/shared/action-dialog.tsx`
- Modify: `apps/web/components/shared/auth-form.tsx`
- Modify: `apps/web/components/workspaces/workspaces-header-actions.tsx`
- Modify: `apps/web/components/workspaces/workspace-user-menu-content.tsx`
- Modify: `apps/web/components/shared/popover.tsx`

- [ ] Reduce header/body padding, title sizes, icon button size, and menu row density for dialog, popover, and account/admin menus
- [ ] Keep current modal widths and popover placements so layout behavior does not shift
- [ ] Make login/register and lightweight forms visually align with the new compact scale

### Task 4: Tighten Conversation Surfaces

**Files:**
- Modify: `apps/web/lib/conversation-density.ts`
- Modify: `apps/web/lib/conversation-density.test.ts`
- Modify: `apps/web/components/chat/composer.tsx`
- Modify: `apps/web/components/chat/conversation-session.tsx`
- Modify: `apps/web/components/chat/conversation-page-actions.tsx`
- Modify: `apps/web/components/chat/workspace-empty-conversation-stage.tsx`

- [ ] Reduce bubble padding, source-card padding, timeline row spacing, composer chrome, and empty-state hero scale without changing message ordering or composer behavior
- [ ] Keep answer body readable; compact metadata and controls more aggressively than long-form answer text
- [ ] Update conversation density tests to reflect the smaller contract

### Task 5: Tighten Knowledge Base And Document Surfaces

**Files:**
- Modify: `apps/web/components/workspaces/knowledge-base-explorer.tsx`
- Modify: `apps/web/components/documents/pdf-viewer.tsx`
- Modify: `apps/web/app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`
- Modify: `apps/web/components/documents/document-metadata-form.tsx`
- Modify: `apps/web/components/documents/document-job-panel.tsx`

- [ ] Reduce toolbar control heights, breadcrumb field chrome, mounted-library cards, table row padding, upload modal density, and document side panels
- [ ] Keep current table structure, DnD behavior, PDF reader layout, and document inspector arrangement unchanged
- [ ] Regress upload, selection, DnD, and document-read actions to ensure the smaller chrome does not break interaction targets

### Task 6: Tighten Settings, Admin, Workspace Index, And Share Pages

**Files:**
- Modify: `apps/web/components/settings/system-runtime-overview-panel.tsx`
- Modify: `apps/web/components/settings/system-settings-form.tsx`
- Modify: `apps/web/components/settings/model-profiles-admin.tsx`
- Modify: `apps/web/components/settings/global-library-create-form.tsx`
- Modify: `apps/web/components/settings/global-library-metadata-form.tsx`
- Modify: `apps/web/app/(dashboard)/workspaces/page.tsx`
- Modify: `apps/web/app/share/[shareToken]/page.tsx`

- [ ] Reduce metric card padding, grid gaps, table/form spacing, workspace tile chrome, and share-page shell spacing by one density step
- [ ] Keep page composition, section ordering, and responsive breakpoints intact
- [ ] Manually verify that settings/admin pages still feel high-density but not cramped

### Task 7: Verification

**Files:**
- Modify as needed: touched tests and snapshots only if required by the UI changes

- [ ] Run targeted Vitest coverage for `apps/web/lib/ui.test.ts` and `apps/web/lib/conversation-density.test.ts`
- [ ] Run `pnpm test:ts`
- [ ] Run `pnpm build:web`
- [ ] Manually smoke-check `/workspaces`, workspace chat, knowledge-base, document reader, settings, admin pages, share page, login, and register for spacing regressions
