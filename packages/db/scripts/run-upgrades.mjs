import path from "node:path";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  buildUpgradePlan,
  formatError,
  formatUpgradeList,
  parseUpgradeModeArg,
} from "../../../scripts/lib/upgrade-common.mjs";
import { appUpgrades } from "../../../scripts/upgrades/index.mjs";

const { Client } = pg;
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const UPGRADE_LOCK_NAMESPACE = 324947;
const UPGRADE_LOCK_KEY = 12001;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is not configured");
  }

  return value;
}

async function loadMigrationEntries() {
  const journalPath = path.join(packageRoot, "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(await readFile(journalPath, "utf8"));
  return Array.isArray(journal.entries) ? journal.entries : [];
}

async function detectLegacyBootstrapState(client) {
  const result = await client.query(
    `
      select
        to_regclass('public.users') as users_table_name,
        to_regclass('drizzle.__drizzle_migrations') as migrations_table_name
    `,
  );

  return {
    hasUsersTable: result.rows[0]?.users_table_name === "users",
    hasDrizzleMigrations: Boolean(result.rows[0]?.migrations_table_name),
  };
}

async function assertMigrationBaselineState(client, entries) {
  const state = await detectLegacyBootstrapState(client);

  const hasBaseline = entries.some((entry) => entry?.tag === "0000_baseline");
  if (hasBaseline && state.hasUsersTable && !state.hasDrizzleMigrations) {
    throw new Error(
      "Detected a database created before versioned migrations were introduced. Recreate the local database and rerun upgrades, or baseline it manually before continuing.",
    );
  }
}

async function loadAppliedMigrationTimestamps(client) {
  const migrationsTableResult = await client.query(
    "select to_regclass('drizzle.__drizzle_migrations') as table_name",
  );

  if (!migrationsTableResult.rows[0]?.table_name) {
    return new Set();
  }

  const result = await client.query(
    `
      select created_at as "createdAt"
      from drizzle.__drizzle_migrations
    `,
  );

  return new Set(
    result.rows
      .map((row) => Number(row.createdAt))
      .filter((value) => Number.isFinite(value)),
  );
}

function getPendingSqlMigrations(entries, appliedTimestamps) {
  return entries.filter((entry) => !appliedTimestamps.has(Number(entry.when)));
}

function formatSqlMigrationList(entries) {
  if (entries.length === 0) {
    return "- none";
  }

  return entries.map((entry) => `- ${entry.tag}`).join("\n");
}

function createPendingSqlMigrationError(entries) {
  return new Error(
    `SQL migrations are still pending:\n${formatSqlMigrationList(entries)}\nRun pnpm db:migrate or pnpm app:upgrade before starting runtime services.`,
  );
}

async function runSqlMigrations() {
  await new Promise((resolve, reject) => {
    const child = spawn(pnpmCommand, ["exec", "drizzle-kit", "migrate"], {
      cwd: packageRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`drizzle-kit migrate exited with code ${code ?? "unknown"}`));
    });
  });
}

async function ensureAppUpgradesTable(client) {
  const result = await client.query(
    "select to_regclass('public.app_upgrades') as table_name",
  );

  if (result.rows[0]?.table_name !== "app_upgrades") {
    throw new Error("app_upgrades table is missing after SQL migrations");
  }
}

async function loadAppliedRows(client) {
  const result = await client.query(
    `
      select
        upgrade_key as "upgradeKey",
        status,
        error_message as "errorMessage",
        blocking,
        safe_in_dev_startup as "safeInDevStartup",
        applied_at as "appliedAt"
      from app_upgrades
    `,
  );

  return new Map(result.rows.map((row) => [row.upgradeKey, row]));
}

async function withUpgradeLock(client, fn) {
  await client.query("select pg_advisory_lock($1, $2)", [
    UPGRADE_LOCK_NAMESPACE,
    UPGRADE_LOCK_KEY,
  ]);

  try {
    return await fn();
  } finally {
    await client.query("select pg_advisory_unlock($1, $2)", [
      UPGRADE_LOCK_NAMESPACE,
      UPGRADE_LOCK_KEY,
    ]);
  }
}

