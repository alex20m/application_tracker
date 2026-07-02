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
  ]),
  // Playwright fixtures use a `use` callback param that trips the React Hooks rule.
  {
    files: ["tests/e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Browser-extension scripts (MV3, plain JS with chrome APIs and a shared
  // JobInfo global loaded via manifest content_scripts ordering).
  {
    files: ["extension/**/*.js"],
    languageOptions: {
      globals: {
        chrome: "readonly",
        JobInfo: "readonly",
        module: "writable",
      },
    },
  },
]);

export default eslintConfig;
