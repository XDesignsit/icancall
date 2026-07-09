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
      // Every occurrence is an intentional mount-time sync: reading the saved
      // language from localStorage (guarded so SSR renders the default and the
      // client reconciles after hydration) or mirroring a prop into local
      // edit state. A lazy useState initializer can't touch localStorage
      // during SSR without a hydration mismatch, so the effect is the correct
      // pattern here. Disabled deliberately rather than silenced per-line.
      "react-hooks/set-state-in-effect": "off",
      // The app uses plain <img> for marketing art, avatars, and external CDN
      // logos where next/image's required dimensions and remote-domain config
      // add friction without a meaningful LCP win. Deliberate opt-out.
      "@next/next/no-img-element": "off",
      // Honor a leading underscore for intentionally-unused args/vars/catch
      // bindings (e.g. positional route-handler params).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