async function upsertUpgradeRecord(client, upgrade, values) {
  await client.query(
    `
      insert into app_upgrades (
        upgrade_key,
        description,
        status,
        blocking,
        safe_in_dev_startup,
        error_message,
        metadata_json,
        applied_at,
        updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, now())
      on conflict (upgrade_key) do update set
        description = excluded.description,
        status = excluded.status,
        blocking = excluded.blocking,
        safe_in_dev_startup = excluded.safe_in_dev_startup,
        error_message = excluded.error_message,
        metadata_json = excluded.metadata_json,
        applied_at = excluded.applied_at,
        updated_at = now()
    `,
    [
      upgrade.key,
      upgrade.description,
      values.status,
      upgrade.blocking,
      upgrade.safeInDevStartup,
      values.errorMessage ?? null,
      values.metadata === undefined ? null : JSON.stringify(values.metadata),
      values.appliedAt ?? null,
    ],
  );
}

function createPendingBlockingError(mode, blockingPending) {
  const command = mode === "apply-all" ? "pnpm app:upgrade:all" : "pnpm app:upgrade";
  return new Error(
    `Blocking app upgrades are still pending:\n${formatUpgradeList(
      blockingPending,
    )}\nRun ${command} after reviewing the upgrade impact.`,
  );
}

async function runAppUpgrade(client, upgrade) {
  console.log(`Running app upgrade ${upgrade.key}...`);
  await upsertUpgradeRecord(client, upgrade, {
    status: "running",
    errorMessage: null,
    metadata: null,
    appliedAt: null,
  });

  try {
    const metadata = await upgrade.run({
      client,
      env: process.env,
      packageRoot,
    });

    await upsertUpgradeRecord(client, upgrade, {
      status: "completed",
      errorMessage: null,
      metadata,
      appliedAt: new Date(),
    });
    console.log(`Completed app upgrade ${upgrade.key}.`);
  } catch (error) {
    await upsertUpgradeRecord(client, upgrade, {
      status: "failed",
      errorMessage: formatError(error),
      metadata: null,
      appliedAt: null,
    });
    throw new Error(`App upgrade ${upgrade.key} failed: ${formatError(error)}`);
  }
}

async function main() {
  const mode = parseUpgradeModeArg(process.argv.slice(2), {
    defaultMode: "apply-blocking",
  });
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await withUpgradeLock(client, async () => {
      const migrationEntries = await loadMigrationEntries();
      await assertMigrationBaselineState(client, migrationEntries);

      if (mode === "check") {
        const appliedMigrationTimestamps = await loadAppliedMigrationTimestamps(client);
        const pendingSqlMigrations = getPendingSqlMigrations(
          migrationEntries,
          appliedMigrationTimestamps,
        );

        if (pendingSqlMigrations.length > 0) {
          throw createPendingSqlMigrationError(pendingSqlMigrations);
        }
      } else {
        console.log("Applying SQL migrations...");
        await runSqlMigrations();
      }

      await ensureAppUpgradesTable(client);

      let appliedRowsByKey = await loadAppliedRows(client);
      let plan = buildUpgradePlan(appUpgrades, appliedRowsByKey, mode);

      if (plan.pending.length === 0) {
        console.log("No pending app upgrades.");
        return;
      }

      if (mode !== "check") {
        for (const upgrade of plan.runnable) {
          await runAppUpgrade(client, upgrade);
        }

        appliedRowsByKey = await loadAppliedRows(client);
        plan = buildUpgradePlan(appUpgrades, appliedRowsByKey, mode);
      }

      if (plan.blockingPending.length > 0) {
        throw createPendingBlockingError(mode, plan.blockingPending);
      }

      if (plan.nonBlockingPending.length > 0) {
        console.warn(
          `Non-blocking app upgrades are still pending:\n${formatUpgradeList(
            plan.nonBlockingPending,
          )}\nRun pnpm app:upgrade:all to apply them.`,
        );
      } else {
        console.log("App upgrades are up to date.");
      }
    });
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
