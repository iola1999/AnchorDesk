# 全站 UI 密度收缩设计

日期：2026-04-06
状态：待实现

## 1. 背景

当前 Web UI 已经有较完整的暖中性色体系、共享按钮/输入框/面板原语，以及工作台式布局骨架。但从实际代码分布看，视觉密度仍然偏松：

- 共享原语默认尺寸仍偏大，尤其是页面外边距、panel padding、表单控件高度、按钮高度和圆角
- 会话页已经单独抽出了 `conversation-density.ts`，但其他页面仍有大量局部写死的 `text-[15px]`、`p-4/p-5/p-6`、`rounded-[24px]/[28px]`
- sidebar、modal、popover、settings shell、knowledge-base、runtime overview、document reader 的局部收缩策略还没有统一

本轮目标不是重做布局，也不是引入新组件层级，而是在现有结构上把全站整体收紧一档，让界面更小一号、更克制、更精致。

## 2. 目标与边界

### 2.1 目标

- 全站统一提升信息密度，视觉上收缩约一档
- 保持当前布局结构、页面骨架、交互流程和功能不变
- 让控件、面板、列表、表格、弹层和输入区在不牺牲可读性的前提下更精致
- 优先复用现有共享原语，减少页面级散写尺寸

### 2.2 明确不做

- 不改页面信息架构
- 不改 grid/column 结构和主要区域顺序
- 不增删功能
- 不新增复杂动画
- 不调整产品配色方向，不偏离 `.impeccable.md`

## 3. 现状评估

### 3.1 已有优势

- `apps/web/lib/ui.ts` 已集中定义按钮、输入框、panel、popover、menu、chip 等共享样式入口
- `apps/web/lib/conversation-density.ts` 已把聊天主链路的大部分密度控制单独抽离
- `apps/web/lib/workspace-shell.ts` 和 `apps/web/components/shared/settings-shell.tsx` 已承担主要页面壳层

### 3.2 当前主要问题

#### A. 共享默认尺寸偏松

- `ui.page` / `ui.pageNarrow` 使用 `gap-6 px-6 py-8 md:px-8`
- `ui.panel` / `ui.panelLarge` 使用 `rounded-[28px] p-6/p-8`
- `inputStyles()` 和 `selectStyles()` 默认高度仍为 `h-12`
- `buttonStyles()` 默认 `md` 为 `min-h-11 px-4 text-sm`

这导致页面外边距、块级容器和表单整体显得偏大。

#### B. 页面级有大量散落硬编码

以下区域直接写死了大量尺寸类，无法只靠改 `ui.ts` 全量收口：

- `apps/web/components/workspaces/knowledge-base-explorer.tsx`
- `apps/web/components/settings/system-runtime-overview-panel.tsx`
- `apps/web/components/documents/pdf-viewer.tsx`
- `apps/web/components/workspaces/workspace-shell-frame.tsx`
- `apps/web/components/workspaces/workspace-conversation-sidebar-item.tsx`
- `apps/web/app/(dashboard)/workspaces/page.tsx`
- `apps/web/app/share/[shareToken]/page.tsx`

#### C. 会话链路已有单独密度体系，但还可以再收一档

`apps/web/lib/conversation-density.ts` 已经比其他页面更克制，但消息气泡、timeline、sources、composer 仍有继续轻缩空间。

## 4. 可选方案

### 方案 A：只改共享 token

优点：

- 改动面最集中
- 风险最小

缺点：

- 只能覆盖走共享原语的页面
- knowledge-base、document、runtime overview、sidebar 等局部尺寸仍会漂

### 方案 B：逐页手工压缩

优点：

- 每页都能调得很细

缺点：

- 容易产生新的不一致
- 后续维护成本高

### 方案 C：共享 token 收缩 + 页面例外回收

优点：

- 能保持全站一致性
- 也能覆盖当前代码里已经存在的局部散写尺寸
- 最符合仓库“共享原语优先、页面只做接线”的约束

缺点：

- 需要分两层推进，而不是只改一个文件

### 结论

采用方案 C。

## 5. 设计决策

## 5.1 收缩原则

- 只收缩尺寸，不改布局关系
- 收缩幅度控制在“一档”，避免从舒展直接变拥挤
- 优先收缩 padding、控件高度、字级和圆角，再收缩阴影和视觉重量
- 保持标题层级、阅读区正文和交互可点面积的基本可用性

