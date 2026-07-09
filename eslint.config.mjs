import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Flat config. `eslint-config-next@16` is flat-only and peer-requires eslint >= 9,
 * so the old `.eslintrc.json` could never load (it crashed serializing the config),
 * and `next lint` was removed in Next 16 — meaning nothing was being linted at all.
 */
const config = [
  {
    ignores: [
      "src/generated/**",
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      ".catalog-cache/**",
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      /**
       * React Compiler's rule against synchronous setState in an effect. Our
       * remaining uses are the legitimate "read a browser API after mount"
       * pattern (matchMedia, next-themes hydration flags, embla scroll state) —
       * there is no SSR-safe alternative, and the cost is one extra render, not
       * incorrectness. Kept as a warning so new violations are still visible.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  {
    // Node/CJS entrypoints and build config legitimately use require()/console.
    files: ["server.js", "scripts/**/*.{js,mjs}", "*.config.{js,mjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default config;
