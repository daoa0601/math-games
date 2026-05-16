import fs from 'node:fs'
import path from 'node:path'

const name = process.argv[2]
if (!name) {
  console.error('Usage: pnpm create:game <name>')
  console.error('  <name> should be PascalCase, e.g. PatternDetective')
  process.exit(1)
}

const pascal = name.charAt(0).toUpperCase() + name.slice(1)
const kebab = pascal
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .toLowerCase()
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1)

const gamesDir = path.resolve(import.meta.dirname, '..', 'src', 'games', pascal)
const routeFile = path.resolve(import.meta.dirname, '..', 'src', 'routes', 'games', `${kebab}.tsx`)
const registryFile = path.resolve(import.meta.dirname, '..', 'src', 'games', 'registry.ts')

if (fs.existsSync(gamesDir)) {
  console.error(`Directory already exists: src/games/${pascal}/`)
  process.exit(1)
}

fs.mkdirSync(gamesDir, { recursive: true })
fs.mkdirSync(path.join(gamesDir, '__tests__'), { recursive: true })

// translations.ts
fs.writeFileSync(
  path.join(gamesDir, 'translations.ts'),
  `export const ${camel}Translations = {
  en: {
    'gameTitle.${camel}': '${pascal}',
    'gameDescription.${camel}': 'TODO: add description.',
  },
  vi: {
    'gameTitle.${camel}': '${pascal}',
    'gameDescription.${camel}': 'TODO: thêm mô tả.',
  },
} as const
`,
)

// catalog
fs.writeFileSync(
  path.join(gamesDir, `${kebab}.catalog.ts`),
  `export interface ${pascal}Config {
  id: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const catalog: readonly ${pascal}Config[] = [
  { id: '${kebab}-easy-1', difficulty: 'easy' },
]

export const difficulties = ['easy', 'medium', 'hard'] as const
`,
)

// schema
fs.writeFileSync(
  path.join(gamesDir, `${kebab}.schema.ts`),
  `import { Schema } from 'effect'

export const ${pascal}CompletionSchema = Schema.Struct({
  selectedAnswer: Schema.Number,
})

export type ${pascal}Completion = typeof ${pascal}CompletionSchema.Type
`,
)

// logic
fs.writeFileSync(
  path.join(gamesDir, 'logic.ts'),
  `import type { ${pascal}Config } from './${kebab}.catalog'
import type { ${pascal}Completion } from './${kebab}.schema'

export function validate(
  _level: ${pascal}Config,
  _completion: ${pascal}Completion,
): { completed: boolean; moves: number } {
  // TODO: implement validation
  return { completed: false, moves: 1 }
}
`,
)

// module.ts
fs.writeFileSync(
  path.join(gamesDir, 'module.ts'),
  `import { Effect, Schema } from 'effect'

import type {
  Achievement,
  AchievementContext,
  DailyChallengePick,
  GameModule,
  ScoreContext,
} from '@/games/game-module'
import { GameProgressValidationError } from '@/services/errors'

import { catalog, difficulties } from './${kebab}.catalog'
import type { ${pascal}Config } from './${kebab}.catalog'
import { ${pascal}CompletionSchema } from './${kebab}.schema'
import { ${camel}Translations } from './translations'
import { validate } from './logic'

const achievements: readonly Achievement[] = [
  {
    id: '${kebab.replace(/-/g, '_')}_first',
    category: '${kebab}',
    name: 'First ${pascal}',
    description: 'Complete a ${pascal} puzzle.',
    rarity: 'common',
  },
]

function getCatalog() {
  return {
    config: catalog[0],
    configs: [...catalog],
    initialConfigId: catalog[0].id,
  }
}

function getDailyPick(hash: number): DailyChallengePick {
  const level = catalog[hash % catalog.length]
  return { levelId: level.id, title: level.id, difficulty: level.difficulty }
}

function resolveLevelConfig(levelId: string): ${pascal}Config | null {
  return catalog.find((c) => c.id === levelId) ?? null
}

function computeScore(ctx: ScoreContext) {
  return ctx.completed ? 100 : 0
}

function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  const newly: string[] = []
  if (ctx.completed && !unlocked.has('${kebab.replace(/-/g, '_')}_first')) {
    newly.push('${kebab.replace(/-/g, '_')}_first')
  }
  return newly
}

export const ${camel}Module = {
  id: '${kebab}',
  route: '/games/${kebab}',
  title: '${pascal}',
  description: 'TODO: add description.',
  difficulties,
  achievements,
  translations: ${camel}Translations,
  levelCount: catalog.length,
  getCatalog,
  getDailyPick,
  computeScore,
  evaluateAchievements,
  resolveLevelConfig,
  validateGameState: (level: ${pascal}Config, raw: unknown) => {
    const parsed = Schema.decodeUnknownOption(${pascal}CompletionSchema)(raw)
    if (parsed._tag === 'None') return null
    return validate(level, parsed.value)
  },
  validateAndComputeScore: (levelId: string, raw: unknown) =>
    Effect.gen(function* () {
      const level = resolveLevelConfig(levelId)
      if (!level)
        return yield* new GameProgressValidationError({
          reason: \`Unknown level: \${levelId}\`,
        })

      const parsed = yield* Effect.try({
        try: () => Schema.decodeUnknownSync(${pascal}CompletionSchema)(raw),
        catch: () =>
          new GameProgressValidationError({
            reason: 'Invalid completion payload',
          }),
      })

      const result = validate(level, parsed)
      return {
        completed: result.completed,
        moves: result.moves,
        score: result.completed ? 100 : 0,
        difficulty: level.difficulty,
      }
    }),
} as const satisfies GameModule<${pascal}Config>
`,
)

