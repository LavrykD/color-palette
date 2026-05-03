// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = tseslint.config(
  {
    ignores: [
      'eslint.config.js',
      'node_modules/',
      'dist/',
      'playwright-report/',
      'test-results/',
      'allure-results/',
      'playwright/.auth/',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // @ts-ignore -- configs is present at runtime but missing from type declarations
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts', 'src/**/*.ts'],
  },
);
