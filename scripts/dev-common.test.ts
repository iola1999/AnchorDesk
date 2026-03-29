import { describe, expect, it } from "vitest";

import { getManagedServices } from "./lib/dev-common.mjs";

describe("getManagedServices", () => {
  it("configures the parser service with a stable health-checked command", () => {
    const services = getManagedServices({
      APP_URL: "http://localhost:3000",
      PARSER_SERVICE_URL: "http://localhost:8001",
      AGENT_RUNTIME_URL: "http://localhost:4001",
    });

    const parser = services.find((service) => service.id === "parser");

    expect(parser).toMatchObject({
      id: "parser",
      name: "Parser service",
      host: "localhost",
      port: 8001,
      healthUrl: "http://localhost:8001/health",
    });
    expect(parser?.args).toEqual([
      "-m",
      "uvicorn",
      "main:app",
      "--host",
      "localhost",
      "--port",
      "8001",
    ]);
    expect(parser?.args).not.toContain("--reload");
  });

  it("exposes health endpoints for managed HTTP services", () => {
    const services = getManagedServices({
      APP_URL: "http://localhost:3000",
      PARSER_SERVICE_URL: "http://localhost:8001",
      AGENT_RUNTIME_URL: "http://localhost:4001",
    });

    expect(services.find((service) => service.id === "agent")?.healthUrl)
      .toBe("http://localhost:4001/health");
    expect(services.find((service) => service.id === "web")?.port)
      .toBe(3000);
    expect(services.find((service) => service.id === "worker")?.healthUrl)
      .toBeUndefined();
  });
});