## 5.2 全局收缩基线

本轮建议的默认收缩方向：

- 页面外边距：`px-6/8 py-8/10` 收到 `px-4/5/6 py-5/6/8`
- panel padding：`p-6/p-8` 收到 `p-5/p-6`
- section/subpanel：`p-5/p-6` 收到 `p-4/p-5`
- 控件高度：`h-12` 收到 `h-11`；`h-10` 收到 `h-9` 或 `h-[38px]`
- 按钮：`md` 从 `min-h-11` 收到 `min-h-10`，`sm` 更接近当前 `xs`
- 圆角：页面级 panel 从 `28px` 收到 `24px`，tile/subpanel 从 `24px` 收到 `20px`~`22px`
- 标题和元数据：`text-[15px]` 向 `text-[14px]` 靠拢，`text-sm` 向 `text-[13px]` 靠拢
- 阴影：保留同一风格，但降低扩散半径和厚重感

## 5.3 不变项

以下结构保持不变：

- workspace shell 的两栏结构与 `258px` sidebar 宽度
- settings shell 的 sidebar + main 结构
- workspaces 首页的卡片网格结构
- 对话页的 composer、timeline、answer、sources 顺序
- 文档页的 reader + inspector 架构
- share 页的 sticky header + content 结构

## 5.4 主要改造层次

### 层 1：共享原语

统一调整：

- `apps/web/lib/ui.ts`
- `apps/web/app/globals.css`
- `apps/web/lib/workspace-shell.ts`
- `apps/web/components/shared/settings-shell.tsx`

目的：

- 让大部分按钮、输入框、面板、页面壳层先整体小一号

### 层 2：共享复合组件

统一调整：

- `apps/web/components/shared/modal-shell.tsx`
- `apps/web/components/shared/action-dialog.tsx`
- `apps/web/components/shared/auth-form.tsx`
- `apps/web/components/workspaces/workspaces-header-actions.tsx`
- `apps/web/components/workspaces/workspace-user-menu-content.tsx`

目的：

- 让弹层、对话框、用户菜单、认证入口的观感同步变细

### 层 3：页面级特例回收

重点调整：

- workspace shell header / sidebar / list row
- conversation density
- knowledge-base explorer
- system runtime overview
- model admin / settings forms
- document reader / details
- workspaces 首页卡片
- share 页

目的：

- 回收局部写死的尺寸，避免“半个站点变紧、半个站点仍偏大”

## 6. 分页面验收口径

### 工作空间与导航

- sidebar 不换结构，但 item 更紧，标题和时间字级下降半档
- header action、breadcrumb、用户菜单更轻薄

### 对话页

- 用户气泡、assistant 区、source card、timeline、composer 全部更紧
- 正文可读性不下降，不把回答正文压成列表感

### 资料库

- 表格行高、toolbar、只读挂载卡片、上传弹窗统一缩尺
- 拖拽、批量操作和状态反馈可读性保持

### 设置/管理页

- form、metric card、section panel 更紧凑
- sticky toolbar 和筛选控制更轻薄

### 文档与分享

- reader 周边控制区、metadata block、share header 收紧
- 文本阅读区域不做激进缩字

## 7. 风险

- 如果只缩字不缩 line-height，页面会显得尖锐而不是精致
- 如果只缩控件不缩壳层，页面整体密度提升不明显
- 如果聊天正文缩得过头，会伤害问答阅读体验
- 如果 modal / popover / sidebar 不同步收缩，会产生明显风格断层

## 8. 验证方式

- 以视觉一致性为主，不以单页“更小”作为唯一标准
- 至少人工回归以下页面：
  - `/workspaces`
  - `/workspaces/[workspaceId]`
  - `/workspaces/[workspaceId]/knowledge-base`
  - `/workspaces/[workspaceId]/documents/[documentId]`
  - `/workspaces/[workspaceId]/settings`
  - `/settings`
  - `/admin/models`
  - `/admin/runtime`
  - `/share/[shareToken]`
  - `/login`
  - `/register`

若上述页面在同一视觉尺度下都显得更紧、更轻、更一致，就说明这轮收缩达标。
