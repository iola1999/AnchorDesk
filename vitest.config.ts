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
  },
});
