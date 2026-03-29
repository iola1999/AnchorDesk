import { loadDevEnvironment } from "./lib/dev-common.mjs";
import { formatError, runDbUpgradeCommand } from "./lib/upgrade-common.mjs";

async function main() {
  const { env } = await loadDevEnvironment({ createIfMissing: false });
  await runDbUpgradeCommand(["--mode=check"], { env });
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
