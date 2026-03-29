import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const parts = [];
    if (typeof error.name === "string" && error.name) {
      parts.push(error.name);
    }
    if (typeof error.code === "string" && error.code) {
      parts.push(`(${error.code})`);
    }

    return parts.length > 0 ? parts.join(" ") : JSON.stringify(error);
  }

  return String(error);
}

async function main() {
  await new Promise((resolve, reject) => {
    const child = spawn(
      pnpmCommand,
      ["exec", "node", "scripts/run-upgrades.mjs", "--mode=apply-safe-blocking"],
      {
        cwd: packageRoot,
        env: process.env,
        stdio: "inherit",
      },
    );

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`upgrade runner exited with code ${code ?? "unknown"}`));
    });
  });
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
