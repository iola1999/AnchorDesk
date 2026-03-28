# 实施跟踪

版本：v0.2  
日期：2026-03-28

> 本文件是项目的执行跟踪文档。
>
> - 当前阶段进度、活跃待办和下一步顺序，以本文件为准。
> - 产品目标以 [knowledge-assistant-prd.md](/Users/fan/project/tmp/law-doc/docs/knowledge-assistant-prd.md) 为准。
> - 架构与实现约束以 [knowledge-assistant-technical-design-nodejs.md](/Users/fan/project/tmp/law-doc/docs/knowledge-assistant-technical-design-nodejs.md) 为准。

## 1. 当前阶段

当前阶段：`P0 Web / BFF 主链路拉通`

阶段目标：

- 先把“注册登录 -> 工作空间 -> 上传资料 -> 查看处理状态 -> 创建对话 -> 阅读文档 -> 回访报告”做顺。
- 在此基础上补 parser、retrieval、grounded answer、SSE 等可信回答底座。

当前结论：

- 传统主链路已经具备基础可用性。
- 资料管理 CRUD 已补齐基础版。
- 第一版口径是“助手优先、问答优先”；报告保留 Agent 生成与导出，不做平台内编辑器。
- 会话管理、文档阅读器和上传任务反馈都已有基础版。
- 本地开发一键启动脚本已补齐。
- 系统级 provider / infra 配置开始从 env 收敛到数据库 `system_settings`。
- 当前最缺的不是更多 agent 花样，而是 parser / retrieval / grounded answer / SSE 这些可信回答底座能力。
- 产品整体已切换为通用知识库助手定位，但保留 `search_statutes` 专项工具。

## 2. 最近完成

- `working tree` 去法律化重定位
  - 产品定位改成通用知识库助手
  - 保留 `search_statutes` 专项工具
  - package scope、默认 bucket、默认 collection 与 MCP namespace 改为通用命名
  - 文档类型 taxonomy 改成通用分类
- `working tree` Move system config into database-backed settings
- `working tree` Redesign workspace shell around assistant-first flow
- `working tree` Migrate web styling to Tailwind design system
- `working tree` Add Docker infra commands and dev guide
- `working tree` Add local development startup scripts
- `working tree` Add PDF viewer and upload job feedback
- `working tree` Finish workspace conversation management
- `working tree` Implement document management CRUD
- `f0e431a` Prioritize DashScope retrieval providers
- `70aa665` Add parser OCR fallback and grounded answer validation

## 3. 活跃待办

- parser 真实 OCR provider 接入，默认仍保持关闭。
- sparse/BM25 混合检索与 rerank 回归测试。
- SSE 工具时间线和 grounded answer 状态信息前端补齐。
- 产品去法律化后的回归清理与文案收口。

## 4. 下一步

默认按以下顺序推进：

1. 完成去法律化改造的剩余测试与文案清理
2. parser 真实 OCR provider 接入
3. sparse/BM25 混合检索
4. Agent evidence dossier
5. SSE 工具时间线

## 5. 风险与注意事项

- 当前改造默认允许破坏性重置，不保留旧数据兼容层。
- 本地一键启动脚本只代管应用进程；基础设施默认通过 `pnpm infra:up` 拉起。
- `AUTH_SECRET` 不进入 `system_settings`。
- `/settings` 保存的是数据库配置，不会热更新到已运行进程。
- OCR 不要默认开启。
- PDF 阅读器当前仍是基础版，没有 bbox 级高亮。
