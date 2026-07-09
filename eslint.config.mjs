import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled bundles extracted from the standalone HTML pages — generated
    // artifacts, not source code.
    "extracted_designs/**",
    "extract.js",
    // One-off local test/maintenance scripts and the mock DB working dir.
    "scratch/**",
  ]),
  {
    rules: {
      // Legacy pages set state synchronously in mount effects (hydration /
      // i18n init). Restructuring them is out of scope for CI; keep visible
      // as a warning without failing the build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
