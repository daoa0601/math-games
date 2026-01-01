// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Module Boundary Rules - Prevent cross-game imports
  // ═══════════════════════════════════════════════════════════════════
  {
    files: ['src/games/MagicGraph/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/games/SequenceRace/**', '@/games/SequenceRace/**'],
              message: 'MagicGraph cannot import from SequenceRace. Use shared/ instead.',
            },
            {
              group: ['**/games/ShapeArchitect/**', '@/games/ShapeArchitect/**'],
              message: 'MagicGraph cannot import from ShapeArchitect. Use shared/ instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/SequenceRace/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/games/MagicGraph/**', '@/games/MagicGraph/**'],
              message: 'SequenceRace cannot import from MagicGraph. Use shared/ instead.',
            },
            {
              group: ['**/games/ShapeArchitect/**', '@/games/ShapeArchitect/**'],
              message: 'SequenceRace cannot import from ShapeArchitect. Use shared/ instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/ShapeArchitect/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/games/MagicGraph/**', '@/games/MagicGraph/**'],
              message: 'ShapeArchitect cannot import from MagicGraph. Use shared/ instead.',
            },
            {
              group: ['**/games/SequenceRace/**', '@/games/SequenceRace/**'],
              message: 'ShapeArchitect cannot import from SequenceRace. Use shared/ instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/games/**', '@/games/**'],
              message: 'Shared modules cannot import from games. Move shared code to shared/.',
            },
          ],
        },
      ],
    },
  },
])
