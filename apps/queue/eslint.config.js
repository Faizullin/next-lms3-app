import baseConfig from "@workspace/eslint-config/base.js";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn"
    }
  }
];
