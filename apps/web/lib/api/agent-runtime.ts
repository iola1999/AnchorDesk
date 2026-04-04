export async function requestAgentResponse(input: {
  prompt: string;
  workspaceId: string;
  conversationId: string;
  agentSessionId?: string | null;
  agentWorkdir?: string | null;
}) {
  const baseUrl = process.env.AGENT_RUNTIME_URL;
  if (!baseUrl) {
    return {
      ok: true,
      text: "Agent runtime is not configured. Message saved, but no automated answer was generated.",
      citations: [] as Array<{
        anchor_id: string;
        label: string;
        quote_text: string;
      }>,
      sessionId: input.agentSessionId ?? null,
      workdir: input.agentWorkdir ?? null,
    };
  }

  const response = await fetch(`${baseUrl}/respond`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agent runtime failed: ${text}`);
  }

  return (await response.json()) as {
    ok: boolean;
    text: string;
    sessionId?: string | null;
    workdir?: string | null;
    citations?: Array<{
      anchor_id: string;
      label: string;
      quote_text: string;
    }>;
  };
}

export async function requestAgentRuntimeCancel(input: {
  assistantMessageId: string;
  runId: string;
  reason: string;
}) {
  const baseUrl = process.env.AGENT_RUNTIME_URL;
  if (!baseUrl) {
    return {
      ok: false as const,
      cancelled: false,
    };
  }

  const response = await fetch(`${baseUrl}/runs/cancel`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agent runtime cancellation failed: ${text}`);
  }

  return (await response.json()) as {
    ok: boolean;
    cancelled: boolean;
  };
}
