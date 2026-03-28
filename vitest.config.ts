import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "apps/**/src/**/*.test.ts",
      "apps/**/lib/**/*.test.ts",
      "packages/**/src/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
    restoreMocks: true,
    clearMocks: true,
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "apps/web/lib/**/*.ts",
        "apps/worker/src/**/*.ts",
        "packages/**/src/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/node_modules/**",
        "packages/db/src/**",
        "packages/contracts/src/index.ts",
      ],
    },
  },
});
