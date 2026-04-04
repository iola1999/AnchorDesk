import { describe, expect, it, vi } from "vitest";

import {
  applyWebRuntimeEnvDefaults,
  resolveWebServerModuleUrl,
  startWebServer,
} from "../packages/db/scripts/start-web-server.mjs";

describe("start web server bootstrap", () => {
  it("resolves the standalone web server entry from the db script location", () => {
    expect(
      resolveWebServerModuleUrl("file:///app/packages/db/scripts/start-web-server.mjs"),
    ).toBe("file:///app/apps/web/server.js");
  });

  it("loads runtime settings before importing the standalone server entry", async () => {
    const steps: string[] = [];
    const applySettings = vi.fn(async () => {
      steps.push("settings");
    });
    const importModule = vi.fn(async (moduleUrl: string) => {
      steps.push(`import:${moduleUrl}`);
      return {};
    });

    await startWebServer({
      applySettings,
      importModule,
      metaUrl: "file:///app/packages/db/scripts/start-web-server.mjs",
    });

    expect(steps).toEqual(["settings", "import:file:///app/apps/web/server.js"]);
  });

  it("maps APP_URL into Auth.js URL env vars when they are unset", () => {
    const env: Record<string, string | undefined> = {
      APP_URL: "https://anchordesk.678234.xyz",
    };

    applyWebRuntimeEnvDefaults(env);

    expect(env.AUTH_URL).toBe("https://anchordesk.678234.xyz");
    expect(env.NEXTAUTH_URL).toBe("https://anchordesk.678234.xyz");
  });

  it("does not overwrite explicit Auth.js URL env vars", () => {
    const env: Record<string, string | undefined> = {
      APP_URL: "https://anchordesk.678234.xyz",
      AUTH_URL: "https://auth.example.com",
      NEXTAUTH_URL: "https://nextauth.example.com",
    };

    applyWebRuntimeEnvDefaults(env);

    expect(env.AUTH_URL).toBe("https://auth.example.com");
    expect(env.NEXTAUTH_URL).toBe("https://nextauth.example.com");
  });
});
