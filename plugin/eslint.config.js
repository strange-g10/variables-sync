import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        figma: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Error: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        isNaN: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        Date: 'readonly',
      },
    },
    rules: {
      // Possible Errors
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-extra-boolean-cast': 'error',
      'no-unreachable': 'error',
      'valid-typeof': 'error',

      // Best Practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-unused-expressions': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',

      // Variables
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-undef': 'off', // Handled by TypeScript

      // Stylistic Issues
      'indent': ['error', 2],
      'quotes': ['error', 'double'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'es5'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
    },
  },
  {
    files: ['webpack.config.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.d.ts',
    ],
  },
];