// server functions
fs.writeFileSync(
  path.join(gamesDir, `${kebab}.functions.ts`),
  `import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'

import { GameProgressRequest } from '@/games/game-progress.schema'
import {
  createGetCatalogHandler,
  createRecordProgressPipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services'

import { ${camel}Module } from './module'

export const get${pascal}Catalog = createServerFn({ method: 'GET' }).handler(
  createGetCatalogHandler(${camel}Module),
)

export const record${pascal}Progress = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(GameProgressRequest))
  .handler(({ data }) =>
    runServerEffect(createRecordProgressPipeline(${camel}Module, data)),
  )
`,
)

// basic test
fs.writeFileSync(
  path.join(gamesDir, '__tests__', 'logic.test.ts'),
  `import { describe, expect, test } from 'vitest'
import { validate } from '../logic'

describe('${pascal} validation', () => {
  test('placeholder', () => {
    const result = validate(
      { id: 'test', difficulty: 'easy' },
      { selectedAnswer: 42 },
    )
    expect(result).toHaveProperty('completed')
    expect(result).toHaveProperty('moves')
  })
})
`,
)

// route placeholder
fs.writeFileSync(
  routeFile,
  `import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/games/${kebab}')({
  component: ${pascal}Page,
})

function ${pascal}Page() {
  return (
    <div>
      <h1>${pascal}</h1>
      <p>TODO: implement game UI</p>
    </div>
  )
}
`,
)

// Append import to registry.ts
const registryContent = fs.readFileSync(registryFile, 'utf-8')
const importLine = `import { ${camel}Module } from './${pascal}/module'`
const updatedRegistry = registryContent
  .replace(
    /(import .* from '.\/\w+\/module'\n)(?!import)/,
    `$1${importLine}\n`,
  )
  .replace(
    /(\] as const)/,
    `  ${camel}Module,\n$1`,
  )
fs.writeFileSync(registryFile, updatedRegistry)

console.log(`
Created game scaffolding for "${pascal}":

  src/games/${pascal}/
    module.ts
    logic.ts
    ${kebab}.catalog.ts
    ${kebab}.schema.ts
    ${kebab}.functions.ts
    translations.ts
    __tests__/logic.test.ts

  src/routes/games/${kebab}.tsx

  Updated: src/games/registry.ts (import + GAME_MODULES entry)

Checklist:
  [ ] Implement game logic in logic.ts
  [ ] Add level catalog entries in ${kebab}.catalog.ts
  [ ] Build the route UI in src/routes/games/${kebab}.tsx
  [ ] Add navigation link in src/routes/index.tsx
  [ ] Add Vietnamese translations
  [ ] Run pnpm check
`)
