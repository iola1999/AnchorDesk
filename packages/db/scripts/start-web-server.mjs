import { pathToFileURL } from "node:url";

import { applyDatabaseRuntimeSettings } from "./runtime-settings-bootstrap.mjs";

/**
 * @typedef {(options?: unknown) => Promise<unknown>} ApplySettingsFn
 */

/**
 * @typedef {(moduleUrl: string) => Promise<unknown>} ImportModuleFn
 */

export function resolveWebServerModuleUrl(metaUrl = import.meta.url) {
  return new URL("../../../apps/web/server.js", metaUrl).href;
}

export function applyWebRuntimeEnvDefaults(env = process.env) {
  const appUrl = env.APP_URL?.trim();
  if (!appUrl) {
    return env;
  }

  env.AUTH_URL ??= appUrl;
  env.NEXTAUTH_URL ??= appUrl;

  return env;
}

/**
 * @param {{
 *   applySettings?: ApplySettingsFn,
  *   importModule?: ImportModuleFn,
  *   metaUrl?: string,
 * }} [options]
 */
export async function startWebServer({
  applySettings = applyDatabaseRuntimeSettings,
  importModule = (moduleUrl) => import(moduleUrl),
  metaUrl = import.meta.url,
} = {}) {
  await applySettings();
  applyWebRuntimeEnvDefaults();
  return importModule(resolveWebServerModuleUrl(metaUrl));
}

export function isStartWebServerEntrypoint(
  metaUrl = import.meta.url,
  argvPath = process.argv[1],
) {
  return typeof argvPath === "string" && pathToFileURL(argvPath).href === metaUrl;
}

if (isStartWebServerEntrypoint()) {
  await startWebServer();
}
