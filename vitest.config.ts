import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    coverage: {
      all: true,
      exclude: ["dist/**", "node_modules/**", "src/download-current-checksums.ts", "src/check-changelog.ts"],
      include: ["src/**"],
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["json-summary", "text", "lcov"],
    },
    environment: "node",
    include: ["**/*.test.ts"],
    passWithNoTests: true,
    reporters: ["default"],
  },
})
