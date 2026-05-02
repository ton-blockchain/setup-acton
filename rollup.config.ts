import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import nodeResolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

const buildConfig = (input, output) => ({
  input,
  output: {
    file: output,
    format: "es",
  },
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs(), json()],
})

export default [
  buildConfig("src/setup-acton.ts", "dist/setup/index.js"),
  buildConfig("src/save-cache.ts", "dist/save-cache/index.js"),
]
