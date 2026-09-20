// ESLint flat config — docs/CODING_STANDARDS.md §1 and the layer rules in docs/ARCHITECTURE.md §1.
//
// Layers (imports only flow downward):  app → features → server → vendors
//   components/ui, lib, hooks  are leaves: they never import app/features/server.
//   server never imports React (except `cache`) or Next UI modules.
//   Vendor SDKs live only behind server/* adapters.

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Vendor SDKs that may only be imported from server/* adapters (GUARDRAILS C3). */
const VENDOR_SDKS = [
  "firebase-admin",
  "firebase-admin/*",
  "ai",
  "@ai-sdk/*",
  "@upstash/*",
  "@aws-sdk/*",
  "resend",
  "@sentry/nextjs",
  "posthog-node",
];

const restricted = (patterns, message) => ({
  "no-restricted-imports": [
    "error",
    { patterns: patterns.map((group) => ({ group: [group], message })) },
  ],
});

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },

  // Next.js core-web-vitals (native flat config since v16) registers: @next/next, react,
  // react-hooks, import, jsx-a11y, and @typescript-eslint.
  ...nextCoreWebVitals,

  // TypeScript: strict + type-aware.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },

  // Repo-wide rules.
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
          pathGroups: [
            { pattern: "@/config/**", group: "internal", position: "before" },
            { pattern: "@/server/**", group: "internal", position: "before" },
            { pattern: "@/features/**", group: "internal", position: "before" },
            { pattern: "@/components/**", group: "internal", position: "after" },
            { pattern: "@/{lib,hooks}/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "jsx-a11y/no-autofocus": "off",
      // process.env is read only in config/env.ts (GUARDRAILS B4); the override below re-enables it there.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Read environment variables through `env` from config/env.ts, not process.env.",
        },
      ],
      // Vendor SDKs are forbidden everywhere by default; server/* adapters opt back in below.
      ...restricted(
        VENDOR_SDKS,
        "Vendor SDKs are imported only from server/* adapters (GUARDRAILS C3).",
      ),
    },
  },

  // server/: no React, no Next UI modules, vendor SDKs allowed.
  {
    files: ["server/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              allowImportNames: ["cache"],
              message: "server/ never imports React (only `cache` is allowed).",
            },
          ],
          patterns: [
            {
              group: ["react-dom", "next/link", "next/image", "next/navigation"],
              message: "server/ has no UI.",
            },
            {
              group: ["@/app/*", "@/features/*", "@/components/*", "@/hooks/*"],
              message: "server/ imports only downward.",
            },
          ],
        },
      ],
    },
  },

  // features/: no app imports, no vendor SDKs (inherited), no other feature's internals.
  {
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...VENDOR_SDKS.map((group) => ({
              group: [group],
              message: "Vendor SDKs are imported only from server/* adapters (GUARDRAILS C3).",
            })),
            { group: ["@/app/*"], message: "features/ never import app/." },
          ],
        },
      ],
    },
  },

  // Leaves: components/ui, lib, hooks import nothing from app/features/server.
  {
    files: ["components/ui/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...VENDOR_SDKS.map((group) => ({
              group: [group],
              message: "Vendor SDKs are imported only from server/* adapters (GUARDRAILS C3).",
            })),
            {
              group: ["@/app/*", "@/features/*", "@/server/*"],
              message: "Leaf modules import nothing from app/features/server.",
            },
          ],
        },
      ],
    },
  },

  // The single app module allowed to touch process.env, plus tooling configs (test runners read
  // CI variables; they are not application code and never see secrets).
  {
    files: ["config/env.ts", "*.config.{ts,mts}"],
    rules: { "no-restricted-syntax": "off" },
  },

  // LEGACY allowances — each is deleted by the PR named. Do not add new entries.
  {
    files: [
      "firebase/admin.ts", // → server/db/firestore.ts in P2.2
      "lib/actions/**/*.ts", // → server/* + features/*/actions.ts in P2.4
      "app/api/**/*.ts", // routes removed/rewritten in P1.4, P4.6
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  // Tests and scripts: relaxed unsafe-* rules for fixtures; vendor SDKs allowed; they run outside
  // the app with explicit environment (emulator hosts, CI variables), so process.env is permitted.
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "scripts/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },

  // Plain JS/MJS (configs, scripts): no type-aware rules. Must stay last so it overrides the above.
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
);
