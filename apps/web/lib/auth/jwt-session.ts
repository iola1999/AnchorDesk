import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { registerAuthSession, touchAuthSession } from "./session-registry";

export type SessionJwtUser = {
  id: string;
  name?: string | null;
  username: string;
  isSuperAdmin: boolean;
};

export type AuthSessionJwt = JWT & {
  sessionId?: string;
  isSuperAdmin?: boolean;
};

export type AuthSessionRegistry = {
  registerSession: (input: {
    sessionId: string;
    userId: string;
    maxAgeSeconds: number;
  }) => Promise<void>;
  touchSession: (input: {
    sessionId: string;
    userId: string;
    maxAgeSeconds: number;
  }) => Promise<boolean>;
};

export type SyncAuthSessionTokenInput = {
  token: AuthSessionJwt;
  user?: SessionJwtUser | null;
  trigger?: "signIn" | "signUp" | "update";
  session?: Session | null;
  maxAgeSeconds: number;
  registry?: AuthSessionRegistry;
  generateSessionId?: () => string;
};

const defaultRegistry: AuthSessionRegistry = {
  registerSession: registerAuthSession,
  touchSession: touchAuthSession,
};

export async function syncAuthSessionToken({
  token,
  user,
  trigger,
  session,
  maxAgeSeconds,
  registry = defaultRegistry,
  generateSessionId = () => crypto.randomUUID(),
}: SyncAuthSessionTokenInput) {
  if (user) {
    token.sub = user.id;
    token.name = user.name;
    token.username = user.username;
    token.isSuperAdmin = user.isSuperAdmin;
  }

  if (trigger === "update" && typeof session?.user?.name === "string") {
    token.name = session.user.name;
  }

  if (typeof token.sub !== "string" || token.sub.length === 0) {
    return null;
  }

  const userId = token.sub;
  const sessionId =
    typeof token.sessionId === "string" && token.sessionId.length > 0
      ? token.sessionId
      : typeof token.jti === "string" && token.jti.length > 0
        ? token.jti
        : generateSessionId();
  const needsRegistration =
    typeof token.sessionId !== "string" || token.sessionId.length === 0;

  token.sessionId = sessionId;
  if (needsRegistration) {
    await registry.registerSession({
      sessionId,
      userId,
      maxAgeSeconds,
    });
    return token;
  }

  const isActive = await registry.touchSession({
    sessionId,
    userId,
    maxAgeSeconds,
  });

  if (!isActive) {
    return null;
  }

  return token;
}
