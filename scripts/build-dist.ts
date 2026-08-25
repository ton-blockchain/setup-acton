import { rm } from "node:fs/promises"
import process from "node:process"
import type { BuildOptions } from "esbuild"
import { build, context } from "esbuild"

const builds: BuildOptions[] = [
  {
    entryPoints: ["src/setup-acton.ts"],
    outfile: "dist/setup/index.cjs",
  },
  {
    entryPoints: ["src/save-cache.ts"],
    outfile: "dist/save-cache/index.cjs",
  },
]

const options: BuildOptions = {
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node24",
}

await rm("dist", { force: true, recursive: true })

if (process.argv.includes("--watch")) {
  const contexts = await Promise.all(builds.map((entry) => context({ ...options, ...entry })))
  await Promise.all(contexts.map((buildContext) => buildContext.watch()))
} else {
  await Promise.all(builds.map((entry) => build({ ...options, ...entry })))
}
