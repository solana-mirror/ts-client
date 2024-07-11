module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "prettier", "unused-imports"],
  rules: {
    "prettier/prettier": [
      "warn",
      {
        usePrettierrc: true,
      },
    ],
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": "off",
    "prefer-const": "warn",
    curly: "warn",
    "@typescript-eslint/no-unused-vars": ["error"],
  },
  ignorePatterns: ["node_modules/", "build/", "/.gitignore"], // Add any other patterns you want to ignore
};
