export function resolveComposerHeading(input: {
  title?: string | null;
  description?: string | null;
}) {
  const title = input.title?.trim() ? input.title.trim() : null;
  const description = input.description?.trim() ? input.description.trim() : null;

  if (!title && !description) {
    return null;
  }

  return {
    title,
    description,
  };
}

export function resolveComposerSubmitStatus(agentError?: string | null) {
  if (!agentError?.trim()) {
    return null;
  }

  return `消息已保存，但 Agent 处理失败：${agentError}`;
}
