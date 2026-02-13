import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

/**
 * Configuración unificada de ESLint para el proyecto
 * Reemplaza .eslintrc.json y .eslintrc.cjs
 */
export default tseslint.config(
  // Ignorar directorios no necesarios
  {
    ignores: ['dist', 'node_modules', 'coverage', '.vercel'],
  },
  // Configuración principal para React
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      prettier,
    },
    rules: {
      // Configuración recomendada de ESLint
      ...js.configs.recommended.rules,
      // Configuración recomendada de React
      ...react.configs.recommended.rules,
      // Configuración recomendada de React Hooks
      ...reactHooks.configs.recommended.rules,
      // Prettier como warning
      'prettier/prettier': 'warn',
      // Reglas específicas
      'react-refresh/only-export-components': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Variables no usadas
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      // Best practices - Warning para no bloquear build
      'no-alert': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Patrones de React
      'react/hook-use-state': 'warn',
      'react/no-array-index-key': 'warn',
      'react/jsx-key': 'error',
      // Accessibility - Warning para no bloquear
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      // React Hooks
      'react-hooks/set-state-in-effect': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Configuración para archivos de API (Node.js)
  {
    files: ['api/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Configuración para scripts
  {
    files: ['scripts/**/*', '*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Configuración para test
  {
    files: ['src/test/**/*', '**/*.test.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        beforeAll: 'readonly',
        afterAll: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
      },
    },
  },
);
