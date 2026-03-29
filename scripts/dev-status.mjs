import {
  formatError,
  getManagedServiceStatus,
  getManagedServices,
  isPortOpen,
  loadDevEnvironment,
  loadResolvedSystemEnvironment,
} from "./lib/dev-common.mjs";
import { parseInfrastructureTargets } from "./lib/dev-env.mjs";

async function main() {
  const { env, envFileName } = await loadDevEnvironment({ createIfMissing: false });
  const runtimeEnv = await loadResolvedSystemEnvironment(env);

  console.log(`Environment source: ${envFileName ?? "shell variables + built-in defaults"}`);
  console.log("");
  console.log("Infrastructure:");

  try {
    for (const target of parseInfrastructureTargets(runtimeEnv)) {
      const ok = await isPortOpen(target.host, target.port);
      console.log(
        `- ${target.name}: ${ok ? "reachable" : "missing"} (${target.host}:${target.port})`,
      );
    }
  } catch (error) {
    console.log(
      `- Unable to resolve infrastructure targets: ${formatError(error)}`,
    );
  }

  console.log("");
  console.log("Managed services:");

  for (const service of getManagedServices(runtimeEnv)) {
    const status = await getManagedServiceStatus(service);
    console.log(`- ${service.name}: ${status.detail}`);
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
