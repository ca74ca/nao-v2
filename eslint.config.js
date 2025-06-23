// eslint.config.js
import js from "@eslint/js";
import ts from "typescript-eslint";
import next from "@next/eslint-plugin-next";

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  {
    plugins: {
      "@next/next": next,
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];
