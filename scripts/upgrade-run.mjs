import { loadDevEnvironment } from "./lib/dev-common.mjs";
import {
  formatError,
  getUpgradeModes,
  parseUpgradeModeArg,
  runDbUpgradeCommand,
} from "./lib/upgrade-common.mjs";

async function main() {
  const mode = parseUpgradeModeArg(process.argv.slice(2), {
    defaultMode: "apply-blocking",
    allowedModes: getUpgradeModes().filter((value) => value !== "check"),
  });
  const { env } = await loadDevEnvironment({ createIfMissing: false });
  await runDbUpgradeCommand([`--mode=${mode}`], { env });
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
