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
    // Agent tooling. Gitignored but not previously eslint-ignored, so a bare
    // `eslint` run reported 151 warnings from vendored third-party scripts that
    // are not ours to fix and drown out real findings.
    ".gemini/**",
    ".agents/**",
    ".claude/**",
    ".clerk/**",
    ".vercel/**",
  ]),
]);

export default eslintConfig;
