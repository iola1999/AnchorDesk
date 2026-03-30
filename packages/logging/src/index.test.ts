import { describe, expect, test } from "vitest";

import {
  LOG_LEVEL,
  buildLoggerOptions,
  createServiceLogger,
  isProductionEnvironment,
  isTestEnvironment,
  normalizePrettyTransportTarget,
  parseLogLevel,
  resolvePrettyTransportTarget,
  resolveLogLevel,
  serializeErrorForLog,
  shouldPrettyPrintLogs,
} from "./index";

describe("parseLogLevel", () => {
  test("accepts normalized pino levels", () => {
    expect(parseLogLevel(" warn ")).toBe(LOG_LEVEL.WARN);
    expect(parseLogLevel("DEBUG")).toBe(LOG_LEVEL.DEBUG);
  });

  test("returns null for unsupported values", () => {
    expect(parseLogLevel("verbose")).toBeNull();
    expect(parseLogLevel("")).toBeNull();
  });
});

describe("environment helpers", () => {
  test("detects production and test environments", () => {
    expect(isProductionEnvironment({ NODE_ENV: "production" })).toBe(true);
    expect(isTestEnvironment({ NODE_ENV: "test" })).toBe(true);
    expect(isProductionEnvironment({ NODE_ENV: "development" })).toBe(false);
  });

  test("only pretty prints outside production and test", () => {
    expect(shouldPrettyPrintLogs({ NODE_ENV: "development" })).toBe(true);
    expect(shouldPrettyPrintLogs({ NODE_ENV: "production" })).toBe(false);
    expect(shouldPrettyPrintLogs({ NODE_ENV: "test" })).toBe(false);
  });
});

describe("resolveLogLevel", () => {
  test("prefers an explicit LOG_LEVEL", () => {
    expect(resolveLogLevel({ NODE_ENV: "production", LOG_LEVEL: "error" })).toBe(
      LOG_LEVEL.ERROR,
    );
  });

  test("defaults to debug in development, info in production, and silent in test", () => {
    expect(resolveLogLevel({ NODE_ENV: "development" })).toBe(LOG_LEVEL.DEBUG);
    expect(resolveLogLevel({ NODE_ENV: "production" })).toBe(LOG_LEVEL.INFO);
    expect(resolveLogLevel({ NODE_ENV: "test" })).toBe(LOG_LEVEL.SILENT);
  });
});

describe("buildLoggerOptions", () => {
  test("adds a resolved pretty transport outside production", () => {
    const options = buildLoggerOptions({
      service: "web",
      env: { NODE_ENV: "development" },
    });

    expect(options).toMatchObject({
      level: LOG_LEVEL.DEBUG,
      base: {
        service: "web",
        environment: "development",
      },
    });
    expect(options.transport).toMatchObject({
      target: resolvePrettyTransportTarget(),
    });
  });

  test("keeps production output as plain json stdout", () => {
    const options = buildLoggerOptions({
      service: "worker",
      env: { NODE_ENV: "production" },
    });

    expect(options.level).toBe(LOG_LEVEL.INFO);
    expect(options.base).toMatchObject({
      service: "worker",
      environment: "production",
    });
    expect(options.transport).toBeUndefined();
  });

  test("skips pretty transport when the target is a bundler external marker", () => {
    expect(
      normalizePrettyTransportTarget(
        "[externals]/pino-pretty [external] (pino-pretty, cjs, [project]/node_modules/pino-pretty)",
      ),
    ).toBeNull();
  });
});

describe("createServiceLogger", () => {
  test("can initialize a development logger with the pretty transport", () => {
    expect(() =>
      createServiceLogger({
        service: "web",
        env: { NODE_ENV: "development" },
      }),
    ).not.toThrow();
  });
});

describe("serializeErrorForLog", () => {
  test("keeps name, message, code, cause, and stack for Error objects", () => {
    const error = new Error("outer");
    (error as Error & { code?: string; cause?: Error }).code = "E_AUTH";
    (error as Error & { code?: string; cause?: Error }).cause = new Error("inner");

    expect(serializeErrorForLog(error)).toMatchObject({
      name: "Error",
      message: "outer",
      code: "E_AUTH",
      cause: "inner",
      stack: expect.any(String),
    });
  });
});
