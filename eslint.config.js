import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
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
      parser: tseslint.parser,
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
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      // Configuración recomendada de ESLint
      ...js.configs.recommended.rules,
      // Configuración recomendada de React Hooks
      ...reactHooks.configs.recommended.rules,
      // Prettier como warning
      'prettier/prettier': 'warn',
      // Reglas específicas
      'react-refresh/only-export-components': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Variables no usadas
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      // Best practices - Warning para no bloquear build
      'no-alert': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Patrones de React
      // Accessibility - Warning para no bloquear
      // React Hooks
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Ajustes para TypeScript (evitar falsos positivos de reglas base de JS)
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
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
  // Configuración para Supabase Edge Functions (Deno runtime)
  {
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        Deno: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off',
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
