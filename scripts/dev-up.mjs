import {
  ensureDevBucket,
  ensureDevDatabase,
  ensureDevDirectories,
  ensureToolingInstalled,
  formatError,
  getManagedServices,
  logDir,
  loadDevEnvironment,
  stopManagedService,
  verifyInfrastructure,
  startManagedService,
} from "./lib/dev-common.mjs";
import { parseRuntimeEndpoints } from "./lib/dev-env.mjs";

async function main() {
  await ensureDevDirectories();
  await ensureToolingInstalled();

  const { env, envFileName, envFilePath, created } = await loadDevEnvironment();
  const endpoints = parseRuntimeEndpoints(env);

  if (created) {
    console.log(`Created ${envFileName} from .env.example with a generated AUTH_SECRET.`);
  }

  if (envFilePath) {
    console.log(`Using environment file: ${envFileName}`);
  } else {
    console.log("No .env or .env.local found; using shell environment and built-in defaults.");
  }

  await verifyInfrastructure(env);
  await ensureDevDatabase(env);
  await ensureDevBucket(env);

  const services = getManagedServices(env);
  const startedNow = [];

  try {
    for (const service of services) {
      const result = await startManagedService(service, env);
      console.log(
        `${result.started ? "Started" : "Already running"} ${service.name}${result.pid ? ` (pid ${result.pid})` : ""}.`,
      );

      if (result.started) {
        startedNow.push(service.id);
      }
    }
  } catch (error) {
    console.error(formatError(error) || "Failed to start development services.");

    for (const serviceId of startedNow.reverse()) {
      await stopManagedService(serviceId);
    }

    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("Development services are ready:");
  console.log(`- Web app: ${endpoints.app.url}`);
  console.log(`- Agent runtime: ${endpoints.agent.url}`);
  console.log(`- Parser service: ${endpoints.parser.url}`);
  console.log(`- Logs: ${logDir}`);
  console.log("Use pnpm dev:status to inspect processes and pnpm dev:down to stop them.");
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
