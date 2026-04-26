import { fixupPluginRules } from "@eslint/compat"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import _import from "eslint-plugin-import"
import jest from "eslint-plugin-jest"
import globals from "globals"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ["**/coverage", "**/dist", "**/linter", "**/node_modules"],
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
  ),
  {
    plugins: {
      import: fixupPluginRules(_import),
      jest,
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },

      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",

      parserOptions: {
        projectService: {
          allowDefaultProject: ["__tests__/*.ts", "eslint.config.mjs", "jest.config.js", "rollup.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "tsconfig.json",
        },
      },
    },

    rules: {
      camelcase: "off",
      "eslint-comments/no-use": "off",
      "eslint-comments/no-unused-disable": "off",
      "@typescript-eslint/consistent-return": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/return-await": "error",
      "i18n-text/no-en": "off",
      "import/no-namespace": "off",
      "no-console": "off",
      "no-shadow": "off",
      "no-unused-vars": "off",
    },
  },
]
